// Copy this file to be ds_configuration.js
//
// Then fill in the data below.
//
// ds_configuration.js is in the git ignore list so you must
// store the file external to git.
exports.config = {
    client_id: '' // The app's integration key
  , impersonated_user_guid: '' // Can't use an email here. Sorry.
                               // This is the user ('service account') Authorization
                               // that the JWT will represent.
  , target_account_id: false  // The account_id that will be used.
                              // If false, then the user's default account will be used
  , oauth_redirect_URI: 'https://www.docusign.com' // Must be set as a redirect URI in the
                              // DocuSign admin tool. It is ONLY used for individually granting
                              // permission to the client_id if organizational-level permissions
                              // are not used.
  , authentication_url: 'https://account-d.docusign.com' // account.docusign.com for production
  , aud: 'account-d.docusign.com' // or account.docusign.com for production
  , private_key_file: "./ds_private_key.txt" // relative to the script's home dir
  , api: 'restapi/v2'
  , permission_scopes: 'signature impersonation' // FUTURE PARAMETER. Used if individual permission
          // grant is used
  , jwt_scope: 'signature'  // FUTURE PARAMETER: Note that the 'impersonation' scope is not
                            // needed for the JWT itself.
}
