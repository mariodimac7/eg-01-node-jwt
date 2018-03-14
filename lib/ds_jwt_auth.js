// ds_jwt_auth.js
//
// This module implements JWT authentication with DocuSign.
// It also looks up the user's account and base_url
//
//

var   fs = require('fs')
    , moment = require('moment')
    , {promisify} = require('util') // http://2ality.com/2017/05/util-promisify.html
    , path = require('path')
    ;
const ds_jwt_auth = exports;

// private globals
var   debug_prefix = 'ds_jwt_auth'
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

// for testing:
ds_jwt_auth.test = {};
ds_jwt_auth.test.set_jwt_life_sec = (jwt_life_sec_arg) => {jwt_life_sec = jwt_life_sec_arg};


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
  return check_token();

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
  // Note: we need to promisfy it.
  const configureJWTAuthorizationFlow_promise =
          promisify(ds_api.configureJWTAuthorizationFlow).bind(ds_api)
      , private_key_file = path.resolve(app_dir, ds_config.private_key_file)

  return (
    configureJWTAuthorizationFlow_promise(
      private_key_file, ds_config.aud, ds_config.client_id,
      ds_config.impersonated_user_guid, jwt_life_sec)
    .then (result => {
      debug_log_obj('JWT result: ', result)
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
