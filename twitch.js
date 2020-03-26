const fs = require('fs')
const moment = require('moment')
const { exec } = require('child_process')
const youtubeUpload = require('./youtubeUpload')
const FacebookVideo = require('./models/facebookVideo')

const twitchVideoDownloader = (video) => {
    exec(`youtube-dl ${video.url} -f "best[ext=mp4]" -o "${video.facebookId}.%(ext)s"`, 
    async (error, stdout, stderr) => {
      try {
        if (error) {
            console.error(`Comand error: ${error}`)
            setTimeout(() => twitchVideoDownloader(video), 120000)
            return
          }
        const youTubeVideo = await youtubeUpload(`${video.facebookId}.mp4`, video)
        fs.unlinkSync(`${video.facebookId}.mp4`)
        const videoInDatabase = await FacebookVideo.findById(video._id)
        videoInDatabase.youTubeId = youTubeVideo.data.id
        videoInDatabase.thumbnail = youTubeVideo.data.snippet.thumbnails.medium.url
        videoInDatabase.save()
        console.log(`Twitch Video - ${video.facebookId} - uploaded - ${new Date()}`)
      } catch (err) {
        if (err.data.response) {
          if (err.data.response.status === 401 || err.data.response.status === 500) {
            setTimeout(() => twitchVideoDownloader(err.facebookVideo), 300000)
            
          } else if (err.data.response.status === 403) {
            const currentTime = moment().format()
            const nextUpload = moment().add('1', 'd').set('h', 7).set('m', 5).set('s', 0).format()
            const msToNextUploadTry = new Date(nextUpload) - new Date(currentTime)
            setTimeout(() => twitchVideoDownloader(err.facebookVideo), msToNextUploadTry)
          }
        }
        console.log(err.data)
      }
    })
}

module.exports = twitchVideoDownloader