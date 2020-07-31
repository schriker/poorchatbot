const mongoose = require('mongoose')

const Schema = mongoose.Schema

const messageSchema = new Schema({
  type: String,
  author: {
    required: true,
    type: String
  },
  body: {
    required: true,
    type: String,
  },
  color: {
    required: false,
    type: String
  },
  subscription: Number,
  subscriptiongifter: Number,
  week_position: Number,
  }, 
  {
    timestamps: { 
      createdAt: true,
      updatedAt: false
    }
  })

  module.exports = mongoose.model('wonziu_message', messageSchema)
