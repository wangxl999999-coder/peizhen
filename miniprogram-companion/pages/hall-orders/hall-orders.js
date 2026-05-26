Page({
  data: {
    activeTab: 'nearby',
    tabs: [
      { key: 'nearby', label: '附近订单' },
      { key: 'recommend', label: '推荐订单' },
      { key: 'all', label: '全部订单' }
    ],
    orders: [],
    loading: false,
    refreshing: false,
    noMore: false,
    page: 1,
    pageSize: 10,
    latitude: null,
    longitude: null
  },

  onLoad() {
    this.getLocation();
  },

  onShow() {
    if (this.data.latitude && this.data.longitude) {
      this.loadOrders(true);
    }
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadOrders(true).finally(() => {
      wx.stopPullDownRefresh();
      this.setData({ refreshing: false });
    });
  },

  onReachBottom() {
    if (!this.data.loading && !this.data.noMore) {
      this.loadOrders(false);
    }
  },

  async getLocation() {
    try {
      const res = await wx.getLocation({
        type: 'gcj02'
      });
      this.setData({
        latitude: res.latitude,
        longitude: res.longitude
      });
      this.loadOrders(true);
    } catch (err) {
      console.error('获取位置失败:', err);
      wx.showToast({ title: '获取位置失败，无法显示附近订单', icon: 'none' });
      this.setData({ activeTab: 'all' });
      this.loadOrders(true);
    }
  },

  onTabChange(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ activeTab: key });
    this.loadOrders(true);
  },

  async loadOrders(refresh = false) {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });
      const app = getApp();
      
      const page = refresh ? 1 : this.data.page;
      const data = await app.request({
        url: '/companion/hall-orders',
        data: {
          type: this.data.activeTab,
          page,
          pageSize: this.data.pageSize,
          latitude: this.data.latitude,
          longitude: this.data.longitude
        }
      });

      const newOrders = data.list || [];
      
      if (refresh) {
        this.setData({
          orders: newOrders,
          page: 1,
          noMore: newOrders.length < this.data.pageSize
        });
      } else {
        this.setData({
          orders: [...this.data.orders, ...newOrders],
          page: page + 1,
          noMore: newOrders.length < this.data.pageSize
        });
      }
    } catch (err) {
      console.error('加载订单列表失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  goToOrderDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` });
  },

  async grabOrder(e) {
    e.stopPropagation();
    const { id } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认抢单',
      content: '确定要抢这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const app = getApp();
            await app.request({
              url: `/companion/orders/${id}/grab`,
              method: 'POST'
            });
            wx.showToast({ title: '抢单成功', icon: 'success' });
            this.loadOrders(true);
          } catch (err) {
            console.error('抢单失败:', err);
          }
        }
      }
    });
  }
});
