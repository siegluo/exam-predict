// pages/profile/profile.js - 个人中心页
const api = require('../../services/api.js');
const auth = require('../../services/auth.js');

Page({
  data: {
    userInfo: null,
    memberStatus: {
      isVip: false,
      expireDate: null,
      remainDays: 0
    },
    studyStats: {
      totalDays: 0,
      totalQuestions: 0,
      totalTime: 0,
      currentStreak: 0
    },
    learningTrend: [],
    quickActions: [
      { id: 1, name: '通知设置', icon: '🔔', path: '/pages/notify/notify' },
      { id: 2, name: '学习记录', icon: '📊', path: '/pages/profile/profile?action=records' },
      { id: 3, name: '收藏夹', icon: '⭐', path: '/pages/exam/exam?mode=favorites' },
      { id: 4, name: '设置', icon: '⚙️', path: '/pages/profile/profile?action=settings' }
    ]
  },

  onLoad(options) {
    if (options.action) {
      this.handleAction(options.action);
    }
    
    this.loadUserInfo();
    this.loadStudyStats();
  },

  onShow() {
    this.loadUserInfo();
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const result = await api.user.info();
      if (result.data) {
        this.setData({ userInfo: result.data });
      }
    } catch (err) {
      // 使用全局数据
      const app = getApp();
      this.setData({
        userInfo: app.globalData.userInfo || {
          nickname: '考生用户',
          avatar: ''
        }
      });
    }
    
    // 加载会员状态
    this.loadMemberStatus();
  },

  // 加载会员状态
  async loadMemberStatus() {
    try {
      const result = await api.get('/member/status');
      if (result.data) {
        this.setData({ memberStatus: result.data });
      }
    } catch (err) {
      // 模拟数据
      this.setData({
        memberStatus: {
          isVip: false,
          expireDate: null,
          remainDays: 0
        }
      });
    }
  },

  // 加载学习统计
  async loadStudyStats() {
    try {
      const result = await api.stats.overview();
      if (result.data) {
        this.setData({ studyStats: result.data });
      }
    } catch (err) {
      // 模拟数据
      this.setData({
        studyStats: {
          totalDays: 45,
          totalQuestions: 1234,
          totalTime: 36000,
          currentStreak: 7
        }
      });
    }
    
    // 加载学习趋势
    this.loadLearningTrend();
  },

  // 加载学习趋势
  async loadLearningTrend() {
    try {
      const result = await api.stats.trend({ days: 7 });
      if (result.data) {
        this.setData({ learningTrend: result.data });
      }
    } catch (err) {
      // 模拟数据
      this.setData({
        learningTrend: [
          { date: '周一', questions: 20, correctRate: 75 },
          { date: '周二', questions: 25, correctRate: 80 },
          { date: '周三', questions: 18, correctRate: 72 },
          { date: '周四', questions: 30, correctRate: 78 },
          { date: '周五', questions: 22, correctRate: 85 },
          { date: '周六', questions: 35, correctRate: 82 },
          { date: '周日', questions: 28, correctRate: 79 }
        ]
      });
    }
  },

  // 处理操作
  handleAction(action) {
    switch (action) {
      case 'setExamDate':
        this.showDatePicker();
        break;
      case 'records':
        wx.showToast({ title: '功能开发中', icon: 'none' });
        break;
      case 'settings':
        wx.showToast({ title: '功能开发中', icon: 'none' });
        break;
    }
  },

  // 显示日期选择器
  showDatePicker() {
    const app = getApp();
    wx.showModal({
      title: '设置考试日期',
      content: `当前考试日期：${app.globalData.examDate}`,
      confirmText: '修改',
      success: (res) => {
        if (res.confirm) {
          // 实际应用中应该打开日期选择器
          wx.showToast({ title: '请在设置中修改', icon: 'none' });
        }
      }
    });
  },

  // 快速操作点击
  onQuickAction(e) {
    const { path } = e.currentTarget.dataset;
    wx.navigateTo({ url: path });
  },

  // 跳转到VIP
  onGoToVip() {
    wx.showToast({ title: 'VIP功能开发中', icon: 'none' });
  },

  // 开通VIP
  onOpenVip() {
    wx.showToast({ title: '支付功能开发中', icon: 'none' });
  },

  // 编辑资料
  onEditProfile() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          auth.logout();
          wx.reLaunch({ url: '/pages/index/index' });
        }
      }
    });
  },

  // 格式化时长
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${mins}分钟`;
  }
});
