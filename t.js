const moment = require('moment')

const downloader = async () => {
  const currentTime = moment().format()
  const nextUpload = moment().add('1', 'd').set('h', 7).set('m', 5).set('s', 0).format()
  const msToNextUploadTry = new Date(nextUpload) - new Date(currentTime)

  console.log(msToNextUploadTry)

  // try {
  //   const resolve = await uploader()
  //   console.log(resolve)
  // } catch (err) {
  //   console.log(err)
  // }
}

const uploader = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject('Yeeey'), 2000)
  })
}

downloader()