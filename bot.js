const Poorchat = require('./poorchat')
const WebSocket = require('ws')
const ReconnectingWebSocket= require('reconnecting-websocket')
const ora = require('ora')
const chalk = require('chalk')
const Message = require('./models/message')
const config = require('./config.json')

const bot = async () => {
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
    const spinner = ora({
        prefixText: `${chalk.bgYellow.black('[Listening]')}`,
        color: 'yellow',
        spinner: 'line'
    })
    const client = new Poorchat(options)
    await client.connect()

    const notifier = new ReconnectingWebSocket('https://api.pancernik.info/notifier', [], {
        WebSocket: WebSocket
    })
    spinner.start()    
    notifier.addEventListener('message', (data) => {
        const message = JSON.parse(data.data)
        if (message.type === 'ping') {
            const pong = JSON.stringify({ type: 'pong' })
            notifier.send(pong)
        } else if (message.type === 'update' && message.data.stream !== undefined) { 
            if (message.data.stream.viewers > 0 ) {
                return
            }
        } else if ((message.type === 'status' || message.type === 'update') && message.data.stream !== undefined) {
            if (message.data.stream.status) {
                console.log(`${chalk.bgCyan.black('Stream:')}${chalk.bgGreen.black('[online]')}`)
                client.say('Dafuq')
                client.on('message', messageHandler)
                spinner.start()
            } else if (!message.data.stream.status) {
                console.log(`${chalk.bgCyan.black('Stream:')}${chalk.bgRed.black('[offline]')}`)
                client.say('PepeHands')
                client.off('message', messageHandler)
                spinner.stop()
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
            color: IRCMessage.tags['poorchat.net/color'] || '#8000FF',
            subscription: subscription,
            subscriptiongifter: subscriptiongifter
        }
        const message = new Message(messageData)
        try {
            await message.save()
        } catch (error) {
            console.log(error)
        }
    }
    
    client.on('join', (message) => {
        const user = message.prefix.split('!')[0]
        if (user === 'Wonziu' || user === 'dzej') {
            client.say('monkaS')
        }
    })
}

module.exports = bot