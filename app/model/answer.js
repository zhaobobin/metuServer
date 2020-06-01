// app/model/answer.js
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.Types.ObjectId;

  const AnswerSchema = new Schema(
    {
      __v: { type: Number, select: false },
      content: { type: String, required: true }, // 内容
      answerer: { type: ObjectId, ref: 'User', required: true }, // 回答者
      question_id: { type: String, required: true }, // 从属问题

      view_number: { type: Number, default: 0 }, // 访问数量
      favor_number: { type: Number, default: 0 }, // 点赞数量
      collect_number: { type: Number, default: 0 }, // 收藏数量

      status: { type: Number, default: 1, enum: [ 0, 1 ] }, // 状态
      
    },
    {
      timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
    }
  );

  /* --------------------> 扩展方法 <-------------------- */

  // 列表 - 支持多条件筛选查询
  AnswerSchema.statics.list = async function(questionId, query) {
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: -1 };
    const _filter = {
      questionId,
      content: new RegExp(query.q), // 正则匹配内容
    };
    const count = await this.count(_filter);
    const list = await this.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  };

  // 详情
  AnswerSchema.statics.detail = async function({ id, select, populate }) {
    return await this.findById(id).select(select).populate(populate);
  };

  // 创建
  AnswerSchema.statics.add = async function(ctx) {
    const createTopic = new this(ctx.request.body);
    createTopic.answerer = ctx.state.user._id;
    createTopic.question_id = ctx.params.question_id;
    return await createTopic.save();
  };

  // 修改
  AnswerSchema.statics.update = async function(id, data) {
    return await this.findByIdAndUpdate(id, data, { new: true });
  };

  // 删除
  AnswerSchema.statics.del = async function(id) {
    return await this.findByIdAndRemove(id);
  };

  return mongoose.model('Answer', AnswerSchema);
};
