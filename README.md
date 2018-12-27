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

A screencast for this launcher is available:

* [Creating an Integration Key (a client id) for JWT authentication.][createIKvideo]

[![Create IK video][createIKvideoThumb]][createIKvideo]


[createIKvideo]:https://www.youtube.com/watch?v=55j4eZLK5Hg
[installVideo]:https://www.youtube.com/watch?v=pqpj5j_oXU8
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
1. Edit the `dsConfig.js` file in the root directory
   of the example.
1. Set environment variables before running the example. 

### Creating the Integration Key
Your DocuSign Integration Key (clientId) must be configured for a JWT OAuth authentication flow:
* Create a public/private key pair for the key. Store the private key
  in a secure location. You can use a file or a key vault.
* The example requires the private key. Provide it as a
  string, as configuration setting `privateKey`.

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

## Support, Contributions, License

Submit support questions to [StackOverflow](https://stackoverflow.com). Use tag `docusignapi`.

Contributions via Pull Requests are appreciated.
All contributions must use the MIT License.

This repository uses the MIT license, see the
[LICENSE](https://github.com/docusign/eg-01-node-jwt/blob/master/LICENSE) file.
