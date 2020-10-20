const mongoose = require('mongoose')
const Schema = mongoose.Schema

const modeSchema = new Schema({
    user: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: { 
      createdAt: true,
      updatedAt: true
    }
  })

  module.exports = mongoose.model('korona', modeSchema)