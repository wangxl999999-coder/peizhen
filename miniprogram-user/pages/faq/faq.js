const app = getApp();

Page({
  data: {
    faqList: [],
    expandedId: null
  },

  onLoad() {
    this.loadFaqs();
  },

  async loadFaqs() {
    try {
      const data = await app.request({ url: '/common/faqs' });
      this.setData({ faqList: data });
    } catch (err) {
      console.error('加载FAQ失败', err);
    }
  },

  toggleExpand(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      expandedId: this.data.expandedId === id ? null : id
    });
  }
})
