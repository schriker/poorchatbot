const fs = require('fs')
const moment = require('moment')
const { exec } = require('child_process')
const { youtubeUpload } = require('./youtubeUpload')
const FacebookVideo = require('./models/facebookVideo')

let tryNumber = 0

const videoDownloader = (video) => {
    let comand = `youtube-dl ${video.url} -o "${video.videoId}.%(ext)s"`
    exec(comand, 
    async (error, stdout, stderr) => {
      try {
        if (error) {
            console.error(`Comand error: ${error}`)
            tryNumber = tryNumber + 1
            setTimeout(() => videoDownloader(video), 120000)
            return
          }
        const youTubeVideo = await youtubeUpload(`${video.videoId}.mp4`, video)
        fs.unlinkSync(`${video.videoId}.mp4`)
        const videoInDatabase = await FacebookVideo.findById(video._id)
        videoInDatabase.source = [
          ...videoInDatabase.source,
          {
            name: 'youtube',
            id: youTubeVideo.data.id
          }
        ]
        videoInDatabase.thumbnail = `https://i.ytimg.com/vi/${youTubeVideo.data.id}/maxresdefault.jpg`
        videoInDatabase.save()
        tryNumber = 0
        console.log(`[Reuploaded] - ${video.videoId} - ${new Date()}`)
      } catch (err) {
        console.log(err)
        tryNumber = 0
        if (err.data.response) {
          if (err.data.response.status === 401 || err.data.response.status === 500) {
            setTimeout(() => videoDownloader(err.facebookVideo), 300000)
            
          } else if (err.data.response.status === 403) {
            const currentTime = moment().format()
            const nextUpload = moment().add('1', 'd').set('h', 7).set('m', 5).set('s', 0).format()
            const msToNextUploadTry = new Date(nextUpload) - new Date(currentTime)
            setTimeout(() => videoDownloader(err.facebookVideo), msToNextUploadTry)
          }
        }
        console.log(err.data)
      }
    })
}


module.exports = videoDownloader