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
        console.log(`Stream online: ${message.data.stream.status}`)
        if (message.data.stream.status) {
            client.say('Dafuq')
        }
    })
    
    
    client.on('message', (msg) => console.log(msg))

    client.on('join', (message) => {
        const user = message.prefix.split('!')[0]
        console.log(`${user} has joined!`)
        if (user === 'Wonziu' || user === 'dzej') {
            setTimeout(() => client.say(`Siema ${user} o7`), 2000)
        }
    })
}

app()