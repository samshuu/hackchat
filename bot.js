var env = require('node-env-file');
env(__dirname + '/.env');

var wit = require('botkit-witai')({
    accessToken: process.env.wit_token,
    minConfidence: 0.6,
});

if (!process.env.page_token) {
    console.log('Error: Specify a Facebook page_token in environment.');
    process.exit(1);
}

if (!process.env.verify_token) {
    console.log('Error: Specify a Facebook verify_token in environment.');
    process.exit(1);
}

var Botkit = require('botkit');
var mongoStorage = require('botkit-storage-mongo')({mongoUri: 'mongodb://<admin>:<password1>@ds155730.mlab.com:55730/numchat'});

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.facebookbot({
    // debug: true,
    verify_token: process.env.verify_token,
    access_token: process.env.page_token,
    storage: mongoStorage
});

controller.middleware.receive.use(wit.receive);

// Set up an Express-powered webserver to expose oauth and webhook endpoints
var webserver = require(__dirname + '/components/express_webserver.js')(controller);

// Tell Facebook to start sending events to this application
require(__dirname + '/components/subscribe_events.js')(controller);

// Set up Facebook "thread settings" such as get started button, persistent menu
require(__dirname + '/components/thread_settings.js')(controller);


// Send an onboarding message when a user activates the bot
require(__dirname + '/components/onboarding.js')(controller);

// Load in some helpers that make running Botkit on Glitch.com better
require(__dirname + '/components/plugin_glitch.js')(controller);

// enable advanced botkit studio metrics
require('botkit-studio-metrics')(controller);

var normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./skills/" + file)(controller, wit);
});

