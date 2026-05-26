Page({
  data: {
    evaluations: [],
    page: 1,
    pageSize: 10,
    loading: false,
    noMore: false
  },

  onLoad() {
    this.loadEvaluations(true);
  },

  onPullDownRefresh() {
    this.loadEvaluations(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (!this.data.loading && !this.data.noMore) {
      this.loadEvaluations(false);
    }
  },

  async loadEvaluations(refresh = false) {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });
      const app = getApp();
      
      const page = refresh ? 1 : this.data.page;
      const data = await app.request({
        url: '/companion/evaluations',
        data: {
          page,
          pageSize: this.data.pageSize
        }
      });

      const newList = data.list || [];
      
      if (refresh) {
        this.setData({
          evaluations: newList,
          page: 1,
          noMore: newList.length < this.data.pageSize
        });
      } else {
        this.setData({
          evaluations: [...this.data.evaluations, ...newList],
          page: page + 1,
          noMore: newList.length < this.data.pageSize
        });
      }
    } catch (err) {
      console.error('加载评价列表失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  renderStars(rating) {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
});
