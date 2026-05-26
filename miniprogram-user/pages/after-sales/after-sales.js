const app = getApp();

Page({
  data: {
    orderId: '',
    form: {
      type: 'refund',
      reason: '',
      description: '',
      images: []
    }
  },

  onLoad(options) {
    if (options.orderId) {
      this.setData({ orderId: options.orderId });
    }
  },

  onTypeChange(e) {
    this.setData({
      'form.type': e.detail.value
    });
  },

  onReasonInput(e) {
    this.setData({
      'form.reason': e.detail.value
    });
  },

  onDescriptionInput(e) {
    this.setData({
      'form.description': e.detail.value
    });
  },

  chooseImage() {
    wx.chooseImage({
      count: 3 - this.data.form.images.length,
      success: (res) => {
        this.setData({
          'form.images': [...this.data.form.images, ...res.tempFilePaths]
        });
      }
    });
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.form.images.filter((_, i) => i !== index);
    this.setData({
      'form.images': images
    });
  },

  async submit() {
    if (!this.data.form.reason) {
      wx.showToast({ title: '请输入问题原因', icon: 'none' });
      return;
    }

    try {
      await app.request({
        url: '/order/after-sales',
        method: 'POST',
        data: {
          order_id: this.data.orderId,
          ...this.data.form
        }
      });

      wx.showToast({ title: '提交成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('提交售后失败', err);
    }
  }
});
