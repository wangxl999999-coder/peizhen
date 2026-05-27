const memoryDb = require('../utils/memoryDb');
const { success, error, paginate } = require('../utils/response');

async function getDashboardStats(req, res) {
  try {
    const userCount = memoryDb.data.users.length;
    const companionCount = memoryDb.data.companions.filter(c => c.status === 1).length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = memoryDb.data.orders.filter(o => o.create_time.startsWith(today));
    const todayOrderCount = todayOrders.length;
    const todayIncome = todayOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

    const weekDates = [];
    const weekOrderCounts = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = memoryDb.data.orders.filter(o => o.create_time.startsWith(dateStr));
      weekDates.push(dateStr.slice(5));
      weekOrderCounts.push(dayOrders.length);
    }

    const monthDates = [];
    const monthOrderCounts = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = memoryDb.data.orders.filter(o => o.create_time.startsWith(dateStr));
      monthDates.push(dateStr.slice(5));
      monthOrderCounts.push(dayOrders.length);
    }

    const serviceDistribution = {};
    memoryDb.data.orders.forEach(o => {
      const name = o.service_name || o.service_type || '其他';
      if (!serviceDistribution[name]) {
        serviceDistribution[name] = { value: 0, name };
      }
      serviceDistribution[name].value++;
    });
    const serviceDistributionList = Object.values(serviceDistribution);

    const latestOrders = [...memoryDb.data.orders]
      .sort((a, b) => new Date(b.create_time) - new Date(a.create_time))
      .slice(0, 5);

    const topCompanions = [...memoryDb.data.companions]
      .filter(c => c.status === 1)
      .sort((a, b) => (b.order_count || 0) - (a.order_count || 0))
      .slice(0, 5);

    res.json(success({
      user_count: userCount,
      companion_count: companionCount,
      today_orders: todayOrderCount,
      today_income: todayIncome,
      week_data: {
        dates: weekDates,
        order_counts: weekOrderCounts
      },
      month_data: {
        dates: monthDates,
        order_counts: monthOrderCounts
      },
      service_distribution: serviceDistributionList,
      latest_orders: latestOrders,
      top_companions: topCompanions
    }));
  } catch (err) {
    console.error('获取统计数据失败:', err);
    res.json(error('获取失败'));
  }
}

