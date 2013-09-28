var pg = require('../pg'),
    fs = require('fs'),
    csv = require('csv'),
    logger = require('../../logger').data

module.exports = {
  load: function (localFile) {
  	logger.info('about to load taxonomy data into db')

    // modeled after https://github.com/brianc/node-postgres/wiki/Client#bulk-data-load
    // var pgStream = pg.copyFrom('COPY names (user_name, age) FROM STDIN WITH CSV')
    // pgStream.on('close', function () {
    //   logger.info("taxonomy data inserted sucessfully");
    // });
    // pgStream.on('error', function (error) {
    //   logger.error("taxonomy data DB insertion error", error);
    // });

    console.log(localFile)

    csv()
      .from.path(__dirname+'/../../.'+localFile,{encoding: 'utf8'})
      .to.array(function(row){
        console.log(row)
      });


    // pgStream.end()

  	return true;
  }
};
