const mongoose = require('mongoose')
const bot = require('./bot')
const Wykop = require('./wykop')
const config = require('./config.json')

const mongoHost = `mongodb://${config.DB_USERNAME}:${config.DB_PASS}@3.121.239.54/${config.DB_NAME}`

console.log('Contecting to DB...')
mongoose.connect(mongoHost, {
  useNewUrlParser: true,
  useFindAndModify: false
  })
  .then(async () => {
    console.log('DB connected!')
    // bot()
    // const wykopNotifier = new Wykop({
    //   secret: config.WYKOP.SECRET,
    //   appKey: config.WYKOP.APPKEY
    // })
    // await wykopNotifier.request({
    //   requestMethod: 'POST',
    //   apiParams: ['login', 'index'],
    //   namedParams: null,
    //   postParams: {
    //     accountkey: config.WYKOP.ACCOUNTKEY
    //   }
    // })
    // wykopNotifier.request({
    //   requestMethod: 'POST',
    //   apiParams: ['entries', 'add'],
    //   namedParams: null,
    //   postParams: {
    //     body: 'testowa wiadomosc bota'
    //   }
    // })
    // .then(res => console.log(res)) 
  })
  .catch(err => {
    console.log(err)
  })