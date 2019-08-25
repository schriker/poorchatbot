const mongoose = require('mongoose')
const bot = require('./bot')
const config = require('./config.json')

const mongoHost = `mongodb://${config.DB_USERNAME}:${config.DB_PASS}@3.121.239.54/${config.DB_NAME}`

console.log('Contecting to DB...')
mongoose.connect(mongoHost, {
  useNewUrlParser: true,
  useFindAndModify: false
  })
  .then(() => {
    console.log('DB connected!')
    bot()
  })
  .catch(err => {
    console.log(err)
  })