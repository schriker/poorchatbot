const Poorchat = require('./poorchat')
const WebSocket = require('ws')
const ReconnectingWebSocket = require('reconnecting-websocket')
const Message = require('./models/message')
const Video = require('./models/facebookVideo')
const config = require('./config.json')
const merge = require('lodash.merge')
const axios = require('axios')
const qs = require('querystring')
const msToTime = require('./helpers/milisecondsToTime')
const messageCreator = require('./bot/messageCreator')
const countChatData = require('./bot/countChatData')
const saveMessagesBuffer = require('./bot/saveMessagesBuffer')

const bot = async ({ name, highLights, pageId, twitchId }) => {
    let message = {}
    let isFacebook = false
    let isTwitch = false
    let currentStatus = null
    let videoStartDate = null
    let facebookVideoData = {}
    const messagesBuffer = []
    let videoHighLights = []
    let highLightsType = ''
    let highLightsCount = 0
    let highLightsTime = null
    let highLightsTimer = null
    let totalMessagesCount = 0
    
    const options = {
        websocket: 'https://irc.poorchat.net/',
        irc: 'irc.poorchat.net',
        channel: `#${name}`,
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

    const messagesBufferHandler = async (IRCMessage) => {
        const messageData = messageCreator(IRCMessage, new Date)
        if (messagesBuffer.length > 30) {
            messagesBuffer.shift()
            messagesBuffer.push(messageData)            
        } else {
            messagesBuffer.push(messageData)
        }
    }

    const notifier = new ReconnectingWebSocket(`https://api.${name}.tv/streams`, [], {
        WebSocket: WebSocket
      })
    
    notifier.addEventListener('open', () => {
        const follow = JSON.stringify({ type: 'follow', name: name })
        notifier.send(follow)
    })
    
    console.log('Working...')

    notifier.addEventListener('message', async (response) => {
        const data = JSON.parse(response.data)
        message = merge(message, data)
        if (message.data.type === 'ping') {
            const pong = JSON.stringify({ type: 'pong' })
            notifier.send(pong)
            return
        } 

        const services = Object.values(message.data.services)

        const newMessageStatus = services.some(el => el.status.status === true)

        if (currentStatus !== newMessageStatus) {
            const date = new Date()
            currentStatus = newMessageStatus
            if (currentStatus) {
                isFacebook = services.filter(el => el.service === 'facebook')[0].status.status
                isTwitch = services.filter(el => el.service === 'twitch')[0].status.status

                videoHighLights = []
                videoStartDate = date
                console.log(`${name} is: [Online] - ${date}`)
                client.off('message', messagesBufferHandler)
                client.on('message', messageHandler)
                saveMessagesBuffer(messagesBuffer, name)
            } else if (!currentStatus) {
                console.log(`Stream: [Offline] - ${date}`)
                client.on('message', messagesBufferHandler)
                client.off('message', messageHandler)
                searchFacebookVideo(message.data.topic.text)
            }
        }
    })

    const messageHandler = async (IRCMessage) => {
        const messageData = messageCreator(IRCMessage)
        const message = new Message[name](messageData)

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

    const searchFacebookVideo = async (videoTitle) => {
        if (videoStartDate && isTwitch) {
            try {
                const response = await axios.get(`https://api.twitch.tv/helix/videos?user_id=${twitchId}`, {
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
                const videoTwitch = new Video[name](facebookVideoData)
                const savedVideo = await videoTwitch.save()
                countChatData(savedVideo._id)
                console.log(`Twitch Video Saved - ${facebookVideoData.title}`)
                isNvidia = false
            } catch (err) {
                console.log(err)
            }
        }
        if (videoStartDate && isFacebook) {
            try {
                const response = await axios.get(`https://www.facebook.com/pages/videos/search/?page_id=${pageId}&__a`)
                const videoData = JSON.parse(response.data.split('for (;;);')[1]).payload.page.video_data[0]

                const timeResponse = await axios({
                    url: `https://www.facebook.com/video/tahoe/async/${videoData.videoID}/?payloadtype=secondary`,
                    method: 'POST',
                    data: qs.stringify({ '__a': 1 }),
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                      'User-Agent': 'PostmanRuntime/7.19.0'
                    }
                  })
                  const timeData = JSON.parse(timeResponse.data.split('for (;;);')[1])
                  const ftKey = JSON.parse(timeData.payload.ftKey)
                  const videoTimeStamp = new Date(ftKey.page_insights[ftKey.page_id].post_context.publish_time * 1000)

                facebookVideoData = {
                    facebookId: videoData.videoID,
                    url: videoData.videoURL,
                    title: videoData.title || videoTitle,
                    views: 0,
                    duration: msToTime(new Date() - videoStartDate),
                    started: videoTimeStamp,
                    thumbnail: videoData.thumbnailURI,
                    public: true,
                    highLights: videoHighLights
                }
                const video = new Video[name](facebookVideoData)
                const savedVideo = await video.save()
                countChatData(savedVideo._id)
                console.log(`Facebook Video Saved - ${facebookVideoData.title}`)
                isFacebook = false
            } catch (error) {
                console.log(error)
            }
        }
    }
}

module.exports = bot
