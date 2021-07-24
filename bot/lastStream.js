const messageCreator = require('./messageCreator');
const FacebookVideo = require('../models/facebookVideo');
const moment = require('moment');

exports.lastStream = async (IRCMessage, client) => {
  const messageData = messageCreator(IRCMessage);
  const trimedBody = messageData.body.trim();
  const comand = trimedBody.match(/^\!(\b\w+\b)(\s+\b\d+\b)?/);

  if (comand && comand[1] === 'ostatnia') {
    const [video] = await FacebookVideo.find().sort({ createdAt: -1 }).limit(1);
    const startTime = moment(video.started).format('DD-MM-YYYY-H:mm');
    const endedTime = moment(video.createdAt).format('DD-MM-YYYY-H:mm');
    
    client.pm(
      messageData.author,
      `Ostatni strim zaczął się: ${startTime} a skończył: ${endedTime}`
    );
  }
};
