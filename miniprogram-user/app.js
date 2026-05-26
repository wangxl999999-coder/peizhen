App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl: 'http://localhost:3000/api',
    currentCity: '北京'
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token) {
      this.globalData.token = token;
    }
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }

    const city = wx.getStorageSync('currentCity');
    if (city) {
      this.globalData.currentCity = city;
    }
  },

  setUserInfo(userInfo, token) {
    this.globalData.userInfo = userInfo;
    this.globalData.token = token;
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('token', token);
  },

  clearUserInfo() {
    this.globalData.userInfo = null;
    this.globalData.token = '';
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
  },

  setCurrentCity(city) {
    this.globalData.currentCity = city;
    wx.setStorageSync('currentCity', city);
  },

  request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.globalData.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'content-type': 'application/json',
          'Authorization': 'Bearer ' + this.globalData.token
        },
        success: (res) => {
          if (res.data.code === 200) {
            resolve(res.data.data);
          } else if (res.data.code === 401) {
            this.clearUserInfo();
            wx.showToast({
              title: '请先登录',
              icon: 'none'
            });
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/login/login'
              });
            }, 1500);
            reject(res.data);
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            });
            reject(res.data);
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '网络请求失败',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  },

  login() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: async (res) => {
          if (res.code) {
            try {
              const data = await this.request({
                url: '/auth/wechat-login',
                method: 'POST',
                data: {
                  code: res.code,
                  role: 'user'
                }
              });
              this.setUserInfo(data.userInfo, data.token);
              resolve(data);
            } catch (err) {
              reject(err);
            }
          } else {
            reject(res);
          }
        },
        fail: reject
      });
    });
  },

  getOrderStatusText(status) {
    const statusMap = {
      'pending_accept': '待接单',
      'pending_service': '待服务',
      'in_service': '服务中',
      'pending_evaluation': '待评价',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  },

  formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
})
