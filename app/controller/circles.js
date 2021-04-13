// app/controller/cricles.js
'use strict';

const Controller = require('egg').Controller;

class CircleController extends Controller {

  // 列表
  async list() {
    const { ctx } = this;
    const res = await ctx.service.circles.list();
    ctx.helper.success({ ctx, res });
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const res = await ctx.service.circles.detail();
    ctx.helper.success({ ctx, res });
  }

  // 创建
  async create() {
    const { ctx } = this;
    const res = await ctx.service.circles.create();
    ctx.helper.success({ ctx, res: res._id, message: '添加成功' });
  }

  // 修改
  async patch() {
    const { ctx } = this;
    if (ctx.state.user.type !== 'admin' && ctx.state.user._id !== ctx.state.circle.admin.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    await ctx.service.circles.update();
    ctx.helper.success({ ctx });
  }

  // 删除
  async del() {
    const { ctx } = this;
    if (ctx.state.user.type !== 'admin' && ctx.state.user._id !== ctx.state.circle.admin.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    await ctx.service.circles.del();
    ctx.helper.success({ ctx });
  }

  // 检查加入状态
  async checkJoinStatus() {
    const { ctx } = this;
    const following_state = await ctx.service.circles.checkJoinStatus();
    ctx.helper.success({ ctx, res: { following_state },  message: '查询成功' });
  }

  // 加入
  async join() {
    const { ctx } = this;
    const circle = await ctx.service.circles.join();
    ctx.helper.success({ ctx, res: { following_state: 1, member_number: circle.member_number },  message: '申请成功' });
  }

  // 审核
  async auditJoin() {
    const { ctx } = this;
    if (ctx.state.user.type !== 'admin' && ctx.state.user._id !== ctx.state.circle.admin.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    const res = await ctx.service.circles.auditJoin();
    ctx.helper.success({ ctx, res: res._id, message: '审核通过' });
  }

  // 退出
  async exit() {
    const { ctx } = this;
    const circle = await ctx.service.circles.exit();
    ctx.helper.success({ ctx, res: { following_state: 0, member_number: circle.member_number }, message: '退出成功' });
  }

  // 成员列表
  async membersList() {
    const { ctx } = this;
    const res = await ctx.service.circles.membersList();
    ctx.helper.success({ ctx, res });
  }

}

module.exports = CircleController;
