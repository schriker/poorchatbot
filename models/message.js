const mongoose = require('mongoose')
const { streamers } = require('../consts')

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
  }, 
  {
    timestamps: { 
      createdAt: true,
      updatedAt: false
    }
  })

  let models = {}

  for (let streamer of streamers) {
    models = {
      ...models,
      [streamer.name]: mongoose.model(`${streamer.name}_message`, messageSchema)
    }
  }

  module.exports = models
