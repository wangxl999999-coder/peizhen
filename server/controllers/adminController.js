const memoryDb = require('../utils/memoryDb');
const { success, error, paginate } = require('../utils/response');
const dayjs = require('dayjs');

async function getDashboardStats(req, res) {
  try {
    const userCount = memoryDb.data.users.length;
    const companionCount = memoryDb.data.companions.filter(c => c.status === 1).length;
    const orderCount = memoryDb.data.orders.length;
    const totalAmount = memoryDb.data.orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
    const pendingAccept = memoryDb.data.orders.filter(o => o.status === 'pending_accept').length;
    const pendingAudit = memoryDb.data.companions.filter(c => c.status === 0).length;

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = memoryDb.data.orders.filter(o => o.create_time.startsWith(dateStr));
      
      last7Days.push({
        date: dateStr,
        order_count: dayOrders.length,
        amount: dayOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0)
      });
    }

    const serviceStats = {};
    memoryDb.data.orders.forEach(o => {
      if (!serviceStats[o.service_type]) {
        serviceStats[o.service_type] = { service_name: o.service_name || o.service_type, count: 0 };
      }
      serviceStats[o.service_type].count++;
    });
    const serviceStatsList = Object.values(serviceStats).sort((a, b) => b.count - a.count).slice(0, 6);

    res.json(success({
      total_users: userCount,
      total_companions: companionCount,
      total_orders: orderCount,
      total_amount: totalAmount,
      pending_accept: pendingAccept,
      pending_audit: pendingAudit,
      last7_days: last7Days,
      service_stats: serviceStatsList
    }));
  } catch (err) {
    console.error('获取统计数据失败:', err);
    res.json(error('获取失败'));
  }
}

