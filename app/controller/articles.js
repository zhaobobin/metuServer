// app/controller/articles.js
'use strict';

const Controller = require('egg').Controller;

class ArticleController extends Controller {

  // 列表
  async list() {
    const { ctx } = this;
    const res = await ctx.service.articles.list();
    ctx.helper.success({ ctx, res });
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const res = await ctx.service.articles.detail();
    ctx.helper.success({ ctx, res });
  }

  // 创建
  async create() {
    const { ctx } = this;
    const res = await ctx.service.articles.create();
    ctx.helper.success({ ctx, res: res._id, message: '添加成功' });
  }

  // 修改
  async patch() {
    const { ctx } = this;
    if (ctx.state.user._id !== ctx.state.article.author.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    await ctx.service.articles.update();
    ctx.helper.success({ ctx });
  }

  // 删除
  async del() {
    const { ctx } = this;
    if (ctx.state.user._id !== ctx.state.article.author.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    await ctx.service.articles.del();
    ctx.helper.success({ ctx });
  }

  // 点赞文章
  async favor() {
    const { ctx } = this;
    if (ctx.state.user._id === ctx.state.article.author.toString()) ctx.throw(401, { error_key: 'auth', message: '不能点赞自己' });
    await ctx.service.articles.favor();
    ctx.helper.success({ ctx });
  }

  // 取消点赞
  async unfavor() {
    const { ctx } = this;
    if (ctx.state.user._id === ctx.state.article.author.toString()) ctx.throw(401, { error_key: 'auth', message: '不能点赞自己' });
    await ctx.service.articles.unfavor();
    ctx.helper.success({ ctx });
  }

  // 点赞该问题的用户列表
  async favorList() {
    const { ctx } = this;
    const res = await ctx.service.articles.favorList();
    ctx.helper.success({ ctx, res });
  }

  // 收藏文章
  async collect() {
    const { ctx } = this;
    await ctx.service.articles.collect();
    ctx.helper.success({ ctx });
  }

  // 取消收藏
  async uncollect() {
    const { ctx } = this;
    await ctx.service.articles.uncollect();
    ctx.helper.success({ ctx });
  }

  // 收藏该文章的用户列表
  async collectList() {
    const { ctx } = this;
    const res = await ctx.service.articles.collectList();
    ctx.helper.success({ ctx, res });
  }

  // 文章相关的评论列表
  async commentsList() {
    const { ctx } = this;
    const res = await ctx.service.articles.commentsList();
    ctx.helper.success({ ctx, res });
  }

}

module.exports = ArticleController;
