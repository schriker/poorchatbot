const { getAccessToken } = require('./youtubeUpload');
const { google } = require('googleapis');
const config = require('./config.json');

const getYouTubeLatestStream = () => {
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

      const result = await youtube.search.list({
        part: ['snippet'],
        forMine: true,
        maxResults: 25,
        type: ['video'],
      });

      const videoDetails = await youtube.videos.list({
        part: ['snippet', 'contentDetails', 'liveStreamingDetails'],
        id: result.data.items[0].id.videoId,
      });

      const [videoFromYouTube] = videoDetails.data.items;

      resolve(videoFromYouTube);
    } catch (err) {
      console.log(err);
      reject();
    }
  });
};

module.exports = getYouTubeLatestStream;
