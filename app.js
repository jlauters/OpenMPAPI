
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

// process area response
var processAreaData = function(res) {

    var normalizedData = {};
    normalizedData.areas = [];
    $ = cheerio.load(res);

    // parse the tables for content
    var rows = $('table.centerElement').find('tr').filter( function() {
        if( ($(this).attr('bgcolor') == '#ffffff') || ($(this).attr('bgcolor') == '#f2f2f2') ) {
            return $(this);
        }
    });

    $(rows).each(function(idx, tr) {

        var link = '';
        var name = '';
        var area_location = [];

        var anchor = $(tr).find('a');
        var loc = $(tr).find('p.small > a');

        // area result <td>'s
        if(3 == tr.children.length) {

            link = 'http://www.mountainproject.com' + $(anchor).attr('href');
            name = $(anchor).html();

            $(loc).each(function(loc_idx, obj) {
                area_location.push({"link": $(obj).attr('href'), "name": $(obj).html()});
            });

            normalizedData.areas.push({
                "link": link, 
                "crag_name": name, 
                "location": area_location
            });

        }
    });

    return normalizedData;
}

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

    // parse the rows for data cells
    $(rows).each(function(idx, tr) {

        var link  = '';
        var name  = '';
        var grade = '';
        var stars = 0;
        var style = '';
        var route_location = [];

        var anchor = $(tr).find('a');
        var rating = $(tr).find('td').filter(function() {
            if($(this).attr('nowrap')) {
                return $(this).html();
            }
        });
        var type = $(tr).find('p.small');
        var loc = $(tr).find('p.small > a');

        // route results <td>'s
        if(5 == tr.children.length) {

            link = 'http://www.mountainproject.com' + $(anchor).attr('href');
            name = $(anchor).html();
            grade = rating[0].children[0].children[0].data;

            // .. little messy
            if(undefined !== rating[0].children[0].children[2]) {
                stars = rating[0].children[0].children[2].children[0].data;
                star_parts = stars.split('starsHtml');
                num_parts = star_parts[1].split(',');
                stars = num_parts[0].replace('(', '');
                style = type[0].children[0].data;
            }

            $(loc).each(function(loc_idx, obj) {
                route_location.push({"link": $(obj).attr('href'), "name": $(obj).html()});
            });

            normalizedData.routes.push({
                "link": link, 
                "route_name": name, 
                "grade": grade, 
                "stars": stars,
                "style": style,
                "location": route_location
            });
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
        path: '/scripts/Search.php?query='+encodeURIComponent(route)+'&Submit=Search&SearchSet=ROUTES',
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

    var area    = req.param('crag_name') || '';
    var callback = req.param('callback') || '';
    if(!area) {
        res.write('{"error" : "Provide area name."}');
        res.end();
    }

    var options = {
        host: 'mountainproject.com',
        port: 80,
        path: '/scripts/Search.php?query='+encodeURIComponent(area)+'&Submit=Search&SearchSet=AREAS',
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
                res.write(callback+'('+JSON.stringify(processAreaData(pageData))+');');
            } else {
                res.write(JSON.stringify(processAreaData(pageData)));
            }
            res.end();    
        });
    });
});
console.log("Express server listening on port " + 3232);
