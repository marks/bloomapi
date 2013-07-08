var pg = require('../store/pg'),
		sql = require('sql'),
    connect = require('connect'),
    rest = require('connect-rest'),
    ga = require('nodealytics'),// TODO - add to package.json if project becomes dependent on this library
    os = require('os');

// Initialize server-side Google Analytics - used for tracking server-side events such as REST API calls
//    os.hostname() correlates to the unix `hostname` command and is used by GA under 'Content' > 'Hostname'
ga.initialize('UA-42296516-3', os.hostname())

// Set up connect and connect-rest middleware
var apiContext = '/api';
var connectRestOptions = {
  context: apiContext,
  logger: 'connect-rest',
  monitoring: {
    populateInterval: 5000,
    console: false,
    listener: function(data){
      console.log("Monitoring Metrics:",data)

      // TODO - if this works, move it into its own function or module (?)
      for(var page in data['*']){
        var pageData = data['*'][page]
        var action = 'Performance of '+page
        Object.keys(pageData).map(function(label){
          ga.trackEvent('API', action, label, pageData[label], false)
        })
      }

    }
  }
};

var app = connect()
  .use(connect.query() )
  .use(connect.logger('dev'))
  .use(connect.static(__dirname + '/../../www'))
  .use(connect.responseTime() )
  .use(function(req, res, next){
    next();
    res.on('header', function(){
      var value = parseInt(res.getHeader('X-Response-Time'))
      // todo - event needs to be tied to current page/query!
      ga.trackEvent('API', 'General', 'Response Time', res.getHeader('X-Response-Time'), false)
    });
  })
  .use(rest.rester( connectRestOptions ) )

// Define model using node-sql library - it helps us write SQL queries
var npiQueryableColumns = ['npi','provider_business_practice_location_address_postal_code','provider_last_name_legal_name']
var npi = sql.define({
	name: 'npis',
	columns: npiQueryableColumns
});

// End of server configuration, beginning of endpoint definitions

rest.get('/search', function api_search(req,content,callback){
  ga.trackPage('API - Search', apiContext+'/search', function (err, resp) {});
  ga.trackEvent('API', 'Search - Query URL', req.headers.originalUrl)

  var params = req.parameters;
	var sqlQuery = npi.where(npi.npi.isNotNull()).order(npi.npi); // default scope

	// if certain parameters are not specified, set them to their defaults
  var sqlLimit = ((params.limit === undefined) ? 100 : params.limit);
  sqlQuery = sqlQuery.limit(sqlLimit)
  var sqlOffset = ((params.offset === undefined) ?  0 : params.offset);
  sqlQuery = sqlQuery.offset(sqlOffset)

  // loop through query parameters and add conditions to SQL query as appropriate
	for(var key in params) {
		value = params[key];

		if(npiQueryableColumns.indexOf(key) != -1 && value != '') {
			switch(key){
				case 'npi':
					sqlQuery = sqlQuery.where(npi.npi.equal(value))
					break;
				case 'provider_business_practice_location_address_postal_code':
					sqlQuery = sqlQuery.where(npi.provider_business_practice_location_address_postal_code.like(value+'%'))
					break;
				case 'provider_last_name_legal_name':
					sqlQuery = sqlQuery.where(npi.provider_last_name_legal_name.equal(value))
					break;
			}
	  } else {
			// do nothing with this query parameter, either:
			//  a) user is not allowed to query on the specified column
			//  b) the value of the parameter an empty string ('')
		}
	}

  sqlQuery = sqlQuery.toQuery()
  var sqlQueryStartTime = Date.now()
	pg.query(sqlQuery.text, sqlQuery.values, function (err, result) {

    // log query time to google analytics for performance monitoring
    var sqlQueryEndTime = Date.now()
    var sqlQueryTime = sqlQueryEndTime - sqlQueryStartTime
    // todo - event needs to be tied to current page/query!
    ga.trackEvent('API', 'Search - DB', 'PgSQL Query Time', sqlQueryTime, false)

    result.rows.forEach(function (row) {
      for(var k in row) {
        if (row[k] === null) delete row[k];
      }
    });

    return callback(null,{
      meta: {
        rowCount: result.rowCount,
        sqlText: sqlQuery.text,
        sqlValues: sqlQuery.values,
        limit: sqlLimit,
        offset: sqlOffset
      },
      result:result.rows,
    });

  });

});

app.listen(3000);
console.log('Listening on port 3000');