const mongoose = require('mongoose')

const Schema = mongoose.Schema

const messageSchema = new Schema({
  author: {
    required: true,
    type: String
  },
  body: {
    required: true,
    type: String,
  },
  color: {
    required: true,
    type: String
  },
  subscription: Number,
  subscriptiongifter: Number,
  }, 
  {
    timestamps: { 
      createdAt: 'created_at',
      updatedAt: 'updated_at' 
    }
  })

  module.exports = mongoose.model('Message' ,messageSchema)