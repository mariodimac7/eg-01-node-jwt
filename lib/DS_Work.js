// DS_Work.js
/**
 * @file DS_Work
 * This module implements the DS_Work class.
 * It creates and sends envelopes
 * @author DocuSign
 */

//
// This module does the main work with DocuSign: send an evelope, get status, etc
//
//

'use strict';

let   path = require('path')
    , _ = require('lodash')
    , docusign = require('docusign-esign')
    , moment = require('moment')
    , fs = require('fs-extra')
    , demo_doc_path = 'demo_documents'
    , doc_2_docx = 'World_Wide_Corp_Battle_Plan_Trafalgar.docx'
    , doc_3_pdf  = 'World_Wide_Corp_lorem.pdf';
    ;

/**
* Sends DocuSign envelopes.
* @constructor
* @param {DS_JWT_Auth} ds_jwt_auth - ds_jwt_auth object.
*/
let DS_Work = function _DS_Work(ds_jwt_auth) {
  // private globals
  this._ds_jwt_auth = null;
  this._ds_api = null;
  this._app_dir = null;
  this._debug_prefix = "DS_Work";

  // INITIALIZE
  this._ds_jwt_auth = ds_jwt_auth;
  this._ds_api = this._ds_jwt_auth.get_ds_api();
  this._app_dir = this._ds_jwt_auth.get_app_dir();
} // end of DS_Work function

// public constants
/**
 * Exception: Error while sending envelope_1
 * @constant
*/
DS_Work.prototype.Error_send_envelope_1 = "Error_send_envelope_1";
/**
 * Exception: Could not find account information for the user
 * @constant
*/
DS_Work.prototype.Error_account_not_found = "Could not find account information for the user";

 /**
  * Creates and sends envelope_1
  * <br>The envelope includes three documents, a signer, and a cc recipient.
  * <br>Document 1: An HTML document.
  * <br>Document 2: A Word .docx document.
  * <br>Document 3: A PDF document.
  * <br>DocuSign will convert all of the documents to the PDF format.
  * <br>The recipients' field tags are placed using <b>anchor</b> strings.
  * <br><b>SIDE EFFECTS</b>: The function checks the token and causes a new one to be created if need be
  * @function
  * @param {object} args parameters for the envelope:
  * <br>{<tt>signer_email:</tt> Signer's email,
  * <br><tt>signer_name:</tt> Signer's name,
  * <br><tt>cc_email:</tt> Carbon copy recipient's email,
  * <br><tt>cc_name:</tt> Carbon copy recipient's name}
  * @returns {promise} Results of the send operation:
  * <br>{<tt>status:</tt> The envelope's status. Usually <b>sent</b>.
  * <br><tt>envelopeId:</tt> The envelope ID}
  */
DS_Work.prototype.send_envelope_1 = async function _send_envelope_1(args){
    let env = this.create_envelope_1(args);
    await this._ds_jwt_auth.check_token();
    let envelopesApi = new docusign.EnvelopesApi(this._ds_api)
      , create_envelope_p = this._ds_jwt_auth.make_promise(envelopesApi, 'createEnvelope')
      , results = await create_envelope_p(
          this._ds_jwt_auth.get_account_id(), {envelopeDefinition: env});
    return results
}

/**
 * Creates envelope_1
 * @function create_envelope_1
 * @param {Object} args parameters for the envelope:
 *   <tt>signer_email</tt>, <tt>signer_name</tt>, <tt>cc_email</tt>, <tt>cc_name</tt>
 * <br><b>SIDE EFFECTS</b>: The function checks the token and causes a new one to be created if need be
 * @returns {Envelope} An envelope definition
 * @private
 */
