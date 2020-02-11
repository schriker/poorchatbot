const youTubeLinkValidation = require('../helpers/youTubeLinkValidation')
const messageCreator = require('./messageCreator')
const axios = require('axios')
const moment = require('moment')
const config = require('../config.json')

const PLAYLIST_ID = '5e1735147a865527f00e0715'
const ROOM_ID = '5e17348e7a865527f00e0713'

const gqlAPI = new axios.create({
  baseURL: 'https://apiradio.jarchiwum.pl/',
  headers: { Authorization: config.GQL_TOKEN }
})

const pubgAPI = new axios.create({
  baseURL: 'https://api.pubg.com/shards/steam/',
  headers: { 
    accept: 'application/vnd.api+json',
    Authorization: `Bearer ${config.PUBG_API}` 
  }
})

const pubgStatsHandler = async (client) => {
  try {
    const { data: { data } } = await pubgAPI.get('players?filter[playerNames]=Makulsky')
    const latestMatchId = data[0].relationships.matches.data[0].id
    const { data: { included, data: { attributes: { createdAt } } } } = await pubgAPI.get(`matches/${latestMatchId}`)
    const [ playerInfo ] = included.filter(item => item.type === 'participant').filter(item => item.attributes.stats.name === 'Makulsky')
    const stats = playerInfo.attributes.stats
    const date = moment(createdAt).locale('pl').fromNow()
    const time = moment.utc(
      moment
        .duration(stats.timeSurvived * 1000)
        .asMilliseconds()
    )
    .format('mm:ss')
    const icon = stats.winPlace === 1 ? 'POGGERS' : 'Feels'
    client.say(`#${stats.winPlace} - ${date} - zabić: ${stats.kills} - asysty: ${stats.assists} - czas: ${time} ${icon}`)
  } catch (error) {
    console.log(error.response.data.errors)
  }
}

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
  const isAdmin = messageData.author === 'schriker'
  const trimedBody = messageData.body.trim()
  const comand = trimedBody.match(/^\!(\b\w+\b)\s?(\b\w+\b)?/)
  if ((isPM && comand) || (isAdmin && comand)) {
    switch (comand[1]) {
      case 'song':
        switch (comand[2]) {
          case 'request':
            addSongHandler(messageData, client)
            break
        }
        break
      case 'pubg':
        pubgStatsHandler(client)
    }
  }
}

module.exports = botComandsHandler
