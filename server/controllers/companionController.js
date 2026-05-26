const memoryDb = require('../utils/memoryDb');
const { success, error, paginate } = require('../utils/response');

async function getCompanionList(req, res) {
  const { city, service_type, page = 1, pageSize = 10, sort = 'rating' } = req.query;

  try {
    let companions = [...memoryDb.data.companions].filter(c => c.status === 1);

    if (city) {
      companions = companions.filter(c => c.city === city || c.city.includes(city));
    }

    if (sort === 'order_count') {
      companions.sort((a, b) => b.order_count - a.order_count || b.rating - a.rating);
    } else {
      companions.sort((a, b) => b.rating - a.rating || b.order_count - a.order_count);
    }

    const total = companions.length;
    const start = (page - 1) * pageSize;
    const list = companions.slice(start, start + parseInt(pageSize));

    for (let item of list) {
      item.evaluations = memoryDb.data.evaluations
        .filter(e => e.companion_id === item.id)
        .sort((a, b) => new Date(b.create_time) - new Date(a.create_time))
        .slice(0, 3)
        .map(e => ({
          ...e,
          nickname: '用户',
          avatar: ''
        }));

      item.cases = memoryDb.data.companionCases
        .filter(c => c.companion_id === item.id)
        .sort((a, b) => new Date(b.case_date) - new Date(a.case_date))
        .slice(0, 3);

      item.skills = item.skills ? item.skills.split(',') : [];
    }

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取陪诊师列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getCompanionDetail(req, res) {
  const companionId = parseInt(req.params.id);

  try {
    const companion = memoryDb.findOne('companions', { id: companionId, status: 1 });

    if (!companion) {
      return res.json(error('陪诊师不存在'));
    }

    companion.skills = companion.skills ? companion.skills.split(',') : [];

    companion.cases = memoryDb.data.companionCases
      .filter(c => c.companion_id === companionId)
      .sort((a, b) => new Date(b.case_date) - new Date(a.case_date));

    companion.evaluation_count = memoryDb.data.evaluations.filter(e => e.companion_id === companionId).length;

    companion.evaluations = memoryDb.data.evaluations
      .filter(e => e.companion_id === companionId)
      .sort((a, b) => new Date(b.create_time) - new Date(a.create_time))
      .slice(0, 10)
      .map(e => ({
        ...e,
        nickname: e.is_anonymous ? '匿名用户' : '用户',
        avatar: e.is_anonymous ? '' : '',
        tags: e.tags ? e.tags.split(',') : [],
        images: e.images ? e.images.split(',') : []
      }));

    res.json(success(companion));
  } catch (err) {
    console.error('获取陪诊师详情失败:', err);
    res.json(error('获取失败'));
  }
}

async function getNearbyCompanions(req, res) {
  const { city, page = 1, pageSize = 10 } = req.query;

  try {
    let companions = memoryDb.data.companions.filter(c => c.status === 1 && c.work_status === 1);

    if (city) {
      companions = companions.filter(c => c.city === city || c.city.includes(city));
    }

    companions.forEach(item => {
      item.distance = Math.random() * 5;
      item.distance_text = item.distance < 1 
        ? `${(item.distance * 1000).toFixed(0)}m` 
        : `${item.distance.toFixed(1)}km`;
    });

    companions.sort((a, b) => a.distance - b.distance);

    const total = companions.length;
    const start = (page - 1) * pageSize;
    const result = companions.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(result, total, page, pageSize)));
  } catch (err) {
    console.error('获取附近陪诊师失败:', err);
    res.json(error('获取失败'));
  }
}

async function getRecommendCompanions(req, res) {
  const { city, limit = 6 } = req.query;

  try {
    let companions = memoryDb.data.companions.filter(c => c.status === 1 && c.work_status === 1);

    if (city) {
      companions = companions.filter(c => c.city === city || c.city.includes(city));
    }

    companions.sort((a, b) => b.rating - a.rating || b.order_count - a.order_count);

    const list = companions.slice(0, parseInt(limit)).map(c => ({
      id: c.id,
      real_name: c.real_name,
      avatar: c.avatar,
      gender: c.gender,
      age: c.age,
      qualification: c.qualification,
      city: c.city,
      rating: c.rating,
      order_count: c.order_count,
      good_rate: c.good_rate,
      intro: c.intro
    }));

    res.json(success(list));
  } catch (err) {
    console.error('获取推荐陪诊师失败:', err);
    res.json(error('获取失败'));
  }
}

