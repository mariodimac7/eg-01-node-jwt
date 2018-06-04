#!/usr/bin/env node

/**
 * @file index.js is the root file for the example.
 * It initiates the example's <tt>DS_JWT_Auth</tt> and <tt>DS_Work libraries</tt>,
 * and then calls them
 * to create a JWT token and an envelope.
 * @author DocuSign
 * @see <a href="https://developers.docusign.com">DocuSign Developer Center</a>
 */

'use strict';

const
    docusign = require('docusign-esign')
  , DS_JWT_Auth = require('./lib/DS_JWT_Auth.js')
  , DS_Work = require('./lib/DS_Work.js')
  , ds_config = require('./ds_configuration.js').config
  , _ = require('lodash')
  ;

/**
 * The worker function for the example. It is an async function.
 * It calls async libraries <tt>DS_JWT_Auth</tt> and <tt>DS_Work</tt> and
 * handles their output.
 * @throws Exceptions raised by the DS_JWT_Auth and DS_Work libraries,
 * and various networking exceptions if there are networking problems.
 * @private
 */
async function _main() {
  // globals for the methods...
  let account_info;
  const ds_api = new docusign.ApiClient() // Globals that won't change.
      , debug = true // should debugging info be printed to console?
      ;

  // initialization
  const app_dir = __dirname;
  let ds_jwt_auth = new DS_JWT_Auth(ds_api, ds_config, app_dir);
  ds_jwt_auth.set_debug(debug);
  let ds_work = new DS_Work(ds_jwt_auth);

  log ("Starting...");
  try {
    // set_account will also get the user's info and create a token
    account_info = await ds_jwt_auth.find_account(ds_config.target_account_id)
  } catch(e) {
    let {name, message} = e;
    if (name === ds_jwt_auth.Error_JWT_get_token){
      if (message === ds_jwt_auth.Error_consent_required) {
        let permission_url = ds_api.getJWTUri(
          ds_config.client_id,
          ds_config.oauth_redirect_URI,
          ds_config.aud);
        console.log(`\nProblem!
The client_id (Integration Key) you're using (${ds_config.client_id}) does not
have permission to impersonate the user. You have two choices:

1) Use DocuSign Organization Administration to grant blanket impersonation permission to the client_id.
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
  log ('\nSending an envelope with three documents. This operation takes about 14 seconds...');
  let results = await ds_work.send_envelope_1(ds_config);
  log (`Envelope status: ${results.status}. Envelope ID: ${results.envelopeId}`);

  log ("\nList envelopes in the account...");
  results = await ds_work.listEnvelopes();
  if (results.envelopes && results.envelopes.length > 2){
    log (`Results for ${results.envelopes.length} envelopes were returned. Showing the first two:`);
    results.envelopes.length = 2;
  }
  let h = `Results: \n${JSON.stringify(results, null, '    ')}`
  // Save an envelopeId for later use if an envelope list was returned (result set could be empty)
  let firstEnvelopeId = results.envelopes && results.envelopes[0] && results.envelopes[0].envelopeId;
  log(h);

  log ("\nGet an envelope's status...");
  results = await ds_work.getEnvelopeStatus(firstEnvelopeId);
  log (`Results: \n${JSON.stringify(results, null, '    ')}`)

  log ("\nList an envelope's recipients and their status...");
  results = await ds_work.listEnvelopeRecipients(firstEnvelopeId);
  log (`Results: \n${JSON.stringify(results, null, '    ')}`)
  
  log ("\nList an envelope's document(s) and then download them. This operation takes about 15 seconds.");
  results = await ds_work.getEnvelopeDocuments(firstEnvelopeId);
  
}

/**
 * The top level function. It's a wrapper around <tt>_main</tt>.
 * This async function catches and displays exceptions raised by the
 * <tt>DS_JWT_Auth</tt> and <tt>DS_Work libraries</tt>.
 * Other exceptions are re-thrown. Eg networking exceptions.
 */
async function main() {
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

/**
 * Prints a message to the console
 * @param {string} m The message that will be printed
 * @private
 */
function log(m){console.log(m)}


// the main line
main();
