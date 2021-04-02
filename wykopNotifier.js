const Wykop = require('./wykop');
const config = require('./config.json');
const FacebookVideo = require('./models/facebookVideo');
const WebSocket = require('ws');
const ReconnectingWebSocket = require('reconnecting-websocket');

const wykopNotifier = async () => {
  const lt = new Date(
    new Date(new Date().setUTCHours(22, 0, 0, 0)).getTime() -
      24 * 60 * 60 * 1000
  );
  const gt = new Date(
    new Date(new Date().setUTCHours(22, 0, 0, 0)).getTime() -
      48 * 60 * 60 * 1000
  );
  const postDate = lt.toISOString().split('T')[0];
  const videosFromLast24H = await FacebookVideo.find({
    started: { $gt: gt, $lt: lt },
    public: true,
  });
  let postBodyTemplate = `
    **Archiwum z Ruczaju**
  
    　► ${postDate}
    `;

  if (videosFromLast24H.length !== 0) {
    const notifier = new ReconnectingWebSocket(
      'https://api.pancernik.info/notifier',
      [],
      {
        WebSocket: WebSocket,
        automaticOpen: false,
      }
    );

    notifier.addEventListener('message', async (response) => {
      try {
        const data = JSON.parse(response.data);
        const topic = data.data.topic.text;

        const numbers = [
          '\u2460',
          '\u2461',
          '\u2462',
          '\u2463',
          '\u2464',
          '\u2465',
          '\u2466',
          '\u2467',
          '\u2468',
          '\u2469',
        ];
        videosFromLast24H.forEach((video, index) => {
          const platfrom = video.source[0].name;
          const removeBottomPart = video.title
            .replace(/^\s*\n/gm, '')
            .split('Jak ktoś jest nowy')[0];
          const splitTitle = removeBottomPart.split(/^\s*\n/gm);
          splitTitle.unshift('\n\n');
          const joinTitle = splitTitle.join('>');
          postBodyTemplate += `\n\n  　${numbers[index]} https://jarchiwum.pl/wonziu/video/${video.videoId} (${platfrom})(**${video.duration}**)`;
          postBodyTemplate += joinTitle;
        });
        postBodyTemplate += `
        \nⓘ ${topic}
    
        \nWpadnij na czat! https://jadisco.pl/
        Przegapiłeś strumyk? https://jarchiwum.pl/
        
        \n#wonziu #archiwumzruczaju
        `;

        const wykopNotifier = new Wykop({
          secret: config.WYKOP.SECRET,
          appKey: config.WYKOP.APPKEY,
        });
        await wykopNotifier.request({
          requestMethod: 'POST',
          apiParams: ['login', 'index'],
          namedParams: null,
          postParams: {
            accountkey: config.WYKOP.ACCOUNTKEY,
          },
        });
        wykopNotifier
          .request({
            requestMethod: 'POST',
            apiParams: ['entries', 'add'],
            namedParams: null,
            postParams: {
              body: postBodyTemplate,
              embed: videosFromLast24H[0].thumbnail,
            },
          })
          .then(() => {
            notifier.removeEventListener('message');
            notifier.close();
            console.log(`[Wykop posted] - ${new Date()}`);
          })
          .catch((e) => {
            console.log(e);
          });
      } catch (e) {
        console.log(e);
      }
    });
  }
};

module.exports = wykopNotifier;
