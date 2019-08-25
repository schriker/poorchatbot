const Poorchat = require('./poorchat')
const WebSocket = require('ws')
const ReconnectingWebSocket = require('reconnecting-websocket')
const Message = require('./models/message')
const config = require('./config.json')
const merge = require('lodash.merge')

const bot = async () => {
    let message = {}
    let currentStatus = null
    
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
            currentStatus = data.data.stream.status
            if (currentStatus) {
                console.log('Stream: [Online]')
               // client.say('Dafuq')
                client.on('message', messageHandler)
            } else if (!currentStatus) {
                console.log('Stream [Offline]')
               // client.say('PepeHands')
                client.off('message', messageHandler)
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
    
    client.on('join', (message) => {
        const user = message.prefix.split('!')[0]
        if (user === 'Wonziu' || user === 'dzej') {
          //  client.say('monkaS')
        }
    })
}

module.exports = bot
