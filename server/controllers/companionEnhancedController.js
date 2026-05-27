const memoryDb = require('../utils/memoryDb');
const { success, error, paginate } = require('../utils/response');
const dayjs = require('dayjs');

async function submitVerification(req, res) {
  const companionId = req.user.id;
  const { real_name, id_card, id_card_front, id_card_back, face_photo } = req.body;

  if (!real_name || !id_card || !id_card_front || !id_card_back || !face_photo) {
    return res.json(error('请填写完整的实名认证信息'));
  }

  try {
    const existing = memoryDb.findOne('companionVerifications', { companion_id: companionId });
    if (existing) {
      memoryDb.update('companionVerifications', existing.id, {
        real_name,
        id_card,
        id_card_front,
        id_card_back,
        face_photo,
        verification_status: 0,
        verification_remark: ''
      });
    } else {
      memoryDb.insert('companionVerifications', {
        companion_id: companionId,
        real_name,
        id_card,
        id_card_front,
        id_card_back,
        face_photo,
        verification_status: 0
      });
    }

    res.json(success(null, '实名认证信息已提交，等待审核'));
  } catch (err) {
    console.error('提交实名认证失败:', err);
    res.json(error('提交失败'));
  }
}

async function getVerification(req, res) {
  const companionId = req.user.id;

  try {
    const verification = memoryDb.findOne('companionVerifications', { companion_id: companionId });
    res.json(success(verification));
  } catch (err) {
    console.error('获取实名认证信息失败:', err);
    res.json(error('获取失败'));
  }
}

