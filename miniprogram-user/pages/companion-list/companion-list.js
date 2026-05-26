const app = getApp();

Page({
  data: {
    companions: [],
    city: '',
    serviceType: '',
    sort: 'rating',
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false
  },

  onLoad(options) {
    if (options.service_type) {
      this.setData({ serviceType: options.service_type });
    }
    this.setData({ city: app.globalData.currentCity });
    this.loadCompanions();
  },

  async loadCompanions(reset = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const page = reset ? 1 : this.data.page;
      const data = await app.request({
        url: '/companion',
        data: {
          city: this.data.city,
          service_type: this.data.serviceType,
          sort: this.data.sort,
          page,
          pageSize: this.data.pageSize
        }
      });

      this.setData({
        companions: reset ? data.list : [...this.data.companions, ...data.list],
        total: data.total,
        page: reset ? 2 : this.data.page + 1,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  changeSort(e) {
    const sort = e.currentTarget.dataset.sort;
    this.setData({ sort, page: 1 });
    this.loadCompanions(true);
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/companion-detail/companion-detail?id=${id}`
    });
  },

  onReachBottom() {
    if (this.data.companions.length < this.data.total) {
      this.loadCompanions();
    }
  }
})
