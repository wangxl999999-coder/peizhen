Page({
  data: {
    statistics: null,
    incomeList: [],
    activeTab: 'statistics',
    tabs: [
      { key: 'statistics', label: '收入统计' },
      { key: 'detail', label: '收入明细' }
    ],
    page: 1,
    pageSize: 10,
    loading: false,
    noMore: false
  },

  onLoad() {
    this.loadStatistics();
    this.loadIncomeList(true);
  },

  onShow() {
    this.loadStatistics();
  },

  onPullDownRefresh() {
    this.loadStatistics();
    this.loadIncomeList(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.activeTab === 'detail' && !this.data.loading && !this.data.noMore) {
      this.loadIncomeList(false);
    }
  },

  onTabChange(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ activeTab: key });
  },

  async loadStatistics() {
    try {
      const app = getApp();
      const data = await app.request({
        url: '/companion/income/statistics'
      });
      this.setData({ statistics: data });
    } catch (err) {
      console.error('加载收入统计失败:', err);
    }
  },

  async loadIncomeList(refresh = false) {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });
      const app = getApp();
      
      const page = refresh ? 1 : this.data.page;
      const data = await app.request({
        url: '/companion/income/list',
        data: {
          page,
          pageSize: this.data.pageSize
        }
      });

      const newList = data.list || [];
      
      if (refresh) {
        this.setData({
          incomeList: newList,
          page: 1,
          noMore: newList.length < this.data.pageSize
        });
      } else {
        this.setData({
          incomeList: [...this.data.incomeList, ...newList],
          page: page + 1,
          noMore: newList.length < this.data.pageSize
        });
      }
    } catch (err) {
      console.error('加载收入明细失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  goToWithdraw() {
    wx.navigateTo({ url: '/pages/withdraw/withdraw' });
  },

  goToWithdrawList() {
    wx.navigateTo({ url: '/pages/withdraw/withdraw?tab=list' });
  }
});
