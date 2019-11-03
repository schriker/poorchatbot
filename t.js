// const moment = require('moment')

// const downloader = async () => {
//   const currentTime = moment().format()
//   const nextUpload = moment().add('1', 'd').set('h', 7).set('m', 5).set('s', 0).format()
//   const msToNextUploadTry = new Date(nextUpload) - new Date(currentTime)

//   console.log(msToNextUploadTry)

  // try {
  //   const resolve = await uploader()
  //   console.log(resolve)
  // } catch (err) {
  //   console.log(err)
  // }
// }

// const uploader = () => {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => reject('Yeeey'), 2000)
//   })
// }

const axios = require('axios')
const mongoose = require('mongoose')
const qs = require('querystring')
const config = require('./config.json')
const Message = require('./models/message')
const FacebookVideo = require('./models/facebookVideo')

const mongoHost = `mongodb://${config.DB_USERNAME}:${config.DB_PASS}@${config.DB_HOST}/${config.DB_NAME}`

// const date = () => {
//   mongoose.connect(mongoHost, {
//         useNewUrlParser: true,
//         useFindAndModify: false,
//         useUnifiedTopology: true
//         })
//         .then(async () => {
//           console.log('Contected!')

//           const videos = await FacebookVideo.find({ facebookId: '1123260671397265' }).sort({createdAt: -1})
//           console.log(videos.length)
//           for (let video of videos) { 
//             try {
//               const response = await axios({
//                 url: `https://www.facebook.com/video/tahoe/async/${video.facebookId}/?payloadtype=secondary`,
//                 method: 'POST',
//                 data: qs.stringify({ '__a': 1 }),
//                 headers: {
//                   'Content-Type': 'application/x-www-form-urlencoded',
//                   'User-Agent': 'PostmanRuntime/7.19.0'
//                 }
//               })
//               const data = JSON.parse(response.data.split('for (;;);')[1])
//               const ftKey = JSON.parse(data.payload.ftKey)
//               const videoTimeStamp = new Date(ftKey.page_insights[ftKey.page_id].post_context.publish_time * 1000)
//               video.started = videoTimeStamp
//               await video.save()
//               console.log(video._id)
//             } catch (err) {
//               console.log(err)
//             }
//           }
//           console.log('Done!')      
//         })
//         .catch(err => {
//           console.log(err)
//         })
// }

// date()

const chart = () => {

  mongoose.connect(mongoHost, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true
        })
        .then(async () => {
          console.log('Contected!')

          const videos = await FacebookVideo.find().sort({createdAt: -1})

          for (let video of videos) {
            const chatData = []
            const messages = await Message.find({ createdAt: { $gt: video.started, $lt: video.createdAt } }).sort({ createdAt: 'asc' })
            const duration = new Date(video.createdAt) - new Date(video.started) // ms
  
            for (let i = 0; i < duration; i += 60000 ) {
              const messagesCount = messages.filter((message) => {
                const messageTime = new Date(message.createdAt) - new Date(video.started)
                if (messageTime > i && messageTime < i + 60000) {
                  return true
                } else {
                  return false
                }
              })
              chatData.push(messagesCount.length)   
            }
            video.chatData = chatData
            await video.save()
            console.log(video._id)
          }
          console.log('Done!')      
        })
        .catch(err => {
          console.log(err)
        })
}

chart()


// const highLights = [
//   'XD',
//   'KEK',
//   'LUL',
//   'LOL',
//   'Clap',
//   '10na10',
//   'Gg',
//   'Dafuq',
//   'PepeHands',
//   'monkaS',
//   'CoDoKur',
//   'GOTY',
//   'Feels',
//   'DZEJowiec',
//   'Pepega',
//   'REe',
//   'HAhaa',
//   'Sheeeit',
//   'ANELE',
//   'pepeJAM',
//   'ANGERY'
// ]
// let videoHighLights = []
// let highLightsType = ''
// let highLightsCount = 0
// let highLightsTime = null
// let totalMessagesCount = 0
// let prevMessageTime = null

// const moments = () => {
//   mongoose.connect(mongoHost, {
//     useNewUrlParser: true,
//     useFindAndModify: false,
//     useUnifiedTopology: true
//     })
//     .then(async () => {
//       console.log('Contected to DB')
//       const videos = await FacebookVideo.find({ facebookId: '1123260671397265' }).sort({createdAt: -1})
//       console.log(videos.length)

//       for (let video of videos){
//         const messages = await Message.find({ createdAt: { $gt: video.started, $lt: video.createdAt } }).sort({ createdAt: 'asc' })
        
//         for (let message of messages) {
//           totalMessagesCount += 1
//           for (let keyWord of highLights) {
//               if (message.body.toLowerCase().includes(keyWord.toLowerCase())) {
//                   highLightsCount += 1
//                   if (highLightsCount === 1) {
//                       totalMessagesCount = 1
//                       highLightsType = keyWord
//                       highLightsTime = message.createdAt
//                   }
//                   if (highLightsCount > 1) {
//                       const timeDiference = new Date(message.createdAt) - new Date(prevMessageTime)
                      
//                       if (timeDiference > 10000) {
//                         let percent = highLightsCount / totalMessagesCount * 100
//                         if (percent >= 50 && highLightsCount > 5) {
//                           videoHighLights.push({
//                               time: highLightsTime,
//                               percent: percent,
//                               highLightsCount: highLightsCount,
//                               totalMessagesCount: totalMessagesCount,
//                               type: highLightsType
//                           }) 
//                       }
//                       highLightsCount = 0
//                       }
//                   }
//                   prevMessageTime = message.createdAt
//               }
//           }
//         }

//         const videodb = await FacebookVideo.find({ _id: video._id })
//         videodb[0].highLights = videoHighLights
//         await videodb[0].save()
//         videoHighLights = []
//       }

//       console.log('Done!')
//     })
//     .catch(err => {
//       console.log(err)
//     })
// }

// moments()
