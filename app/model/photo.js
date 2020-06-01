// app/model/photo.js 作品
'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ObjectId = Schema.Types.ObjectId;

  const PhotoSchema = new Schema(
    {
      __v: { type: Number, select: false },

      title: { type: String, required: true }, // 标题
      description: { type: String, select: false }, // 描述
      author: { type: ObjectId, ref: 'User', required: true }, // 作者

      images: { type: [{ type: ObjectId, ref: 'Image' }], select: false }, // 图片列表
      thumb: { type: Object }, // 缩略图：路径、宽度、高度

      tags: { type: String, select: false }, // 相关标签

      view_number: { type: Number, default: 0 }, // 访问数量
      favor_number: { type: Number, default: 0 }, // 被点赞数量
      collect_number: { type: Number, default: 0 }, // 被收藏数量
      comment_number: { type: Number, default: 0 }, // 被评论数量

      editor: { type: Number, default: 0, enum: [ 0, 1 ] },								// 编辑推荐
      status: { type: Number, default: 1, enum: [ 0, 1 ] },								// 审核状态，1为通过、0为拒绝。
    },
    {
      timestamps: { createdAt: 'create_at', updatedAt: 'update_at' },
    }
  );

  /* --------------------> 扩展方法 <-------------------- */

  // 列表 - 支持多条件筛选查询 query: q - 匹配标题、filter - 筛选
  PhotoSchema.statics.list = async function(query) {
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1); // 每页数量
    let sort = query.sort ? query.sort : { _id: -1 };
    // 查询条件
    const _filter = {
      title: new RegExp(query.q),
      status: 1,
    };
    if(query.category){
      switch(query.category) {
        case 'editor': _filter.editor = 1; break;
        case 'popular': sort = { view_number: -1 }; break;
        case 'new': sort = { create_at: -1 }; break;
        default: _filter.tags = query.category; break;
      }
    }
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
  PhotoSchema.statics.detail = async function({ id, select, populate }) {
    return await this.findByIdAndUpdate(id, { $inc: { view_number: +1 } }, { new: true })
      .select(select)
      .populate({ path: populate, select: '+description +exif +tags +camera +lens +exposure' })
      .lean();
  };

  // 创建
  PhotoSchema.statics.add = async function(ctx) {
    const createPhoto = new this(ctx.request.body);
    createPhoto.author = ctx.state.user._id;
    return await createPhoto.save();
  };

  // 修改
  PhotoSchema.statics.update = async function(id, data) {
    return await this.findByIdAndUpdate(id, data, { new: true });
  };

  // 删除
  PhotoSchema.statics.del = async function(id) {
    return await this.findByIdAndRemove(id);
  };

  return mongoose.model('Photo', PhotoSchema);
};
