const app = getApp();

Page({
  data: {
    hotCities: [],
    allCities: {},
    currentCity: '北京'
  },

  onLoad() {
    this.setData({ currentCity: app.globalData.currentCity });
    this.loadCities();
  },

  async loadCities() {
    try {
      const data = await app.request({ url: '/common/cities' });
      this.setData({
        hotCities: data.hot_cities || [],
        allCities: data.all_cities || {}
      });
    } catch (err) {
      console.error('加载城市列表失败', err);
    }
  },

  selectCity(e) {
    const city = e.currentTarget.dataset.city;
    app.setCurrentCity(city);
    this.setData({ currentCity: city });
    wx.showToast({ title: `已切换到${city}`, icon: 'none' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' });
    }, 1500);
  }
})
