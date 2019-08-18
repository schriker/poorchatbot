const Poorchat = require('./poorchat')

const options = {
    websocket: 'wss://irc.poorchat.net/',
    irc: 'irc.poorchat.net',
    channel: '#jadisco',
    login: process.env.USER_NAME,
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
    // client.sendMessage('Test')
    client.on('message', (msg) => console.log(msg))
}

app()