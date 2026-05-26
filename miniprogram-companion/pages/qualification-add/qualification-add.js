Page({
  data: {
    typeIndex: 0,
    typeOptions: [
      { value: 'nurse_license', label: '护士执业证书' },
      { value: 'doctor_license', label: '医师资格证书' },
      { value: 'health_cert', label: '健康证' },
      { value: 'training_cert', label: '培训证书' },
      { value: 'other', label: '其他资质' }
    ],
    certNo: '',
    issueDate: '',
    expireDate: '',
    images: [],
    isSubmitting: false
  },

  onTypeChange(e) {
    this.setData({ typeIndex: parseInt(e.detail.value) });
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
  },

  onDateChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
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
    const { typeIndex, typeOptions, certNo, images, isSubmitting } = this.data;

    if (isSubmitting) return;

    if (!certNo.trim()) {
      wx.showToast({ title: '请输入证书编号', icon: 'none' });
      return;
    }

    if (images.length === 0) {
      wx.showToast({ title: '请上传证书照片', icon: 'none' });
      return;
    }

    try {
      this.setData({ isSubmitting: true });
      const app = getApp();
      
      await app.request({
        url: '/companion/qualifications',
        method: 'POST',
        data: {
          type: typeOptions[typeIndex].value,
          type_name: typeOptions[typeIndex].label,
          cert_no: certNo.trim(),
          issue_date: this.data.issueDate,
          expire_date: this.data.expireDate,
          images: images.join(',')
        }
      });

      wx.showToast({ title: '提交成功，等待审核', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('提交资质失败:', err);
      this.setData({ isSubmitting: false });
    }
  }
});
