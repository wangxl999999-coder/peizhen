const app = getApp();

Page({
  data: {
    patients: [],
    loading: false
  },

  onShow() {
    if (app.globalData.token) {
      this.loadPatients();
    }
  },

  async loadPatients() {
    this.setData({ loading: true });
    try {
      const data = await app.request({ url: '/user/patients' });
      this.setData({ patients: data, loading: false });
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载就诊人失败', err);
    }
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/patient-edit/patient-edit' });
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/patient-edit/patient-edit?id=${id}` });
  },

  async setDefault(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await app.request({
        url: `/user/patients/${id}/default`,
        method: 'POST'
      });
      wx.showToast({ title: '设置成功', icon: 'success' });
      this.loadPatients();
    } catch (err) {
      console.error('设置默认失败', err);
    }
  },

  async deletePatient(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '提示',
      content: '确定删除该就诊人吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.request({
              url: `/user/patients/${id}`,
              method: 'DELETE'
            });
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadPatients();
          } catch (err) {
            console.error('删除失败', err);
          }
        }
      }
    });
  }
})
