// services/api.js - API 服务层

const API_BASE = 'https://your-domain.com/api';
const HEADER_KEY = 'Authorization';

// 请求封装
function request(options) {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    showLoading = true,
    loadingText = '加载中...'
  } = options;

  return new Promise((resolve, reject) => {
    // 显示loading
    if (showLoading) {
      wx.showLoading({
        title: loadingText,
        mask: true
      });
    }

    // 获取token
    const token = wx.getStorageSync('token');
    
    // 合并请求头
    const requestHeader = {
      'Content-Type': 'application/json',
      ...header
    };
    
    if (token) {
      requestHeader[HEADER_KEY] = `Bearer ${token}`;
    }

    wx.request({
      url: `${API_BASE}${url}`,
      method,
      data,
      header: requestHeader,
      timeout: 30000,
      success(res) {
        if (showLoading) {
          wx.hideLoading();
        }

        const { statusCode, data: responseData } = res;

        // 处理业务错误
        if (statusCode >= 200 && statusCode < 300) {
          if (responseData.code === 0 || responseData.success) {
            resolve(responseData);
          } else if (responseData.code === 401) {
            // token过期或无效
            handleAuthError();
            reject(new Error('登录已过期，请重新登录'));
          } else if (responseData.code === 403) {
            wx.showToast({
              title: '无权限访问',
              icon: 'none'
            });
            reject(new Error('无权限访问'));
          } else {
            wx.showToast({
              title: responseData.message || '请求失败',
              icon: 'none'
            });
            reject(new Error(responseData.message || '请求失败'));
          }
        } else if (statusCode === 404) {
          wx.showToast({
            title: '接口不存在',
            icon: 'none'
          });
          reject(new Error('接口不存在'));
        } else if (statusCode >= 500) {
          wx.showToast({
            title: '服务器错误',
            icon: 'none'
          });
          reject(new Error('服务器错误'));
        } else {
          reject(new Error(`请求失败: ${statusCode}`));
        }
      },
      fail(err) {
        if (showLoading) {
          wx.hideLoading();
        }
        
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        
        reject(err);
      }
    });
  });
}

// 处理授权错误
function handleAuthError() {
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
  
  const app = getApp();
  app.globalData.token = null;
  app.globalData.userInfo = null;
  app.globalData.isLogin = false;
  
  // 跳转到登录页或弹出登录框
  wx.reLaunch({
    url: '/pages/index/index?needLogin=true'
  });
}

// GET 请求
function get(url, params = {}, options = {}) {
  let queryString = '';
  
  if (Object.keys(params).length > 0) {
    queryString = '?' + Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }
  
  return request({
    url: `${url}${queryString}`,
    method: 'GET',
    ...options
  });
}

// POST 请求
function post(url, data = {}, options = {}) {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  });
}

// PUT 请求
function put(url, data = {}, options = {}) {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  });
}

// DELETE 请求
function del(url, data = {}, options = {}) {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  });
}

// 上传文件
function uploadFile(filePath, name = 'file', formData = {}) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    wx.uploadFile({
      url: `${API_BASE}/upload`,
      filePath,
      name,
      formData,
      header: {
        [HEADER_KEY]: token ? `Bearer ${token}` : ''
      },
      success(res) {
        const data = JSON.parse(res.data);
        if (data.code === 0) {
          resolve(data);
        } else {
          reject(new Error(data.message || '上传失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

// 下载文件
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url: `${API_BASE}${url}`,
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath);
        } else {
          reject(new Error('下载失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

// ============ 业务接口 ============

// 题目相关
const questionApi = {
  // 获取题目列表
  list: (params) => get('/questions', params),
  
  // 获取题目详情
  detail: (id) => get(`/questions/${id}`),
  
  // 提交答案
  submit: (data) => post('/questions/submit', data),
  
  // 获取解析
  getAnalysis: (id) => get(`/questions/${id}/analysis`),
  
  // 收藏题目
  favorite: (id) => post('/questions/favorite', { questionId: id }),
  
  // 取消收藏
  unfavorite: (id) => post('/questions/unfavorite', { questionId: id }),
  
  // 获取收藏列表
  favorites: () => get('/questions/favorites')
};

// 错题相关
const wrongApi = {
  // 获取错题列表
  list: (params) => get('/wrong-questions', params),
  
  // 添加错题
  add: (data) => post('/wrong-questions', data),
  
  // 移除错题
  remove: (id) => del(`/wrong-questions/${id}`),
  
  // 获取错题统计
  stats: () => get('/wrong-questions/stats')
};

// 押题卷相关
const predictApi = {
  // 生成押题卷
  generate: (params) => post('/predict/generate', params),
  
  // 获取押题卷列表
  list: () => get('/predict/list'),
  
  // 获取押题卷详情
  detail: (id) => get(`/predict/${id}`),
  
  // 获取推荐押题
  recommended: () => get('/predict/recommended'),
  
  // 获取押题统计
  stats: () => get('/predict/stats')
};

// 知识图谱相关
const knowledgeApi = {
  // 获取章节列表
  chapters: () => get('/knowledge/chapters'),
  
  // 获取知识点列表
  points: (chapterId) => get(`/knowledge/chapters/${chapterId}/points`),
  
  // 获取知识点详情
  pointDetail: (id) => get(`/knowledge/points/${id}`),
  
  // 获取预测概率
  prediction: (pointId) => get(`/knowledge/points/${pointId}/prediction`),
  
  // 获取掌握度
  mastery: () => get('/knowledge/mastery')
};

// 学习统计相关
const statsApi = {
  // 获取学习统计
  overview: () => get('/stats/overview'),
  
  // 获取学习趋势
  trend: (params) => get('/stats/trend', params),
  
  // 获取知识点掌握度
  mastery: () => get('/stats/mastery'),
  
  // 获取每日学习时长
  dailyStudyTime: (params) => get('/stats/daily-study-time', params)
};

// 用户相关
const userApi = {
  // 获取用户信息
  info: () => get('/user/info'),
  
  // 更新用户信息
  update: (data) => post('/user/update', data),
  
  // 获取学习目标
  goal: () => get('/user/goal'),
  
  // 设置学习目标
  setGoal: (data) => post('/user/goal', data),
  
  // 获取通知设置
  notifySettings: () => get('/user/notify-settings'),
  
  // 更新通知设置
  updateNotifySettings: (data) => post('/user/notify-settings', data)
};

module.exports = {
  request,
  get,
  post,
  put,
  del,
  uploadFile,
  downloadFile,
  
  // API 模块
  question: questionApi,
  wrong: wrongApi,
  predict: predictApi,
  knowledge: knowledgeApi,
  stats: statsApi,
  user: userApi,
  
  // 导出常量
  API_BASE
};
