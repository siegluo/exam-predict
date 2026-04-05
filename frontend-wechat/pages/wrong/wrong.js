// pages/wrong/wrong.js - 错题本页
const api = require('../../services/api.js');

Page({
  data: {
    wrongQuestions: [],
    groupedQuestions: {},
    chapters: [],
    selectedChapter: 'all',
    isLoading: false,
    showFilter: false,
    stats: {
      total: 0,
      mastered: 0,
      learning: 0
    }
  },

  onLoad() {
    this.loadWrongQuestions();
  },

  onShow() {
    this.loadStats();
  },

  onPullDownRefresh() {
    this.loadWrongQuestions().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadWrongQuestions() {
    this.setData({ isLoading: true });
    
    try {
      const result = await api.wrong.list();
      if (result.data) {
        this.groupByChapter(result.data);
      }
    } catch (err) {
      // 模拟数据
      const mockData = this.generateMockWrongQuestions();
      this.groupByChapter(mockData);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  generateMockWrongQuestions() {
    return [
      {
        id: 1,
        type: 'single',
        chapter: '心脏骤停处理',
        content: '关于心脏骤停的处理，错误的是？',
        options: [
          { id: 'A', text: '立即进行心肺复苏' },
          { id: 'B', text: '尽快进行电除颤' },
          { id: 'C', text: '首先应用大量糖皮质激素' },
          { id: 'D', text: '同时进行胸外按压和人工呼吸' }
        ],
        userAnswer: 'C',
        correctAnswer: 'C',
        wrongCount: 3,
        lastTime: '2024-03-25',
        mastery: 35
      },
      {
        id: 2,
        type: 'multiple',
        chapter: '药物相互作用',
        content: '以下哪些药物不能同时使用？（多选）',
        options: [
          { id: 'A', text: '华法林 + 阿司匹林' },
          { id: 'B', text: 'ACEI + 保钾利尿剂' },
          { id: 'C', text: '他汀类 + 红霉素' },
          { id: 'D', text: '二甲双胍 + 碘对比剂' }
        ],
        userAnswer: ['A', 'B'],
        correctAnswer: ['B', 'C', 'D'],
        wrongCount: 5,
        lastTime: '2024-03-24',
        mastery: 28
      },
      {
        id: 3,
        type: 'single',
        chapter: '手术切口分类',
        content: '清洁切口的定义是？',
        options: [
          { id: 'A', text: '手术进入感染炎症区' },
          { id: 'B', text: '手术进入呼吸道、消化道等' },
          { id: 'C', text: '手术未进入感染炎症区' },
          { id: 'D', text: '有失活组织的创伤' }
        ],
        userAnswer: 'A',
        correctAnswer: 'C',
        wrongCount: 2,
        lastTime: '2024-03-23',
        mastery: 42
      }
    ];
  },

  groupByChapter(questions) {
    const grouped = {};
    const chapters = [];
    
    questions.forEach(q => {
      if (!grouped[q.chapter]) {
        grouped[q.chapter] = [];
        chapters.push(q.chapter);
      }
      grouped[q.chapter].push(q);
    });
    
    this.setData({
      wrongQuestions: questions,
      groupedQuestions: grouped,
      chapters,
      stats: {
        total: questions.length,
        mastered: questions.filter(q => q.mastery >= 80).length,
        learning: questions.filter(q => q.mastery < 80).length
      }
    });
  },

  async loadStats() {
    try {
      const result = await api.wrong.stats();
      if (result.data) {
        this.setData({ stats: result.data });
      }
    } catch (err) {
      // 使用已有数据
    }
  },

  // 切换章节筛选
  onSelectChapter(e) {
    const chapter = e.currentTarget.dataset.chapter;
    this.setData({ selectedChapter: chapter });
  },

  // 开始练习
  onStartPractice(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/exam/exam?mode=practice&wrongId=${id}` });
  },

  // 练习全部错题
  onPracticeAll() {
    wx.navigateTo({ url: '/pages/exam/exam?mode=practice&type=wrong' });
  },

  // 移除错题
  async onRemoveWrong(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认移除',
      content: '确定要从错题本中移除这道题吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.wrong.remove(id);
            wx.showToast({ title: '已移除', icon: 'success' });
            this.loadWrongQuestions();
          } catch (err) {
            wx.showToast({ title: '移除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 查看解析
  onViewAnalysis(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/exam/exam?mode=review&id=${id}` });
  },

  // 获取筛选后的题目
  getFilteredQuestions() {
    const { wrongQuestions, selectedChapter } = this.data;
    
    if (selectedChapter === 'all') {
      return wrongQuestions;
    }
    
    return wrongQuestions.filter(q => q.chapter === selectedChapter);
  }
});
