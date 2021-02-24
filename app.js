//Ryan Durand Feb 19, 2021

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = ''; // Your client id
var client_secret = ''; // Your secret
var redirect_uri = 'https://spotify-favorites-retriever.herokuapp.com/callback'; // Your redirect uri

var artistStringShort = "";
var artistStringMed = "";
var artistStringLong = "";
var trackStringShort = "";
var trackStringMed = "";
var trackStringLong = "";
var artists = "";
var tracks = "";
var aristIMG = "";

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  //certain methods require certain scopes ex: top artists/tracks need user-top-read
  var scope = 'user-read-private user-read-email user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        res.writeHead(200, {
          "Content-Type": "text/html"
        });

        var access_token = body.access_token,
          refresh_token = body.refresh_token;

        var topArtistsShort = {
          url: 'https://api.spotify.com/v1/me/top/artists?time_range=short_term',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          json: true
        };

        var topArtistsMed = {
          url: 'https://api.spotify.com/v1/me/top/artists?time_range=medium_term',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          json: true
        };

        var topArtistsLong = {
          url: 'https://api.spotify.com/v1/me/top/artists?time_range=long_term',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          json: true
        };

        var topTracksShort = {
          url: 'https://api.spotify.com/v1/me/top/tracks?time_range=short_term',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          json: true
        };

        var topTracksMed = {
          url: 'https://api.spotify.com/v1/me/top/tracks?time_range=medium_term',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          json: true
        };

        var topTracksLong = {
          url: 'https://api.spotify.com/v1/me/top/tracks?time_range=long_term',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          json: true
        };

        request.get(topTracksShort, function(error, response, body) {
          artistStringShort = "<h1>Top Artists (Past 4 Weeks):</h1> <br>";
          artistStringMed = "<h1>Top Artists (Past 6 Months):</h1> <br>";
          artistStringLong = "<h1>Top Artists (Past several years):</h1> <br>";
          trackStringShort = "<h1>Top Tracks (Past 4 Weeks):</h1> <br>";
          trackStringMed = "<h1>Top Tracks (Past 6 Months):</h1> <br>";
          trackStringLong = "<h1>Top Tracks (Past several years):</h1> <br>";
          for (var i = 0; i < 20; i++) {
            tracks = body.items[i].name;
            trackStringShort = trackStringShort.concat(i + 1 + ". " + tracks + "<br>");
            artistIMG = '<img src="' + body.items[i].album.images[0].url + '" width="100" length="100"/> <br>';
            trackStringShort = trackStringShort.concat(artistIMG);
          }
          res.write(trackStringShort);
          res.write("<br>");

          request.get(topTracksMed, function(error, response, body) {
            for (var i = 0; i < 20; i++) {
              tracks = body.items[i].name;
              trackStringMed = trackStringMed.concat(i + 1 + ". " + tracks + "<br>");
              artistIMG = '<img src="' + body.items[i].album.images[0].url + '" width="100" length="100"/> <br>';
              trackStringMed = trackStringMed.concat(artistIMG);
            }
            res.write(trackStringMed);
            res.write("<br>");

            request.get(topTracksLong, function(error, response, body) {
              for (var i = 0; i < 20; i++) {
                tracks = body.items[i].name;
                trackStringLong = trackStringLong.concat(i + 1 + ". " + tracks + "<br>");
                artistIMG = '<img src="' + body.items[i].album.images[0].url + '" width="100" length="100"/> <br>';
                trackStringLong = trackStringLong.concat(artistIMG);
              }
              res.write(trackStringLong);
              res.write("<br>");

              request.get(topArtistsShort, function(error, response, body) {
                for (var i = 0; i < 20; i++) {
                  artists = body.items[i].name;
                  artistStringShort = artistStringShort.concat(i + 1 + ". " + artists + "<br>");
                  artistIMG = '<img src="' + body.items[i].images[0].url + '" width="100" length="100"/> <br>';
                  artistStringShort = artistStringShort.concat(artistIMG);
                }
                res.write(artistStringShort);
                res.write("<br>");

                request.get(topArtistsMed, function(error, response, body) {
                  for (var i = 0; i < 20; i++) {
                    artists = body.items[i].name;
                    artistStringMed = artistStringMed.concat(i + 1 + ". " + artists + "<br>");
                    artistIMG = '<img src="' + body.items[i].images[0].url + '" width="100" length="100"/> <br>';
                    artistStringMed = artistStringMed.concat(artistIMG);
                  }
                  res.write(artistStringMed);
                  res.write("<br>");

                  request.get(topArtistsLong, function(error, response, body) {
                    for (var i = 0; i < 20; i++) {
                      artists = body.items[i].name;
                      artistStringLong = artistStringLong.concat(i + 1 + ". " + artists + "<br>");
                      artistIMG = '<img src="' + body.items[i].images[0].url + '" width="100" length="100"/> <br>';
                      artistStringLong = artistStringLong.concat(artistIMG);
                    }
                    res.write(artistStringLong);
                    res.write("<br>");
                    res.send();
                  });
                });
              });
            });
          });
        });

        // we can also pass the token to the browser to make requests from there
        //   res.redirect('/#' +
        //     querystring.stringify({
        //       access_token: access_token,
        //       refresh_token: refresh_token
        //     }));
        // } else {
        //   res.redirect('/#' +
        //     querystring.stringify({
        //       error: 'invalid_token'
        //     }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Server is running");
});
