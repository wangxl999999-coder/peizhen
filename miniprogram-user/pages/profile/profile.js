const app = getApp();

Page({
  data: {
    userInfo: null,
    orderCount: {
      pending_accept: 0,
      pending_service: 0,
      in_service: 0,
      pending_evaluation: 0
    }
  },

  onShow() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  goProfileEdit() {
    if (!app.globalData.token) {
      this.goLogin();
      return;
    }
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' });
  },

  goPatient() {
    if (!app.globalData.token) {
      this.goLogin();
      return;
    }
    wx.navigateTo({ url: '/pages/patient/patient' });
  },

  goOrderList(e) {
    if (!app.globalData.token) {
      this.goLogin();
      return;
    }
    const status = e.currentTarget.dataset.status || 'all';
    wx.navigateTo({ url: `/pages/order-list/order-list?status=${status}` });
  },

  goMedicalHistory() {
    if (!app.globalData.token) {
      this.goLogin();
      return;
    }
    wx.navigateTo({ url: '/pages/medical-history/medical-history' });
  },

  goFaq() {
    wx.navigateTo({ url: '/pages/faq/faq' });
  },

  goComplaint() {
    if (!app.globalData.token) {
      this.goLogin();
      return;
    }
    wx.navigateTo({ url: '/pages/complaint/complaint' });
  },

  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-888-8888\n工作时间：9:00-21:00',
      confirmText: '拨打',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({ phoneNumber: '4008888888' });
        }
      }
    });
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearUserInfo();
          this.setData({ userInfo: null });
          wx.showToast({ title: '已退出登录', icon: 'none' });
        }
      }
    });
  }
})
