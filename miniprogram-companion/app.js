App({
  globalData: {
    baseUrl: 'http://localhost:3000/api',
    token: '',
    userInfo: null,
    currentCity: '北京'
  },

  onLaunch() {
    const token = wx.getStorageSync('companionToken');
    const userInfo = wx.getStorageSync('companionInfo');
    if (token) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    }
  },

  login() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: async (res) => {
          if (res.code) {
            try {
              const result = await this.request({
                url: '/auth/companion/login',
                method: 'POST',
                data: { code: res.code },
                showLoading: false
              });

              if (result.token) {
                this.globalData.token = result.token;
                wx.setStorageSync('companionToken', result.token);
                
                if (result.user) {
                  this.globalData.userInfo = result.user;
                  wx.setStorageSync('companionInfo', result.user);
                }
                resolve(result);
              }
            } catch (err) {
              reject(err);
            }
          }
        },
        fail: reject
      });
    });
  },

  async request({ url, method = 'GET', data = {}, showLoading = true }) {
    if (showLoading) {
      wx.showLoading({ title: '加载中...', mask: true });
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.baseUrl}${url}`,
        method,
        data,
        header: {
          'Authorization': this.globalData.token ? `Bearer ${this.globalData.token}` : '',
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (showLoading) wx.hideLoading();
          
          if (res.statusCode === 200) {
            if (res.data.code === 0) {
              resolve(res.data.data);
            } else if (res.data.code === 401) {
              wx.removeStorageSync('companionToken');
              wx.removeStorageSync('companionInfo');
              wx.reLaunch({ url: '/pages/login/login' });
              reject(res.data);
            } else {
              wx.showToast({
                title: res.data.message || '请求失败',
                icon: 'none'
              });
              reject(res.data);
            }
          } else {
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            });
            reject(res);
          }
        },
        fail: (err) => {
          if (showLoading) wx.hideLoading();
          wx.showToast({
            title: '网络连接失败',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  },

  formatOrderStatus(status) {
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
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
})
