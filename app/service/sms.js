// app/service/sms.js
'use strict';

const Service = require('egg').Service;
const SMSClient = require('@alicloud/sms-sdk');
const aliConfig = require('../../config/aliConfig');

class SmsService extends Service {
  constructor(ctx) {
    super(ctx);
    // this.queueName = 'Alicom-Queue-1323073144340307-';
    this.smsClient = new SMSClient({
      accessKeyId: aliConfig.accessKeyId,
      secretAccessKey: aliConfig.accessKeySecret,
    });
    this.rule = {
      checkphone: {
        mobile: { type: 'string', required: true, allowEmpty: false },
      },
    };
  }

  // 生成随机数
  createRandom(num, from, to) {
    const arr = [];
    for (let i = from; i <= to; i++) {
      arr.push(i);
    }
    arr.sort(function() {
      return 0.5 - Math.random();
    });
    arr.length = num;
    return arr.join('');
  }

  // 发送短信验证码
  async send() {

    const { ctx } = this;

    // 解析用户token
    let user, mobile;

    // mobile
    if(ctx.state.user) { // 身份校验
      user = await ctx.model.User.findOne({ _id: ctx.state.user._id }).select('+mobile');
      mobile = user.mobile
    } else { // 登录、注册、找回
      ctx.validate(this.rule.checkphone, ctx.request.body);
      user = await ctx.model.User.findOne({ mobile: ctx.request.body.mobile });
      mobile = ctx.request.body.mobile
    }

    // type
    switch (ctx.request.body.type) {
      case 'register':
        if (user) ctx.throw(409, { error_key: 'mobile', message: '该手机号已注册' }); break;
      case 'login':
        if (!user) ctx.throw(404, { error_key: 'mobile', message: '该手机未已注册' }); break;
      case 'reset':
        if (!user) ctx.throw(404, { error_key: 'mobile', message: '该手机未已注册' }); break;
      case 'change':
        if (!user) ctx.throw(404, { error_key: 'mobile', message: '该手机未已注册' }); break;
      default: break;
    }

    // smscode
    const smscode = this.createRandom(6, 0, 9).toString();

    // 发送短信验证码
    const res = await this.smsClient.sendSMS({
      PhoneNumbers: mobile, // 必填:待发送手机号。支持以逗号分隔的形式进行批量调用，批量上限为1000个手机号码,批量调用相对于单条调用及时性稍有延迟,验证码类型的短信推荐使用单条调用的方式；发送国际/港澳台消息时，接收号码格式为00+国际区号+号码，如“0085200000000”
      SignName: '迷图网', // 必填:短信签名-可在短信控制台中找到
      TemplateCode: 'SMS_140550479', // 必填:短信模板-可在短信控制台中找到，发送国际/港澳台消息时，请使用国际/港澳台短信模版
      TemplateParam: JSON.stringify({ code: smscode }),
    });
    if (!res) {
      ctx.throw(422, { error_key: 'smscode', message: '发送失败，请稍后再试' });
    }

    const newSms = new ctx.model.Sms({
      mobile: mobile,
      type: ctx.request.body.type,
      code: smscode,
    });
    await newSms.save()
    return '验证码发送成功';
  }

  // 检测短信验证码
  async checkSmscode() {
    const { ctx } = this;
    const res = await ctx.model.Sms.findOne({ mobile: ctx.request.body.mobile, code: ctx.request.body.smscode });
    if (!res) {
      ctx.throw(422, { error_key: 'smscode', message: '验证码错误' });
    }
    const time = new Date().getTime() - new Date(res.create_at).getTime();
    if (time > 300 * 1000) {
      ctx.throw(422, { error_key: 'smscode', message: '验证码已过期' });
    }
    return '验证成功';
  }

  // 检查短信验证码，5分钟过期
  async verify({ mobile, smscode }) {
    const { ctx } = this;

    const code = await ctx.model.Sms.findOne({ mobile: mobile, code: smscode })
    if(!code) ctx.throw(403, { error_key: 'smscode', message: '验证码错误' });

    const time = new Date().getTime() - new Date(code.create_at).getTime()
    // console.log(time)
    if(time > 300 * 1000) ctx.throw(403, { error_key: 'smscode', message: '验证码已过期' });

    return true
  }

}

module.exports = SmsService;
