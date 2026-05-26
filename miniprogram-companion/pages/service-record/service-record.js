const app = getApp();

Page({
  data: {
    records: [],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false
  },

  onShow() {
    if (app.globalData.token) {
      this.loadRecords(true);
    }
  },

  async loadRecords(reset = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const page = reset ? 1 : this.data.page;
      const data = await app.request({
        url: '/companion/service-records',
        data: { page, pageSize: this.data.pageSize }
      });

      data.list.forEach(item => {
        item.status_text = app.formatOrderStatus(item.status);
      });

      this.setData({
        records: reset ? data.list : [...this.data.records, ...data.list],
        total: data.total,
        page: reset ? 2 : this.data.page + 1,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载服务记录失败', err);
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` });
  },

  onReachBottom() {
    if (this.data.records.length < this.data.total) {
      this.loadRecords();
    }
  }
})
