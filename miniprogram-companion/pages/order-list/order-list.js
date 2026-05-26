const app = getApp();

Page({
  data: {
    tabs: [
      { status: 'all', label: '全部' },
      { status: 'pending_accept', label: '待接单' },
      { status: 'pending_service', label: '待服务' },
      { status: 'in_service', label: '服务中' },
      { status: 'pending_evaluation', label: '待评价' },
      { status: 'completed', label: '已完成' },
      { status: 'cancelled', label: '已取消' }
    ],
    currentTab: 0,
    orders: [],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false
  },

  onShow() {
    if (app.globalData.token) {
      this.loadOrders(true);
    }
  },

  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentTab: index,
      page: 1
    });
    this.loadOrders(true);
  },

  async loadOrders(reset = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const status = this.data.tabs[this.data.currentTab].status;
      const page = reset ? 1 : this.data.page;
      const data = await app.request({
        url: '/companion/orders',
        data: { status, page, pageSize: this.data.pageSize }
      });

      data.list.forEach(item => {
        item.status_text = app.formatOrderStatus(item.status);
      });

      this.setData({
        orders: reset ? data.list : [...this.data.orders, ...data.list],
        total: data.total,
        page: reset ? 2 : this.data.page + 1,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载订单失败', err);
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` });
  },

  async acceptOrder(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认接单',
      content: '确定要接受此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/companion/orders/${id}/accept`,
              method: 'POST'
            });
            wx.showToast({ title: '接单成功', icon: 'success' });
            this.loadOrders(true);
          } catch (err) {
            console.error('接单失败', err);
          }
        }
      }
    });
  },

  async startService(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '开始服务',
      content: '确定要开始服务吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/companion/orders/${id}/start`,
              method: 'POST'
            });
            wx.showToast({ title: '服务已开始', icon: 'success' });
            this.loadOrders(true);
          } catch (err) {
            console.error('开始服务失败', err);
          }
        }
      }
    });
  },

  async completeService(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '完成服务',
      content: '确定要结束服务吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/companion/orders/${id}/complete`,
              method: 'POST'
            });
            wx.showToast({ title: '服务已完成', icon: 'success' });
            this.loadOrders(true);
          } catch (err) {
            console.error('完成服务失败', err);
          }
        }
      }
    });
  },

  onReachBottom() {
    if (this.data.orders.length < this.data.total) {
      this.loadOrders();
    }
  }
})
