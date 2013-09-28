var pg = require('../pg'),
    fs = require('fs'),
    logger = require('../../logger').data

module.exports = {
  load: function (localFile) {
  	logger.info('about to load taxonomy data into db')

    // modeled after https://github.com/brianc/node-postgres/wiki/Client#bulk-data-load
    var pgStream = pg.copyFrom('COPY taxonomy (a,b,c,d,e,f) FROM STDIN WITH CSV')
    pgStream.on('close', function () {
      logger.info("taxonomy data inserted sucessfully");
    });
    pgStream.on('error', function (error) {
      logger.error("taxonomy data DB insertion error", error);
    });

    contents = fs.readFileSync(__dirname+'/../../../data/nucc_taxonomy_131.csv', {encoding: 'utf8'});

    contents.toString().split('\n').forEach(function(line){
      console.log(line)
      pgStream.write(line)
    })

    pgStream.end()

  	return true;
  }
};
