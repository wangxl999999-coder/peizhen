Page({
  data: {
    trainingId: null,
    training: null,
    loading: false
  },

  onLoad(options) {
    this.setData({ trainingId: parseInt(options.id) });
    this.loadTrainingDetail();
  },

  async loadTrainingDetail() {
    try {
      this.setData({ loading: true });
      const app = getApp();
      const data = await app.request({
        url: `/companion/trainings/${this.data.trainingId}`
      });
      this.setData({ training: data });
    } catch (err) {
      console.error('加载培训详情失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  }
});
