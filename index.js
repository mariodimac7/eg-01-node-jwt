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
  , ListEnvelopes = require('./lib/ListEnvelopes')
  , dsConfig = require('./ds_config.js').config
  ;

/**
 * The worker function for the examples. It is an async function.
 * It calls async libraries <tt>DS_JWT_Auth</tt> and <tt>DS_Work</tt> and
 * handles their output.
 * @throws Exceptions raised by the DS_JWT_Auth library,
 * and various networking exceptions if there are networking problems.
 * @private
 */
async function main() {
  const debug = true; // should debugging info be printed to console?

  // initialization
  let dsJwtAuth = new DS_JWT_Auth(debug);

  if (! dsConfig.client_id) {
    log (`\nProblem: you need to configure this example,
    either via environment variables (recommended) or via the ds_config.js
    file. See the README file for more information\n\n`);
    process.exit();
  }

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

  log ("\nList envelopes in the account...");
  let listEnvelopes = new ListEnvelopes(dsJwtAuth);
  results = await listEnvelopes.listEnvelopes1();
  if (results.envelopes && results.envelopes.length > 2){
    log (`Results for ${results.envelopes.length} envelopes were returned. Showing the first two:`);
    results.envelopes.length = 2;
  } else {
    log (`Results for ${results.envelopes.length} envelopes were returned:`);   
  }
  log (`\n${JSON.stringify(results, null, '    ')}`);

  log ("\nDone.\n");
}

/**
 * The top level function. It's a wrapper around <tt>_main</tt>.
 * This async function catches and displays exceptions raised by the
 * <tt>DS_JWT_Auth</tt> and <tt>DS_Work libraries</tt>.
 * Other exceptions are re-thrown. Eg networking exceptions.
 */
async function executeMain() {
  try {
    await main();
  } catch (e) {
    let body = e.response && e.response.body;
    if (body) {
      // DocuSign API problem
      if (body.error && body.error == 'consent_required') {
        // Consent problem
        let consent_scopes = "signature%20impersonation",
            consent_url = `${dsConfig.auth_server}/oauth/auth?response_type=code&` +
              `scope=${consent_scopes}&client_id=${dsConfig.client_id}&` +
              `redirect_uri=${dsConfig.oauth_consent_redirect_URI}`;
        console.log(`\nProblem:   C O N S E N T   R E Q U I R E D

    Ask the user who will be impersonated to run the following url:
        ${consent_url}
    
    It will ask the user to login and to approve access by your application.
    
    Alternatively, an Administrator can use Organization Administration to
    pre-approve one or more users.\n\n`)
      } else {
        // Some other DocuSign API problem 
      log (`\nAPI problem: Status code ${e.response.status}, message body:
${JSON.stringify(body, null, 4)}\n\n`);
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
executeMain();
