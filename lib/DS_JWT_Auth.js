// DS_JWT_Auth.js

/**
 * @file
 * This file implements the <tt>DS_JWT_Auth</tt> class.
 * It handles JWT authentication with DocuSign.
 * It also looks up the user's account and base_url
 * via the <tt><a href="https://developers.docusign.com/esign-rest-api/guides/authentication/user-info-endpoints">userInfo</a></tt> method.
 * @author DocuSign
 */

// JS Prototype-bassed class: see https://javascript.info/class-patterns#prototype-based-classes

'use strict';

const moment = require('moment')
    , path = require('path')
    , _ = require('lodash')
    , {promisify} = require('util') // http://2ality.com/2017/05/util-promisify.html
    , rp = require('request-promise')
    , tmp = require('tmp')
    , fs = require('fs')
    , base_uri_suffix = '/restapi'
    ;
/**
 * Manages JWT authentication with DocuSign.
 * @constructor
 * @param {DS_API} ds_api - Instance of the DS_API SDK object.
 * @param {DS_Configuration} ds_config - DS_Configuration object from the ds_configuration file.
 * @param {string} app_dir - The root directory for the app.
 */
let DS_JWT_Auth = function _DS_JWT_Auth(ds_api, ds_config, app_dir) {
  // private globals
  this._debug_prefix = 'ds_jwt_auth';
  this._token_replace_min = 10; // The token must expire at least this number of
                               // minutes later or it will be replaced
  this._jwt_life_sec = 3600; // requested lifetime for the token is 1 hour
                           // (the max available from DocuSign)
  this._token = null;        // The bearer token. Get it via #check_token
  this._token_expiration = null;  // when does the token expire?
  this._user = {}; // object with user data from the UserInfo method
  this._account_id = null; // current account
  this._account_name = null; // current account's name
  this._base_uri = null; // eg https://na2.docusign.net
  this._ds_api = null; // the docusign sdk instance
  this._ds_config = null;
  this._app_dir = null;
  this._debug = false;

  // INITIALIZE
  this._ds_api = ds_api;
  this._ds_config = ds_config;
  this._app_dir = app_dir;
} // end of DS_JWT_Auth function

// Public constants
/**
 * Exception when setting an account
 * @constant
*/
DS_JWT_Auth.prototype.Error_set_account = "Error_set_account";
/**
 * Exception: Could not find account information for the user
 * @constant
*/
DS_JWT_Auth.prototype.Error_account_not_found = "Could not find account information for the user";
/**
 * Exception: while getting a JWT token
 * @constant
*/
DS_JWT_Auth.prototype.Error_JWT_get_token = 'Error_JWT_get_token';
/**
 * Exception: Consent is required from the user
 * @constant
*/
DS_JWT_Auth.prototype.Error_consent_required = 'consent_required';
/**
 * Exception when getting a token, "invalid grant"
 * @constant
*/
DS_JWT_Auth.prototype.Error_invalid_grant = 'invalid_grant'; // message when bad client_id is provided

// public functions
/**
 * Clears the toke. Same as logging out
 * @function
 */
DS_JWT_Auth.prototype.clear_token = function(){ // "logout" function
  this._token_expiration = false;
  this._token = false;
};

// Can't use arrow functions since we need access to this

/**
 * Setter for <tt>debug>/tt>
 * @function
 * @param {boolean} debug
 */
DS_JWT_Auth.prototype.set_debug = function(debug){this._debug = debug};
/**
 * Getter for <tt>debug</tt>
 * @function
 * @returns {boolean} debug
 */
DS_JWT_Auth.prototype.get_debug = function(){return this._debug};
/**
 * Getter for the object's <tt>ds_api</tt>
 * @function
 * @returns {DS_API} ds_api
 */
DS_JWT_Auth.prototype.get_ds_api = function(){return this._ds_api};

/**
 * Getter for the <tt>account_id</tt>
 * @function
 * @returns {string} account_id
 */
DS_JWT_Auth.prototype.get_account_id   = function(){return this._account_id};
/**
 * Getter for the <tt>account_name</tt>
 * @function
 * @returns {string} account_name
 */
DS_JWT_Auth.prototype.get_account_name = function(){return this._account_name};
/**
 * Getter for the <tt>base_uri</tt>
 * @function
 * @returns {string} base_uri
*/
DS_JWT_Auth.prototype.get_base_uri     = function(){return this._base_uri};
/**
 * Getter for the <tt>user</tt> object.
 * @function
 * @returns {User} user
 */
DS_JWT_Auth.prototype.get_user         = function(){return this._user};
/**
 * Getter for the <tt>ds_config</tt> object.
 * @function
 * @returns {DS_Configuration} ds_config
 */
DS_JWT_Auth.prototype.get_ds_config    = function(){return this._ds_config};
/**
 * Getter for the <tt>app_dir</tt>.
 * @function
 * @returns {string} app_dir
 */
