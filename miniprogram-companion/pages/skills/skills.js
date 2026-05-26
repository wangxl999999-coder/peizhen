const app = getApp();

Page({
  data: {
    skills: [],
    allSkills: [
      '全程陪诊', '代挂号', '代取药', '代取报告', '代问诊', 
      '住院陪诊', '术后陪诊', '产检陪诊', '老年护理', '儿童陪护',
      '心理疏导', '康复训练', '饮食指导', '用药指导', '基础护理'
    ],
    selectedSkills: []
  },

  onLoad() {
    this.loadSkills();
  },

  async loadSkills() {
    try {
      const data = await app.request({ url: '/companion/skills' });
      this.setData({
        skills: data.skills || [],
        selectedSkills: data.skills || []
      });
    } catch (err) {
      console.error('加载技能失败', err);
    }
  },

  toggleSkill(e) {
    const skill = e.currentTarget.dataset.skill;
    let selectedSkills = [...this.data.selectedSkills];
    const index = selectedSkills.indexOf(skill);
    if (index > -1) {
      selectedSkills.splice(index, 1);
    } else {
      selectedSkills.push(skill);
    }
    this.setData({ selectedSkills });
  },

  async save() {
    wx.showLoading({ title: '保存中...' });

    try {
      await app.request({
        url: '/companion/skills',
        method: 'PUT',
        data: { skills: this.data.selectedSkills.join(',') }
      });

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      wx.hideLoading();
    }
  }
})
