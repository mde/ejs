const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const appRoutes = require("./router/app-routes");
// create an app instance
const app = express();
// Express body parser
app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: false,
    parameterLimit: 50000,
  })
);

// set ejs as view-engine
app.set("view engine", "ejs");

// setup public folder
app.use(express.static("./public"));

// app routes
app.use("/", appRoutes);

app.listen(3000, () => {
  console.log("app is listening to port 3000");
});
