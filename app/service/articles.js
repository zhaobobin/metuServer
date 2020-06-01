// app/service/articles.js
'use strict';

const Service = require('egg').Service;

class ArticleService extends Service {
  constructor(ctx) {
    super(ctx);
    this.rule = {
      create: {
        title: { type: 'string', required: true },
        description: { type: 'string', required: false },
        content: { type: 'string', required: true },
      },
      update: {
        title: { type: 'string', required: false },
        description: { type: 'string', required: false },
        content: { type: 'string', required: false },
      },
    };
  }

  // 列表
  async list() {
    const { ctx } = this;
    return await ctx.model.Article.list(ctx.query);
  }

  // 详情
  async detail() {
    const { ctx } = this;
    const article = await ctx.model.Article.detail({
      id: ctx.params.id,
      select: '+content +topics',
      populate: 'author topics',
    });
    if (!article) ctx.throw(404, { error_key: 'article', message: '文章不存在' });
    // 查询当前用户的关注、点赞、收藏状态
    if(ctx.state.user._id) {
      const me = await ctx.model.User.findById(ctx.state.user._id).select('+following +favoring_articles +collecting_articles')
      if(me.following.map(id => id.toString()).includes(article.author._id)) article.following = 1
      if(me.favoring_articles.map(id => id.toString()).includes(ctx.params.id)) article.favoring_state = 1
      if(me.collecting_articles.map(id => id.toString()).includes(ctx.params.id)) article.collecting_state = 1
    }
    return article;
  }

  // 状态
  async state() {
    const { ctx } = this;
    const article = await ctx.model.Photo.detail({
      id: ctx.params.id,
      select: 'author view_number favor_number collect_number comment_number editor status',
      populate: '',
    });
    if (!article) ctx.throw(404, { error_key: 'article', message: '文章不存在' });
    // 查询当前用户的关注、点赞、收藏状态
    if(ctx.state.user) {
      const me = await ctx.model.User.findById(ctx.state.user._id).select('+following +favoring_articles +collecting_articles')
      if(me.following.map(id => id.toString()).includes(article.author)) article.following_state = 1
      if(me.favoring_articles.map(id => id.toString()).includes(ctx.params.id)) article.favoring_state = 1
      if(me.collecting_articles.map(id => id.toString()).includes(ctx.params.id)) article.collecting_state = 1
    }
    delete article._id;
    delete article.author;
    return article;
  }

  // 创建
  async create() {
    const { ctx } = this;
    ctx.validate(this.rule.create, ctx.request.body);
    const res = await ctx.model.Article.findOne({ title: ctx.request.body.title });
    if (res) ctx.throw(409, { error_key: 'title', message: '标题已被占用' });
    const article = await ctx.model.Article.add(ctx);
    if (!article) ctx.throw(422, { message: '文章创建失败' });
    return article;
  }

  // 更新
  async update() {
    const { ctx } = this;
    ctx.validate(this.rule.update, ctx.request.body);
    const res = await ctx.model.Article.update(ctx.params.id, ctx.request.body);
    if (!res) ctx.throw(404, { error_key: 'article', message: '文章不存在' });
    return res;
  }

  // 删除
  async del() {
    const { ctx } = this;
    const res = await ctx.model.Article.del(ctx.params.id);
    if (!res) ctx.throw(404, { error_key: 'article', message: '文章不存在' });
    return res;
  }

  // 点赞文章
  async favor() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('favoring_articles');
    if (me.favoring_articles.map(id => id.toString()).includes(ctx.params.id)) ctx.throw(403, { error_key: 'article', message: '不能重复点赞' });
    me.favoring_articles.push(ctx.params.id);
    me.save();
    const article = await ctx.model.Article.update(ctx.params.id, { $inc: { favor_number: 1 } }); // 点赞数+1
    return await ctx.model.Message.add({
      type: 'favor',
      content: '点赞',
      send_from: ctx.state.user._id,
      send_to: article.author,
      article: article._id,
    });
  }
  // 取消点赞
  async unfavor() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('favoring_articles');
    const index = me.favoring_articles.map(id => id.toString()).indexOf(ctx.params.id);
    if (index < 0) ctx.throw(403, { error_key: 'article', message: '不能重复取消' });
    me.favoring_articles.splice(index, 1);
    me.save();
    return await ctx.model.Article.update(ctx.params.id, { $inc: { favor_number: -1 } }); // 点赞数-1
  }
  // 点赞该文章的用户
  async favorList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { favoring_articles: ctx.params.id };
    const count = await ctx.model.User.count(_filter);
    const list = await ctx.model.User.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }

  // 收藏文章
  async collect() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('collecting_articles');
    if (me.collecting_articles.map(id => id.toString()).includes(ctx.params.id)) ctx.throw(403, { error_key: 'article', message: '不能重复收藏' });
    me.collecting_articles.push(ctx.params.id);
    me.save();
    const article = await ctx.model.Article.update(ctx.params.id, { $inc: { collect_number: 1 } }); // 收藏数+1
    return await ctx.model.Message.add({
      type: 'collect',
      content: '收藏',
      send_from: ctx.state.user._id,
      send_to: article.author,
      article: article._id,
    });
  }
  // 取消收藏
  async uncollect() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('collecting_articles');
    const index = me.collecting_articles.map(id => id.toString()).indexOf(ctx.params.id);
    if (index < 0) ctx.throw(403, { error_key: 'article', message: '不能重复取消' });
    me.collecting_articles.splice(index, 1);
    me.save();
    return await ctx.model.Article.update(ctx.params.id, { $inc: { collect_number: -1 } }); // 点赞数-1
  }
  // 收藏该文章的用户
  async collectList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { collecting_articles: ctx.params.id };
    const count = await ctx.model.User.count(_filter);
    const list = await ctx.model.User.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }

  // 文章相关的评论列表
  async commentsList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { article_id: ctx.params.id };
    const count = await ctx.model.Comment.count(_filter);
    const list = await ctx.model.Comment.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .populate('author')
      .exec();
    return { list, count };
  }

}

module.exports = ArticleService;
