const Poorchat = require('./poorchat')
const WebSocket = require('ws')
const ReconnectingWebSocket = require('reconnecting-websocket')
const Message = require('./models/message')
const FacebookVideo = require('./models/facebookVideo')
const config = require('./config.json')
const merge = require('lodash.merge')
const axios = require('axios')
const msToTime = require('./helpers/milisecondsToTime')
const facebookVideoDownloader = require('./facebookVideoDownloader')

const bot = async () => {
    let message = {}
    let isFacebook = false
    let isNvidia = false
    let currentStatus = null
    let videoStartDate = null
    let facebookVideoData = {}
    const highLights = [
        'XD',
        'KEK',
        'LUL',
        'LOL',
        'Clap',
        '10na10',
        'Gg',
        'Dafuq',
        'PepeHands',
        'monkaS',
        'CoDoKur',
        'GOTY',
        'Feels',
        'DZEJowiec',
        'Pepega',
        'REe',
        'HAhaa',
        'Sheeeit',
        'ANELE',
        'pepeJAM',
        'ANGERY'
    ]
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

    const client = new Poorchat(options)
    await client.connect()

    const notifier = new ReconnectingWebSocket('https://api.pancernik.info/notifier', [], {
        WebSocket: WebSocket
    })
    console.log('Working...')    
    notifier.addEventListener('message', (response) => {
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
                videoHighLights = []
                videoStartDate = date
                isFacebook = message.data.stream.services.filter(service => service.name === 'facebook')[0].status
                if (message.data.stream.services.filter(service => service.id === 'nvidiageforcepl').length > 0) {
                    isNvidia = message.data.stream.services.filter(service => service.id === 'nvidiageforcepl')[0].status
                }
                console.log(`Stream: [Online] - ${date}`)
                client.on('message', messageHandler)
            } else if (!currentStatus) {
                console.log(`Stream: [Offline] - ${date}`)
                client.off('message', messageHandler)
                searchFacebookVideo(message.data.topic.text)
            }
        }
    })

    const messageHandler = async (IRCMessage) => {
        const messageBody = IRCMessage.params[1]
        let subscription = 0
        let subscriptiongifter = 0

        const author = IRCMessage.command === 'PRIVMSG' ? IRCMessage.prefix.split('!')[0] : 'irc.poorchat.net'
        
        if (IRCMessage.tags['poorchat.net/subscription']) {
            subscription = JSON.parse(IRCMessage.tags['poorchat.net/subscription'].replace('\\s', ' ')).months
        }

        if (IRCMessage.tags['poorchat.net/subscriptiongifter']) {
            subscriptiongifter = JSON.parse(IRCMessage.tags['poorchat.net/subscriptiongifter'].replace('\\s', ' ')).months
        }

        const messageData = {
            type: IRCMessage.command,
            author: author,
            body: messageBody,
            color: IRCMessage.tags['poorchat.net/color'] || '',
            subscription: subscription,
            subscriptiongifter: subscriptiongifter
        }

        const message = new Message(messageData)
        try {
            message.save()
        } catch (error) {
            console.log(error)
        }

        totalMessagesCount += 1

        for (let keyWord of highLights) {
            if (messageBody.toLowerCase().includes(keyWord.toLowerCase())) {
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

    const countChatData = async (videoId) => {
        const chatData = []
        const video = await FacebookVideo.findById(videoId)
        const messages = await Message.find({ createdAt: { $gt: video.started, $lt: video.createdAt } }).sort({ createdAt: 'asc' })
        const duration = new Date(video.createdAt) - new Date(video.started) // ms

        for (let i = 0; i < duration; i += 60000 ) {
          const messagesCount = messages.filter((message) => {
            const messageTime = new Date(message.createdAt) - new Date(video.started)
            if (messageTime > i && messageTime < i + 60000) {
              return true
            } else {
              return false
            }
          })
          chatData.push({ [i]: messagesCount.length })   
        }
        video.chatData = chatData
        await video.save()
    }

    const searchFacebookVideo = async (videoTitle) => {
        if (videoStartDate && isNvidia) {
            try {
                const response = await axios.get('https://api.twitch.tv/helix/videos?user_id=93141680', {
                headers: {
                    'Client-ID': 'w87bqmg0y9ckftb2aii2tdielbr1rx'
                    }
                })
                const video = response.data.data[0]

                facebookVideoData = {
                    facebookId: video.id,
                    url: video.url,
                    title: video.title,
                    views: video.view_count,
                    duration: video.duration,
                    started: videoStartDate,
                    thumbnail: video.thumbnail_url,
                    public: false,
                    highLights: videoHighLights
                }
                const videoTwitch = new FacebookVideo(facebookVideoData)
                const savedVideo = await videoTwitch.save()
                countChatData(savedVideo._id)
                console.log(`Twitch Video Saved - ${facebookVideoData.title}`)
                setTimeout(() => facebookVideoDownloader(savedVideo), 1800000)
                isNvidia = false
            } catch (err) {
                console.log(err)
            }
        }
        if (videoStartDate && isFacebook) {
            try {
                const response = await axios.get('https://www.facebook.com/pages/videos/search/?page_id=369632869905557&__a')
                const videoData = JSON.parse(response.data.split('for (;;);')[1]).payload.page.video_data[0]
                facebookVideoData = {
                    facebookId: videoData.videoID,
                    url: videoData.videoURL,
                    title: videoData.title || videoTitle,
                    views: 0,
                    duration: msToTime(new Date() - videoStartDate),
                    started: videoStartDate,
                    thumbnail: videoData.thumbnailURI,
                    public: true,
                    highLights: videoHighLights
                }
                const video = new FacebookVideo(facebookVideoData)
                const savedVideo = await video.save()
                countChatData(savedVideo._id)
                console.log(`FB Vide Saved - ${facebookVideoData.title}`)
                setTimeout(() => facebookVideoDownloader(savedVideo), 1800000)
                isFacebook = false
            } catch (error) {
                console.log(error)
            }
        }
    }
}

module.exports = bot
