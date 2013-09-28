var fs = require('fs'),
    http = require('http'),
    logger = require('../../logger').data

module.exports = {
  fetch: function (localFile) {
  	logger.info('about to download taxonomy data')

	var file = fs.createWriteStream(localFile);
	var request = http.get("http://www.nucc.org/images/stories/CSV/nucc_taxonomy_131.csv", function(response) {
	  response.pipe(file);
	});

	return true;
  }
};
