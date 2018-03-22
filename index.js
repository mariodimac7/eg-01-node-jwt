#!/usr/bin/env node

const
    docusign = require('docusign-esign')
  , ds_js = require('./lib/ds_js.js')
  , ds_jwt_auth = require('./lib/ds_jwt_auth.js')
  , ds_configuration = require('./ds_configuration.js').config
  , ds_work = require('./lib/ds_work.js')
  , _ = require('lodash')
  ;

async function _main(){




  // globals for the methods...
  let account_info;
  const ds_api = new docusign.ApiClient() // Globals that won't change.
      , debug = false
      ;
  // initialization
  ds_js.set_debug(debug);
  ds_js.set_ds_config(ds_configuration, __dirname);
  ds_js.set_ds_api(ds_api);
  ds_jwt_auth.init();

  log ("Starting...");
  try {
    // set_account will also get the user's info and create a token
    account_info = await ds_js.set_account(ds_configuration.target_account_id)
  } catch(e) {
    let {name, message} = e;
    if (name === ds_jwt_auth.Error_JWT_get_token){
      if (message === ds_jwt_auth.Error_consent_required) {
        let permission_url = ds_api.getJWTUri(
          ds_configuration.client_id,
          ds_configuration.oauth_redirect_URI,
          ds_configuration.aud);
        console.log(`\nProblem!
The client_id (Integration Key) you're using (${ds_configuration.client_id}) does not
have permission to impersonate the user. You have two choices:

1) Use Organizational Administration to grant blanket impersonation permission to the client_id.
2) Or use the following URL in a browser to log in as the user and individually grant permission.
${permission_url}\n`)
      } else {
        console.log(`Error while authorizing via JWT: ${message}`)
      }
    } // end of name === ds_jwt_auth.Error_JWT_get_token
    e.all_done = true; // we don't want any more processing
    throw e
  }
  let {account_id, account_name, base_uri} = account_info;
  log(`Account: ${account_name} [${account_id}]`)

  // Next, send the envelope.
  // We could use a loop and catch statement here to handle
  // transient network problems
  let results = await ds_work.send_envelope_1(ds_configuration);
  log (`\nEnvelope status: ${results.status}. Envelope ID: ${results.envelopeId}`);
  log('\nDone!')
}

function log(m){console.log(m)}

async function main(){
  try {
    await _main();
  } catch (e) {
    let body = _.get(e, 'response.body', false);
    if (body) {
      // API problem
      log (`API problem: Status code ${e.response.status}, message body:
${JSON.stringify(body, null, 4)}`);
      e.all_done = true;
    }

    if (! (('all_done' in e) && e.all_done === true)) {
      throw e; // an unexpected error has occured
    }
  }
}


// the main line
main();
