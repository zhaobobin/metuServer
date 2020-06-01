// app/controller/photos.js
'use strict';

const Controller = require('egg').Controller;

class PhotoController extends Controller {

  // 列表
  async list() {
    const { ctx } = this;
    const res = await ctx.service.photos.list();
    ctx.helper.success({ ctx, res });
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const res = await ctx.service.photos.detail();
    ctx.helper.success({ ctx, res });
  }

  // 状态
  async state() {
    const { ctx } = this;
    const res = await ctx.service.photos.state();
    ctx.helper.success({ ctx, res });
  }

  // 创建
  async create() {
    const { ctx } = this;
    const res = await ctx.service.photos.create();
    ctx.helper.success({ ctx, res: res._id, message: '添加成功' });
  }

  // 修改
  async patch() {
    const { ctx } = this;
    if (ctx.state.user._id !== ctx.state.photo.author.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    await ctx.service.photos.update();
    ctx.helper.success({ ctx });
  }

  // 删除
  async del() {
    const { ctx } = this;
    if (ctx.state.user._id !== ctx.state.photo.author.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    await ctx.service.photos.del();
    ctx.helper.success({ ctx });
  }

  // 点赞图片
  async favor() {
    const { ctx } = this;
    if (ctx.state.user._id === ctx.state.photo.author.toString()) ctx.throw(401, { error_key: 'auth', message: '不能点赞自己' });
    const photo = await ctx.service.photos.favor();
    ctx.helper.success({ ctx, res: { favoring_state: 1, favor_number: photo.favor_number } });
  }

  // 取消点赞
  async unfavor() {
    const { ctx } = this;
    if (ctx.state.user._id === ctx.state.photo.author.toString()) ctx.throw(401, { error_key: 'auth', message: '没有操作权限' });
    const photo = await ctx.service.photos.unfavor();
    ctx.helper.success({ ctx, res: { favoring_state: 0, favor_number: photo.favor_number } });
  }

  // 点赞该图片的用户列表
  async favorList() {
    const { ctx } = this;
    const res = await ctx.service.photos.favorList();
    ctx.helper.success({ ctx, res });
  }

  // 收藏图片
  async collect() {
    const { ctx } = this;
    const photo = await ctx.service.photos.collect();
    ctx.helper.success({ ctx, res: { collecting_state: 1, collect_number: photo.collect_number } });
  }

  // 取消收藏
  async uncollect() {
    const { ctx } = this;
    const photo = await ctx.service.photos.uncollect();
    ctx.helper.success({ ctx, res: { collecting_state: 0, collect_number: photo.collect_number } });
  }

  // 收藏该图片的用户列表
  async collectList() {
    const { ctx } = this;
    const res = await ctx.service.photos.collectList();
    ctx.helper.success({ ctx, res });
  }

  // 图片相关的评论详情
  async commentDetail() {
    const { ctx } = this;
    const res = await ctx.service.photos.commentDetail();
    ctx.helper.success({ ctx, res });
  }

}

module.exports = PhotoController;
