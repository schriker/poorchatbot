const messageCreator = require('./messageCreator');
const Korona = require('../models/korona');

let isOpen = true;

const findWinner = (votes, score) => {
  const closest = votes.reduce((a, b) => {
    return Math.abs(b.amount - score) < Math.abs(a.amount - score) ? b : a;
  });

  return {
    user: closest.user,
    amount: closest.amount,
  };
};

exports.koronaVote = async (IRCMessage, client) => {
  const messageData = messageCreator(IRCMessage);
  const isAdmin = messageData.author === 'schriker';
  const trimedBody = messageData.body.trim();
  const comand = trimedBody.match(/^\!(\b\w+\b)(\s+\b\d+\b)?/);

  if (comand) {
    switch (comand[1]) {
      case 'korona':
        if (!isOpen) {
          return;
        }

        const alreadyVoted = await Korona.find({ user: messageData.author });
        const amountTaken = await Korona.find({ amount: comand[2] });

        if (alreadyVoted.length) {
          client.pm(messageData.author, 'Dzisiaj już głosowałeś.');
        } else if (amountTaken.length) {
          client.pm(messageData.author, 'Ktoś już postawił na ten wynik.');
        } else if (comand[2]) {
          const newVote = new Korona({
            user: messageData.author,
            amount: comand[2],
          });
          await newVote.save();
          client.pm(messageData.author, `Obstawiłeś ${comand[2]} zarażonych!`);
        }
        break;
      case 'wynik':
        if (isAdmin) {
          const votes = await Korona.find({});
          const winner = findWinner(votes, comand[2]);
          client.say(
            `Wygrywa ${winner.user} z wynikiem: ${winner.amount} Clap`
          );
          await Korona.deleteMany({});
          isOpen = true;
        }
        break;
    }
  }
};

exports.stopKoronaVote = async (client) => {
  isOpen = false;
  const votes = await Korona.find({});
  client.say(`Do losowania zapisało się: ${votes.length} osób.`);
};
