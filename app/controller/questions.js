// app/controller/questions.js
'use strict';

const Controller = require('egg').Controller;

class QuestionsController extends Controller {

  // 列表
  async list() {
    const { ctx } = this;
    const res = await ctx.service.questions.list();
    ctx.helper.success({ ctx, res });
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const res = await ctx.service.questions.detail();
    ctx.helper.success({ ctx, res });
  }

  // 创建
  async create() {
    const { ctx } = this;
    const res = await ctx.service.questions.create();
    ctx.helper.success({ ctx, res: res._id, message: '添加成功' });
  }

  // 修改
  async patch() {
    const { ctx } = this;
    if (ctx.state.user._id !== ctx.state.question.author.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    const res = await ctx.service.questions.update();
    ctx.helper.success({ ctx, res });
  }

  // 删除
  async del() {
    const { ctx } = this;
    if (ctx.state.user._id !== ctx.state.question.author.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    await ctx.service.questions.del();
    ctx.helper.success({ ctx });
  }

  // 关注问题
  async follow() {
    const { ctx } = this;
    if (ctx.state.user._id === ctx.state.question.author.toString()) ctx.throw(401, { error_key: 'auth', message: '不能关注自己' });
    await ctx.service.questions.follow();
    ctx.helper.success({ ctx });
  }

  // 取消关注
  async unfollow() {
    const { ctx } = this;
    if (ctx.state.user._id === ctx.state.question.author.toString()) ctx.throw(401, { error_key: 'auth', message: '不能关注自己' });
    const res = await ctx.service.questions.unfollow();
    ctx.helper.success({ ctx, res });
  }

  // 关注该问题的用户
  async followersList() {
    const { ctx } = this;
    const res = await ctx.service.questions.followersList();
    ctx.helper.success({ ctx, res });
  }

  // 点赞问题
  async favor() {
    const { ctx } = this;
    if (ctx.state.user._id === ctx.state.question.author.toString()) ctx.throw(401, { error_key: 'auth', message: '不能点赞自己' });
    await ctx.service.questions.favor();
    ctx.helper.success({ ctx });
  }

  // 取消点赞
  async unfavor() {
    const { ctx } = this;
    if (ctx.state.user._id === ctx.state.question.author.toString()) ctx.throw(401, { error_key: 'auth', message: '不能点赞自己' });
    await ctx.service.questions.unfavor();
    ctx.helper.success({ ctx });
  }

  // 点赞该问题的用户列表
  async favorList() {
    const { ctx } = this;
    const res = await ctx.service.questions.favorList();
    ctx.helper.success({ ctx, res });
  }

  // 收藏回答
  async collect() {
    const { ctx } = this;
    await ctx.service.questions.collect();
    ctx.helper.success({ ctx });
  }

  // 取消收藏回答
  async uncollect() {
    const { ctx } = this;
    await ctx.service.questions.uncollect();
    ctx.helper.success({ ctx });
  }

  // 收藏该问题的用户列表
  async collectList() {
    const { ctx } = this;
    const res = await ctx.service.questions.collectList();
    ctx.helper.success({ ctx, res });
  }

}

module.exports = QuestionsController;
