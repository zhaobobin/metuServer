// app/controller/topics.js
'use strict';

const Controller = require('egg').Controller;

class TopicController extends Controller {

  // 列表
  async list() {
    const { ctx } = this;
    const res = await ctx.service.topics.list();
    ctx.helper.success({ ctx, res });
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const res = await ctx.service.topics.detail();
    ctx.helper.success({ ctx, res });
  }

  // 创建
  async create() {
    const { ctx } = this;
    const res = await ctx.service.topics.create();
    ctx.helper.success({ ctx, res: res._id, message: '添加成功' });
  }

  // 修改
  async patch() {
    const { ctx } = this;
    if (ctx.state.user.type !== 'admin') ctx.throw(401, { error_key: 'auth', message: '限管理员操作' });
    const res = await ctx.service.topics.update();
    ctx.helper.success({ ctx, res });
  }

  // 删除
  async del() {
    const { ctx } = this;
    if (ctx.state.user.type !== 'admin') ctx.throw(401, { error_key: 'auth', message: '限管理员操作' });
    const res = await ctx.service.topics.del();
    ctx.helper.success({ ctx, res });
  }

  // 关注话题
  async follow() {
    const { ctx } = this;
    await ctx.service.topics.follow();
    ctx.helper.success({ ctx });
  }

  // 取消关注
  async unfollow() {
    const { ctx } = this;
    const res = await ctx.service.topics.unfollow();
    ctx.helper.success({ ctx, res });
  }

  // 话题的粉丝列表
  async followersList() {
    const { ctx } = this;
    const res = await ctx.service.topics.followersList();
    ctx.helper.success({ ctx, res });
  }

  // 话题相关的文章列表
  async articlesList() {
    const { ctx } = this;
    const res = await ctx.service.topics.articlesList();
    ctx.helper.success({ ctx, res });
  }

  // 话题相关的问题列表
  async questionsList() {
    const { ctx } = this;
    const res = await ctx.service.topics.questionsList();
    ctx.helper.success({ ctx, res });
  }

}

module.exports = TopicController;
