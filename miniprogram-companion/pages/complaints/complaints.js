Page({
  data: {
    complaints: [],
    status: 'all',
    statusOptions: [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待处理' },
      { value: 'processing', label: '处理中' },
      { value: 'completed', label: '已处理' }
    ],
    page: 1,
    pageSize: 10,
    loading: false,
    noMore: false
  },

  onShow() {
    this.loadComplaints(true);
  },

  onPullDownRefresh() {
    this.loadComplaints(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (!this.data.loading && !this.data.noMore) {
      this.loadComplaints(false);
    }
  },

  onStatusChange(e) {
    const { value } = e.currentTarget.dataset;
    this.setData({ status: value });
    this.loadComplaints(true);
  },

  async loadComplaints(refresh = false) {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });
      const app = getApp();
      
      const page = refresh ? 1 : this.data.page;
      const data = await app.request({
        url: '/companion/complaints',
        data: {
          status: this.data.status,
          page,
          pageSize: this.data.pageSize
        }
      });

      const newList = data.list || [];
      
      if (refresh) {
        this.setData({
          complaints: newList,
          page: 1,
          noMore: newList.length < this.data.pageSize
        });
      } else {
        this.setData({
          complaints: [...this.data.complaints, ...newList],
          page: page + 1,
          noMore: newList.length < this.data.pageSize
        });
      }
    } catch (err) {
      console.error('加载投诉建议失败:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  goToAdd() {
    wx.navigateTo({ url: '/pages/complaint-add/complaint-add' });
  },

  getStatusText(status) {
    const map = {
      pending: '待处理',
      processing: '处理中',
      completed: '已处理'
    };
    return map[status] || status;
  }
});
