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
      , debug = true
      ;
  // initialization
  ds_js.set_debug(debug);
  ds_js.set_ds_config(ds_configuration, __dirname);
  ds_js.set_ds_api(ds_api);
  ds_jwt_auth.init();

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


  log('Fin!')
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








// function main_old(){
//     // globals for the methods...
//     let to_name
//       , to_email
//       ;
//     const ds_api = new docusign.ApiClient() // Globals that won't change.
//         , debug = true
//         ;
//     // initialization
//     ds_js.set_debug(debug);
//     ds_js.set_ds_config(ds_configuration, __dirname);
//     ds_js.set_ds_api(ds_api);
//     ds_jwt_auth.init();
//
//
//     // set_account will also get the user's info and create a token
//     ds_js.set_account(ds_configuration.target_account_id)
//     .catch((e) => {
//       let {name, message} = e;
//       if (name === ds_jwt_auth.Error_JWT_get_token){
//         if (message === ds_jwt_auth.Error_consent_required) {
//           let permission_url = ds_api.getJWTUri(
//             ds_configuration.client_id,
//             ds_configuration.oauth_redirect_URI,
//             ds_configuration.aud);
//           console.log(`The client_id you're using (${ds_configuration.client_id}) does not
// have permission to impersonate the user. You have two choices:
// 1) Use Organizational Administration to grant blanket impersonation permission to the client_id.
// 2) Or use the following URL in a browser to log in as the user and individually grant permission.
// ${permission_url}`)
//         } else {
//           console.log(`Error while authorizing via JWT: ${message}`)
//         }
//       } // end of name === ds_jwt_auth.Error_JWT_get_token
//       e.end_chain = true; // we don't want any more processing
//       throw e
//     })
//     .then((account_info) => {
//       let {account_id, account_name, base_uri} = account_info;
//       log(`Account: ${account_name} [${account_id}]`)
//     })
//     .then(() => ds_js.set_account(ds_configuration.target_account_id))
//
//
//
//     //.catch (() => {}) // Final catch
//     .then (() => {
//       log('Fin!')
//     })
//   }
//
// function log(m){console.log(m)}
//
//
// function next() {
//
//     // See the catch method below which handles the permission_needed case
//   (function foo(result) {
//       // Save the token for later use
//       docusign_credentials = {token: result.access_token,
//         expires: new Date().getTime() + (result.expires_in * 1000)};
//       let m = moment(docusign_credentials.expires);
//
//       console.log(`Received the authentication token!`)
//       console.log(`The token will expire ${m.fromNow()}. (${m.format()})`)
//       // In production, you could cache docusign_credentials in a file
//       // and use it repeatedly until it expires.
//     })
//     .then(() => {
//       // Call userinfo to get the user's account_id and api_base_url
//       // See https://docs.docusign.com/esign/guide/authentication/userinfo.html
//       // If the user or account is fixed for this app then you can
//       // treat the api_base_url as a constant. It is set per account and changes
//       // extremely infrequently (less often than once a year)
//       return rp.get(`${AUTHENTICATION_URL}/oauth/userinfo`, {
//         json: true,
//         auth: {bearer: docusign_credentials.token},
//         followAllRedirects: true
//       })
//     })
//     .then((result) => {
//       let account_info = _.find(result.accounts, (account) => account.is_default),
//           account_name = account_info.account_name;
//       api_base_url = account_info.base_uri;
//       account_id = account_info.account_id;
//       console.log(`Using default account: ${account_name}. Account id: ${account_id}.`);
//
//       // At this point, we have the authentication token, account_id, and
//       // api_base_url. So we're now ready to make any calls to the API.
//       // As an example, we'll create an envelope...
//
//       // Read in the Envelopes::create payload and the HTML document.
//       // Put together the Envelope create request and send it.
//       let payload = JSON.parse(fs.readFileSync('payload.json')),
//           html_doc = fs.readFileSync('simple_agreement.html');
//       payload.recipients.signers[0].name  = to_name;
//       payload.recipients.signers[0].email = to_email;
//       payload.documents[0].documentBase64 =
//         Buffer.from(html_doc).toString('base64'); // See https://stackoverflow.com/a/23097961/64904
//       let url = `${api_base_url}/${API}/accounts/${account_id}/envelopes`;
//       return rp.post(url, {
//         body: payload,
//         json: true,
//         auth: {bearer: docusign_credentials.token},
//         followAllRedirects: true
//       })
//     })
//     .then((results) => {
//       console.log (`Envelope was created! Envelope id: ${results.envelopeId}`);
//       console.log ('Done.');
//     })
//     .catch((err) => {
//         if (_.get(err, 'error.error') === 'consent_required') {
//           let encoded_scopes = encodeURIComponent(SCOPES)
//             , consent_url = `${AUTHENTICATION_URL}/oauth/auth?response_type=code&scope=${encoded_scopes}&client_id=${CLIENT_ID}&redirect_uri=${REGISTERED_REDIRECT_URI}`;
//
//           console.log(`
// Issue: you need to grant permission so this application can
// impersonate ${USER_EMAIL}.
// You can use Organization Administration to proactively grant
// blanket permission to this application.
//
// Or the user being impersonated can grant permission: open
// the url (below) in a browser, login to DocuSign, and grant permission.
// Then re-run this application.
// ${consent_url}
// `.magenta)
//         } else {
//           console.log('Error! '.red);
//           console.log(err.stack.red)
//           console.log( JSON.stringify(err, null, 4).red);
//         }
//     })
// }
