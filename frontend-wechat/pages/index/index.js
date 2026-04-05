// pages/index/index.js - 首页
const api = require('../../services/api.js');
const auth = require('../../services/auth.js');

Page({
  data: {
    countdownDays: 0,
    examName: '执业医师资格考试',
    examDate: '',
    todayTasks: [],
    weakPoints: [],
    quickEntries: [
      { id: 1, name: '刷题', icon: '📝', path: '/pages/exam/exam', color: '#4A90E2' },
      { id: 2, name: '错题本', icon: '📋', path: '/pages/wrong/wrong', color: '#ED4C4C' },
      { id: 3, name: '押题卷', icon: '🎯', path: '/pages/predict/predict', color: '#FF9900' },
      { id: 4, name: '知识图谱', icon: '🧠', path: '/pages/knowledge/knowledge', color: '#43AF53' }
    ],
    studyStats: {
      todayQuestions: 0,
      todayCorrectRate: 0,
      totalQuestions: 0,
      correctRate: 0
    },
    notifications: [],
    showLoginModal: false,
    userInfo: null
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    // 刷新数据
    this.loadStudyStats();
    this.loadTodayTasks();
    this.loadWeakPoints();
    
    // 获取用户信息
    const app = getApp();
    this.setData({
      userInfo: app.globalData.userInfo,
      examName: app.globalData.examName,
      examDate: app.globalData.examDate
    });
    
    // 更新倒计时
    this.updateCountdown();
  },

  onPullDownRefresh() {
    this.initData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage() {
    return auth.getShareConfig('考试预测助手', '/pages/index/index');
  },

  async initData() {
    await Promise.all([
      this.loadStudyStats(),
      this.loadTodayTasks(),
      this.loadWeakPoints(),
      this.loadNotifications()
    ]);
  },

  // 更新倒计时
  updateCountdown() {
    const app = getApp();
    const days = app.getCountdownDays();
    this.setData({ countdownDays: days });
  },

  // 加载学习统计
  async loadStudyStats() {
    try {
      const result = await api.stats.overview();
      if (result.data) {
        this.setData({
          studyStats: result.data
        });
      }
    } catch (err) {
      // 使用模拟数据
      this.setData({
        studyStats: {
          todayQuestions: 15,
          todayCorrectRate: 78,
          totalQuestions: 1234,
          correctRate: 72
        }
      });
    }
  },

  // 加载今日任务
  async loadTodayTasks() {
    try {
      const result = await api.get('/tasks/today');
      if (result.data) {
        this.setData({ todayTasks: result.data });
      }
    } catch (err) {
      // 模拟数据
      this.setData({
        todayTasks: [
          { id: 1, title: '完成20道单选题', progress: 60, total: 20, done: 12 },
          { id: 2, title: '复习5道错题', progress: 80, total: 5, done: 4 },
          { id: 3, title: '学习第三章知识点', progress: 0, total: 1, done: 0 }
        ]
      });
    }
  },

  // 加载薄弱点
  async loadWeakPoints() {
    try {
      const result = await api.stats.mastery();
      if (result.data) {
        // 取掌握度最低的3个
        const weakPoints = result.data
          .sort((a, b) => a.mastery - b.mastery)
          .slice(0, 3);
        this.setData({ weakPoints });
      }
    } catch (err) {
      // 模拟数据
      this.setData({
        weakPoints: [
          { id: 1, name: '心脏骤停处理', mastery: 35 },
          { id: 2, name: '药物相互作用', mastery: 42 },
          { id: 3, name: '手术切口分类', mastery: 48 }
        ]
      });
    }
  },

  // 加载通知
  async loadNotifications() {
    try {
      const result = await api.get('/notifications');
      if (result.data) {
        this.setData({ notifications: result.data });
      }
    } catch (err) {
      // 模拟数据
      this.setData({
        notifications: [
          { id: 1, type: 'reminder', content: '今日学习任务还未完成，继续加油！', time: '2小时前' },
          { id: 2, type: 'predict', content: '新版押题卷已上线，预测准确率提升15%', time: '1天前' }
        ]
      });
    }
  },

  // 快速入口点击
  onQuickEntryTap(e) {
    const { path } = e.currentTarget.dataset;
    wx.navigateTo({ url: path });
  },

  // 跳转到刷题
  onStartExam() {
    wx.navigateTo({ url: '/pages/exam/exam' });
  },

  // 跳转到今日任务
  onTaskTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/exam/exam?taskId=${id}` });
  },

  // 跳转到薄弱点学习
  onWeakPointTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/knowledge/knowledge?pointId=${id}` });
  },

  // 查看全部通知
  onViewAllNotifications() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  // 设置考试日期
  onSetExamDate() {
    wx.navigateTo({ url: '/pages/profile/profile?action=setExamDate' });
  },

  // 获取手机号
  onGetPhoneNumber(e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      const api = require('../../services/api.js');
      api.post('/auth/bindPhone', {
        code: e.detail.code
      }).then(res => {
        if (res.token) {
          wx.setStorageSync('token', res.token);
          const app = getApp();
          app.globalData.isLogin = true;
          app.globalData.token = res.token;
        }
        wx.showToast({ title: '登录成功', icon: 'success' });
        this.setData({ showLoginModal: false });
        this.onShow();
      }).catch(err => {
        wx.showToast({ title: '登录失败', icon: 'none' });
      });
    }
  },

  // 模拟登录
  onSimulateLogin() {
    wx.setStorageSync('token', 'mock_token_12345');
    const app = getApp();
    app.globalData.isLogin = true;
    app.globalData.token = 'mock_token_12345';
    app.globalData.userInfo = {
      nickname: '考生用户',
      avatar: ''
    };
    this.setData({ 
      showLoginModal: false,
      userInfo: app.globalData.userInfo
    });
    wx.showToast({ title: '登录成功', icon: 'success' });
  }
});
