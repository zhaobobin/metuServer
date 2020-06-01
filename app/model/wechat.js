// app/model/wechat.js
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const WechatSchema = new Schema(
    {
      __v: { type: Number, select: false },
      openid: String,							// 普通用户的标识，对当前开发者帐号唯一
      nickname: String,						// 普通用户昵称
      sex: String,							// 普通用户性别，1为男性，2为女性
      province: String,						// 普通用户个人资料填写的省份
      city: String,							// 普通用户个人资料填写的城市
      country: String,						// 国家，如中国为CN
      headimgurl: String,						// 户头像，最后一个数值代表正方形头像大小（有0、46、64、96、132数值可选，0代表640*640正方形头像），用户没有头像时该项为空
      privilege: Array,						// 用户特权信息，json数组，如微信沃卡用户为（chinaunicom）
      unionid: String,						// 用户统一标识。针对一个微信开放平台帐号下的应用，同一用户的unionid是唯一的。		
      access_token: String,
      refresh_token: String,
    },
    {
      timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
    }
  );

  return mongoose.model('Wechat', WechatSchema);
};
