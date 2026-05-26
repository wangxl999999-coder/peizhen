const app = getApp();

Page({
  data: {
    companion: null,
    loading: true
  },

  onLoad(options) {
    this.companionId = options.id;
    this.loadCompanionDetail();
  },

  async loadCompanionDetail() {
    try {
      const data = await app.request({
        url: `/companion/${this.companionId}`
      });

      if (data.skills && Array.isArray(data.skills)) {
        data.skillList = data.skills;
      }
      if (data.cases) {
        data.cases.forEach(item => {
          if (item.images) {
            item.imageList = item.images.split(',');
          }
        });
      }
      if (data.evaluations) {
        data.evaluations.forEach(item => {
          if (item.tags) {
            item.tagList = typeof item.tags === 'string' ? item.tags.split(',') : item.tags;
          }
        });
      }

      this.setData({
        companion: data,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载陪诊师详情失败', err);
    }
  },

  goBooking() {
    wx.navigateTo({
      url: `/pages/booking/booking?companion_id=${this.companionId}`
    });
  },

  callCompanion() {
    if (this.data.companion && this.data.companion.phone) {
      wx.makePhoneCall({ phoneNumber: this.data.companion.phone });
    } else {
      wx.showToast({ title: '暂无联系方式', icon: 'none' });
    }
  },

  previewImage(e) {
    const urls = e.currentTarget.dataset.urls;
    const current = e.currentTarget.dataset.current;
    wx.previewImage({ urls, current });
  }
})
