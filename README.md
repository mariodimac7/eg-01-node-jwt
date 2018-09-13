# Example 1: Node.JS Service Integration

Repository: [eg-01-node-jwt](https://github.com/docusign/eg-01-node-jwt)

<!--
## Articles and Screencasts

* Guide: Using OAuth JWT flow with DocuSign.
* Screencast: Using OAuth JWT flow with DocuSign.
* Guide: Sending an envelope with the Node.JS SDK.
* Screencast: Sending an example with Node.JS SDK.
-->

## Screencasts

Two screencasts for this launcher and its examples are available:

* [Creating an Integration Key (a client id) for JWT authentication.][createIKvideo]
* [Installing and configuring the Node.JS JWT example launcher.][installVideo]

[![Create IK video][createIKvideoThumb]][createIKvideo]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[![Installation Video][installVideoThumb]][installVideo]


[createIKvideo]:https://docusigninc.box.com/s/44jbleni0zi3ol4i0ujqjmcobwogly3m
[installVideo]:https://docusigninc.box.com/s/hz90fje6e89spx2p9z0d9b19xxokrmmq
[installVideoThumb]:https://raw.githubusercontent.com/docusign/eg-01-node-jwt/master/assets/Video_cover_Installing_JWT_Node_200.png
[createIKvideoThumb]:https://raw.githubusercontent.com/docusign/eg-01-node-jwt/master/assets/Video_cover_creating_JWT_IK_200.png


## Introduction

This software is an example of a **System Integration**.
This type of application interacts with DocuSign on its
own. There is no user interface and no user is present
during normal operation.

The application uses the OAuth JWT grant flow to impersonate
a user in the account.

This launcher example includes two examples:
1. Send an html, Word, and PDF file in an envelope to be signed.
1. List the envelopes in the account that are less than 30 days old.

## Installation

Requirements: Node v8.10 or later

Download or clone this repository. Then:

````
cd eg-01-node-jwt
npm install
````

There are two ways to configure the example's settings:
1. Edit the `ds_config.js` file in the root directory
   of the example.
1. Set the environment variables before running the example. See the
   example environment variable file `Example_env_file.txt`.

   Recommendation: copy the file to a new file, `.env` Then
   configure the file and load its data into your terminal
   session to set the environment variables.

   `.env` is in `.gitignore`. This technique enables you to configure the software
   without including your private information in the repository.

### Creating the Integration Key
Your DocuSign Integration Key (clientId) must be configured for a JWT OAuth authentication flow:
* Create a public/private key pair for the key. Store the private key
  in a secure location. You can use a file or a key vault.
* The example requires the private key. Provide it as a
  string, as configuration setting `private_key`.

  Note, while the example is running, the key will be
  temporarily stored in a file. A future release of the SDK will
  not require the use of a temp file for the private key.
* If you will be using individual permission grants, you must create a
  `Redirect URI` for the key. Any URL can be used. By default, this
  example uses `https://www.docusign.com`
  This redirect url is just used for obtaining consent. You can
  use the docusign.com default in your test example.

  For production, DocuSign recommends using Organization administration
  to proactively grant consent to the client ID, the Integration Key.

### The impersonated user's guid
The JWT will impersonate a user within your account. The user can be
an individual or a user representing a group such as "HR".

Your application will need the guid assigned to the user.
The guid value for each user in your account is available from
the Administration tool in the **Users** section.

To see a user's guid, **Edit** the user's information.
On the **Edit User** screen, the guid for the user is shown as
the `API Username`.

## Run the examples

````
npm start
````

### Test

Because the tests create envelopes using the
DocuSign developer sandbox (demo) system,
you must create an integration key and configure
the example before running the tests.

Run the tests:

````
npm test
````

## Support, Contributions, License

Submit support questions to [StackOverflow](https://stackoverflow.com). Use tag `docusignapi`.

Contributions via Pull Requests are appreciated.
All contributions must use the MIT License.

This repository uses the MIT license, see the
[LICENSE](https://github.com/docusign/eg-01-node-jwt/blob/master/LICENSE) file.
