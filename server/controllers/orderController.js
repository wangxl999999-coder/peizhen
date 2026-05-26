const dayjs = require('dayjs');
const uuid = require('uuid');
const db = require('../utils/db');
const { success, error, paginate } = require('../utils/response');
const config = require('../config');

async function calculatePrice(req, res) {
  const { service_type, is_urgent, is_night, is_remote } = req.body;

  try {
    const service = await db.queryOne('SELECT * FROM pz_service_type WHERE type = ? AND status = 1', [service_type]);
    if (!service) {
      return res.json(error('服务类型不存在'));
    }

    const base_price = parseFloat(service.base_price);
    const urgent_fee = is_urgent ? parseFloat(service.urgent_fee) : 0;
    const night_fee = is_night ? parseFloat(service.night_fee) : 0;
    const remote_fee = is_remote ? parseFloat(service.remote_fee) : 0;
    const total_price = base_price + urgent_fee + night_fee + remote_fee;

    res.json(success({
      base_price,
      urgent_fee,
      night_fee,
      remote_fee,
      total_price,
      service_name: service.name
    }));
  } catch (err) {
    console.error('计算价格失败:', err);
    res.json(error('计算失败'));
  }
}

async function createOrder(req, res) {
  const userId = req.user.id;
  const {
    patient_id, service_type, city_id, city, hospital_id, hospital_name, hospital_address,
    department_id, department_name, service_date, time_slot, is_urgent, is_remote,
    companion_id, symptom, special_req
  } = req.body;

  if (!patient_id || !service_type || !service_date || !time_slot || !companion_id) {
    return res.json(error('请填写完整信息'));
  }

  try {
    return await db.transaction(async (conn) => {
      const [service] = await conn.execute('SELECT * FROM pz_service_type WHERE type = ? AND status = 1', [service_type]);
      if (!service || service.length === 0) {
        throw new Error('服务类型不存在');
      }

      const [patient] = await conn.execute('SELECT * FROM pz_patient WHERE id = ? AND user_id = ?', [patient_id, userId]);
      if (!patient || patient.length === 0) {
        throw new Error('就诊人不存在');
      }

      const [companion] = await conn.execute('SELECT * FROM pz_companion WHERE id = ? AND status = 1', [companion_id]);
      if (!companion || companion.length === 0) {
        throw new Error('陪诊师不存在');
      }

      const timeSlotInfo = await db.queryOne('SELECT * FROM pz_time_slot WHERE start_time <= ? AND end_time >= ? AND status = 1', 
        [time_slot.split('-')[0], time_slot.split('-')[1] || time_slot.split('-')[0]]);
      const is_night = timeSlotInfo?.is_night || 0;

      const serviceData = service[0];
      const base_price = parseFloat(serviceData.base_price);
      const urgent_fee = is_urgent ? parseFloat(serviceData.urgent_fee) : 0;
      const night_fee = is_night ? parseFloat(serviceData.night_fee) : 0;
      const remote_fee = is_remote ? parseFloat(serviceData.remote_fee) : 0;
      const total_price = base_price + urgent_fee + night_fee + remote_fee;

      const order_no = 'PZ' + dayjs().format('YYYYMMDDHHmmss') + Math.random().toString().slice(2, 6);

      const patient_info = JSON.stringify({
        id: patient[0].id,
        name: patient[0].name,
        gender: patient[0].gender,
        age: patient[0].age,
        id_card: patient[0].id_card,
        phone: patient[0].phone,
        relation: patient[0].relation,
        medical_card: patient[0].medical_card
      });

      const companion_info = JSON.stringify({
        id: companion[0].id,
        real_name: companion[0].real_name,
        avatar: companion[0].avatar,
        gender: companion[0].gender,
        age: companion[0].age,
        phone: companion[0].phone,
        qualification: companion[0].qualification,
        rating: companion[0].rating
      });

      const [result] = await conn.execute(
        `INSERT INTO pz_order 
         (order_no, user_id, patient_id, patient_info, companion_id, companion_info, service_type, service_name,
          city_id, city, hospital_id, hospital_name, hospital_address, department_id, department_name,
          service_date, time_slot, is_urgent, is_night, is_remote,
          base_price, urgent_fee, night_fee, remote_fee, total_price,
          symptom, special_req, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_accept')`,
        [order_no, userId, patient_id, patient_info, companion_id, companion_info, service_type, serviceData.name,
         city_id, city, hospital_id, hospital_name, hospital_address, department_id, department_name,
         service_date, time_slot, is_urgent ? 1 : 0, is_night, is_remote ? 1 : 0,
         base_price, urgent_fee, night_fee, remote_fee, total_price,
         symptom || '', special_req || '']
      );

      return res.json(success({
        order_id: result.insertId,
        order_no,
        total_price
      }, '订单创建成功'));
    });
  } catch (err) {
    console.error('创建订单失败:', err);
    res.json(error(err.message || '创建失败'));
  }
}

