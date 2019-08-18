const WebSocket = require('ws')
const EventEmitter = require('events')
const parse = require('irc-message').parse

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

    connect() {
        return new Promise((resolve) => {
            this.ws.on('open', () => {
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
                this.messageHandler(message)
                if (this.debug) {
                    console.log(message)
                }
                resolve()
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
                this.emit('joined', message)
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