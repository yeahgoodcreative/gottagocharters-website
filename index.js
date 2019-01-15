// Modules
var express = require('express')
var app = express()

var fs = require('fs')
var mustache = require('mustache')
var mustacheExpress = require('mustache-express')

var bodyParser = require('body-parser')
var {body, validationResult} = require('express-validator/check')

var nodemailer = require('nodemailer')

// Nodemailer - Config
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'hello@truckcarrentals.com.au',
        pass: ''
    }
})

// Express - Config
app.use(express.static('public'))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

// Express - Main Routes
app.get('/', function(req, res) {
    res.render('index', {})
})

app.post('/contact', [
    // FIELD: Name
    body('name')
    .not().isEmpty(),

    // FIELD: Phone
    body('phone')
    .isMobilePhone(),

    // FIELD: Email
    body('email')
    .isEmail(),

    // FIELD: Pickup
    body('pickup')
    .not().isEmpty(),

    // FIELD: Destination
    body('destination')
    .not().isEmpty(),

    // FIELD: Passengers
    body('passengers')
    .isInt()
], 
function(req, res) {
    // Check for validation errors
    var errors = validationResult(req)

    // Check if errors list is empty
    if (!errors.isEmpty()) {
        // Send errors
        res.json({
            success: false,
            message: 'Please make sure all fields are filled correctly.',
            errors: errors.array()
        })
    }
    else {
        // Send email
        var mailOptionsClient = {
            from: '"Gotta Go Charters" <hello@gottagocharters.com.au>',
            to: req.body.email,
            subject: 'We will be with you shortly',
            html: mustache.render(fs.readFileSync('./views/email/toclient.mustache').toString(), {
                name: req.body.name
            })
        }

        var mailOptionsStaff = {
            from: '"Gotta Go Charters" <hello@gottagocharters.com.au>',
            to: 'belinda.black@truckcarrentals.com.au',
            replyTo: req.body.email,
            subject: 'You have a new enqiury from ' + req.body.name,
            html: mustache.render(fs.readFileSync('./views/email/tostaff.mustache').toString(), {
                name: req.body.name,
                phone: req.body.phone,
                email: req.body.email,
                pickup: req.body.pickup,
                destination: req.body.destination,
                passengers: req.body.passengers
            })
        }

        // Send email and get promise
        var clientEmailPromise = transporter.sendMail(mailOptionsClient)

        clientEmailPromise.then(function(resolve) {
            console.log(resolve)
            var staffEmailPromise = transporter.sendMail(mailOptionsStaff)

            staffEmailPromise.then(function(resolve) {
                console.log(resolve)
            })
        })

        // Send success
        res.json({
            success: true,
            message: 'Successfully processed contact form.'
        })
    }
})

// Express - Listener
app.listen(8080, function(){
    console.log('[INFO] Server listening on "localhost:8080".')
})