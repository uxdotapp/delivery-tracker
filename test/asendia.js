/* globals before it describe */

'use strict'

var assert = require('assert')

var prepare = require('./fixtures/prepare')
var tracker = require('..')

var courier = tracker.courier(tracker.COURIER.ASENDIA.CODE)

describe(tracker.COURIER.ASENDIA.NAME, function () {
  var deliveredNumber = '9842537BBFF3455CADF94CF19F37406C'

  before(function () {
    // @TODO add nock
  })

  it('delivered number', async function () {

    await courier.trace(deliveredNumber, async function (err, result) {
      assert.equal(err, null)
      assert.equal(deliveredNumber, result.number)
      assert.equal(tracker.COURIER.ASENDIA.CODE, result.courier.code)
      assert.equal(tracker.STATUS.DELIVERED, result.status)
    })
  })
})
