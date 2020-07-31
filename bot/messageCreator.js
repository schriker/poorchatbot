const messageCreator = (IRCMessage, date) => {
  const messageBody = IRCMessage.params[1]
  const messageChannel  = IRCMessage.params[0]
  let subscription = 0
  let subscriptiongifter = 0
  let week_position = null

  const author = IRCMessage.command === 'PRIVMSG' ? IRCMessage.prefix.split('!')[0] : 'irc.poorchat.net'
  
  if (IRCMessage.tags['poorchat.net/subscription']) {
      subscription = JSON.parse(IRCMessage.tags['poorchat.net/subscription'].replace(/\\s/g,'')).months
  }

  if (IRCMessage.tags['poorchat.net/subscriptiongifter']) {
      subscriptiongifter = JSON.parse(IRCMessage.tags['poorchat.net/subscriptiongifter'].replace(/\\s/g,'')).months
      week_position = JSON.parse(IRCMessage.tags['poorchat.net/subscriptiongifter'].replace(/\\s/g,'')).week_position
  }

  const messageData = {
      type: IRCMessage.command,
      channel: messageChannel,
      author: author,
      body: messageBody,
      color: IRCMessage.tags['poorchat.net/color'] || '',
      subscription: subscription,
      subscriptiongifter: subscriptiongifter,
      week_position: week_position
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