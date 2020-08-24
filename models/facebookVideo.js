const mongoose = require('mongoose')
const mongoosastic = require('mongoosastic')

const Schema = mongoose.Schema

const facebookVideoSchema = new Schema(
  {
    videoId: { type: String, es_indexed: true },
    url: String,
    title: { type: String, es_indexed: true,  es_analyzer: 'autocomplete' },
    thumbnail: String,
    screenshots: Array,
    source: Array,
    duration: String,
    views: Number,
    started: Date,
    public: { type: Boolean, es_indexed: true  },
    highLights: Array,
    chatData: Array,
    keywords: { type: String, es_indexed: true, es_analyzer: 'autocomplete' },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
)

facebookVideoSchema.plugin(mongoosastic)

module.exports = mongoose.model('wonziu_video', facebookVideoSchema)