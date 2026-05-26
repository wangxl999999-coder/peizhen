const app = getApp();

Page({
  data: {
    loading: false
  },

  async wechatLogin() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    wx.showLoading({ title: '登录中...' });

    try {
      await app.login();
      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }

    this.setData({ loading: false });
  },

  goBack() {
    wx.switchTab({ url: '/pages/index/index' });
  }
})
