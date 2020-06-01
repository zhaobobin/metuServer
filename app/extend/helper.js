'use strict';

const moment = require('moment');

// HTTP - 处理成功响应
exports.success = ({ ctx, res = null, message = '请求成功' }) => {
  ctx.body = {
    code: 0,
    data: res || '',
    message,
  };
  ctx.status = 200;
};

// 手机号过滤
exports.filterTel = str => {
  return str.toString().replace(/^(\d{3})\d{4}(\d+)/, '$1****$2');
};

// 格式化时间
exports.formatTime = time => moment(time).format('YYYY-MM-DD HH:mm:ss');
