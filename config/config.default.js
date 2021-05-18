'use strict';

const Server = require('./server');
// const path = require('path');

/**
 * config.default
 * @param appInfo
 * @returns {{myAppName: string}}
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const exports = {};

  // use for cookie sign key, should change to your own and keep security
  exports.keys = appInfo.name + '_1563859398850_5245';

  // add your middleware config here
  exports.middleware = [ 'getToken', 'errorHandler' ];
  exports.errorHandler = {
    match: '/api', // 只对 /api 前缀的 url 路径生效
  };

  // 安全
  exports.security = {
    csrf: {
      enable: false,
    },
    domainWhiteList: [ 'http://localhost:8000', 'http://localhost:8001' ],
  };
  exports.cors = {
    origin: '*',
    allowMethods: 'GET,POST,PUT,PATCH,DELETE,HEAD',
  };
  exports.multipart = {
    fileExtensions: [ '.apk', '.pptx', '.docx', '.csv', '.doc', '.ppt', '.pdf', '.pages', '.wav', '.mov' ], // 增加对 .apk 扩展名的支持
  };

  // Json限制
  exports.bodyParser = {
    jsonLimit: '2mb',
    formLimit: '2mb',
  };

  // mongodb
  exports.mongoose = {
    url: process.env.NODE_ENV === 'development' ? Server.db.test : Server.db.dev,
    options: { useFindAndModify: false, useCreateIndex: true },
    plugins: [],
  };
  exports.bcrypt = {
    saltRounds: 10, // default 10
  };

  // redis
  // exports.redis = {
  //   client: {
  //     port: 6379, // Redis port
  //     host: '127.0.0.1', // Redis host
  //     password: 'auth',
  //     db: 0,
  //   }
  // };

  // add your user config here
  exports.myAppName = 'metuServer';

  return exports;

};
