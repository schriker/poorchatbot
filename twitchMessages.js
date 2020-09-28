const config = require('./config.json');
const axios = require('axios');
const mongoose = require('mongoose');
const Message = require('./models/message');

const fetchTwitchMessages = async (videoId, cursor) => {
  try {
    const url = `https://api.twitch.tv/v5/videos/${videoId}/comments?${
      cursor ? `cursor=${cursor}` : `content_offset_seconds=0`
    }`;
    const response = await axios.get(url, {
      headers: {
        Accept: 'application/vnd.twitchtv.v5+json',
        'Client-ID': config.TWITCH_CLIENT_ID,
      },
    });

    if (response.data.comments.length) {
      response.data.comments.forEach(async (comment) => {
        const message = new Message({
          type: 'TWITCH',
          author: comment.commenter.display_name,
          body: comment.message.body,
          color: comment.message.user_color,
          subscription: 0,
          subscriptiongifter: 0,
          week_position: 0,
          createdAt: comment.created_at,
        });
        await message.save();
      });
    }

    if (response.data._next) {
      fetchTwitchMessages(videoId, response.data._next);
    } else {
      console.log(`[Twitch Messages Saved] - ${videoId}`);
    }
  } catch (err) {
    console.log(err);
  }
};

const connect = (afterConnectCallback) => {
  const mongoHost = `mongodb://${config.DB_USERNAME}:${config.DB_PASS}@${config.DB_HOST}/${config.DB_NAME}`;

  console.log('Contecting to DB...');
  mongoose
    .connect(mongoHost, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('DB connected!');
      afterConnectCallback();
    })
    .catch((err) => {
      console.log(err);
    });
};

const removeDuplicates = async () => {
  const messages = await Message.find({ type: 'TWITCH' }).sort({ createdAt: -1 })
  console.log(messages.length)
  messages.forEach(async message => {
    if (messages.some(el => {
      return el.body === message.body && el._id !== message._id
    })) {
      await Message.deleteOne({ _id: message._id })
      console.log('Duplikat:', message.body)
    } else {
      // console.log('Nie:', message.body);
    }
  })
}

connect(() => fetchTwitchMessages(751678611));
// connect(removeDuplicates);

module.exports = fetchTwitchMessages;
