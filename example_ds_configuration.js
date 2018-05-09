
/**
 * @file
 * This file is an example configuration file for the example.
 * Copy this file to file <tt>ds_configuration.js</tt> in the
 * project's root directory, then fill in the settings.
 * <br><tt>ds_configuration.js</tt> is in the git ignore list so you must
 * store the file externally to git.
 * <br><b>Usage:</b> <tt>ds_config = require('./ds_configuration.js').config</tt>
 * @author DocuSign

 */


/**
 * Configuration file.
 * @exports DS_Configuration
 */
exports.config = {
    /** The app's integration key. */
    client_id: ''
    /** The <tt>guid</tt> for the user who will be impersonated.
     *  An email address can't be used.
     *  This is the user (or 'service account')
     *  that the JWT will represent. */
  , impersonated_user_guid: ''
    /** The account_id that will be used.
     *  If set to <b>false</b>, then the user's default account will be used.
     *  If an account_id is provided then it must be the guid
     *  version of the account number.
     *  <br><b>Default:</b> <b>false</tt> */
  , target_account_id: false
    /** The same vakue must be set as a redirect URI in the
     *  DocuSign admin tool. This setting is <b>only</b> used for individually granting
     *  permission to the client_id if organizational-level permissions
     *  are not used.
     *  <br><b>Default:</b> <tt>https://www.docusign.com</tt> */
  , oauth_redirect_URI: 'https://www.docusign.com'
    /** The email address for the envelope's signer. */
  , signer_email: ''
    /** The name of the envelope's signer. */
  , signer_name: ''
    /** The email address for the envelope's cc recipient.
      * It can't be the same as the signer's email unless
      * the account is set to enable someone to be repeated in
      * the recipient list. */
  , cc_email: ''
    /** The name of the envelope's cc recipient. */
  , cc_name: ''
    /** For the Developer Sandbox (demo) use <b>https://account-d.docusign.com</b><br>
      * For production (all sites) use <b>https://account.docusign.com</b> */
  , authentication_url: 'https://account-d.docusign.com'
    /** For the Developer Sandbox (demo) use <b>account-d.docusign.com</b><br>
      * For production (all sites) use <b>account.docusign.com</b> */
  , aud: 'account-d.docusign.com'
    /** The path name of the file containing the Integration Key's
      * private key file. The path is relative to the example's home dir.
      * <br><b>Default:</b> <tt>./ds_private_key.txt</tt> */
  , private_key_file: "./ds_private_key.txt"
    /** URL path segment for the API.
      * <br><b>Default:</b> <tt>restapi/v2</tt> */
  , api: 'restapi/v2'
    /** <i>This setting will be used in the future.</i>
      * The OAuth scope grant permissions needed.
      * <br><b>Default:</b> <tt>signature impersonation</tt> */
  , permission_scopes: 'signature impersonation'
  /** <i>This setting will be used in the future.</i>
    * The OAuth scope grant explicitly needed for the JWT request.
    * <br><b>Default:</b> <tt>signature</tt> */
  , jwt_scope: 'signature'
}
