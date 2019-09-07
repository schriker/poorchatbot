const axios = require('axios')
const qs = require('querystring')
const md5 = require('md5')

class Wykop {
  constructor ({ secret, appKey }) {
    this.secret = secret
    this.appKey = appKey
    this.userKey = null
  }

  createUrl (apiParams, namedParams) {
    let joinedNamedParams = ''
    const baseUrl = `https://a2.wykop.pl/${apiParams.join('/')}/appkey/${this.appKey}/userkey/${this.userKey}`
    if (namedParams) {
      joinedNamedParams = Object.entries(namedParams).map(([ key, value ]) => `${key}/${value}/`).join('/')
    }

    return `${baseUrl}${joinedNamedParams}`
  }

  createApiSign (requestUrl, postParams) {
    const joinedPostParams = Object.keys(postParams).map(key => postParams[key]).join(',')

    return md5(`${this.secret}${requestUrl}${joinedPostParams}`)
  }

  makeRequest ({ requestMethod, url, apiSign, postParams }) {
    return axios({
      method: requestMethod,
      url: url,
      headers: {
        'apisign': apiSign,
        'User-Agent': 'wykop-nodejs',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: qs.stringify(postParams)
      })
  }

  request({ requestMethod, apiParams, namedParams, postParams }) {
    return new Promise((resolve, reject) => {
      const url = this.createUrl(apiParams, namedParams)
      const apiSign = this.createApiSign(url, postParams)
      const request = {
        requestMethod: requestMethod,
        url: url,
        apiSign: apiSign,
        postParams: postParams
      }
      this.makeRequest(request)
        .then((res) => {
          if (apiParams[0] === 'login') {
            this.userKey = res.data.data.userkey
            console.log(`${res.data.data.profile.login} logedin!`)
          }
          resolve(res.data)
        })
        .catch((err) => reject(err))
    })
  }

}

module.exports = Wykop