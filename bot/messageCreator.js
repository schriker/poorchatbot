const messageCreator = (IRCMessage, date) => {
  const messageBody = IRCMessage.params[1]
  let subscription = 0
  let subscriptiongifter = 0

  const author = IRCMessage.command === 'PRIVMSG' ? IRCMessage.prefix.split('!')[0] : 'irc.poorchat.net'
  
  if (IRCMessage.tags['poorchat.net/subscription']) {
      subscription = JSON.parse(IRCMessage.tags['poorchat.net/subscription'].replace('\\s', ' ')).months
  }

  if (IRCMessage.tags['poorchat.net/subscriptiongifter']) {
      subscriptiongifter = JSON.parse(IRCMessage.tags['poorchat.net/subscriptiongifter'].replace('\\s', ' ')).months
  }

  const messageData = {
      type: IRCMessage.command,
      author: author,
      body: messageBody,
      color: IRCMessage.tags['poorchat.net/color'] || '',
      subscription: subscription,
      subscriptiongifter: subscriptiongifter,
  }

  if (date) {
    return {
      ...messageData,
      createdAt: date
    }
  } else {
    return messageData
  }
}

module.exports = messageCreator