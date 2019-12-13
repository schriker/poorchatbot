const fs = require('fs')
const moment = require('moment')
const { exec } = require('child_process')
const youtubeUpload = require('./youtubeUpload')
const FacebookVideo = require('./models/facebookVideo')
const config = require('./config.json')

const facebookVideoDownloader = (video) => {
    let comand
    if (video.public === true) {
      // comand = `youtube-dl https://www.facebook.com/StrumienieZRuczaju/videos/${video.facebookId}/ -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]" -o "${video.facebookId}.%(ext)s"`
      comand = `youtube-dl https://www.facebook.com/StrumienieZRuczaju/videos/${video.facebookId}/ -f "bestvideo[height=1080][ext=mp4]+bestaudio[ext=m4a]" -o "${video.facebookId}.%(ext)s"`
    } else if (video.public === false) {
      comand = `youtube-dl ${video.url} -f "best[ext=mp4]" -o "${video.facebookId}.%(ext)s"`
    }
    exec(comand, 
    async (error, stdout, stderr) => {
      try {
        if (error) {
            console.error(`Comand error: ${error}`)
            setTimeout(() => facebookVideoDownloader(video), 120000)
            return
          }
        const youTubeVideo = await youtubeUpload(`${video.facebookId}.mp4`, video)
        fs.unlinkSync(`${video.facebookId}.mp4`)
        const videoInDatabase = await FacebookVideo.findById(video._id)
        videoInDatabase.youTubeId = youTubeVideo.data.id
        videoInDatabase.thumbnail = youTubeVideo.data.snippet.thumbnails.medium.url
        videoInDatabase.save()
        console.log('Video reuploaded!')
      } catch (err) {
        if (err.data.response) {
          if (err.data.response.status === 401 || err.data.response.status === 500) {
            setTimeout(() => facebookVideoDownloader(err.facebookVideo), 300000)
            
          } else if (err.data.response.status === 403) {
            const currentTime = moment().format()
            const nextUpload = moment().add('1', 'd').set('h', 7).set('m', 5).set('s', 0).format()
            const msToNextUploadTry = new Date(nextUpload) - new Date(currentTime)
            setTimeout(() => facebookVideoDownloader(err.facebookVideo), msToNextUploadTry)
          }
        }
        console.log(err.data)
      }
    })
}


module.exports = facebookVideoDownloader