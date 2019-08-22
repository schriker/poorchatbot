const mongoose = require('mongoose')
const ora = require('ora')
const chalk = require('chalk')
const bot = require('./bot')
const config = require('./config.json')

const spinner = ora({
  prefixText: `${chalk.bgYellow.black('[DB Connecting]')}`,
  color: 'yellow',
  spinner: 'line'
})

const mongoHost = process.env.NODE_ENV === 'development' 
  ? `mongodb+srv://${config.DB_USERNAME}:${config.DB_PASS}@cluster0-vsmqj.mongodb.net/${config.DB_NAME}?retryWrites=true` 
  : `mongodb://${config.DB_USERNAME}:${config.DB_PASS}@127.0.0.1:27017/${config.DB_NAME}`

spinner.start()
mongoose.connect(`mongodb+srv://${config.DB_USERNAME}:${config.DB_PASS}@cluster0-vsmqj.mongodb.net/${config.DB_NAME}?retryWrites=true`, {
  useNewUrlParser: true,
  useFindAndModify: false
  })
  .then(() => {
    spinner.succeed(`${chalk.bgGreen.black('[Connected]')}`)
    bot()
  })
  .catch(err => {
    console.log(err)
  })