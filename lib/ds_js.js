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
    , user // object with user data from the UserInfo method
    ;

// public variables
ds_js.debug = false;
ds_js.ds_config = null;  // configuration info
ds_js.app_dir = null; // root dir for the app
ds_js.ds_api = null; // the docusign sdk instance

ds_js.account_id = null; // current account
ds_js.user = {}; // current user info

// functions
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



// let ds_jwt_auth = {};
// /**
//  * Configures and checks the account_id that will be used
//  * SIDE-EFFECTS: A bearer token will be obtained / refreshed;
//  *   The user's information will be looked up.
//  * @param target_account_id the desired account. If false, then the
//  *        user's default account will be used.
//  *        If the account is not false and is not available,
//  *        an error will be thrown.
//  * @returns  a promise with value of the account that will be used.
//  */
// ds_jwt_auth.set_account = (target_account_id) => {
//   return (
//     check_token()
//     .then (set_account_internal(target_account_id))
//   )
// }
//
// /**
//  * Calls userInfo to look up account info
//  * SIDE-EFFECTS: Sets the internal user object about the
//  *               current user.
//  * @param target_account_id If false, then the user's default account
//  *                          will be returned. Else, the specific
//  *                          account info will be used.
//  * @returns  a promise
//  */
// function set_account_internal(target_account_id){
//   return Promise.resolve()
//
// }
//
//
// ds_jwt_auth.test.check_token = () => check_token();
// /**
//  * Checks that a good token is available. Creates one if necessary
//  * SIDE-EFFECTS: Sets the ds_api token
//  * @returns  a promise
//  */
// function check_token() {
//   let no_token = !token || !token_expiration
//     , now = moment()
//     , need_token = no_token || token_expiration.add(token_replace_min, 'm').isBefore(now)
//     ;
//   if (debug) {
//     if (no_token) {debug_log('check_token: Starting up--need a token')}
//     if (need_token && !no_token) {debug_log('check_token: Replacing old token')}
//     if (!need_token) {debug_log('check_token: Using current token')}
//   }
//
//   if (!need_token) {return Promise.resolve({need_token: false})}
//
//   // We need a new token. We will use the DocuSign SDK's function.
//   const private_key_file = path.resolve(app_dir, ds_config.private_key_file)
//
//   return (
//     ds_api.configureJWTAuthorizationFlow_promise(
//       private_key_file, ds_config.aud, ds_config.client_id,
//       ds_config.impersonated_user_guid, jwt_life_sec)
//     .catch (e => {
//       e.name = ds_jwt_auth.Error_JWT_get_token;
//         // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/name
//       // if we can pull out an error from the response body, then do so:
//       let err = _.get(e, 'response.body.error', false);
//       if (err) {e.message = err}
//       throw e;
//     })
//     .then (result => {
//       //debug_log_obj('JWT result: ', result);
//       // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
//       let expires_in;
//       ({access_token: token, expires_in} = result.body);
//       token_expiration = moment().add(expires_in, 's');
//       debug_log(`check_token: Token received! Expiration: ${token_expiration.format()}`);
//       return Promise.resolve({token_received: true, need_token: true, token: token, token_expiration: token_expiration})
//     })
//   )
// }
//
// /**
//  * If debug is true, prints debug msg to console
//  */
// function debug_log (m){
//   if (!debug) {return}
//   console.log(debug_prefix + ': ' + m)
// }
//
// function debug_log_obj (m, obj){
//   if (!debug) {return}
//   console.log(debug_prefix + ': ' + m + "\n" + JSON.stringify(obj, null, 4))
// }
//
//
//
//
//
//
// ds_jwt_auth.authenticate = () => {
//   // Create a JWT token and use it to get a bearer token
//
//
// }
//
// ds_jwt_auth.token = () => {
//   // return a good bearer token.
//   // If it will expire within 5 minutes then first refresh it
//
// }
