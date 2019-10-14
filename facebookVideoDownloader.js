const fs = require('fs')
const { exec } = require('child_process')
const youtubeUpload = require('./youtubeUpload')
const FacebookVideo = require('./models/facebookVideo')

const facebookVideoDownloader = (video) => {
    let comand
    if (video.public === true) {
      comand = `youtube-dl https://www.facebook.com/StrumienieZRuczaju/videos/${video.facebookId}/ -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]" -o "${video.facebookId}.%(ext)s"`
    } else if (video.public === false) {
      comand = `youtube-dl ${video.url} -f "best[ext=mp4]" -o "${video.facebookId}%(ext)s"`
    }
    exec(comand, 
    async (error, stdout, stderr) => {
      if (error) {
          console.error(`exec error: ${error}`)
          return
        }
      const youTubeVideo = await youtubeUpload(`${video.facebookId}.mp4`, video)
      fs.unlinkSync(`${video.facebookId}.mp4`)
      const videoInDatabase = await FacebookVideo.findById(video._id)
      videoInDatabase.youTubeId = youTubeVideo.data.id
      videoInDatabase.thumbnail = youTubeVideo.data.snippet.thumbnails.medium.url
      videoInDatabase.save()
      console.log('Video reuploaded!')
    })
}


module.exports = facebookVideoDownloader