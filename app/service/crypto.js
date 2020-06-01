/**
 * AES 加密、解密
 * app/service/crypto.js
 */
'use strict';

const Service = require('egg').Service;
const CryptoJS = require('crypto-js');

const cryptoKey = 'www.metuwang.com';
const cryptoIv = '1269571569321021';

class CryptoService extends Service {

  // 加密
  Encrypt(k, text) {
    const DecryptKey = (k + cryptoKey).substring(0, 16);
    const key = CryptoJS.enc.Utf8.parse(DecryptKey); // 十六位十六进制数作为密钥
    const iv = CryptoJS.enc.Utf8.parse(cryptoIv); // 十六位十六进制数作为密钥偏移量

    const encrypted = CryptoJS.AES.encrypt(
      text.toString(),
      key,
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return encrypted.ciphertext.toString();
  }

  // 解密
  Decrypt(k, text) {
    const DecryptKey = (k + cryptoKey).substring(0, 16);
    const key = CryptoJS.enc.Utf8.parse(DecryptKey); // 十六位十六进制数作为密钥
    const iv = CryptoJS.enc.Utf8.parse(cryptoIv); // 十六位十六进制数作为密钥偏移量

    const encryptedHexStr = CryptoJS.enc.Hex.parse(text);
    const srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);

    const decrypt = CryptoJS.AES.decrypt(
      srcs,
      key,
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return decrypt.toString(CryptoJS.enc.Utf8);
  }

}

module.exports = CryptoService;
