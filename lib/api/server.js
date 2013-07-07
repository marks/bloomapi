var pg = require('../store/pg'),
		sql = require('sql'),
    connect = require('connect'),
    rest = require('connect-rest');

var app = connect();
app.use( connect.query() );

var connectRestOptions = {
  logger: 'connect-rest',
  logLevel: 'info',
  context: '/api',
  monitoring: {
    populateInterval: 5000,
    console: false
    ,listener: function(data){ console.log( "MONITORING METRICS == ", data); }
  }

};

app.use( rest.rester( connectRestOptions ) );
app.use( '/', connect.static(__dirname + '/../../www') );

// define model for node-sql (https://github.com/brianc/node-sql)
var npiQueryableColumns = ['npi','provider_business_practice_location_address_postal_code','provider_last_name_legal_name']
var npi = sql.define({
	name: 'npis',
	columns: npiQueryableColumns
});


rest.get('/search', api_search);
function api_search(req,content,callback){
  var params = req.parameters;
	var sqlQuery = npi.where(npi.npi.isNotNull()).order(npi.npi); // default scope

	// if params.limit is not specified, set to 1000
  var sqlLimit = ((params.limit === undefined) ? 100 : params.limit);
  sqlQuery = sqlQuery.limit(sqlLimit)

  // if params.offset is not specified, set to 0
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
			// - user is not allowed to query on the specified column
			// - the value of the parameter an empty string ('')
		}
	}

	sqlQuery = sqlQuery.toQuery()
	pg.query(sqlQuery.text, sqlQuery.values, function (err, result) {

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
}

app.listen(3000);
console.log('Listening on port 3000');
