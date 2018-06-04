

// See https://mochajs.org/

const chai = require('chai')
    , expect = chai.expect
    , should = chai.should()
    , fs = require('fs')
    , docusign = require('docusign-esign')
    , DS_JWT_Auth = require('../lib/DS_JWT_Auth.js')
    , path = require('path')
    , _ = require('lodash')
    , moment = require('moment')
    ;

const config_file = 'ds_configuration.js'
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

const ds_config = require('../ds_configuration.js').config

describe (`The configuration settings`, function() {

  it('Integration Key must be set', function(){
    let ik = ds_config.client_id,
        good_ik = ik && ik.length > 10;
    good_ik.should.equal(true);
  })

  it('User Id in guid format must be set', function(){
    let guid = ds_config.impersonated_user_guid,
      good = guid && guid.length > 15;
    good.should.equal(true);
  })

  it('Private Key must be set', function(){
    let private_key = ds_config.private_key,
        good = private_key && private_key.length > 50;
    good.should.equal(true);
  })

})


describe ('DS_JWT_Auth', function(){

  let ds_jwt_auth;
  const app_dir = '.';

  before(function setup_ds_jwt_auth(){
    const ds_api = new docusign.ApiClient();
    ds_jwt_auth = new DS_JWT_Auth(ds_api, ds_config, app_dir);
  });

  it('#clear_token should clear its token', function(){
    ds_jwt_auth.clear_token();
    let token = ds_jwt_auth.test_get_token();
    token.should.equal(false);
  })
  it('#clear_token should clear its token_expiration', function(){
    ds_jwt_auth.clear_token();
    let t = ds_jwt_auth.test_get_token_expiration();
    t.should.equal(false);
  })

  // See https://wietse.loves.engineering/testing-promises-with-mocha-90df8b7d2e35
  it('#check_token should fetch a token', async function(){
    ds_jwt_auth.clear_token();
    this.timeout(8000);
    const result = await ds_jwt_auth.check_token();
    expect(result.token_received && result.token.length > 15).to.equal(true);
   })

  it('#check_token should reuse the token', async function(){
    this.timeout(8000);
    const result = await ds_jwt_auth.check_token();
    let t = result.need_token === false &&
           result.token.length > 10 &&
           result.token_expiration.isAfter(moment());
    expect(t).to.equal(true);
  })

  it('#check_token should throw error if bad client_id', async function(){
    this.timeout(8000);
    let ds_api = ds_jwt_auth.get_ds_api()
      , cloned_ds_config = _.clone(ds_config);
    cloned_ds_config.client_id = 'foo';
    let my_ds_jwt_auth = new DS_JWT_Auth(ds_api, cloned_ds_config, app_dir);
    try {
      const result = await my_ds_jwt_auth.check_token();
      expect(false).to.equal(true); // we should never get here!
    } catch(e) {
      let {name, message} = e;
      expect(   e.name === my_ds_jwt_auth.Error_JWT_get_token &&
             e.message === my_ds_jwt_auth.Error_invalid_grant).to.equal(true);
    }
  })

  it('account_id should initially be null', () => {
    expect(ds_jwt_auth.get_account_id()).be.null;
  })
  it('account_name should initially be null', () => {
    expect(ds_jwt_auth.get_account_name()).be.null;
  })
  it('base_uri should initially be null', () => {
    expect(ds_jwt_auth.get_base_uri()).be.null;
  })

  let good_account_id; // will be used in multiple tests

  it('#find_account should find default account', async function(){
    this.timeout(8000);
    const result = await ds_jwt_auth.find_account(false);
    let {account_id, account_name, base_uri} = result;
    let user = ds_jwt_auth.get_user();
    // Find default account from user information
    let default_account_info = _.find(user.accounts, 'is_default');
    good_account_id = account_id; // save for next test
    expect(default_account_info.account_id).to.equal(account_id);
  })

  it('#find_account should find specific account', async function(){
    this.timeout(8000);
    const result = await ds_jwt_auth.find_account(good_account_id);
    let {account_id, account_name, base_uri} = result;
    expect(account_id).to.equal(good_account_id);
  })

  it('#find_account should throw error if bad account_id', async function(){
    this.timeout(8000);
    try {
      const result = await ds_jwt_auth.find_account('foo');
      expect(false).to.equal(true); // we should never get here!
    } catch(e) {
      let {name, message} = e;
      expect(   name === ds_jwt_auth.Error_set_account &&
             message === ds_jwt_auth.Error_account_not_found).to.equal(true);
    }
  })


})
