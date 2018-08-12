// ListEnvelopes.js
/**
 * @file ListEnvelopes
 * ListEnvelopes class lists the envelope's in the user's account from the past 3 months.
 * @author DocuSign
 */

'use strict';

let   path = require('path')
    , moment = require('moment')
    , docusign = require('docusign-esign')
    ;

// Exporting the ListEnvelopes namespace. See https://team.goodeggs.com/export-ListEnvelopes-interface-design-patterns-for-node-js-modules-b48a3b1f8f40#34e6

let ListEnvelopes = function _ListEnvelopes(dsJwtAuth) {
  // private globals
  this._dsApi = null; // the docusign sdk instance
  this._dsJwtAuth = null;

  // INITIALIZE
  this._dsJwtAuth = dsJwtAuth;
  this._dsApi = dsJwtAuth.get_dsApi();
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
  * <br><b>SIDE EFFECTS</b>: The function checks the token and causes a new one to be created if need be
  * @function
  * @returns {promise} Results of the send operation:
  * <br><tt>response object with the result of the API call
  */
ListEnvelopes.prototype.listEnvelopes1 = async function _listEnvelopes1(args){
  await this._dsJwtAuth.checkToken();
  let envelopesApi = new docusign.EnvelopesApi(this._dsApi)
    , listStatusChanges_p = this._dsJwtAuth.make_promise(envelopesApi, 'listStatusChanges')
    , accountId = this._dsJwtAuth.get_accountId()
    , options = {fromDate: moment().subtract(30, 'days').format()}
    , results = await listStatusChanges_p(accountId, options);
  return results
}

module.exports = ListEnvelopes;  // SET EXPORTS for the module.

