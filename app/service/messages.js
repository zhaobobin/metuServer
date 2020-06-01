// app/service/messages.js
'use strict';

const Service = require('egg').Service;

class MessagesService extends Service {
  constructor(ctx) {
    super(ctx);
    this.rule = {
      create: {
        type: { type: 'string', required: true },
        content: { type: 'string', required: true },
      },
      update: {
        type: { type: 'string', required: false },
        content: { type: 'string', required: false },
      },
    };
    this.select = '';
  }

  // 列表
  async list() {
    const { ctx } = this;
    const user_type = ctx.state.user.type;
    if (user_type !== 'admin') ctx.query.send_to = ctx.state.user._id; // 非管理员 只能查询发送给我的消息
    return await ctx.model.Message.list(ctx.query);
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const res = await ctx.model.Comment.detail({
      id: ctx.params.id,
      select: this.select,
      populate: 'send_from',
    });
    if (!res) ctx.throw(404, { error_key: 'message', message: '消息不存在' });
    return res;
  }

  // 创建
  async create() {
    const { ctx } = this;
    ctx.validate(this.rule.create, ctx.request.body);
    const res = await ctx.model.Message.add(ctx.request.body);
    if (!res) ctx.throw(422, { error_key: 'message', message: '消息创建失败' });
    ctx.helper.success({ ctx });
  }

  // 更新
  async update() {
    const { ctx } = this;
    ctx.validate(this.rule.update, ctx.request.body);
    const res = await ctx.model.Message.update(ctx.params.id, ctx.request.body);
    if (!res) ctx.throw(404, { error_key: 'message', message: '消息不存在' });
    return res;
  }

  // 删除
  async del() {
    const { ctx } = this;
    const res = await ctx.model.Message.del(ctx.params.id);
    if (!res) ctx.throw(404, { error_key: 'message', message: '消息不存在' });
    return res;
  }

}

module.exports = MessagesService;
