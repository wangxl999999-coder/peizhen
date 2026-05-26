Page({
  data: {
    trainings: [],
    category: 'all',
    categories: [
      { value: 'all', label: '全部' },
      { value: 'basic', label: '基础培训' },
      { value: 'professional', label: '专业技能' },
      { value: 'service', label: '服务规范' },
      { value: 'safety', label: '安全须知' }
    ],
    page: 1,
    pageSize: 10,
    loading: false,
    noMore: false
  },

  onLoad() {
    this.loadTrainings(true);
  },

  onPullDownRefresh() {
    this.loadTrainings(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (!this.data.loading && !this.data.noMore) {
      this.loadTrainings(false);
    }
  },

  onCategoryChange(e) {
    const { value } = e.currentTarget.dataset;
    this.setData({ category: value });
    this.loadTrainings(true);
  },

  async loadTrainings(refresh = false) {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });
      const app = getApp();
      
      const page = refresh ? 1 : this.data.page;
      const data = await app.request({
        url: '/companion/trainings',
        data: {
          category: this.data.category,
          page,
          pageSize: this.data.pageSize
        }
      });

      const newList = data.list || [];
      
      if (refresh) {
        this.setData({
          trainings: newList,
          page: 1,
          noMore: newList.length < this.data.pageSize
        });
      } else {
        this.setData({
          trainings: [...this.data.trainings, ...newList],
          page: page + 1,
          noMore: newList.length < this.data.pageSize
        });
      }
    } catch (err) {
      console.error('加载培训资料失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/training-detail/training-detail?id=${id}` });
  }
});
