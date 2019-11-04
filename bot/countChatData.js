const Message = require('../models/message')
const Video = require('../models/facebookVideo')

const countChatData = async (videoId, name) => {
  const chatData = []
  const video = await FacebookVideo[name].findById(videoId)
  const messages = await Message[name].find({ createdAt: { $gt: video.started, $lt: video.createdAt } }).sort({ createdAt: 'asc' })
  const duration = new Date(video.createdAt) - new Date(video.started)

  for (let i = 0; i < duration; i += 60000 ) {
    const messagesCount = messages.filter((message) => {
      const messageTime = new Date(message.createdAt) - new Date(video.started)
      if (messageTime > i && messageTime < i + 60000) {
        return true
      } else {
        return false
      }
    })
    chatData.push(messagesCount.length)   
  }
  video.chatData = chatData
  video.save()
}

module.exports = countChatData