

// See https://mochajs.org/

const chai = require('chai')
    , expect = chai.expect
    , should = chai.should()
    , fs = require('fs')
    , docusign = require('docusign-esign')
    , DS_JWT_Auth = require('../lib/ds_jwt_auth.js')
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

const ds_config = require('../ds_configuration.js').config

describe ('ds_jwt_auth', function(){

  let ds_jwt_auth;
  const app_dir = '.';

  before(function setup_ds_jwt_auth(){
    const ds_api = new docusign.ApiClient();
    ds_jwt_auth = new DS_JWT_Auth(ds_api, ds_config, app_dir);
  });

  it('#clear_token should clear its token', function(){
    ds_jwt_auth.clear_token();
    let token = ds_jwt_auth.test.get_token();
    token.should.equal(false);
  })
  it('#clear_token should clear its token_expiration', function(){
    ds_jwt_auth.clear_token();
    let t = ds_jwt_auth.test.get_token_expiration();
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
    let cloned_ds_configuration = _.clone(ds_configuration);
    cloned_ds_configuration.client_id = 'foo';
    ds_jwt_auth = new DS_JWT_Auth(ds_api, cloned_ds_configuration, app_dir);
    try {
      const result = await ds_jwt_auth.check_token();
      expect(false).to.equal(true); // we should never get here!
    } catch(e) {
      let {name, message} = e;
      expect(   e.name === ds_jwt_auth.Error_JWT_get_token &&
             e.message === ds_jwt_auth.Error_invalid_grant).to.equal(true);
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
