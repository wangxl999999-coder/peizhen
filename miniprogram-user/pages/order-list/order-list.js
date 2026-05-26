const app = getApp();

Page({
  data: {
    activeTab: 'all',
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'pending_accept', label: '待接单' },
      { key: 'pending_service', label: '待服务' },
      { key: 'in_service', label: '服务中' },
      { key: 'pending_evaluation', label: '待评价' }
    ],
    orders: [],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false
  },

  onLoad(options) {
    if (options.status) {
      this.setData({ activeTab: options.status });
    }
    this.loadOrders();
  },

  onShow() {
    if (app.globalData.token) {
      this.loadOrders(true);
    }
  },

  async loadOrders(reset = false) {
    if (!app.globalData.token) return;
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const page = reset ? 1 : this.data.page;
      const data = await app.request({
        url: '/order',
        data: {
          status: this.data.activeTab,
          page,
          pageSize: this.data.pageSize
        }
      });

      data.list.forEach(item => {
        item.statusText = app.getOrderStatusText(item.status);
        if (item.companion_info) {
          item.companion_info = typeof item.companion_info === 'string' 
            ? JSON.parse(item.companion_info) 
            : item.companion_info;
        }
      });

      this.setData({
        orders: reset ? data.list : [...this.data.orders, ...data.list],
        total: data.total,
        page: reset ? 2 : this.data.page + 1,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeTab: key, page: 1 });
    this.loadOrders(true);
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    });
  },

  goBooking() {
    wx.navigateTo({
      url: '/pages/booking/booking'
    });
  },

  onReachBottom() {
    if (this.data.orders.length < this.data.total) {
      this.loadOrders();
    }
  },

  onPullDownRefresh() {
    this.loadOrders(true).then(() => {
      wx.stopPullDownRefresh();
    });
  }
})
