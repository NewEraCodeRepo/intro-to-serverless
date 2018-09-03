const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');

const PUPPIES_TABLE = process.env.PUPPIES_TABLE;

const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDb;
if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
  console.log(dynamoDb);
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
};

app.use(bodyParser.json({ strict: false }));

app.get('/', function (req, res) {
  res.send('Hello World!')
})

// Get Puppy endpoint
app.get('/puppies/:puppyId', function (req, res) {
  const params = {
    TableName: PUPPIES_TABLE,
    Key: {
      puppyId: req.params.puppyId,
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get puppy' });
    }
    if (result.Item) {
      const {puppyId, name} = result.Item;
      res.json({ puppyId, name });
    } else {
      res.status(404).json({ error: "Puppy not found" });
    }
  });
})

// Create Puppy endpoint
app.post('/puppies', function (req, res) {
  const { puppyId, name } = req.body;
  if (typeof puppyId !== 'string') {
    res.status(400).json({ error: '"puppyId" must be a string' });
  } else if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: PUPPIES_TABLE,
    Item: {
      puppyId: puppyId,
      name: name,
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create puppy' });
    }
    res.json({ puppyId, name });
  });
})

module.exports.handler = serverless(app);
