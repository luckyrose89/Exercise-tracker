require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const shortId = require('short-id');
const cors = require('cors');
const person = require('./models/person');
const moment = require('moment');

const app = express();

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track', {
  useMongoClient: true
});

// Middleware

app.use(cors())

app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// App ROUTES

// POST request to create User in db
app.post('/api/exercise/new-user', (req, res) => {
  var username = req.body.username;
  person.findOne({
    'username': username
  }).then((item) => {
    if (item) {
      res.send('username already taken');
    } else {
      var data = new person({
        username: username,
        userId: shortId.generate()
      });

      data.save().then((doc) => {
        res.json({
          "username": doc.username,
          "userId": doc.userId
        });
      }, (e) => {
        res.status(400).send(e);
      });
    }
  }, (e) => {
    res.status(400).send(e);
  });
});

// POST request to add exercise
app.post('/api/exercise/add', (req, res) => {
  var userId = req.body.userId;
  var dateInput = '';
  
  if (req.body.date !== '') {
    dateInput = moment(req.body.date).format('YYYY-MM-DD');
  } 

  person.findOne({'userId': userId}).then((entry) => {
    if(entry) {
       entry.exercise = entry.exercise.concat({
        "description": req.body.description,
        "duration": req.body.duration,
        "date": dateInput
      });

      entry.save().then((doc) => {
        res.json({
          "username": entry.username,
          "userId": entry.userId,
          "exercise": entry.exercise[entry.exercise.length-1]
        });
      }).catch((e) => {
        console.log(e);
      });
    } else {
      res.send('unknown _id');
    }
  }, (e) => {
    res.status(400).send(e);
  });

});

// GET request to view User's workout log
app.get('/api/exercise/log/:userId', (req, res) => {
  res.send('route working');
});



// Not found middleware
app.use((req, res, next) => {
  return next({
    status: 404,
    message: 'not found'
  })
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})