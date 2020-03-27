const axios = require('axios')
const EventEmitter = require('events')
const youtubeUpload = require('./youtubeUpload')
const { spawn } = require('child_process')

class Facebook extends EventEmitter {
  constructor(facebookId) {
    super()
    this.facebookId = facebookId
    this.isOnline = null
    this.listener()
  }

  listener() {
    const interval = setInterval(async () => {
      const facebookResponse = await axios.get(`https://www.facebook.com/pages/videos/search/?page_id=${this.facebookId}&__a`)
      const facebookVideos = JSON.parse(facebookResponse.data.split('for (;;);').pop())
      const lastVideo = facebookVideos.payload.page.video_data[0]
      const { viewCount, videoID } = lastVideo
      const isOnline = viewCount === '0'

      if (this.isOnline !== isOnline) {
        this.isOnline = isOnline
        if (this.isOnline) {
          this.emit('online')
          console.log(`Facebook: [Online] - ${videoID} - ${new Date()}`)
          this.startDownload(videoID)
          clearInterval(interval)
        } else if (!this.isOnline) {
          this.emit('offline')
          console.log(`Facebook: [Offline] - ${videoID} - ${new Date()}`)
        }
      }
    }, 1500)
  }

  async startDownload(videoID) {
    const streamlink = spawn('streamlink', [`https://www.facebook.com/${this.facebookId}/videos/${videoID}`, 'best', '-O'])
    const ffmpeg = spawn('ffmpeg', ['-i', 'pipe:0', '-c', 'copy', '-f', 'flv', 'rtmp://a.rtmp.youtube.com/live2/agch-28ju-egt5-6k57'])

    

    streamlink.stdout.on('data', (data) => {
      ffmpeg.stdin.write(data);
    });
    
    streamlink.stderr.on('data', (data) => {
      console.error(`streamlink stderr: ${data}`);
    });
    
    streamlink.on('close', (code) => {
      if (code !== 0) {
        console.log(`streamlink process exited with code ${code}`);
      }
      ffmpeg.stdin.end();
    });
    
    ffmpeg.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    ffmpeg.stderr.on('data', (data) => {
      console.error(`ffmpeg stderr: ${data}`);
    });
    
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.log(`ffmpeg process exited with code ${code}`);
      }
    });



    // streamlink.stdout.on('data', (data) => {
    //   ffmpeg.stdin.write(data)
    // })
    
    // streamlink.on('close', (code) => {
    //   if (code !== 0) {
    //     console.log(`streamlink process exited with code ${code}`)
    //   }
    //   ffmpeg.stdin.end()
    // })
    
    // ffmpeg.on('close', (code) => {
    //   if (code !== 0) {
    //     console.log(`ffmpeg process exited with code ${code}`)
    //   }
    // })

    // try {
    //   const video = await youtubeUpload(ffmpeg.stdout, { facebookId: videoID, started: new Date() })
    //   console.log(`Facebook Video - ${videoID} - uploaded - ${new Date()}`)
    //   this.listener()
    //   this.emit('uploaded', video)
    // } catch (err) {
    //   console.log(err)
    // }
  }
}

module.exports = Facebook