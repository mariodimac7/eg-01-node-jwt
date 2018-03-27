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
cp example_ds_configuration.js ds_configuration.js
cp example_ds_private_key.txt ds_private_key.txt
````

* Edit file `ds_configuration.js` and fill in the information.
* Add your Integration Key's private key to `ds_private_key.txt`.

### Creating the Integration Key
Your Integration Key must be configured for a JWT OAuth authentication flow:
* Create a public/private key pair for the key. Store the private key
  in the `ds_private_key.txt` file.
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
./index.js
   or
npm start
````

### Debugging

````
npm run-script debug
````

## Support, Contributions, License

Submit support questions to [StackOverflow](https://stackoverflow.com). Use tag `docusignapi`.

Contributions via Pull Requests are appreciated.
All contributions must use the MIT License.

This repository uses the MIT license, see the LICENSE file.