DS_Work.prototype.create_envelope_1 = function _create_envelope_1(args){
  // document 1 (html) has tag **signature_1**
  // document 2 (docx) has tag /sn1/
  // document 3 (pdf) has tag /sn1/
  //
  // The envelope has two recipients.
  // recipient 1 - signer
  // recipient 2 - cc
  // The envelope will be sent first to the signer.
  // After it is signed, a copy is sent to the cc person.

  let doc_2_docx_bytes, doc_3_pdf_bytes;
  // read files from a local directory
  // The reads could raise an exception if the file is not available!
  doc_2_docx_bytes =
    fs.readFileSync(path.resolve(this._app_dir, demo_doc_path, doc_2_docx));
  doc_3_pdf_bytes =
    fs.readFileSync(path.resolve(this._app_dir, demo_doc_path, doc_3_pdf));

  // create the envelope definition
  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = 'Please sign this document sent from Node SDK';

  // add the documents
  let doc_1 = new docusign.Document()
    , doc_2 = new docusign.Document()
    , doc_3 = new docusign.Document()
    , doc_1_b64 = Buffer.from(this._envelope_1_document_1(args)).toString('base64')
    , doc_2_b64 = Buffer.from(doc_2_docx_bytes).toString('base64')
    , doc_3_b64 = Buffer.from(doc_3_pdf_bytes).toString('base64')
    ;

  doc_1.documentBase64 = doc_1_b64;
  doc_1.name = 'Order acknowledgement'; // can be different from actual file name
  doc_1.fileExtension = 'html'; // Source data format. Signed docs are always pdf.
  doc_1.documentId = '1'; // a label used to reference the doc
  doc_2.documentBase64 = doc_2_b64;
  doc_2.name = 'Battle Plan'; // can be different from actual file name
  doc_2.fileExtension = 'docx';
  doc_2.documentId = '2';
  doc_3.documentBase64 = doc_3_b64;
  doc_3.name = 'Lorem Ipsum'; // can be different from actual file name
  doc_3.fileExtension = 'pdf';
  doc_3.documentId = '3';

  // The order in the docs array determines the order in the envelope
  env.documents = [doc_1, doc_2, doc_3];

  // create a signer recipient to sign the document, identified by name and email
  // We're setting the parameters via the object creation
  let signer_1 = docusign.Signer.constructFromObject({email: args.signer_email,
    name: args.signer_name, recipientId: '1', routingOrder: '1'});
  // routingOrder (lower means earlier) determines the order of deliveries
  // to the recipients. Parallel routing order is supported by using the
  // same integer as the order for two or more recipients.

  // create a cc recipient to receive a copy of the documents, identified by name and email
  // We're setting the parameters via setters
  let cc_1 = new docusign.CarbonCopy();
  cc_1.email = args.cc_email;
  cc_1.name = args.cc_name;
  cc_1.routingOrder = '2';
  cc_1.recipientId = '2';

  // Create signHere fields (also known as tabs) on the documents,
  // We're using anchor (autoPlace) positioning
  //
  // The DocuSign platform seaches throughout your envelope's
  // documents for matching anchor strings. So the
  // sign_here_2 tab will be used in both document 2 and 3 since they
  // use the same anchor string for their "signer 1" tabs.
  let sign_here_1 = docusign.SignHere.constructFromObject({
        anchorString: '**signature_1**',
        anchorYOffset: '10', anchorUnits: 'pixels',
        anchorXOffset: '20'})
    , sign_here_2 = docusign.SignHere.constructFromObject({
        anchorString: '/sn1/',
        anchorYOffset: '10', anchorUnits: 'pixels',
        anchorXOffset: '20'})
    ;

  // Tabs are set per recipient / signer
  let signer_1_tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [sign_here_1, sign_here_2]});
  signer_1.tabs = signer_1_tabs;

  // Add the recipients to the envelope object
  let recipients = docusign.Recipients.constructFromObject({
    signers: [signer_1],
    carbonCopies: [cc_1]});
  env.recipients = recipients;

  // Request that the envelope be sent by setting |status| to "sent".
  // To request that the envelope be created as a draft, set to "created"
  env.status = 'sent';

  return env;
}

/**
 * Creates document 1 for  envelope_1
 * @function
 * @private
 * @param {Object} args parameters for the envelope:
 *   <tt>signer_email</tt>, <tt>signer_name</tt>, <tt>cc_email</tt>, <tt>cc_name</tt>
 * <br><b>SIDE EFFECTS</b>: The function checks the token and causes a new one to be created if need be
 * @returns {string} A document in HTML format
 */

