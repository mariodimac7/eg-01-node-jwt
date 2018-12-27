
/**
 * @file
 * The configuration file for the example.
 * @author DocuSign
 */


const env = process.env;

exports.config = {
    /** The app's integration key. "Integration key" is a synonym for "client id.' */
    client_id: env.DS_CLIENT_ID || '{CLIENT_ID}'
    /** The <tt>guid</tt> for the user who will be impersonated.
     *  An email address can't be used.
     *  This is the user (or 'service account')
     *  that the JWT will represent. */
  , impersonated_user_guid: env.DS_IMPERSONATED_USER_GUID || '{IMPERSONATED_GUID}'
    /** The account_id that will be used.
     *  If set to <b>false</b>, then the user's default account will be used.
     *  If an account_id is provided then it must be the guid
     *  version of the account number.
     *  <br><b>Default:</b> <b>false</tt> */
  , target_account_id: false
    /** The email address for the envelope's signer. */
  , signer_email: env.DS_SIGNER_EMAIL || '{USER_EMAIL}'
    /** The name of the envelope's signer. */
  , signer_name: env.DS_SIGNER_NAME || '{USER_FULLNAME}'
    /** The email address for the envelope's cc recipient.
      * It can't be the same as the signer's email unless
      * the account is set to enable someone to be repeated in
      * the recipient list. */
  , cc_email: env.DS_CC_EMAIL || ''
    /** The name of the envelope's cc recipient. */
  , cc_name: env.DS_CC_NAME || ''
    /** The private key */
    /** Enter the key as a multiline string value. No leading spaces! */
  , private_key: env.DS_PRIVATE_KEY || ``
    /** For the Developer Sandbox (demo) use <b>https://account-d.docusign.com</b><br>
      * For production (all sites) use <b>https://account.docusign.com</b> */
  , auth_server: env.DS_AUTH_SERVER || 'https://account-d.docusign.com'
    /** The same value must be set as a redirect URI in the
     *  DocuSign admin tool. This setting is <b>only</b> used for individually granting
     *  permission to the client_id if organizational-level permissions
     *  are not used.
     *  <br><b>Default:</b> <tt>https://www.docusign.com</tt> */
  , oauth_consent_redirect_URI: 'https://www.docusign.com'
}
