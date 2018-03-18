// ds_jwt_auth.js
//
// This module implements JWT authentication with DocuSign.
// It also looks up the user's account and base_url
//
//

let   fs = require('fs')
    , moment = require('moment')
    , {promisify} = require('util') // http://2ality.com/2017/05/util-promisify.html
    , path = require('path')
    , _ = require('lodash')
    ;
const ds_jwt_auth = exports;

// private globals
let   debug_prefix = 'ds_jwt_auth'
    , token_replace_min = 5 // The token must expire at least this number of
                            // minutes later or it will be replaced
    , ds_config  // configuration info
    , ds_api // the docusign sdk instance
    , account_id // the account in use
    , user // object with user data from the UserInfo method
    , token = false// the bearer token
    , token_expiration = false // when does the token expire?
    , debug = false
    , jwt_life_sec = 3600 // requested lifetime for the token
    , app_dir
    ;

// functions
ds_jwt_auth.set_debug = (debug_arg) => {debug = debug_arg};
ds_jwt_auth.set_ds_api = (ds_api_arg) => {ds_api = ds_api_arg};
ds_jwt_auth.set_ds_config = (config, app_dir_arg) => {
  ds_config = config;
  app_dir = app_dir_arg;
};
ds_jwt_auth.get_ds_config = () => ds_config;
ds_jwt_auth.get_account_id = () => account_id;
ds_jwt_auth.get_user = () => user;

ds_jwt_auth.add_make_promise = () => {
  // Add make_promise to the ds_api if it is not there already
  // It does the equivalent of
  //   configureJWTAuthorizationFlow_promise =
  //     promisify(ds_api.configureJWTAuthorizationFlow).bind(ds_api)
  // NB promisify is included with Node 8.10. See
  // https://nodejs.org/dist/latest-v8.x/docs/api/util.html
  if ('make_promise' in ds_api) {return}
  ds_api.make_promise = function _make_promise(method_name){
    ds_api[method_name + '_promise'] =
      promisify(ds_api[method_name]).bind(ds_api)
  }
}

ds_jwt_auth.add_promise_functions = () => {
  ds_jwt_auth.add_make_promise();
  ds_api.make_promise('configureJWTAuthorizationFlow');
}

// Error names used:
ds_jwt_auth.Error_JWT_get_token = 'Error_JWT_get_token';
ds_jwt_auth.Error_consent_required = 'consent_required';

// for testing:
ds_jwt_auth.test = {};
ds_jwt_auth.test.set_jwt_life_sec = (jwt_life_sec_arg) =>
  {jwt_life_sec = jwt_life_sec_arg};


/**
 * Configures and checks the account_id that will be used
 * SIDE-EFFECTS: A bearer token will be obtained / refreshed;
 *   The user's information will be looked up.
 * @param target_account_id the desired account. If false, then the
 *        user's default account will be used.
 *        If the account is not false and is not available,
 *        an error will be thrown.
 * @returns  a promise with value of the account that will be used.
 */
ds_jwt_auth.set_account = (target_account_id) => {
  return (
    check_token()
    .then set_account_internal(target_account_id)
  )
}

/**
 * Calls userInfo to look up account info
 * SIDE-EFFECTS: Sets the internal user object about the
 *               current user.
 * @param target_account_id If false, then the user's default account
 *                          will be returned. Else, the specific
 *                          account info will be used.
 * @returns  a promise
 */
function set_account_internal(target_account_id){
  

}


ds_jwt_auth.test.check_token = () => check_token();
/**
 * Checks that a good token is available. Creates one if necessary
 * SIDE-EFFECTS: Sets the ds_api token
 * @returns  a promise
 */
function check_token() {
  let no_token = !token || !token_expiration
    , now = moment()
    , need_token = no_token || token_expiration.add(token_replace_min, 'm').isAfter(now)
    ;
  if (debug) {
    if (no_token) {debug_log('check_token: Starting up--need a token')}
    if (need_token && !no_token) {debug_log('check_token: Replacing old token')}
    if (!need_token) {debug_log('check_token: Using current token')}
  }

  if (!need_token) {return Promise.resolve()}

  // We need a new token. We will use the DocuSign SDK's function.
  const private_key_file = path.resolve(app_dir, ds_config.private_key_file)

  return (
    ds_api.configureJWTAuthorizationFlow_promise(
      private_key_file, ds_config.aud, ds_config.client_id,
      ds_config.impersonated_user_guid, jwt_life_sec)
    .catch (e => {
      e.name = ds_jwt_auth.Error_JWT_get_token;
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/name
      // if we can pull out an error from the response body, then do so:
      let err = _.get(e, 'response.body.error', false);
      if (err) {e.message = err}
      throw e;
    })
    .then (result => {
      //debug_log_obj('JWT result: ', result);
      // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
      let expires_in;
      ({access_token: token, expires_in} = result.body);
      token_expiration = moment().add(expires_in, 's');
      debug_log(`check_token: Token received! Expiration: ${token_expiration.format()}`);
    })
  )
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






ds_jwt_auth.authenticate = () => {
  // Create a JWT token and use it to get a bearer token


}

ds_jwt_auth.token = () => {
  // return a good bearer token.
  // If it will expire within 5 minutes then first refresh it

}