async function getCompanionOrders(req, res) {
  const companionId = req.user.id;
  const { status, page = 1, pageSize = 10 } = req.query;

  try {
    let orders = memoryDb.data.orders.filter(o => o.companion_id === companionId);

    if (status && status !== 'all') {
      orders = orders.filter(o => o.status === status);
    }

    orders.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));

    const total = orders.length;
    const start = (page - 1) * pageSize;
    const list = orders.slice(start, start + parseInt(pageSize));

    list.forEach(item => {
      const service = memoryDb.findOne('services', { id: item.service_id });
      const hospital = memoryDb.findOne('hospitals', { id: item.hospital_id });
      const department = memoryDb.findOne('departments', { id: item.department_id });
      
      item.service_name = service?.name || '';
      item.hospital_name = hospital?.name || '';
      item.department_name = department?.name || '';
    });

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.json(error('获取失败'));
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

    if (order.companion_id != companionId) {
      return res.json(error('无权限操作此订单'));
    }

    memoryDb.update('orders', orderId, { status: 'pending_service', accept_time: new Date().toISOString().slice(0, 19).replace('T', ' ') });

    res.json(success(null, '接单成功'));
  } catch (err) {
    console.error('接单失败:', err);
    res.json(error('接单失败'));
  }
}

async function updateOrderStatus(req, res) {
  const companionId = req.user.id;
  const orderId = parseInt(req.params.id);
  const { action } = req.body;

  try {
    const order = memoryDb.findOne('orders', { id: orderId });
    if (!order || order.companion_id != companionId) {
      return res.json(error('订单不存在'));
    }

    let status;
    switch (action) {
      case 'arrive':
      case 'start':
        status = 'in_service';
        break;
      case 'complete':
        status = 'pending_evaluation';
        break;
      default:
        return res.json(error('无效的操作'));
    }

    memoryDb.update('orders', orderId, { status });

    if (action === 'complete') {
      const companion = memoryDb.findOne('companions', { id: companionId });
      if (companion) {
        memoryDb.update('companions', companionId, { order_count: companion.order_count + 1 });
      }
    }

    res.json(success(null, '操作成功'));
  } catch (err) {
    console.error('更新订单状态失败:', err);
    res.json(error('操作失败'));
  }
}

async function savePostService(req, res) {
  const companionId = req.user.id;
  const { order_id, medical_advice, medication_list, recheck_time, notes, images } = req.body;

  if (!order_id) {
    return res.json(error('订单ID不能为空'));
  }

  try {
    const order = memoryDb.findOne('orders', { id: parseInt(order_id) });
    if (!order || order.companion_id != companionId) {
      return res.json(error('订单不存在'));
    }

    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存诊后服务失败:', err);
    res.json(error('保存失败'));
  }
}

async function getCompanionInfo(req, res) {
  const companionId = req.user.id;

  try {
    const companion = memoryDb.findOne('companions', { id: companionId });

    if (companion && companion.skills) {
      companion.skills = companion.skills.split(',');
    }

    res.json(success(companion));
  } catch (err) {
    console.error('获取陪诊师信息失败:', err);
    res.json(error('获取失败'));
  }
}

async function updateWorkStatus(req, res) {
  const companionId = req.user.id;
  const { work_status } = req.body;

  try {
    memoryDb.update('companions', companionId, { 
      work_status, 
      online_status: work_status === 1 ? 1 : 0 
    });
    res.json(success(null, '状态更新成功'));
  } catch (err) {
    console.error('更新工作状态失败:', err);
    res.json(error('更新失败'));
  }
}

module.exports = {
  getCompanionList,
  getCompanionDetail,
  getNearbyCompanions,
  getRecommendCompanions,
  getCompanionOrders,
  acceptOrder,
  updateOrderStatus,
  savePostService,
  getCompanionInfo,
  updateWorkStatus
};
