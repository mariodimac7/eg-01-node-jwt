// DS_JWT_Auth.js
//
// This module implements JWT authentication with DocuSign.
// It also looks up the user's account and base_url
//
//
// JS Prototype-bassed class: see https://javascript.info/class-patterns#prototype-based-classes

'use strict';

const fs = require('fs')
    , moment = require('moment')
    , path = require('path')
    , _ = require('lodash')
    , {promisify} = require('util') // http://2ality.com/2017/05/util-promisify.html
    , rp = require('request-promise')
    , base_uri_suffix = '/restapi'
    ;

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
DS_JWT_Auth.prototype.Error_set_account = "Error_set_account";
DS_JWT_Auth.prototype.Error_account_not_found = "Could not find account information for the user";
DS_JWT_Auth.prototype.Error_JWT_get_token = 'Error_JWT_get_token';
DS_JWT_Auth.prototype.Error_consent_required = 'consent_required';
DS_JWT_Auth.prototype.Error_invalid_grant = 'invalid_grant'; // message when bad client_id is provided

// public functions
DS_JWT_Auth.prototype.clear_token = () => { // "logout" function
  this._token_expiration = false;
  this._token = false;
};

DS_JWT_Auth.prototype.set_debug = (debug) => {this._debug = debug};
DS_JWT_Auth.prototype.get_ds_api = () => this._ds_api;

DS_JWT_Auth.prototype.get_account_id   = () => this._account_id;
DS_JWT_Auth.prototype.get_account_name = () => this._account_name;
DS_JWT_Auth.prototype.get_base_uri     = () => this._base_uri;
DS_JWT_Auth.prototype.get_user         = () => this._user;

/**
 * @func set_account
 * Configures to use a specific account_id, account_name, and base_uri
 * @param account_id the account_id in guid format
 * @param account_name the account_name
 * @param base_uri the base_uri for the account
 */
DS_JWT_Auth.prototype.set_account = (account_id, account_name, base_uri) => {
  this._account_id = account_id;
  this._account_name = account_name;
  this._base_uri = base_uri;

  // Set the base_uri for the SDK
  let base_path = `${base_uri}${base_uri_suffix}`;
  this._ds_api.setBasePath(base_path);

  this._debug_log(`Using account ${this._account_id}: ${this._account_name}`);
}

/**
 * @func find_account
 * Finds an account_id that will be used
 * SIDE-EFFECTS:
 * - A bearer token will be checked and obtained / refreshed if needbe;
 * - The user's account information will be looked up via an userInfo API call.
 * @param target_account_id the desired account. If false, then the
 *        user's default account will be used.
 *        If the account is not false and is not available,
 *        an error will be thrown.
 * @returns  a promise with result: an object {account_id, account_name, base_uri}
 *           with the account information.
 */
DS_JWT_Auth.prototype.find_account = (target_account_id) => {
  //this._debug_log_obj("target_account_id:", target_account_id);
  return (
    this.check_token()
    .then((token_result) => this.call_userInfo(token_result))
    .then((userInfo_result) => this._find_account_internal(
      {userInfo_result: userInfo_result, target_account_id: target_account_id}))
  )
}

/**
 * @func _find_account_internal
 * Calls OAuth::userInfo to look up account info
 * SIDE-EFFECTS:
 * - Sets the ds_js.user object
 * - Sets the ds_js account and base_uri info
 * - Sets the SDK's base url
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
    account_info = _.find(user.accounts, 'is_default');
  } else {
    // find the matching account
    account_info = _.find(user.accounts, ['account_id', target_account_id]);
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
 * See https://developers.docusign.com/esign-rest-api/guides/authentication/user-info-endpoints
 *
 * Currently, the SDK does not include this method. It will the future.
 * @returns a promise with result from the userInfo API method
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
 * Creates a new method, {method_name}_promise, that is a
 * promisfied version of the method.
 * The new method is attached to the parent object
 * @param obj An object that has method method_name
 * @param method_name The string version of the existing method
 * @returns  the promise method.
 */
DS_JWT_Auth.prototype.make_promise = function _make_promise(obj, method_name){
  let promise_name = method_name + '_promise';
  if (!(promise_name in obj)) {
    obj[promise_name] = promisify(obj[method_name]).bind(obj)
  }
  return obj[promise_name]
}

/**
 * A bearer token will be obtained / refreshed as needed.
 * SIDE EFFECT: Sets the bearer token that the SDK will use
 * @returns  a promise with result:
 *  {token_received, need_token, token, token_expiration}
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
  const private_key_file = path.resolve(this._app_dir, this._ds_config.private_key_file);

  return (
    this.make_promise(this._ds_api, 'configureJWTAuthorizationFlow')(
      private_key_file, this._ds_config.aud, this._ds_config.client_id,
      this._ds_config.impersonated_user_guid, this._jwt_life_sec)
    .catch (e => {
      e.name = this.Error_JWT_get_token;
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/name
      // if we can pull out an error from the response body, then do so:
      let err = _.get(e, 'response.body.error', false);
      if (err) {e.message = err}
      throw e;
    })
    .then (result => {
      //this._debug_log_obj('JWT result: ', result);
      // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
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
DS_JWT_Auth.prototype.test = {};
DS_JWT_Auth.prototype.test.set_jwt_life_sec = (jwt_life_sec_arg) =>
  {this._jwt_life_sec = jwt_life_sec_arg};
DS_JWT_Auth.prototype.test.get_token = () => token;
DS_JWT_Auth.prototype.test.get_token_expiration = () => token_expiration;
DS_JWT_Auth.prototype.test.clear_account_user = () => {
  this._user = {};
  this._account_id = null; // current account
  this._account_name = null; // current account's name
  this._base_uri = null; // eg https://na2.docusign.net
}

/**
 * debug is true, prints debug msg to console
 */
DS_JWT_Auth.prototype._debug_log = function(m){
  if (!this._debug) {return}
  console.log(this._debug_prefix + ': ' + m)
}

DS_JWT_Auth.prototype._debug_log_obj = function (m, obj){
  if (!this._debug) {return}
  console.log(this._debug_prefix + ': ' + m + "\n" + JSON.stringify(obj, null, 4))
}


module.exports = DS_JWT_Auth;  // SET EXPORTS for the module.
