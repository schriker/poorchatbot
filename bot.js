const Poorchat = require('./poorchat')
const WebSocket = require('ws')
const { highLights }  = require('./consts')
const ReconnectingWebSocket = require('reconnecting-websocket')
const Message = require('./models/message')
const FacebookVideo = require('./models/facebookVideo')
const config = require('./config.json')
const merge = require('lodash.merge')
const axios = require('axios')
const msToTime = require('./helpers/milisecondsToTime')
const messageCreator = require('./bot/messageCreator')
const countChatData = require('./bot/countChatData')
const modeHandler = require('./bot/modeHandler')
const videoDownloader = require('./videoDownloader')
const fetchTwitchMessages = require('./twitchMessages')

const bot = async () => {
    let message = {
        type: '',
        data: {
          streamers: [],
          stream: {
            status: false,
            viewers: 0,
            services: [],
            online_at: '',
            offline_at: ''
          },
          topic: {
            id: 0,
            text: '',
            updated_at: ''
          }
        }
      }
    let isFacebook = false
    let isNvidia = false
    let isTwitch = false
    let currentStatus = null
    let videoStartDate = null
    let facebookVideoData = {}
    let videoHighLights = []
    let highLightsType = ''
    let highLightsCount = 0
    let highLightsTime = null
    let highLightsTimer = null
    let totalMessagesCount = 0
    
    const options = {
        websocket: 'https://irc.poorchat.net/',
        irc: 'irc.poorchat.net',
        channel: '#jadisco',
        login: config.USER_LOGIN,
        password: config.USER_PASSWORD,
        cap: [
            'CAP REQ :poorchat.net/embed',
            'CAP REQ :poorchat.net/color',
            'CAP REQ :poorchat.net/subscription',
            'CAP REQ :poorchat.net/subscriptiongifter',
            'CAP REQ :multi-prefix'
        ],
        debug: false
    }

    const messageHandler = async (IRCMessage) => {
        const messageData = messageCreator(IRCMessage)
        const message = new Message(messageData)

        try {
            message.save()
        } catch (error) {
            console.log(error)
        }

        totalMessagesCount += 1

        for (let keyWord of highLights) {
            if (messageData.body.toLowerCase().includes(keyWord.toLowerCase())) {
                highLightsCount += 1
                if (highLightsCount === 1) {
                    totalMessagesCount = 1
                    highLightsType = keyWord
                    highLightsTime = new Date()
                }
                if (highLightsCount >= 1) {
                    clearTimeout(highLightsTimer)
                    highLightsTimer = setTimeout(() => {
                        let percent = highLightsCount / totalMessagesCount * 100
                        if (percent >= 50 && highLightsCount > 5) {
                           videoHighLights.push({
                               time: highLightsTime,
                               percent: percent,
                               highLightsCount: highLightsCount,
                               totalMessagesCount: totalMessagesCount,
                               type: highLightsType
                           }) 
                        }
                        highLightsCount = 0
                    }, 10000)
                }
            }
        }
    }

    const notifier = new ReconnectingWebSocket('https://api.pancernik.info/notifier', [], {
        WebSocket: WebSocket
    })

    const client = new Poorchat(options)
    await client.connect()
    
    console.log('Working...')
    client.on('message', messageHandler)
    client.on('mode', async (IRCMessage) => await modeHandler(IRCMessage))

    notifier.addEventListener('message', async (response) => {
        const data = JSON.parse(response.data)
        message = merge(message, data)
        if (message.data.type === 'ping') {
            const pong = JSON.stringify({ type: 'pong' })
            notifier.send(pong)
            return
        } 
        
        const newMessageStatus = message.data.stream.services.filter(service => service.streamer_id === 1).some(el => el.status === true)
        
        if (currentStatus !== newMessageStatus) {
            const date = new Date()
            currentStatus = newMessageStatus
            if (currentStatus) {
                // isFacebook = message.data.stream.services.filter(service => service.name === 'facebook')[0].status
                isTwitch = message.data.stream.services.filter(service => service.name === 'twitch')[0].status
                if (message.data.stream.services.filter(service => service.id === 'nvidiageforcepl').length > 0) {
                    isNvidia = message.data.stream.services.filter(service => service.id === 'nvidiageforcepl')[0].status
                }
                videoHighLights = []
                videoStartDate = date
                console.log(`Stream: [Online] - ${date}`)
            } else if (!currentStatus) {
                console.log(`Stream: [Offline] - ${date}`)
                searchFacebookVideo(message.data.topic.text)
            }
        }
    })

    const searchFacebookVideo = async (videoTitle) => {
        if (videoStartDate && (isNvidia || isTwitch)) {
            try {
                const authToken = await axios.post(
                    `https://id.twitch.tv/oauth2/token?client_id=${config.TWITCH_CLIENT_ID}&client_secret=${config.TWITCH_SECRET}&grant_type=client_credentials`
                  )
                const response = await axios.get(`https://api.twitch.tv/helix/videos?user_id=${isNvidia ? '93141680' : '28468922'}`, {
                headers: {
                    'Client-ID': config.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${authToken.data.access_token}`
                    }
                })
                const video = response.data.data[0]

                const duration_array = video.duration.split(/[hms]+/)
                const parsed = duration_array.filter(number => number !== '').map(number => {
                  if (number.length === 1) {
                    return `0${number}`
                  } else {
                    return number
                  }
                })

                while(parsed.length < 3) {
                    parsed.unshift('00')
                }

                const exists = await FacebookVideo.find({ videoId: video.id })

                facebookVideoData = {
                    videoId: video.id,
                    url: video.url,
                    title: video.title,
                    views: video.view_count,
                    duration: duration_array.length === 1 ? duration_array[0] : parsed.join(':'),
                    started: videoStartDate,
                    thumbnail: video.thumbnail_url,
                    public: true,
                    highLights: videoHighLights,
                    screenshots: [],
                    source: [{
                        name: 'twitch',
                        id: video.id
                    }],
                    keywords: ''
                }
                if (exists.length === 0) {
                    const videoTwitch = new FacebookVideo(facebookVideoData)
                    const savedVideo = await videoTwitch.save()
                    countChatData(savedVideo._id)
                    console.log(`[Twitch Video Saved] - ${facebookVideoData.title}`)
                    videoDownloader(savedVideo)
                    fetchTwitchMessages(savedVideo.videoId)
                }
                isNvidia = false
                isTwitch = false
            } catch (err) {
                console.log(err)
            }
        }
        if (videoStartDate && isFacebook) {
            try {
                const response = await axios.get('https://www.facebook.com/pages/videos/search/?page_id=369632869905557&__a')
                const videoData = JSON.parse(response.data.split('for (;;);')[1]).payload.page.video_data[0]
                const facebookTitle = videoData.title.split('\n').filter(e => e !== '').join(' ')

                facebookVideoData = {
                    videoId: videoData.videoID,
                    url: videoData.videoURL,
                    title: facebookTitle || videoTitle,
                    views: 0,
                    duration: msToTime(new Date() - videoStartDate),
                    started: videoStartDate,
                    thumbnail: videoData.thumbnailURI,
                    public: true,
                    highLights: videoHighLights,
                    screenshots: [],
                    source: [{
                        name: 'facebook',
                        id: video.videoData.videoID
                    }],
                    keywords: ''
                }
                const video = new FacebookVideo(facebookVideoData)
                const savedVideo = await video.save()
                countChatData(savedVideo._id)
                console.log(`[Facebook Vide Saved] - ${facebookVideoData.title}`)
                videoDownloader(savedVideo)
                isFacebook = false
            } catch (error) {
                console.log(error)
            }
        }
    }
}

module.exports = bot
