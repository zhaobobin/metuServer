// app/service/circles.js
'use strict';

const Service = require('egg').Service;

class CircleService extends Service {
  constructor(ctx) {
    super(ctx);
    this.rule = {
      create: {
        name: { type: 'string', required: true },
        description: { type: 'string', required: false },
      },
      update: {
        title: { type: 'string', required: false },
        description: { type: 'string', required: false },
      },
    };
  }

  // 列表
  async list() {
    const { ctx } = this;
    return await ctx.model.Circle.list(ctx.query);
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const circle = await ctx.model.Circle.detail({
      id: ctx.params.id,
      select: '+member',
      populate: 'member',
    });
    if (!circle) ctx.throw(404, { error_key: 'circle', message: '圈子不存在' });
    return circle;
  }

  // 创建
  async create() {
    const { ctx } = this;
    ctx.validate(this.rule.create, ctx.request.body);

    const res = await ctx.model.Circle.findOne({ name: ctx.request.body.name });
    if (res) ctx.throw(409, { error_key: 'circle', message: '圈子已存在' });

    const circle = await ctx.model.Circle.add(ctx);
    if (!circle) ctx.throw(422, { error_key: 'circle', message: '圈子创建失败' });

    const me = await ctx.model.User.findById(ctx.state.user._id).select('circles');
    me.circles.push(circle._id);
    me.save();

    return circle;
  }

  // 更新
  async update() {
    const { ctx } = this;
    const body = ctx.request.body;
    ctx.validate(this.rule.update, body);
    if (body.name) {
      const circle = await ctx.model.Circle.findOne({ name: body.name });
      if (circle && circle._id.toString() !== ctx.params.id) ctx.throw(409, { error_key: 'circle', message: '圈子名称已被占用' });
    }
    const res = await ctx.model.Circle.update(ctx.params.id, body);
    if (!res) ctx.throw(404, { error_key: 'circle', message: '圈子不存在' });
    return res;
  }

  // 删除
  async del() {
    const { ctx } = this;
    const res = await ctx.model.Circle.del(ctx.params.id);
    if (!res) ctx.throw(404, { error_key: 'circle', message: '圈子不存在' });
    return res;
  }

  // 加入
  async join() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('circles');
    if (me.circles.map(id => id.toString()).includes(ctx.params.id)) ctx.throw(403, { error_key: 'circle', message: '用户已经加入该圈子' });

    // 进入待审核
    const circle = await ctx.model.Circle.findById(ctx.params.id).select('audit');
    if (circle.audit.map(id => id.toString()).includes(ctx.state.user._id)) ctx.throw(403, { error_key: 'circle', message: '不能重复申请' });
    circle.audit.push(ctx.state.user._id);
    circle.save();
    return ctx.state.user._id;
  }

  // 审核
  async auditJoin() {
    const { ctx } = this;
    const user_id = ctx.request.body.id;

    // 更新待审核
    const circle = await ctx.model.Circle.findById(ctx.params.id).select('audit');
    const index = circle.audit.map(id => id.toString()).indexOf(user_id);
    if (index < 0) ctx.throw(403, { error_key: 'circle', message: '不能重复审核' });
    circle.audit.splice(index, 1);
    
    // 更新User
    const user = await ctx.model.User.findById(user_id).select('circles');
    user.circles.push(ctx.params.id);
    user.save();

    return await ctx.model.Circle.update(ctx.params.id, { $inc: { member_number: 1 } });
  }

  // 退出
  async exit() {
    const { ctx } = this;

    const res = await ctx.model.Circle.findOne({ admin: ctx.state.user._id });
    if (res) ctx.throw(403, { error_key: 'circle', message: '管理员不能退出' });

    const me = await ctx.model.User.findById(ctx.state.user._id).select('circles');
    const index = me.circles.map(id => id.toString()).indexOf(ctx.params.id);
    if (index < 0) ctx.throw(403, { error_key: 'circle', message: '用户不属于该圈子' });
    me.circles.splice(index, 1);
    me.save();
    return await ctx.model.Circle.update(ctx.params.id, { $inc: { member_number: -1 } });
  }

  // 成员列表
  async membersList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { circles: ctx.params.id };
    const count = await ctx.model.User.count(_filter);
    const list = await ctx.model.User.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }

}

module.exports = CircleService;
