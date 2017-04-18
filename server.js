var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var mongo = require('mongodb').MongoClient;

var app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + '/public'));

app.get('/new/:original(*)', function(req, res) {
    var url = req.params.original;
    var regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;
    if (regex.test(url)) {
        mongo.connect(MONGOLAB_URI, function(err, db) {
            if (err) {
                res.send('There was an error connecting to the database - please try again.');
            }
            var shortUrls = db.collection('shorturls');
            var short = Math.floor(Math.random() * 10000).toString();
            var newDoc = {
                original: url,
                short: short
            };
            shortUrls.insert(newDoc);
            shortUrls.find({original: url}, {_id: 0}).toArray(function(err, result) {
                if (err) {
                    res.send('There was an error connecting to the database - please try again.');
                }
                res.json(result[0]);
                db.close();
            });
        });
    } else {
        res.json(
            {
                error: 'Your url was invalid - please enter a valid url.'
            }
        );
    }
});

app.get('/:short', function(req, res) {
    var short = req.params.short;
    mongo.connect(MONGOLAB_URI, function(err, db) {
        var shortUrls = db.collection('shorturls');
        shortUrls.find({short: short}).toArray(function(err, result) {
            if (err) {
                res.send('There was an error connecting to the database.');
            }
            if (result.length == 0) {
                res.json(
                    {
                        error: 'There is no such short url in the database - please try again.'
                    }
                );
            } else {
                var tempResult = result[0].original;
                if (tempResult.includes('https') || tempResult.includes('http')) {
                    res.redirect(301, tempResult)
                } else {
                    var finalResult = 'http://' + tempResult;
                    res.redirect(301, finalResult);
                }
            }
            db.close();
        });
    });
});

app.listen(process.env.PORT || 8000, function() {
    console.log('Server is running...');
});