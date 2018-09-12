
/**
 * @file
 * This an Example configuration file.
 * @author DocuSign
 */

const env = process.env;

/**
 * Recommendation: set the environment variables instead of changing
 * a configuration file that might be stored in your code repository.
 * 
 * If you do use this configuration file and you receive the 
 * Invalid Grant error, clear the environment variables by using 
 * the `Example_env_clear.txt` file.
 */

exports.config = {
    /** The app's integration key. */
    client_id: env.DS_CLIENT_ID || '125xxx-xxxx-xxxx-xxxx'
    /** The <tt>guid</tt> for the user who will be impersonated.
     *  An email address can't be used.
     *  This is the user (or 'service account')
     *  that the JWT will represent. 
     *  Use the Admin Tool / Users screen to find a user's guid. */
  , impersonated_user_guid: env.DS_IMPERSONATED_USER_GUID || '7b3125xxx-xxxx-xxxx-xxxx'
    /** The account_id that will be used.
     *  If set to <b>false</b>, then the user's default account will be used.
     *  If an account_id is provided then it must be the guid
     *  version of the account number.
     *  <br><b>Default:</b> <b>false</tt> */
  , target_account_id: env.DS_TARGET_ACCOUNT_ID === "FALSE" ? false :
      (env.DS_TARGET_ACCOUNT_ID ? env.DS_TARGET_ACCOUNT_ID : 'FALSE')
    /** The email address for the envelope's signer. */
  , signer_email: env.DS_SIGNER_1_EMAIL || 'sue@example.com'
    /** The name of the envelope's signer. */
  , signer_name: env.DS_SIGNER_1_NAME || 'Sue Cardella'
    /** The email address for the envelope's cc recipient.
      * It can't be the same as the signer's email unless
      * the account is set to enable someone to be repeated in
      * the recipient list. */
  , cc_email: env.DS_CC_1_EMAIL || 'sam@example.com'
    /** The name of the envelope's cc recipient. */
  , cc_name: env.DS_CC_1_NAME || 'Sam Smithers'
    /** The private key */
    /** Enter the key as a multiline string value. No leading spaces! 
     *  The next to last line of the key value may be shorter than the others.
    */
  , private_key: env.DS_PRIVATE_KEY || `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAlrtiTEy3IzEI8jPuGXi/2C8KhNsJgyomP4XdXYwDjTyJm5u4
xxxxxxxxxxxxxjhsdjhsdkfdlkjhweriohwfenfesknsdkjnsadksafdnksdjnnd
s4lVLL2Fzb77yAOjZtT3bW7alxJyMwNuduqFiyOIpPmCJRIWJNnMoHt7D0PwroAQ
9J1RReNa5OIWUf6ErbhNdANqlBYTqMAdXAkTzSsOtbOo15lvHH7V
-----END RSA PRIVATE KEY-----`
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