async function getUserList(req, res) {
  const { keyword, status, page = 1, pageSize = 10 } = req.query;

  try {
    let users = [...memoryDb.data.users];

    if (keyword) {
      users = users.filter(u =>
        u.nickname.includes(keyword) ||
        u.phone.includes(keyword) ||
        (u.real_name && u.real_name.includes(keyword))
      );
    }

    if (status !== undefined && status !== '') {
      users = users.filter(u => u.status === parseInt(status));
    }

    users = users.map(u => ({
      ...u,
      order_count: memoryDb.data.orders.filter(o => o.user_id === u.id).length,
      complaint_count: memoryDb.data.complaints.filter(c => c.user_id === u.id).length
    }));

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

async function getUserDetail(req, res) {
  const userId = parseInt(req.params.id);

  try {
    const user = memoryDb.findOne('users', { id: userId });
    if (!user) {
      return res.json(error('用户不存在'));
    }

    const orders = memoryDb.findAll('orders', { user_id: userId });
    const complaints = memoryDb.findAll('complaints', { user_id: userId });
    const evaluations = memoryDb.findAll('evaluations', { user_id: userId });
    const patients = memoryDb.findAll('patients', { user_id: userId });

    res.json(success({
      ...user,
      order_count: orders.length,
      total_spent: orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0),
      orders: orders.slice(0, 20),
      complaints: complaints.slice(0, 20),
      evaluations: evaluations.slice(0, 20),
      patients: patients
    }));
  } catch (err) {
    console.error('获取用户详情失败:', err);
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
  const { keyword, verify_status, page = 1, pageSize = 10 } = req.query;

  try {
    let companions = [...memoryDb.data.companions];

    if (keyword) {
      companions = companions.filter(c =>
        c.real_name.includes(keyword) ||
        c.phone.includes(keyword)
      );
    }

    if (verify_status !== undefined && verify_status !== '') {
      const statusMap = { pending: 0, approved: 1, rejected: 2 };
      const targetStatus = statusMap[verify_status];
      if (targetStatus !== undefined) {
        companions = companions.filter(c => c.status === targetStatus);
      }
    }

    companions = companions.map(c => {
      const orders = memoryDb.data.orders.filter(o => o.companion_id === c.id);
      const accepted = orders.filter(o => o.status !== 'pending_accept');
      const evaluations = memoryDb.data.evaluations.filter(e => e.companion_id === c.id);
      const goodEval = evaluations.filter(e => e.rating >= 4);
      const complaints = memoryDb.data.complaints.filter(co => co.companion_id === c.id);
      const verifyStatusMap = { 0: 'pending', 1: 'approved', 2: 'rejected' };
      return {
        ...c,
        verify_status: verifyStatusMap[c.status] || 'pending',
        accept_rate: orders.length > 0 ? ((accepted.length / orders.length) * 100).toFixed(1) : '0.0',
        good_rate: evaluations.length > 0 ? ((goodEval.length / evaluations.length) * 100).toFixed(1) : '0.0',
        complaint_count: complaints.length,
        income_total: memoryDb.data.incomes.filter(i => i.companion_id === c.id).reduce((sum, i) => sum + parseFloat(i.actual_amount || 0), 0).toFixed(2)
      };
    });

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
    const services = memoryDb.findAll('companionServices', { companion_id: companionId });
    const cities = memoryDb.findAll('companionCities', { companion_id: companionId });
    const hospitals = memoryDb.findAll('companionHospitals', { companion_id: companionId });
    const departments = memoryDb.findAll('companionDepartments', { companion_id: companionId });
    const orders = memoryDb.findAll('orders', { companion_id: companionId });
    const evaluations = memoryDb.findAll('evaluations', { companion_id: companionId });
    const complaints = memoryDb.findAll('complaints', { companion_id: companionId });
    const incomes = memoryDb.findAll('incomes', { companion_id: companionId });

    const accepted = orders.filter(o => o.status !== 'pending_accept');

    res.json(success({
      ...companion,
      verification,
      qualifications,
      services,
      cities,
      hospitals,
      departments,
      order_count: orders.length,
      accept_rate: orders.length > 0 ? ((accepted.length / orders.length) * 100).toFixed(1) : '0.0',
      good_rate: evaluations.length > 0 ? ((evaluations.filter(e => e.rating >= 4).length / evaluations.length) * 100).toFixed(1) : '0.0',
      income_total: incomes.reduce((sum, i) => sum + parseFloat(i.actual_amount || 0), 0).toFixed(2),
      orders: orders.slice(0, 20),
      evaluations: evaluations.slice(0, 20),
      complaints: complaints.slice(0, 20)
    }));
  } catch (err) {
    console.error('获取陪诊师详情失败:', err);
    res.json(error('获取失败'));
  }
}

async function auditCompanion(req, res) {
  const companionId = parseInt(req.params.id);
  const { verify_status, status, remark } = req.body;

  try {
    const statusMap = { pending: 0, approved: 1, rejected: 2 };
    const targetStatus = verify_status !== undefined ? statusMap[verify_status] : (status !== undefined ? parseInt(status) : undefined);
    
    if (targetStatus === undefined) {
      return res.json(error('请提供审核状态'));
    }
    
    memoryDb.update('companions', companionId, {
      status: targetStatus,
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

async function updateCompanionService(req, res) {
  const serviceId = parseInt(req.params.id);
  const { custom_price, is_enabled } = req.body;

  try {
    const updateData = {};
    if (custom_price !== undefined) updateData.custom_price = parseFloat(custom_price);
    if (is_enabled !== undefined) updateData.is_enabled = parseInt(is_enabled);

    memoryDb.update('companionServices', serviceId, updateData);
    res.json(success(null, '更新成功'));
  } catch (err) {
    console.error('更新陪诊师服务失败:', err);
    res.json(error('更新失败'));
  }
}

async function updateCompanionRating(req, res) {
  const companionId = parseInt(req.params.id);
  const { rating } = req.body;

  try {
    memoryDb.update('companions', companionId, { rating: parseFloat(rating) });
    res.json(success(null, '更新成功'));
  } catch (err) {
    console.error('更新评分失败:', err);
    res.json(error('更新失败'));
  }
}

async function getOrderList(req, res) {
  const { keyword, status, start_date, end_date, page = 1, pageSize = 10 } = req.query;

  try {
    let orders = [...memoryDb.data.orders];

    if (keyword) {
      orders = orders.filter(o =>
        o.order_no.includes(keyword) ||
        (o.hospital_name && o.hospital_name.includes(keyword))
      );
    }

    if (status && status !== 'all') {
      orders = orders.filter(o => o.status === status);
    }

    if (start_date) {
      orders = orders.filter(o => o.create_time >= start_date);
    }
    if (end_date) {
      orders = orders.filter(o => o.create_time <= end_date + ' 23:59:59');
    }

    orders = orders.map(o => {
      const user = memoryDb.findOne('users', { id: o.user_id });
      const companion = memoryDb.findOne('companions', { id: o.companion_id });
      const hospital = memoryDb.findOne('hospitals', { id: o.hospital_id });
      const service = memoryDb.findOne('services', { id: o.service_id });
      return {
        ...o,
        user_name: user?.nickname || '',
        user_phone: user?.phone || '',
        companion_name: companion?.real_name || '',
        companion_phone: companion?.phone || '',
        hospital_name: hospital?.name || '',
        service_name: service?.name || o.service_type || ''
      };
    });

    orders.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    const total = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
    const start = (page - 1) * pageSize;
    const list = orders.slice(start, start + parseInt(pageSize));

    res.json(success({
      ...paginate(list, total, page, pageSize),
      total_amount: totalAmount.toFixed(2)
    }));
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getOrderDetail(req, res) {
  const orderId = parseInt(req.params.id);

  try {
    const order = memoryDb.findOne('orders', { id: orderId });
    if (!order) {
      return res.json(error('订单不存在'));
    }

    const user = memoryDb.findOne('users', { id: order.user_id });
    const companion = memoryDb.findOne('companions', { id: order.companion_id });
    const hospital = memoryDb.findOne('hospitals', { id: order.hospital_id });
    const service = memoryDb.findOne('services', { id: order.service_id });
    const patient = order.patient_id ? memoryDb.findOne('patients', { id: order.patient_id }) : null;
    const evaluation = memoryDb.findOne('evaluations', { order_id: orderId });
    const afterSale = memoryDb.findOne('afterSales', { order_id: orderId });
    const complaint = memoryDb.findOne('complaints', { order_id: orderId });
    const checkins = memoryDb.findAll('orderCheckins', { order_id: orderId });
    const nodes = memoryDb.findAll('orderNodes', { order_id: orderId });
    const serviceFiles = memoryDb.findAll('orderServiceFiles', { order_id: orderId });

    const timeParts = (order.time_slot || '').split('-');
    const startTime = timeParts[0] || '';
    const endTime = timeParts[1] || '';

    res.json(success({
      ...order,
      service_name: service?.name || order.service_type || '',
      hospital_name: hospital?.name || '',
      symptom_description: order.symptom || '',
      start_time: startTime,
      end_time: endTime,
      user_name: user?.nickname || '',
      user_phone: user?.phone || '',
      companion_name: companion?.real_name || '',
      companion_phone: companion?.phone || '',
      patient,
      evaluation,
      after_sale: afterSale,
      complaint,
      checkins,
      nodes,
      service_files: serviceFiles
    }));
  } catch (err) {
    console.error('获取订单详情失败:', err);
    res.json(error('获取失败'));
  }
}

async function getOrderStatistics(req, res) {
  try {
    const orders = memoryDb.data.orders;
    const statusStats = {};
    orders.forEach(o => {
      if (!statusStats[o.status]) {
        statusStats[o.status] = 0;
      }
      statusStats[o.status]++;
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = orders.filter(o => o.create_time.startsWith(dateStr));
      last7Days.push({
        date: dateStr,
        order_count: dayOrders.length,
        amount: dayOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0)
      });
    }

    const serviceTypeStats = {};
    orders.forEach(o => {
      const key = o.service_name || o.service_type;
      if (!serviceTypeStats[key]) {
        serviceTypeStats[key] = { count: 0, amount: 0 };
      }
      serviceTypeStats[key].count++;
      serviceTypeStats[key].amount += parseFloat(o.total_price || 0);
    });

    res.json(success({
      total_orders: orders.length,
      total_amount: orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0),
      status_stats: statusStats,
      last7_days: last7Days,
      service_type_stats: Object.entries(serviceTypeStats).map(([name, data]) => ({ name, ...data }))
    }));
  } catch (err) {
    console.error('获取订单统计失败:', err);
    res.json(error('获取失败'));
  }
}

async function exportOrders(req, res) {
  const { keyword, status, start_date, end_date } = req.query;

  try {
    let orders = [...memoryDb.data.orders];

    if (keyword) {
      orders = orders.filter(o =>
        o.order_no.includes(keyword) ||
        (o.hospital_name && o.hospital_name.includes(keyword))
      );
    }

    if (status && status !== 'all') {
      orders = orders.filter(o => o.status === status);
    }

    if (start_date) {
      orders = orders.filter(o => o.create_time >= start_date);
    }
    if (end_date) {
      orders = orders.filter(o => o.create_time <= end_date + ' 23:59:59');
    }

    orders = orders.map(o => {
      const user = memoryDb.findOne('users', { id: o.user_id });
      const companion = memoryDb.findOne('companions', { id: o.companion_id });
      const statusMap = {
        pending_accept: '待接单',
        pending_service: '待服务',
        in_service: '服务中',
        pending_evaluation: '待评价',
        completed: '已完成',
        cancelled: '已取消'
      };
      return {
        order_no: o.order_no,
        service_name: o.service_name,
        user_name: user?.nickname || '',
        user_phone: user?.phone || '',
        companion_name: companion?.real_name || '',
        hospital_name: o.hospital_name || '',
        service_date: o.service_date,
        total_price: o.total_price,
        status: statusMap[o.status] || o.status,
        create_time: o.create_time
      };
    });

    res.json(success(orders));
  } catch (err) {
    console.error('导出订单失败:', err);
    res.json(error('导出失败'));
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
      const user = order ? memoryDb.findOne('users', { id: order.user_id }) : null;
      return {
        ...a,
        order_no: order?.order_no || '',
        total_price: order?.total_price || 0,
        user_name: user?.nickname || '',
        user_phone: user?.phone || ''
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
        title, image, link_type, link_value,
        position: position || 'home',
        sort: parseInt(sort) || 0,
        start_time: start_time || null,
        end_time: end_time || null,
        status: parseInt(status)
      });
    } else {
      memoryDb.insert('banners', {
        title, image, link_type, link_value,
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

async function getHospitalList(req, res) {
  const { keyword, city_id, page = 1, pageSize = 10 } = req.query;

  try {
    let hospitals = [...memoryDb.data.hospitals];

    if (keyword) {
      hospitals = hospitals.filter(h => h.name.includes(keyword));
    }

    if (city_id && city_id !== 'all') {
      hospitals = hospitals.filter(h => h.city_id === parseInt(city_id));
    }

    hospitals = hospitals.map(h => {
      const city = memoryDb.findOne('cities', { id: h.city_id });
      return { ...h, city_name: city?.name || '' };
    });

    hospitals.sort((a, b) => a.sort - b.sort);

    const total = hospitals.length;
    const start = (page - 1) * pageSize;
    const list = hospitals.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取医院列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function saveHospital(req, res) {
  const { id, city_id, name, level, address, phone, sort } = req.body;

  try {
    if (id) {
      memoryDb.update('hospitals', parseInt(id), {
        city_id: parseInt(city_id), name, level, address, phone, sort: parseInt(sort) || 0
      });
    } else {
      memoryDb.insert('hospitals', {
        city_id: parseInt(city_id), name, level, address, phone, sort: parseInt(sort) || 0
      });
    }
    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存医院失败:', err);
    res.json(error('保存失败'));
  }
}

async function deleteHospital(req, res) {
  const id = parseInt(req.params.id);

  try {
    memoryDb.remove('hospitals', id);
    const deps = memoryDb.findAll('departments', { hospital_id: id });
    deps.forEach(d => memoryDb.remove('departments', d.id));
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error('删除医院失败:', err);
    res.json(error('删除失败'));
  }
}

async function getDepartmentList(req, res) {
  const { keyword, hospital_id, page = 1, pageSize = 10 } = req.query;

  try {
    let departments = [...memoryDb.data.departments];

    if (keyword) {
      departments = departments.filter(d => d.name.includes(keyword));
    }

    if (hospital_id && hospital_id !== 'all') {
      departments = departments.filter(d => d.hospital_id === parseInt(hospital_id));
    }

    departments = departments.map(d => {
      const hospital = memoryDb.findOne('hospitals', { id: d.hospital_id });
      return { ...d, hospital_name: hospital?.name || '' };
    });

    departments.sort((a, b) => a.sort - b.sort);

    const total = departments.length;
    const start = (page - 1) * pageSize;
    const list = departments.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取科室列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function saveDepartment(req, res) {
  const { id, hospital_id, name, sort } = req.body;

  try {
    if (id) {
      memoryDb.update('departments', parseInt(id), {
        hospital_id: parseInt(hospital_id), name, sort: parseInt(sort) || 0
      });
    } else {
      memoryDb.insert('departments', {
        hospital_id: parseInt(hospital_id), name, sort: parseInt(sort) || 0
      });
    }
    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存科室失败:', err);
    res.json(error('保存失败'));
  }
}

async function deleteDepartment(req, res) {
  const id = parseInt(req.params.id);

  try {
    memoryDb.remove('departments', id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error('删除科室失败:', err);
    res.json(error('删除失败'));
  }
}

async function getCouponList(req, res) {
  const { keyword, status, page = 1, pageSize = 10 } = req.query;

  try {
    let coupons = [...(memoryDb.data.coupons || [])];

    if (keyword) {
      coupons = coupons.filter(c => c.name.includes(keyword));
    }

    if (status !== undefined && status !== '') {
      coupons = coupons.filter(c => c.status === parseInt(status));
    }

    coupons.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    const total = coupons.length;
    const start = (page - 1) * pageSize;
    const list = coupons.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取优惠券列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function saveCoupon(req, res) {
  const { id, name, type, value, min_amount, total_count, used_count, start_date, end_date, description, status } = req.body;

  try {
    const data = {
      name, type: type || 'discount',
      value: parseFloat(value) || 0,
      min_amount: parseFloat(min_amount) || 0,
      total_count: parseInt(total_count) || 0,
      used_count: parseInt(used_count) || 0,
      start_date: start_date || null,
      end_date: end_date || null,
      description: description || '',
      status: parseInt(status)
    };

    if (id) {
      memoryDb.update('coupons', parseInt(id), data);
    } else {
      if (!memoryDb.data.coupons) memoryDb.data.coupons = [];
      memoryDb.insert('coupons', data);
    }
    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存优惠券失败:', err);
    res.json(error('保存失败'));
  }
}

async function deleteCoupon(req, res) {
  const id = parseInt(req.params.id);

  try {
    memoryDb.remove('coupons', id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error('删除优惠券失败:', err);
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
    console.error('获取投诉列表失败:', err);
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
    console.error('处理投诉失败:', err);
    res.json(error('处理失败'));
  }
}

async function getFinanceList(req, res) {
  const { type, page = 1, pageSize = 10 } = req.query;

  try {
    let list = [...memoryDb.data.incomes];

    if (type && type !== 'all') {
      list = list.filter(i => i.type === type);
    }

    list.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    list = list.map(i => {
      const companion = memoryDb.findOne('companions', { id: i.companion_id });
      const order = i.order_id ? memoryDb.findOne('orders', { id: i.order_id }) : null;
      return {
        ...i,
        companion_name: companion?.real_name || '',
        order_no: order?.order_no || i.order_no || ''
      };
    });

    const total = list.length;
    const totalAmount = list.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    const platformTotal = list.reduce((sum, i) => sum + parseFloat(i.platform_fee || 0), 0);
    const start = (page - 1) * pageSize;
    const data = list.slice(start, start + parseInt(pageSize));

    res.json(success({
      ...paginate(data, total, page, pageSize),
      total_amount: totalAmount.toFixed(2),
      platform_total: platformTotal.toFixed(2)
    }));
  } catch (err) {
    console.error('获取财务列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getFinanceStatistics(req, res) {
  try {
    const incomes = memoryDb.data.incomes;
    const totalAmount = incomes.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    const platformFee = incomes.reduce((sum, i) => sum + parseFloat(i.platform_fee || 0), 0);
    const actualAmount = incomes.reduce((sum, i) => sum + parseFloat(i.actual_amount || 0), 0);

    const withdraws = memoryDb.data.withdraws;
    const totalWithdraw = withdraws.filter(w => w.status === 'success').reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);
    const pendingWithdraw = withdraws.filter(w => w.status === 'pending').reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayIncomes = incomes.filter(i => i.create_time.startsWith(dateStr));
      last7Days.push({
        date: dateStr,
        amount: dayIncomes.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0),
        platform_fee: dayIncomes.reduce((sum, i) => sum + parseFloat(i.platform_fee || 0), 0)
      });
    }

    res.json(success({
      total_amount: totalAmount.toFixed(2),
      platform_fee: platformFee.toFixed(2),
      actual_amount: actualAmount.toFixed(2),
      total_withdraw: totalWithdraw.toFixed(2),
      pending_withdraw: pendingWithdraw.toFixed(2),
      order_count: incomes.length,
      last7_days: last7Days
    }));
  } catch (err) {
    console.error('获取财务统计失败:', err);
    res.json(error('获取失败'));
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
    const totalAmount = withdraws.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);
    const start = (page - 1) * pageSize;
    const list = withdraws.slice(start, start + parseInt(pageSize));

    res.json(success({
      ...paginate(list, total, page, pageSize),
      total_amount: totalAmount.toFixed(2)
    }));
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
    }

    memoryDb.update('withdraws', id, updateData);

    res.json(success(null, '处理成功'));
  } catch (err) {
    console.error('处理提现失败:', err);
    res.json(error('处理失败'));
  }
}

async function getInvoiceList(req, res) {
  const { status, page = 1, pageSize = 10 } = req.query;

  try {
    let invoices = [...(memoryDb.data.invoices || [])];

    if (status && status !== 'all') {
      invoices = invoices.filter(i => i.status === status);
    }

    invoices.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    invoices = invoices.map(i => {
      const user = memoryDb.findOne('users', { id: i.user_id });
      return {
        ...i,
        user_name: user?.nickname || '',
        user_phone: user?.phone || ''
      };
    });

    const total = invoices.length;
    const start = (page - 1) * pageSize;
    const list = invoices.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取发票列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function handleInvoice(req, res) {
  const id = parseInt(req.params.id);
  const { status, remark } = req.body;
  const handlerId = req.user.id;

  try {
    memoryDb.update('invoices', id, {
      status,
      remark: remark || '',
      handle_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      handler_id: handlerId
    });

    res.json(success(null, '处理成功'));
  } catch (err) {
    console.error('处理发票失败:', err);
    res.json(error('处理失败'));
  }
}

async function getServiceList(req, res) {
  const { keyword, status, page = 1, pageSize = 10 } = req.query;

  try {
    let services = [...memoryDb.data.services];

    if (keyword) {
      services = services.filter(s => s.name.includes(keyword));
    }

    if (status !== undefined && status !== '') {
      services = services.filter(s => s.status === parseInt(status));
    }

    services.sort((a, b) => a.sort - b.sort);

    const total = services.length;
    const start = (page - 1) * pageSize;
    const list = services.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取服务列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function saveService(req, res) {
  const { id, name, code, description, base_price, duration, sort, status } = req.body;

  try {
    const data = {
      name, code, description,
      base_price: parseFloat(base_price) || 0,
      duration: parseInt(duration) || 0,
      sort: parseInt(sort) || 0,
      status: parseInt(status)
    };

    if (id) {
      memoryDb.update('services', parseInt(id), data);
    } else {
      memoryDb.insert('services', data);
    }
    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存服务失败:', err);
    res.json(error('保存失败'));
  }
}

async function deleteService(req, res) {
  const id = parseInt(req.params.id);

  try {
    memoryDb.remove('services', id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error('删除服务失败:', err);
    res.json(error('删除失败'));
  }
}

async function getCityList(req, res) {
  const { keyword, page = 1, pageSize = 10 } = req.query;

  try {
    let cities = [...memoryDb.data.cities];

    if (keyword) {
      cities = cities.filter(c => c.name.includes(keyword));
    }

    cities.sort((a, b) => a.sort - b.sort);

    const total = cities.length;
    const start = (page - 1) * pageSize;
    const list = cities.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取城市列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function saveCity(req, res) {
  const { id, name, pinyin, hot, sort } = req.body;

  try {
    const data = {
      name, pinyin: pinyin || '',
      hot: parseInt(hot) || 0,
      sort: parseInt(sort) || 0
    };

    if (id) {
      memoryDb.update('cities', parseInt(id), data);
    } else {
      memoryDb.insert('cities', data);
    }
    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存城市失败:', err);
    res.json(error('保存失败'));
  }
}

async function deleteCity(req, res) {
  const id = parseInt(req.params.id);

  try {
    memoryDb.remove('cities', id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error('删除城市失败:', err);
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
        question, answer, category: category || '',
        sort: parseInt(sort) || 0, status: parseInt(status)
      });
    } else {
      memoryDb.insert('faqs', {
        question, answer, category: category || '',
        sort: parseInt(sort) || 0, status: parseInt(status)
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

async function getSettings(req, res) {
  try {
    res.json(success(memoryDb.data.settings));
  } catch (err) {
    console.error('获取设置失败:', err);
    res.json(error('获取失败'));
  }
}

async function updateSettings(req, res) {
  const { platform_name, service_phone, service_email, work_hours, urgent_fee, night_fee, remote_fee, night_start_time, night_end_time, cancel_hours, order_timeout, user_agreement, privacy_policy, min_withdraw_amount, withdraw_fee_rate, withdraw_period, platform_fee_rate } = req.body;

  try {
    const updateData = {};
    if (platform_name !== undefined) updateData.platform_name = platform_name;
    if (service_phone !== undefined) updateData.service_phone = service_phone;
    if (service_email !== undefined) updateData.service_email = service_email;
    if (work_hours !== undefined) updateData.work_hours = work_hours;
    if (urgent_fee !== undefined) updateData.urgent_fee = parseFloat(urgent_fee);
    if (night_fee !== undefined) updateData.night_fee = parseFloat(night_fee);
    if (remote_fee !== undefined) updateData.remote_fee = parseFloat(remote_fee);
    if (night_start_time !== undefined) updateData.night_start_time = night_start_time;
    if (night_end_time !== undefined) updateData.night_end_time = night_end_time;
    if (cancel_hours !== undefined) updateData.cancel_hours = parseInt(cancel_hours);
    if (order_timeout !== undefined) updateData.order_timeout = parseInt(order_timeout);
    if (user_agreement !== undefined) updateData.user_agreement = user_agreement;
    if (privacy_policy !== undefined) updateData.privacy_policy = privacy_policy;
    if (min_withdraw_amount !== undefined) updateData.min_withdraw_amount = parseFloat(min_withdraw_amount);
    if (withdraw_fee_rate !== undefined) updateData.withdraw_fee_rate = parseFloat(withdraw_fee_rate);
    if (withdraw_period !== undefined) updateData.withdraw_period = withdraw_period;
    if (platform_fee_rate !== undefined) updateData.platform_fee_rate = parseFloat(platform_fee_rate);

    memoryDb.data.settings = { ...memoryDb.data.settings, ...updateData };
    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存设置失败:', err);
    res.json(error('保存失败'));
  }
}

async function getUserGrowthStats(req, res) {
  try {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayUsers = memoryDb.data.users.filter(u => u.create_time.startsWith(dateStr));
      last30Days.push({
        date: dateStr,
        count: dayUsers.length
      });
    }
    res.json(success(last30Days));
  } catch (err) {
    console.error('获取用户增长数据失败:', err);
    res.json(error('获取失败'));
  }
}

async function getActivityStats(req, res) {
  try {
    const activeUsers = memoryDb.data.users.filter(u => {
      const last7 = new Date();
      last7.setDate(last7.getDate() - 7);
      return new Date(u.last_login_time || u.create_time) >= last7;
    }).length;

    const totalUsers = memoryDb.data.users.length;

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayActive = memoryDb.data.users.filter(u =>
        (u.last_login_time && u.last_login_time.startsWith(dateStr)) ||
        memoryDb.data.orders.some(o => o.user_id === u.id && o.create_time.startsWith(dateStr))
      ).length;
      last7Days.push({
        date: dateStr,
        active_count: dayActive
      });
    }

    res.json(success({
      active_users: activeUsers,
      total_users: totalUsers,
      activity_rate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0.0',
      last7_days: last7Days
    }));
  } catch (err) {
    console.error('获取活跃度数据失败:', err);
    res.json(error('获取失败'));
  }
}

async function getRepurchaseRate(req, res) {
  try {
    const users = memoryDb.data.users;
    const repeatUsers = users.filter(u => {
      const orders = memoryDb.data.orders.filter(o => o.user_id === u.id);
      return orders.length >= 2;
    });

    const totalOrders = memoryDb.data.orders.length;
    const repeatOrders = memoryDb.data.orders.filter(o => {
      const userOrders = memoryDb.data.orders.filter(u => u.user_id === o.user_id);
      return userOrders.length >= 2;
    }).length;

    res.json(success({
      repeat_user_count: repeatUsers.length,
      total_users: users.length,
      repurchase_rate: users.length > 0 ? ((repeatUsers.length / users.length) * 100).toFixed(1) : '0.0',
      repeat_order_count: repeatOrders,
      total_orders: totalOrders,
      order_repurchase_rate: totalOrders > 0 ? ((repeatOrders / totalOrders) * 100).toFixed(1) : '0.0'
    }));
  } catch (err) {
    console.error('获取复购率数据失败:', err);
    res.json(error('获取失败'));
  }
}

async function getCompanionStatistics(req, res) {
  try {
    const companions = memoryDb.data.companions;

    const stats = companions.map(c => {
      const orders = memoryDb.data.orders.filter(o => o.companion_id === c.id);
      const accepted = orders.filter(o => o.status !== 'pending_accept');
      const evaluations = memoryDb.data.evaluations.filter(e => e.companion_id === c.id);
      const goodEval = evaluations.filter(e => e.rating >= 4);
      const complaints = memoryDb.data.complaints.filter(co => co.companion_id === c.id);
      const incomes = memoryDb.data.incomes.filter(i => i.companion_id === c.id);

      return {
        id: c.id,
        name: c.real_name,
        order_count: orders.length,
        accept_rate: orders.length > 0 ? ((accepted.length / orders.length) * 100).toFixed(1) : '0.0',
        good_rate: evaluations.length > 0 ? ((goodEval.length / evaluations.length) * 100).toFixed(1) : '0.0',
        complaint_count: complaints.length,
        income_total: incomes.reduce((sum, i) => sum + parseFloat(i.actual_amount || 0), 0).toFixed(2),
        rating: c.rating
      };
    });

    stats.sort((a, b) => b.order_count - a.order_count);

    res.json(success({
      total_companions: companions.length,
      active_companions: companions.filter(c => c.status === 1).length,
      avg_accept_rate: stats.length > 0 ? (stats.reduce((sum, s) => sum + parseFloat(s.accept_rate), 0) / stats.length).toFixed(1) : '0.0',
      avg_good_rate: stats.length > 0 ? (stats.reduce((sum, s) => sum + parseFloat(s.good_rate), 0) / stats.length).toFixed(1) : '0.0',
      list: stats
    }));
  } catch (err) {
    console.error('获取陪诊师统计失败:', err);
    res.json(error('获取失败'));
  }
}

async function getUserStatistics(req, res) {
  try {
    const totalUsers = memoryDb.data.users.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newToday = memoryDb.data.users.filter(u => {
      const d = new Date(u.create_time);
      return d >= today;
    }).length;

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newThisMonth = memoryDb.data.users.filter(u => {
      const d = new Date(u.create_time);
      return d >= thisMonth;
    }).length;

    const activeUsers = memoryDb.data.orders.filter(o => {
      const d = new Date(o.create_time);
      return d >= today;
    }).map(o => o.user_id).filter((v, i, a) => a.indexOf(v) === i).length;

    const disabledUsers = memoryDb.data.users.filter(u => u.status === 0).length;

    const growthData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = memoryDb.data.users.filter(u => u.create_time && u.create_time.startsWith(dateStr)).length;
      growthData.push({ date: dateStr, count });
    }

    res.json(success({
      totalUsers,
      newToday,
      newThisMonth,
      activeUsers,
      disabledUsers,
      growthData
    }));
  } catch (err) {
    console.error('获取用户统计失败:', err);
    res.json(error('获取失败'));
  }
}

async function processRefund(req, res) {
  try {
    const { id } = req.params;
    const { action, remark } = req.body;

    const order = memoryDb.data.orders.find(o => o.id === parseInt(id));
    if (!order) {
      return res.json(error('订单不存在'));
    }

    if (order.status !== 6) {
      return res.json(error('订单状态不允许退款操作'));
    }

    if (action === 'approve') {
      order.status = 7;
      order.refund_status = 2;
      order.refund_time = new Date().toISOString();
      order.refund_remark = remark;
    } else if (action === 'reject') {
      order.status = 3;
      order.refund_status = 3;
      order.refund_reject_reason = remark;
    } else {
      return res.json(error('无效操作'));
    }

    memoryDb.save();
    res.json(success(null, '操作成功'));
  } catch (err) {
    console.error('处理退款失败:', err);
    res.json(error('操作失败'));
  }
}

async function getCommissionList(req, res) {
  try {
    const { page = 1, pageSize = 10, companion_id, start_date, end_date } = req.query;
    let orders = memoryDb.data.orders.filter(o => o.status >= 3 && o.status !== 7);

    if (companion_id) {
      orders = orders.filter(o => o.companion_id === parseInt(companion_id));
    }
    if (start_date) {
      orders = orders.filter(o => new Date(o.created_at) >= new Date(start_date));
    }
    if (end_date) {
      orders = orders.filter(o => new Date(o.created_at) <= new Date(end_date));
    }

    const platformRate = memoryDb.data.settings?.platform_rate || 0.2;
    const details = orders.map(o => {
      const totalAmount = parseFloat(o.total_price || 0);
      const platformAmount = totalAmount * platformRate;
      const companionAmount = totalAmount - platformAmount;
      return {
        id: o.id,
        order_no: o.order_no,
        user_id: o.user_id,
        companion_id: o.companion_id,
        total_amount: totalAmount.toFixed(2),
        platform_amount: platformAmount.toFixed(2),
        companion_amount: companionAmount.toFixed(2),
        platform_rate: (platformRate * 100).toFixed(0) + '%',
        created_at: o.created_at,
        status: o.status
      };
    });

    const total = details.length;
    const start = (page - 1) * pageSize;
    const list = details.slice(start, start + parseInt(pageSize));

    const totalAmount = details.reduce((sum, d) => sum + parseFloat(d.total_amount), 0);
    const totalPlatform = details.reduce((sum, d) => sum + parseFloat(d.platform_amount), 0);
    const totalCompanion = details.reduce((sum, d) => sum + parseFloat(d.companion_amount), 0);

    res.json(success({
      list,
      total,
      summary: {
        totalAmount: totalAmount.toFixed(2),
        totalPlatform: totalPlatform.toFixed(2),
        totalCompanion: totalCompanion.toFixed(2),
        orderCount: total
      }
    }));
  } catch (err) {
    console.error('获取分成明细失败:', err);
    res.json(error('获取失败'));
  }
}

async function getCompanionPerformance(req, res) {
  try {
    const { companion_id } = req.params;
    const companion = memoryDb.data.companions.find(c => c.id === parseInt(companion_id));
    if (!companion) {
      return res.json(error('陪诊师不存在'));
    }

    const orders = memoryDb.data.orders.filter(o => o.companion_id === parseInt(companion_id));
    const totalOrders = orders.length;
    const acceptedOrders = orders.filter(o => o.status >= 2 && o.status !== 4).length;
    const completedOrders = orders.filter(o => o.status === 3).length;
    const cancelledOrders = orders.filter(o => o.status === 4).length;
    const totalAmount = orders.filter(o => o.status >= 3 && o.status !== 7)
      .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

    const ratings = memoryDb.data.ratings.filter(r => r.companion_id === parseInt(companion_id));
    const totalRating = ratings.length;
    const goodRating = ratings.filter(r => r.score >= 4).length;
    const ratingRate = totalRating > 0 ? (goodRating / totalRating * 100).toFixed(1) + '%' : '0%';
    const avgScore = totalRating > 0 ? (ratings.reduce((sum, r) => sum + r.score, 0) / totalRating).toFixed(1) : '0.0';

    const complaints = memoryDb.data.complaints.filter(c => c.companion_id === parseInt(companion_id));

    res.json(success({
      companion: { id: companion.id, name: companion.name, phone: companion.phone },
      totalOrders,
      acceptedOrders,
      completedOrders,
      cancelledOrders,
      totalAmount: totalAmount.toFixed(2),
      totalRating,
      goodRating,
      ratingRate,
      avgScore,
      complaintCount: complaints.length
    }));
  } catch (err) {
    console.error('获取陪诊师绩效失败:', err);
    res.json(error('获取失败'));
  }
}

async function getDisputeList(req, res) {
  try {
    const { page = 1, pageSize = 10, status, keyword } = req.query;
    let complaints = [...memoryDb.data.complaints];

    if (status && status !== '') {
      complaints = complaints.filter(c => String(c.status) === String(status));
    }
    if (keyword) {
      complaints = complaints.filter(c =>
        (c.content && c.content.includes(keyword))
      );
    }

    complaints.reverse();

    const total = complaints.length;
    const start = (page - 1) * pageSize;
    const list = complaints.slice(start, start + parseInt(pageSize)).map(c => {
      const order = memoryDb.data.orders.find(o => o.id === c.order_id);
      const user = memoryDb.data.users.find(u => u.id === c.user_id);
      const companion = memoryDb.data.companions.find(co => co.id === c.companion_id);
      return {
        ...c,
        order_no: order?.order_no || '',
        user_name: user?.nickname || user?.name || '',
        user_phone: user?.phone || '',
        companion_name: companion?.name || '',
        companion_phone: companion?.phone || ''
      };
    });

    res.json(success({ list, total, totalPages: Math.ceil(total / pageSize) }));
  } catch (err) {
    console.error('获取纠纷列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getReconciliationList(req, res) {
  try {
    const { page = 1, pageSize = 10, start_date, end_date, type } = req.query;
    let records = [];

    memoryDb.data.orders.filter(o => o.status >= 3 && o.status !== 7).forEach(o => {
      records.push({
        id: 'O-' + o.id,
        type: '收入',
        amount: parseFloat(o.total_price || 0),
        description: `订单#${o.order_no}`,
        created_at: o.created_at
      });
    });

    memoryDb.data.withdraws.filter(w => w.status === 1).forEach(w => {
      records.push({
        id: 'W-' + w.id,
        type: '支出',
        amount: -parseFloat(w.amount || 0),
        description: `提现#${w.id}`,
        created_at: w.created_at
      });
    });

    if (type && type !== '') {
      records = records.filter(r => r.type === type);
    }
    if (start_date) {
      records = records.filter(r => new Date(r.created_at) >= new Date(start_date));
    }
    if (end_date) {
      records = records.filter(r => new Date(r.created_at) <= new Date(end_date));
    }

    records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = records.length;
    const start = (page - 1) * pageSize;
    const list = records.slice(start, start + parseInt(pageSize));

    const totalIncome = records.filter(r => r.type === '收入').reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = records.filter(r => r.type === '支出').reduce((sum, r) => sum + Math.abs(r.amount), 0);

    res.json(success({
      list,
      total,
      summary: {
        totalIncome: totalIncome.toFixed(2),
        totalExpense: totalExpense.toFixed(2),
        balance: (totalIncome - totalExpense).toFixed(2)
      }
    }));
  } catch (err) {
    console.error('获取对账列表失败:', err);
    res.json(error('获取失败'));
  }
}

module.exports = {
  getDashboardStats,
  getUserList,
  getUserDetail,
  updateUserStatus,
  getCompanionList,
  getCompanionDetail,
  auditCompanion,
  auditVerification,
  auditQualification,
  updateCompanionService,
  updateCompanionRating,
  getOrderList,
  getOrderDetail,
  getOrderStatistics,
  exportOrders,
  getAfterSalesList,
  handleAfterSales,
  getBannerList,
  saveBanner,
  deleteBanner,
  getHospitalList,
  saveHospital,
  deleteHospital,
  getDepartmentList,
  saveDepartment,
  deleteDepartment,
  getCouponList,
  saveCoupon,
  deleteCoupon,
  getComplaintList,
  handleComplaint,
  getFinanceList,
  getFinanceStatistics,
  getWithdrawList,
  handleWithdraw,
  getInvoiceList,
  handleInvoice,
  getServiceList,
  saveService,
  deleteService,
  getCityList,
  saveCity,
  deleteCity,
  getFaqList,
  saveFaq,
  deleteFaq,
  getSettings,
  updateSettings,
  getUserGrowthStats,
  getActivityStats,
  getRepurchaseRate,
  getCompanionStatistics,
  getUserStatistics,
  processRefund,
  getCommissionList,
  getCompanionPerformance,
  getDisputeList,
  getReconciliationList
};