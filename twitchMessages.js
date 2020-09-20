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

// connect(() => fetchTwitchMessages(746735902));

module.exports = fetchTwitchMessages;
