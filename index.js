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
    DS_JWT_Auth = require('./lib/DS_JWT_Auth.js')
  , SendEnvelope = require('./lib/SendEnvelope')
  //, ListEnvelopes = require('./lib/ListEnvelopes')
  , dsConfig = require('./ds_config.js').config
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
  const debug = true; // should debugging info be printed to console?

  // initialization
  let dsJwtAuth = new DS_JWT_Auth(debug);

  log ('\nSend an envelope with three documents. This operation takes about 15 seconds...');
  let sendEnvelope = new SendEnvelope(dsJwtAuth)
    , envelopeArgs = {
        signer_email: dsConfig.signer_email,
        signer_name: dsConfig.signer_name,
        cc_email: dsConfig.cc_email, 
        cc_name: dsConfig.cc_name
      }
    , results = await sendEnvelope.sendEnvelope1(envelopeArgs);
  log (`Envelope status: ${results.status}. Envelope ID: ${results.envelopeId}`);

  // log ("\nList envelopes in the account...");
  // let listEnvelope = new ListEnvelope(dsJwtAuth),
  //     results = await listEnvelope.sendEnvelope1();
  // if (results.envelopes && results.envelopes.length > 2){
  //   log (`Results for ${results.envelopes.length} envelopes were returned. Showing the first two:`);
  //   results.envelopes.length = 2;
  // }
  // let h = `Results: \n${JSON.stringify(results, null, '    ')}`

  log ("\nDone.\n");
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
    let body = e.response && e.response.body;
    if (body) {
      // DocuSign API problem
      if (body.indexOf('consent_required') > -1) {
        // Consent problem
        let permission_url = dsApi.getJWTUri(
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
        // Some other DocuSign API problem 
      log (`API problem: Status code ${e.response.status}, message body:
${JSON.stringify(body, null, 4)}`);
      e.all_done = true;
      }  
    } else {
      // Not an API problem
      throw e;
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
