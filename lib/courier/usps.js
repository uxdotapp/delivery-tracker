"use strict";

var request = require("request-promise");
var cheerio = require("cheerio");
var moment = require("moment");

var tracker = require("../");

var trackingInfo = function (number) {
  return {
    method: "GET",
    url:
      "https://tools.usps.com/go/TrackConfirmAction.action?tLabels=" + number,
  };
};

var parser = {
  trace: function (body) {
    var $ = cheerio.load(body);
    var courier = {
      code: tracker.COURIER.USPS.CODE,
      name: tracker.COURIER.USPS.NAME,
    };
    var result = {
      courier: courier,
      number: $("input[name=label]").val().trim(),
      status: tracker.STATUS.PENDING,
    };

    var checkpoints = [];
    var $history = $(".tracking-progress-bar-status-container").find(
      ".tb-step"
    );

    $history.each((index, element) => {
      if (
        element.attribs &&
        (element.attribs.class || "").indexOf("toggle-history-container") !== -1
      ) {
        return;
      }

      var checkpoint = {
        courier: courier,
        location: $(element).find(".tb-location").text().trim(),
        message: $(element).find(".tb-status-detail").text(),
        status: tracker.STATUS.IN_TRANSIT,
        // November 17,      2017,  3:08 pm
        time: moment(
          $(element).find(".tb-date").text().replace(/\s+/g, " ").trim(),
          "MMMM DD, YYYY, hh:mm a"
        ).format("YYYY-MM-DDTHH:mm"),
      };

      if (checkpoint.message.includes("Pre-Shipment Info Sent to USPS"))
        checkpoint.status = tracker.STATUS.PENDING;
      if (checkpoint.message.includes("Shipping Label Created"))
        checkpoint.status = tracker.STATUS.INFO_RECEIVED;
      if (checkpoint.message.includes("Delivered"))
        checkpoint.status = tracker.STATUS.DELIVERED;
      if (checkpoint.message.includes("Label Cancelled"))
        checkpoint.status = tracker.STATUS.CANCELLED;

      checkpoints.push(checkpoint);
    });

    result.checkpoints = checkpoints;
    result.status = tracker.normalizeStatus(result.checkpoints);

    return result;
  },
};

module.exports = function (opts) {
  return {
    trackingInfo: trackingInfo,
    trace: async function (number) {
      const tracking = trackingInfo(number);

      try {
        const response = await request.get({ url: tracking.url });
        const result = parser.trace(response);
        return result;
      } catch (error) {
        throw error;
      }
    },
  };
};
