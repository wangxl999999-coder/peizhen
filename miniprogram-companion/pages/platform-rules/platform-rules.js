Page({
  data: {
    rules: [],
    type: 'all',
    types: [
      { value: 'all', label: '全部' },
      { value: 'service', label: '服务规范' },
      { value: 'compliance', label: '合规要求' },
      { value: 'safety', label: '安全守则' },
      { value: 'other', label: '其他规则' }
    ]
  },

  onLoad() {
    this.loadRules();
  },

  onPullDownRefresh() {
    this.loadRules().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onTypeChange(e) {
    const { value } = e.currentTarget.dataset;
    this.setData({ type: value });
    this.loadRules();
  },

  async loadRules() {
    try {
      const app = getApp();
      const data = await app.request({
        url: '/companion/platform-rules',
        data: { type: this.data.type }
      });
      this.setData({ rules: data });
    } catch (err) {
      console.error('加载平台规则失败:', err);
    }
  }
});
