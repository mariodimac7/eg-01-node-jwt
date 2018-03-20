// ds_js.js
//
// This module provides helper methods for using the DocuSign JS SDK
//
//

let   fs = require('fs')
    , moment = require('moment')
    , {promisify} = require('util') // http://2ality.com/2017/05/util-promisify.html
    , _ = require('lodash')
    ;
const ds_js = exports;

// private globals
let   debug_prefix = 'ds_js'
    , user = {} // object with user data from the UserInfo method
    , check_token = null // function that provides a token
    , account_id = null // current account
    ;

// public variables
ds_js.debug = false;
ds_js.ds_config = null;  // configuration info. Set via ds_js.set_ds_config
ds_js.app_dir = null; // root dir for the app. Set via ds_js.set_ds_config
ds_js.ds_api = null; // the docusign sdk instance

// functions
ds_js.set_check_token_function = (func) => {check_token = func}
ds_js.check_token = () => check_token();


ds_js.add_make_promise = () => {
  // Add make_promise to the ds_api if it is not there already
  // It does the equivalent of
  //   configureJWTAuthorizationFlow_promise =
  //     promisify(ds_api.configureJWTAuthorizationFlow).bind(ds_api)
  // NB promisify is included with Node 8.10. See
  // https://nodejs.org/dist/latest-v8.x/docs/api/util.html
  if ('make_promise' in ds_js.ds_api) {return}
  ds_js.ds_api.make_promise = function _make_promise(method_name){
    ds_js.ds_api[method_name + '_promise'] =
      promisify(ds_js.ds_api[method_name]).bind(ds_js.ds_api)
  }
}

ds_js.set_debug = (debug_arg) => {ds_js.debug = debug_arg};
ds_js.set_ds_api = (ds_api_arg) => {ds_js.ds_api = ds_api_arg};
ds_js.set_ds_config = (config, app_dir_arg) => {
  ds_js.ds_config = config;
  ds_js.app_dir = app_dir_arg;
};
ds_js.get_account_id = () => account_id;
ds_js.get_user       = () => user;


/**
 * Configures and checks the account_id that will be used
 * SIDE-EFFECTS:
 * - A bearer token will be obtained / refreshed;
 * - The user's information will be looked up.
 * @param target_account_id the desired account. If false, then the
 *        user's default account will be used.
 *        If the account is not false and is not available,
 *        an error will be thrown.
 * @returns  a promise with value of the account that will be used.
 */
ds_js.set_account = (target_account_id) => {
  return (
    ds_js.check_token()
    .then (set_account_internal(target_account_id))
  )
}

/**
 * Calls userInfo to look up account info
 * See https://developers.docusign.com/esign-rest-api/guides/authentication/user-info-endpoints
 * SIDE-EFFECTS:
 * - Sets the the ds_js.user object.
 * - Sets the SDK's XXXXXXXXXXX
 * @param target_account_id the desired account. If false, then the
 *        user's default account will be used.
 *        If the account is not false and is not available,
 *        an error will be thrown.
 * @returns  a promise
 */
function set_account_internal(target_account_id){
  return Promise.resolve()

}



/**
 * If debug is true, prints debug msg to console
 */
function debug_log (m){
  if (!debug) {return}
  console.log(debug_prefix + ': ' + m)
}

function debug_log_obj (m, obj){
  if (!debug) {return}
  console.log(debug_prefix + ': ' + m + "\n" + JSON.stringify(obj, null, 4))
}
