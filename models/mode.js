const mongoose = require('mongoose')
const Schema = mongoose.Schema

const modeSchema = new Schema({
    channel: {
      type: String,
      required: true
    },
    mode: {
      type: [String],
      required: true
    },
    user: {
      type: String,
      required: true
    },
  },
  {
    timestamps: { 
      createdAt: true,
      updatedAt: true
    }
  })

  modeSchema.index({ user: 1 })

  module.exports = mongoose.model('wonziu_mode', modeSchema)