DS_JWT_Auth.prototype.get_app_dir      = function(){return this._app_dir};

/**
 * Configures to use a specific account_id, account_name, and base_uri
 * @function
 * @param account_id the account_id in guid format
 * @param account_name the account_name
 * @param base_uri the base_uri for the account
 */
DS_JWT_Auth.prototype.set_account =
  function _set_account(account_id, account_name, base_uri){
  this._account_id = account_id;
  this._account_name = account_name;
  this._base_uri = base_uri;

  // Set the base_uri for the SDK
  let base_path = `${base_uri}${base_uri_suffix}`;
  this._ds_api.setBasePath(base_path);

  this._debug_log(`Using account ${this._account_id}: ${this._account_name}`);
}

/**
 * Finds an account_id that will be used
 * SIDE-EFFECTS:
 * - An access token will be checked and obtained / refreshed if needbe;
 * - The user's account information will be looked up via an userInfo API call.
 * @function find_account
 * @private
 * @param {string} target_account_id the desired account. If false, then the
 *        user's default account will be used.
 *        If the account is not false and is not available,
 *        an error will be thrown.
 * @returns {promise} promise result: object {account_id, account_name, base_uri}
 *           with the account information.
 * @promise
 */
DS_JWT_Auth.prototype.find_account = function _find_account(target_account_id){
  //this._debug_log_obj("target_account_id:", target_account_id);
  return (
    this.check_token()
    .then((token_result) => this.call_userInfo(token_result))
    .then((userInfo_result) => this._find_account_internal(
      {userInfo_result: userInfo_result, target_account_id: target_account_id}))
  )
}

/**
 * Calls OAuth::userInfo to look up account info
 * SIDE-EFFECTS:
 * - Sets the ds_js.user object
 * - Sets the ds_js account and base_uri info
 * - Sets the SDK's base url
 * @function _find_account_internal
 * @private
 * @param target_account_id the desired account. If false, then the
 *        user's default account will be used.
 *        If the account is not false and is not available,
 *        an error will be thrown.
 * @returns  a promise
 */
DS_JWT_Auth.prototype._find_account_internal = function(args){
  const {userInfo_result, target_account_id} = args;

  //this._debug_log_obj("user_info:", userInfo_result);
  this._user = userInfo_result; // save for client's use

  let account_info;
  if (target_account_id === false) {
    // find the default account
    account_info = _.find(this._user.accounts, 'is_default');
  } else {
    // find the matching account
    account_info = _.find(this._user.accounts, ['account_id', target_account_id]);
  }
  if (typeof account_info === 'undefined') {
    let err = new Error(this.Error_account_not_found);
    err.name = this.Error_set_account;
    throw err;
  }

  let {account_id, account_name, base_uri} = account_info;
  this.set_account(account_id, account_name, base_uri)
  return Promise.resolve({
    account_id: this._account_id,
    account_name: this._account_name,
    base_uri: this._base_uri})
}

/**
 * Calls OAuth::userInfo to look up user info
 * See the userInfo <a href="https://developers.docusign.com/esign-rest-api/guides/authentication/user-info-endpoints">documentation.</a>
 * <br>Currently, the DocuSign SDK does not include this method. It will in the future.
 * @function
 * @returns {promise} promise with result from the <tt>userInfo</tt> API method
 */
DS_JWT_Auth.prototype.call_userInfo = function(token_result){
  let url = `${this._ds_config.authentication_url}/oauth/userinfo`;
  return (rp.get(url, {
      auth: {bearer: token_result.token},
      json: true
    })
  )
}

/**
 * Returns a promise method, {method_name}_promise, that is a
 * promisfied version of the method parameter.
 * The promise method is created if it doesn't already exist.
 * It is cached via attachment to the parent object.
 * @function
 * @param obj An object that has method method_name
 * @param method_name The string name of the existing method
 * @returns {promise} a promise version of the <tt>method_name</tt>.
 */
DS_JWT_Auth.prototype.make_promise = function _make_promise(obj, method_name){
  let promise_name = method_name + '_promise';
  if (!(promise_name in obj)) {
    obj[promise_name] = promisify(obj[method_name]).bind(obj)
  }
  return obj[promise_name]
}

/**
 * This is the key method for the object.
 * It should be called before any API call to DocuSign.
 * It checks that the existing access token can be used.
 * If the existing token is expired or doesn't exist, then
 * a new token will be obtained from DocuSign by using
 * the JWT flow.
 * <br><b>SIDE EFFECT:</b> Sets the access token that the SDK will use.
 * @function
 * @returns {promise} a promise with result:
 *  <br>{<tt>token_received</tt>: <i>Boolean</i> <b>true</b> if a token was received from DocuSign,
 *  <br><tt>need_token</tt>: <i>Boolean</i> <b>true</b> if a new token was needed,
 *  <br><tt>token</tt>: <i>Bearer Token</i> The bearer token that will be used for the API call,
 *  <br><tt>token_expiration</tt>: <i>Moment</i> When will the token expire.}
 */
