const mongoose = require('mongoose')
const config = require('./config.json')
const bot = require('./bot')

const mongoHost = `mongodb://${config.DB_USERNAME}:${config.DB_PASS}@${config.DB_HOST}/${config.DB_NAME}`

console.log('Contecting to DB...')
mongoose.connect(mongoHost, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
  })
  .then(async () => {
    console.log('DB connected!')
    bot()
  })
  .catch(err => {
    console.log(err)
  })
