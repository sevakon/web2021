const express = require('express')
const app = express()
const port = 3000
const router = require('./city.routes')
app.use(express.static('public'));


// app.get('/', (req, res) => {
//   res.redirect('/index.html')
// })
app.use(express.json())
app.use('/', router)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

