// app/controller/users.js
'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {

  // 列表
  async list() {
    const { ctx } = this;
    const res = await ctx.service.users.list();
    ctx.helper.success({ ctx, res });
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const res = await ctx.service.users.detail();
    ctx.helper.success({ ctx, res });
  }

  // 创建 - 管理员操作
  async create() {
    const { ctx } = this;
    if (ctx.state.user.type !== 'admin') ctx.throw(401, { error_key: 'auth', message: '限管理员操作' });
    const res = await ctx.service.users.create();
    ctx.helper.success({ ctx, res: res._id, message: '添加成功' });
  }

  // 修改
  async patch() {
    const { ctx } = this;
    if (ctx.state.user.type !== 'admin') ctx.throw(401, { error_key: 'auth', message: '限管理员操作' });
    const res = await ctx.service.users.update();
    ctx.helper.success({ ctx, res });
  }

  // 删除 - 管理员操作
  async del() {
    const { ctx } = this;
    if (ctx.state.user.type !== 'admin') ctx.throw(401, { error_key: 'auth', message: '限管理员操作' });
    const res = await ctx.service.users.del();
    ctx.helper.success({ ctx, res });
  }

  /* ----------------------> 关注用户 <---------------------- */
  // 关注某人
  async follow() {
    const { ctx } = this;
    if (ctx.state.user._id === ctx.params.id) ctx.throw(401, { error_key: 'auth', message: '不能关注自己' });
    await ctx.service.users.follow();
    ctx.helper.success({ ctx, res: { following_state: 1 } });
  }

  // 取消关注
  async unfollow() {
    const { ctx } = this;
    if (ctx.state.user._id === ctx.params.id) ctx.throw(401, { error_key: 'auth', message: '不能关注自己' });
    await ctx.service.users.unfollow();
    ctx.helper.success({ ctx, res: { following_state: 0 } });
  }

  // 用户的粉丝列表
  async followersList() {
    const { ctx } = this;
    const res = await ctx.service.users.followersList();
    ctx.helper.success({ ctx, res });
  }
  /* ----------------------> 关注用户 end <---------------------- */

  // 用户的关注列表
  async followingList() {
    const { ctx } = this;
    const res = await ctx.service.users.followingList();
    ctx.helper.success({ ctx, res });
  }

  // 用户的点赞列表
  async favorList() {
    const { ctx } = this;
    const res = await ctx.service.users.favorList();
    ctx.helper.success({ ctx, res });
  }

  // 用户的收藏列表
  async collectList() {
    const { ctx } = this;
    const res = await ctx.service.users.collectList();
    ctx.helper.success({ ctx, res });
  }

  /* ----------------------> 用户的发布 <---------------------- */
  // 用户的照片列表
  async photosList() {
    const { ctx } = this;
    const res = await ctx.service.users.photosList();
    ctx.helper.success({ ctx, res });
  }
  // 用户的图片列表
  async imagesList() {
    const { ctx } = this;
    const res = await ctx.service.users.imagesList();
    ctx.helper.success({ ctx, res });
  }
  
  // 用户的文章列表
  async articlesList() {
    const { ctx } = this;
    const res = await ctx.service.users.articlesList();
    ctx.helper.success({ ctx, res });
  }

  // 用户的话题列表
  async questionsList() {
    const { ctx } = this;
    const res = await ctx.service.users.questionsList();
    ctx.helper.success({ ctx, res });
  }

  // 用户的回答列表
  async answersList() {
    const { ctx } = this;
    const res = await ctx.service.users.answersList();
    ctx.helper.success({ ctx, res });
  }
  /* ----------------------> 用户的发布 end! <---------------------- */

  // 用户的圈子列表
  async criclesList() {
    const { ctx } = this;
    const res = await ctx.service.users.criclesList();
    ctx.helper.success({ ctx, res });
  }

  // 用户的消息列表
  async messagesList() {
    const { ctx } = this;
    const res = await ctx.service.users.messagesList();
    ctx.helper.success({ ctx, res });
  }

}

module.exports = UserController;