DS_Work.prototype._envelope_1_document_1 = function __envelope_1_document_1(args) {
  return `
  <!DOCTYPE html>
  <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="font-family:sans-serif;margin-left:2em;">
      <h1 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
          color: darkblue;margin-bottom: 0;">World Wide Corp</h1>
      <h2 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
        margin-top: 0px;margin-bottom: 3.5em;font-size: 1em;
        color: darkblue;">Order Processing Division</h2>
      <h4>Ordered by ${args.signer_name}</h4>
      <p style="margin-top:0em; margin-bottom:0em;">Email: ${args.signer_email}</p>
      <p style="margin-top:0em; margin-bottom:0em;">Copy to: ${args.cc_name}, ${args.cc_email}</p>
      <p style="margin-top:3em;">
Candy bonbon pastry jujubes lollipop wafer biscuit biscuit. Topping brownie sesame snaps sweet roll pie. Croissant danish biscuit soufflé caramels jujubes jelly. Dragée danish caramels lemon drops dragée. Gummi bears cupcake biscuit tiramisu sugar plum pastry. Dragée gummies applicake pudding liquorice. Donut jujubes oat cake jelly-o. Dessert bear claw chocolate cake gummies lollipop sugar plum ice cream gummies cheesecake.
      </p>
      <!-- Note the anchor tag for the signature field is in white. -->
      <h3 style="margin-top:3em;">Agreed: <span style="color:white;">**signature_1**/</span></h3>
      </body>
  </html>
`
}

 /**
  * Lists the envelopes in the account
  * The Envelopes::listStatusChanges method has many options
  * See https://developers.docusign.com/esign-rest-api/reference/Envelopes/Envelopes/listStatusChanges
  *
  * The list status changes call requires at least a from_date OR
  * a set of envelopeIds. Here we filter using a from_date.
  * Here we set the from_date to filter envelopes for the last month
  * Use ISO 8601 date format
  * @function
  * @param {object} args parameters for the envelope:
  * @returns {promise} Results of the send operation:
  * <br><tt>[envelopeStatus]</tt> Array of envelope statuses.
  * <br><tt>envelopeStatus:</tt>
  * <br><tt>
  */
DS_Work.prototype.listEnvelopes = async function _listEnvelopes(args){
  await this._ds_jwt_auth.check_token();
  let envelopesApi = new docusign.EnvelopesApi(this._ds_api)
    , listStatusChanges_promise = this._ds_jwt_auth.make_promise(envelopesApi, 'listStatusChanges')
    , options = {fromDate: moment().subtract(30, 'days').format()}
    , accountId = this._ds_jwt_auth.get_account_id()
    , results = await listStatusChanges_promise(accountId, options)
    ;
  return results
}

/**
 * Get an envelope's current status
 * @param {string} envelopeId The envelope to be looked up.
 */
DS_Work.prototype.getEnvelopeStatus = async function(envelopeId) {
  if (!envelopeId){
    let msg = `
PROBLEM: This example software doesn't know which envelope's information should be looked up. 
SOLUTION: First run the <b>Send Envelope via email</b> example to create an envelope.`
    return msg
  }

  await this._ds_jwt_auth.check_token();
  // call the getEnvelope() API
  let envelopesApi = new docusign.EnvelopesApi(this._ds_api)
    , getEnvelope_promise = this._ds_jwt_auth.make_promise(envelopesApi, 'getEnvelope')
    , accountId = this._ds_jwt_auth.get_account_id()
    , results = await getEnvelope_promise(accountId, envelopeId, null)
    ;
  return results
}

/**
 * Get an envelope's current recipient status
 * @param {string} accountId The accountId to be used.
 * @param {string} envelopeId The envelope to be looked up.
 */
DS_Work.prototype.listEnvelopeRecipients = async function(envelopeId) {
  if (!envelopeId){
    let msg = `
PROBLEM: This example software doesn't know which envelope's information should be looked up. 
SOLUTION: First run the <b>Send Envelope via email</b> example to create an envelope.`
    return {msg: msg}
  }

  await this._ds_jwt_auth.check_token();
  // call the listRecipients() API
  let envelopesApi = new docusign.EnvelopesApi(this._ds_api)
    , listRecipients_promise = this._ds_jwt_auth.make_promise(envelopesApi, 'listRecipients')
    , accountId = this._ds_jwt_auth.get_account_id()
    , results = await listRecipients_promise(accountId, envelopeId, null)
    ;
  return results
}

/**
 * List, then download the envelope's documents to /downloaded_documents folder
 * @param {string} envelopeId The envelope to be looked up.
 */
