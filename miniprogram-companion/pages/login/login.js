const app = getApp();

Page({
  data: {
    loading: false,
    form: {
      phone: '',
      code: '',
      password: ''
    },
    codeText: '获取验证码',
    codeCountdown: 0
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  async getCode() {
    if (this.data.codeCountdown > 0) return;
    if (!this.data.form.phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }

    try {
      await app.request({
        url: '/auth/companion/send-code',
        method: 'POST',
        data: { phone: this.data.form.phone }
      });

      wx.showToast({ title: '验证码已发送', icon: 'success' });

      this.data.codeCountdown = 60;
      this.timer = setInterval(() => {
        this.data.codeCountdown--;
        if (this.data.codeCountdown <= 0) {
          clearInterval(this.timer);
          this.setData({ codeText: '获取验证码', codeCountdown: 0 });
        } else {
          this.setData({
            codeText: `${this.data.codeCountdown}s后重发`,
            codeCountdown: this.data.codeCountdown
          });
        }
      }, 1000);
    } catch (err) {
      console.error('获取验证码失败', err);
    }
  },

  async login() {
    if (!this.data.form.phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!this.data.form.code) {
      wx.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const data = await app.request({
        url: '/auth/companion/login',
        method: 'POST',
        data: this.data.form,
        showLoading: false
      });

      if (data.token) {
        app.globalData.token = data.token;
        wx.setStorageSync('companionToken', data.token);
        
        if (data.user) {
          app.globalData.userInfo = data.user;
          wx.setStorageSync('companionInfo', data.user);
        }

        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' });
        }, 1500);
      }
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  async wxLogin() {
    this.setData({ loading: true });

    try {
      const data = await app.login();
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } catch (err) {
      this.setData({ loading: false });
    }
  }
})
