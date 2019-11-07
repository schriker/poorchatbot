const jimp = require('jimp')
const axios = require('axios')
const config = require('../config.json')
const VideoModel = require('../models/facebookVideo')

const thumbnailUploader = async (videoId, name, imageUrl) => {
  const thumb = await jimp.read(imageUrl)
  thumb.resize(320, 180)

  await thumb.getBase64Async(thumb.getMIME())
  .then((imgData) => {
    axios({
      method: 'post',
      url: 'https://api.imgur.com/3/upload',
      headers: {
        'Authorization': `Client-ID ${config.IMGUR_ID}`
      },
      data: {
        image: imgData.split(',')[1]
      }
      })
      .then(async (res) => {
        const video = await VideoModel[name].findById(videoId)
        video.thumbnail = res.data.data.link
        video.save()
      })
      .catch((err) => {
        console.log(err)
      })
  })
}

module.exports = thumbnailUploader