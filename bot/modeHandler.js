const Mode = require('../models/mode')

const modeHandler = (IRCMessage) => {
  return new Promise(async resolve => {
      const [ channel, mode, user ] = IRCMessage.params
      let modesArray = mode.split('')
      if (user) {
          const userMode = await Mode.findOne({ user: user.split('\r\n')[0] })
          if (userMode) {
              let concatModes = [...new Set(userMode.mode.concat(modesArray))]
              if (modesArray[0] === '-') {
                  concatModes = concatModes.filter(mode => mode !== modesArray[0] && mode !== modesArray[1])
              } else {
                  concatModes = concatModes.filter(mode => mode !== modesArray[0])
              }
              userMode.mode = concatModes
              await userMode.save()
              resolve()
          } else {
              if (modesArray[0] === '-') {
                  modesArray = modesArray.filter(mode => mode !== modesArray[0] && mode !== modesArray[1])
              } else {
                  modesArray = modesArray.filter(mode => mode !== modesArray[0])
              }
              const modeData = {
                  channel: channel,
                  mode: modesArray,
                  user: user.split('\r\n')[0]
              }
              newUserMode = new Mode(modeData)
              await newUserMode.save()
              resolve()
          }
      }
  })
}

module.exports = modeHandler