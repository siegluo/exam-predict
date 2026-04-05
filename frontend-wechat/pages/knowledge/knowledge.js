// pages/knowledge/knowledge.js - 知识图谱页
const api = require('../../services/api.js');

Page({
  data: {
    chapters: [],
    knowledgePoints: [],
    selectedChapter: null,
    selectedPoint: null,
    pointDetail: null,
    masteryData: {},
    predictionData: {},
    isLoading: false,
    mode: 'chapters', // chapters | points | detail
    searchKeyword: ''
  },

  onLoad(options) {
    this.loadChapters();
    
    if (options.pointId) {
      this.loadPointDetail(options.pointId);
    }
  },

  onPullDownRefresh() {
    if (this.data.mode === 'chapters') {
      this.loadChapters();
    } else if (this.data.mode === 'points') {
      this.loadKnowledgePoints(this.data.selectedChapter);
    }
    wx.stopPullDownRefresh();
  },

  // 加载章节列表
  async loadChapters() {
    this.setData({ isLoading: true });
    
    try {
      const result = await api.knowledge.chapters();
      if (result.data) {
        this.setData({ chapters: result.data });
      }
    } catch (err) {
      // 模拟数据
      this.setData({
        chapters: [
          { id: 1, name: '第一章 呼吸系统', totalPoints: 45, masteredRate: 72, examProbability: 85 },
          { id: 2, name: '第二章 循环系统', totalPoints: 52, masteredRate: 65, examProbability: 92 },
          { id: 3, name: '第三章 消化系统', totalPoints: 48, masteredRate: 78, examProbability: 80 },
          { id: 4, name: '第四章 泌尿系统', totalPoints: 35, masteredRate: 55, examProbability: 75 },
          { id: 5, name: '第五章 血液系统', totalPoints: 40, masteredRate: 62, examProbability: 70 }
        ]
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 加载知识点列表
  async loadKnowledgePoints(chapterId) {
    this.setData({ isLoading: true, selectedChapter: chapterId });
    
    try {
      const result = await api.knowledge.points(chapterId);
      if (result.data) {
        this.setData({ knowledgePoints: result.data });
      }
    } catch (err) {
      // 模拟数据
      this.setData({
        knowledgePoints: this.generateMockPoints(chapterId)
      });
    } finally {
      this.setData({ isLoading: false, mode: 'points' });
    }
  },

  generateMockPoints(chapterId) {
    const pointsMap = {
      1: ['肺部感染', '慢性支气管炎', 'COPD', '支气管哮喘', '肺炎', '肺结核', '肺癌', '胸腔积液'],
      2: ['心力衰竭', '心律失常', '冠心病', '高血压', '心肌病', '心脏瓣膜病', '急性心包炎'],
      3: ['胃炎', '消化性溃疡', '胃癌', '肝硬化', '肝癌', '急性胰腺炎', '胆囊炎', '阑尾炎'],
      4: ['肾小球肾炎', '肾病综合征', '肾功能衰竭', '尿路感染', '泌尿系结石'],
      5: ['贫血', '白血病', '淋巴瘤', '出血性疾病', '输血反应']
    };
    
    const points = pointsMap[chapterId] || pointsMap[1];
    return points.map((name, index) => ({
      id: chapterId * 100 + index,
      name,
      mastery: Math.floor(Math.random() * 60) + 40,
      examProbability: Math.floor(Math.random() * 30) + 70,
      questionsCount: Math.floor(Math.random() * 50) + 10
    }));
  },

  // 加载知识点详情
  async loadPointDetail(pointId) {
    this.setData({ isLoading: true });
    
    try {
      const result = await api.knowledge.pointDetail(pointId);
      if (result.data) {
        this.setData({ 
          pointDetail: result.data,
          mode: 'detail'
        });
      }
    } catch (err) {
      // 模拟数据
      this.setData({
        pointDetail: {
          id: pointId,
          name: '心力衰竭',
          chapter: '第二章 循环系统',
          mastery: 65,
          examProbability: 88,
          relatedPoints: ['心脏骤停', '心律失常', '高血压'],
          keyConcepts: [
            '心力衰竭的定义和分类',
            '慢性心力衰竭的临床表现',
            '急性心力衰竭的抢救流程',
            '心力衰竭的药物治疗'
          ],
          summary: '心力衰竭是各种心脏结构或功能性疾病导致心室充盈和（或）射血功能受损，心排血量不能满足机体组织代谢需要，是各种心脏疾病的严重阶段。'
        },
        mode: 'detail'
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 加载预测概率
  async loadPredictions() {
    try {
      const result = await api.knowledge.mastery();
      if (result.data) {
        this.setData({ masteryData: result.data });
      }
    } catch (err) {
      console.error('Load predictions failed:', err);
    }
  },

  // 选择章节
  onSelectChapter(e) {
    const { id } = e.currentTarget.dataset;
    this.loadKnowledgePoints(id);
  },

  // 返回章节列表
  onBackToChapters() {
    this.setData({ mode: 'chapters', selectedChapter: null });
  },

  // 返回知识点列表
  onBackToPoints() {
    this.setData({ mode: 'points', pointDetail: null });
  },

  // 选择知识点
  onSelectPoint(e) {
    const { id } = e.currentTarget.dataset;
    this.loadPointDetail(id);
  },

  // 开始学习
  onStartLearning() {
    const { pointDetail } = this.data;
    wx.navigateTo({ 
      url: `/pages/exam/exam?mode=practice&pointId=${pointDetail.id}` 
    });
  },

  // 搜索
  onSearch(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  // 获取筛选后的章节
  getFilteredChapters() {
    const { chapters, searchKeyword } = this.data;
    
    if (!searchKeyword) return chapters;
    
    return chapters.filter(c => 
      c.name.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }
});
