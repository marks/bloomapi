var shelljs = require('shelljs'),
    logger = require('../../logger').data

module.exports = {
  fetch: function (localFile) {
  	logger.info('about to download taxonomy data')

  	// using curl temporarily as was having issues saving to file, not sure why though
	shelljs.exec('curl http://nucc.org/images/stories/CSV/nucc_taxonomy_131.csv -o '+localFile);

  }
};
