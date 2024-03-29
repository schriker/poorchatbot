const Poorchat = require('./poorchat');
const WebSocket = require('ws');
const { highLights } = require('./consts');
const ReconnectingWebSocket = require('reconnecting-websocket');
const Message = require('./models/message');
const FacebookVideo = require('./models/facebookVideo');
const config = require('./config.json');
const merge = require('lodash.merge');
const axios = require('axios');
const msToTime = require('./helpers/milisecondsToTime');
const sleep = require('./helpers/sleep');
const messageCreator = require('./bot/messageCreator');
const countChatData = require('./bot/countChatData');
const modeHandler = require('./bot/modeHandler');
const videoDownloader = require('./videoDownloader');
const fetchTwitchMessages = require('./twitchMessages');
const { koronaVote, stopKoronaVote } = require('./bot/koronaVote');
const { lastStream } = require('./bot/lastStream');
const {
  getCurrentYTStream,
  getYTVideoDetials,
} = require('./youTubeLatestStream');
const CronJob = require('cron').CronJob;

const bot = async () => {
  let message = {
    type: '',
    data: {
      streamers: [],
      stream: {
        status: false,
        viewers: 0,
        services: [],
        online_at: '',
        offline_at: '',
      },
      topic: {
        id: 0,
        text: '',
        updated_at: '',
      },
    },
  };
  let YTVideoId = null;
  let YTChatId = null;
  let service = null;
  let currentStatus = null;
  let videoStartDate = null;
  let facebookVideoData = {};
  let videoHighLights = [];
  let highLightsType = '';
  let highLightsCount = 0;
  let highLightsTime = null;
  let highLightsTimer = null;
  let totalMessagesCount = 0;
  let notifierPongInterval = null;

  const options = {
    websocket: 'https://irc.poorchat.net/',
    irc: 'irc.poorchat.net',
    channel: '#jadisco',
    login: config.USER_LOGIN,
    password: config.USER_PASSWORD,
    cap: [
      'CAP REQ :batch',
      'CAP REQ :cap-notify',
      'CAP REQ :echo-message',
      'CAP REQ :server-time',
      'CAP REQ :msgid',
      'CAP REQ :poorchat.net/blocks',
      'CAP REQ :poorchat.net/clear',
      'CAP REQ :poorchat.net/embed',
      'CAP REQ :poorchat.net/color',
      'CAP REQ :poorchat.net/subscription',
      'CAP REQ :poorchat.net/subscriptiongifter',
      'CAP REQ :multi-prefix',
    ],
    debug: false,
  };

  const messageHandler = async (IRCMessage) => {
    const messageData = messageCreator(IRCMessage);
    const message = new Message(messageData);

    try {
      if (message.author.toLowerCase() !== "guest") {
        message.save();
      }
    } catch (error) {
      console.log(error);
    }

    totalMessagesCount += 1;

    for (let keyWord of highLights) {
      if (messageData.body.toLowerCase().includes(keyWord.toLowerCase())) {
        highLightsCount += 1;
        if (highLightsCount === 1) {
          totalMessagesCount = 1;
          highLightsType = keyWord;
          highLightsTime = new Date();
        }
        if (highLightsCount >= 1) {
          clearTimeout(highLightsTimer);
          highLightsTimer = setTimeout(() => {
            let percent = (highLightsCount / totalMessagesCount) * 100;
            if (percent >= 50 && highLightsCount > 5) {
              videoHighLights.push({
                time: highLightsTime,
                percent: percent,
                highLightsCount: highLightsCount,
                totalMessagesCount: totalMessagesCount,
                type: highLightsType,
              });
            }
            highLightsCount = 0;
          }, 10000);
        }
      }
    }
  };

  const notifier = new ReconnectingWebSocket(
    'https://api.pancernik.info/notifier',
    [],
    {
      WebSocket: WebSocket,
    }
  );

  const client = new Poorchat(options);
  await client.connect();

  console.log('Working...');
  client.on('message', messageHandler);
  client.on('message', (IRCMessage) => lastStream(IRCMessage, client));
  client.on('mode', async (IRCMessage) => await modeHandler(IRCMessage));

  if (!notifierPongInterval) {
    notifierPongInterval = setInterval(() => {
      const pong = JSON.stringify({ type: 'pong' });
      notifier.send(pong);
    }, 30000);
  }

  notifier.addEventListener('close', () => {
    clearInterval(notifierPongInterval);
    notifierPongInterval = null;
  });

  notifier.addEventListener('message', async (response) => {
    const data = JSON.parse(response.data);
    message = merge(message, data);
    if (message.type === 'ping') {
      const pong = JSON.stringify({ type: 'pong' });
      notifier.send(pong);
    }

    const newMessageStatus = message.data.stream.services
      .filter((service) => service.streamer_id === 1)
      .some((el) => el.status === true);

    if (currentStatus !== newMessageStatus) {
      const date = new Date();
      currentStatus = newMessageStatus;
      if (currentStatus) {
        service = message.data.stream.services.find(
          (service) => service.status === true
        );
        videoStartDate = date;

        if (service.name === 'youtube') {
          const [YTStream] = await getCurrentYTStream();
          YTChatId = YTStream.snippet.liveChatId;
          YTVideoId = YTStream.id;
        }

        console.log(`Stream: [Online] - ${date} - ${service.id}`);
      } else if (!currentStatus) {
        console.log(`Stream: [Offline] - ${date}`);
        searchFacebookVideo(message.data.topic.text);
      }
    }
  });

  const searchFacebookVideo = async (videoTitle) => {
    if (
      videoStartDate &&
      (service.name === 'twitch' ||
        service.name === 'trovo' ||
        service.name === 'youtube')
    ) {
      try {
        if (service.name === 'twitch' || service.name === 'trovo') {
          const channelId = await axios.get(
            `https://api.jarchiwum.pl/users?login=${service.id}`
          );
          const response = await axios.get(
            `https://api.jarchiwum.pl/videos_twitch?user_id=${channelId.data.data[0].id}`
          );

          const video = response.data.data[0];

          const duration_array = video.duration.split(/[hms]+/);
          const parsed = duration_array
            .filter((number) => number !== '')
            .map((number) => {
              if (number.length === 1) {
                return `0${number}`;
              } else {
                return number;
              }
            });

          while (parsed.length < 3) {
            parsed.unshift('00');
          }

          const exists = await FacebookVideo.find({ videoId: video.id });

          if (exists.length === 0) {
            facebookVideoData = {
              videoId: video.id,
              url: video.url,
              title: video.title,
              views: video.view_count,
              duration:
                duration_array.length === 1
                  ? duration_array[0]
                  : parsed.join(':'),
              started: video.created_at,
              thumbnail: video.thumbnail_url,
              public: true,
              highLights: videoHighLights,
              screenshots: [],
              source: [
                {
                  name: 'twitch',
                  id: video.id,
                },
              ],
              keywords: '',
            };
            const videoTwitch = new FacebookVideo(facebookVideoData);
            const savedVideo = await videoTwitch.save();
            videoHighLights = [];
            countChatData(savedVideo._id);
            console.log(`[Twitch Video Saved] - ${facebookVideoData.title}`);
            videoDownloader(savedVideo);
            fetchTwitchMessages(savedVideo.videoId);
          }
        } else {
          await sleep(1000 * 60 * 5);
          const video = await getYTVideoDetials(YTVideoId);
          const exists = await FacebookVideo.find({ videoId: video.id });

          if (exists.length === 0 && video.liveStreamingDetails.actualEndTime) {
            const iso8601DurationRegex = /PT(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?/;

            const matches = video.contentDetails.duration.match(iso8601DurationRegex);

            matches.shift();

            const parsed = matches.map((time) => time === undefined ? "00" : time.length === 1 ? `0${time}` : time);

            facebookVideoData = {
              videoId: video.id,
              url: `https://www.youtube.com/watch?v=${video.id}`,
              title: video.snippet.title,
              views: 0,
              duration: parsed.join(':'),
              started: video.liveStreamingDetails.actualStartTime,
              thumbnail: `https://i.ytimg.com/vi/${video.id}/mq3.jpg`,
              public: true,
              highLights: videoHighLights,
              screenshots: [],
              source: [
                {
                  name: 'youtube',
                  id: video.id,
                },
              ],
              keywords: '',
            };

            const videoTwitch = new FacebookVideo(facebookVideoData);
            const savedVideo = await videoTwitch.save();
            videoHighLights = [];
            countChatData(savedVideo._id);
            console.log(`[YouTube Video Saved] - ${facebookVideoData.title}`);
          }
        }
        service = null;
      } catch (err) {
        console.log(err);
      }
    }
  };
};

module.exports = bot;
