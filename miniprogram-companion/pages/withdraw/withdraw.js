Page({
  data: {
    activeTab: 'withdraw',
    tabs: [
      { key: 'withdraw', label: '申请提现' },
      { key: 'list', label: '提现记录' }
    ],
    statistics: null,
    withdrawList: [],
    amount: '',
    remark: '',
    isSubmitting: false,
    page: 1,
    pageSize: 10,
    loading: false,
    noMore: false
  },

  onLoad(options) {
    if (options.tab) {
      this.setData({ activeTab: options.tab });
    }
    this.loadStatistics();
    this.loadWithdrawList(true);
  },

  onShow() {
    this.loadStatistics();
  },

  onPullDownRefresh() {
    this.loadStatistics();
    this.loadWithdrawList(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.activeTab === 'list' && !this.data.loading && !this.data.noMore) {
      this.loadWithdrawList(false);
    }
  },

  onTabChange(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ activeTab: key });
    if (key === 'list') {
      this.loadWithdrawList(true);
    }
  },

  async loadStatistics() {
    try {
      const app = getApp();
      const data = await app.request({
        url: '/companion/income/statistics'
      });
      this.setData({ statistics: data });
    } catch (err) {
      console.error('加载统计数据失败:', err);
    }
  },

  async loadWithdrawList(refresh = false) {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });
      const app = getApp();
      
      const page = refresh ? 1 : this.data.page;
      const data = await app.request({
        url: '/companion/withdraw/list',
        data: {
          page,
          pageSize: this.data.pageSize
        }
      });

      const newList = data.list || [];
      
      if (refresh) {
        this.setData({
          withdrawList: newList,
          page: 1,
          noMore: newList.length < this.data.pageSize
        });
      } else {
        this.setData({
          withdrawList: [...this.data.withdrawList, ...newList],
          page: page + 1,
          noMore: newList.length < this.data.pageSize
        });
      }
    } catch (err) {
      console.error('加载提现记录失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  setMaxAmount() {
    const max = this.data.statistics?.withdrawable || 0;
    this.setData({ amount: max.toString() });
  },

  async submitWithdraw() {
    const { amount, remark, isSubmitting, statistics } = this.data;

    if (isSubmitting) return;

    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      wx.showToast({ title: '请输入提现金额', icon: 'none' });
      return;
    }

    if (amountNum > parseFloat(statistics?.withdrawable || 0)) {
      wx.showToast({ title: '提现金额不能超过可提现金额', icon: 'none' });
      return;
    }

    if (amountNum < 10) {
      wx.showToast({ title: '最低提现金额为10元', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认提现',
      content: `确认提现 ¥${amountNum} 到微信钱包？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            this.setData({ isSubmitting: true });
            const app = getApp();
            
            await app.request({
              url: '/companion/withdraw',
              method: 'POST',
              data: {
                amount: amountNum,
                remark: remark.trim()
              }
            });

            wx.showToast({ title: '申请提交成功', icon: 'success' });
            this.setData({ amount: '', remark: '' });
            this.loadStatistics();
          } catch (err) {
            console.error('提交提现失败:', err);
            this.setData({ isSubmitting: false });
          }
        }
      }
    });
  },

  getStatusText(status) {
    const map = {
      pending: '待处理',
      success: '已到账',
      failed: '失败'
    };
    return map[status] || status;
  }
});
