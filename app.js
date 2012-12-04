
/**
 * OpenMP API  2012
 * @author Jon Lauters
 */

var express = require('express')
  , http = require('http')
  , app = express()
  , server = http.createServer(app)
  , cheerio = require('cheerio');

// app configuration
app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname, 'public'));
});

// start the server
server.listen(3232);

// process route response
var processRouteData = function(res) {

    var normalizedData = {};
    normalizedData.routes = [];
    $ = cheerio.load(res);

    // parse the table rows for content
    var rows = $('table.centerElement').find('tr').filter( function() { 
        if( ($(this).attr('bgcolor') == '#ffffff') || ($(this).attr('bgcolor') == '#f2f2f2') ) {
            return $(this);
         }
    });

    if(!rows) { console.log('rows empty'); }

    // parse the rows for data cells
    $(rows).each(function(idx, tr) {

        var link  = '';
        var name  = '';
        var grade = '';

        var anchor = $(tr).find('a');
        var rating = $(tr).find('td').filter(function() {
            if($(this).attr('nowrap')) {
                return $(this).html();
            }
        });



        // route results <td>'s
        if(5 == tr.children.length) {

            // child[2] == rating / grade
            // child[3] == type / num_pitches / length
            // child[4] == location

            

            link = 'http://www.mountainproject.com' + $(anchor).attr('href');
            name = $(anchor).html();
            grade = rating[0].children[0].children[0].data

            normalizedData.routes.push({"link": link, "route_name": name, "grade": grade});
        }

    });

    return normalizedData;
}

// request a route
app.get('/route', function(req, res) {

    var route    = req.param('route_name') || '';
    var callback = req.param('callback') || '';
    if(!route) {
        res.write('{"error" : "Provide route name."}');
        res.end();
    }

    var options = {
        host: 'mountainproject.com',
        port: 80,
        path: '/scripts/Search.php?query='+route+'&Submit=Search&SearchSet=ROUTES',
        method: 'GET'
    };

    var req = http.get(options, function(r) {

        var pageData = "";
        r.setEncoding('utf8');
        r.on('data', function (chunk) {
            pageData += chunk;
        });

        r.on('end', function() {
            res.writeHead(200, {"Content-Type" : "application/json"});
            if(callback) {
                res.write(callback+'('+JSON.stringify(processRouteData(pageData))+');');
            } else {
                res.write(JSON.stringify(processRouteData(pageData)));
            }
            res.end();    
        });
    });
});

// request a crag
app.get('/crag', function(req, res) {

});
console.log("Express server listening on port " + 3232);
