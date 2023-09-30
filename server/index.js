//customer é para alterar

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");
const app = express();
const apiPort = 4000;
const customers = require("./routes/customer-router");
const hydrogenPrices = require("./routes/hydrogenPrice-router");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());

db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api", customers);
app.use("/api", hydrogenPrices);

app.listen(apiPort, () => console.log(`Server running on port ${apiPort}`));
