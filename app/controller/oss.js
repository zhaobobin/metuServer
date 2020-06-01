// app/controller/oss.js
'use strict';

const Controller = require('egg').Controller;

const OSS = require('ali-oss');
const STS = OSS.STS;
const aliConfig = require('../../config/aliConfig');

class OssController extends Controller {

  // 授权oss编辑权限 生成临时token
  async token() {

    const { ctx } = this;

    // 子账号授权
    const sts = new STS({
      accessKeyId: aliConfig.accessKeyId,
      accessKeySecret: aliConfig.accessKeySecret
    });

    // 角色信息
    const policy = aliConfig.oss.policy;

    const config = {
      RoleArn: aliConfig.oss.role,							// 表示的是需要扮演的角色ID
      DurationSeconds: 60 * 60,								//  指的是临时凭证的有效期，单位是s，最小为900，最大为3600。
      RoleSessionName: 'ossEdit'								// 是一个用来标示临时凭证的名称，一般来说建议使用不同的应用程序用户来区分。
    };

    const ossRole = await sts.assumeRole(config.RoleArn, policy, config.DurationSeconds, config.RoleSessionName);
    const ossToken = {
      credentials: ossRole.credentials,
      region: aliConfig.oss.region,
      bucket: aliConfig.oss.bucket
    }
    ctx.state.ossToken = ossToken;
    ctx.helper.success({ ctx, res: ossToken });
  }

}

module.exports = OssController;
