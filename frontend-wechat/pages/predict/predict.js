// pages/predict/predict.js - 押题卷页
const api = require('../../services/api.js');

Page({
  data: {
    predictPapers: [],
    recommendedPaper: null,
    historyList: [],
    stats: {
      totalGenerated: 0,
      avgAccuracy: 0
    },
    isLoading: false,
    isGenerating: false,
    showHistory: false,
    
    // 生成选项
    generateOptions: {
      questionCount: 50,
      difficulty: 'all', // all | easy | medium | hard
      focusAreas: []
    }
  },

  onLoad() {
    this.loadPredictPapers();
    this.loadStats();
  },

  onPullDownRefresh() {
    this.loadPredictPapers().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载押题卷列表
  async loadPredictPapers() {
    this.setData({ isLoading: true });
    
    try {
      const result = await api.predict.list();
      if (result.data) {
        this.setData({ 
          predictPapers: result.data,
          historyList: result.data.filter(p => p.status === 'completed')
        });
      }
    } catch (err) {
      // 模拟数据
      this.setData({
        recommendedPaper: {
          id: 1,
          name: '2024年执业医师模拟卷（A卷）',
          description: '基于历年真题和最新考纲预测',
          questionCount: 100,
          estimatedTime: 120,
          confidence: 92,
          generatedAt: '2024-03-25',
          tags: ['高频考点', '新增考点', '易错点']
        },
        predictPapers: [
          {
            id: 2,
            name: '2024年执业医师模拟卷（B卷）',
            confidence: 88,
            status: 'ready'
          },
          {
            id: 3,
            name: '2024年执业医师模拟卷（C卷）',
            confidence: 85,
            status: 'ready'
          }
        ],
        historyList: [
          {
            id: 101,
            name: '2024年执业医师模拟卷（测试）',
            score: 78,
            completedAt: '2024-03-24',
            correctRate: 78
          }
        ]
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 加载统计
  async loadStats() {
    try {
      const result = await api.predict.stats();
      if (result.data) {
        this.setData({ stats: result.data });
      }
    } catch (err) {
      this.setData({
        stats: {
          totalGenerated: 5,
          avgAccuracy: 85
        }
      });
    }
  },

  // 生成押题卷
  async onGeneratePaper() {
    this.setData({ isGenerating: true });
    
    try {
      const result = await api.predict.generate(this.data.generateOptions);
      if (result.data) {
        wx.showToast({ title: '生成成功', icon: 'success' });
        this.loadPredictPapers();
      }
    } catch (err) {
      wx.showToast({ title: '生成失败，请重试', icon: 'none' });
    } finally {
      this.setData({ isGenerating: false });
    }
  },

  // 开始答题
  onStartExam(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/exam/exam?mode=predict&id=${id}` });
  },

  // 查看历史
  onViewHistory() {
    this.setData({ showHistory: true });
  },

  // 隐藏历史
  onHideHistory() {
    this.setData({ showHistory: false });
  },

  // 查看押题卷详情
  onViewDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/predict/predict?detailId=${id}` });
  },

  // 设置题目数量
  onQuestionCountChange(e) {
    this.setData({
      'generateOptions.questionCount': parseInt(e.detail.value)
    });
  },

  // 设置难度
  onDifficultyChange(e) {
    this.setData({
      'generateOptions.difficulty': e.currentTarget.dataset.difficulty
    });
  },

  // 获取置信度标签
  getConfidenceTag(confidence) {
    if (confidence >= 90) return { text: '高置信度', color: 'success' };
    if (confidence >= 75) return { text: '中置信度', color: 'warning' };
    return { text: '参考使用', color: 'default' };
  }
});