DS_JWT_Auth.prototype.check_token = function _check_token() {
  let no_token = !this._token || !this._token_expiration
    , now = moment()
    , need_token = no_token || this._token_expiration.add(
        this._token_replace_min, 'm').isBefore(now)
    , result =
        {token_received: null, need_token: null,
        token: this._token, token_expiration: this._token_expiration}
    ;
  if (this._debug) {
    if (no_token) {this._debug_log('check_token: Starting up--need a token')}
    if (need_token && !no_token) {this._debug_log('check_token: Replacing old token')}
    if (!need_token) {this._debug_log('check_token: Using current token')}
  }

  if (!need_token) {
    result.need_token = false;
    // Ensure that the token is in the *current* DocuSign API object
    this._ds_api.addDefaultHeader('Authorization', 'Bearer ' + this._token);
    return Promise.resolve(result)
  }

  // We need a new token. We will use the DocuSign SDK's function.
  // The current version of the configureJWTAuthorizationFlow method 
  // requires that the private key be stored in a file. A future version of the
  // method will enable the private key to be optionally passed as a value.
  //
  let private_key_file = this._ds_config.private_key_file,
      tmpFileobj = false;
  if (!private_key_file) {
    // The key is being supplied as a value.
    // Store it in a tmp file, then use that file as the private_key_file
    tmpFileobj = tmp.fileSync();
    // this._debug_log(`Temp private key file: ${tmpFileobj.name}`);
    fs.writeFileSync(tmpFileobj.fd, this._ds_config.private_key);
    private_key_file = tmpFileobj.name;
  } else {
    // We were configured with a private key file name
    private_key_file = path.resolve(this._app_dir, private_key_file);
  }

  return (
    this.make_promise(this._ds_api, 'configureJWTAuthorizationFlow')(
      private_key_file, this._ds_config.aud, this._ds_config.client_id,
      this._ds_config.impersonated_user_guid, this._jwt_life_sec)
    .catch (e => {
      e.name = this.Error_JWT_get_token;
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/name
      // if we can pull out an error from the response body, then do so:
      if (tmpFileobj) {tmpFileobj.removeCallback()}
      let err = _.get(e, 'response.body.error', false);
      if (err) {e.message = err}
      throw e;
    })
    .then (result => {
      //this._debug_log_obj('JWT result: ', result);
      // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
      if (tmpFileobj) {tmpFileobj.removeCallback()}
      let expires_in;
      ({access_token: this._token, expires_in} = result.body);
      this._token_expiration = moment().add(expires_in, 's');
      this._debug_log(`check_token: Token received! Expiration: ${this._token_expiration.format()}`);
      return Promise.resolve({token_received: true, need_token: true,
        token: this._token, token_expiration: this._token_expiration})
    })
  )
}

// for testing:
/**
 * For testing: Set how long the JWT lifetinme will be
 * @function
 * @param {integer} jwt_life_sec_arg Lifetime in seconds
 */
DS_JWT_Auth.prototype.test_set_jwt_life_sec =
  function(jwt_life_sec_arg){this._jwt_life_sec = jwt_life_sec_arg};
  /**
   * For testing: Getter for the object's access token
   * @function
   * @returns {string} access_token
   */
DS_JWT_Auth.prototype.test_get_token = function(){return this._token};
/**
 * For testing: Getter for the object's token_expiration
 * @function
 * @returns {string} token_expiration
 */
DS_JWT_Auth.prototype.test_get_token_expiration = function(){return this._token_expiration};
/**
 * For testing: Clears the account user information:
 * the <tt>user</tt>, <tt>account_id</tt>, <tt>account_name</tt>, <tt>base_uri</tt>
 * @function
 */
DS_JWT_Auth.prototype.test_clear_account_user = function(){
  this._user = {};
  this._account_id = null; // current account
  this._account_name = null; // current account's name
  this._base_uri = null; // eg https://na2.docusign.net
}

/**
 * If in debug mode, prints message to the console
 * @function
 * @param {string} m The message to be printed
 * @private
 */
DS_JWT_Auth.prototype._debug_log = function(m){
  if (!this._debug) {return}
  console.log(this._debug_prefix + ': ' + m)
}

/**
 * If in debug mode, prints message and object to the console
 * @function
 * @param {string} m The message to be printed
 * @param {object} obj The object to be pretty-printed
 * @private
 */
DS_JWT_Auth.prototype._debug_log_obj = function (m, obj){
  if (!this._debug) {return}
  console.log(this._debug_prefix + ': ' + m + "\n" + JSON.stringify(obj, null, 4))
}


module.exports = DS_JWT_Auth;  // SET EXPORTS for the module.
