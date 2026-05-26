Page({
  data: {
    typeIndex: 0,
    typeOptions: [
      { value: 'service', label: '服务投诉' },
      { value: 'platform', label: '平台投诉' },
      { value: 'suggestion', label: '功能建议' },
      { value: 'other', label: '其他问题' }
    ],
    content: '',
    images: [],
    contact: '',
    isSubmitting: false
  },

  onTypeChange(e) {
    this.setData({ typeIndex: parseInt(e.detail.value) });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onContactInput(e) {
    this.setData({ contact: e.detail.value });
  },

  async chooseImages() {
    const { images } = this.data;
    const maxCount = 3 - images.length;
    
    if (maxCount <= 0) {
      wx.showToast({ title: '最多上传3张图片', icon: 'none' });
      return;
    }

    try {
      const res = await wx.chooseMedia({
        count: maxCount,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      });

      const tempFiles = res.tempFiles.map(f => f.tempFilePath);
      this.uploadImages(tempFiles);
    } catch (err) {
      console.error('选择图片失败:', err);
    }
  },

  async uploadImages(filePaths) {
    try {
      const app = getApp();
      wx.showLoading({ title: '上传中...', mask: true });

      const uploadPromises = filePaths.map(filePath => {
        return new Promise((resolve, reject) => {
          wx.uploadFile({
            url: `${app.globalData.baseUrl}/common/upload`,
            filePath,
            name: 'file',
            header: {
              'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : ''
            },
            success: (res) => {
              const data = JSON.parse(res.data);
              if (data.code === 200) {
                resolve(data.data.url);
              } else {
                reject(data);
              }
            },
            fail: reject
          });
        });
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      wx.hideLoading();
      
      this.setData({
        images: [...this.data.images, ...uploadedUrls]
      });
    } catch (err) {
      wx.hideLoading();
      console.error('上传图片失败:', err);
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  removeImage(e) {
    const { index } = e.currentTarget.dataset;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  async submit() {
    const { typeIndex, typeOptions, content, images, contact, isSubmitting } = this.data;

    if (isSubmitting) return;

    if (!content.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }

    if (content.trim().length < 10) {
      wx.showToast({ title: '反馈内容至少10个字', icon: 'none' });
      return;
    }

    try {
      this.setData({ isSubmitting: true });
      const app = getApp();
      
      await app.request({
        url: '/companion/complaints',
        method: 'POST',
        data: {
          type: typeOptions[typeIndex].value,
          type_name: typeOptions[typeIndex].label,
          content: content.trim(),
          images: images.join(','),
          contact: contact.trim()
        }
      });

      wx.showToast({ title: '提交成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('提交失败:', err);
      this.setData({ isSubmitting: false });
    }
  }
});
