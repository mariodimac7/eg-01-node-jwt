// ds_jwt_auth.js
//
// This module implements JWT authentication with DocuSign.
// It also looks up the user's account and base_url
//
//

let   fs = require('fs')
    , moment = require('moment')
    , path = require('path')
    , _ = require('lodash')
    , ds_js = require('./ds_js.js')
    ;
const ds_jwt_auth = exports;

// private globals
let   debug_prefix = 'ds_jwt_auth'
    , token_replace_min = 10 // The token must expire at least this number of
                            // minutes later or it will be replaced
    , jwt_life_sec = 3600 // requested lifetime for the token is 1 hour
                          // (the max available from DocuSign)
    , token = null        // The bearer token. Get it via #check_token
    , token_expiration = null  // when does the token expire?
    ;

// public variables

// functions
ds_jwt_auth.clear_token = () => { // logout function
  token_expiration = false;
  token = false;
};

// Error names used:
ds_jwt_auth.Error_JWT_get_token = 'Error_JWT_get_token';
ds_jwt_auth.Error_consent_required = 'consent_required';
ds_jwt_auth.Error_invalid_grant = 'invalid_grant'; // message when bad client_id is provided

// for testing:
ds_jwt_auth.test = {};
ds_jwt_auth.test.set_jwt_life_sec = (jwt_life_sec_arg) =>
  {jwt_life_sec = jwt_life_sec_arg};
ds_jwt_auth.test.get_token = () => token;
ds_jwt_auth.test.get_token_expiration = () => token_expiration;

/**
 * Gets this module ready to go:
 * - set up the SDK promise functions we need
 * - register our check_token function with ds_js
 */
ds_jwt_auth.init = function init() {
  ds_js.set_check_token_function(ds_jwt_auth.check_token);
}


/**
 * A bearer token will be obtained / refreshed as needed.
 * SIDE EFFECT: Sets the bearer token that the SDK will use
 * @returns  a promise with result:
 *  {token_received, need_token, token, token_expiration}
 */
ds_jwt_auth.check_token = function check_token() {
  const ds_api = ds_js.get_ds_api();
  let no_token = !token || !token_expiration
    , now = moment()
    , need_token = no_token || token_expiration.add(token_replace_min, 'm').isBefore(now)
    , result =
        {token_received: null, need_token: null,
        token: token, token_expiration: token_expiration}
    ;
  if (ds_js.debug) {
    if (no_token) {debug_log('check_token: Starting up--need a token')}
    if (need_token && !no_token) {debug_log('check_token: Replacing old token')}
    if (!need_token) {debug_log('check_token: Using current token')}
  }

  if (!need_token) {
    result.need_token = false;
    // Ensure that the token is in the *current* DocuSign API object
    ds_api.addDefaultHeader('Authorization', 'Bearer ' + token);
    return Promise.resolve(result)
  }

  // We need a new token. We will use the DocuSign SDK's function.
  const private_key_file = path.resolve(ds_js.app_dir, ds_js.ds_config.private_key_file);

  return (
    ds_js.make_promise(ds_api, 'configureJWTAuthorizationFlow')(
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
      ({access_token: token, expires_in} = result.body);
      token_expiration = moment().add(expires_in, 's');
      debug_log(`check_token: Token received! Expiration: ${token_expiration.format()}`);
      return Promise.resolve({token_received: true, need_token: true,
        token: token, token_expiration: token_expiration})
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
