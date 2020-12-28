const { getAccessToken } = require('./youtubeUpload');
const { google } = require('googleapis');
const config = require('./config.json');

const getYouTubeClient = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const oAuthClient = new google.auth.OAuth2(
        config.YT_API.CLIENT_ID,
        config.YT_API.CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      );
      oAuthClient.credentials = await getAccessToken();

      const youtube = google.youtube({
        version: 'v3',
        auth: oAuthClient,
      });

      resolve(youtube);
    } catch (err) {
      console.log(err);
      reject();
    }
  });
};

const getCurrentYTStream = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const youtube = await getYouTubeClient();

      const result = await youtube.liveBroadcasts.list({
        part: ['snippet,contentDetails,status'],
        broadcastStatus: 'active',
        broadcastType: 'all',
      });

      resolve(result.data.items);
    } catch (err) {
      reject(err);
    }
  });
};

const getYTChatMessages = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const youtube = await getYouTubeClient();

      const result = await youtube.liveChatMessages.list({
        liveChatId: id,
        part: ['snippet', 'authorDetails', 'id'],
        maxResults: 2000,
      });

      resolve(result.data.items);
    } catch (err) {
      reject(err);
    }
  });
};

const getYTVideoDetials = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const youtube = await getYouTubeClient();

      const videoDetails = await youtube.videos.list({
        part: ['snippet', 'contentDetails', 'liveStreamingDetails'],
        id: id,
      });

      console.log(videoDetails.data.items);

      const [videoFromYouTube] = videoDetails.data.items;

      resolve(videoFromYouTube);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  getCurrentYTStream,
  getYTChatMessages,
  getYTVideoDetials,
};
