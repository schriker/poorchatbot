const mongoose = require('mongoose')
const bot = require('./bot')
const config = require('./config.json')

const mongoHost = process.env.NODE_ENV === 'development' 
  ? `mongodb+srv://${config.DB_USERNAME}:${config.DB_PASS}@cluster0-vsmqj.mongodb.net/${config.DB_NAME}?retryWrites=true` 
  : `mongodb://${config.DB_USERNAME}:${config.DB_PASS}@127.0.0.1:27017/${config.DB_NAME}`

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