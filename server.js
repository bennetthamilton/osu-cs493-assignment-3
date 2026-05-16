const express = require('express')
const morgan = require('morgan')

const api = require('./api')
const sequelize = require('./lib/sequelize')

const app = express()
const port = process.env.PORT || 8000

app.use(morgan('dev'))

app.use(express.json())
app.use(express.static('public'))

app.use('/', api)

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  })
})

app.use('*', function (err, req, res, next) {
  console.error("== Error:", err)
  res.status(500).send({
    error: "Server error.  Please try again later."
  })
})

async function startServer() {
  let retries = 10

  while (retries > 0) {
    try {
      await sequelize.authenticate()
      console.log("== Database connection established")

      await sequelize.sync()

      app.listen(port, function () {
        console.log("== Server is listening on port:", port)
      })

      return
    } catch (err) {
      retries--
      console.log("== Database not ready, retrying...")
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  throw new Error("Could not connect to database")
}

startServer()