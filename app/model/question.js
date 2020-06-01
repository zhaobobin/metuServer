// app/model/question.js
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.Types.ObjectId;

  const QuestionSchema = new Schema(
    {
      __v: { type: Number, select: false },
      title: { type: String, required: true }, // 标题
      content: { type: String, select: false }, // 内容
      description: { type: String, select: false }, // 描述
      thumb: { type: String, select: false }, // 缩略图
      topics: { type: [{ type: ObjectId, ref: 'Topic' }] }, // 相关话题

      author: { type: ObjectId, ref: 'User', required: true }, // 提问者
      answers: { type: [{ type: ObjectId, ref: 'User' }], select: false }, // 回答者

      view_number: { type: Number, default: 0 }, // 访问数量
      answer_number: { type: Number, default: 0 }, // 被回答数量
      follow_number: { type: Number, default: 0 }, // 被关注数量
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
  QuestionSchema.statics.list = async function(query) {
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1); // 每页数量
    let sort = query.sort ? query.sort : { _id: -1 };
    // 查询条件
    const _filter = {
      title: new RegExp(query.q),
    };
    if(query.category){
      switch(query.category) {
        case 'popular': sort = { view_number: -1 }; break;
        case 'new': sort = { create_at: -1 }; break;
        case 'waiting': _filter.answer_number = 0; break;
        default: break;
      }
    }
    const count = await this.count(_filter);
    const list = await this.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .populate('author topics')
      .exec();
    const hasMore = list.length === perPage;
    return { list, count, hasMore };
  };

  // 详情
  QuestionSchema.statics.detail = async function({ id, select, populate }) {
    return await this.findById(id).select(select).populate(populate);
  };

  // 创建
  QuestionSchema.statics.add = async function(ctx) {
    const createTopic = new this(ctx.request.body);
    createTopic.author = ctx.state.user._id;
    return await createTopic.save();
  };

  // 修改
  QuestionSchema.statics.update = async function(id, data) {
    return await this.findByIdAndUpdate(id, data, { new: true });
  };

  // 删除
  QuestionSchema.statics.del = async function(id) {
    return await this.findByIdAndRemove(id);
  };

  return mongoose.model('Question', QuestionSchema);
};
