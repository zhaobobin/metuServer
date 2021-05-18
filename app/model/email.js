// app/model/email.js
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.Types.ObjectId;

  const EmailSchema = new Schema(
    {
      __v: { type: Number, select: false },
      user: { type: ObjectId, ref: 'User', required: true }, // 用户
      email: { type: String }, // 用户邮箱
      type: { type: String }, // 类型：change
      content: { type: String }, // 内容 富文本
      code: { type: String }, // 验证码
      
      status: { type: Number, default: 1, enum: [ 0, 1 ] }, // 状态
      
    },
    {
      timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
    }
  );

  /* --------------------> 扩展方法 <-------------------- */

  // 列表 - 支持多条件筛选查询
  EmailSchema.statics.list = async function(query) {

    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: -1 };

    const _filter = {
      content: new RegExp(query.q)
    };
    if (query.type) _filter.type = query.type;
    if (query.status) _filter.status = query.status;

    const count = await this.countDocuments(_filter);
    const list = await this.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
    
  };

  // 详情
  EmailSchema.statics.detail = async function({ id, select, populate }) {
    return await this.findById(id).select(select).populate(populate);
  };

  // 创建
  EmailSchema.statics.add = async function(body) {
    const createEmail = new this(body);
    return await createEmail.save();
  };

  // 删除
  EmailSchema.statics.del = async function(id) {
    return await this.findByIdAndRemove(id);
  };

  return mongoose.model('Email', EmailSchema);
};
