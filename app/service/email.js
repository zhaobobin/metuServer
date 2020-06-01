// app/service/email.js
'use strict';

const Service = require('egg').Service;
const nodemailer = require('nodemailer');

class EmailService extends Service {
  constructor(ctx) {
    super(ctx);
    this.rule = {
      checkemail: {
        email: { type: 'string', required: true, allowEmpty: false },
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

  // 发送邮箱验证码
  async send() {
    const { ctx } = this;

    // 解析用户token
    let email

    ctx.validate(this.rule.checkemail, ctx.request.body);
    await ctx.model.User.findOne({ email: ctx.request.body.email });
    email = ctx.request.body.email;

    // emailcode
    const emailcode = this.createRandom(6, 0, 9).toString();

    // create reusable transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      "host": "email.metuwang.com",
      "port": 25,
      // "secureConnection": true, // use SSL, the port is 465
      "auth": {
        "user": 'mitu@email.metuwang.com', // user name
        "pass": 'ZhaoBobin820502'         // password
      }
    });

    // setup e-mail data with unicode symbols
    const mailOptions = {
      from: 'Metuwang<mitu@email.metuwang.com>', // sender address mailfrom must be same with the user
      to: email, // list of receivers
      subject: 'Hello', // Subject line
      text: 'Hello world', // plaintext body
      html: '<div>' + emailcode + '</div>', // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
      if(error) {
        // console.log(error);
      } else {
        // console.log('Message sent: ' + info.response);
      }
      return '验证码发送成功';
    });
  }

}

module.exports = EmailService;
