const mongoose = require('mongoose')
const config = require('./config.json')
const bot = require('./bot')
const wykopNotifier = require('./wykopNotifier')
const CronJob = require('cron').CronJob
const moment = require('moment')

const mongoHost = `mongodb://${config.DB_USERNAME}:${config.DB_PASS}@${config.DB_HOST}/${config.DB_NAME}`

console.log('Contecting to DB...')
mongoose.connect(mongoHost, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
  })
  .then(async () => {
    console.log('DB connected!')
    // Thu Oct 10 2019 14:16:39 GMT+0000 (Coordinated Universal Time)
    const date = moment('2019-09-10T13:38:06.757+00:00').add(2, 'hours').locale('pl').format('D MMMM YYYY (H:MM)')
    console.log(date)
    // bot()
    try {      
      new CronJob('00 00 04 * * *', () => {
      	wykopNotifier()
      }, null, true)
    } catch (cronerr) {
      console.log('Invalid cron')
    }
  })
  .catch(err => {
    console.log(err)
  })
