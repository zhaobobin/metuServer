// app/model/message.js
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.Types.ObjectId;

  const MessageSchema = new Schema(
    {
      __v: { type: Number, select: false },
      content: { type: String, required: true }, // 内容
      type: { type: String, required: true }, // 类型：favor、follow、comment、collect
      send_from: { type: ObjectId, ref: 'User', required: true }, // 发送者
      send_to: { type: ObjectId, ref: 'User', required: true }, // 接收者

      article: { type: ObjectId, ref: 'Article' },
      photo: { type: ObjectId, ref: 'Photo' },
      comment: { type: ObjectId, ref: 'Comment' },
      topic: { type: ObjectId, ref: 'Topic' },
      question: { type: ObjectId, ref: 'Question' },
      answer: { type: ObjectId, ref: 'Answer' },
      
      readed: { type: Number, default: 0, enum: [ 0, 1 ] }, // 已读
      status: { type: Number, default: 1, enum: [ 0, 1 ] }, // 状态
      
    },
    {
      timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
    }
  );

  /* --------------------> 扩展方法 <-------------------- */

  // 列表 - 支持多条件筛选查询
  MessageSchema.statics.list = async function(query) {

    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: -1 };
    const _filter = {
      content: new RegExp(query.q), // 正则匹配内容
    };
    if (query.type) _filter.type = query.type;
    if (query.send_from) _filter.send_from = query.send_from;
    if (query.send_to) _filter.send_to = query.send_to;
    if (query.status) _filter.status = query.status;
    let populate = '';
    switch(query.type) {
      case 'favor': populate = 'send_from send_to article photo comment question answer'; break;
      case 'follow': populate = 'send_from send_to topic'; break;
      case 'comment': populate = 'send_from send_to article photo'; break;
      case 'collect': populate = 'send_from send_to article photo'; break;
      default: populate = 'send_from send_to'; break;
    }
    const count = await this.countDocuments(_filter);
    const list = await this.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .populate(populate)
      .exec();
    const hasMore = list.length === perPage;
    return { list, count, hasMore };
    
  };

  // 详情
  MessageSchema.statics.detail = async function({ id, select, populate }) {
    return await this.findByIdAndUpdate(id, { $inc: { readed: 1 } }, { new: true }) // 标记为已读
    .select(select)
    .populate(populate);
  };

  // 创建
  MessageSchema.statics.add = async function(body) {
    const createMessage = new this(body);
    return await createMessage.save();
  };

  // 修改
  MessageSchema.statics.update = async function(id, data) {
    return await this.findByIdAndUpdate(id, data, { new: true });
  };

  // 删除
  MessageSchema.statics.del = async function(id) {
    return await this.findByIdAndRemove(id);
  };

  return mongoose.model('Message', MessageSchema);
};
