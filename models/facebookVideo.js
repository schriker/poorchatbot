const mongoose = require('mongoose')

const Schema = mongoose.Schema

const facebookVideoSchema = new Schema({
  facebookId: String,
  url: {
    required: true,
    type: String
    },
  title: {
    required: true,
    type: String
  },
  thumbnail: String,
  duration: String,
  views: Number,
  started: Date
  },
  {
    timestamps: { 
      createdAt: true,
      updatedAt: false
    }
  })

  module.exports = mongoose.model('FacebookVideo', facebookVideoSchema)