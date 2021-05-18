// app/service/answers.js
'use strict';

const Service = require('egg').Service;

class AnswersService extends Service {
  constructor(ctx) {
    super(ctx);
    this.rule = {
      create: {
        content: { type: 'string', required: true },
      },
      update: {
        content: { type: 'string', required: true },
      },
    };
    this.select = '';
  }

  // 列表
  async list() {
    const { ctx } = this;
    return await ctx.model.Answer.list(ctx.params.questionId, ctx.query);
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const topic = await ctx.model.Answer.detail({
      id: ctx.params.id,
      select: this.select,
      populate: 'answerer',
    });
    if (!topic) ctx.throw(404, { error_key: 'answer', message: '回答不存在' });
    return topic;
  }

  // 创建
  async create() {
    const { ctx } = this;
    ctx.validate(this.rule.create, ctx.request.body);
    const answer = await ctx.model.Answer.add(ctx);
    if (!answer) ctx.throw(422, { error_key: 'answer', message: '回答创建失败' });
    return answer;
  }

  // 更新
  async update() {
    const { ctx } = this;
    ctx.validate(this.rule.update, ctx.request.body);
    const res = await ctx.model.Answer.update(ctx.params.id, ctx.request.body);
    if (!res) ctx.throw(404, { error_key: 'answer', message: '回答不存在' });
    return res;
  }

  // 删除
  async del() {
    const { ctx } = this;
    const res = await ctx.model.Answer.del(ctx.params.id);
    if (!res) ctx.throw(404, { error_key: 'answer', message: '回答不存在' });
    return res;
  }

  // 点赞回答
  async favor() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('favoring_answers');
    if (me.favoring_answers.map(id => id.toString()).includes(ctx.params.id)) ctx.throw(403, { error_key: 'answer', message: '不能重复点赞' });
    me.favoring_answers.push(ctx.params.id);
    me.save();
    return await ctx.model.Answer.update(ctx.params.id, { $inc: { favor_number: 1 } }); // 点赞数+1
  }
  // 取消点赞回答
  async unfavor() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('favoring_answers');
    const index = me.favoring_answers.map(id => id.toString()).indexOf(ctx.params.id);
    if (index < 0) ctx.throw(403, { error_key: 'answer', message: '不能重复取消' });
    me.favoring_answers.splice(index, 1);
    me.save();
    return await ctx.model.Answer.update(ctx.params.id, { $inc: { favor_number: -1 } }); // 点赞数-1
  }
  // 点赞该回答的所有列表
  async favorList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { favoring_answers: ctx.params.id };
    const count = await ctx.model.User.countDocuments(_filter);
    const list = await ctx.model.User.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }

  // 收藏回答
  async collect() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('collecting_answers');
    if (me.collecting_answers.map(id => id.toString()).includes(ctx.params.id)) ctx.throw(403, { error_key: 'collecting', message: '不能重复收藏' });
    me.collecting_answers.push(ctx.params.id);
    me.save();
    const answer = await ctx.model.Answer.update(ctx.params.id, { $inc: { collec_number: 1 } }); // 收藏数+1
    return await ctx.model.Message.add({
      type: 'collect',
      content: '收藏',
      send_from: ctx.state.user._id,
      send_to: answer.answerer,
      answer: answer._id,
    });
  }
  // 取消收藏回答
  async uncollect() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('collecting_answers');
    const index = me.collecting_answers.map(id => id.toString()).indexOf(ctx.params.id);
    if (index < 0) ctx.throw(403, { error_key: 'collecting', message: '不能重复取消' });
    me.collecting_answers.splice(index, 1);
    me.save();
    return await ctx.model.Answer.update(ctx.params.id, { $inc: { collec_number: -1 } }); // 点赞数-1
  }
  // 收藏该回答的用户列表
  async collectList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { collecting_answers: ctx.params.id };
    const count = await ctx.model.User.countDocuments(_filter);
    const list = await ctx.model.User.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }

}

module.exports = AnswersService;
