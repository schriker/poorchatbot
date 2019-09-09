const Wykop = require('./wykop')
const config = require('./config.json')
const FacebookVideo = require('./models/facebookVideo')
const WebSocket = require('ws')
const ReconnectingWebSocket = require('reconnecting-websocket')
const axios = require('axios')

const wykopNotifier = async () => {
  const lt = new Date(new Date().setHours(0, 0, 0, 0))
  const gt = new Date(new Date(new Date().setHours(0, 0, 0, 0)).getTime() - 24 * 60 * 60 * 1000)
  console.log(lt)
  const postDate = lt.toISOString().split('T')[0]
  const videosFromLast24H = await FacebookVideo.find({started: {$gt: gt, $lt: lt}})
  console.log(postDate)
  let postBodyTemplate = `
  **Archiwum z Ruczaju**

  　► ${postDate}
  `
  
  const notifier = new ReconnectingWebSocket('https://api.pancernik.info/notifier', [], {
    WebSocket: WebSocket
  })

  if (videosFromLast24H.length !== 0) {
    notifier.addEventListener('message', async (response) => {
      const data = JSON.parse(response.data)
      const topic = data.data.topic.text

      const numbers = ['\u2460', '\u2461', '\u2462', '\u2463', '\u2464', '\u2465', '\u2466', '\u2467', '\u2468', '\u2469']
      videosFromLast24H.forEach((video, index) => {
        postBodyTemplate += `\n\n${numbers[index]} https://jarchiwum.pl/wonziu/${video.facebookId}?platform=facebook (facebook)(**${video.duration}**)(_${video.title}_)`
      })
      postBodyTemplate += `
      \nⓘ ${topic}
  
      \nWpadnij na czat! https://jadisco.pl/
      Przegapiłeś strumyk? https://jarchiwum.pl/
      
      \n#archiwumzruczaju #wonziu
      `

      const facebookData = await axios.get('https://www.facebook.com/pages/videos/search/?page_id=369632869905557&__a')
      const videoData = JSON.parse(facebookData.data.split('for (;;);')[1]).payload.page.video_data[0]

      const wykopNotifier = new Wykop({
        secret: config.WYKOP.SECRET,
        appKey: config.WYKOP.APPKEY
      })
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
      //     body: postBodyTemplate,
      //     embed: videoData.thumbnailURI
      //   }
      // })
      // .then(() => {
      //   console.log('Wykop post posted!')
      //   notifier.removeEventListener('message')
      // }) 
    })
  }
}

module.exports = wykopNotifier