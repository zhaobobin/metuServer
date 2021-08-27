// app/service/users.js
'use strict';

const Service = require('egg').Service;

class UserService extends Service {
  constructor(ctx) {
    super(ctx);
    this.rule = {
      create: {
        mobile: { type: 'string', required: true },
        nickname: { type: 'string', required: true },
        password: { type: 'string', required: false },
      },
      update: {
        mobile: { type: 'string', required: false },
        password: { type: 'string', required: false },
        nickname: { type: 'string', required: false },
        headline: { type: 'string', required: false },
        avatar_url: { type: 'string', required: false },
        gender: { type: 'string', required: false },
        location: { type: 'string', required: false },
        blog: { type: 'string', required: false },
      },
      delete: {
        id: { type: 'string', required: true }, // id长度24
      },
    };
    this.select = '+mobile +city +location +blog +headline +tags +following_number +followers_number';
  }

  /* ----------------------> 用户的增删改查 <---------------------- */
  // 列表
  async list() {
    const { ctx } = this;
    return await ctx.model.User.list(ctx.query);
  }

  // 详情
  async detail() {
    const { ctx } = this;
    // 可选查询字符串
    if (ctx.query.include) {
      this.select = this.select + ' +' + ctx.query.include.split('+').join(' +');
    }
    let user;
    if (ctx.params.id.length === 24) {
      user = await ctx.model.User.detail({
        id: ctx.params.id,
        select: this.select,
        populate: 'tags city',
      });
    } else { // 参数不是ObjectId
      user = await ctx.model.User.findByName({
        username: ctx.params.id,
        select: this.select,
        populate: 'tags city',
      });
    }
    if (!user) {
      ctx.throw(404, { error_key: 'user', message: '用户不存在' });
    }
    if(ctx.state.user) {
      const me = await ctx.model.User.findById(ctx.state.user._id).select('+following')
      if (me.following.map(id => id.toString()).includes(user._id)) {
        user.following_state = 1
      }
    }
    user.mobile = ctx.helper.filterTel(user.mobile);
    return user;
  }

  // 创建
  async create() {
    const { ctx } = this;
    const body = ctx.request.body;
    ctx.validate(this.rule.create, body);

    const res = await ctx.model.User.findOne({ $or: [{ mobile: body.mobile }, { nickname: body.nickname }] })
      .select('+mobile');
    if (res) {
      if (body.mobile && body.mobile === res.mobile) ctx.throw(409, { error_key: 'mobile', message: '手机号已被注册' });
      if (body.nickname === res.nickname) ctx.throw(409, { error_key: 'nickname', message: '昵称已被占用' });
    }

    if (body.password) {
      ctx.request.body.password = ctx.service.crypto.Decrypt(body.mobile, body.password);
    }
    const user = await ctx.model.User.add(ctx);
    if (!user) {
      ctx.throw(422, { error_key: 'user', message: '用户创建失败' });
    }
    return user;
  }

  // 更新
  async update() {
    const { ctx } = this;
    const body = ctx.request.body;
    ctx.validate(this.rule.update, body);
    if (body.nickname) {
      const user = await ctx.model.User.findOne({ nickname: body.nickname });
      if (user && user._id.toString() !== ctx.state.user._id) {
        ctx.throw(409, { error_key: 'nickname', message: '昵称已被占用' });
      }
      const reg = new RegExp("[\\u4E00-\\u9FFF]+", "g"); // 如果用户名不含中文，则重新生成用户名
      if (!reg.test(body.nickname)) {
        body.username = body.nickname;
      }
    }
    const res = await ctx.model.User.update(ctx.params.id, body);
    if (!res) {
      ctx.throw(404, { error_key: 'user', message: '用户不存在' });
    }
    return res;
  }

  // 删除
  async del() {
    const { ctx } = this;
    ctx.validate(this.rule.delete, ctx.params.id);
    const res = await ctx.model.User.del(ctx.params.id);
    if (!res) {
      ctx.throw(404, { error_key: 'user', message: '用户不存在' });
    }
    return res;
  }
  /* ----------------------> 用户的增删改查 end! <---------------------- */