async function getOrderList(req, res) {
  const userId = req.user.id;
  const { status, page = 1, pageSize = 10 } = req.query;

  try {
    let whereSql = 'WHERE user_id = ?';
    let params = [userId];

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
              companion_info
       FROM pz_order ${whereSql} 
       ORDER BY create_time DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    list.forEach(item => {
      if (item.companion_info) {
        item.companion_info = JSON.parse(item.companion_info);
      }
    });

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getOrderDetail(req, res) {
  const userId = req.user.id;
  const orderId = req.params.id;

  try {
    const order = await db.queryOne('SELECT * FROM pz_order WHERE id = ? AND user_id = ?', [orderId, userId]);
    if (!order) {
      return res.json(error('订单不存在'));
    }

    if (order.patient_info) {
      order.patient_info = JSON.parse(order.patient_info);
    }
    if (order.companion_info) {
      order.companion_info = JSON.parse(order.companion_info);
    }

    const postService = await db.queryOne('SELECT * FROM pz_post_service WHERE order_id = ?', [orderId]);
    if (postService && postService.medication_list) {
      postService.medication_list = JSON.parse(postService.medication_list);
    }

    const evaluation = await db.queryOne('SELECT * FROM pz_evaluation WHERE order_id = ?', [orderId]);

    res.json(success({
      ...order,
      post_service: postService,
      evaluation
    }));
  } catch (err) {
    console.error('获取订单详情失败:', err);
    res.json(error('获取失败'));
  }
}

async function cancelOrder(req, res) {
  const userId = req.user.id;
  const orderId = req.params.id;
  const { reason } = req.body;

  try {
    const order = await db.queryOne('SELECT * FROM pz_order WHERE id = ? AND user_id = ?', [orderId, userId]);
    if (!order) {
      return res.json(error('订单不存在'));
    }

    if (!['pending_accept', 'pending_service'].includes(order.status)) {
      return res.json(error('当前状态无法取消'));
    }

    const serviceTime = dayjs(`${order.service_date} ${order.time_slot.split('-')[0]}`);
    const hoursDiff = serviceTime.diff(dayjs(), 'hour');

    if (order.status === 'pending_service' && hoursDiff < config.order.cancelBeforeHours) {
      return res.json(error(`服务开始前${config.order.cancelBeforeHours}小时内无法取消`));
    }

    await db.execute(
      'UPDATE pz_order SET status = ?, cancel_time = NOW(), cancel_reason = ?, cancel_by = ? WHERE id = ?',
      ['cancelled', reason || '', 'user', orderId]
    );

    res.json(success(null, '取消成功'));
  } catch (err) {
    console.error('取消订单失败:', err);
    res.json(error('取消失败'));
  }
}

async function rescheduleOrder(req, res) {
  const userId = req.user.id;
  const orderId = req.params.id;
  const { new_date, new_time_slot, reason } = req.body;

  try {
    const order = await db.queryOne('SELECT * FROM pz_order WHERE id = ? AND user_id = ?', [orderId, userId]);
    if (!order) {
      return res.json(error('订单不存在'));
    }

    if (!['pending_accept', 'pending_service'].includes(order.status)) {
      return res.json(error('当前状态无法改期'));
    }

    if (order.reschedule_count >= config.order.maxRescheduleCount) {
      return res.json(error(`最多只能改期${config.order.maxRescheduleCount}次`));
    }

    const serviceTime = dayjs(`${order.service_date} ${order.time_slot.split('-')[0]}`);
    const hoursDiff = serviceTime.diff(dayjs(), 'hour');

    if (hoursDiff < config.order.cancelBeforeHours) {
      return res.json(error(`服务开始前${config.order.cancelBeforeHours}小时内无法改期`));
    }

    await db.transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO pz_order_reschedule 
         (order_id, old_date, old_time_slot, new_date, new_time_slot, reason, operator_type, operator_id) 
         VALUES (?, ?, ?, ?, ?, ?, 'user', ?)`,
        [orderId, order.service_date, order.time_slot, new_date, new_time_slot, reason || '', userId]
      );

      await conn.execute(
        'UPDATE pz_order SET service_date = ?, time_slot = ?, reschedule_count = reschedule_count + 1 WHERE id = ?',
        [new_date, new_time_slot, orderId]
      );
    });

    res.json(success(null, '改期成功'));
  } catch (err) {
    console.error('改期失败:', err);
    res.json(error('改期失败'));
  }
}

async function createAfterSales(req, res) {
  const userId = req.user.id;
  const { order_id, type, reason, description, refund_amount, images } = req.body;

  if (!order_id || !type || !reason) {
    return res.json(error('请填写完整信息'));
  }

  try {
    const order = await db.queryOne('SELECT * FROM pz_order WHERE id = ? AND user_id = ?', [order_id, userId]);
    if (!order) {
      return res.json(error('订单不存在'));
    }

    const id = await db.insert(
      `INSERT INTO pz_after_sales 
       (order_id, user_id, type, reason, description, refund_amount, images, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [order_id, userId, type, reason, description || '', refund_amount || 0, images || '']
    );

    res.json(success({ id }, '提交成功'));
  } catch (err) {
    console.error('提交售后失败:', err);
    res.json(error('提交失败'));
  }
}

async function createEvaluation(req, res) {
  const userId = req.user.id;
  const { order_id, rating, content, images, tags, is_anonymous } = req.body;

  if (!order_id || !rating) {
    return res.json(error('请填写完整信息'));
  }

  try {
    return await db.transaction(async (conn) => {
      const [order] = await conn.execute('SELECT * FROM pz_order WHERE id = ? AND user_id = ? AND status = "pending_evaluation"', [order_id, userId]);
      if (!order || order.length === 0) {
        throw new Error('订单不存在或状态不允许评价');
      }

      const orderData = order[0];

      await conn.execute(
        `INSERT INTO pz_evaluation 
         (order_id, user_id, companion_id, rating, content, images, tags, is_anonymous) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [order_id, userId, orderData.companion_id, rating, content || '', images || '', tags || '', is_anonymous ? 1 : 0]
      );

      await conn.execute('UPDATE pz_order SET status = "completed" WHERE id = ?', [order_id]);

      const [stats] = await conn.execute(
        'SELECT COUNT(*) as total, AVG(rating) as avg_rating, SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as good_count FROM pz_evaluation WHERE companion_id = ?',
        [orderData.companion_id]
      );

      if (stats && stats.length > 0) {
        const avgRating = stats[0].avg_rating || 5;
        const goodRate = stats[0].total > 0 ? (stats[0].good_count / stats[0].total * 100).toFixed(2) : 100;
        
        await conn.execute(
          'UPDATE pz_companion SET rating = ?, good_rate = ? WHERE id = ?',
          [parseFloat(avgRating).toFixed(2), goodRate, orderData.companion_id]
        );
      }

      return res.json(success(null, '评价成功'));
    });
  } catch (err) {
    console.error('评价失败:', err);
    res.json(error(err.message || '评价失败'));
  }
}

async function getMedicalHistory(req, res) {
  const userId = req.user.id;
  const { page = 1, pageSize = 10 } = req.query;

  try {
    const countResult = await db.queryOne(
      'SELECT COUNT(*) as total FROM pz_order WHERE user_id = ? AND status IN ("completed", "pending_evaluation")',
      [userId]
    );
    const total = countResult.total;

    const offset = (page - 1) * pageSize;
    const list = await db.query(
      `SELECT o.id, o.order_no, o.service_name, o.hospital_name, o.department_name,
              o.service_date, o.total_price, o.status,
              ps.medical_advice, ps.medication_list, ps.recheck_time
       FROM pz_order o
       LEFT JOIN pz_post_service ps ON o.id = ps.order_id
       WHERE o.user_id = ? AND o.status IN ("completed", "pending_evaluation")
       ORDER BY o.service_date DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(pageSize), offset]
    );

    list.forEach(item => {
      if (item.medication_list) {
        item.medication_list = JSON.parse(item.medication_list);
      }
    });

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取就诊记录失败:', err);
    res.json(error('获取失败'));
  }
}

module.exports = {
  calculatePrice,
  createOrder,
  getOrderList,
  getOrderDetail,
  cancelOrder,
  rescheduleOrder,
  createAfterSales,
  createEvaluation,
  getMedicalHistory
};
