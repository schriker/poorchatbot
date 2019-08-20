const Poorchat = require('./poorchat')
const WebSocket = require('ws')

const options = {
    websocket: 'https://irc.poorchat.net/',
    irc: 'irc.poorchat.net',
    channel: '#jadisco',
    login: process.env.USER_LOGIN,
    password: process.env.USER_PASSWORD,
    cap: [
        'CAP REQ :poorchat.net/color',
        'CAP REQ :poorchat.net/subscription',
        'CAP REQ :poorchat.net/subscriptiongifter',
        'CAP REQ :multi-prefix'
    ],
    debug: false
}

const app = async () => {
    const client = new Poorchat(options)
    await client.connect()

    const notifier = new WebSocket('https://api.pancernik.info/notifier')
    
    notifier.on('message', (data) => {
        const message = JSON.parse(data)
        console.log(message)
        if (message.type === 'ping') {
            const pong = JSON.stringify({ type: 'pong' })
            notifier.send(pong)
        }
        if ((message.type === 'status' || message.type === 'update') && message.data.stream.status !== undefined) {
            if (message.data.stream.status) {
                console.log(`Stream online!`)
                client.say('Dafuq')
                client.on('message', messageHandler)
            } else if (!message.data.stream.status) {
                console.log(`Stream offline!`)
                client.say('PepeHands')
                client.off('message', messageHandler)
            }

        }
    })

    const messageHandler = (msg) => {
        console.log(msg)
    }
    
    client.on('join', (message) => {
        const user = message.prefix.split('!')[0]
        if (user === 'Wonziu' || user === 'dzej') {
            client.say(`monkaS`)
        }
    })
}

app()