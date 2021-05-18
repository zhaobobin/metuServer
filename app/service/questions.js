// app/service/questions.js
'use strict';

const Service = require('egg').Service;

class QuestionsService extends Service {
  constructor(ctx) {
    super(ctx);
    this.rule = {
      create: {
        title: { type: 'string', required: true },
        content: { type: 'string', required: false },
        description: { type: 'string', required: false },
        topics: { type: 'array', required: false },
      },
      update: {
        title: { type: 'string', required: false },
        content: { type: 'string', required: false },
        description: { type: 'string', required: false },
        topics: { type: 'array', required: false },
      },
    };
  }

  // 列表
  async list() {
    const { ctx } = this;
    return await ctx.model.Question.list(ctx.query);
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const topic = await ctx.model.Question.detail({
      id: ctx.params.id,
      select: '+description +topics +author',
      populate: 'author topics',
    });
    if (!topic) ctx.throw(404, { error_key: 'question', message: '问题不存在' });
    return topic;
  }

  // 创建
  async create() {
    const { ctx } = this;
    const body = ctx.request.body
    ctx.validate(this.rule.create, body);
    // 更新话题库
    let topics = [];
    if(body.topics) {
      for(let i in body.topics){
        const res = await ctx.model.Topic.findOneAndUpdate(
          { name: body.topics[i] }, 
          { update_at: new Date() },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        topics.push(res._id)
      }
      body.topics = topics;
    }
    const question = await ctx.model.Question.add(ctx);
    if (!question) ctx.throw(422, { error_key: 'question', message: '问题创建失败' });
    return question;
  }

  // 更新
  async update() {
    const { ctx } = this;
    ctx.validate(this.rule.update, ctx.request.body);
    const res = await ctx.model.Question.update(ctx.params.id, ctx.request.body);
    if (!res) ctx.throw(404, { error_key: 'question', message: '问题不存在' });
    return res;
  }

  // 删除
  async del() {
    const { ctx } = this;
    const res = await ctx.model.Question.del(ctx.params.id);
    if (!res) ctx.throw(404, { error_key: 'question', message: '问题不存在' });
    return res;
  }

  // 关注问题
  async follow() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('following_questions'); // 我关注的问题列表
    // 我的关注列表不包含用户id时才关注
    if (me.following_questions.map(id => id.toString()).includes(ctx.params.id)) ctx.throw(403, { error_key: 'question', message: '不能重复关注' });
    me.following_questions.push(ctx.params.id);
    me.save();
    return await ctx.model.Question.update(ctx.params.id, { $inc: { follow_number: 1 } });
  }

  // 取消关注问题
  async unfollow() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('following_questions'); // 我关注的问题列表
    // 我的关注列表不包含用户id时才关注
    const index = me.following_questions.map(id => id.toString()).indexOf(ctx.params.id);
    if (index < 0) ctx.throw(403, { error_key: 'question', message: '不能重复取消' });
    me.following_questions.splice(index, 1);
    me.save();
    return await ctx.model.Question.update(ctx.params.id, { $inc: { follow_number: -1 } });
  }

  // 关注该问题的粉丝列表
  async followersList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { following_questions: ctx.params.id };
    const count = await ctx.model.User.countDocuments(_filter);
    const list = await ctx.model.User.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }

  // 点赞问题
  async favor() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('favoring_questions');
    if (me.favoring_questions.map(id => id.toString()).includes(ctx.params.id)) ctx.throw(403, { error_key: 'question', message: '不能重复点赞' });
    me.favoring_questions.push(ctx.params.id);
    me.save();
    return await ctx.model.Question.update(ctx.params.id, { $inc: { favor_number: 1 } }); // 点赞数+1
  }
  // 取消点赞问题
  async unfavor() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('favoring_questions');
    const index = me.favoring_questions.map(id => id.toString()).indexOf(ctx.params.id);
    if (index < 0) ctx.throw(403, { error_key: 'question', message: '不能重复取消' });
    me.favoring_questions.splice(index, 1);
    me.save();
    return await ctx.model.Question.update(ctx.params.id, { $inc: { favor_number: -1 } }); // 点赞数-1
  }
  // 点赞该问题的用户列表
  async favorList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { favoring_questions: ctx.params.id };
    const count = await ctx.model.User.countDocuments(_filter);
    const list = await ctx.model.User.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }

  // 收藏问题
  async collect() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('collecting_questions');
    if (me.collecting_questions.map(id => id.toString()).includes(ctx.params.id)) ctx.throw(403, { error_key: 'question', message: '不能重复收藏' });
    me.collecting_questions.push(ctx.params.id);
    me.save();
    return await ctx.model.Question.update(ctx.params.id, { $inc: { collect_number: 1 } }); // 收藏数+1
  }
  // 取消收藏问题
  async uncollect() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('collecting_questions');
    const index = me.collecting_questions.map(id => id.toString()).indexOf(ctx.params.id);
    if (index < 0) ctx.throw(403, { error_key: 'question', message: '不能重复取消' });
    me.collecting_questions.splice(index, 1);
    me.save();
    return await ctx.model.Question.update(ctx.params.id, { $inc: { collect_number: -1 } }); // 点赞数-1
  }
  // 收藏该问题的用户列表
  async collectList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { collecting_questions: ctx.params.id };
    const count = await ctx.model.User.countDocuments(_filter);
    const list = await ctx.model.User.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }

}

module.exports = QuestionsService;
