// app/service/comments.js
'use strict';

const Service = require('egg').Service;

class CommentsService extends Service {
  constructor(ctx) {
    super(ctx);
    this.rule = {
      create: {
        content: { type: 'string', required: true }
      },
      reply: {
        content: { type: 'string', required: true },
        root_comment_id: { type: 'string', required: true }, // 二级评论
        reply_to: { type: 'string', required: true }, // 二级评论
      },
      update: {
        content: { type: 'string', required: true },
      },
    };
  }

  // 评论列表
  async list() {
    const { ctx } = this;
    const comments = await ctx.model.Comment.list(ctx.params, ctx.query)
    if(ctx.state.user){
      const me = await ctx.model.User.findById(ctx.state.user._id).select('favoring_comments');
      for(const comment of comments.list) {
        if(me.favoring_comments.map(id => id.toString()).includes(comment._id)) {
          comment.favoring_state = 1
        }
      }
    }
    return comments;
  }

  // 评论详情
  async detail() {
    const { ctx } = this;
    let populate = 'author';
    switch(ctx.params.category){
      case 'articles': populate += ' article_id'; break;
      case 'photos': populate += ' photo_id'; break;
      case 'questions': populate += ' question_id'; break;
      case 'answers': populate += ' answer_id'; break;
      default: break;
    }
    const res = await ctx.model.Comment.detail({
      id: ctx.params.comment_id,
      select: '',
      populate: populate,
    });
    if (!res) ctx.throw(404, { error_key: 'comment', message: '评论不存在' });
    return res;
  }

  // 评论的状态
  async state() {
    const { ctx } = this;
    let populate = 'author';
    switch(ctx.params.category){
      case 'articles': populate += ' article_id'; break;
      case 'photos': populate += ' photo_id'; break;
      case 'questions': populate += ' question_id'; break;
      case 'answers': populate += ' answer_id'; break;
      default: break;
    }
    const res = await ctx.model.Comment.detail({
      id: ctx.params.comment_id,
      select: '',
      populate: populate,
    });
    if (!res) ctx.throw(404, { error_key: 'comment', message: '评论不存在' });
    return res;
  }

  // 创建评论
  async create() {
    const { ctx } = this;
    ctx.validate(this.rule.create, ctx.request.body);
    const comment = await ctx.model.Comment.add(ctx);
    if (!comment) ctx.throw(422, { error_key: 'comment', message: '评论创建失败' });
    const newMessage = {
      type: 'comment',
      content: '评论',
      send_from: ctx.state.user._id,
      category: ctx.params.category
    }
    let res;
    switch (ctx.params.category) {
      case 'photos':
        res = await ctx.model.Photo.update(ctx.params.detail_id, { $inc: { comment_number: 1 } }); // 评论数+1
        newMessage['photo'] = res._id;
        break;
      case 'articles':
        res = await ctx.model.Article.update(ctx.params.detail_id, { $inc: { comment_number: 1 } }); // 评论数+1
        newMessage['article'] = res._id;
        break;
      case 'questions':
        res = await ctx.model.Question.update(ctx.params.detail_id, { $inc: { comment_number: 1 } }); // 评论数+1
        newMessage['question'] = res._id;
        break;
      case 'answers':
        res = await ctx.model.Answer.update(ctx.params.detail_id, { $inc: { comment_number: 1 } }); // 评论数+1
        newMessage['answer'] = res._id;
        break;
      default: break;
    }
    newMessage['send_to'] = res.author;
    await ctx.model.Message.add(newMessage);
    return comment;
  }

  // 更新
  async update() {
    const { ctx } = this;
    ctx.validate(this.rule.update, ctx.request.body);
    const res = await ctx.model.Comment.update(ctx.params.id, ctx.request.body);
    if (!res) ctx.throw(404, { error_key: 'comment', message: '评论不存在' });
    return res;
  }

  // 删除
  async del() {
    const { ctx } = this;
    const res = await ctx.model.Comment.del(ctx.params.comment_id);
    if (!res) ctx.throw(404, { error_key: 'comment', message: '评论不存在' });
    return res;
  }

  // 回复评论
  async reply() {
    const { ctx } = this;
    ctx.validate(this.rule.reply, ctx.request.body);
    const comment = await ctx.model.Comment.add(ctx);
    if (!comment) ctx.throw(422, { error_key: 'comment', message: '评论创建失败' });
    const newMessage = {
      type: 'comment',
      content: '评论',
      send_from: ctx.state.user._id,
      send_to: ctx.request.body.reply_to,
      category: ctx.params.category
    }
    let res;
    switch (ctx.params.category) {
      case 'photos':
        res = await ctx.model.Photo.update(ctx.params.detail_id, { $inc: { comment_number: 1 } }); // 评论数+1
        newMessage['photo'] = res._id;
        break;
      case 'articles':
        res = await ctx.model.Article.update(ctx.params.detail_id, { $inc: { comment_number: 1 } }); // 评论数+1
        newMessage['article'] = res._id;
        break;
      case 'questions':
        res = await ctx.model.Question.update(ctx.params.detail_id, { $inc: { comment_number: 1 } }); // 评论数+1
        newMessage['question'] = res._id;
        break;
      case 'answers':
        res = await ctx.model.Answer.update(ctx.params.detail_id, { $inc: { comment_number: 1 } }); // 评论数+1
        newMessage['answer'] = res._id;
        break;
      default: break;
    }
    await ctx.model.Message.add(newMessage);
    return comment;
  }

  // 评论的回复列表
  async replyList() {
    const { ctx } = this;
    const query = { root_comment_id: ctx.params.comment_id }
    return await ctx.model.Comment.list(ctx.params, query)
  }

  // 点赞评论.
  async favor() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('favoring_comments');
    if (me.favoring_comments.map(id => id.toString()).includes(ctx.params.comment_id)) {
      ctx.throw(403, { error_key: 'comment', message: '不能重复点赞' });
    }
    me.favoring_comments.push(ctx.params.comment_id);
    me.save();
    const comment = await ctx.model.Comment.update(ctx.params.comment_id, { $inc: { favor_number: 1 } }); // 点赞数+1
    await ctx.model.Message.add({
      type: 'favor',
      content: '点赞',
      send_from: ctx.state.user._id,
      send_to: comment.author,
      comment: comment._id,
    });
    return comment;
  }
  // 取消点赞
  async unfavor() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('favoring_comments');
    const index = me.favoring_comments.map(id => id.toString()).indexOf(ctx.params.comment_id);
    if (index < 0) ctx.throw(403, { error_key: 'comment', message: '不能重复取消' });
    me.favoring_comments.splice(index, 1);
    me.save();
    return await ctx.model.Comment.update(ctx.params.comment_id, { $inc: { favor_number: -1 } }); // 点赞数-1
  }
  // 点赞该评论的用户列表
  async favorList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { favoring_comments: ctx.params.comment_id };
    const count = await ctx.model.User.find(_filter);
    const list = await ctx.model.User.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  }

}

module.exports = CommentsService;
