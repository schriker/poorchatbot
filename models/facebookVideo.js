const mongoose = require('mongoose')

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
  },
  {
    timestamps: { 
      createdAt: true,
      updatedAt: false
    }
  })

  module.exports = mongoose.model('FacebookVideo', facebookVideoSchema)