// sendEnvelope.js
/**
 * @file sendEnvelope
 * sendEnvelope class sends an envelope to a remote signer.
 * The envelope includes three documents: HTML, Word, and PDF files.
 * A remote signer receives an invitation to the signing ceremony via
 * an email sent by DocuSign
 * @author DocuSign
 */

'use strict';

const path = require('path')
    , docusign = require('docusign-esign')
    , dsJwtAuth = require('./dsJwtAuth')
    , fs = require('fs-extra')
    , demo_doc_path = path.join(__dirname, '..', 'demo_documents')
    , doc_2_docx = 'World_Wide_Corp_Battle_Plan_Trafalgar.docx'
    , doc_3_pdf  = 'World_Wide_Corp_lorem.pdf';
    ;


let sendEnvelope = {};
module.exports = sendEnvelope;


/**
  * Creates and sends an envelope to a remote signer
  * The envelope includes three documents, a signer, and a cc recipient.
  *
  * Document 1: An HTML document.
  * Document 2: A Word .docx document.
  * Document 3: A PDF document.
  *
  * DocuSign will convert all of the documents to the PDF format.
  * The recipients' field tags are placed using <b>anchor</b> strings.
  * SIDE EFFECT: The function checks the accessToken and causes a new one to be created if need be
  *
  * @function
  * @param {object} args parameters for the envelope:
  * signerEmail: Signer's email,
  * signerName: Signer's name,
  * ccEmail: Carbon copy recipient's email,
  * ccName: Carbon copy recipient's name
  *
  * @returns {promise} Results of the send operation:
  * {status: The envelope's status. Usually sent.
  *  envelopeId: The envelope ID
  * {
  *
  */
sendEnvelope.sendEnvelope = async function _sendEnvelope(args){
  // Data used:
  // args.signerEmail
  // args.signerName
  // args.ccEmail
  // args.ccName
  // DsJwtAuth.accessToken
  // DsJwtAuth.basePath
  // DsJwtAuth.accountId

  await dsJwtAuth.checkToken();
  const env = createEnvelope(args)
      , dsApi = new docusign.ApiClient()
      ;
  dsApi.addDefaultHeader('Authorization', 'Bearer ' + dsJwtAuth.accessToken);
  dsApi.setBasePath(dsJwtAuth.basePath);

  const envelopesApi = new docusign.EnvelopesApi(dsApi);
  return await envelopesApi.createEnvelope(dsJwtAuth.accountId, {envelopeDefinition: env});
}


/**
 * Creates the envelope request object
 * @function createEnvelope
 * @param {Object} args parameters for the envelope:
 *   <tt>signerEmail</tt>, <tt>signerName</tt>, <tt>ccEmail</tt>, <tt>ccName</tt>
 * @returns {Envelope} An envelope definition
 * @private
 */
function createEnvelope(args){
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
    fs.readFileSync(path.resolve(demo_doc_path, doc_2_docx));
  doc_3_pdf_bytes =
    fs.readFileSync(path.resolve(demo_doc_path, doc_3_pdf));

  // create the envelope definition
  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = 'Please sign this document set sent from Node SDK';

  // add the documents
  let doc_1 = new docusign.Document()
    , doc_2 = new docusign.Document()
    , doc_3 = new docusign.Document()
    , doc_1_b64 = Buffer.from(envelopeDocument1(args)).toString('base64')
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
  let signer_1 = docusign.Signer.constructFromObject({email: args.signerEmail,
    name: args.signerName, recipientId: '1', routingOrder: '1'});
  // routingOrder (lower means earlier) determines the order of deliveries
  // to the recipients. Parallel routing order is supported by using the
  // same integer as the order for two or more recipients.

  // create a cc recipient to receive a copy of the documents, identified by name and email
  // We're setting the parameters via setters
  let cc_1 = new docusign.CarbonCopy();
  cc_1.email = args.ccEmail;
  cc_1.name = args.ccName;
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
 *   signerEmail, signerName, ccEmail, ccName
 * @returns {string} A document in HTML format
 */

function envelopeDocument1 (args) {
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
      <h4>Ordered by ${args.signerName}</h4>
      <p style="margin-top:0em; margin-bottom:0em;">Email: ${args.signerEmail}</p>
      <p style="margin-top:0em; margin-bottom:0em;">Copy to: ${args.ccName}, ${args.ccEmail}</p>
      <p style="margin-top:3em;">
Candy bonbon pastry jujubes lollipop wafer biscuit biscuit. Topping brownie sesame snaps sweet roll pie. Croissant danish biscuit soufflé caramels jujubes jelly. Dragée danish caramels lemon drops dragée. Gummi bears cupcake biscuit tiramisu sugar plum pastry. Dragée gummies applicake pudding liquorice. Donut jujubes oat cake jelly-o. Dessert bear claw chocolate cake gummies lollipop sugar plum ice cream gummies cheesecake.
      </p>
      <!-- Note the anchor tag for the signature field is in white. -->
      <h3 style="margin-top:3em;">Agreed: <span style="color:white;">**signature_1**/</span></h3>
      </body>
  </html>
`
}

