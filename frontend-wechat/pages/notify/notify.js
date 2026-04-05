// pages/notify/notify.js - 通知设置页
const api = require('../../services/api.js');

Page({
  data: {
    settings: {
      // 提醒开关
      dailyReminder: true,
      wrongQuestionReminder: true,
      predictPaperReminder: true,
      examReminder: true,
      
      // 免打扰设置
      quietMode: false,
      quietStart: '22:00',
      quietEnd: '08:00',
      
      // 推送时间
      pushTime: '09:00',
      
      // 订阅消息
      messageTypes: {
        studyReport: true,
        weakPointAlert: true,
        newPredictPaper: false,
        examCountdown: true
      }
    },
    showTimePicker: false,
    timePickerTarget: null
  },

  onLoad() {
    this.loadSettings();
  },

  // 加载设置
  async loadSettings() {
    try {
      const result = await api.user.notifySettings();
      if (result.data) {
        this.setData({ settings: result.data });
      }
    } catch (err) {
      // 使用默认设置
    }
  },

  // 切换开关
  onSwitchChange(e) {
    const { key } = e.currentTarget.dataset;
    const value = e.detail;
    
    this.setData({
      [`settings.${key}`]: value
    });
    
    this.saveSettings();
  },

  // 切换消息类型
  onMessageTypeChange(e) {
    const { type } = e.currentTarget.dataset;
    const value = e.detail;
    
    this.setData({
      [`settings.messageTypes.${type}`]: value
    });
    
    this.saveSettings();
  },

  // 保存设置
  async saveSettings() {
    try {
      await api.user.updateNotifySettings(this.data.settings);
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) {
      console.error('Save settings failed:', err);
    }
  },

  // 显示时间选择器
  onShowTimePicker(e) {
    const { target } = e.currentTarget.dataset;
    this.setData({
      showTimePicker: true,
      timePickerTarget: target
    });
  },

  // 隐藏时间选择器
  onHideTimePicker() {
    this.setData({ showTimePicker: false });
  },

  // 选择时间
  onTimeChange(e) {
    const { value } = e.detail;
    const { timePickerTarget } = this.data;
    
    if (timePickerTarget === 'pushTime') {
      this.setData({
        'settings.pushTime': value
      });
    } else if (timePickerTarget === 'quietStart') {
      this.setData({
        'settings.quietStart': value
      });
    } else if (timePickerTarget === 'quietEnd') {
      this.setData({
        'settings.quietEnd': value
      });
    }
    
    this.saveSettings();
  },

  // 开启/关闭免打扰
  onQuietModeChange(e) {
    this.setData({
      'settings.quietMode': e.detail
    });
    this.saveSettings();
  },

  // 重置所有设置
  onResetSettings() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有通知设置吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            settings: {
              dailyReminder: true,
              wrongQuestionReminder: true,
              predictPaperReminder: true,
              examReminder: true,
              quietMode: false,
              quietStart: '22:00',
              quietEnd: '08:00',
              pushTime: '09:00',
              messageTypes: {
                studyReport: true,
                weakPointAlert: true,
                newPredictPaper: false,
                examCountdown: true
              }
            }
          });
          this.saveSettings();
        }
      }
    });
  },

  // 请求通知权限
  async requestNotifyPermission() {
    try {
      const setting = await wx.getSetting();
      
      if (!setting.authSetting['scope.notify']) {
        const result = await wx.authorize({ scope: 'scope.notify' });
        if (result) {
          wx.showToast({ title: '授权成功', icon: 'success' });
        }
      }
    } catch (err) {
      wx.showToast({ title: '请手动开启通知权限', icon: 'none' });
    }
  }
});
