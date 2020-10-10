// app/service/photos.js
'use strict';

const Service = require('egg').Service;

class PhotoService extends Service {
  constructor(ctx) {
    super(ctx);
    this.rule = {
      create: {
        title: { type: 'string', required: true },
        description: { type: 'string', required: false },
        images: { type: 'array', required: true },
      },
      update: {
        title: { type: 'string', required: false },
        description: { type: 'string', required: false },
        images: { type: 'array', required: false },
      },
    };
  }

  // 列表
  async list() {
    const { ctx } = this;
    return await ctx.model.Photo.list(ctx.query);
  }

  // 首页banner
  async banner() {
    const { ctx } = this;
    const list = await ctx.model.Photo.find({ editor: 1 }).populate('author');
    const count = list.length;
    const index = this._randNum(0, count)
    return list[index]
  }

  // 首页轮播图
  async carsouel() {
    const { ctx } = this;
    return await ctx.model.Photo.find({ editor: 1 }).populate('author');
  }

  // 详情
  async detail(id) {
    const { ctx } = this;
    const photo = await ctx.model.Photo.detail({
      id: id || ctx.params.id,
      select: '+images +topics',
      populate: 'author images topics',
    });
    if (!photo) ctx.throw(404, { error_key: 'photo', message: '图片不存在' });
    // 查询当前用户的关注、点赞、收藏状态
    if(ctx.state.user) {
      const me = await ctx.model.User.findById(ctx.state.user._id).select('+following +favoring_photos +collecting_photos')
      if(me.following.map(id => id.toString()).includes(photo.author._id)) {
        photo.following_state = 1
      }
      if(me.favoring_photos.map(id => id.toString()).includes(ctx.params.id)) {
        photo.favoring_state = 1
      }
      if(me.collecting_photos.map(id => id.toString()).includes(ctx.params.id)) {
        photo.collecting_state = 1
      }
    }
    return photo;
  }

  // 状态
  async state() {
    const { ctx } = this;
    const photo = await ctx.model.Photo.detail({
      id: ctx.params.id,
      select: 'author view_number favor_number collect_number comment_number editor status',
      populate: '',
    });
    if (!photo) ctx.throw(404, { error_key: 'photo', message: '图片不存在' });
    // 查询当前用户的关注、点赞、收藏状态
    if(ctx.state.user) {
      const me = await ctx.model.User.findById(ctx.state.user._id).select('+following +favoring_photos +collecting_photos')
      if(me.following.map(id => id.toString()).includes(photo.author)) {
        photo.following_state = 1
      }
      if(me.favoring_photos.map(id => id.toString()).includes(ctx.params.id)) {
        photo.favoring_state = 1
      }
      if(me.collecting_photos.map(id => id.toString()).includes(ctx.params.id)) {
        photo.collecting_state = 1
      }
    }
    delete photo._id;
    delete photo.author;
    return photo;
  }

  // 上一组
  async prev() {
    const { ctx } = this;

    const list = await ctx.model.Photo.find({ _id: { $gt: ctx.params.id } }).sort({ _id: 1 }).limit(1);
    if (!list || list.length === 0) ctx.throw(404, { error_key: 'photo', message: '已经没有了' });

    return await this.detail(list[0]._id);
  }

  // 下一组
  async next() {
    const { ctx } = this;

    const list = await ctx.model.Photo.find({ _id: { $lt: ctx.params.id } }).sort({ _id: -1 }).limit(1);
    if (!list || list.length === 0) ctx.throw(404, { error_key: 'photo', message: '已经没有了' });

    return await this.detail(list[0]._id);
  }

  // 创建
  async create() {
    const { ctx } = this;
    ctx.validate(this.rule.create, ctx.request.body);
    const res = await ctx.model.Photo.findOne({ title: ctx.request.body.title });
    if (res) ctx.throw(409, { error_key: 'title', message: '标题已被占用' });

    // 保存图片
    let ids = [];
    const images = ctx.request.body.images;
    for(let i in images){
      if(images[i]._id){
        ids.push(images[i]._id)
      } else {
        images[i].author = ctx.state.user._id;
        const createImage = new ctx.model.Image(images[i]);
        const image = await createImage.save();
        ids.push(image._id)
      }
    }
    ctx.request.body.images = ids;

    if(!ctx.request.body.thumb) ctx.request.body.thumb = ctx.request.body.images[0].url;
    const photo = await ctx.model.Photo.add(ctx); // 保存作品
    if (!photo) ctx.throw(422, { error_key: 'photo', message: '图片创建失败' });
    return photo;
  }

