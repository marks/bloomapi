// modeled after /lib/sources/npi/index.js
var shelljs = require('shelljs'),
    Q = require('q'),
    sourceMeta = require('../meta'),
    fetcher = require('./fetcher'),
    loader = require('./loader'),
    logger = require('../../logger').data;

module.exports = {
  update: function () {
    logger.warn('COMING SOON: updating taxonomy data');

    var localFile = './data/nucc_taxonomy_131.csv'

    sourceMeta.updating('Taxonomy data')
    	.then(fetcher.fetch(localFile))
    	.then(loader.load(localFile))

  }
}
