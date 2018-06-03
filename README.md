# Example 1: Node.JS Service Integration--Signature Request by email

Repository: [eg-01-node-jwt](https://github.com/docusign/eg-01-node-jwt)

<!--
## Articles and Screencasts

* Guide: Using OAuth JWT flow with DocuSign.
* Screencast: Using OAuth JWT flow with DocuSign.
* Guide: Sending an envelope with the Node.JS SDK.
* Screencast: Sending an example with Node.JS SDK.
-->
## Installation

Requirements: Node v8.10 or later

Download or clone this repository. Then:

````
cd eg-01-node-jwt
npm install
````

There are two ways to configure the example's settings:
1. Edit the `ds_configuration.js` file.
1. Set the environment variables before running the example. See the
   example environment variable file `Example_env_file.txt`

### Creating the Integration Key
Your DocuSign Integration Key must be configured for a JWT OAuth authentication flow:
* Create a public/private key pair for the key. Store the private key
  in a secure location. You can use a file or a key vault.
* The example require the private key. It can be stored in a
  file or provided as a variable (configuration setting `private_key`).
  Note, if it is provided as a variable then it will be
  temporarily stored in a file. A future release of the SDK will
  not require the use of a temp file for the private key.
* If you will be using individual permission grants, you must create a
  `Redirect URI` for the key. Any URL can be used. By default, this
  example uses `https://www.docusign.com`

### The impersonated user's guid
The JWT will impersonate a user within your account. The user can be
an individual or a user representing a group such as "HR".

Your application will need the guid assigned to the user.
The guid value for each user in your account is available from
the Administration tool in the **Users** section.

To see a user's guid, **Edit** the user's information.
On the **Edit User** screen, the guid for the user is shown as
the `API Username`.

### Reference documentation
Reference [documentation](https://docusign.github.io/eg-01-node-jwt/)
for the example is available.

### Test

Because the tests create envelopes using the
DocuSgn developer sandbox (demo) system,
you must create an integration key and configure
the example's `ds_configuration.js`
and `ds_private_key.txt` before runnning the tests.


Run the tests:

````
npm test
````

## Run the example

````
npm start
````
The example file executes several example tasks:
1. Send an html, Word, and PDF file in an envelope to be signed.
1. List the envelopes in the account that are less than 30 days old.
   The first of these envelopes will then be used for the remaining tasks.
1. Get an envelope's status.
1. List an envelope's recipients and their status.
1. Download an envelope's document(s).

### Debugging

````
npm run-script debug
````

## Support, Contributions, License

Submit support questions to [StackOverflow](https://stackoverflow.com). Use tag `docusignapi`.

Contributions via Pull Requests are appreciated.
All contributions must use the MIT License.

This repository uses the MIT license, see the
[LICENSE](https://github.com/docusign/eg-01-node-jwt/blob/master/LICENSE) file.
