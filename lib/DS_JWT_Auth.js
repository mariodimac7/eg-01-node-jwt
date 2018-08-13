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
    , {promisify} = require('util') // http://2ality.com/2017/05/util-promisify.html
    , rp = require('request-promise')
    , tmp = require('tmp')
    , fs = require('fs')
    , docusign = require('docusign-esign')
    , dsConfig = require('../ds_config.js').config
    , baseUriSuffix = '/restapi'
    ;
/**
 * Manages JWT authentication with DocuSign.
 * @constructor
 * @param {DS_API} ds_api - Instance of the DS_API SDK object.
 * @param {DS_Configuration} ds_config - DS_Configuration object from the ds_configuration file.
 * @param {string} app_dir - The root directory for the app.
 */
let DS_JWT_Auth = function _DS_JWT_Auth(debug) {
  // private globals
  this._tokenReplaceMin = 10; // The token must expire at least this number of
                               // minutes later or it will be replaced
  this._jwtLifeSec = 3600; // requested lifetime for the token is 1 hour
                           // (the max available from DocuSign)
  this._token = null;        // The bearer token. Get it after calling (await #checkToken)
  this._tokenExpirationTimestamp = null;  // when does the token expire?
  this._user = {}; // object with user data from the UserInfo method
  this._accountId = null; // current account
  this._accountName = null; // current account's name
  this._baseUri = null; // eg https://na2.docusign.net
  this._dsApi = null; // the docusign sdk instance
  this._debug = null;
  
  // INITIALIZE
  this._debug = debug;
  this._dsApi = new docusign.ApiClient();
}

/**
 * This is the key method for the object.
 * It should be called before any API call to DocuSign.
 * It checks that the existing access token can be used.
 * If the existing token is expired or doesn't exist, then
 * a new token will be obtained from DocuSign by using
 * the JWT flow.
 * 
 * This is an async function so call it with await.
 * 
 * <br><b>SIDE EFFECT:</b> Sets the access token that the SDK will use.
 * <br><b>SIDE EFFECT:</b> If a new JWT token is fetched then the method
 *    also calls OAuth::getUserInfo to determine the account info and baseUri
 * @function
 * @returns {promise} a promise with null result.
 */
DS_JWT_Auth.prototype.checkToken = async function _checkToken() {
  let noToken = !this._token || !this._tokenExpirationTimestamp
    , now = moment()
    , needToken = noToken || this._tokenExpirationTimestamp.add(
        this._tokenReplaceMin, 'm').isBefore(now)
    ;
  if (this._debug) {
    if (noToken) {this._debug_log('checkToken: Starting up--need a token')}
    if (needToken && !noToken) {this._debug_log('checkToken: Replacing old token')}
    if (!needToken) {this._debug_log('checkToken: Using current token')}
  }

  if (needToken) {
    await this._getToken();
    await this._getAccount(dsConfig.target_account_id);
  }
  this._dsApi.addDefaultHeader('Authorization', 'Bearer ' + this._token);
  // Set the base_uri for the SDK
  let basePath = `${this._baseUri}${baseUriSuffix}`;
  this._dsApi.setBasePath(basePath);
  return Promise.resolve()
}

/**
 * Async function to obtain a token via JWT grant
 * 
 * The object's _token and _tokenExpirationTimestamp
 * private variables will be set.
 * 
 * We need a new token. We will use the DocuSign SDK's function.
 */
DS_JWT_Auth.prototype._getToken = async function __getToken() {
  // The key is being supplied as a value.
  // Store it in a tmp file, then use that file as the private_key_file
  // The current version of the configureJWTAuthorizationFlow method 
  // requires that the private key be stored in a file. 
  // In a future version, the private key will be passed as a value.
  let tmpFileobj = tmp.fileSync();
  fs.writeFileSync(tmpFileobj.fd, dsConfig.private_key);
  let privateKeyFile = tmpFileobj.name
    , configureJWTAuthorizationFlowP = 
        this.make_promise(this._dsApi, 'configureJWTAuthorizationFlow');
  return (
    configureJWTAuthorizationFlowP(privateKeyFile, this._aud(), 
      dsConfig.client_id, dsConfig.impersonated_user_guid, this._jwtLifeSec)
    .catch (e => {
      tmpFileobj.removeCallback();
      throw e; // Let client handle
    })
    .then (result => {
      tmpFileobj.removeCallback();
      let expires_in;
      ({access_token: this._token, expires_in} = result.body);
      this._tokenExpirationTimestamp = moment().add(expires_in, 's');
      this._debug_log(`checkToken: Token received! Expiration: ${this._tokenExpirationTimestamp.format()}`);
      return Promise.resolve()
    })
  )
}

