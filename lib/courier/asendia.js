'use strict'

var request = require('request')
var cheerio = require('cheerio')
const puppeteer = require('puppeteer');
var moment = require('moment')

var tracker = require('..')

var trackingInfo = function (number) {
  return {
    method: 'GET',
    url: 'https://a1.asendiausa.com/tracking/?trackingnumber=' + number
  }
}

var parser = {
  trace: function (body) {
    var $ = cheerio.load(body)
    var courier = {
      code: tracker.COURIER.ASENDIA.CODE,
      name: tracker.COURIER.ASENDIA.NAME
    }
    const number = $('.summary-original-tracking-number')?.text()?.trim();
    var result = {
      courier,
      number,
      status: tracker.STATUS.PENDING
    }

    var checkpoints = []
    var $history = $('.x-details').find('.accordion')
    $history.each((index, element) => {
      var checkpoint = {
        courier: courier,
        location: $(element).find('.mr-2')?.text()?.trim(),
        message: $(element).find('.card-body').text(),
        status: tracker.STATUS.IN_TRANSIT,
        // Thursday, March 2, 2023 11:06 AM
        time: moment(
          $(element).find('.asendia-lead').text().replace(/\s+/g, ' ')?.trim(),
          'dddd, MMMM D, YYYY h:mm A'
        ).format('YYYY-MM-DDTHH:mm')
      }

      if (checkpoint.message.includes('Shipment Information Received')) checkpoint.status = tracker.STATUS.INFO_RECEIVED;
      if (checkpoint.message.includes('Delivered')) checkpoint.status = tracker.STATUS.DELIVERED;
      if (checkpoint.message.includes('Label Cancelled')) checkpoint.status = tracker.STATUS.CANCELLED;

      checkpoints.push(checkpoint)
    })

    result.checkpoints = checkpoints
    result.status = tracker.normalizeStatus(result.checkpoints)

    return result
  }
}

module.exports = function (opts) {
  return {
    trackingInfo: trackingInfo,
    trace: async function (number, cb) {
      return new Promise(async (resolve, reject) => {

      try {
        var tracking = trackingInfo(number)

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(tracking.url);
        await page.waitForSelector('.loading', { hidden: true })
        const html = await page.content();
        var result = parser.trace(html);
        resolve(result);
      } catch (error) {
        cb(error);
      }
    })
    }
  }
}
