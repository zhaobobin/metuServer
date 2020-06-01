// app/service/topics.js
'use strict';

const Service = require('egg').Service;

class TopicService extends Service {
  constructor(ctx) {
    super(ctx);
    this.rule = {
      create: {
        name: { type: 'string', required: true },
        avatar_url: { type: 'string', required: false },
        introduction: { type: 'string', required: false },
      },
      update: {
        name: { type: 'string', required: false },
        avatar_url: { type: 'string', required: false },
        introduction: { type: 'string', required: false },
      },
    };
    this.select = '+introduction';
  }

  // 列表
  async list() {
    const { ctx } = this;
    return await ctx.model.Topic.list(ctx.query);
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const topic = await ctx.model.Topic.detail({
      id: ctx.params.id,
      select: this.select,
    });
    if (!topic) ctx.throw(404, { error_key: 'topic', message: '话题不存在' });
    return topic;
  }

  // 创建
  async create() {
    const { ctx } = this;
    ctx.validate(this.rule.create, ctx.request.body);
    const res = await ctx.model.Topic.findOne({ name: ctx.request.body.name });
    if (res) ctx.throw(409, { error_key: 'topic', message: '话题已存在' });
    const topic = await ctx.model.Topic.add(ctx.request.body);
    if (!topic) ctx.throw(422, { error_key: 'topic', message: '话题创建失败' });
    return topic;
  }

  // 更新
  async update() {
    const { ctx } = this;
    ctx.validate(this.rule.update, ctx.request.body);
    const res = await ctx.model.Topic.update(ctx.params.id, ctx.request.body);
    if (!res) ctx.throw(404, { error_key: 'topic', message: '话题不存在' });
    return res;
  }

  // 删除
  async del() {
    const { ctx } = this;
    const res = await ctx.model.Topic.del(ctx.params.id);
    if (!res) ctx.throw(404, { error_key: 'topic', message: '话题不存在' });
    return res;
  }

  // 关注话题
  async follow() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('following_topics'); // 我的关注列表列表
    // 我的关注列表不包含用户id时才关注
    if (me.following_topics.map(id => id.toString()).includes(ctx.params.id)) ctx.throw(403, { error_key: 'topic', message: '不能重复关注' });
    me.following_topics.push(ctx.params.id);
    me.save();
    return await ctx.model.Topic.update(ctx.params.id, { $inc: { follow_number: 1 } });
  }

  // 取消关注话题
  async unfollow() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('following_topics'); // 我的关注列表列表
    // 我的关注列表不包含用户id时才关注
    const index = me.following_topics.map(id => id.toString()).indexOf(ctx.params.id);
    if (index < 0) ctx.throw(403, { error_key: 'topic', message: '不能重复取消' });
    me.following_topics.splice(index, 1);
    me.save();
    return await ctx.model.Topic.update(ctx.params.id, { $inc: { follow_number: -1 } });
  }

  // 关注该话题的用户列表 - 查询关注了这个人(ctx.params.id)的所有用户
  async followersList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { following_topics: ctx.params.id };
    const count = await ctx.model.User.count(_filter);
    const list = await ctx.model.User.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }

  // 话题相关的文章列表
  async articlesList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { topics: ctx.params.id };
    const count = await ctx.model.Article.count(_filter);
    const list = await ctx.model.Article.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }

  // 话题相关的问题列表
  async questionsList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { topics: ctx.params.id };
    const count = await ctx.model.Question.count(_filter);
    const list = await ctx.model.Question.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }

}

module.exports = TopicService;
