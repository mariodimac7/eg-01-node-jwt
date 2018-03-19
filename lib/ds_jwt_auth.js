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
    , ds_js = require('./ds_js.js')
    ;
const ds_jwt_auth = exports;

// private globals
let   debug_prefix = 'ds_jwt_auth'
    , token_replace_min = 5 // The token must expire at least this number of
                            // minutes later or it will be replaced
    , jwt_life_sec = 3600 // requested lifetime for the token
    ;

// public variables
ds_jwt_auth.token = false; // the bearer token
ds_jwt_auth.token_expiration = false;  // when does the token expire?

// functions
ds_jwt_auth.clear_token = () => { // logout function
  ds_jwt_auth.token_expiration = false;
  ds_jwt_auth.token = false;
};

ds_jwt_auth.add_promise_functions = () => {
  ds_js.add_make_promise();
  ds_js.ds_api.make_promise('configureJWTAuthorizationFlow');
}

// Error names used:
ds_jwt_auth.Error_JWT_get_token = 'Error_JWT_get_token';
ds_jwt_auth.Error_consent_required = 'consent_required';
ds_jwt_auth.Error_invalid_grant = 'invalid_grant'; // message when bad client_id is provided

// for testing:
ds_jwt_auth.test = {};
ds_jwt_auth.test.set_jwt_life_sec = (jwt_life_sec_arg) =>
  {jwt_life_sec = jwt_life_sec_arg};


/**
 * A bearer token will be obtained / refreshed as needed.
 * @returns  a promise with result:
 *  {token_received, need_token, token, token_expiration}
 */
ds_jwt_auth.check_token = function check_token() {
  let no_token = !ds_jwt_auth.token || !ds_jwt_auth.token_expiration
    , now = moment()
    , need_token = no_token || ds_jwt_auth.token_expiration.add(token_replace_min, 'm').isBefore(now)
    , result = {token_received: null, need_token: null, token: null, token_expiration: null}
    ;
  if (ds_js.debug) {
    if (no_token) {debug_log('check_token: Starting up--need a token')}
    if (need_token && !no_token) {debug_log('check_token: Replacing old token')}
    if (!need_token) {debug_log('check_token: Using current token')}
  }

  if (!need_token) {
    result.need_token = false;
    return Promise.resolve(result)
  }

  // We need a new token. We will use the DocuSign SDK's function.
  const private_key_file = path.resolve(ds_js.app_dir, ds_js.ds_config.private_key_file)

  return (
    ds_js.ds_api.configureJWTAuthorizationFlow_promise(
      private_key_file, ds_js.ds_config.aud, ds_js.ds_config.client_id,
      ds_js.ds_config.impersonated_user_guid, jwt_life_sec)
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
      ({access_token: ds_jwt_auth.token, expires_in} = result.body);
      ds_jwt_auth.token_expiration = moment().add(expires_in, 's');
      debug_log(`check_token: Token received! Expiration: ${ds_jwt_auth.token_expiration.format()}`);
      return Promise.resolve({token_received: true, need_token: true,
        token: ds_jwt_auth.token, token_expiration: ds_jwt_auth.token_expiration})
    })
  )
}

/**
 * If ds_js.debug is true, prints debug msg to console
 */
function debug_log (m){
  if (!ds_js.debug) {return}
  console.log(debug_prefix + ': ' + m)
}

function debug_log_obj (m, obj){
  if (!ds_js.debug) {return}
  console.log(debug_prefix + ': ' + m + "\n" + JSON.stringify(obj, null, 4))
}






ds_jwt_auth.authenticate = () => {
  // Create a JWT token and use it to get a bearer token


}

ds_jwt_auth.token = () => {
  // return a good bearer token.
  // If it will expire within 5 minutes then first refresh it

}
