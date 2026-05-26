const app = getApp();

Page({
  data: {
    orderId: '',
    rating: 5,
    content: '',
    tagOptions: ['服务专业', '态度亲切', '准时到达', '沟通顺畅', '经验丰富', '细心周到'],
    selectedTags: [],
    isAnonymous: false
  },

  onLoad(options) {
    if (options.order_id) {
      this.setData({ orderId: options.order_id });
    }
  },

  setRating(e) {
    const rating = e.currentTarget.dataset.rating;
    this.setData({ rating });
  },

  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag;
    let selectedTags = [...this.data.selectedTags];
    const index = selectedTags.indexOf(tag);
    if (index > -1) {
      selectedTags.splice(index, 1);
    } else {
      selectedTags.push(tag);
    }
    this.setData({ selectedTags });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  toggleAnonymous(e) {
    this.setData({ isAnonymous: e.detail.value });
  },

  async submit() {
    if (this.data.rating === 0) {
      wx.showToast({ title: '请选择评分', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...' });

    try {
      await app.request({
        url: '/order/evaluation',
        method: 'POST',
        data: {
          order_id: this.data.orderId,
          rating: this.data.rating,
          content: this.data.content,
          tags: this.data.selectedTags.join(','),
          is_anonymous: this.data.isAnonymous
        }
      });

      wx.hideLoading();
      wx.showToast({ title: '评价成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      wx.hideLoading();
    }
  }
})
