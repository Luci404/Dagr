
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const { json } = require('body-parser')

const port = 3000
const app = express()

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var userData = {}

function LoadUserData() {
  fs.readFile("./database.json", "utf8", (err, jsonString) => {
    if (err) {
      console.log("File read failed:", err);
      return;
    }
    try {
      userData = JSON.parse(jsonString);
    } catch (err) {
      console.log("Error parsing JSON string:", err);
    }
  });
}

function SaveUserData() {
  const jsonString = JSON.stringify(userData)
  fs.writeFile('./database.json', jsonString, err => {
    if (err) {
      console.log('Error writing file', err)
    } else {
      console.log('Successfully wrote file')
    }
  })
}

LoadUserData();

app.get('/', (req, res) => {
  res.sendFile('./index.html', { root: __dirname })
})

app.get('/nutrition', (req, res) => {
  res.sendFile('./nutrition.html', { root: __dirname })
})

app.post('/nutrition/addsource', urlencodedParser, function (req, res) {
  console.log(req.body)
  
  userData.nutrition.sources.push({ 
    name: req.body.name, 
    calories: parseInt(req.body.calories)
  })
  
  SaveUserData();

  res.redirect('/nutrition')

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
