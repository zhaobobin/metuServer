/**
 * request 支持async-await
 * var res = await request('http://www.baidu.com');
 */

'use strict'

const _request = require('request');

function request(uri, options) {
  return new Promise(function (resolve, reject) {
    _request(uri, options, function (error, response, body) {
      error && reject(error);
      resolve(response, body);
    })
  })
}

// 覆盖request请求方法
for (let attr in _request) {
  if (_request.hasOwnProperty(attr)) {
    if ([ 'get', 'post', 'put', 'patch', 'head', 'del' ].indexOf(attr) > -1) {
      request[attr] = (function () {
        return function (uri, options) {
          return new Promise(function (resolve, reject) {
            _request(uri, options, function (error, response, body) {
              error && reject(error);
              resolve(response, body);
            })
          })
        }
      })(attr);
    } else {
      request[attr] = _request[attr];
    }
  }
}

module.exports = request;