

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
    ;

const config_file = 'ds_configuration.js'
    , key_file = 'ds_private_key.txt'
    , config_file_path = './'
    , ds_configuration = require('../ds_configuration.js').config
    ;

describe ('ds_js', function(){

  let good_account_id;

  before(function setup_ds_js(){
    const ds_api = new docusign.ApiClient();
    ds_js.set_ds_config(ds_configuration, '.');
    ds_js.set_ds_api(ds_api);
    ds_jwt_auth.init();
  });

  it('account_id should initially be null', () => {
    expect(ds_js.get_account_id()).be.null;
  })
  it('account_name should initially be null', () => {
    expect(ds_js.get_account_name()).be.null;
  })
  it('base_uri should initially be null', () => {
    expect(ds_js.get_base_uri()).be.null;
  })

  it('#set_account should find default account', async function(){
    this.timeout(8000);
    const result = await ds_js.set_account(false);
    let {account_id, account_name, base_uri} = result;
    let user = ds_js.get_user();
    // Find default account from user information
    let default_account_info = _.find(user.accounts, 'is_default');
    good_account_id = account_id; // save for next test
    expect(default_account_info.account_id).to.equal(account_id);
  })

  it('#set_account should find specific account', async function(){
    this.timeout(8000);
    const result = await ds_js.set_account(good_account_id);
    let {account_id, account_name, base_uri} = result;
    expect(account_id).to.equal(good_account_id);
  })

  it('#set_account should throw error if bad account_id', async function(){
    this.timeout(8000);
    try {
      const result = await ds_js.set_account('foo');
      expect(false).to.equal(true); // we should never get here!
    } catch(e) {
      let {name, message} = e;
      expect(   name === ds_js.Error_set_account &&
             message === ds_js.Error_account_not_found).to.equal(true);
    }
  })


})
