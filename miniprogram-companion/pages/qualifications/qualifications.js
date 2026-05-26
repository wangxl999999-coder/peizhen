Page({
  data: {
    qualifications: [],
    statusMap: {
      0: '待审核',
      1: '已通过',
      2: '已拒绝'
    },
    typeOptions: [
      { value: 'nurse_license', label: '护士执业证书' },
      { value: 'doctor_license', label: '医师资格证书' },
      { value: 'health_cert', label: '健康证' },
      { value: 'training_cert', label: '培训证书' },
      { value: 'other', label: '其他资质' }
    ]
  },

  onShow() {
    this.loadQualifications();
  },

  async loadQualifications() {
    try {
      const app = getApp();
      const data = await app.request({
        url: '/companion/qualifications'
      });
      this.setData({ qualifications: data });
    } catch (err) {
      console.error('获取资质列表失败:', err);
    }
  },

  goToAdd() {
    wx.navigateTo({ url: '/pages/qualification-add/qualification-add' });
  },

  async deleteQualification(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除该资质吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const app = getApp();
            await app.request({
              url: `/companion/qualifications/${id}`,
              method: 'DELETE'
            });
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadQualifications();
          } catch (err) {
            console.error('删除资质失败:', err);
          }
        }
      }
    });
  },

  getTypeLabel(type) {
    const option = this.data.typeOptions.find(o => o.value === type);
    return option ? option.label : type;
  }
});
