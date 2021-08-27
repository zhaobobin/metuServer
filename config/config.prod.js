"use strict";

const defaultConfig = require("./config.default");
const Server = require("./server");

defaultConfig.mongoose = {
  url: Server.db.dev,
  options: {
    useFindAndModify: false,
    useNewUrlParser: true
  },
  plugins: [],
};

module.exports = defaultConfig;