async function getQualificationList(req, res) {
  const companionId = req.user.id;

  try {
    const qualifications = memoryDb.findAll('companionQualifications', { companion_id: companionId });
    res.json(success(qualifications));
  } catch (err) {
    console.error('获取资质列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function addQualification(req, res) {
  const companionId = req.user.id;
  const { type, type_name, cert_no, issue_date, expire_date, images } = req.body;

  if (!type || !type_name || !cert_no || !images) {
    return res.json(error('请填写完整的资质信息'));
  }

  try {
    const id = memoryDb.insert('companionQualifications', {
      companion_id: companionId,
      type,
      type_name,
      cert_no,
      issue_date: issue_date || null,
      expire_date: expire_date || null,
      images,
      status: 0
    });

    res.json(success({ id }, '资质已提交，等待审核'));
  } catch (err) {
    console.error('添加资质失败:', err);
    res.json(error('添加失败'));
  }
}

async function deleteQualification(req, res) {
  const companionId = req.user.id;
  const id = parseInt(req.params.id);

  try {
    const qualification = memoryDb.findOne('companionQualifications', { id, companion_id: companionId });
    if (!qualification) {
      return res.json(error('资质不存在'));
    }

    memoryDb.remove('companionQualifications', id);
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error('删除资质失败:', err);
    res.json(error('删除失败'));
  }
}

async function getServiceSettings(req, res) {
  const companionId = req.user.id;

  try {
    const companion = memoryDb.findOne('companions', { id: companionId });
    
    if (companion) {
      res.json(success({
        city_ids: companion.city_ids ? companion.city_ids.split(',').map(Number) : [],
        hospital_ids: companion.hospital_ids ? companion.hospital_ids.split(',').map(Number) : [],
        department_ids: companion.department_ids ? companion.department_ids.split(',').map(Number) : [],
        service_type_ids: companion.service_type_ids ? companion.service_type_ids.split(',').map(Number) : [],
        time_slot_ids: companion.time_slot_ids ? companion.time_slot_ids.split(',').map(Number) : [],
        base_price: companion.base_price || '',
        price_per_hour: companion.price_per_hour || '',
        work_status: companion.work_status !== undefined ? companion.work_status : 1
      }));
    } else {
      res.json(success({
        city_ids: [],
        hospital_ids: [],
        department_ids: [],
        service_type_ids: [],
        time_slot_ids: [],
        base_price: '',
        price_per_hour: '',
        work_status: 1
      }));
    }
  } catch (err) {
    console.error('获取服务设置失败:', err);
    res.json(error('获取失败'));
  }
}

async function saveServiceSettings(req, res) {
  const companionId = req.user.id;
  const {
    city_ids,
    hospital_ids,
    department_ids,
    service_type_ids,
    time_slot_ids,
    base_price,
    price_per_hour,
    work_status
  } = req.body;

  try {
    const updateData = {};
    
    if (city_ids !== undefined) {
      updateData.city_ids = Array.isArray(city_ids) ? city_ids.join(',') : '';
    }
    if (hospital_ids !== undefined) {
      updateData.hospital_ids = Array.isArray(hospital_ids) ? hospital_ids.join(',') : '';
    }
    if (department_ids !== undefined) {
      updateData.department_ids = Array.isArray(department_ids) ? department_ids.join(',') : '';
    }
    if (service_type_ids !== undefined) {
      updateData.service_type_ids = Array.isArray(service_type_ids) ? service_type_ids.join(',') : '';
    }
    if (time_slot_ids !== undefined) {
      updateData.time_slot_ids = Array.isArray(time_slot_ids) ? time_slot_ids.join(',') : '';
    }
    if (base_price !== undefined) {
      updateData.base_price = base_price;
    }
    if (price_per_hour !== undefined) {
      updateData.price_per_hour = price_per_hour;
    }
    if (work_status !== undefined) {
      updateData.work_status = work_status;
    }

    memoryDb.update('companions', companionId, updateData);

    res.json(success(null, '服务设置已保存'));
  } catch (err) {
    console.error('保存服务设置失败:', err);
    res.json(error('保存失败'));
  }
}

async function getHallOrders(req, res) {
  const companionId = req.user.id;
  const { type = 'recommend', page = 1, pageSize = 10, latitude, longitude } = req.query;

  try {
    const companion = memoryDb.findOne('companions', { id: companionId });
    if (!companion || companion.status !== 1) {
      return res.json(error('账号未审核通过，无法接单'));
    }

    const verification = memoryDb.findOne('companionVerifications', { companion_id: companionId });
    if (!verification || verification.verification_status !== 1) {
      return res.json(error('请先完成实名认证'));
    }

    let orders = memoryDb.data.orders.filter(o => o.status === 'pending_accept');

    const companionCities = memoryDb.findAll('companionCities', { companion_id: companionId });
    const cityIds = companionCities.map(c => c.city_id);
    if (cityIds.length > 0) {
      orders = orders.filter(o => cityIds.includes(o.city_id));
    }

    const companionHospitals = memoryDb.findAll('companionHospitals', { companion_id: companionId });
    const hospitalIds = companionHospitals.map(h => h.hospital_id);
    if (hospitalIds.length > 0) {
      orders = orders.filter(o => hospitalIds.includes(o.hospital_id));
    }

    if (type === 'nearby' && latitude && longitude) {
      orders.forEach(order => {
        const hospital = memoryDb.findOne('hospitals', { id: order.hospital_id });
        if (hospital && hospital.latitude && hospital.longitude) {
          order.distance = getDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(hospital.latitude),
            parseFloat(hospital.longitude)
          );
          order.distance_text = order.distance < 1
            ? `${(order.distance * 1000).toFixed(0)}m`
            : `${order.distance.toFixed(1)}km`;
        } else {
          order.distance = Math.random() * 10;
          order.distance_text = `${order.distance.toFixed(1)}km`;
        }
      });
      orders.sort((a, b) => a.distance - b.distance);
    } else {
      orders.forEach(order => {
        order.distance = Math.random() * 10;
        order.distance_text = `${order.distance.toFixed(1)}km`;
      });
    }

    orders.forEach(item => {
      const service = memoryDb.findOne('services', { id: item.service_id });
      const hospital = memoryDb.findOne('hospitals', { id: item.hospital_id });
      const department = memoryDb.findOne('departments', { id: item.department_id });
      const patient = memoryDb.findOne('patients', { id: item.patient_id });

      item.service_name = service?.name || '';
      item.hospital_name = hospital?.name || '';
      item.department_name = department?.name || '';
      item.hospital_address = hospital?.address || '';
      if (patient) {
        item.patient_age = patient.age;
        item.patient_gender = patient.gender;
      }
    });

    const total = orders.length;
    const start = (page - 1) * pageSize;
    const list = orders.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取接单大厅订单失败:', err);
    res.json(error('获取失败'));
  }
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function grabOrder(req, res) {
  const companionId = req.user.id;
  const orderId = parseInt(req.params.id);

  try {
    const order = memoryDb.findOne('orders', { id: orderId, status: 'pending_accept' });
    if (!order) {
      return res.json(error('订单不存在或已被接单'));
    }

    const existingGrab = memoryDb.findOne('orderGrabs', { order_id: orderId, companion_id: companionId });
    if (existingGrab) {
      return res.json(error('您已抢过此订单'));
    }

    memoryDb.insert('orderGrabs', {
      order_id: orderId,
      companion_id: companionId,
      is_success: 0
    });

    const delay = Math.random() * 1000;
    setTimeout(() => {
      const currentOrder = memoryDb.findOne('orders', { id: orderId });
      if (currentOrder && currentOrder.status === 'pending_accept') {
        memoryDb.update('orders', orderId, {
          companion_id: companionId,
          status: 'pending_service',
          accept_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });

        const grabs = memoryDb.findAll('orderGrabs', { order_id: orderId });
        grabs.forEach(g => {
          if (g.companion_id === companionId) {
            memoryDb.update('orderGrabs', g.id, { is_success: 1 });
          }
        });
      }
    }, delay);

    res.json(success(null, '抢单请求已发送'));
  } catch (err) {
    console.error('抢单失败:', err);
    res.json(error('抢单失败'));
  }
}

async function acceptOrder(req, res) {
  const companionId = req.user.id;
  const orderId = parseInt(req.params.id);

  try {
    const order = memoryDb.findOne('orders', { id: orderId, status: 'pending_accept' });
    if (!order) {
      return res.json(error('订单不存在或已被接单'));
    }

    if (order.companion_id && order.companion_id !== companionId) {
      return res.json(error('此订单已被其他陪诊师接取'));
    }

    memoryDb.update('orders', orderId, {
      status: 'pending_service',
      accept_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    res.json(success(null, '接单成功'));
  } catch (err) {
    console.error('接单失败:', err);
    res.json(error('接单失败'));
  }
}

async function rejectOrder(req, res) {
  const companionId = req.user.id;
  const orderId = parseInt(req.params.id);
  const { reason } = req.body;

  try {
    const order = memoryDb.findOne('orders', { id: orderId, companion_id: companionId });
    if (!order) {
      return res.json(error('订单不存在'));
    }

    memoryDb.update('orders', orderId, {
      companion_id: 0,
      reject_reason: reason || '无法服务'
    });

    res.json(success(null, '已拒绝订单'));
  } catch (err) {
    console.error('拒单失败:', err);
    res.json(error('拒单失败'));
  }
}

async function checkin(req, res) {
  const companionId = req.user.id;
  const orderId = parseInt(req.params.id);
  const { type, latitude, longitude, address, photo, remark } = req.body;

  if (!type) {
    return res.json(error('请选择打卡类型'));
  }

  try {
    const order = memoryDb.findOne('orders', { id: orderId, companion_id: companionId });
    if (!order) {
      return res.json(error('订单不存在'));
    }

    const checkinId = memoryDb.insert('orderCheckins', {
      order_id: orderId,
      companion_id: companionId,
      type,
      latitude: latitude || 0,
      longitude: longitude || 0,
      address: address || '',
      photo: photo || '',
      remark: remark || ''
    });

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let updateData = {};

    if (type === 'arrive') {
      updateData.arrive_time = now;
    } else if (type === 'start') {
      updateData.start_time = now;
      updateData.status = 'in_service';
    } else if (type === 'complete') {
      updateData.complete_time = now;
      updateData.status = 'pending_evaluation';

      const incomeAmount = order.total_price;
      const platformFeeRate = memoryDb.data.settings.platform_fee_rate || 0.2;
      const platformFee = incomeAmount * platformFeeRate;
      const actualAmount = incomeAmount - platformFee;

      memoryDb.insert('incomes', {
        companion_id: companionId,
        order_id: orderId,
        order_no: order.order_no,
        type: 'order',
        amount: incomeAmount,
        platform_fee: platformFee,
        service_fee: 0,
        actual_amount: actualAmount,
        remark: '订单收入'
      });

      const companion = memoryDb.findOne('companions', { id: companionId });
      if (companion) {
        memoryDb.update('companions', companionId, {
          order_count: companion.order_count + 1
        });
      }
    }

    if (Object.keys(updateData).length > 0) {
      memoryDb.update('orders', orderId, updateData);
    }

    res.json(success({ id: checkinId }, '打卡成功'));
  } catch (err) {
    console.error('打卡失败:', err);
    res.json(error('打卡失败'));
  }
}

async function getCheckinList(req, res) {
  const companionId = req.user.id;
  const orderId = parseInt(req.params.id);

  try {
    const checkins = memoryDb.findAll('orderCheckins', { order_id: orderId, companion_id: companionId });
    checkins.sort((a, b) => new Date(a.create_time) - new Date(b.create_time));
    res.json(success(checkins));
  } catch (err) {
    console.error('获取打卡记录失败:', err);
    res.json(error('获取失败'));
  }
}

async function addOrderNode(req, res) {
  const companionId = req.user.id;
  const orderId = parseInt(req.params.id);
  const { node_type, node_name, remark, images } = req.body;

  if (!node_type || !node_name) {
    return res.json(error('请填写节点信息'));
  }

  try {
    const order = memoryDb.findOne('orders', { id: orderId, companion_id: companionId });
    if (!order) {
      return res.json(error('订单不存在'));
    }

    const nodeId = memoryDb.insert('orderNodes', {
      order_id: orderId,
      node_type,
      node_name,
      remark: remark || '',
      images: images || '',
      operator_id: companionId,
      operator_type: 'companion'
    });

    res.json(success({ id: nodeId }, '节点已更新'));
  } catch (err) {
    console.error('添加就诊节点失败:', err);
    res.json(error('添加失败'));
  }
}

async function getOrderNodes(req, res) {
  const companionId = req.user.id;
  const orderId = parseInt(req.params.id);

  try {
    const nodes = memoryDb.findAll('orderNodes', { order_id: orderId });
    nodes.sort((a, b) => new Date(a.create_time) - new Date(b.create_time));
    res.json(success(nodes));
  } catch (err) {
    console.error('获取就诊节点失败:', err);
    res.json(error('获取失败'));
  }
}

async function uploadServiceFile(req, res) {
  const companionId = req.user.id;
  const orderId = parseInt(req.params.id);
  const { file_type, file_name, file_url, remark } = req.body;

  if (!file_type || !file_url) {
    return res.json(error('请上传文件'));
  }

  try {
    const order = memoryDb.findOne('orders', { id: orderId, companion_id: companionId });
    if (!order) {
      return res.json(error('订单不存在'));
    }

    const fileId = memoryDb.insert('orderServiceFiles', {
      order_id: orderId,
      companion_id: companionId,
      file_type,
      file_name: file_name || '',
      file_url,
      remark: remark || ''
    });

    res.json(success({ id: fileId }, '上传成功'));
  } catch (err) {
    console.error('上传服务资料失败:', err);
    res.json(error('上传失败'));
  }
}

async function getServiceFiles(req, res) {
  const companionId = req.user.id;
  const orderId = parseInt(req.params.id);

  try {
    const files = memoryDb.findAll('orderServiceFiles', { order_id: orderId, companion_id: companionId });
    files.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
    res.json(success(files));
  } catch (err) {
    console.error('获取服务资料失败:', err);
    res.json(error('获取失败'));
  }
}

async function getIncomeStatistics(req, res) {
  const companionId = req.user.id;
  const { month } = req.query;

  try {
    const incomes = memoryDb.findAll('incomes', { companion_id: companionId });

    let filteredIncomes = incomes;
    if (month) {
      filteredIncomes = incomes.filter(i => i.create_time.startsWith(month));
    }

    const totalIncome = filteredIncomes
      .filter(i => i.type === 'order')
      .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

    const totalPlatformFee = filteredIncomes
      .filter(i => i.type === 'order')
      .reduce((sum, i) => sum + parseFloat(i.platform_fee || 0), 0);

    const totalWithdraw = filteredIncomes
      .filter(i => i.type === 'withdraw')
      .reduce((sum, i) => sum + Math.abs(parseFloat(i.amount || 0)), 0);

    const totalActual = filteredIncomes
      .filter(i => i.type === 'order')
      .reduce((sum, i) => sum + parseFloat(i.actual_amount || 0), 0);

    const pendingIncome = totalActual - totalWithdraw;

    const today = dayjs().format('YYYY-MM-DD');
    const todayIncome = filteredIncomes
      .filter(i => i.type === 'order' && i.create_time.startsWith(today))
      .reduce((sum, i) => sum + parseFloat(i.actual_amount || 0), 0);

    const withdraws = memoryDb.findAll('withdraws', { companion_id: companionId });
    const totalWithdrawAmount = withdraws
      .filter(w => w.status === 'success')
      .reduce((sum, w) => sum + parseFloat(w.actual_amount || 0), 0);

    const pendingWithdraw = withdraws
      .filter(w => w.status === 'pending' || w.status === 'processing')
      .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

    res.json(success({
      total_income: totalIncome,
      total_platform_fee: totalPlatformFee,
      total_actual: totalActual,
      total_withdraw: totalWithdrawAmount,
      pending_income: pendingIncome,
      pending_withdraw: pendingWithdraw,
      today_income: todayIncome,
      order_count: filteredIncomes.filter(i => i.type === 'order').length
    }));
  } catch (err) {
    console.error('获取收入统计失败:', err);
    res.json(error('获取失败'));
  }
}

async function getIncomeList(req, res) {
  const companionId = req.user.id;
  const { type, page = 1, pageSize = 10 } = req.query;

  try {
    let incomes = memoryDb.findAll('incomes', { companion_id: companionId });

    if (type && type !== 'all') {
      incomes = incomes.filter(i => i.type === type);
    }

    incomes.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    const total = incomes.length;
    const start = (page - 1) * pageSize;
    const list = incomes.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取收入明细失败:', err);
    res.json(error('获取失败'));
  }
}

async function createWithdraw(req, res) {
  const companionId = req.user.id;
  const { amount, pay_type, account_name, account_no } = req.body;

  if (!amount || amount <= 0) {
    return res.json(error('请输入提现金额'));
  }

  try {
    const minAmount = memoryDb.data.settings.min_withdraw_amount || 100;
    if (amount < minAmount) {
      return res.json(error(`最低提现金额为${minAmount}元`));
    }

    const incomes = memoryDb.findAll('incomes', { companion_id: companionId });
    const totalActual = incomes
      .filter(i => i.type === 'order')
      .reduce((sum, i) => sum + parseFloat(i.actual_amount || 0), 0);

    const withdraws = memoryDb.findAll('withdraws', { companion_id: companionId });
    const totalWithdraw = withdraws
      .filter(w => w.status === 'success' || w.status === 'pending' || w.status === 'processing')
      .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

    const available = totalActual - totalWithdraw;
    if (amount > available) {
      return res.json(error('可提现金额不足'));
    }

    const feeRate = memoryDb.data.settings.withdraw_fee_rate || 0;
    const serviceFee = amount * feeRate;
    const actualAmount = amount - serviceFee;

    const withdrawNo = 'WD' + dayjs().format('YYYYMMDDHHmmss') + Math.random().toString().slice(2, 6);

    const withdrawId = memoryDb.insert('withdraws', {
      companion_id: companionId,
      withdraw_no: withdrawNo,
      amount: parseFloat(amount),
      service_fee: serviceFee,
      actual_amount: actualAmount,
      pay_type: pay_type || 'wechat',
      account_name: account_name || '',
      account_no: account_no || '',
      status: 'pending'
    });

    memoryDb.insert('incomes', {
      companion_id: companionId,
      order_id: 0,
      order_no: withdrawNo,
      type: 'withdraw',
      amount: -parseFloat(amount),
      platform_fee: 0,
      service_fee: serviceFee,
      actual_amount: -actualAmount,
      remark: '提现申请'
    });

    res.json(success({ id: withdrawId, withdraw_no: withdrawNo }, '提现申请已提交'));
  } catch (err) {
    console.error('申请提现失败:', err);
    res.json(error('申请失败'));
  }
}

async function getWithdrawList(req, res) {
  const companionId = req.user.id;
  const { status, page = 1, pageSize = 10 } = req.query;

  try {
    let withdraws = memoryDb.findAll('withdraws', { companion_id: companionId });

    if (status && status !== 'all') {
      withdraws = withdraws.filter(w => w.status === status);
    }

    withdraws.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    const total = withdraws.length;
    const start = (page - 1) * pageSize;
    const list = withdraws.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取提现记录失败:', err);
    res.json(error('获取失败'));
  }
}

async function getProfileDetail(req, res) {
  const companionId = req.user.id;

  try {
    const companion = memoryDb.findOne('companions', { id: companionId });
    if (!companion) {
      return res.json(error('用户不存在'));
    }

    const verification = memoryDb.findOne('companionVerifications', { companion_id: companionId });
    const qualifications = memoryDb.findAll('companionQualifications', { companion_id: companionId });

    const evaluations = memoryDb.data.evaluations.filter(e => e.companion_id === companionId);
    const avgRating = evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length
      : 5;
    const goodRate = evaluations.length > 0
      ? (evaluations.filter(e => e.rating >= 4).length / evaluations.length * 100).toFixed(1)
      : '100.0';

    const orders = memoryDb.data.orders.filter(o => o.companion_id === companionId);
    const orderCount = orders.length;

    const incomes = memoryDb.findAll('incomes', { companion_id: companionId });
    const totalIncome = incomes
      .filter(i => i.type === 'order')
      .reduce((sum, i) => sum + parseFloat(i.actual_amount || 0), 0);

    let verificationStatus = 'pending';
    if (verification) {
      if (verification.verification_status === 1) {
        verificationStatus = 'approved';
      } else if (verification.verification_status === 2) {
        verificationStatus = 'rejected';
      } else {
        verificationStatus = 'pending';
      }
    }

    res.json(success({
      ...companion,
      verification: verification || null,
      qualifications,
      rating: avgRating.toFixed(1),
      order_count: orderCount,
      good_rate: goodRate,
      experience: companion.experience || 0,
      verification_status: verificationStatus,
      avg_rating: avgRating.toFixed(1),
      evaluation_count: evaluations.length,
      total_income: totalIncome,
      skills: companion.skills ? companion.skills.split(',') : []
    }));
  } catch (err) {
    console.error('获取个人信息失败:', err);
    res.json(error('获取失败'));
  }
}

async function getEvaluationList(req, res) {
  const companionId = req.user.id;
  const { page = 1, pageSize = 10 } = req.query;

  try {
    let evaluations = memoryDb.data.evaluations.filter(e => e.companion_id === companionId);
    evaluations.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    evaluations = evaluations.map(e => ({
      ...e,
      tags: e.tags ? e.tags.split(',') : [],
      images: e.images ? e.images.split(',') : []
    }));

    const total = evaluations.length;
    const start = (page - 1) * pageSize;
    const list = evaluations.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取评价列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getStatistics(req, res) {
  const companionId = req.user.id;

  try {
    const orders = memoryDb.data.orders.filter(o => o.companion_id === companionId);

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'pending_evaluation').length;
    const pendingOrders = orders.filter(o => o.status === 'pending_service' || o.status === 'in_service').length;

    const evaluations = memoryDb.data.evaluations.filter(e => e.companion_id === companionId);
    const avgRating = evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length
      : 5;
    const goodRate = evaluations.length > 0
      ? (evaluations.filter(e => e.rating >= 4).length / evaluations.length * 100).toFixed(1)
      : '100.0';

    const incomes = memoryDb.findAll('incomes', { companion_id: companionId });
    const totalIncome = incomes
      .filter(i => i.type === 'order')
      .reduce((sum, i) => sum + parseFloat(i.actual_amount || 0), 0);

    const today = dayjs().format('YYYY-MM-DD');
    const todayOrders = orders.filter(o => o.create_time.startsWith(today)).length;

    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const monthIncome = incomes
      .filter(i => i.type === 'order' && i.create_time >= monthStart)
      .reduce((sum, i) => sum + parseFloat(i.actual_amount || 0), 0);

    res.json(success({
      total_orders: totalOrders,
      completed_orders: completedOrders,
      pending_orders: pendingOrders,
      avg_rating: avgRating.toFixed(1),
      evaluation_count: evaluations.length,
      total_income: totalIncome.toFixed(2),
      today_orders: todayOrders,
      today_order_count: todayOrders,
      month_income: monthIncome.toFixed(2),
      good_rate: goodRate
    }));
  } catch (err) {
    console.error('获取统计数据失败:', err);
    res.json(error('获取失败'));
  }
}

async function getProfile(req, res) {
  return getProfileDetail(req, res);
}

async function getTodayOrders(req, res) {
  const companionId = req.user.id;

  try {
    const today = dayjs().format('YYYY-MM-DD');
    const orders = memoryDb.data.orders.filter(o => 
      o.companion_id === companionId && 
      o.create_time.startsWith(today)
    );

    const orderStatusMap = {
      pending_accept: '待接单',
      accepted: '已接单',
      pending_service: '待服务',
      in_service: '服务中',
      pending_evaluation: '待评价',
      completed: '已完成',
      cancelled: '已取消'
    };

    const result = orders.map(order => ({
      ...order,
      status_text: orderStatusMap[order.status] || order.status
    }));

    res.json(success(result));
  } catch (err) {
    console.error('获取今日订单失败:', err);
    res.json(error('获取失败'));
  }
}

async function getOrderDetail(req, res) {
  const companionId = req.user.id;
  const orderId = parseInt(req.params.id);

  try {
    const order = memoryDb.findOne('orders', { id: orderId, companion_id: companionId });
    
    if (!order) {
      return res.json(error('订单不存在'));
    }

    const orderStatusMap = {
      pending_accept: '待接单',
      accepted: '已接单',
      pending_service: '待服务',
      in_service: '服务中',
      pending_evaluation: '待评价',
      completed: '已完成',
      cancelled: '已取消'
    };

    const result = {
      ...order,
      status_text: orderStatusMap[order.status] || order.status
    };

    res.json(success(result));
  } catch (err) {
    console.error('获取订单详情失败:', err);
    res.json(error('获取失败'));
  }
}

async function startService(req, res) {
  const companionId = req.user.id;
  const orderId = parseInt(req.params.id);

  try {
    const order = memoryDb.findOne('orders', { id: orderId, companion_id: companionId });
    
    if (!order) {
      return res.json(error('订单不存在'));
    }

    if (order.status !== 'accepted' && order.status !== 'pending_service') {
      return res.json(error('当前订单状态无法开始服务'));
    }

    memoryDb.update('orders', orderId, {
      status: 'in_service',
      service_start_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    res.json(success(null, '服务已开始'));
  } catch (err) {
    console.error('开始服务失败:', err);
    res.json(error('操作失败'));
  }
}

async function completeService(req, res) {
  const companionId = req.user.id;
  const orderId = parseInt(req.params.id);

  try {
    const order = memoryDb.findOne('orders', { id: orderId, companion_id: companionId });
    
    if (!order) {
      return res.json(error('订单不存在'));
    }

    if (order.status !== 'in_service') {
      return res.json(error('当前订单状态无法完成服务'));
    }

    memoryDb.update('orders', orderId, {
      status: 'pending_evaluation',
      service_end_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    res.json(success(null, '服务已完成'));
  } catch (err) {
    console.error('完成服务失败:', err);
    res.json(error('操作失败'));
  }
}

async function getSkills(req, res) {
  const companionId = req.user.id;

  try {
    const companion = memoryDb.findOne('companions', { id: companionId });
    
    if (!companion) {
      return res.json(error('用户不存在'));
    }

    res.json(success({
      skills: companion.skills ? companion.skills.split(',') : []
    }));
  } catch (err) {
    console.error('获取技能失败:', err);
    res.json(error('获取失败'));
  }
}

async function updateSkills(req, res) {
  const companionId = req.user.id;
  const { skills } = req.body;

  try {
    const companion = memoryDb.findOne('companions', { id: companionId });
    
    if (!companion) {
      return res.json(error('用户不存在'));
    }

    memoryDb.update('companions', companionId, {
      skills: skills || ''
    });

    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存技能失败:', err);
    res.json(error('保存失败'));
  }
}

async function getTrainingList(req, res) {
  const { category, page = 1, pageSize = 10 } = req.query;

  try {
    let trainings = memoryDb.data.trainings.filter(t => t.status === 1);

    if (category && category !== 'all') {
      trainings = trainings.filter(t => t.category === category);
    }

    trainings.sort((a, b) => b.sort - a.sort || new Date(b.create_time) - new Date(a.create_time));

    const total = trainings.length;
    const start = (page - 1) * pageSize;
    const list = trainings.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取培训资料失败:', err);
    res.json(error('获取失败'));
  }
}

async function getTrainingDetail(req, res) {
  const id = parseInt(req.params.id);

  try {
    const training = memoryDb.findOne('trainings', { id, status: 1 });
    if (!training) {
      return res.json(error('培训资料不存在'));
    }

    memoryDb.update('trainings', id, { view_count: training.view_count + 1 });

    res.json(success({ ...training, view_count: training.view_count + 1 }));
  } catch (err) {
    console.error('获取培训详情失败:', err);
    res.json(error('获取失败'));
  }
}

async function getPlatformRules(req, res) {
  const { type } = req.query;

  try {
    let rules = memoryDb.data.platformRules.filter(r => r.status === 1);

    if (type && type !== 'all') {
      rules = rules.filter(r => r.type === type);
    }

    rules.sort((a, b) => a.sort - b.sort);
    res.json(success(rules));
  } catch (err) {
    console.error('获取平台规则失败:', err);
    res.json(error('获取失败'));
  }
}

async function createComplaint(req, res) {
  const companionId = req.user.id;
  const { type, order_id, title, content, images, contact } = req.body;

  if (!title || !content) {
    return res.json(error('请填写完整信息'));
  }

  try {
    memoryDb.insert('complaints', {
      user_id: 0,
      companion_id: companionId,
      type: type || 'suggestion',
      order_id: order_id || 0,
      title,
      content,
      images: images || '',
      contact: contact || '',
      status: 'pending'
    });

    res.json(success(null, '提交成功，我们会尽快处理'));
  } catch (err) {
    console.error('提交投诉建议失败:', err);
    res.json(error('提交失败'));
  }
}

async function getComplaintList(req, res) {
  const companionId = req.user.id;
  const { page = 1, pageSize = 10 } = req.query;

  try {
    let complaints = memoryDb.findAll('complaints', { companion_id: companionId });
    complaints.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    const total = complaints.length;
    const start = (page - 1) * pageSize;
    const list = complaints.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取投诉建议列表失败:', err);
    res.json(error('获取失败'));
  }
}

module.exports = {
  submitVerification,
  getVerification,
  addQualification,
  getQualificationList,
  deleteQualification,
  getServiceSettings,
  saveServiceSettings,
  getHallOrders,
  grabOrder,
  acceptOrder,
  rejectOrder,
  checkin,
  getCheckinList,
  addOrderNode,
  getOrderNodes,
  uploadServiceFile,
  getServiceFiles,
  getIncomeStatistics,
  getIncomeList,
  createWithdraw,
  getWithdrawList,
  getProfileDetail,
  getEvaluationList,
  getStatistics,
  getTrainingList,
  getTrainingDetail,
  getPlatformRules,
  createComplaint,
  getComplaintList,
  getProfile,
  getTodayOrders,
  getOrderDetail,
  startService,
  completeService,
  getSkills,
  updateSkills
};
