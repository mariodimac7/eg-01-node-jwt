

// See https://mochajs.org/

const chai = require('chai')
    , expect = chai.expect
    , should = chai.should()
    , fs = require('fs')
    , docusign = require('docusign-esign')
    , DS_JWT_Auth = require('../lib/DS_JWT_Auth.js')
    , DS_Work = require('../lib/DS_Work.js')
    , ds_config = require('../ds_configuration.js').config
    , path = require('path')
    , _ = require('lodash')
    ;

const config_file = 'ds_configuration.js'
    , key_file = 'ds_private_key.txt'
    , config_file_path = './'
    ;

describe ('DS_Work', function(){
  it('#send_envelope_1 should work', async function(){
    this.timeout(30000); // 30 sec allows for the token to be acquired and the envelope to be created
    const ds_api = new docusign.ApiClient()
        , app_dir = '.'
        , ds_jwt_auth = new DS_JWT_Auth(ds_api, ds_config, app_dir)
        , ds_work = new DS_Work(ds_jwt_auth)
        ;

    let account_info =
      await ds_jwt_auth.find_account(ds_config.target_account_id);

    try {
      let results = await ds_work.send_envelope_1(ds_config);
      let worked = results.status === "sent" &&
            results.envelopeId.length > 10;
      expect(worked).to.equal(true);
    } catch (e) {
      // This catch statement provides more info on an API problem.
      // To debug mocha:
      // npm test -- --inspect --debug-brk
      let body = _.get(e, 'response.body', false);
      if (body) {
        // API problem
        console.log (`API problem: Status code ${e.response.status}, message body:
  ${JSON.stringify(body, null, 4)}`);
      }

      throw e; // an unexpected error has occured
    }
  })



})
