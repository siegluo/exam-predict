// pages/exam/exam.js - 刷题页
const api = require('../../services/api.js');

Page({
  data: {
    // 题目相关
    questions: [],
    currentIndex: 0,
    currentQuestion: null,
    userAnswers: {},
    
    // 状态
    mode: 'list', // list | exam | result
    isLoading: false,
    isSubmitting: false,
    
    // 计时器
    timer: null,
    elapsedTime: 0, // 秒
    formattedTime: '00:00',
    
    // 统计
    stats: {
      total: 0,
      answered: 0,
      correct: 0,
      wrong: 0
    },
    
    // 筛选
    filterType: 'all', // all | single | multiple | case
    filterChapter: '',
    chapters: [],
    
    // 答题卡
    showAnswerSheet: false
  },

  onLoad(options) {
    const { mode, taskId } = options;
    
    if (mode === 'exam') {
      this.startExam();
    } else {
      this.loadQuestions();
    }
    
    if (taskId) {
      this.loadTask(taskId);
    }
  },

  onUnload() {
    this.clearTimer();
  },

  onShareAppMessage() {
    return {
      title: '考试预测 - 刷题练习',
      path: '/pages/exam/exam'
    };
  },

  // 加载题目列表
  async loadQuestions() {
    this.setData({ isLoading: true });
    
    try {
      const params = {};
      if (this.data.filterType !== 'all') {
        params.type = this.data.filterType;
      }
      if (this.data.filterChapter) {
        params.chapterId = this.data.filterChapter;
      }
      
      const result = await api.question.list(params);
      if (result.data) {
        this.setData({
          questions: result.data,
          mode: 'list'
        });
      }
    } catch (err) {
      // 模拟数据
      this.setData({
        questions: this.generateMockQuestions()
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 生成模拟题目
  generateMockQuestions() {
    return [
      {
        id: 1,
        type: 'single',
        chapter: '第一章 呼吸系统',
        difficulty: 2,
        content: '患者，男，65岁。咳嗽、咳痰15年，加重伴呼吸困难3天。该患者最可能的诊断是？',
        options: [
          { id: 'A', text: '慢性支气管炎', isCorrect: true },
          { id: 'B', text: '支气管哮喘', isCorrect: false },
          { id: 'C', text: '肺炎', isCorrect: false },
          { id: 'D', text: '肺癌', isCorrect: false }
        ],
        analysis: '根据患者长期咳嗽咳痰病史，加重伴呼吸困难，首先考虑慢性支气管炎急性发作。'
      },
      {
        id: 2,
        type: 'single',
        chapter: '第一章 呼吸系统',
        difficulty: 3,
        content: '关于心脏骤停的处理的描述，错误的是？',
        options: [
          { id: 'A', text: '立即进行心肺复苏', isCorrect: false },
          { id: 'B', text: '尽快进行电除颤', isCorrect: false },
          { id: 'C', text: '首先应用大量糖皮质激素', isCorrect: true },
          { id: 'D', text: '同时进行胸外按压和人工呼吸', isCorrect: false }
        ],
        analysis: '心脏骤停时应立即进行心肺复苏，尽快除颤，激素不是首要治疗措施。'
      },
      {
        id: 3,
        type: 'multiple',
        chapter: '第二章 循环系统',
        difficulty: 2,
        content: '以下哪些是急性心肌梗死的典型表现？（多选）',
        options: [
          { id: 'A', text: '持续性胸痛', isCorrect: true },
          { id: 'B', text: '心电图ST段弓背向上抬高', isCorrect: true },
          { id: 'C', text: '胸痛可自行缓解', isCorrect: false },
          { id: 'D', text: '心肌酶升高', isCorrect: true }
        ],
        analysis: '急性心肌梗死典型表现为持续性胸痛、心电图ST段抬高和心肌酶升高。'
      },
      {
        id: 4,
        type: 'case',
        chapter: '第三章 消化系统',
        difficulty: 3,
        content: '病例分析：患者，男性，50岁。持续性上腹痛6小时就诊。查体：体温38.5℃，全腹压痛、反跳痛，以右上腹为著。该患者的诊断是什么？',
        options: [
          { id: 'A', text: '急性胃炎', isCorrect: false },
          { id: 'B', text: '急性阑尾炎', isCorrect: false },
          { id: 'C', text: '急性胆囊炎', isCorrect: true },
          { id: 'D', text: '急性胰腺炎', isCorrect: false }
        ],
        analysis: '根据发热、右上腹压痛反跳痛，首先考虑急性胆囊炎。'
      }
    ];
  },

  // 加载任务
  async loadTask(taskId) {
    try {
      const result = await api.get('/tasks/' + taskId);
      if (result.data) {
        this.setData({
          questions: result.data.questions || this.generateMockQuestions()
        });
      }
    } catch (err) {
      console.error('Load task failed:', err);
    }
  },

  // 开始答题
  startExam() {
    const questions = this.data.questions.length > 0 
      ? this.data.questions 
      : this.generateMockQuestions();
    
    this.setData({
      mode: 'exam',
      questions,
      currentIndex: 0,
      currentQuestion: questions[0],
      userAnswers: {},
      stats: {
        total: questions.length,
        answered: 0,
        correct: 0,
        wrong: 0
      }
    });
    
    // 开始计时
    this.startTimer();
  },

  // 开始计时器
  startTimer() {
    this.clearTimer();
    
    this.setData({ elapsedTime: 0 });
    
    this.data.timer = setInterval(() => {
      const elapsed = this.data.elapsedTime + 1;
      this.setData({
        elapsedTime: elapsed,
        formattedTime: this.formatTime(elapsed)
      });
    }, 1000);
  },

  // 清除计时器
  clearTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.data.timer = null;
    }
  },

  // 格式化时间
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  // 选择答案
  onSelectOption(e) {
    const { optionId } = e.currentTarget.dataset;
    const { currentQuestion, userAnswers, currentIndex } = this.data;
    
    if (currentQuestion.type === 'multiple') {
      // 多选题
      const current = userAnswers[currentIndex] || [];
      const idx = current.indexOf(optionId);
      
      if (idx > -1) {
        current.splice(idx, 1);
      } else {
        current.push(optionId);
      }
      
      userAnswers[currentIndex] = [...current];
    } else {
      // 单选题/案例题
      userAnswers[currentIndex] = optionId;
    }
    
    this.setData({ userAnswers });
  },

  // 上一题
  prevQuestion() {
    if (this.data.currentIndex > 0) {
      const index = this.data.currentIndex - 1;
      this.setData({
        currentIndex: index,
        currentQuestion: this.data.questions[index]
      });
    }
  },

  // 下一题
  nextQuestion() {
    if (this.data.currentIndex < this.data.questions.length - 1) {
      const index = this.data.currentIndex + 1;
      this.setData({
        currentIndex: index,
        currentQuestion: this.data.questions[index]
      });
    }
  },

  // 标记不确定
  markUncertain() {
    const { currentIndex, userAnswers } = this.data;
    const uncertain = userAnswers[`uncertain_${currentIndex}`];
    userAnswers[`uncertain_${currentIndex}`] = !uncertain;
    this.setData({ userAnswers });
  },

  // 收藏题目
  async favoriteQuestion() {
    const { currentQuestion } = this.data;
    try {
      await api.question.favorite(currentQuestion.id);
      wx.showToast({ title: '收藏成功', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '收藏失败', icon: 'none' });
    }
  },

  // 提交答案
  async submitAnswer() {
    const { currentIndex, currentQuestion, userAnswers, questions } = this.data;
    const answer = userAnswers[currentIndex];
    
    if (!answer || (Array.isArray(answer) && answer.length === 0)) {
      wx.showToast({ title: '请选择答案', icon: 'none' });
      return;
    }
    
    this.setData({ isSubmitting: true });
    
    try {
      // 提交到服务器
      await api.question.submit({
        questionId: currentQuestion.id,
        answer: answer
      });
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      this.setData({ isSubmitting: false });
    }
    
    // 显示解析
    this.showAnalysis();
  },

  // 显示解析
  showAnalysis() {
    this.setData({ showAnalysis: true });
  },

  // 隐藏解析
  hideAnalysis() {
    this.setData({ showAnalysis: false });
  },

  // 交卷
  submitPaper() {
    wx.showModal({
      title: '确认交卷',
      content: `共${this.data.questions.length}题，确认提交吗？`,
      success: (res) => {
        if (res.confirm) {
          this.calculateResult();
        }
      }
    });
  },

  // 计算结果
  calculateResult() {
    this.clearTimer();
    
    const { questions, userAnswers, stats } = this.data;
    let correct = 0;
    let wrong = 0;
    
    questions.forEach((q, index) => {
      const answer = userAnswers[index];
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        return;
      }
      
      const correctOptions = q.options.filter(o => o.isCorrect).map(o => o.id);
      
      if (Array.isArray(answer)) {
        // 多选题
        const isCorrect = answer.length === correctOptions.length &&
          answer.every(a => correctOptions.includes(a));
        if (isCorrect) correct++;
        else wrong++;
      } else {
        // 单选题
        const correctAnswer = q.options.find(o => o.isCorrect);
        if (answer === correctAnswer?.id) correct++;
        else wrong++;
      }
    });
    
    this.setData({
      mode: 'result',
      stats: {
        ...stats,
        correct,
        wrong,
        answered: questions.filter((q, i) => {
          const a = userAnswers[i];
          return a && (!Array.isArray(a) || a.length > 0);
        }).length
      }
    });
  },

  // 查看结果详情
  viewResultDetail() {
    wx.navigateTo({ url: '/pages/exam/exam?mode=detail' });
  },

  // 重新练习
  retake() {
    this.setData({
      mode: 'list',
      userAnswers: {},
      currentIndex: 0,
      currentQuestion: null
    });
    this.loadQuestions();
  },

  // 继续答题
  continueExam() {
    this.setData({ mode: 'exam' });
    this.startTimer();
  },

  // 切换答题卡
  toggleAnswerSheet() {
    this.setData({ showAnswerSheet: !this.data.showAnswerSheet });
  },

  // 跳转到指定题
  goToQuestion(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({
      currentIndex: index,
      currentQuestion: this.data.questions[index],
      showAnswerSheet: false
    });
  },

  // 筛选题目类型
  onFilterType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ filterType: type });
    this.loadQuestions();
  },

  // 收藏题目
  async toggleFavorite(e) {
    const { id } = e.currentTarget.dataset;
    try {
      await api.question.favorite(id);
      wx.showToast({ title: '收藏成功', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '收藏失败', icon: 'none' });
    }
  }
});
