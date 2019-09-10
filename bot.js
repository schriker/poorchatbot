const Poorchat = require('./poorchat')
const WebSocket = require('ws')
const ReconnectingWebSocket = require('reconnecting-websocket')
const Message = require('./models/message')
const FacebookVideo = require('./models/facebookVideo')
const config = require('./config.json')
const merge = require('lodash.merge')
const axios = require('axios')
const msToTime = require('./helpers/milisecondsToTime')

const bot = async () => {
    let message = {}
    let isDzej = false
    let currentStatus = null
    let videoStartDate = null
    let facebookVideoData = {}
    
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
        if (currentStatus !== message.data.stream.status) {
            const date = new Date()
            currentStatus = data.data.stream.status
            if (currentStatus) {
                videoStartDate = date
                isDzej = message.data.stream.services.filter(service => service.streamer_id === 2)[0].status
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
    }

    const searchFacebookVideo = async (videoTitle) => {
        if (videoStartDate && !isDzej) {
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
                    public: true
                }
                const video = new FacebookVideo(facebookVideoData)
                await video.save()
                console.log(`FB Vide Saved - ${facebookVideoData.title}`)
            } catch (error) {
                console.log(error)
            }
        } else {
            isDzej = false
        }
    }
    
    // client.on('join', (message) => {
    //     const user = message.prefix.split('!')[0]
    //     if (user === 'Wonziu') {
    //        client.say('4Head')
    //     }
    // })
}

module.exports = bot
