const XLSX = require('xlsx')
const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')

// TODO: Deleting all elements in a xlsx worksheet will result in an error when saving; therefor don't allow deletion of the header row (row 0). 
// TODO: Make come up with better solution for database stuff.
// TODO: Replace json database with xlsx.

//  #region XLSX helpers
const ec = (r, c) => {
  return XLSX.utils.encode_cell({r:r,c:c})
}

const delete_row = (ws, row_index) => {
  let range = XLSX.utils.decode_range(ws["!ref"])
  for(var R = row_index; R <= range.e.r; ++R){
      for(var C = range.s.c; C <= range.e.c; ++C){
          ws[ec(R, C)] = ws[ec(R+1, C)]
      }
  }
  range.e.r--
  ws['!ref'] = XLSX.utils.encode_range(range.s, range.e)
}
// #endregion

// #region Nutrition database
const nutritionDatabasePath = './data/nutrition.xlsx' 
if (!fs.existsSync(nutritionDatabasePath))
{
  const newNutritionWorkBook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(newNutritionWorkBook, [], "meta")
  XLSX.writeFile(newNutritionWorkBook, nutritionDatabasePath)
}
const nutritionWorkBook = XLSX.readFile(nutritionDatabasePath)

if ("nutrition" in nutritionWorkBook.Sheets == false)
{
  XLSX.utils.book_append_sheet(nutritionWorkBook, [], "nutrition")
  XLSX.utils.sheet_add_aoa(nutritionWorkBook.Sheets["nutrition"], [["id", "date", "name", "calories"]], {origin: 0})
}
const nutritionSourcesWorkSheet = nutritionWorkBook.Sheets["nutrition"]

XLSX.writeFile(nutritionWorkBook, nutritionDatabasePath)

// #endregion Nutrition database

// #region Snippets database 
const snippetsDatabasePath = './data/snippets.xlsx' 
if (!fs.existsSync(snippetsDatabasePath))
{
  const newSnippetsWorkBook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(newSnippetsWorkBook, [], "meta")
  XLSX.writeFile(newSnippetsWorkBook, snippetsDatabasePath)
}
const snippetsWorkBook = XLSX.readFile(snippetsDatabasePath)

if ("snippets" in snippetsWorkBook.Sheets == false)
{
  XLSX.utils.book_append_sheet(snippetsWorkBook, [], "snippets")
  XLSX.utils.sheet_add_aoa(snippetsWorkBook.Sheets["snippets"], [["id", "date", "title", "text"]], {origin: 0})
}
const snippetsSourcesWorkSheet = snippetsWorkBook.Sheets["snippets"]

XLSX.writeFile(snippetsWorkBook, snippetsDatabasePath)
// #endregion Snippets database 

// #region Setup and configure app
const port = 3000
const app = express()
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
// #endregion

// #region JSON Database - deprecated
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
// #endregion

// #region Application routing
app.get('/', (req, res) => {
  res.render('index')
})
// #endregion

// #region Nutrition routing
app.get('/nutrition', (req, res) => {
  res.render('nutrition', {sources: XLSX.utils.sheet_to_row_object_array(nutritionSourcesWorkSheet)})
})

app.patch('/nutrition/report/:reportid/add/:sourceid', (req, res) => {
  userData.nutrition.reports[0].sources.push(req.params.id)
  userData.nutrition.reports[0].calories += parseInt(userData.nutrition.sources[req.params.id].calories)
  SaveUserData();
  res.redirect('/nutrition')
})

app.patch('/nutrition/report/:reportid/remove/:sourceid', (req, res) => {
  userData.nutrition.reports[0].calories -= parseInt(userData.nutrition.sources[userData.nutrition.reports[0].sources[req.params.id]].calories)
  userData.nutrition.reports[0].sources.splice(req.params.id, 1)
  SaveUserData();
  res.redirect('/nutrition')
})

app.post('/nutrition/sources/add', function (req, res) {
  // Generate a random (ish) id based on time.
  // TODO: This id should be derived from an incremental counter located in the snippets meta sheet.
  var id = `${new Date().getUTCMilliseconds()}_${Math.floor(Math.random() * 10000)}`

  // Generate a date string in the format: yyyy/mm/dd hh:mm:ss
  var date = new Date();
  var dateStr =
    date.getFullYear() + "/" +
    ("00" + (date.getMonth() + 1)).slice(-2) + "/" +
    ("00" + date.getDate()).slice(-2) + " " +
    ("00" + date.getHours()).slice(-2) + ":" +
    ("00" + date.getMinutes()).slice(-2) + ":" +
    ("00" + date.getSeconds()).slice(-2);

  XLSX.utils.sheet_add_aoa(nutritionSourcesWorkSheet, [[id, dateStr, req.body.name, parseInt(req.body.calories)]], {origin:-1})
  XLSX.writeFile(nutritionWorkBook, nutritionDatabasePath)
  res.redirect('/nutrition')
})

app.delete("/nutrition/sources/remove/:id", function(req, res) {
  console.log(req.params)
  var objectArray = XLSX.utils.sheet_to_row_object_array(nutritionSourcesWorkSheet)
  var elementIndex = objectArray.findIndex((obj) => {  return obj.id == req.params.id  })

  if (elementIndex != -1)
  {
    delete_row(nutritionSourcesWorkSheet, elementIndex + 1)
    XLSX.writeFile(nutritionWorkBook, nutritionDatabasePath)
  }

  res.redirect('/nutrition')
})
// #endregion

// #region Snippets routing
app.get('/snippets', (req, res) => {
  res.render('snippets', {snippets: XLSX.utils.sheet_to_row_object_array(snippetsSourcesWorkSheet)})
})

app.post('/snippets/add', (req, res) => {
  // Generate a random (ish) id based on time.
  // TODO: This id should be derived from an incremental counter located in the snippets meta sheet.
  var id = `${new Date().getUTCMilliseconds()}_${Math.floor(Math.random() * 10000)}`

  // Generate a date string in the format: yyyy/mm/dd hh:mm:ss
  var date = new Date();
  var dateStr =
    date.getFullYear() + "/" +
    ("00" + (date.getMonth() + 1)).slice(-2) + "/" +
    ("00" + date.getDate()).slice(-2) + " " +
    ("00" + date.getHours()).slice(-2) + ":" +
    ("00" + date.getMinutes()).slice(-2) + ":" +
    ("00" + date.getSeconds()).slice(-2);

  XLSX.utils.sheet_add_aoa(snippetsSourcesWorkSheet, [[id, dateStr, "Untitled snippet", req.body.text]], {origin:-1})
  XLSX.writeFile(snippetsWorkBook, snippetsDatabasePath)
  res.redirect('/snippets')
})

app.delete("/snippets/remove/:id", function(req, res) {
  var objectArray = XLSX.utils.sheet_to_row_object_array(snippetsSourcesWorkSheet)
  var elementIndex = objectArray.findIndex((obj) => {  return obj.id == req.params.id  })

  if (elementIndex != -1)
  {
    delete_row(snippetsSourcesWorkSheet, elementIndex + 1)
    XLSX.writeFile(snippetsWorkBook, snippetsDatabasePath)
  }

  res.redirect('/snippets')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
// #endregion