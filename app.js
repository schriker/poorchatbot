const Poorchat = require('./poorchat')

const options = {
    websocket: 'wss://irc.poorchat.net/',
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

    client.on('message', (msg) => console.log(msg))
    
    client.on('join', (message) => {
        const user = message.prefix.split('!')[0]
        if (user === 'Wonziu') {
            client.say('Siema Wonziu o7')
        }
    })
}

app()