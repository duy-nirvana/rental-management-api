var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var multer = require("multer");
const connectDB = require("./app/config/db");
var indexRouter = require("./app/routes/index");
var usersRouter = require("./app/routes/users");
var roomsRouter = require("./app/routes/rooms");
var tenantsRouter = require("./app/routes/tenants");
var invoicesRouter = require("./app/routes/invoices");

var app = express();

// Connect to MongoDB
connectDB();

// view engine setup
app.set("views", path.join(__dirname, "app/views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(multer().none()); // parse multipart/form-data (text fields only)
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/rooms", roomsRouter);
app.use("/tenants", tenantsRouter);
app.use("/invoices", invoicesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
