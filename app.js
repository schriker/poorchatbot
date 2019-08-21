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