// app/model/circle.js
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.Types.ObjectId;

  const CircleSchema = new Schema(
    {
      __v: { type: Number, select: false },
      name: { type: String, required: true }, // 圈子名称
      avatar_url: { type: String }, // 圈子图标
      description: { type: String }, // 圈子描述

      admin: { type: ObjectId, ref: 'User', select: false }, // 管理者
      audit: { type: [{ type: ObjectId, ref: 'User' }], select: false }, // 待审核成员 - 通过后正式加入圈子
      require_audit: { type: Boolean, default: 0 }, // 需要审核

      activitys: { type: [{ type: ObjectId, ref: 'Activity' }], select: false }, // 活动
      photos: { type: [{ type: ObjectId, ref: 'Photo' }], select: false }, // 影集

      member_number: { type: Number, default: 0 },  // 成员数量
      activity_number: { type: Number, default: 0 },  // 活动数量
      photo_number: { type: Number, default: 0 },  // 影集数量

      status: { type: Number, default: 1, enum: [ 0, 1 ] },								// 审核状态，1为通过、0为拒绝。

    },
    {
      timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
    }
  );

  /* --------------------> 扩展方法 <-------------------- */

  // 列表 - 支持多条件筛选查询
  CircleSchema.statics.list = async function(query) {
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: -1 };

    // 查询条件
    const _filter = {
      name: new RegExp(query.q),
      status: 1,
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
    const count = await this.countDocuments(_filter);
    const list = await this.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  };

  // 详情
  CircleSchema.statics.detail = async function({ id, select }) {
    return await this.findById(id).select(select).lean();
  };

  // 创建
  CircleSchema.statics.add = async function(ctx) {
    const createCircle = new this(ctx.request.body);
    createCircle.admin = ctx.state.user._id;
    return await createCircle.save();
  };

  // 修改
  CircleSchema.statics.update = async function(id, data) {
    return await this.findByIdAndUpdate(id, data, { new: true });
  };

  // 删除
  CircleSchema.statics.del = async function(id) {
    return await this.findByIdAndRemove(id);
  };

  return mongoose.model('Circle', CircleSchema);
};
