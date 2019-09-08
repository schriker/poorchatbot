const mongoose = require('mongoose')
const config = require('./config.json')
const bot = require('./bot')
const wykopNotifier = require('./wykopNotifier')
const CronJob = require('cron').CronJob

const mongoHost = `mongodb://${config.DB_USERNAME}:${config.DB_PASS}@3.121.239.54/${config.DB_NAME}`

console.log('Contecting to DB...')
mongoose.connect(mongoHost, {
  useNewUrlParser: true,
  useFindAndModify: false
  })
  .then(async () => {
    console.log('DB connected!')
    bot()
    try {      
      new CronJob('00 00 06 * * *', () => {
        wykopNotifier()
      }, null, true)
    } catch (cronerr) {
      console.log('Invalid cron')
    }
  })
  .catch(err => {
    console.log(err)
  })