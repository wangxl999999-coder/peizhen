const app = getApp();

Page({
  data: {
    type: 'complaint',
    reason: '',
    description: ''
  },

  onReasonInput(e) {
    this.setData({ reason: e.detail.value });
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  async submit() {
    if (!this.data.reason) {
      wx.showToast({ title: '请输入投诉原因', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...' });

    try {
      await app.request({
        url: '/order/after-sales',
        method: 'POST',
        data: {
          order_id: 0,
          type: 'complaint',
          reason: this.data.reason,
          description: this.data.description
        }
      });

      wx.hideLoading();
      wx.showToast({ title: '提交成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      wx.hideLoading();
    }
  }
})
