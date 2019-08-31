const msToTime = (duration) => {
  var seconds = Math.floor((duration / 1000) % 60)
  var minutes = Math.floor((duration / (1000 * 60)) % 60)
  var hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

  return hours + 'h' + minutes + 'm' + seconds + 's'
}

module.exports = msToTime