  // 更新
  async update() {
    const { ctx } = this;
    ctx.validate(this.rule.update, ctx.request.body);
    const res = await ctx.model.Photo.update(ctx.params.id, ctx.request.body);
    if (!res) ctx.throw(404, { error_key: 'photo', message: '图片不存在' });
    return res;
  }

  // 删除
  async del() {
    const { ctx } = this;
    const res = await ctx.model.Photo.del(ctx.params.id);
    if (!res) ctx.throw(404, { error_key: 'photo', message: '图片不存在' });
    return res;
  }

  // 点赞图片
  async favor() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('favoring_photos');
    if (me.favoring_photos.map(id => id.toString()).includes(ctx.params.id)) ctx.throw(403, { error_key: 'photo', message: '不能重复点赞' });
    me.favoring_photos.push(ctx.params.id);
    me.save();
    const photo = await ctx.model.Photo.update(ctx.params.id, { $inc: { favor_number: 1 } }); // 点赞数+1
    await ctx.model.Message.add({
      type: 'favor',
      content: '点赞',
      send_from: ctx.state.user._id,
      send_to: photo.author,
      article: photo._id,
    });
    return photo;
  }
  // 取消点赞
  async unfavor() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('favoring_photos');
    const index = me.favoring_photos.map(id => id.toString()).indexOf(ctx.params.id);
    if (index < 0) ctx.throw(403, { error_key: 'photo', message: '不能重复取消' });
    me.favoring_photos.splice(index, 1);
    me.save();
    return await ctx.model.Photo.update(ctx.params.id, { $inc: { favor_number: -1 } }); // 点赞数-1
  }
  // 点赞该图片的用户
  async favorList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { favoring_photos: ctx.params.id };
    const count = await ctx.model.User.count(_filter);
    const list = await ctx.model.User.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    const hasMore = list.length === perPage;
    return { list, count, hasMore };
  }

  // 收藏图片
  async collect() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('collecting_photos');
    if (me.collecting_photos.map(id => id.toString()).includes(ctx.params.id)) ctx.throw(403, { error_key: 'photo', message: '不能重复收藏' });
    me.collecting_photos.push(ctx.params.id);
    me.save();
    const photo = await ctx.model.Photo.update(ctx.params.id, { $inc: { collect_number: 1 } }); // 收藏数+1
    await ctx.model.Message.add({
      type: 'collect',
      content: '收藏',
      send_from: ctx.state.user._id,
      send_to: photo.author,
      article: photo._id,
    });
    return photo;
  }
  // 取消收藏
  async uncollect() {
    const { ctx } = this;
    const me = await ctx.model.User.findById(ctx.state.user._id).select('collecting_photos');
    const index = me.collecting_photos.map(id => id.toString()).indexOf(ctx.params.id);
    if (index < 0) ctx.throw(403, { error_key: 'photo', message: '不能重复取消' });
    me.collecting_photos.splice(index, 1);
    me.save();
    return await ctx.model.Photo.update(ctx.params.id, { $inc: { collect_number: -1 } }); // 点赞数-1
  }
  // 收藏该图片的用户
  async collectList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { collecting_photos: ctx.params.id };
    const count = await ctx.model.User.count(_filter);
    const list = await ctx.model.User.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .exec();
    const hasMore = list.length === perPage;
    return { list, count, hasMore };
  }

  // 图片相关的评论列表
  async commentList() {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    const _filter = { photo_id: ctx.params.id };
    const count = await ctx.model.Comment.count(_filter);
    const list = await ctx.model.Comment.find(_filter)
      .skip(page * perPage)
      .limit(perPage)
      .sort(sort)
      .populate('author')
      .exec();
    const hasMore = list.length === perPage;
    return { list, count, hasMore };
  }

  async commentDetail() {
    const { ctx } = this;
    const res = await ctx.model.Comment.detail({
      id: ctx.params.comment_id,
      select: '',
      populate: 'author photo_id',
    });
    if (!res) ctx.throw(404, { error_key: 'comment', message: '评论不存在' });
    return res;
  }

  _randNum(minnum, maxnum){
    return Math.floor(minnum + Math.random() * (maxnum - minnum));
  }

}

module.exports = PhotoService;
