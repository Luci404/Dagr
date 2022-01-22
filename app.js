
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const { json } = require('body-parser')

const port = 3000
const app = express()
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

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


// TODO: Make come up with propper architecture

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/nutrition', (req, res) => {
  res.render('nutrition', {nutrition: userData.nutrition})
})

// TODO: Rename
app.patch('/nutrition/addsourcetoreport/:id', (req, res) => {
  userData.nutrition.reports[0].sources.push(req.params.id)
  userData.nutrition.reports[0].calories += parseInt(userData.nutrition.sources[req.params.id].calories)
  SaveUserData();
  res.redirect('/nutrition')
})

// TODO: Rename
app.patch('/nutrition/removesourcefromreport/:id', (req, res) => {
  userData.nutrition.reports[0].calories -= parseInt(userData.nutrition.sources[userData.nutrition.reports[0].sources[req.params.id]].calories)
  userData.nutrition.reports[0].sources.splice(req.params.id, 1)
  SaveUserData();
  res.redirect('/nutrition')
})

app.post('/nutrition/addsource', function (req, res) {
  console.log(req.body)
  
  userData.nutrition.sources.push({ 
    name: req.body.name, 
    calories: parseInt(req.body.calories)
  })
  
  SaveUserData();
  res.redirect('/nutrition')
})

app.delete("/nutrition/removesource/:id", function(req, res) {
  userData.nutrition.sources.splice(parseInt(req.params.id), 1)
  SaveUserData();
  res.redirect('/nutrition')
})

// Snippets
app.get('/snippets', (req, res) => {
  res.render('snippets', {snippets: userData.snippets})
})

app.post('/snippets/addsnippet', (req, res) => {
  userData.snippets.snippets.push({ 
    text: req.body.text
  })
  SaveUserData();
  res.redirect('/snippets')
})

app.delete("/snippets/remove/:id", function(req, res) {
  userData.snippets.snippets.splice(parseInt(req.params.id), 1)
  SaveUserData();
  res.redirect('/nutrition')
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
