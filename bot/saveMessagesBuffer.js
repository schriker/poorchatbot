const Message = require('../models/message')

const saveMessagesBuffer = async (messagesBuffer) => {
  try {
      for (let messageData of messagesBuffer) {
          const message = new Message(messageData)
          await message.save()
      }
      console.log('Buffer messages saved!')
  } catch (error) {
      console.log(error)
  }
}

module.exports = saveMessagesBuffer