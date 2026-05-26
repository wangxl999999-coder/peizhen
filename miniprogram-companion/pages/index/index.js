const app = getApp();

Page({
  data: {
    userInfo: null,
    statistics: null,
    todayOrders: [],
    loading: true
  },

  onShow() {
    if (!app.globalData.token) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [userRes, statsRes, ordersRes] = await Promise.all([
        app.request({ url: '/companion/profile' }),
        app.request({ url: '/companion/statistics' }),
        app.request({ url: '/companion/orders/today' })
      ]);

      this.setData({
        userInfo: userRes,
        statistics: statsRes,
        todayOrders: ordersRes || [],
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载数据失败', err);
    }
  },

  goOrderList() {
    wx.switchTab({ url: '/pages/order-list/order-list' });
  },

  goServiceRecord() {
    wx.switchTab({ url: '/pages/service-record/service-record' });
  },

  goIncome() {
    wx.navigateTo({ url: '/pages/income/income' });
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  goOrderDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` });
  },

  async acceptOrder(e) {
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
            this.loadData();
          } catch (err) {
            console.error('接单失败', err);
          }
        }
      }
    });
  },

  async startService(e) {
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
            this.loadData();
          } catch (err) {
            console.error('开始服务失败', err);
          }
        }
      }
    });
  },

  async completeService(e) {
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
            this.loadData();
          } catch (err) {
            console.error('完成服务失败', err);
          }
        }
      }
    });
  }
})
