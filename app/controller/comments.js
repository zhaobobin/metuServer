// app/controller/comments.js
'use strict';

const Controller = require('egg').Controller;

class CommentsController extends Controller {

  // 列表
  async list() {
    const { ctx } = this;
    const res = await ctx.service.comments.list();
    ctx.helper.success({ ctx, res });
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const res = await ctx.service.comments.detail();
    ctx.helper.success({ ctx, res });
  }

  // 状态
  async state() {
    const { ctx } = this;
    const res = await ctx.service.comments.state();
    ctx.helper.success({ ctx, res });
  }

  // 创建
  async create() {
    const { ctx } = this;
    const res = await ctx.service.comments.create();
    ctx.helper.success({ ctx, res: res._id, message: '添加成功' });
  }

  // 修改
  async patch() {
    const { ctx } = this;
    if (ctx.state.user._id !== ctx.state.comment.author.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    const res = await ctx.service.comments.update();
    ctx.helper.success({ ctx, res });
  }

  // 删除
  async del() {
    const { ctx } = this;
    if (ctx.state.user.type !== 'admin' && ctx.state.user._id !== ctx.state.comment.author.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    await ctx.service.comments.del();
    ctx.helper.success({ ctx });
  }

  // 回复评论
  async reply() {
    const { ctx } = this;
    const res = await ctx.service.comments.reply();
    ctx.helper.success({ ctx, res });
  }

  // 评论的回复列表
  async replyList() {
    const { ctx } = this;
    const res = await ctx.service.comments.replys();
    ctx.helper.success({ ctx, res });
  }

  // 点赞评论
  async favor() {
    const { ctx } = this;
    if (ctx.state.user._id === ctx.state.comment.author.toString()) ctx.throw(401, { error_key: 'auth', message: '不能点赞自己' });
    const comment = await ctx.service.comments.favor();
    ctx.helper.success({ ctx, res: { favoring_state: 1, favor_number: comment.favor_number } });
  }

  // 取消点赞评论
  async unfavor() {
    const { ctx } = this;
    const comment = await ctx.service.comments.unfavor();
    ctx.helper.success({ ctx, res: { favoring_state: 0, favor_number: comment.favor_number } });
  }

  // 点赞该评论的用户列表
  async favorList() {
    const { ctx } = this;
    const res = await ctx.service.comments.favorList();
    ctx.helper.success({ ctx, res });
  }

}

module.exports = CommentsController;
