const express = require("express");
const cors = require("cors");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

const dbUrl =
  "mongodb://I PUT MY ACTUAL INFO INTO GIT:HERE! LOL!@localhost:27017";
const dbName = "runclub";
const client = new MongoClient(dbUrl, { useUnifiedTopology: true });

// Create a new Express app
const app = express();

// Accept cross-origin requests from the frontend app
app.use(cors({ origin: "http://localhost:3000" }));

// Use json-parsing middleware included in 4.15^
app.use(express.json());

// Set up Auth0 configuration
const authConfig = {
  domain: "twitchkidd.auth0.com",
  audience: "https://api.trailcity.net",
};

// Define middleware that validates incoming bearer tokens
// using JWKS from twitchkidd.auth0.com
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithm: ["RS256"],
});

// Define an endpoint that must be called with an access token
app.get("/api/external", checkJwt, (req, res) => {
  res.send({
    msg: "Your Access Token was successfully validated!",
  });
});

app.put("/api/new-run", checkJwt, (req, res) => {
  console.log(req.body);
  res.send({
    msg: "PUT successful!",
  });
});

app.get("/api/drop-runs-collection", checkJwt, (req, res) => {
  client.connect((err) => {
    assert.equal(null, err);
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    dropRunsCollection(db, () => {
      client.close();
    });
    res.send({ msg: "DROP sucessful" });
  });
});

// Start the app
app.listen(3001, () => console.log("API listening on 3001"));

const dropRunsCollection = (db, callback) => {
  const collection = db.collection("runs");
  collection.drop((err, result) => {
    assert.equal(err, null);
    assert.equal(db.collections, 0);
    callback(result);
  });
};

const insertDocuments = (db, callback) => {
  const collection = db.collection("runs");
  collection.insertMany([{ a: 1 }, { a: 2 }, { a: 3 }], (err, result) => {
    assert.equal(err, null);
    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted 3 documents into the collection");
    callback(result);
  });
};

const findDocuments = (db, callback) => {
  const collection = db.collection("runs");
  collection.find({}).toArray((err, docs) => {
    assert.equal(err, null);
    console.log("Found the following docs:");
    console.log(docs);
    callback(docs);
  });
};

const findDocumentsWithFilter = (db, callback) => {
  const collection = db.collection("runs");
  collection.find({ a: 3 }).toArray((err, docs) => {
    assert.equal(err, null);
    console.log("Found the following records:");
    console.log(docs);
    callback(docs);
  });
};

const updateDocument = (db, callback) => {
  const collection = db.collection("runs");
  collection.updateOne({ a: 2 }, { $set: { b: 1 } }, (err, result) => {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    console.log(result);
    console.log("Updated the document with the field of a equal to 2");
    callback(result);
  });
};

const removeDocument = (db, callback) => {
  const collection = db.collection("runs");
  collection.deleteOne({ a: 3 }, (err, result) => {
    assert.equal(err, null);
    assert.equal(1, result.result.n);
    console.log("Removed the document with the field a equal to 3");
    callback(result);
  });
};

const indexCollection = (db, callback) => {
  db.collection("runs").createIndex({ a: 1 }, null, (err, results) => {
    console.log(results);
    callback();
  });
};

const getDbStats = (db, callback) => {
  db.command({ dbStats: 1 }, (err, results) => {
    console.log(results);
    callback();
  });
};

client.connect(function (err) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
  const db = client.db(dbName);
  getDbStats(db, () => {
    client.close();
  });
});
