const mysql = require("mysql");
const express = require("express");
const session = require("express-session");
const path = require("path");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "p@ssw0rd",
  database: "simplelogin",
});

const app = express();

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "static")));

app.set("view engine", "ejs");

var incorrectCredentials = false;

// Establish connection to the mySQL database
db.connect(function (err) {
  if (err) throw err;
  console.log("Successful connection to mySQL!");
});

// Send user login page
app.get("/", function (request, response) {
  response.render("pages/login", {
    incorrectCredentials,
  });
});

// Authenticate the user
app.post("/auth", function (request, response) {
  incorrectCredentials = false;
  let username = request.body.username;
  let password = request.body.password;
  console.log(username + " " + password);

  if (username && password) {
    db.query(
      // Original (non-vulnerable) query:
      //"SELECT * FROM users WHERE username = ? AND pword = ?",
      //[username, password],
      'SELECT * FROM users WHERE username ="' +
        username +
        '" AND pword ="' +
        password +
        '"',
      function (error, results) {
        if (error) throw error;

        if (results.length > 0) {
          request.session.loggedin = true;
          request.session.username = username;
          response.redirect("/userpage");
        } else {
          incorrectCredentials = true;
          response.redirect("/");
        }
        response.end();
      }
    );
  } else {
    response.end();
  }
});

app.get("/userpage", function (request, response) {
  if (request.session.loggedin) {
    response.render("pages/userpage", {
      username: request.session.username,
    });
  } else {
    response.send("Please login to view this page.");
  }
  response.end();
});

app.get("/logout", function (request, response) {
  request.session.destroy();
  response.redirect("/");
});

app.listen(3000);
