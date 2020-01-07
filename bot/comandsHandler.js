const youTubeLinkValidation = require('../helpers/youTubeLinkValidation')
const messageCreator = require('./messageCreator')
const axios = require('axios')
const config = require('../config.json')
const util = require('util')

const PLAYLIST_ID = '5e05f3066b4015735b357abf'
const ROOM_ID = '5e05f2746b4015735b357abd'

const gqlAPI = new axios.create({
  baseURL: 'https://apiradio.jarchiwum.pl/',
  headers: { Authorization: config.GQL_TOKEN }
})

const addSongHandler = async (messageData, client) => {
  try {
    const linkMatch = messageData.body.match(/\bhttps?:\/\/\S+/)
    if (linkMatch) {
      const link = linkMatch[0]
      const isYouTube = youTubeLinkValidation(link)
      if (isYouTube) {
          const page = await axios.get(link)
          const pageMetadata = page.data
          .split('ytplayer.config = ')
          .pop()
          .split(';ytplayer.load = function()')[0]
          const pageMetadataObject = JSON.parse(pageMetadata)
          const playerResponseObject = JSON.parse(pageMetadataObject.args.player_response)
          const { videoId: video_id, title } = playerResponseObject.videoDetails
          const { approxDurationMs: time } = playerResponseObject.streamingData.adaptiveFormats[0]

          const song = {
            video_id: video_id,
            title: title,
            url: link,
            author: messageData.author,
            duration: parseInt(time, 10),
            playlist_id: PLAYLIST_ID
          }
          const notification = {
            content: `${messageData.author} dodał utwór.`,
            type: 'PLAYLIST',
            room: ROOM_ID
          }
          const response = await gqlAPI.post('', {
            query: `
              mutation addSongs($song: SongInput!) {
                addSong(song: $song) {
                  title
                }
              }
            `,
            variables: {
              song: song
            }
          })
          if (response.data.data) {
            await gqlAPI.post('', {
              query: `
              mutation addNotification($notification: NotificationInput!) {
                addNotification(notification: $notification) {
                  _id
                }
              }
              `,
              variables: {
                notification: notification
              }
            })
            client.pm(messageData.author, `Dodano utwór: "${response.data.data.addSong.title}"`)
          } else {
            client.pm(messageData.author, response.data.errors[0].message)
          }
        } else {
          client.pm(messageData.author, 'Tylko YouTube.')
        }
      } else {
        client.pm(messageData.author, 'Nieprawidłowy link.')
      }
    } catch (error) {
      console.log(error)
      client.pm(messageData.author, 'Coś nie pykło :(')
    }
}

const botComandsHandler = async (IRCMessage, client) => {
  const messageData = messageCreator(IRCMessage)
  const isPM = messageData.channel === 'Jarchiwum'
  const trimedBody = messageData.body.trim()
  const comand = trimedBody.match(/^\!(\b\w+\b)\s(\b\w+\b)/)
  if (isPM && comand) {
    switch (comand[1]) {
      case 'song':
        switch (comand[2]) {
          case 'request':
            addSongHandler(messageData, client)
            break
        }
        break
    }
  }
}

module.exports = botComandsHandler
