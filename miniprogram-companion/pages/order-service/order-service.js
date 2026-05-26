Page({
  data: {
    orderId: null,
    order: null,
    checkins: [],
    nodes: [],
    files: [],
    loading: false,
    nodeContent: '',
    fileType: 'medical_report',
    fileTypeOptions: [
      { value: 'medical_report', label: '检查报告' },
      { value: 'payment_bill', label: '缴费单据' },
      { value: 'prescription', label: '处方单' },
      { value: 'other', label: '其他资料' }
    ]
  },

  onLoad(options) {
    this.setData({ orderId: parseInt(options.id) });
    this.loadOrderDetail();
  },

  onShow() {
    if (this.data.orderId) {
      this.loadOrderDetail();
    }
  },

  async loadOrderDetail() {
    try {
      this.setData({ loading: true });
      const app = getApp();
      
      const [order, checkins, nodes, files] = await Promise.all([
        app.request({ url: `/companion/orders/${this.data.orderId}` }),
        app.request({ url: `/companion/orders/${this.data.orderId}/checkins` }),
        app.request({ url: `/companion/orders/${this.data.orderId}/nodes` }),
        app.request({ url: `/companion/orders/${this.data.orderId}/files` })
      ]);

      this.setData({ order, checkins, nodes, files });
    } catch (err) {
      console.error('加载订单详情失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  async checkin(e) {
    const { type } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认打卡',
      content: type === 'start' ? '确认开始服务打卡？' : '确认结束服务打卡？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const app = getApp();
            await app.request({
              url: `/companion/orders/${this.data.orderId}/checkin`,
              method: 'POST',
              data: { type }
            });
            wx.showToast({ title: '打卡成功', icon: 'success' });
            this.loadOrderDetail();
          } catch (err) {
            console.error('打卡失败:', err);
          }
        }
      }
    });
  },

  onNodeInput(e) {
    this.setData({ nodeContent: e.detail.value });
  },

  async addNode() {
    const { nodeContent, orderId } = this.data;

    if (!nodeContent.trim()) {
      wx.showToast({ title: '请输入节点内容', icon: 'none' });
      return;
    }

    try {
      const app = getApp();
      await app.request({
        url: `/companion/orders/${orderId}/nodes`,
        method: 'POST',
        data: { content: nodeContent.trim() }
      });
      wx.showToast({ title: '添加成功', icon: 'success' });
      this.setData({ nodeContent: '' });
      this.loadOrderDetail();
    } catch (err) {
      console.error('添加节点失败:', err);
    }
  },

  async callPhone() {
    const { order } = this.data;
    if (!order?.user_phone) {
      wx.showToast({ title: '暂无联系电话', icon: 'none' });
      return;
    }

    try {
      await wx.makePhoneCall({
        phoneNumber: order.user_phone
      });
    } catch (err) {
      console.error('拨打电话失败:', err);
    }
  },

  navigateToHospital() {
    const { order } = this.data;
    if (!order?.hospital_name) {
      wx.showToast({ title: '暂无医院信息', icon: 'none' });
      return;
    }

    wx.openLocation({
      name: order.hospital_name,
      address: order.hospital_address || '',
      latitude: parseFloat(order.hospital_latitude) || 39.9,
      longitude: parseFloat(order.hospital_longitude) || 116.3,
      scale: 18
    });
  },

  onFileTypeChange(e) {
    const { value } = e.detail;
    const options = this.data.fileTypeOptions;
    this.setData({ fileType: options[parseInt(value)].value });
  },

  async uploadFile() {
    const { fileType, orderId } = this.data;

    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      });

      const tempFilePath = res.tempFiles[0].tempFilePath;
      this.uploadToServer(fileType, tempFilePath);
    } catch (err) {
      console.error('选择图片失败:', err);
    }
  },

  async uploadToServer(fileType, filePath) {
    try {
      const app = getApp();
      wx.showLoading({ title: '上传中...', mask: true });

      const uploadRes = await new Promise((resolve, reject) => {
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

      await app.request({
        url: `/companion/orders/${orderId}/files`,
        method: 'POST',
        data: {
          file_type: fileType,
          file_url: uploadRes.url,
          file_name: uploadRes.filename
        }
      });

      wx.hideLoading();
      wx.showToast({ title: '上传成功', icon: 'success' });
      this.loadOrderDetail();
    } catch (err) {
      wx.hideLoading();
      console.error('上传失败:', err);
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  previewFile(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      urls: this.data.files.map(f => f.file_url),
      current: url
    });
  }
});
