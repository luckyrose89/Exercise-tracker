require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const shortId = require("short-id");
const cors = require("cors");
const person = require("./models/person");
const moment = require("moment");

const app = express();

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/exercise-track"
);

console.log(process.env.MONGODB_URI);

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Directory Index
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// App ROUTES

// POST request to create User in db
app.post("/api/exercise/new-user", (req, res) => {
  var username = req.body.username;
  person
    .findOne({
      username: username,
    })
    .then(
      (item) => {
        if (item) {
          res.send("username already taken");
        } else {
          var data = new person({
            username: username,
            userId: shortId.generate(),
          });

          data.save().then(
            (doc) => {
              res.json({
                username: doc.username,
                _id: doc.userId,
              });
            },
            (e) => {
              res.status(400).send(e);
            }
          );
        }
      },
      (e) => {
        res.status(400).send(e);
      }
    );
});

// POST request to add exercise
app.post("/api/exercise/add", (req, res) => {
  var userId = req.body.userId;
  var dateInput = "";

  if (req.body.date !== "") {
    dateInput = moment(req.body.date).format("YYYY-MM-DD");
  }

  person.findOne({ userId: userId }).then(
    (entry) => {
      if (entry) {
        entry.exercise = entry.exercise.concat({
          description: req.body.description,
          duration: req.body.duration,
          date: dateInput,
        });

        entry
          .save()
          .then((doc) => {
            res.json({
              username: entry.username,
              description:
                entry.exercise[entry.exercise.length - 1].description,
              duration: entry.exercise[entry.exercise.length - 1].duration,
              userId: entry.userId,
              date: entry.exercise[entry.exercise.length - 1].date,
            });
          })
          .catch((e) => {
            console.log(e);
          });
      } else {
        res.send("unknown _id");
      }
    },
    (e) => {
      res.status(400).send(e);
    }
  );
});

// GET request to view all users
app.get("/api/exercise/users", (req, res) => {
  var userList = [];
  person
    .find()
    .then((users) => {
      users.forEach((user) => {
        userList.push({
          username: user.username,
          _id: user.userId,
          _v: user._v,
        });
      });
      res.json(userList);
    })
    .catch((e) => {
      res.status(400).send(e);
    });
});

// GET request to view User's workout log
app.get("/api/exercise/log", (req, res) => {
  var userId = req.query.userId;
  person
    .findOne({ userId: userId })
    .then((item) => {
      if (item) {
        var exerciseList = item.exercise;
        var fromDate = req.query.from;
        var toDate = req.query.to;
        var limit = req.query.limit;

        if (moment(fromDate, "YYYY-MM-DD").isValid()) {
          exerciseList = exerciseList.filter((e) => e.date >= fromDate);
        } else if (moment(toDate, "YYYY-MM-DD").isValid()) {
          exerciseList = exerciseList.filter((e) => e.date <= toDate);
        }

        if (!isNaN(limit)) {
          exerciseList = exerciseList.slice(0, limit);
        }

        res.send({
          _id: item.userId,
          username: item.username,
          count: exerciseList.length,
          log: exerciseList,
        });
      } else {
        res.send("unknown _id");
      }
    })
    .catch((e) => {
      res.status(400).send(e);
    });
});

// Not found middleware
app.use((req, res, next) => {
  return next({
    status: 404,
    message: "not found",
  });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res.status(errCode).type("txt").send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