DS_Work.prototype.getEnvelopeDocuments = async function(envelopeId) {
  if (!envelopeId){
    let msg = `
PROBLEM: This example software doesn't know which envelope's information should be looked up. 
SOLUTION: First run the <b>Send Envelope via email</b> example to create an envelope.`
    return {msg: msg}
  }
  await this._ds_jwt_auth.check_token();

  // The workflow will be multiple API requests:
  //  1) list the envelope's documents
  //  2) Loop to get each document
  const docDownloadDir = "downloaded_documents"
      , docDownloadDirPath = path.resolve(__dirname, '..', docDownloadDir)
      , accountId = this._ds_jwt_auth.get_account_id();
  let completeMsg = `Documents downloaded to ${docDownloadDirPath}`;

  return ( // return a promise
    // Create the dir
    fs.ensureDir(docDownloadDirPath)
    .catch (err => {;})
    .then (() => {
      let envelopesApi = new docusign.EnvelopesApi(this._ds_api);
      // call the listDocuments() API
      let listDocuments_promise = this._ds_jwt_auth.make_promise(envelopesApi, 'listDocuments');
      return listDocuments_promise(accountId, envelopeId, null)
    })
    .then ((result) => {
      console.log(`\nList documents response received!\n${JSON.stringify(result, null, '    ')}`);
      return result
    })
    .catch ((err) => {
      // If the error is from DocuSign, the actual error body is available in err.response.body
      let errMsg = err.response && err.response.body && JSON.stringify(err.response.body)
        , msg = `\nException! Result: ${err}`;
      if (errMsg) {
        msg += `. API error message: ${errMsg}`;
      }
      console.log(msg);
      return {msg: msg};
    })
    .then ((result) => {
      // Create a promise chain for each document in the results list.
      // Use the envelopeId in the file name.
      // Documents of type summary and content will be of type pdf.
      // Other types will also be pdf except for telephone authentication
      // voice files and perhaps other file types in the future.
      let envelopesApi = new docusign.EnvelopesApi(this._ds_api)
        , getDocument_promise = this._ds_jwt_auth.make_promise(envelopesApi, 'getDocument');

      function getDocument(doc){
        let docName = `${envelopeId}__${doc.name}`
          , hasPDFsuffix = docName.substr(docName.length - 4).toUpperCase() === '.PDF'
          ;
        // Add .pdf if it's a content or summary doc and doesn't already end in .pdf
        if ((doc.type === "content" || doc.type === "summary") && !hasPDFsuffix){
          docName += ".pdf"
        }
        return (
          getDocument_promise(accountId, envelopeId, doc.documentId, null)
          .then ((docBytes) =>
            fs.writeFile(path.resolve(docDownloadDirPath, docName), docBytes, {encoding: 'binary'}))
          .then (() => {
            completeMsg += `\nWrote document id ${doc.documentId} to ${docName}`
          })
          .catch ((err) => {
            // If the error is from DocuSign, the actual error body is available in err.response.body
            let errMsg = err.response && err.response.body && JSON.stringify(err.response.body)
              , msg = `\nException while processing document ${doc.documentId} Result: ${err}`;
            if (errMsg) {
              msg += `. API error message: ${errMsg}`;
            }
            console.log(msg);
            return Promise.resolve()
          })
        )
      }

      // Return the promise chain from last element
      return (
        result.envelopeDocuments.reduce(function (chain, item) {
          // bind item to first argument of function handle, replace `null` context as necessary
          return chain.then(getDocument.bind(null, item));
          // start chain with promise of first item
        }, Promise.resolve())
        .then (() => {
          console.log(completeMsg);
          return {msg: completeMsg}
        })
      )
    })
  )
}


/**
 * Prints debug message to console, but only if <tt>debug</tt> is on
 * @function
 * @param {string} m The string to be logged
 * @private
 */
DS_Work.prototype.debug_log = function _debug_log(m){
  if (!this._ds_jwt_auth.get_debug()) {return}
  console.log(this._debug_prefix + ': ' + m)
}

/**
 * Prints debug message and object to console, but only if <tt>debug</tt> is on
 * @function
 * @param {string} m The string to be logged
 * @param {object} obj The object to be pretty-printed
 * @private
 */
DS_Work.prototype.debug_log_obj = function _debug_log_obj(m, obj){
  if (!this._ds_jwt_auth.get_debug()) {return}
  console.log(this._debug_prefix + ': ' + m + "\n" + JSON.stringify(obj, null, 4))
}

module.exports = DS_Work;  // SET EXPORTS for the module.