  /* ----------------------> 关注用户 <---------------------- */
  // 关注某人
  async follow() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id)
      .select('following following_number');

    // 我的关注列表不包含用户id时才关注
    if (me.following.map(id => id.toString()).includes(ctx.params.id)) {
      ctx.throw(403, { error_key: 'user', message: '不能重复关注' });
    }
    me.following.push(ctx.params.id);
    me.following_number += 1;
    me.save();

    await ctx.model.User.update(ctx.params.id, { $inc: { followers_number: 1 } });
    return await ctx.model.Message.add({
      type: 'follow',
      content: '关注',
      send_from: ctx.state.user._id,
      send_to: ctx.params.id,
    });
  }

  // 取消关注某人
  async unfollow() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id)
      .select('following following_number');

    // 我的关注列表不包含用户id时才关注
    const index = me.following.map(id => id.toString()).indexOf(ctx.params.id);
    if (index < 0) {
      ctx.throw(403, { error_key: 'user', message: '不能重复取消' });
    }
    me.following.splice(index, 1);
    me.following_number -= 1;
    me.save();

    return await ctx.model.User.update(ctx.params.id, { $inc: { followers_number: -1 } });
  }

  // 用户的粉丝列表 - 查询关注了这个人(ctx.params.id)的所有用户
  async followersList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const users = await ctx.model.User.find({ following: ctx.params.id })
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list: users, count: users.length };
  }
  /* ----------------------> 关注用户 end! <---------------------- */

  // 用户关注的用户列表
  async followingList() {
    const { ctx } = this;
    const category = ctx.params.category;
    let field = 'following';
    switch (category) {
      case 'topics': field = 'following_topics'; break;
      case 'questions': field = 'following_questions'; break;
      case 'answers': field = 'following_answers'; break;
      case 'articles': field = 'following_articles'; break;
      case 'photos': field = 'following_photos'; break;
      default: break;
    }
    const user = await ctx.model.User.queryFieldList({ id: ctx.params.id, query: ctx.query, field });
    if (!user) {
      ctx.throw(404, 'user 用户不存在');
    }
    return { list: user[field], count: user[field].length };
  }

  // 用户的关注列表
  async favorList() {
    const { ctx } = this;
    const category = ctx.params.category;
    let field = '';
    switch (category) {
      case 'questions': field = 'favoring_questions'; break;
      case 'answers': field = 'favoring_answers'; break;
      case 'comments': field = 'favoring_comments'; break;
      case 'articles': field = 'favoring_articles'; break;
      case 'photos': field = 'favoring_photos'; break;
      default: break;
    }
    const user = await ctx.model.User.queryFieldList({ id: ctx.params.id, query: ctx.query, field });
    if (!user) {
      ctx.throw(404, 'user 用户不存在');
    }
    return { list: user[field], count: user[field].length };
  }

  // 用户的收藏列表
  async collectList() {
    const { ctx } = this;
    const category = ctx.params.category;
    let field = '';
    switch (category) {
      case 'questions': field = 'collecting_questions'; break;
      case 'answers': field = 'collecting_answers'; break;
      case 'articles': field = 'collecting_articles'; break;
      case 'photos': field = 'collecting_photos'; break;
      default: break;
    }
    const user = await ctx.model.User.queryFieldList({
      id: ctx.params.id,
      query: ctx.query,
      field,
    });
    if (!user) {
      ctx.throw(404, 'user 用户不存在');
    }
    return { list: user[field], count: user[field].length };
  }

  /* ----------------------> 用户的发布 <---------------------- */
  // 用户的照片列表
  async photosList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: -1 };
    const _filter = { author: ctx.params.id };
    const count = await ctx.model.Photo.countDocuments(_filter);
    const list = await ctx.model.Photo.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .populate('author')
      .exec();
    return { list, count };
  }
  // 用户的图片列表
  async imagesList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: -1 };
    const _filter = { author: ctx.params.id };
    const count = await ctx.model.Image.countDocuments(_filter);
    const list = await ctx.model.Image.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .populate('author')
      .exec();
    return { list, count };
  }

  // 用户的文章列表
  async articlesList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: -1 };
    const _filter = { author: ctx.params.id };
    const count = await ctx.model.Article.countDocuments(_filter);
    const list = await ctx.model.Article.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .populate('author')
      .exec();
    return { list, count };
  }

  // 用户的问题列表
  async questionsList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: -1 };
    const _filter = { questioner: ctx.params.id };
    const count = await ctx.model.Question.countDocuments(_filter);
    const list = await ctx.model.Question.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }

  // 用户的回答列表
  async answersList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: -1 };
    const _filter = { answerer: ctx.params.id };
    const count = await ctx.model.Answer.countDocuments(_filter);
    const list = await ctx.model.Answer.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }
  /* ----------------------> 用户的发布 end! <---------------------- */

  /* ----------------------> 圈子 <---------------------- */
  // 用户的圈子列表
  async circlesList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: -1 };
    const _filter = { members: ctx.params.id };
    const count = await ctx.model.Circle.countDocuments(_filter);
    const list = await ctx.model.Circle.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }
  /* ----------------------> 圈子 end! <---------------------- */

}

module.exports = UserService;
