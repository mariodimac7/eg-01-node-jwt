#!/usr/bin/env node

/**
 * @file index.js is the root file for the example.
 * @author DocuSign
 * @see <a href="https://developers.docusign.com">DocuSign Developer Center</a>
 */

'use strict';

const sendEnvelope = require('./lib/sendEnvelope')
    , listEnvelopes = require('./lib/listEnvelopes')
    , dsConfig = require('./dsConfig.js').config
  ;

/**
 * The worker function for the examples. It is an async function.
 * It calls the async methods and handles their output.
 * @throws Exceptions raised by the DsJwtAuth library,
 * and various networking exceptions if there are networking problems.
 * @private
 */
async function main() {
  // initialization

  if (! dsConfig.clientId) {
    console.log (`\nProblem: you need to configure this example,
    either via environment variables (recommended) or via the ds_config.js
    file. See the README file for more information\n\n`);
    process.exit();
  }

  console.log ('\nSend an envelope with three documents. This operation takes about 15 seconds...');
  let envelopeArgs = {
        signerEmail: dsConfig.signerEmail,
        signerName: dsConfig.signerName,
        ccEmail: dsConfig.ccEmail,
        ccName: dsConfig.ccName
      }
    , results = await sendEnvelope.sendEnvelope(envelopeArgs);
  console.log (`Envelope status: ${results.status}. Envelope ID: ${results.envelopeId}`);

  console.log ("\nListing envelopes in the account that have changed status in the last 30 days...");
  results = await listEnvelopes.listEnvelopes();
  if (results.envelopes && results.envelopes.length > 2){
    console.log (`Results for ${results.envelopes.length} envelopes were returned. Showing the first two:`);
    results.envelopes.length = 2;
  } else {
    console.log (`Results for ${results.envelopes.length} envelopes were returned:`);
  }
  console.log (`\n${JSON.stringify(results, null, '    ')}`);
  console.log ("\nDone.\n");
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
            consent_url = `https://${dsConfig.authServer}/oauth/auth?response_type=code&` +
              `scope=${consent_scopes}&client_id=${dsConfig.clientId}&` +
              `redirect_uri=${dsConfig.oAuthConsentRedirectURI}`;
        console.log(`\nProblem:   C O N S E N T   R E Q U I R E D

    Ask the user who will be impersonated to run the following url:
        ${consent_url}
    
    It will ask the user to login and to approve access by your application.
    
    Alternatively, an Administrator can use Organization Administration to
    pre-approve one or more users.\n\n`)
      } else {
        // Some other DocuSign API problem 
        console.log (`\nAPI problem: Status code ${e.response.status}, message body:
${JSON.stringify(body, null, 4)}\n\n`);
      }  
    } else {
      // Not an API problem
      throw e;
    }
  }
}

// the main line
executeMain();
