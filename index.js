const PORT = process.env.PORT || 5000;
const COMMUNITY_URL = process.env.COMMUNITY_URL;
const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const OAUTH_CALLBACK_URL = process.env.OAUTH_CALLBACK_URL;
const HOSTED_APP_URL = process.env.HOSTED_APP_URL;
const BG_FAKE = process.env.BG_FAKE;
const ORG_TEST_USER = process.env.ORG_TEST_USER;

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const request = require('request-promise');
const jsforce = require('jsforce');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const cp = require("child_process");

const app = express();

//App vars
let refreshToken = "";
let accessToken = "";
let sessionContact = "";
let defaultLoginResponse = {'frontdoor': null, 'cookie': {access_token: null, instance_url: null, 'identity': null} }

//Set up App
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

//Routes
app.get('/', function(req, res){ 

    res.render('index', {
        community_url: COMMUNITY_URL,
        consumer_key: CONSUMER_KEY,
        callback_url: OAUTH_CALLBACK_URL,
        background: BG_FAKE
    })
});

app.get('/server_callback', function(req, res){ 

    console.log("Server Callback query: "+ JSON.stringify(req.query));
    console.log("Server Callback: Requesting the access token...");

    //Parse query string

    var code = req.query.code;
    if (req.query.code != null) {
        code = decodeURI(code);
    } else {
        //If there is no auth code, such as after registration, 
        //then redirect back to main page and let them log in
        res.redirect('/');
    }

    var startURL = req.query.state;
    if (req.query.state != null) {
        startURL = decodeURI(startURL);
    }

    // Do OAuth auth code exchange from callback flow
    // Set up request body
    const body = {
        "code": code,
        "grant_type": "authorization_code",
        "client_id": CONSUMER_KEY,
        "client_secret": CONSUMER_SECRET,
        "redirect_uri": OAUTH_CALLBACK_URL
    }
    
    // Set up Callback
    const options = {
        method: 'POST',
        uri: COMMUNITY_URL + '/services/oauth2/token',
        form: body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }

    request(options).then(function (response){

        console.log("Server Callback: Retrieved the access token successfully.");

        //Parse response
        responseJSON = JSON.parse(response);

        console.log("Server Callback: Payload is..." + JSON.stringify(responseJSON));
        var identity = responseJSON.id;

        //Update refresh token
        accessToken = responseJSON.access_token;
        refreshToken = responseJSON.refresh_token;

        console.log("Server Callback: Requesting the identity data...");
        
        //Set up Callback
        const options = {
            method: 'GET',
            uri: identity + '?version=latest',
            body: body,
            json: true,
            followAllRedirects: true,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            }
        }

        request(options).then(function (response){
            
            console.log("Server Callback: Retrieved identity data successfully.");
            console.log("Server Callback: Creating redirect page.");

            var JSONidentityResponse = JSON.stringify(response);
            JSONidentityResponse.access_token = accessToken;
            const oneHourSeconds = 60 * 60;
            res.cookie('auth_token', accessToken,
                { maxAge: oneHourSeconds,
                    httpOnly: false,
                    secure: false
                    //secure: process.env.NODE_ENV === 'production'? true: false
                });

            console.log("Server Callback Identity Response: " + JSONidentityResponse);
            sessionContact = response.custom_attributes.ContactID;
            res.render('server_callback', {
                community_url: COMMUNITY_URL,
                consumer_key: CONSUMER_KEY,
                callback_url: OAUTH_CALLBACK_URL,
                start_url: startURL,
                hosted_app_url: HOSTED_APP_URL,
                identity_response: Buffer.from(JSONidentityResponse).toString("base64")
            }) 

        })

        .catch(function (err) {
            console.log(err);
        })

    })
    .catch(function (err) {
        console.log(err);
    })

}); 


app.get('/logout', function(req, res){ 

    //Clear persisted tokens
    accessToken = "";
    refreshToken = "";
    sessionContact = "";

    res.render('logout', {
        community_url: COMMUNITY_URL,
        consumer_key: CONSUMER_KEY,
        callback_url: OAUTH_CALLBACK_URL,
        background: BG_FAKE
    })

});

app.post('/login', function(req, resp){
    resp.setHeader('Content-Type', 'application/json');
    const username = req.body.username;
    const password = req.body.password;

    if (username && password) {
        doLogin( username, password, req, resp )
    }
});

const doLogin = function(username, password, req, resp) {
    doIdentity(username, password, req, resp);
}

const doIdentity = function(username, password, req, resp) {

    cp.exec("sfdx force:org:display -u " + username + " --json | ~/vendor/sfdx/jq/jq -r '.result'", (err, stdout) => {
        if (err) {
            console.log(err);
            resp.end(JSON.stringify(defaultLoginResponse) );

        } else {
            if( 'null' == stdout || null == stdout ) {
                console.log("JWT Identity: No sfdx org for user, attempting login...")
                doJWTLogin(username, password, req, resp);
            } else {
                const org = JSON.parse(stdout);
                if (org.accessToken && org.accessToken.startsWith('00D5e0000019feJ')) { //gmac demo org
                    console.log("JWT Identity: Access token obtained...")

                    defaultLoginResponse.frontdoor = COMMUNITY_URL + '/secur/frontdoor.jsp?sid=' + org.accessToken + '&retURL=/index';
                    defaultLoginResponse.cookie = {'accessToken': org.accessToken, 'instanceUrl': org.instanceUrl};

                    console.log("JWT Identity: Fetching profile information...")

                    new jsforce.Connection(defaultLoginResponse.cookie).identity(function (err, res) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("JWT Login: Identity received...")
                            defaultLoginResponse.cookie.identity = JSON.stringify(res);
                        }
                        console.log("JWT Identity: Returning AJAX response...");
                        resp.end(JSON.stringify(defaultLoginResponse));
                    });

                }
            }
        }
    });
}

const doJWTLogin = function(username, password, req, resp) {
//simplifying login access for a reusable pattern (a service account could be passed for User Provisioning)
    cp.exec("sfdx force:auth:jwt:grant -i $JWT_CLIENT_ID -f jwt.key -r $JWT_ORG_URL -s -u " + username, (err, stdout) => {
        console.log(stdout);
        if (stdout.startsWith("Successfully authorized")) {
            doIdentity(username, password, req, resp);
        } else {
            resp.end( JSON.stringify(defaultLoginResponse) );
        }
    });
}

//Run
app.listen(PORT, function () {
    console.log('>>>>>>>>>>>>  Listening on port ' + PORT);

    setTimeout( function() {
        fs.writeFile('jwt.key', process.env.JWT_CERT, function (err) {
            if (err) return console.log(err);
            console.log('jwt cert saved.');

            //cheat with a pre-login of demo user for speed improvement
            doJWTLogin(ORG_TEST_USER, '', {}, {end: function () {
                    console.log('JWT Login cached for test user');
                }});
        });
    }, 100);
});

