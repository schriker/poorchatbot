const mongoose = require('mongoose')

const Schema = mongoose.Schema

const messageSchema = new Schema({
  url: {
    required: true,
    type: String
    },
  title: {
    required: true,
    type: String
  },
  thumbnail: String,
  duration: {
    required: true,
    type: Number
  }
})

  module.exports = mongoose.model('FacebookVideo', messageSchema)