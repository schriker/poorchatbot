const mongoose = require('mongoose')
const { streamers } = require('../consts')

const Schema = mongoose.Schema

const facebookVideoSchema = new Schema({
  facebookId: String,
  youTubeId: String,
  url: String,
  title: String,
  thumbnail: String,
  duration: String,
  views: Number,
  started: Date,
  public: Boolean,
  highLights: Array,
  chatData: Array
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
      [streamer.name]: mongoose.model(`${streamer.name}_video`, facebookVideoSchema)
    }
  }

  module.exports = models