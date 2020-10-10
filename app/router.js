/**
 * app/router.js
 * app.resources('routerName', 'pathMatch', controller)
 */
'use strict';

const auth = require('./utils/token').verifyToken;
const check = require('./middleware/check');

module.exports = app => {
  const { router, controller } = app;

  // home 首页接口
  router.get('/', controller.home.index);
  router.get('/api', controller.home.api);
  router.get('/api/v1/banner', controller.home.banner);
  router.get('/api/v1/carsouel', controller.home.carsouel);

  /* ----------------------> 【账户】 start <---------------------- */
  // access 用户访问
  router.post('/api/v1/user/register', controller.access.register);
  router.post('/api/v1/user/emailcode', controller.access.emailcode); // 邮箱验证码
  router.post('/api/v1/user/smscode', controller.access.smscode); // 短信验证码
  router.post('/api/v1/user/login', controller.access.login);
  router.post('/api/v1/user/token', auth, controller.access.token);
  router.post('/api/v1/user/logout', auth, controller.access.logout);
  router.post('/api/v1/user/checkMobile', controller.access.checkMobile);
  router.post('/api/v1/user/accountAuth', auth, controller.access.accountAuth);
  router.post('/api/v1/user/wechatLoginAuth', controller.access.wechatLoginAuth); // 微信登录
  router.post('/api/v1/user/weiboLoginAuth', controller.access.weiboLoginAuth); // 微博登录
  router.post('/api/v1/user/qqLoginAuth', controller.access.qqLoginAuth); // QQ登录

  // account 账户设置相关 - 用户本人操作
  router.post('/api/v1/user', auth, controller.account.detail); // 账户详情 - 用户隐私信息
  router.patch('/api/v1/user', auth, controller.account.patch); // 修改账户详情
  router.post('/api/v1/user/cover', auth, controller.account.cover); // 用户操作
  router.post('/api/v1/user/avatar', auth, controller.account.avatar); // 用户操作
  router.post('/api/v1/user/changeEmail', auth, controller.account.changeEmail); // 修改邮箱
  router.post('/api/v1/user/changeMobile', auth, controller.account.changeMobile); // 修改手机
  router.post('/api/v1/user/changePsd', auth, controller.account.changePsd); // 修改密码
  router.post('/api/v1/user/changeProfile', auth, controller.account.changeProfile); // 修改个人信息 - 个人操作
  router.post('/api/v1/user/resetPsd', controller.account.resetPsd); // 重置密码


  /* ----------------------> 【账户】 end! <---------------------- */


  /* ----------------------> 【用户】 start <---------------------- */
  // users 增改查
  router.get('/api/v1/users', controller.users.list); // 用户列表
  router.get('/api/v1/users/:id', controller.users.detail); // 用户公开信息 - id查询
  router.post('/api/v1/users', auth, controller.users.create); // 创建用户 - 管理员操作
  router.patch('/api/v1/users/:id', auth, controller.users.patch); // 修改用户 - 管理员操作
  router.delete('/api/v1/users/:id', auth, controller.users.del); // 删除用户 - 软删除

  // users - 关注与粉丝
  router.put('/api/v1/users/following/:id', auth, check.userExist, controller.users.follow); // 关注用户
  router.delete('/api/v1/users/following/:id', auth, check.userExist, controller.users.unfollow); // 取消关注用户
  router.get('/api/v1/users/:id/followers', controller.users.followersList); // 关注该用户的粉丝列表

  // users - 用户的【关注】
  router.get('/api/v1/users/:id/following', controller.users.followingList); // 用户关注的用户列表
  router.get('/api/v1/users/:id/following/:category', controller.users.followingList); // 用户的关注列表

  // users - 用户的【点赞】：问题、文章、图片等
  router.get('/api/v1/users/:id/favoring/:category', check.userExist, controller.users.favorList); // 点赞列表

  // users - 用户的【收藏】：问题、文章、图片等
  router.get('/api/v1/users/:id/collecting/:category', check.userExist, controller.users.collectList); // 收藏列表

  // users - 用户的【发布】：问题、文章、图片等
  router.get('/api/v1/users/:id/photos', check.userExist, controller.users.photosList); // 用户的照片列表
  router.get('/api/v1/users/:id/images', check.userExist, controller.users.imagesList); // 用户的图片列表
  router.get('/api/v1/users/:id/articles', check.userExist, controller.users.articlesList); // 用户的文章列表
  router.get('/api/v1/users/:id/questions', check.userExist, controller.users.questionsList); // 用户的话题列表
  router.get('/api/v1/users/:id/answers', check.userExist, controller.users.answersList); // 用户的回答列表

  // users - 用户的【圈子】
  router.get('/api/v1/users/:id/cricles', check.userExist, controller.users.criclesList); // 用户的圈子列表

  /* ----------------------> 【用户】 end! <---------------------- */


  /* ----------------------> 【消息】 <---------------------- */
  // messages 增删改查
  router.get('/api/v1/messages', auth, controller.messages.list); // 列表
  router.get('/api/v1/messages/:id', auth, controller.messages.detail); // 详情
  router.post('/api/v1/messages', auth, controller.messages.create); // 创建
  router.patch('/api/v1/messages/:id', auth, controller.messages.patch); // 修改
  router.delete('/api/v1/messages/:id', auth, controller.messages.del); // 删除
  /* ----------------------> 【消息】 end! <---------------------- */


  /* ----------------------> 【文章】 start <---------------------- */
  // articles 增删改查
  router.get('/api/v1/articles', controller.articles.list); // 列表
  router.get('/api/v1/articles/:id', check.articleExist, controller.articles.detail); // 详情
  router.get('/api/v1/articles/:id/state', check.articleExist, controller.articles.state); // 状态
  router.get('/api/v1/articles/:id/prev', check.articleExist, controller.articles.prev); // 上一组
  router.get('/api/v1/articles/:id/next', check.articleExist, controller.articles.next); // 下一组
  router.post('/api/v1/articles', auth, controller.articles.create); // 创建
  router.patch('/api/v1/articles/:id', auth, check.articleExist, controller.articles.patch); // 修改
  router.delete('/api/v1/articles/:id', auth, check.articleExist, controller.articles.del); // 删除 - 管理员操作

  // articles - 文章的相关操作
  router.put('/api/v1/articles/favoring/:id', auth, check.articleExist, controller.articles.favor); // 点赞
  router.delete('/api/v1/articles/favoring/:id', auth, check.articleExist, controller.articles.unfavor); // 取消点赞
  router.get('/api/v1/articles/:id/favoring', check.articleExist, controller.articles.favorList); // 点赞该文章的用户

  router.put('/api/v1/articles/collecting/:id', auth, check.articleExist, controller.articles.collect); // 收藏
  router.delete('/api/v1/articles/collecting/:id', auth, check.articleExist, controller.articles.uncollect); // 取消收藏
  router.get('/api/v1/articles/:id/collecting', check.articleExist, controller.articles.collectList); // 收藏该文章的用户列表

  // router.get('/api/v1/articles/:id/comments', check.articleExist, controller.articles.commentsList); // 与该文章相关的评论列表
  /* ----------------------> 【文章】 end! <---------------------- */


  /* ----------------------> 【图片】 start <---------------------- */
  // photos 增删改查
  router.get('/api/v1/photos', controller.photos.list); // 列表
  router.get('/api/v1/photos/:id', check.photoExist, controller.photos.detail); // 详情
  router.get('/api/v1/photos/:id/state', check.photoExist, controller.photos.state); // 状态
  router.get('/api/v1/photos/:id/prev', check.photoExist, controller.photos.prev); // 上一组
  router.get('/api/v1/photos/:id/next', check.photoExist, controller.photos.next); // 下一组
  router.post('/api/v1/photos', auth, controller.photos.create); // 创建
  router.patch('/api/v1/photos/:id', auth, check.photoExist, controller.photos.patch); // 修改
  router.delete('/api/v1/photos/:id', auth, check.photoExist, controller.photos.del); // 删除 - 管理员操作

  // photos - 图片的相关操作
  router.put('/api/v1/photos/favoring/:id', auth, check.photoExist, controller.photos.favor); // 点赞
  router.delete('/api/v1/photos/favoring/:id', auth, check.photoExist, controller.photos.unfavor); // 取消点赞
  router.get('/api/v1/photos/:id/favoring', check.photoExist, controller.photos.favorList); // 点赞该图片的用户

  router.put('/api/v1/photos/collecting/:id', auth, check.photoExist, controller.photos.collect); // 收藏
  router.delete('/api/v1/photos/collecting/:id', auth, check.photoExist, controller.photos.uncollect); // 取消收藏
  router.get('/api/v1/photos/:id/collecting', check.photoExist, controller.articles.collectList); // 收藏该图片的用户列表
  /* ----------------------> 【图片】 end! <---------------------- */


  /* ----------------------> 【话题】 start <---------------------- */
  // topics 增删改查
  router.get('/api/v1/topics', controller.topics.list); // 话题列表
  router.get('/api/v1/topics/:id', check.topicExist, controller.topics.detail); // 话题详情
  router.post('/api/v1/topics', auth, controller.topics.create); // 创建话题
  router.patch('/api/v1/topics/:id', auth, check.topicExist, controller.topics.patch); // 修改话题
  router.delete('/api/v1/topics/:id', auth, check.topicExist, controller.topics.del); // 删除话题 - 管理员操作

  // topics - 话题的相关操作
  router.put('/api/v1/topics/following/:id', auth, check.topicExist, controller.topics.follow); // 关注话题
  router.delete('/api/v1/topics/following/:id', auth, check.topicExist, controller.topics.unfollow); // 取消关注话题
  router.get('/api/v1/topics/:id/followers', check.topicExist, controller.topics.followersList); // 关注该话题的用户列表
  router.get('/api/v1/topics/:id/articles', check.topicExist, controller.topics.articlesList); // 与该话题相关的文章列表
  router.get('/api/v1/topics/:id/questions', check.topicExist, controller.topics.questionsList); // 与该话题相关的问题列表
  /* ----------------------> 【话题】 end! <---------------------- */


  /* ----------------------> 【问题】 start <---------------------- */
  // questions 增删改查
  router.get('/api/v1/questions', controller.questions.list); // 问题列表
  router.get('/api/v1/questions/:id', controller.questions.detail); // 问题详情
  router.post('/api/v1/questions', auth, controller.questions.create); // 创建问题
  router.patch('/api/v1/questions/:id', auth, check.questionExist, controller.questions.patch); // 修改问题
  router.delete('/api/v1/questions/:id', auth, check.questionExist, controller.questions.del); // 删除问题

  // questions - 问题的相关操作
  router.put('/api/v1/questions/following/:id', auth, check.questionExist, controller.questions.follow); // 关注问题
  router.delete('/api/v1/questions/following/:id', auth, check.questionExist, controller.questions.unfollow); // 取消关注问题
  router.get('/api/v1/questions/:id/followers', check.questionExist, controller.questions.followersList); // 关注该问题的用户列表

  router.put('/api/v1/questions/favoring/:id', auth, check.questionExist, controller.questions.favor); // 点赞
  router.delete('/api/v1/questions/favoring/:id', auth, check.questionExist, controller.questions.unfavor); // 取消点赞
  router.get('/api/v1/questions/:id/favoring', check.questionExist, controller.questions.favorList); // 点赞该问题的用户列表

  router.put('/api/v1/questions/collecting/:id', auth, check.questionExist, controller.questions.collect); // 收藏
  router.delete('/api/v1/questions/collecting/:id', auth, check.questionExist, controller.questions.uncollect); // 取消收藏
  router.get('/api/v1/questions/:id/collecting', check.questionExist, controller.questions.collectList); // 收藏该问题的用户列表
  /* ----------------------> 【问题】 end! <---------------------- */

  /* ----------------------> 【回答】 start <---------------------- */
  // answers 增删改查
  router.get('/api/v1/questions/:question_id/answers', controller.answers.list); // 问题的回答列表
  router.get('/api/v1/questions/:question_id/answers/:id', controller.answers.detail); // 回答详情
  router.post('/api/v1/questions/:question_id/answers/', auth, controller.answers.create); // 创建问题
  router.patch('/api/v1/questions/:question_id/answers/:id', auth, check.answerExist, controller.answers.patch); // 修改回答
  router.delete('/api/v1/questions/:question_id/answers/:id', auth, check.answerExist, controller.answers.del); // 删除回答

  // answers - 回答的相关操作
  router.put('/api/v1/answers/favoring/:id', auth, check.answerExist, controller.answers.favor); // 点赞
  router.delete('/api/v1/answers/favoring/:id', auth, check.answerExist, controller.answers.unfavor); // 取消点赞
  router.get('/api/v1/answers/:id/favoring', check.answerExist, controller.answers.favorList); // 点赞该回答的用户列表

  router.put('/api/v1/answers/collecting/:id', auth, check.answerExist, controller.answers.collect); // 收藏
  router.delete('/api/v1/answers/collecting/:id', auth, check.answerExist, controller.answers.uncollect); // 取消收藏
  router.get('/api/v1/answers/:id/collecting', check.answerExist, controller.answers.collectList); // 收藏该回答的用户列表
  /* ----------------------> 【回答】 end! <---------------------- */

  /* ----------------------> 【评论】 start <---------------------- */

  // comments
  router.get('/api/v1/comments', controller.comments.list); // 所有评论
  router.get('/api/v1/comments/:comment_id', controller.comments.detail); // 评论详情
  router.delete('/api/v1/comments/:comment_id', auth, check.commentExist, controller.comments.del); // 删除评论 - 管理员操作
  router.get('/api/v1/comments/:comment_id/replys', controller.comments.replyList); // 评论的回复列表

  // comments 图片、文章的评论，example: router.get('/api/v1/photos/5dba799cec66a86c800e5de3/comments', controller.comments.list); // 评论列表
  router.get('/api/v1/:category/:detail_id/comments', controller.comments.list); // 评论列表
  router.get('/api/v1/:category/:detail_id/comments/:comment_id', controller.comments.detail); // 评论详情
  router.get('/api/v1/:category/:detail_id/comments/:comment_id/state', controller.comments.state); // 评论状态
  router.post('/api/v1/:category/:detail_id/comments', auth, controller.comments.create); // 创建评论
  router.patch('/api/v1/:category/:detail_id/comments/:comment_id', auth, check.commentExist, controller.comments.patch); // 修改评论
  router.delete('/api/v1/:category/:detail_id/comments/:comment_id', auth, check.commentExist, controller.comments.del); // 删除评论
  router.post('/api/v1/:category/:detail_id/comments/:comment_id/reply', controller.comments.reply); // 回复评论

  // comments - 评论的相关操作
  router.put('/api/v1/:category/:detail_id/comments/favoring/:comment_id', auth, check.commentExist, controller.comments.favor); // 点赞
  router.delete('/api/v1/:category/:detail_id/comments/favoring/:comment_id', auth, check.commentExist, controller.comments.unfavor); // 取消点赞
  router.get('/api/v1/:category/:detail_id/comments/:comment_id/favoring', check.commentExist, controller.comments.favorList); // 点赞该评论的用户列表
  /* ----------------------> 【评论】 end! <---------------------- */

  /* ----------------------> 【圈子】 start <---------------------- */
  // cricles 增删改查
  router.get('/api/v1/circles', controller.circles.list); // 列表
  router.get('/api/v1/circles/:id', check.circleExist, controller.circles.detail); // 详情
  router.post('/api/v1/circles', auth, controller.circles.create); // 创建
  router.patch('/api/v1/circles/:id', auth, check.circleExist, controller.circles.patch); // 修改
  router.delete('/api/v1/circles/:id', auth, check.circleExist, controller.circles.del); // 删除

  // cricles - 圈子的相关操作
  router.put('/api/v1/circles/join/:id', auth, check.circleExist, controller.circles.join); // 加入
  router.post('/api/v1/circles/audit/:id', auth, check.circleExist, controller.circles.auditJoin); // 审核加入
  router.delete('/api/v1/circles/exit/:id', auth, check.circleExist, controller.circles.exit); // 退出
  router.get('/api/v1/circles/:id/members', check.circleExist, controller.circles.membersList); // 成员列表
  /* ----------------------> 【圈子】 end! <---------------------- */


  /* ----------------------> 【OSS】 start <---------------------- */
  router.post('/api/v1/oss/token', auth, controller.oss.token); // oss授权
  /* ----------------------> 【OSS】 end! <---------------------- */

  // role 角色
  // router.post('/api/role', controller.role.create);
  // router.delete('/api/role/:id', controller.role.destroy);
  // router.put('/api/role/:id', controller.role.update);
  // router.get('/api/role/:id', controller.role.show);
  // router.get('/api/role', controller.role.index);
  router.delete('/api/v1/role', controller.role.removes);
  router.resources('Role', '/api/v1/role', controller.role);

  // upload 上传
  router.post('/api/v1/upload', controller.upload.create);
  router.post('/api/v1/upload/url', controller.upload.url);
  router.post('/api/v1/uploads', controller.upload.multiple);
  router.delete('/api/v1/upload/:id', controller.upload.destroy);
  // router.put('/api/upload/:id', controller.upload.update)
  router.post('/api/v1/upload/:id', controller.upload.update); // Ant Design Pro
  router.put('/api/v1/upload/:id/extra', controller.upload.extra);
  router.get('/api/v1/upload/:id', controller.upload.show);
  router.get('/api/v1/upload', controller.upload.index);
  router.delete('/api/v1/upload', controller.upload.removes);
  // router.resources('upload', '/api/upload', controller.upload)
};
