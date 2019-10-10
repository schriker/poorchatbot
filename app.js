const mongoose = require('mongoose')
const config = require('./config.json')
const bot = require('./bot')
const wykopNotifier = require('./wykopNotifier')
const CronJob = require('cron').CronJob

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
    // Uncoment after megrged to master
    // try {      
    //   new CronJob('00 00 04 * * *', () => {
    //   	wykopNotifier()
    //   }, null, true)
    // } catch (cronerr) {
    //   console.log('Invalid cron')
    // }
  })
  .catch(err => {
    console.log(err)
  })
