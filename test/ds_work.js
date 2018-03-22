

// See https://mochajs.org/

const chai = require('chai')
    , expect = chai.expect
    , should = chai.should()
    , fs = require('fs')
    , docusign = require('docusign-esign')
    , ds_jwt_auth = require('../lib/ds_jwt_auth.js')
    , ds_js = require('../lib/ds_js.js')
    , ds_work = require('../lib/ds_work.js')
    , ds_configuration = require('../ds_configuration.js').config
    , path = require('path')
    , _ = require('lodash')
    ;

const config_file = 'ds_configuration.js'
    , key_file = 'ds_private_key.txt'
    , config_file_path = './'
    ;

describe ('ds_work', function(){
  it('#send_envelope_1 should work', async function(){
    this.timeout(30000); // 30 sec allows for the token to be acquired and the envelope to be created
    const ds_api = new docusign.ApiClient();
    ds_js.set_ds_config(ds_configuration, '.');
    ds_js.set_ds_api(ds_api);
    ds_jwt_auth.init();

    let account_info = await ds_js.set_account(ds_configuration.target_account_id)

    try {
      let results = await ds_work.send_envelope_1(ds_configuration);
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
