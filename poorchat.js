const WebSocket = require('ws')
const EventEmitter = require('events')
const parse = require('irc-message').parse
const ora = require('ora')
const chalk = require('chalk')

class Poorchat extends EventEmitter {
    constructor(options) {
        super()
        this.ws = new WebSocket(options.websocket, 'base64')
        this.login = options.login
        this.password = options.password
        this.cap = options.cap
        this.channel = options.channel
        this.debug = options.debug 
        this.options = options
    }

    messageEncode(data) {
        return Buffer.from(`${data}\r\n`).toString('base64')
    }

    messageDecode(data) {
        return Buffer.from(data, 'base64').toString('utf-8')
    }

    sendMessage(message) {
        const encodedMessage = this.messageEncode(message)
        this.ws.send(encodedMessage)
    }

    readMessage(data) {
        const decodedMessage = this.messageDecode(data)
        return parse(decodedMessage)
    }

    say(data) {
        const encodedMessage = this.messageEncode(`PRIVMSG ${this.channel} :${data}`)
        this.ws.send(encodedMessage)
    }

    connect() {
        return new Promise((resolve) => {
            const spinner = ora({
                prefixText: `${chalk.bgYellow.black('[Connecting]')}`,
                color: 'yellow',
                spinner: 'line'
            })
            this.ws.on('open', () => {
                spinner.start()
                this.sendMessage(`NICK ${this.login}`)
                this.sendMessage(`USER ${this.login} ${this.options.irc} Poorchat ${this.login}`)
                for (const cap of this.cap) {
                    this.sendMessage(cap)
                }
                this.sendMessage('CAP END')
            })
            this.ws.on('message', (data) => {
                const message = this.readMessage(data)

                if (message.command === '422') {
                this.sendMessage(`PRIVMSG Poorchat :LOGIN ${this.login} ${this.password}`)
                this.sendMessage(`JOIN ${this.channel}`)
                }
    
                if (message.command === 'JOIN' && message.prefix.split('!')[0] === this.login) {
                    spinner.stopAndPersist()
                    console.log(`${chalk.bgGreen.black('[IRC Connected]\n')}`)
                    resolve()
                }

                this.messageHandler(message)
                if (this.debug) {
                    console.log(message)
                }
            })
        })
    }

    messageHandler(message) {
        switch (message.command) {
            case 'PING':
                this.sendMessage(`PONG ${message.params[0]}`)
                break
            case 'PRIVMSG':
                this.emit('message', message)
                break
            case 'JOIN':
                this.emit('join', message)
                break
            case 'PART':
                this.emit('part', message)
                break
            default: 
                if (this.debug) {
                    console.log(message)
                }
        }
    }
}

module.exports = Poorchat