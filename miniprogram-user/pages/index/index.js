const app = getApp();

Page({
  data: {
    banners: [],
    services: [],
    recommendCompanions: [],
    nearbyCompanions: [],
    hotFaqs: [],
    currentCity: '北京',
    userInfo: null
  },

  onLoad() {
    this.loadHomeData();
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({
      userInfo: userInfo,
      currentCity: app.globalData.currentCity
    });
  },

  async loadHomeData() {
    try {
      const data = await app.request({
        url: '/common/home-data',
        method: 'GET',
        data: { city: this.data.currentCity }
      });
      this.setData({
        banners: data.banners || [],
        services: data.services || [],
        recommendCompanions: data.recommend_companions || [],
        hotFaqs: data.hot_faqs || []
      });
    } catch (err) {
      console.error('加载首页数据失败', err);
    }
  },

  async loadNearbyCompanions() {
    try {
      const data = await app.request({
        url: '/companion/nearby',
        method: 'GET',
        data: {
          city: this.data.currentCity,
          limit: 6
        }
      });
      this.setData({
        nearbyCompanions: data.list || []
      });
    } catch (err) {
      console.error('加载附近陪诊师失败', err);
    }
  },

  goService(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/booking/booking?service_type=${type}`
    });
  },

  goCompanionList() {
    wx.navigateTo({
      url: '/pages/companion-list/companion-list'
    });
  },

  goCompanionDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/companion-detail/companion-detail?id=${id}`
    });
  },

  goFaq() {
    wx.navigateTo({
      url: '/pages/faq/faq'
    });
  },

  goComplaint() {
    if (!app.globalData.token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/complaint/complaint'
    });
  },

  goCitySelect() {
    wx.navigateTo({
      url: '/pages/city-select/city-select'
    });
  },

  goService() {
    wx.navigateTo({
      url: '/pages/booking/booking'
    });
  },

  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-888-8888\n工作时间：9:00-21:00',
      confirmText: '拨打',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '4008888888'
          });
        }
      }
    });
  },

  onPullDownRefresh() {
    this.loadHomeData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
})
