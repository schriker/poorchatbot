const Poorchat = require('./poorchat')
const WebSocket = require('ws')
const ora = require('ora')
const chalk = require('chalk')

const app = async () => {
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
    const spinner = ora({
        prefixText: `${chalk.bgYellow.black('[Listening]')}`,
        color: 'yellow',
        spinner: 'line'
    })
    const client = new Poorchat(options)
    await client.connect()

    const notifier = new WebSocket('https://api.pancernik.info/notifier')
    
    notifier.on('message', (data) => {
        const message = JSON.parse(data)
        if (message.type === 'ping') {
            const pong = JSON.stringify({ type: 'pong' })
            notifier.send(pong)
        }
        if ((message.type === 'status' || message.type === 'update') && message.data.stream !== undefined) {
            if (message.data.stream.status) {
                console.log(`${chalk.bgCyan.black('Stream:')}${chalk.bgGreen.green('[online]')}`)
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

    const messageHandler = (msg) => {
        console.log(msg)
    }
    
    client.on('join', (message) => {
        const user = message.prefix.split('!')[0]
        if (user === 'Wonziu' || user === 'dzej') {
            // client.say(`monkaS`)
        }
    })
}

app()