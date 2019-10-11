const fs = require('fs')
const { exec } = require('child_process')
const youtubeUpload = require('./youtubeUpload')
const FacebookVideo = require('./models/facebookVideo')

const facebookVideoDownloader = (video) => {
    let comand
    if (video.public === true) {
      comand = `youtube-dl https://www.facebook.com/StrumienieZRuczaju/videos/${video.facebookId}/ -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]" -o "video.%(ext)s"`
    } else if (video.public === false) {
      comand = `youtube-dl ${video.url} -f "best[ext=mp4]" -o "video.%(ext)s"`
    }
    exec(comand, 
    async (error, stdout, stderr) => {
      if (error) {
          console.error(`exec error: ${error}`)
          return
        }
      const youTubeVideo = await youtubeUpload('video.mp4', video)
      fs.unlinkSync('video.mp4')
      const videoInDatabase = await FacebookVideo.findById(video._id)
      videoInDatabase.youTubeId = youTubeVideo.data.id
      videoInDatabase.save()
      console.log('Video reuploaded!')
    })
}


module.exports = facebookVideoDownloader