/**
 * Finds an accountId and basePath that will be used
 * SIDE-EFFECTS:
 * - The user's account information will be looked up via an userInfo API call
 *   and this object will be updated: this._user, account and baseUri info
 * @function _getAccount
 * @private
 * @param {string} targetAccountId the desired account. If false, then the
 *        user's default account will be used.
 *        If the account is not false and is not available,
 *        an error will be thrown.
 * @returns {promise} promise result: object {account_id, account_name, base_uri}
 *           with the account information.
 * @promise
 */
DS_JWT_Auth.prototype._getAccount = async function _getAccount(targetAccountId){
  //this._debug_log_obj("targetAccountId:", targetAccountId);
  let url = `${dsConfig.auth_server}/oauth/userinfo`;
  let results = await rp.get(url, {auth: {bearer: this._token}, json: true});
  this._user = results; // save for client's use

  let accountInfo;
  if (targetAccountId == "false" || targetAccountId == "FALSE" || 
      targetAccountId === false) {
    // find the default account
    accountInfo = results.accounts.find(account => account.is_default);
  } else {
    // find the matching account
    accountInfo = results.accounts.find(account => account.account_id == targetAccountId);
  }
  if (typeof accountInfo === 'undefined') {
    let err = new Error (`Target account ${targetAccountId} not found!`);
    throw err;
  }

  ({account_id: this._accountId, 
    account_name: this._accountName, 
    base_uri: this._baseUri} = accountInfo);
  return Promise.resolve()
}

/**
 * Returns an aud from the auth_server setting
 * @function
 */
DS_JWT_Auth.prototype._aud = function(){
  let auth_server = dsConfig.auth_server;
  let aud;
  if (auth_server.indexOf('https://') > -1) {
    aud = auth_server.substr(8); // Remove first 8 characters
  } else if (auth_server.indexOf('http://') > -1) {
    aud = auth_server.substr(7); // Remove first 7 characters
  }
  return aud
};

/**
 * Clears the token. Same as logging out
 * @function
 */
DS_JWT_Auth.prototype.clearToken = function(){ // "logout" function
  this._tokenExpirationTimestamp = false;
  this._token = false;
};

DS_JWT_Auth.prototype.get_dsApi = function(){return this._dsApi};

/**
 * Getter for the <tt>accountId</tt>
 * @function
 * @returns {string} accountId
 */
DS_JWT_Auth.prototype.get_accountId   = function(){return this._accountId};
/**
 * Getter for the <tt>accountName</tt>
 * @function
 * @returns {string} accountName
 */
DS_JWT_Auth.prototype.get_accountName = function(){return this._accountName};
/**
 * Getter for the <tt>baseUri</tt>
 * @function
 * @returns {string} baseUri
*/
DS_JWT_Auth.prototype.get_baseUri     = function(){return this._baseUri};
/**
 * Getter for the <tt>user</tt> object.
 * @function
 * @returns {User} user
 */
DS_JWT_Auth.prototype.get_user         = function(){return this._user};


/* Returns a promise method, {method_name}_promise, that is a
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


// for testing:
/**
 * For testing: Set how long the JWT lifetinme will be
 * @function
 * @param {integer} jwt_life_sec_arg Lifetime in seconds
 */
DS_JWT_Auth.prototype.test_set_jwt_life_sec =
  function(jwt_life_sec_arg){this._jwtLifeSec = jwt_life_sec_arg};
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
DS_JWT_Auth.prototype.test_get_tokenExpirationTimestamp = function(){return this._tokenExpirationTimestamp};
/**
 * For testing: Clears the account user information:
 * the <tt>user</tt>, <tt>account_id</tt>, <tt>account_name</tt>, <tt>base_uri</tt>
 * @function
 */
DS_JWT_Auth.prototype.test_clear_account_user = function(){
  this._user = {};
  this._accountId = null; // current account
  this._accountName = null; // current account's name
  this._baseUri = null; // eg https://na2.docusign.net
}

/**
 * If in debug mode, prints message to the console
 * @function
 * @param {string} m The message to be printed
 * @private
 */
DS_JWT_Auth.prototype._debug_log = function(m){
  if (!this._debug) {return}
  console.log(m)
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
