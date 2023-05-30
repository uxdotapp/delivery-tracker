"use strict";

var request = require("request");
var cheerio = require("cheerio");
var moment = require("moment");

var tracker = require("../");

var trackingInfo = function (number) {
  return {
    method: "GET",
    url: `https://wwwapps.ups.com/WebTracking/track?track=yes&trackNums=${number}&loc=en_si&requester=ST/trackdetails`,
  };
};

var parser = {
  trace: function (body) {
    var $ = cheerio.load(body);
    var courier = {
      code: tracker.COURIER.UPS.CODE,
      name: tracker.COURIER.UPS.NAME,
    };
    var result = {
      courier: courier,
      number: $("#stApp_trackingNumber").val().trim(),
      status: tracker.STATUS.PENDING,
    };

    var checkpoints = [];
    var $delivered = $("#st_App_DelvdLabel");
    if ($delivered) {
      const dateText = $('#st_App_PkgStsMonthNum').text().trim();
      const timeText = $('#st_App_PkgStsTime').text().trim();
      const dateRegex = /[A-Za-z]+,\s+([A-Za-z]+)\s+(\d+)/;
      const timeRegex = /(\d+:\d+)/;
      const [, month, day] = dateRegex.exec(dateText);
      const [, time] = timeRegex.exec(timeText);

      var checkpoint = {
        courier: courier,
        location: $("#stApp_txtAddress").text().trim(),
        message: 'Delivered',
        status: tracker.STATUS.DELIVERED,
        time:  moment(`${month} ${day} ${time}`, 'MMMM DD HH:mm').format('YYYY-MM-DDTHH:mm'),
      };
      checkpoints.push(checkpoint);
    }

    result.checkpoints = checkpoints;
    result.status = tracker.normalizeStatus(result.checkpoints);

    return result;
  },
};

module.exports = function (opts) {
  return {
    trackingInfo: trackingInfo,
    trace: function (number, cb) {
      var tracking = trackingInfo(number);
      request.get({ url: tracking.url }, function (err, res, body) {
        if (err) {
          return cb(err);
        }

        try {
          var result = parser.trace(body);
          cb(
            result ? null : tracker.error(tracker.ERROR.INVALID_NUMBER),
            result
          );
        } catch (e) {
          cb(tracker.error(e.message));
        }
      });
    },
  };
};
