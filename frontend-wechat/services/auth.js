// services/auth.js - 微信登录服务

/**
 * 微信登录
 * @returns {Promise<{code: string}>}
 */
function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      timeout: 10000,
      success(res) {
        if (res.code) {
          resolve({ code: res.code });
        } else {
          reject(new Error('获取code失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

/**
 * 获取用户信息（需要用户授权）
 * @returns {Promise<{userInfo: object, rawData: string, signature: string}>}
 */
function getUserInfo() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      lang: 'zh_CN',
      success(res) {
        resolve({
          userInfo: res.userInfo,
          rawData: res.rawData,
          signature: res.signature
        });
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

/**
 * 获取手机号
 * @param {string} code - 从微信获取的手机号验证码
 * @returns {Promise<object>}
 */
function getPhoneNumber(code) {
  return new Promise((resolve, reject) => {
    // 此处需要调用后端接口解密手机号
    const app = getApp();
    const api = require('./api.js');
    
    api.post('/auth/bindPhone', { code })
      .then(resolve)
      .catch(reject);
  });
}

/**
 * 检查登录状态
 * @returns {boolean}
 */
function checkSession() {
  return new Promise((resolve) => {
    wx.checkSession({
      success() {
        resolve(true);
      },
      fail() {
        resolve(false);
      }
    });
  });
}

/**
 * 静默登录（仅获取openid）
 */
function silentLogin() {
  return login();
}

/**
 * 退出登录
 */
function logout() {
  wx.removeStorageSync('token');
  wx.removeStorageSync('openid');
  wx.removeStorageSync('userInfo');
  
  const app = getApp();
  app.globalData.token = null;
  app.globalData.openid = null;
  app.globalData.userInfo = null;
  app.globalData.isLogin = false;
}

/**
 * 分享配置
 * @param {string} title - 分享标题
 * @param {string} path - 分享页面路径
 * @param {string} imageUrl - 分享图片
 */
function getShareConfig(title = '考试预测助手', path, imageUrl) {
  return {
    title,
    path: path || '/pages/index/index',
    imageUrl: imageUrl || '',
    success() {
      wx.showToast({
        title: '分享成功',
        icon: 'success'
      });
    },
    fail() {
      wx.showToast({
        title: '分享失败',
        icon: 'none'
      });
    }
  };
}

module.exports = {
  login,
  getUserInfo,
  getPhoneNumber,
  checkSession,
  silentLogin,
  logout,
  getShareConfig
};
