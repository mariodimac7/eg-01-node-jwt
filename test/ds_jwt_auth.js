

// See https://mochajs.org/

const chai = require('chai')
    , expect = chai.expect
    , should = chai.should()
    , fs = require('fs')
    , docusign = require('docusign-esign')
    , ds_jwt_auth = require('../lib/ds_jwt_auth.js')
    , ds_js = require('../lib/ds_js.js')
    , path = require('path')
    , _ = require('lodash')
    , moment = require('moment')
    ;

const config_file = 'ds_configuration.js'
    , key_file = 'ds_private_key.txt'
    , config_file_path = './'
    ;

describe (`Configuration file ${config_file}`, function() {
  it('should exist', function() {
    let check_config_file = function() {
      fs.accessSync(path.resolve(config_file_path, config_file), fs.constants.R_OK)
    }
    expect(check_config_file).to.not.throw();
  })
})

describe (`Configuration file ${key_file}`, function() {
  it('should exist', function() {
    let check_config_file = function() {
      fs.accessSync(path.resolve(config_file_path, key_file), fs.constants.R_OK)
    }
    expect(check_config_file).to.not.throw();
  })
})

const ds_configuration = require('../ds_configuration.js').config

describe ('ds_jwt_auth', function(){

  before(function setup_ds_jwt_auth(){
    const ds_api = new docusign.ApiClient();
    ds_js.set_ds_config(ds_configuration, '.');
    ds_js.set_ds_api(ds_api);
    ds_jwt_auth.init();
  });

  it('#clear_token should clear its token', function(){
    ds_jwt_auth.clear_token();
    let token = ds_jwt_auth.test.get_token();
  })
  it('#clear_token should clear its token_expiration', function(){
    ds_jwt_auth.clear_token();
    let t = ds_jwt_auth.test.get_token_expiration();
    t.should.equal(false);
  })

  // See https://wietse.loves.engineering/testing-promises-with-mocha-90df8b7d2e35
  it('#check_token should fetch a token', async function(){
    ds_jwt_auth.clear_token();
    const result = await ds_jwt_auth.check_token();
    expect(result.token_received && result.token.length > 15).to.equal(true);
   })

  it('#check_token should reuse the token', async function(){
   const result = await ds_jwt_auth.check_token();
   let t = result.need_token === false &&
           result.token.length > 10 &&
           result.token_expiration.isAfter(moment());
   expect(t).to.equal(true);
  })


  it('#check_token should throw error if bad client_id', async function(){
    let cloned_ds_configuration = _.clone(ds_configuration);
    cloned_ds_configuration.client_id = 'foo';
    ds_js.set_ds_config(cloned_ds_configuration, '.');
    ds_jwt_auth.clear_token();
    try {
      const result = await ds_jwt_auth.check_token();
      expect(false).to.equal(true); // we should never get here!
    } catch(e) {
      let {name, message} = e;
      expect(   e.name === ds_jwt_auth.Error_JWT_get_token &&
             e.message === ds_jwt_auth.Error_invalid_grant).to.equal(true);
    }
  })



})
