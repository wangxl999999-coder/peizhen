const app = getApp();

Page({
  data: {
    order: null,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.orderId = options.id;
      this.loadOrderDetail();
    }
  },

  onShow() {
    if (this.orderId) {
      this.loadOrderDetail();
    }
  },

  async loadOrderDetail() {
    this.setData({ loading: true });
    try {
      const data = await app.request({
        url: `/companion/orders/${this.orderId}`
      });

      data.status_text = app.formatOrderStatus(data.status);
      data.medication_list = data.medication_list ? JSON.parse(data.medication_list) : [];

      this.setData({
        order: data,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载订单详情失败', err);
    }
  },

  async acceptOrder() {
    wx.showModal({
      title: '确认接单',
      content: '确定要接受此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/companion/orders/${this.orderId}/accept`,
              method: 'POST'
            });
            wx.showToast({ title: '接单成功', icon: 'success' });
            this.loadOrderDetail();
          } catch (err) {
            console.error('接单失败', err);
          }
        }
      }
    });
  },

  async startService() {
    wx.showModal({
      title: '开始服务',
      content: '确定要开始服务吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/companion/orders/${this.orderId}/start`,
              method: 'POST'
            });
            wx.showToast({ title: '服务已开始', icon: 'success' });
            this.loadOrderDetail();
          } catch (err) {
            console.error('开始服务失败', err);
          }
        }
      }
    });
  },

  async completeService() {
    wx.showModal({
      title: '完成服务',
      content: '确定要结束服务吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/companion/orders/${this.orderId}/complete`,
              method: 'POST'
            });
            wx.showToast({ title: '服务已完成', icon: 'success' });
            this.loadOrderDetail();
          } catch (err) {
            console.error('完成服务失败', err);
          }
        }
      }
    });
  },

  callUser() {
    if (this.data.order && this.data.order.user_phone) {
      wx.makePhoneCall({ phoneNumber: this.data.order.user_phone });
    }
  }
})
