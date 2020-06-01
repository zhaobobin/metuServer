// app/model/comment.js
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.Types.ObjectId;

  const CommentSchema = new Schema(
    {
      __v: { type: Number, select: false },
      content: { type: String, required: true }, // 内容

      author: { type: ObjectId, ref: 'User', required: true }, // 评论者
      root_comment_id: { type: String }, // 根评论id - 从属的评论
      reply_to: { type: ObjectId, ref: 'User' }, // 回复给谁

      article_id: { type: ObjectId, ref: 'Article' }, // 从属文章
      photo_id: { type: ObjectId, ref: 'Photo' }, // 从属图片
      question_id: { type: ObjectId, ref: 'Question' }, // 从属问题
      answer_id: { type: ObjectId, ref: 'Answer' }, // 从属回答

      favor_number: { type: Number, default: 0 }, // 被点赞数量

      status: { type: Number, default: 1, enum: [ 0, 1 ] }, // 状态
      
    },
    {
      timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
    }
  );

  /* --------------------> 扩展方法 <-------------------- */

  /**
   * 列表 - 支持多条件筛选查询
   * category [String] 分类: articles、photos、questions、answers
   * cid [String] 内容ID
   * query [String] 查询参数: root_comment_id(根评论id)
   */
  CommentSchema.statics.list = async function(params, query) {
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1); // 每页数量
    let sort = query.sort ? query.sort : { _id: -1 };
    const _filter = {
      content: new RegExp(query.q), // 正则匹配内容
    };
    if(query.root_comment_id) _filter.root_comment_id = query.root_comment_id;  // 查找相关二级评论
    switch(params.category){
      case 'articles': _filter.article_id = params.detail_id; break;
      case 'photos': _filter.photo_id = params.detail_id; break;
      case 'questions': _filter.question_id = params.detail_id; break;
      case 'answers': _filter.answer_id = params.detail_id; break;
      default: break;
    }
    const count = await this.count(_filter);
    const list = await this.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .populate("author reply_to")
      .lean()
      .exec();
    return { list, count };
  };

  // 详情
  CommentSchema.statics.detail = async function({ id, select, populate }) {
    return await this.findById(id)
      .select(select)
      .populate(populate);
  };

  // 创建
  CommentSchema.statics.add = async function(ctx) {
    const comment = new this(ctx.request.body);
    comment.author = ctx.state.user._id;
    switch(ctx.params.category){
      case 'articles': comment.article_id = ctx.params.detail_id; break;
      case 'photos': comment.photo_id = ctx.params.detail_id; break;
      case 'questions': comment.question_id = ctx.params.detail_id; break;
      case 'answers': comment.answer_id = ctx.params.detail_id; break;
      default: break;
    }
    return await comment.save();
  };

  // 修改
  CommentSchema.statics.update = async function(id, data) {
    return await this.findByIdAndUpdate(id, data, { new: true });
  };

  // 删除
  CommentSchema.statics.del = async function(id) {
    return await this.findByIdAndRemove(id);
  };

  return mongoose.model('Comment', CommentSchema);
};
