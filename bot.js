const Poorchat = require('./poorchat')
const WebSocket = require('ws')
const ReconnectingWebSocket = require('reconnecting-websocket')
const Message = require('./models/message')
const FacebookVideo = require('./models/facebookVideo')
const config = require('./config.json')
const merge = require('lodash.merge')
const puppeteer = require('puppeteer');

const bot = async () => {
    let message = {}
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
                console.log(`Stream: [Online] - ${date}`)
                client.on('message', messageHandler)
                facebookVideoScraper(message.data.topic.text)
            } else if (!currentStatus) {
                console.log(`Stream: [Offline] - ${date}`)
                client.off('message', messageHandler)
                facebookVideoSave()
            }
        }
    })

    const messageHandler = async (IRCMessage) => {
        const messageBody = IRCMessage.params[1]
        
        let subscription = 0
        let subscriptiongifter = 0
        
        if (IRCMessage.tags['poorchat.net/subscription']) {
            subscription = JSON.parse(IRCMessage.tags['poorchat.net/subscription'].replace('\\s', ' ')).months
        }

        if (IRCMessage.tags['poorchat.net/subscriptiongifter']) {
            subscriptiongifter = JSON.parse(IRCMessage.tags['poorchat.net/subscriptiongifter'].replace('\\s', ' ')).months
        }

        const messageData = {
            author: IRCMessage.prefix.split('!')[0],
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

    const facebookVideoScraper = async (videoTitle) => {
        try {
            const browser = await puppeteer.launch()
            const page = await browser.newPage()
            await page.goto('https://developers.facebook.com/docs/plugins/embedded-video-player/') // Change URL to jadisco.pl
            await page.waitForSelector('.fb-video')
            const videoUrl = await page.$eval('.fb-video', el => el.getAttribute('data-href'))
            console.log(videoUrl)
            facebookVideoData = {
                url: videoUrl,
                title: videoTitle
            }
        } catch (error) {
            console.log(error)
        }
    }

    const facebookVideoSave = async () => {
        try {
            if (facebookVideoData.url !== undefined) {
                facebookVideoData = {
                    ...facebookVideoData,
                    duration: new Date() - videoStartDate
                }
                const video = new FacebookVideo(facebookVideoData)
                await video.save()
                console.log(`Facebook Video - ${videoTitle}`)
            }
        } catch (error) {
            console.log(error)
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
