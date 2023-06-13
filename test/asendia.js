/* globals before it describe */

'use strict'

var assert = require('assert')

var prepare = require('./fixtures/prepare')
var tracker = require('..')

var courier = tracker.courier(tracker.COURIER.ASENDIA.CODE)

describe(tracker.COURIER.ASENDIA.NAME, function () {
  var deliveredNumber = 'TRACKING-NUMBER'

  before(function () {
    // @TODO add nock
  })

  it('delivered number', async function () {

    var result = await courier.trace(deliveredNumber);
    assert.equal(deliveredNumber, result.number)
    assert.equal(tracker.COURIER.ASENDIA.CODE, result.courier.code)
    assert.equal(tracker.STATUS.DELIVERED, result.status)
  })
})
