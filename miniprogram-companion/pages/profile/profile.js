const app = getApp();

Page({
  data: {
    userInfo: null
  },

  onShow() {
    if (!app.globalData.token) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    this.loadProfile();
  },

  async loadProfile() {
    try {
      const data = await app.request({ url: '/companion/profile' });
      this.setData({ userInfo: data });
    } catch (err) {
      console.error('加载个人信息失败', err);
    }
  },

  goEdit() {
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' });
  },

  goSkills() {
    wx.navigateTo({ url: '/pages/skills/skills' });
  },

  goIncome() {
    wx.navigateTo({ url: '/pages/income/income' });
  },

  goServiceRecord() {
    wx.switchTab({ url: '/pages/service-record/service-record' });
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.globalData.token = '';
          app.globalData.userInfo = null;
          wx.removeStorageSync('companionToken');
          wx.removeStorageSync('companionInfo');
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  }
})
