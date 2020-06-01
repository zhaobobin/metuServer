// app/model/article.js
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.Types.ObjectId;

  const ArticleSchema = new Schema(
    {
      __v: { type: Number, select: false },
      title: { type: String, required: true }, // 标题
      description: { type: String, select: false }, // 描述
      author: { type: ObjectId, ref: 'User', required: true }, // 作者
      
      content: { type: String, select: false }, // 内容
      thumb: { type: String }, // 缩略图路径
      tags: { type: String, select: false }, // 相关标签

      allow_comment: { type: Number, default: 1 }, // 允许评论

      view_number: { type: Number, default: 0 }, // 访问数量
      comment_number: { type: Number, default: 0 }, // 评论数量
      favor_number: { type: Number, default: 0 }, // 被点赞数量
      collect_number: { type: Number, default: 0 }, // 被收藏数量

      status: { type: Number, default: 1, enum: [ 0, 1 ] }, // 状态
    },
    {
      timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
    }
  );

  /* --------------------> 扩展方法 <-------------------- */

  // 列表 - 支持多条件筛选查询
  ArticleSchema.statics.list = async function(query) {
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: -1 };
    // 查询条件
    const _filter = {
      title: new RegExp(query.q),
      status: 1,
    };
    if (query.author) _filter.author = query.author;
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
      .populate('author')
      .exec();
    const hasMore = list.length === perPage;
    return { list, count, hasMore };
  };

  // 详情 - 更新访问数量
  ArticleSchema.statics.detail = async function({ id, select, populate }) {
    return await this.findByIdAndUpdate(id, { $inc: { view_number: +1 } }, { new: true })
      .select(select)
      .populate(populate);
  };

  // 创建
  ArticleSchema.statics.add = async function(ctx) {
    const createArticle = new this(ctx.request.body);
    createArticle.author = ctx.state.user._id;
    return await createArticle.save();
  };

  // 修改
  ArticleSchema.statics.update = async function(id, data) {
    return await this.findByIdAndUpdate(id, data, { new: true });
  };

  // 删除
  ArticleSchema.statics.del = async function(id) {
    return await this.findByIdAndRemove(id);
  };

  return mongoose.model('Article', ArticleSchema);
};
