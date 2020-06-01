// app/model/topic.js
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.Types.ObjectId;

  const TopicSchema = new Schema(
    {
      __v: { type: Number, select: false },
      name: { type: String, required: true }, // 话题名称
      avatar_url: { type: String }, // 话题图标
      introduction: { type: String, select: false }, // 话题简介

      parent_topic: { type: [{ type: ObjectId, ref: 'Topic' }], select: false }, // 父话题
      children_topic: { type: [{ type: ObjectId, ref: 'Topic' }], select: false }, // 子话题

      follow_number: { type: Number, default: 0 }, // 被关注数量
    },
    {
      timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
    }
  );

  /* --------------------> 扩展方法 <-------------------- */

  // 列表 - 支持多条件筛选查询
  TopicSchema.statics.list = async function(query) {
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: -1 };

    // 查询条件
    const _filter = {
      name: new RegExp(query.q),
    };
    if (query.type) _filter.type = query.type;

    // 时间筛选
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

  // 详情
  TopicSchema.statics.detail = async function({ id, select }) {
    return await this.findById(id).select(select).populate('parent_topic children_topic');
  };

  // 创建
  TopicSchema.statics.add = async function(body) {
    const createTopic = new this(body);
    return await createTopic.save();
  };

  // 修改
  TopicSchema.statics.update = async function(id, data) {
    return await this.findByIdAndUpdate(id, data, { new: true });
  };

  // 删除
  TopicSchema.statics.del = async function(id) {
    return await this.findByIdAndRemove(id);
  };

  return mongoose.model('Topic', TopicSchema);
};
