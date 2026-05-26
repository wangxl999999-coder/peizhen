const app = getApp();

Page({
  data: {
    order: null,
    showCancel: false,
    showReschedule: false,
    showAfterSales: false,
    dates: [],
    timeSlots: [],
    cancelReason: '',
    selectedDate: '',
    selectedTimeSlot: '',
    rescheduleReason: '',
    afterSalesType: 'refund',
    afterSalesReason: '',
    afterSalesDesc: '',
    refundAmount: 0
  },

  onLoad(options) {
    this.orderId = options.id;
    this.generateDates();
    this.loadOrderDetail();
  },

  onShow() {
    if (this.orderId) {
      this.loadOrderDetail();
    }
  },

  generateDates() {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(app.formatDate(date));
    }
    this.setData({ dates });
  },

  async loadOrderDetail() {
    if (!app.globalData.token) return;

    try {
      const data = await app.request({
        url: `/order/${this.orderId}`
      });

      data.statusText = app.getOrderStatusText(data.status);

      if (data.patient_info && typeof data.patient_info === 'string') {
        data.patient_info = JSON.parse(data.patient_info);
      }
      if (data.companion_info && typeof data.companion_info === 'string') {
        data.companion_info = JSON.parse(data.companion_info);
      }

      this.setData({ order: data });
    } catch (err) {
      console.error('加载订单详情失败', err);
    }
  },

  showCancelDialog() {
    this.setData({ showCancel: true });
  },

  hideCancelDialog() {
    this.setData({ showCancel: false, cancelReason: '' });
  },

  onCancelReasonInput(e) {
    this.setData({ cancelReason: e.detail.value });
  },

  async confirmCancel() {
    if (!this.data.cancelReason) {
      wx.showToast({ title: '请输入取消原因', icon: 'none' });
      return;
    }

    try {
      await app.request({
        url: `/order/${this.orderId}/cancel`,
        method: 'POST',
        data: { reason: this.data.cancelReason }
      });
      wx.showToast({ title: '取消成功', icon: 'success' });
      this.hideCancelDialog();
      this.loadOrderDetail();
    } catch (err) {
      console.error('取消订单失败', err);
    }
  },

  showRescheduleDialog() {
    this.setData({ showReschedule: true });
    this.loadTimeSlots();
  },

  hideRescheduleDialog() {
    this.setData({ 
      showReschedule: false, 
      selectedDate: '', 
      selectedTimeSlot: '',
      rescheduleReason: '' 
    });
  },

  async loadTimeSlots() {
    try {
      const data = await app.request({ url: '/common/time-slots' });
      this.setData({ timeSlots: data });
    } catch (err) {
      console.error('加载时间段失败', err);
    }
  },

  selectDate(e) {
    this.setData({ selectedDate: e.currentTarget.dataset.date });
  },

  selectTimeSlot(e) {
    this.setData({ selectedTimeSlot: e.currentTarget.dataset.time });
  },

  onRescheduleReasonInput(e) {
    this.setData({ rescheduleReason: e.detail.value });
  },

  async confirmReschedule() {
    if (!this.data.selectedDate || !this.data.selectedTimeSlot) {
      wx.showToast({ title: '请选择新的服务时间', icon: 'none' });
      return;
    }

    try {
      await app.request({
        url: `/order/${this.orderId}/reschedule`,
        method: 'POST',
        data: {
          new_date: this.data.selectedDate,
          new_time_slot: this.data.selectedTimeSlot,
          reason: this.data.rescheduleReason
        }
      });
      wx.showToast({ title: '改期成功', icon: 'success' });
      this.hideRescheduleDialog();
      this.loadOrderDetail();
    } catch (err) {
      console.error('改期失败', err);
    }
  },

  showAfterSalesDialog(e) {
    const type = e.currentTarget.dataset.type || 'refund';
    this.setData({
      showAfterSales: true,
      afterSalesType: type,
      afterSalesReason: '',
      afterSalesDesc: '',
      refundAmount: this.data.order ? this.data.order.total_price : 0
    });
  },

  hideAfterSalesDialog() {
    this.setData({ showAfterSales: false });
  },

  onAfterSalesReasonInput(e) {
    this.setData({ afterSalesReason: e.detail.value });
  },

  onAfterSalesDescInput(e) {
    this.setData({ afterSalesDesc: e.detail.value });
  },

  async submitAfterSales() {
    if (!this.data.afterSalesReason) {
      wx.showToast({ title: '请输入原因', icon: 'none' });
      return;
    }

    try {
      await app.request({
        url: '/order/after-sales',
        method: 'POST',
        data: {
          order_id: this.orderId,
          type: this.data.afterSalesType,
          reason: this.data.afterSalesReason,
          description: this.data.afterSalesDesc,
          refund_amount: this.data.afterSalesType === 'refund' ? this.data.refundAmount : 0
        }
      });
      wx.showToast({ title: '提交成功', icon: 'success' });
      this.hideAfterSalesDialog();
    } catch (err) {
      console.error('提交售后失败', err);
    }
  },

  goEvaluation() {
    wx.navigateTo({
      url: `/pages/evaluation/evaluation?order_id=${this.orderId}`
    });
  },

  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-888-8888\n工作时间：9:00-21:00',
      confirmText: '拨打',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({ phoneNumber: '4008888888' });
        }
      }
    });
  },

  callCompanion() {
    if (this.data.order && this.data.order.companion_info && this.data.order.companion_info.phone) {
      wx.makePhoneCall({ phoneNumber: this.data.order.companion_info.phone });
    }
  },

  copyOrderNo() {
    wx.setClipboardData({ data: this.data.order.order_no });
  }
})
