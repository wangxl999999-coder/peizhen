const app = getApp();

Page({
  data: {
    incomeData: null,
    monthList: [],
    loading: true
  },

  onLoad() {
    this.loadIncome();
  },

  async loadIncome() {
    this.setData({ loading: true });
    try {
      const data = await app.request({ url: '/companion/income' });
      this.setData({
        incomeData: data,
        monthList: data.month_list || [],
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载收入数据失败', err);
    }
  }
})
