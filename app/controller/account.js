// app/controller/account.js
'use strict';

const Controller = require('egg').Controller;

class AccountController extends Controller {

  // 详情
  async detail() {
    const { ctx } = this;
    const res = await ctx.service.account.detail();
    ctx.helper.success({ ctx, res });
  }

  // 修改
  async patch() {
    const { ctx } = this;
    const res = await ctx.service.account.update();
    ctx.helper.success({ ctx, res });
  }

  // 更新用户封面
  async cover() {
    const { ctx } = this;
    const res = await ctx.service.account.changeCover();
    ctx.helper.success({ ctx, res });
  }

  // 更新用户头像
  async avatar() {
    const { ctx } = this;
    const res = await ctx.service.account.changeAvatar();
    ctx.helper.success({ ctx, res });
  }

  // 修改邮箱
  async changeEmail() {
    const { ctx } = this;
    await ctx.service.account.changeEmail();
    ctx.helper.success({ ctx, message: '修改成功' });
  }

  // 修改手机
  async changeMobile() {
    const { ctx } = this;
    await ctx.service.account.changeMobile();
    ctx.helper.success({ ctx, message: '修改成功' });
  }

  // 修改密码
  async changePsd() {
    const { ctx } = this;
    await ctx.service.account.changePsd();
    ctx.helper.success({ ctx, message: '修改成功' });
  }

  // 修改个人信息
  async changeProfile() {
    const { ctx } = this;
    const res = await ctx.service.account.changeProfile();
    ctx.helper.success({ ctx, res, message: '修改成功' });
  }

  // 重置密码
  async resetPsd() {
    const { ctx } = this;
    await ctx.service.account.resetPsd();
    ctx.helper.success({ ctx, message: '修改成功' });
  }

}

module.exports = AccountController;
