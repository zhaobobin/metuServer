// app/model/user.js
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.Types.ObjectId;

  const UserSchema = new Schema(
    {
      __v: { type: Number, select: false },

      /* 基本信息 */
      mobile: { type: String, required: true, unique: true, select: false },													// 手机
      password: { type: String, required: true, select: false }, // 密码
      username: { type: String, required: true },												// 用户名
      nickname: { type: String, required: true, unique: true },												// 昵称 - 不能重复

      /* 用户状态 */
      type: { type: String, default: 'user' }, // 用户类型 - 管理员、用户
      level: { type: Number, default: 0 }, // 用户等级
      point: { type: Number, default: 0 }, // 用户积分
      status: { type: Number, default: 1, enum: [ 0, 1 ] },								// 审核状态，1为通过、0为拒绝。

      /* 详细信息 */
      realname: { type: String, select: false },												// 真实姓名
      avatar_url: { type: String },                                     // 头像路径
      cover_url: { type: String },													            // 用户主页头图
      gender: { type: String, select: false },													// 性别 0、1、2
      birthday: { type: Date, select: false },													// 生日 - Moment对象
      professional: { type: String, select: false },													// 职业
      blog: { type: String, select: false },												// 个人主页 默认自动生成
      headline: { type: String, select: false },											// 一句话简介
      city: { type: ObjectId, ref: 'Topic', select: false },							// 城市
      location: { type: String, select: false },							            // 所在地区
      tags: { type: [{ type: ObjectId, ref: 'Topic' }], select: false }, // 标签(爱好) - 对应话题模型

      /* 通讯信息 */
      address: { type: String, select: false },												// 通讯地址
      zipcode: { type: String, select: false },												// 邮编
      email: { type: String, select: false },													// 邮箱
      email_auth: { type: Number, default: 0, select: false },					// 邮箱验证
      prefix: { type: String, select: false },													// 手机区号
      idcard: { type: String, select: false },														// 身份证号
      qq: { type: String, select: false },															// QQ号

      wechat_openid: { type: String, select: false },											// 微信，保存用户openid，与wechat模型进行匹配
      weibo_uid: { type: String, select: false },												// 微博，保存用户id，与weibo模型进行匹配
      qq_openid: { type: String, select: false },												// QQ，保存用户openid，与qq模型进行匹配

      /* 用户的关注 */
      following: { type: [{ type: ObjectId, ref: 'User' }], select: false }, // 关注的用户
      followers: { type: [{ type: ObjectId, ref: 'User' }], select: false }, // 用户的粉丝
      following_number: { type: Number, default: 0, select: false }, // 关注的人数
      followers_number: { type: Number, default: 0, select: false }, // 粉丝数

      following_photos: { type: [{ type: ObjectId, ref: 'Photo' }], select: false }, // 关注的图片
      following_articles: { type: [{ type: ObjectId, ref: 'Article' }], select: false }, // 关注的文章
      following_questions: { type: [{ type: ObjectId, ref: 'Question' }], select: false }, // 关注的问题
      following_answers: { type: [{ type: ObjectId, ref: 'Answer' }], select: false }, // 关注的回答
      following_topics: { type: [{ type: ObjectId, ref: 'Topic' }], select: false }, // 关注的话题
      following_circles: { type: [{ type: ObjectId, ref: 'Circle' }], select: false }, // 关注(加入)的圈子

      /* 用户的点赞 */
      favoring_photos: { type: [{ type: ObjectId, ref: 'Photo' }], select: false }, // 点赞的图片
      favoring_articles: { type: [{ type: ObjectId, ref: 'Article' }], select: false }, // 点赞的文章
      favoring_questions: { type: [{ type: ObjectId, ref: 'Question' }], select: false }, // 点赞的问题
      favoring_answers: { type: [{ type: ObjectId, ref: 'Answer' }], select: false }, // 点赞的回答
      favoring_comments: { type: [{ type: ObjectId, ref: 'Comment' }], select: false }, // 点赞的评论

      /* 用户的收藏 */
      collecting_photos: { type: [{ type: ObjectId, ref: 'Photo' }], select: false }, // 收藏的图片
      collecting_articles: { type: [{ type: ObjectId, ref: 'Article' }], select: false }, // 收藏的文章
      collecting_questions: { type: [{ type: ObjectId, ref: 'Question' }], select: false }, // 收藏的问题
      collecting_answers: { type: [{ type: ObjectId, ref: 'Answer' }], select: false }, // 收藏的回答

    },
    {
      timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
    }
  );

  /* --------------------> 扩展方法 <-------------------- */

  // 列表 - 支持多条件筛选查询
  UserSchema.statics.list = async function(query) {

    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: -1 };
    // 查询条件
    const _filter = {
      username: new RegExp(query.q),
    };

    if (query.type) _filter.type = query.type;
    if (query.status) _filter.status = query.status;
    if (query.startTime && query.endTime) {
      _filter.createTime = {
        $gte: query.startTime,
        $lt: query.endTime,
      };
    } else if (query.startTime && !query.endTime) {
      _filter.createTime = {
        $gte: query.startTime,
      };
    } else if (!query.startTime && query.endTime) {
      _filter.createTime = {
        $lt: query.endTime,
      };
    }

    const count = await this.count(_filter);
    const list = await this.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  };

  // 查询字段映射 - ObjectId对应的数据列表
  UserSchema.statics.queryFieldList = async function({ id, query, field }) {
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    return await this.findById(id)
      .select(field)
      .populate(field)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
  };

  // 详情 by id
  UserSchema.statics.detail = async function({ id, select, populate }) {
    return await this.findById(id).select(select).populate(populate).lean().exec();
  };

  // 详情 by username
  UserSchema.statics.findByName = async function({ username, select, populate }) {
    return await this.findOne({ username }).select(select).populate(populate).lean().exec();
  };

  // 创建
  UserSchema.statics.add = async function(ctx) {
    const body = ctx.request.body;
    const filterTel = ctx.helper.filterTel(body.mobile);
    const createUser = new this(body);
    createUser.password = await ctx.genHash(body.password || '111111'); // 生成密码
    const reg = new RegExp("[\\u4E00-\\u9FFF]+", "g");
    if (reg.test(createUser.nickname)) {
      createUser.username = 'metu_' + filterTel; // 生成用户名
    } else {
      createUser.username = createUser.nickname;
    }
    const res = await createUser.save();
    return {
      _id: res._id,
      mobile: filterTel,
      username: res.username,
      nickname: res.nickname,
      type: res.type,
    };
  };

  // 修改
  UserSchema.statics.update = async function(id, data) {
    let select = '';
    for(let i in data){
      select += '+' + i + ' ';
    }
    return await this.findByIdAndUpdate(id, data, { new: true }).select(select);
  };

  // 删除
  UserSchema.statics.del = async function(id) {
    return await this.findByIdAndRemove(id);
  };

  return mongoose.model('User', UserSchema);
};
