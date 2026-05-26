const db = require('../utils/db');
const { success, error, paginate } = require('../utils/response');

async function getCompanionList(req, res) {
  const { city, service_type, page = 1, pageSize = 10, sort = 'rating' } = req.query;

  try {
    let whereSql = 'WHERE c.status = 1';
    let params = [];

    if (city) {
      whereSql += ' AND c.city = ?';
      params.push(city);
    }

    const countResult = await db.queryOne(`SELECT COUNT(*) as total FROM pz_companion c ${whereSql}`, params);
    const total = countResult.total;

    let orderSql = 'ORDER BY c.rating DESC, c.order_count DESC';
    if (sort === 'order_count') {
      orderSql = 'ORDER BY c.order_count DESC, c.rating DESC';
    } else if (sort === 'distance') {
      orderSql = 'ORDER BY c.id ASC';
    }

    const offset = (page - 1) * pageSize;
    const list = await db.query(
      `SELECT c.id, c.real_name, c.avatar, c.gender, c.age, c.qualification, c.city,
              c.rating, c.order_count, c.good_rate, c.intro, c.skills, c.online_status
       FROM pz_companion c ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    for (let item of list) {
      item.evaluations = await db.query(
        `SELECT e.rating, e.content, e.create_time, u.nickname, u.avatar, e.is_anonymous
         FROM pz_evaluation e
         LEFT JOIN pz_user u ON e.user_id = u.id
         WHERE e.companion_id = ?
         ORDER BY e.create_time DESC
         LIMIT 3`,
        [item.id]
      );

      item.cases = await db.query(
        `SELECT id, title, content, service_type, case_date
         FROM pz_companion_case
         WHERE companion_id = ?
         ORDER BY case_date DESC
         LIMIT 3`,
        [item.id]
      );

      item.skills = item.skills ? item.skills.split(',') : [];
    }

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取陪诊师列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getCompanionDetail(req, res) {
  const companionId = req.params.id;

  try {
    const companion = await db.queryOne(
      `SELECT id, real_name, avatar, gender, age, phone, qualification, qualification_no,
              experience, city, address, latitude, longitude, rating, order_count, good_rate,
              intro, skills, online_status, work_status, create_time
       FROM pz_companion WHERE id = ? AND status = 1`,
      [companionId]
    );

    if (!companion) {
      return res.json(error('陪诊师不存在'));
    }

    companion.skills = companion.skills ? companion.skills.split(',') : [];

    companion.cases = await db.query(
      `SELECT id, title, content, images, service_type, case_date, create_time
       FROM pz_companion_case WHERE companion_id = ? ORDER BY case_date DESC`,
      [companionId]
    );

    const evalCount = await db.queryOne(
      'SELECT COUNT(*) as total FROM pz_evaluation WHERE companion_id = ?',
      [companionId]
    );
    companion.evaluation_count = evalCount.total;

    companion.evaluations = await db.query(
      `SELECT e.id, e.rating, e.content, e.images, e.tags, e.create_time, e.is_anonymous,
              u.nickname, u.avatar
       FROM pz_evaluation e
       LEFT JOIN pz_user u ON e.user_id = u.id
       WHERE e.companion_id = ?
       ORDER BY e.create_time DESC
       LIMIT 10`,
      [companionId]
    );

    companion.evaluations.forEach(item => {
      if (item.is_anonymous) {
        item.nickname = '匿名用户';
        item.avatar = '';
      }
      if (item.tags) {
        item.tags = item.tags.split(',');
      }
      if (item.images) {
        item.images = item.images.split(',');
      }
    });

    res.json(success(companion));
  } catch (err) {
    console.error('获取陪诊师详情失败:', err);
    res.json(error('获取失败'));
  }
}

async function getNearbyCompanions(req, res) {
  const { city, latitude, longitude, page = 1, pageSize = 10 } = req.query;

  try {
    let whereSql = 'WHERE status = 1 AND work_status = 1';
    let params = [];

    if (city) {
      whereSql += ' AND city = ?';
      params.push(city);
    }

    const list = await db.query(
      `SELECT id, real_name, avatar, gender, age, qualification, city, address,
              latitude, longitude, rating, order_count, good_rate, intro, online_status
       FROM pz_companion ${whereSql}
       ORDER BY online_status DESC, rating DESC
       LIMIT ?`,
      [...params, 50]
    );

    list.forEach(item => {
      if (latitude && longitude && item.latitude && item.longitude) {
        item.distance = calculateDistance(
          parseFloat(latitude), parseFloat(longitude),
          parseFloat(item.latitude), parseFloat(item.longitude)
        );
        item.distance_text = item.distance < 1 
          ? `${(item.distance * 1000).toFixed(0)}m` 
          : `${item.distance.toFixed(1)}km`;
      } else {
        item.distance = 999;
        item.distance_text = '未知';
      }
    });

    list.sort((a, b) => a.distance - b.distance);

    const start = (page - 1) * pageSize;
    const result = list.slice(start, start + parseInt(pageSize));

    res.json(success(paginate(result, list.length, page, pageSize)));
  } catch (err) {
    console.error('获取附近陪诊师失败:', err);
    res.json(error('获取失败'));
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getRecommendCompanions(req, res) {
  const { city, limit = 6 } = req.query;

  try {
    let whereSql = 'WHERE status = 1 AND work_status = 1';
    let params = [];

    if (city) {
      whereSql += ' AND city = ?';
      params.push(city);
    }

    const list = await db.query(
      `SELECT id, real_name, avatar, gender, age, qualification, city,
              rating, order_count, good_rate, intro
       FROM pz_companion ${whereSql}
       ORDER BY rating DESC, order_count DESC
       LIMIT ?`,
      [...params, parseInt(limit)]
    );

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
    let whereSql = 'WHERE companion_id = ?';
    let params = [companionId];

    if (status && status !== 'all') {
      whereSql += ' AND status = ?';
      params.push(status);
    }

    const countResult = await db.queryOne(`SELECT COUNT(*) as total FROM pz_order ${whereSql}`, params);
    const total = countResult.total;

    const offset = (page - 1) * pageSize;
    const list = await db.query(
      `SELECT id, order_no, service_type, service_name, hospital_name, department_name,
              service_date, time_slot, total_price, status, create_time,
              patient_info, symptom, special_req
       FROM pz_order ${whereSql} 
       ORDER BY create_time DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    list.forEach(item => {
      if (item.patient_info) {
        item.patient_info = JSON.parse(item.patient_info);
      }
    });

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function acceptOrder(req, res) {
  const companionId = req.user.id;
  const orderId = req.params.id;

  try {
    const order = await db.queryOne('SELECT * FROM pz_order WHERE id = ? AND status = "pending_accept"', [orderId]);
    if (!order) {
      return res.json(error('订单不存在或已被接单'));
    }

    if (order.companion_id != companionId) {
      return res.json(error('无权限操作此订单'));
    }

    await db.execute(
      'UPDATE pz_order SET status = ?, accept_time = NOW() WHERE id = ?',
      ['pending_service', orderId]
    );

    res.json(success(null, '接单成功'));
  } catch (err) {
    console.error('接单失败:', err);
    res.json(error('接单失败'));
  }
}

async function updateOrderStatus(req, res) {
  const companionId = req.user.id;
  const orderId = req.params.id;
  const { action } = req.body;

  try {
    const order = await db.queryOne('SELECT * FROM pz_order WHERE id = ? AND companion_id = ?', [orderId, companionId]);
    if (!order) {
      return res.json(error('订单不存在'));
    }

    let status, timeField;
    switch (action) {
      case 'arrive':
        status = 'in_service';
        timeField = 'arrive_time';
        break;
      case 'start':
        status = 'in_service';
        timeField = 'start_time';
        break;
      case 'complete':
        status = 'pending_evaluation';
        timeField = 'complete_time';
        break;
      default:
        return res.json(error('无效的操作'));
    }

    await db.execute(
      `UPDATE pz_order SET status = ?, ${timeField} = NOW() WHERE id = ?`,
      [status, orderId]
    );

    if (action === 'complete') {
      await db.execute('UPDATE pz_companion SET order_count = order_count + 1 WHERE id = ?', [companionId]);
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
    const order = await db.queryOne('SELECT * FROM pz_order WHERE id = ? AND companion_id = ?', [order_id, companionId]);
    if (!order) {
      return res.json(error('订单不存在'));
    }

    const existing = await db.queryOne('SELECT id FROM pz_post_service WHERE order_id = ?', [order_id]);

    const medListStr = typeof medication_list === 'string' ? medication_list : JSON.stringify(medication_list || []);

    if (existing) {
      await db.execute(
        `UPDATE pz_post_service SET medical_advice = ?, medication_list = ?, recheck_time = ?, notes = ?, images = ? WHERE id = ?`,
        [medical_advice || '', medListStr, recheck_time || null, notes || '', images || '', existing.id]
      );
    } else {
      await db.insert(
        `INSERT INTO pz_post_service 
         (order_id, user_id, companion_id, medical_advice, medication_list, recheck_time, notes, images) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [order_id, order.user_id, companionId, medical_advice || '', medListStr, recheck_time || null, notes || '', images || '']
      );
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
    const companion = await db.queryOne(
      `SELECT id, openid, phone, real_name, avatar, gender, age, id_card, qualification,
              qualification_no, experience, city, address, latitude, longitude, intro, skills,
              rating, order_count, good_rate, status, online_status, work_status, create_time
       FROM pz_companion WHERE id = ?`,
      [companionId]
    );

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
    await db.execute('UPDATE pz_companion SET work_status = ?, online_status = ? WHERE id = ?',
      [work_status, work_status === 1 ? 1 : 0, companionId]);
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
