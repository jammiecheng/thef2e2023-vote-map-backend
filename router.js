const express = require("express");
const app = express();

const index = require("./routes/index");
app.use("/", index);

exports.allrouter = app;
