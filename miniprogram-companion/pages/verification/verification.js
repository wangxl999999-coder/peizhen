Page({
  data: {
    verification: null,
    realName: '',
    idCard: '',
    idCardFront: '',
    idCardBack: '',
    facePhoto: '',
    isSubmitting: false,
    statusMap: {
      0: '待审核',
      1: '已通过',
      2: '已拒绝'
    }
  },

  onLoad() {
    this.loadVerification();
  },

  async loadVerification() {
    try {
      const app = getApp();
      const data = await app.request({
        url: '/companion/verification'
      });
      this.setData({
        verification: data,
        realName: data?.real_name || '',
        idCard: data?.id_card || '',
        idCardFront: data?.id_card_front || '',
        idCardBack: data?.id_card_back || '',
        facePhoto: data?.face_photo || ''
      });
    } catch (err) {
      console.error('获取实名认证信息失败:', err);
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
  },

  async chooseImage(e) {
    const { field } = e.currentTarget.dataset;
    
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      });

      const tempFilePath = res.tempFiles[0].tempFilePath;
      this.uploadImage(field, tempFilePath);
    } catch (err) {
      console.error('选择图片失败:', err);
    }
  },

  async uploadImage(field, filePath) {
    try {
      const app = getApp();
      wx.showLoading({ title: '上传中...', mask: true });

      const res = await new Promise((resolve, reject) => {
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
              resolve(data.data);
            } else {
              reject(data);
            }
          },
          fail: reject
        });
      });

      wx.hideLoading();
      this.setData({
        [field]: res.url
      });
    } catch (err) {
      wx.hideLoading();
      console.error('上传图片失败:', err);
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  async takeFacePhoto() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera'],
        camera: 'front',
        sizeType: ['compressed']
      });

      const tempFilePath = res.tempFiles[0].tempFilePath;
      this.uploadImage('facePhoto', tempFilePath);
    } catch (err) {
      console.error('拍照失败:', err);
    }
  },

  async submit() {
    const { realName, idCard, idCardFront, idCardBack, facePhoto, isSubmitting } = this.data;

    if (isSubmitting) return;

    if (!realName.trim()) {
      wx.showToast({ title: '请输入真实姓名', icon: 'none' });
      return;
    }

    if (!/^\d{17}[\dXx]$/.test(idCard)) {
      wx.showToast({ title: '请输入正确的身份证号', icon: 'none' });
      return;
    }

    if (!idCardFront) {
      wx.showToast({ title: '请上传身份证正面照', icon: 'none' });
      return;
    }

    if (!idCardBack) {
      wx.showToast({ title: '请上传身份证反面照', icon: 'none' });
      return;
    }

    if (!facePhoto) {
      wx.showToast({ title: '请上传人脸识别照片', icon: 'none' });
      return;
    }

    try {
      this.setData({ isSubmitting: true });
      const app = getApp();
      
      await app.request({
        url: '/companion/verification',
        method: 'POST',
        data: {
          real_name: realName.trim(),
          id_card: idCard.trim(),
          id_card_front: idCardFront,
          id_card_back: idCardBack,
          face_photo: facePhoto
        }
      });

      wx.showToast({ title: '提交成功，等待审核', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('提交实名认证失败:', err);
      this.setData({ isSubmitting: false });
    }
  }
});
