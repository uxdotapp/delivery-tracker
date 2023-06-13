#! /usr/bin/env node

var program = require('commander')
var tracker = require('../')

program
  .arguments('<tracecode>')
  .option('-c, --courier <courier>', 'Courier Namespace', /^(ASENDIA|KOREAPOST|ECARGO|FEDEX|PANTOS|RINCOS|AUSPOST|ROYALMAIL|USPS|CJKOREAEXPRESS|POSLAJU|YELLOEXPRESS|EFS|AIRBRIDGE|UPS|TNT|CESCO|XPOST|KERRYTHAI|SICEPAT|XIOEXPRESS|EPARCEL|LBC|JNT|DHL|CANADAPOST)$/i)
  .option('-k, --apikey <apikey>', 'API KEY')
  .action(async function (tracecode) {
    if (!tracker.COURIER[program.courier]) {
      console.error('The Company is not supported.')
      process.exit(1)
    } else if (!tracecode) {
      console.error('Please enter a tracecode.')
      process.exit(1)
    }

    var opts = {}
    if (program.apikey) {
      opts.apikey = program.apikey
    }

    var courier = tracker.courier(tracker.COURIER[program.courier].CODE, opts)
    const result = await courier.trace(tracecode);
    console.log(JSON.stringify(result, null, 2))
    process.exit(0)
  })
  .parse(process.argv)
