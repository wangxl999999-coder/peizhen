const app = getApp();

Page({
  data: {
    form: {
      real_name: '',
      gender: 1,
      age: 0,
      phone: '',
      id_card: '',
      qualification: '',
      experience: 0,
      intro: '',
      city: '',
      online_status: 1
    },
    genderIndex: 0
  },

  onLoad() {
    this.loadProfile();
  },

  async loadProfile() {
    try {
      const data = await app.request({ url: '/companion/profile' });
      this.setData({
        form: { ...this.data.form, ...data },
        genderIndex: data.gender === 1 ? 0 : 1
      });
    } catch (err) {
      console.error('加载个人信息失败', err);
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
      'form.gender': index === 0 ? 1 : 2
    });
  },

  async save() {
    if (!this.data.form.real_name) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      await app.request({
        url: '/companion/profile',
        method: 'PUT',
        data: this.data.form
      });

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
