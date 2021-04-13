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

    circle.following_state = 0;
    if(ctx.state.user) {
      const me = await ctx.model.User.findById(ctx.state.user._id).select('+following_circles');
      if(me.following_circles.map(id => id.toString()).includes(circle._id)) {
        circle.following_state = 1;
      }
    }
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

    const me = await ctx.model.User.findById(ctx.state.user._id).select('following_circles');
    me.following_circles.push(circle._id);
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

  // 检查加入状态
  async checkJoinStatus() {
    const { ctx } = this;
    const circle = await ctx.model.Circle.detail({
      id: ctx.params.id,
      select: '+member',
      populate: 'member',
    });
    if (!circle) ctx.throw(404, { error_key: 'circle', message: '圈子不存在' });

    const user = await ctx.model.User.findById(ctx.params.user._id).select('+following_circles');
    if (!user) ctx.throw(404, { error_key: 'user', message: '用户不存在' });

    let following_state = 0;
    if(user.following_circles.map(id => id.toString()).includes(circle._id)) {
      following_state = 1;
    }
    return following_state;
  }

  // 加入
  async join() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('following_circles');
    if (me.following_circles.map(id => id.toString()).includes(ctx.params.id)) ctx.throw(403, { error_key: 'circle', message: '用户已经加入该圈子' });

    const circle = await ctx.model.Circle.findById(ctx.params.id).select('audit');
    // 进入待审核
    if (circle.require_audit) {
      if (circle.audit.map(id => id.toString()).includes(ctx.state.user._id)) ctx.throw(403, { error_key: 'circle', message: '不能重复申请' });
      circle.audit.push(ctx.state.user._id);
      circle.save();
      return circle;
    } else {
      me.following_circles.push(circle._id);
      me.save();
      return await ctx.model.Circle.update(ctx.params.id, { $inc: { member_number: 1 } });
    }
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
    const user = await ctx.model.User.findById(user_id).select('following_circles');
    user.following_circles.push(ctx.params.id);
    user.save();

    return await ctx.model.Circle.update(ctx.params.id, { $inc: { member_number: 1 } });
  }

  // 退出
  async exit() {
    const { ctx } = this;

    const res = await ctx.model.Circle.findOne({ admin: ctx.state.user._id });
    if (res) ctx.throw(403, { error_key: 'circle', message: '管理员不能退出' });

    const me = await ctx.model.User.findById(ctx.state.user._id).select('following_circles');
    const index = me.following_circles.map(id => id.toString()).indexOf(ctx.params.id);
    if (index < 0) ctx.throw(403, { error_key: 'circle', message: '用户不属于该圈子' });
    me.following_circles.splice(index, 1);
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
    const _filter = { following_circles: ctx.params.id };
    const count = await ctx.model.User.count(_filter);
    const list = await ctx.model.User.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    const hasMore = list.length === perPage;
    return { list, count, hasMore };
  }

  // 成员详情
  async memberDetail() {
    const { ctx } = this;
    
  }

}

module.exports = CircleService;