async function getUserList(req, res) {
  const { keyword, page = 1, pageSize = 10 } = req.query;

  try {
    let users = [...memoryDb.data.users];
    
    if (keyword) {
      users = users.filter(u => 
        u.nickname.includes(keyword) || 
        u.phone.includes(keyword) || 
        (u.real_name && u.real_name.includes(keyword))
      );
    }

    users.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    const total = users.length;
    const start = (page - 1) * pageSize;
    const list = users.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function updateUserStatus(req, res) {
  const userId = parseInt(req.params.id);
  const { status } = req.body;

  try {
    memoryDb.update('users', userId, { status });
    res.json(success(null, '更新成功'));
  } catch (err) {
    console.error('更新用户状态失败:', err);
    res.json(error('更新失败'));
  }
}

async function getCompanionList(req, res) {
  const { keyword, status, page = 1, pageSize = 10 } = req.query;

  try {
    let companions = [...memoryDb.data.companions];

    if (keyword) {
      companions = companions.filter(c => 
        c.real_name.includes(keyword) || 
        c.phone.includes(keyword)
      );
    }

    if (status !== undefined && status !== '') {
      companions = companions.filter(c => c.status === parseInt(status));
    }

    companions.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    const total = companions.length;
    const start = (page - 1) * pageSize;
    const list = companions.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取陪诊师列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getCompanionDetail(req, res) {
  const companionId = parseInt(req.params.id);

  try {
    const companion = memoryDb.findOne('companions', { id: companionId });
    if (!companion) {
      return res.json(error('陪诊师不存在'));
    }

    const verification = memoryDb.findOne('companionVerifications', { companion_id: companionId });
    const qualifications = memoryDb.findAll('companionQualifications', { companion_id: companionId });

    res.json(success({
      ...companion,
      verification,
      qualifications
    }));
  } catch (err) {
    console.error('获取陪诊师详情失败:', err);
    res.json(error('获取失败'));
  }
}

async function auditCompanion(req, res) {
  const companionId = parseInt(req.params.id);
  const { status, remark } = req.body;

  try {
    memoryDb.update('companions', companionId, { 
      status: parseInt(status), 
      audit_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });
    res.json(success(null, '审核成功'));
  } catch (err) {
    console.error('审核陪诊师失败:', err);
    res.json(error('审核失败'));
  }
}

async function auditVerification(req, res) {
  const verificationId = parseInt(req.params.id);
  const { status, remark } = req.body;

  try {
    const verification = memoryDb.findOne('companionVerifications', { id: verificationId });
    if (!verification) {
      return res.json(error('实名认证记录不存在'));
    }

    memoryDb.update('companionVerifications', verificationId, {
      verification_status: parseInt(status),
      verification_remark: remark || '',
      verification_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    res.json(success(null, '审核成功'));
  } catch (err) {
    console.error('审核实名认证失败:', err);
    res.json(error('审核失败'));
  }
}

async function auditQualification(req, res) {
  const qualificationId = parseInt(req.params.id);
  const { status, remark } = req.body;

  try {
    memoryDb.update('companionQualifications', qualificationId, {
      status: parseInt(status),
      audit_remark: remark || '',
      audit_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    res.json(success(null, '审核成功'));
  } catch (err) {
    console.error('审核资质失败:', err);
    res.json(error('审核失败'));
  }
}

async function getOrderList(req, res) {
  const { keyword, status, page = 1, pageSize = 10 } = req.query;

  try {
    let orders = [...memoryDb.data.orders];

    if (keyword) {
      orders = orders.filter(o => 
        o.order_no.includes(keyword) || 
        o.hospital_name.includes(keyword)
      );
    }

    if (status && status !== 'all') {
      orders = orders.filter(o => o.status === status);
    }

    orders.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    const total = orders.length;
    const start = (page - 1) * pageSize;
    const list = orders.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getAfterSalesList(req, res) {
  const { type, status, page = 1, pageSize = 10 } = req.query;

  try {
    let afterSales = [...(memoryDb.data.afterSales || [])];

    if (type) {
      afterSales = afterSales.filter(a => a.type === type);
    }

    if (status && status !== 'all') {
      afterSales = afterSales.filter(a => a.status === status);
    }

    afterSales.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    afterSales = afterSales.map(a => {
      const order = memoryDb.findOne('orders', { id: a.order_id });
      return {
        ...a,
        order_no: order?.order_no || '',
        total_price: order?.total_price || 0
      };
    });

    const total = afterSales.length;
    const start = (page - 1) * pageSize;
    const list = afterSales.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取售后列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function handleAfterSales(req, res) {
  const id = parseInt(req.params.id);
  const { status, handle_result } = req.body;
  const handlerId = req.user.id;

  try {
    memoryDb.update('afterSales', id, {
      status,
      handle_result: handle_result || '',
      handle_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      handler_id: handlerId
    });

    if (status === 'completed') {
      const afterSale = memoryDb.findOne('afterSales', { id });
      if (afterSale) {
        const order = memoryDb.findOne('orders', { id: afterSale.order_id });
        if (order) {
          memoryDb.update('orders', afterSale.order_id, {
            refund_price: parseFloat(order.refund_price || 0) + parseFloat(afterSale.refund_amount || 0)
          });
        }
      }
    }

    res.json(success(null, '处理成功'));
  } catch (err) {
    console.error('处理售后失败:', err);
    res.json(error('处理失败'));
  }
}

async function getBannerList(req, res) {
  try {
    const list = [...memoryDb.data.banners].sort((a, b) => a.sort - b.sort || b.id - a.id);
    res.json(success(list));
  } catch (err) {
    console.error('获取Banner列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function saveBanner(req, res) {
  const { id, title, image, link_type, link_value, position, sort, start_time, end_time, status } = req.body;

  try {
    if (id) {
      memoryDb.update('banners', parseInt(id), {
        title,
        image,
        link_type,
        link_value,
        position: position || 'home',
        sort: parseInt(sort) || 0,
        start_time: start_time || null,
        end_time: end_time || null,
        status: parseInt(status)
      });
    } else {
      memoryDb.insert('banners', {
        title,
        image,
        link_type,
        link_value,
        position: position || 'home',
        sort: parseInt(sort) || 0,
        start_time: start_time || null,
        end_time: end_time || null,
        status: parseInt(status)
      });
    }
    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存Banner失败:', err);
    res.json(error('保存失败'));
  }
}

async function deleteBanner(req, res) {
  const id = parseInt(req.params.id);

  try {
    memoryDb.remove('banners', id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error('删除Banner失败:', err);
    res.json(error('删除失败'));
  }
}

async function getFaqList(req, res) {
  try {
    const list = [...memoryDb.data.faqs].sort((a, b) => a.sort - b.sort || b.id - a.id);
    res.json(success(list));
  } catch (err) {
    console.error('获取FAQ列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function saveFaq(req, res) {
  const { id, question, answer, category, sort, status } = req.body;

  try {
    if (id) {
      memoryDb.update('faqs', parseInt(id), {
        question,
        answer,
        category: category || '',
        sort: parseInt(sort) || 0,
        status: parseInt(status)
      });
    } else {
      memoryDb.insert('faqs', {
        question,
        answer,
        category: category || '',
        sort: parseInt(sort) || 0,
        status: parseInt(status)
      });
    }
    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存FAQ失败:', err);
    res.json(error('保存失败'));
  }
}

async function deleteFaq(req, res) {
  const id = parseInt(req.params.id);

  try {
    memoryDb.remove('faqs', id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error('删除FAQ失败:', err);
    res.json(error('删除失败'));
  }
}

async function getTrainingList(req, res) {
  const { keyword, category, page = 1, pageSize = 10 } = req.query;

  try {
    let trainings = [...memoryDb.data.trainings];

    if (keyword) {
      trainings = trainings.filter(t => t.title.includes(keyword));
    }

    if (category && category !== 'all') {
      trainings = trainings.filter(t => t.category === category);
    }

    trainings.sort((a, b) => a.sort - b.sort || new Date(b.create_time) - new Date(a.create_time));

    const total = trainings.length;
    const start = (page - 1) * pageSize;
    const list = trainings.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取培训资料列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function saveTraining(req, res) {
  const { id, title, category, content, cover_image, file_url, sort, status } = req.body;

  try {
    if (id) {
      memoryDb.update('trainings', parseInt(id), {
        title,
        category,
        content,
        cover_image: cover_image || '',
        file_url: file_url || '',
        sort: parseInt(sort) || 0,
        status: parseInt(status)
      });
    } else {
      memoryDb.insert('trainings', {
        title,
        category,
        content,
        cover_image: cover_image || '',
        file_url: file_url || '',
        view_count: 0,
        sort: parseInt(sort) || 0,
        status: parseInt(status)
      });
    }
    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存培训资料失败:', err);
    res.json(error('保存失败'));
  }
}

async function deleteTraining(req, res) {
  const id = parseInt(req.params.id);

  try {
    memoryDb.remove('trainings', id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error('删除培训资料失败:', err);
    res.json(error('删除失败'));
  }
}

async function getPlatformRuleList(req, res) {
  const { type, page = 1, pageSize = 10 } = req.query;

  try {
    let rules = [...memoryDb.data.platformRules];

    if (type && type !== 'all') {
      rules = rules.filter(r => r.type === type);
    }

    rules.sort((a, b) => a.sort - b.sort || new Date(b.create_time) - new Date(a.create_time));

    const total = rules.length;
    const start = (page - 1) * pageSize;
    const list = rules.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取平台规则列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function savePlatformRule(req, res) {
  const { id, title, type, content, version, sort, status } = req.body;

  try {
    if (id) {
      memoryDb.update('platformRules', parseInt(id), {
        title,
        type,
        content,
        version: version || '',
        sort: parseInt(sort) || 0,
        status: parseInt(status)
      });
    } else {
      memoryDb.insert('platformRules', {
        title,
        type,
        content,
        version: version || 'v1.0',
        sort: parseInt(sort) || 0,
        status: parseInt(status)
      });
    }
    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存平台规则失败:', err);
    res.json(error('保存失败'));
  }
}

async function deletePlatformRule(req, res) {
  const id = parseInt(req.params.id);

  try {
    memoryDb.remove('platformRules', id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error('删除平台规则失败:', err);
    res.json(error('删除失败'));
  }
}

async function getComplaintList(req, res) {
  const { type, status, page = 1, pageSize = 10 } = req.query;

  try {
    let complaints = [...memoryDb.data.complaints];

    if (type && type !== 'all') {
      complaints = complaints.filter(c => c.type === type);
    }

    if (status && status !== 'all') {
      complaints = complaints.filter(c => c.status === status);
    }

    complaints.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    complaints = complaints.map(c => {
      if (c.user_id) {
        const user = memoryDb.findOne('users', { id: c.user_id });
        c.user_name = user?.nickname || '';
        c.user_phone = user?.phone || '';
      }
      if (c.companion_id) {
        const companion = memoryDb.findOne('companions', { id: c.companion_id });
        c.companion_name = companion?.real_name || '';
        c.companion_phone = companion?.phone || '';
      }
      if (c.order_id) {
        const order = memoryDb.findOne('orders', { id: c.order_id });
        c.order_no = order?.order_no || '';
      }
      return c;
    });

    const total = complaints.length;
    const start = (page - 1) * pageSize;
    const list = complaints.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取投诉建议列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function handleComplaint(req, res) {
  const id = parseInt(req.params.id);
  const { status, handle_result } = req.body;
  const handlerId = req.user.id;

  try {
    memoryDb.update('complaints', id, {
      status,
      handle_result: handle_result || '',
      handle_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      handler_id: handlerId
    });

    res.json(success(null, '处理成功'));
  } catch (err) {
    console.error('处理投诉建议失败:', err);
    res.json(error('处理失败'));
  }
}

async function getWithdrawList(req, res) {
  const { status, page = 1, pageSize = 10 } = req.query;

  try {
    let withdraws = [...memoryDb.data.withdraws];

    if (status && status !== 'all') {
      withdraws = withdraws.filter(w => w.status === status);
    }

    withdraws.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    withdraws = withdraws.map(w => {
      const companion = memoryDb.findOne('companions', { id: w.companion_id });
      return {
        ...w,
        companion_name: companion?.real_name || '',
        companion_phone: companion?.phone || ''
      };
    });

    const total = withdraws.length;
    const start = (page - 1) * pageSize;
    const list = withdraws.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取提现列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function handleWithdraw(req, res) {
  const id = parseInt(req.params.id);
  const { status, remark } = req.body;
  const handlerId = req.user.id;

  try {
    const updateData = { status, handler_id: handlerId };
    
    if (status === 'success') {
      updateData.pay_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
      updateData.remark = remark || '';
    } else if (status === 'failed') {
      updateData.remark = remark || '';
      
      const withdraw = memoryDb.findOne('withdraws', { id });
      if (withdraw) {
        const incomes = memoryDb.findAll('incomes', { companion_id: withdraw.companion_id, order_no: withdraw.withdraw_no });
        incomes.forEach(income => {
          memoryDb.remove('incomes', income.id);
        });
      }
    }

    memoryDb.update('withdraws', id, updateData);

    res.json(success(null, '处理成功'));
  } catch (err) {
    console.error('处理提现失败:', err);
    res.json(error('处理失败'));
  }
}

module.exports = {
  getDashboardStats,
  getUserList,
  updateUserStatus,
  getCompanionList,
  getCompanionDetail,
  auditCompanion,
  auditVerification,
  auditQualification,
  getOrderList,
  getAfterSalesList,
  handleAfterSales,
  getBannerList,
  saveBanner,
  deleteBanner,
  getFaqList,
  saveFaq,
  deleteFaq,
  getTrainingList,
  saveTraining,
  deleteTraining,
  getPlatformRuleList,
  savePlatformRule,
  deletePlatformRule,
  getComplaintList,
  handleComplaint,
  getWithdrawList,
  handleWithdraw
};
