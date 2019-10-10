const axios = require('axios')
const config = require('./config.json')
const fs = require('fs')
const { google } = require('googleapis') 

const getAccessToken = () => {
  return new Promise( async (resolve, reject) => {
    try {
      const { data } = await axios.post('https://www.googleapis.com/oauth2/v4/token', {
        client_id: config.YT_API.CLIENT_ID,
        client_secret: config.YT_API.CLIENT_SECRET,
        refresh_token: config.YT_API.REFRESH_TOKEN,
        grant_type: 'refresh_token'
      })
      resolve({
        refresh_token: config.YT_API.REFRESH_TOKEN,
        ...data
      })
    } catch (err) {
      reject(err)
    }
  })
}

const youtubeUpload = (fileName, facebookVideo) => {
  return new Promise(async (resolve, reject) => {
    try {
      const oAuthClient = new google.auth.OAuth2(
        config.YT_API.CLIENT_ID,
        config.YT_API.CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      )
      oAuthClient.credentials= await getAccessToken()
  
      const youtube = google.youtube({
        version: 'v3',
        auth: oAuthClient
      })
  
      const video = await youtube.videos.insert({
        part: 'id,snippet,status',
        notifySubscribers: false,
        requestBody: {
          snippet: {
            title: `Zapis strumienia: ${facebookVideo.started}`,
            description: `${facebookVideo.title} ${facebookVideo.facebookId}`
          },
          status: {
            privacyStatus: 'unlisted'
          }
        },
        media: {
          body: fs.createReadStream(fileName)
        }
      })
      resolve(video)
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setTimeout(() => youtubeUpload(fileName), 300000)
        } else if (err.response.status === 403) {
          setTimeout(() => youtubeUpload(fileName), 86400000)
        }
      }
      console.log(err)
    }
  })
}

module.exports = youtubeUpload