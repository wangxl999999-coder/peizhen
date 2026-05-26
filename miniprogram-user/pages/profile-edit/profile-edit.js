const app = getApp();

Page({
  data: {
    form: {
      nickname: '',
      avatar: '',
      gender: 0,
      phone: '',
      real_name: '',
      id_card: ''
    },
    genderIndex: 0
  },

  onLoad() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        form: {
          ...this.data.form,
          ...userInfo,
          gender: userInfo.gender || 0
        },
        genderIndex: userInfo.gender || 0
      });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  selectGender(e) {
    const index = e.detail.value;
    this.setData({
      genderIndex: index,
      'form.gender': index
    });
  },

  async save() {
    wx.showLoading({ title: '保存中...' });

    try {
      await app.request({
        url: '/user/info',
        method: 'POST',
        data: this.data.form
      });

      const userInfo = wx.getStorageSync('userInfo');
      wx.setStorageSync('userInfo', { ...userInfo, ...this.data.form });

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      wx.hideLoading();
    }
  }
})
