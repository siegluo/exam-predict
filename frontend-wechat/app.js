// app.js
const { login, getUserInfo } = require('./services/auth.js');
const api = require('./services/api.js');

App({
  globalData: {
    userInfo: null,
    token: null,
    openid: null,
    isLogin: false,
    examDate: null, // 考试日期
    examName: '执业医师资格考试', // 考试名称
    studyStats: {
      totalQuestions: 0,
      correctRate: 0,
      weakPoints: [],
      strongPoints: []
    }
  },

  onLaunch(options) {
    // 检查登录状态
    this.checkLoginStatus();
    
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    
    // 设置考试日期（默认30天后）
    const defaultExamDate = new Date();
    defaultExamDate.setDate(defaultExamDate.getDate() + 30);
    this.globalData.examDate = defaultExamDate.toISOString().split('T')[0];
  },

  onShow(options) {
    // 小程序显示时检查登录
  },

  onHide() {
    // 保存学习进度
    this.saveStudyProgress();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      this.globalData.isLogin = true;
      
      // 验证token有效性
      this.validateToken(token);
    } else {
      // 需要登录
      this.doLogin();
    }
  },

  // 执行登录
  async doLogin() {
    try {
      // 调用微信登录
      const loginResult = await login();
      
      if (loginResult.code) {
        // 发送到后端获取token
        const result = await api.post('/auth/login', {
          code: loginResult.code
        });
        
        if (result.token) {
          this.globalData.token = result.token;
          this.globalData.openid = result.openid;
          this.globalData.isLogin = true;
          
          wx.setStorageSync('token', result.token);
          wx.setStorageSync('openid', result.openid);
          
          // 获取用户信息
          await this.fetchUserInfo();
        }
      }
    } catch (err) {
      console.error('Login failed:', err);
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      });
    }
  },

  // 验证token
  async validateToken(token) {
    try {
      const result = await api.get('/auth/validate');
      if (!result.valid) {
        // token无效，重新登录
        this.doLogin();
      }
    } catch (err) {
      console.error('Token validation failed:', err);
    }
  },

  // 获取用户信息
  async fetchUserInfo() {
    try {
      const result = await api.get('/user/info');
      if (result.data) {
        this.globalData.userInfo = result.data;
        wx.setStorageSync('userInfo', result.data);
      }
    } catch (err) {
      console.error('Fetch user info failed:', err);
    }
  },

  // 获取学习统计
  async fetchStudyStats() {
    try {
      const result = await api.get('/study/stats');
      if (result.data) {
        this.globalData.studyStats = result.data;
      }
      return result.data;
    } catch (err) {
      console.error('Fetch study stats failed:', err);
      return null;
    }
  },

  // 保存学习进度
  saveStudyProgress() {
    const progress = wx.getStorageSync('studyProgress') || {};
    progress.lastSaveTime = new Date().toISOString();
    wx.setStorageSync('studyProgress', progress);
  },

  // 格式化日期
  formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  // 计算倒计时天数
  getCountdownDays() {
    if (!this.globalData.examDate) return 0;
    const examDate = new Date(this.globalData.examDate);
    const today = new Date();
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
});
