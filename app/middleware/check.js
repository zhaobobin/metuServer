/**
 * 检查工具
 */
'use strict';

// 用户是否存在
exports.userExist = async function(ctx, next) {
  const user = await ctx.model.User.findById(ctx.params.id);
  if (!user) ctx.throw(404, { error_key: 'user', message: '用户不存在' });
  await next();
};

// 圈子是否存在
exports.circleExist = async function(ctx, next) {
  const circle = await ctx.model.Circle.findById(ctx.params.id);
  if (!circle) ctx.throw(404, { error_key: 'circle', message: '圈子不存在' });
  ctx.state.circle = circle;
  await next();
};

// 文章是否存在
exports.articleExist = async function(ctx, next) {
  const article = await ctx.model.Article.findById(ctx.params.id);
  if (!article) ctx.throw(404, { error_key: 'article', message: '文章不存在' });
  ctx.state.article = article;
  await next();
};

// 图片是否存在
exports.photoExist = async function(ctx, next) {
  const photo = await ctx.model.Photo.findById(ctx.params.id);
  if (!photo) ctx.throw(404, { error_key: 'photo', message: '图片不存在' });
  ctx.state.photo = photo;
  await next();
};

// 话题是否存在
exports.topicExist = async function(ctx, next) {
  const topic = await ctx.model.Topic.findById(ctx.params.id);
  if (!topic) ctx.throw(404, { error_key: 'topic', message: '话题不存在' });
  ctx.state.topic = topic;
  await next();
};

// 问题是否存在
exports.questionExist = async function(ctx, next) {
  const question = await ctx.model.Question.findById(ctx.params.id);
  if (!question) ctx.throw(404, { error_key: 'question', message: '问题不存在' });
  ctx.state.question = question;
  await next();
};

// 回答是否存在
exports.answerExist = async function(ctx, next) {
  const answer = await ctx.model.Answer.findById(ctx.params.id);
  if (!answer) ctx.throw(404, { error_key: 'answer', message: '回答不存在' });
  if (ctx.params.question_id && ctx.params.question_id !== answer.question_id) {
    ctx.throw(404, { error_key: 'answer', message: '该问题下没有此答案' });
  }
  ctx.state.answer = answer;
  await next();
};

// 评论是否存在
exports.commentExist = async function(ctx, next) {
  const comment = await ctx.model.Comment.findById(ctx.params.comment_id);
  if (!comment) ctx.throw(404, { error_key: 'comment', message: '评论不存在' });
  if (ctx.params.article_id && ctx.params.article_id !== comment.article_id) ctx.throw(404, { error_key: 'comment', message: '该文章下没有此评论' });
  if (ctx.params.photo_id && ctx.params.photo_id !== comment.photo_id) ctx.throw(404, { error_key: 'comment', message: '该图片下没有此评论' });
  if (ctx.params.answer_id && ctx.params.answer_id !== comment.answer_id) ctx.throw(404, { error_key: 'comment', message: '该回答下没有此评论' });
  if (ctx.params.root_comment_id && ctx.params.root_comment_id !== comment.root_comment_id) ctx.throw(404, {      error_key: 'comment', message: '该评论下没有此回复' });
  ctx.state.comment = comment;
  await next();
};
