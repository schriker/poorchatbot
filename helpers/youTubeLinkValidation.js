const youTubeLinkValidation = (link) => {
  const match = link.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/)
  if (match && match[2].length === 11) {
    return true
  } else {
    return false
  }
}

module.exports = youTubeLinkValidation