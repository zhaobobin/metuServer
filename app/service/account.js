// app/service/account.js
'use strict';

const Service = require('egg').Service;

class AccountService extends Service {
  constructor(ctx) {
    super(ctx);
    this.rule = {
      update: {
        mobile: { type: 'string', required: false },
        password: { type: 'string', required: false },
        username: { type: 'string', required: false },
        avatar_url: { type: 'string', required: false },
        gender: { type: 'string', required: false },
        city: { type: 'string', required: false },
        blog: { type: 'string', required: false },
      },
    };
    this.select = '+mobile +password +avatar_url +cover_url +city +blog +headline +tags +gender +city +location +professional +email +email_auth +wechat_openid +weibo_uid +qq_openid';
  }

  // 账户详情 - 返回我的账户更详细的信息
  async detail() {
    const { ctx } = this;
    // 可选查询字符串
    if (ctx.query.include) {
      this.select = this.select + ' +' + ctx.query.include.split('+').join(' +');
    }
    const user = await ctx.model.User.detail({
      id: ctx.state.user._id,
      select: this.select,
      populate: 'tags city',
    });
    if (!user) ctx.throw(404, { error_key: 'user', message: '用户不存在' });
    user.mobile = ctx.helper.filterTel(user.mobile);

    user.psd_bind = user.password ? 1 : 0;
    user.wechat_bind = user.wechat_openid ? 1 : 0;
    user.weibo_bind = user.weibo_uid ? 1 : 0;
    user.qq_bind = user.qq_openid ? 1 : 0;

    delete user.password;
    delete user.wechat_openid;
    delete user.weibo_uid;
    delete user.qq_openid;

    return user;
  }

  // 更新
  async update() {
    const { ctx } = this;
    ctx.validate(this.rule.update, ctx.request.body);
    const res = await ctx.model.User.update(ctx.state.user._id, ctx.request.body);
    if (!res) ctx.throw(404, { error_key: 'user', message: '用户不存在' });
    return res;
  }

  // 更新用户封面
  async cover() {
    const { ctx } = this;
    const res = await this.findByIdAndUpdate(ctx.state.user._id, ctx.request.body, { new: true });
    if (!res) ctx.throw(404, { error_key: 'user', message: '用户不存在' });
    return res;
  }

  // 更新用户头像
  async avatar() {
    const { ctx } = this;
    const res = await this.findByIdAndUpdate(ctx.state.user._id, ctx.request.body, { new: true });
    if (!res) ctx.throw(404, { error_key: 'user', message: '用户不存在' });
    return res;
  }

  // 修改邮箱
  async changeEmail() {
    const { ctx } = this;
    const body = ctx.request.body;

    await ctx.service.sms.verify({ mobile: body.mobile, smscode: body.smscode });

  }

  // 修改手机
  async changeMobile() {
    const { ctx } = this;
    const body = ctx.request.body;

    await ctx.service.sms.verify({ mobile: body.mobile, smscode: body.smscode });

    const user = await ctx.model.User.findOne({ _id: ctx.state.user._id });
    user.mobile = body.mobile;
    await user.save();

    return '修改成功';

  }

  // 修改密码
  async changePsd() {

    const { ctx } = this;
    const body = ctx.request.body;

    const user = await ctx.model.User.findOne({ _id: ctx.state.user._id }).select('+password');
    const oldPsd = ctx.service.crypto.Decrypt(ctx.state.user._id, body.oldPsd);
    const newPsd = ctx.service.crypto.Decrypt(ctx.state.user._id, body.newPsd);

    if (oldPsd === newPsd) ctx.throw(403, { error_key: 'newPsd', message: '新密码不能与原密码相同' });

    const verifyOldPsd = await ctx.compare(oldPsd, user.password);
    if (!verifyOldPsd) ctx.throw(403, { error_key: 'oldPsd', message: '原密码错误' });

    user.password = await ctx.genHash(newPsd);
    await user.save();

    return '修改成功';
  }

  // 修改个人信息
  async changeProfile() {

    const { ctx } = this;
    const body = ctx.request.body;

    let user = await ctx.model.User.findOne({ _id: ctx.state.user._id });
    user = Object.assign(user, body);

    // city、location
    if (body.location) {
      const cityName = body.location.split(" - ")[0];
      const topic = await ctx.model.Topic.findOne({ name: cityName });
      if (topic) {
        user.city = topic._id;
      } else {
        const newTopic = await ctx.model.Topic.add({ name: cityName });
        user.city = newTopic._id;
      }
    }
    // console.log(user)
    return await user.save();

  }

  // 重置密码
  async resetPsd() {

    const { ctx } = this;
    const body = ctx.request.body;

    if (!body.smscode) ctx.throw(403, { error_key: 'smscode', message: '验证码不能为空' });
    await ctx.service.sms.verify({ mobile: body.mobile, smscode: body.smscode });
    const user = await ctx.model.User.findOne({ mobile: body.mobile });
    if (!user) ctx.throw(404, { error_key: 'mobile', message: '手机号未注册' });

    const newPsd = ctx.service.crypto.Decrypt(body.mobile, body.password);
    user.password = await ctx.genHash(newPsd);
    await user.save();

    return '修改成功';
  }

}

module.exports = AccountService;
