// app/service/wechat.js
'use strict';

const Service = require('egg').Service;
const getToken = require('../utils/token').getToken;
const request = require('../utils/request');
// const request = require('request');

const config = {
  AppId: 'wxfef98607d65153a3',
  AppSecret: '57b5d383db7f01fc1ab700573ef96ae7',
};

class WechatService extends Service {

  // 微信登录
  async wechatLoginAuth() {
    const { ctx } = this;
    // 查询授权登录access_token，检查code是否过期
    const data = await this.getAccessToken(ctx.request.body.code);
    if (data.errcode) ctx.throw(401, { error_key: 'wechat_code', message: data.errmsg }); // code过期
    // 查询微信用户信息
    return await this.getUserInfo(data);

  }

  // 查询授权登录access_token
  async getAccessToken(code) {
    let url = 'https://api.weixin.qq.com/sns/oauth2/access_token?';
    const params = {
      grant_type: 'authorization_code',
      appid: config.AppId,
      secret: config.AppSecret,
      code: code,
    };

    for (let i in params) {
      url += (i + '=' + encodeURIComponent(params[i]) + '&');
    }
    url = url.substring(0, url.lastIndexOf('&'));

    const result = await request.get(url);
    console.log(result)
    if(result.statusCode === 200){
      return JSON.parse(result.body)
    }
  }

  // 查询微信用户信息
  async getUserInfo(data, cb){

    const { ctx } = this;
    // 通过openid查询，用户是否已注册过
    const user = await ctx.model.User.findOne({ wechat_openid: data.openid }).select('+wechat_openid');

    if (user) {	// 已注册，直接返回用户信息

      user.mobile = ctx.helper.filterTel(user.mobile);
      delete user.password;
      cb({ detail: user, token: getToken(user) });

    } else {		// 未注册，查询微信用户信息，然后用户在前台进行手机绑定

      let url = 'https://api.weixin.qq.com/sns/userinfo?';
      const params = {
        access_token: data.access_token,
        openid: data.openid,
      };
      for (let i in params) {
        url += (i + '=' + encodeURIComponent(params[i]) + '&');
      }

      url = url.substring(0, url.lastIndexOf('&'));
      const result = await request.get(url)
      if (result.statusCode === 200) {
        const wechat_userinfo = JSON.parse(result.body);
        if (wechat_userinfo.errcode) ctx.throw(401, { error_key: 'wechat_token', message: wechat_userinfo.errmsg }); // 微信access_token无效
        const createWechat = new ctx.model.Wechat(wechat_userinfo); // 保存wechat_userinfo
        await createWechat.save();
        return { message: '用户未注册', detail: wechat_userinfo };
      }

    }

  }

  // 微信接口的哈希加密方法
  // sha1(str) {
  //   var md5sum = crypto.createHash("sha1");
  //   md5sum.update(str);
  //   str = md5sum.digest("hex");
  //   return str;
  // }

  // 微信票据
  // accessToken(opts){
  //   var that = this;
  //   this.appId = opts.appId;
  //   this.secret = opts.appSecret;
  //   this.getAccessToken = opts.getAccessToken;
  //   this.setAccessToken = opts.setAccessToken;

  //   this.getAccessToken()
  //     .then(function(data){
  //       try{
  //         data = JSON.parse(data);
  //       }
  //       catch(err){
  //         return that.updateAccessToken(data);
  //       }

  //       if(that.isValidAccessToken(data)){
  //         return data;
  //       }else{
  //         return that.updateAccessToken();
  //       }
  //     })
  //     .then(function(data){
  //       that.access_token = data.access_token;
  //       that.expires_in = data.expires_in;
  //       that.saveAccessToken(data);
  //     })
  // }

}

module.exports = WechatService;