// app/service/pagination.js 分页
'use strict';

const Service = require('egg').Service;

class PaginationService extends Service {

  async array(list) {
    const { ctx } = this;
    const query = ctx.query;
    const { per_page = 10 } = query,
      page = Math.max(query.page * 1, 1) - 1, // 页数
      perPage = Math.max(per_page, 1), // 每页数量
      sort = query.sort ? query.sort : { _id: 1 };
    return await list.skip(page * perPage).limit(perPage).sort(sort);
  }

}

module.exports = PaginationService;
