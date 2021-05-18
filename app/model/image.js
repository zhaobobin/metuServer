// app/model/image.js 图片 - 添加影集时单独存储图片的相关数据
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.Types.ObjectId;

  const ImageSchema = new Schema(
    {
      __v: { type: Number, select: false },

      title: { type: String, required: true }, // 标题
      description: { type: String, select: false }, // 描述
      author: { type: ObjectId, ref: 'User', required: true }, // 作者

      url: { type: String }, // 图片路径
      tags: { type: String, select: false }, // 相关标签

      width: { type: Number },
      height: { type: Number },

      exif: { type: String, select: false }, // 内容
      camera: { type: Object, select: false }, // 相机
      lens: { type: Object, select: false }, // 镜头
      exposure: { type: Object, select: false }, // 光圈

      view_number: { type: Number, default: 0, select: false }, // 访问数量
      favor_number: { type: Number, default: 0, select: false }, // 被点赞数量
      collect_number: { type: Number, default: 0, select: false }, // 被收藏数量

      status: { type: Number, default: 1, enum: [ 0, 1 ] },								// 审核状态，1为通过、0为拒绝。
    },
    {
      timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
    }
  );

  /* --------------------> 扩展方法 <-------------------- */

  // 列表 - 支持多条件筛选查询
  ImageSchema.statics.list = async function(query) {
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
    const count = await this.countDocuments(_filter);
    const list = await this.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    return { list, count };
  };

  // 详情 - 更新访问数量
  ImageSchema.statics.detail = async function({ id, select, populate }) {
    return await this.findByIdAndUpdate(id, { $inc: { view_number: +1 } }, { new: true })
      .select(select)
      .populate(populate)
      .lean();
  };

  // 创建 - 批量添加，返回ids数组
  ImageSchema.statics.add = async function(ctx) {
    const images = ctx.request.body.images;
    for(let i in images){
      images[i].author = ctx.state.user._id;
    }
    const res = await this.insertMany(images)
    let ids = [];
    for(let i in res){
      if(res[i]) ids.push(res[i]._id)
    }
    return ids
  };

  // 修改
  ImageSchema.statics.update = async function(id, data) {
    return await this.findByIdAndUpdate(id, data, { new: true });
  };

  // 删除
  ImageSchema.statics.del = async function(id) {
    return await this.findByIdAndRemove(id);
  };

  return mongoose.model('Image', ImageSchema);
};
