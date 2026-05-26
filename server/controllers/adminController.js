const db = require('../utils/db');
const { success, error, paginate } = require('../utils/response');

async function getDashboardStats(req, res) {
  try {
    const userCount = await db.queryOne('SELECT COUNT(*) as count FROM pz_user');
    const companionCount = await db.queryOne('SELECT COUNT(*) as count FROM pz_companion WHERE status = 1');
    const orderCount = await db.queryOne('SELECT COUNT(*) as count FROM pz_order');
    const totalAmount = await db.queryOne('SELECT SUM(paid_price) as total FROM pz_order WHERE paid_price > 0');
    const pendingAccept = await db.queryOne('SELECT COUNT(*) as count FROM pz_order WHERE status = "pending_accept"');
    const pendingAudit = await db.queryOne('SELECT COUNT(*) as count FROM pz_companion WHERE status = 0');

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = await db.queryOne(
        'SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as amount FROM pz_order WHERE DATE(create_time) = ?',
        [dateStr]
      );
      
      last7Days.push({
        date: dateStr,
        order_count: dayOrders.count,
        amount: parseFloat(dayOrders.amount)
      });
    }

    const serviceStats = await db.query(
      `SELECT service_name, COUNT(*) as count 
       FROM pz_order 
       GROUP BY service_type 
       ORDER BY count DESC 
       LIMIT 6`
    );

    res.json(success({
      total_users: userCount.count,
      total_companions: companionCount.count,
      total_orders: orderCount.count,
      total_amount: parseFloat(totalAmount.total || 0),
      pending_accept: pendingAccept.count,
      pending_audit: pendingAudit.count,
      last7_days: last7Days,
      service_stats: serviceStats
    }));
  } catch (err) {
    console.error('获取统计数据失败:', err);
    res.json(error('获取失败'));
  }
}

async function getUserList(req, res) {
  const { keyword, page = 1, pageSize = 10 } = req.query;

  try {
    let whereSql = 'WHERE 1=1';
    let params = [];

    if (keyword) {
      whereSql += ' AND (nickname LIKE ? OR phone LIKE ? OR real_name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const countResult = await db.queryOne(`SELECT COUNT(*) as total FROM pz_user ${whereSql}`, params);
    const total = countResult.total;

    const offset = (page - 1) * pageSize;
    const list = await db.query(
      `SELECT id, nickname, avatar, gender, phone, real_name, id_card, status, last_login_time, create_time 
       FROM pz_user ${whereSql} 
       ORDER BY create_time DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function updateUserStatus(req, res) {
  const userId = req.params.id;
  const { status } = req.body;

  try {
    await db.execute('UPDATE pz_user SET status = ? WHERE id = ?', [status, userId]);
    res.json(success(null, '更新成功'));
  } catch (err) {
    console.error('更新用户状态失败:', err);
    res.json(error('更新失败'));
  }
}

async function getCompanionList(req, res) {
  const { keyword, status, page = 1, pageSize = 10 } = req.query;

  try {
    let whereSql = 'WHERE 1=1';
    let params = [];

    if (keyword) {
      whereSql += ' AND (real_name LIKE ? OR phone LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (status !== undefined && status !== '') {
      whereSql += ' AND status = ?';
      params.push(status);
    }

    const countResult = await db.queryOne(`SELECT COUNT(*) as total FROM pz_companion ${whereSql}`, params);
    const total = countResult.total;

    const offset = (page - 1) * pageSize;
    const list = await db.query(
      `SELECT id, real_name, avatar, gender, age, phone, id_card, qualification, qualification_no,
              experience, city, rating, order_count, good_rate, status, audit_time, create_time
       FROM pz_companion ${whereSql} 
       ORDER BY create_time DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取陪诊师列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function auditCompanion(req, res) {
  const companionId = req.params.id;
  const { status } = req.body;

  try {
    await db.execute(
      'UPDATE pz_companion SET status = ?, audit_time = NOW() WHERE id = ?',
      [status, companionId]
    );
    res.json(success(null, '审核成功'));
  } catch (err) {
    console.error('审核陪诊师失败:', err);
    res.json(error('审核失败'));
  }
}

async function getOrderList(req, res) {
  const { keyword, status, page = 1, pageSize = 10 } = req.query;

  try {
    let whereSql = 'WHERE 1=1';
    let params = [];

    if (keyword) {
      whereSql += ' AND (order_no LIKE ? OR hospital_name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (status && status !== 'all') {
      whereSql += ' AND status = ?';
      params.push(status);
    }

    const countResult = await db.queryOne(`SELECT COUNT(*) as total FROM pz_order ${whereSql}`, params);
    const total = countResult.total;

    const offset = (page - 1) * pageSize;
    const list = await db.query(
      `SELECT id, order_no, user_id, companion_id, service_type, service_name, hospital_name, 
              department_name, service_date, time_slot, total_price, paid_price, status, 
              create_time, paid_time
       FROM pz_order ${whereSql} 
       ORDER BY create_time DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取订单列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getAfterSalesList(req, res) {
  const { type, status, page = 1, pageSize = 10 } = req.query;

  try {
    let whereSql = 'WHERE 1=1';
    let params = [];

    if (type) {
      whereSql += ' AND type = ?';
      params.push(type);
    }

    if (status && status !== 'all') {
      whereSql += ' AND status = ?';
      params.push(status);
    }

    const countResult = await db.queryOne(`SELECT COUNT(*) as total FROM pz_after_sales ${whereSql}`, params);
    const total = countResult.total;

    const offset = (page - 1) * pageSize;
    const list = await db.query(
      `SELECT a.*, o.order_no, o.total_price 
       FROM pz_after_sales a 
       LEFT JOIN pz_order o ON a.order_id = o.id 
       ${whereSql} 
       ORDER BY a.create_time DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(success(paginate(list, total, page, pageSize)));
  } catch (err) {
    console.error('获取售后列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function handleAfterSales(req, res) {
  const id = req.params.id;
  const { status, handle_result } = req.body;
  const handlerId = req.user.id;

  try {
    await db.execute(
      'UPDATE pz_after_sales SET status = ?, handle_result = ?, handle_time = NOW(), handler_id = ? WHERE id = ?',
      [status, handle_result || '', handlerId, id]
    );

    if (status === 'completed') {
      const afterSale = await db.queryOne('SELECT order_id, refund_amount FROM pz_after_sales WHERE id = ?', [id]);
      if (afterSale) {
        await db.execute(
          'UPDATE pz_order SET refund_price = refund_price + ? WHERE id = ?',
          [afterSale.refund_amount || 0, afterSale.order_id]
        );
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
    const list = await db.query('SELECT * FROM pz_banner ORDER BY sort ASC, id DESC');
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
      await db.execute(
        `UPDATE pz_banner SET title = ?, image = ?, link_type = ?, link_value = ?, position = ?, 
         sort = ?, start_time = ?, end_time = ?, status = ? WHERE id = ?`,
        [title, image, link_type, link_value, position, sort, start_time || null, end_time || null, status, id]
      );
    } else {
      await db.insert(
        `INSERT INTO pz_banner (title, image, link_type, link_value, position, sort, start_time, end_time, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, image, link_type, link_value, position, sort, start_time || null, end_time || null, status]
      );
    }
    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存Banner失败:', err);
    res.json(error('保存失败'));
  }
}

async function deleteBanner(req, res) {
  const id = req.params.id;

  try {
    await db.execute('DELETE FROM pz_banner WHERE id = ?', [id]);
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error('删除Banner失败:', err);
    res.json(error('删除失败'));
  }
}

async function getFaqList(req, res) {
  try {
    const list = await db.query('SELECT * FROM pz_faq ORDER BY sort ASC, id DESC');
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
      await db.execute(
        'UPDATE pz_faq SET question = ?, answer = ?, category = ?, sort = ?, status = ? WHERE id = ?',
        [question, answer, category, sort, status, id]
      );
    } else {
      await db.insert(
        'INSERT INTO pz_faq (question, answer, category, sort, status) VALUES (?, ?, ?, ?, ?)',
        [question, answer, category, sort, status]
      );
    }
    res.json(success(null, '保存成功'));
  } catch (err) {
    console.error('保存FAQ失败:', err);
    res.json(error('保存失败'));
  }
}

async function deleteFaq(req, res) {
  const id = req.params.id;

  try {
    await db.execute('DELETE FROM pz_faq WHERE id = ?', [id]);
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error('删除FAQ失败:', err);
    res.json(error('删除失败'));
  }
}

module.exports = {
  getDashboardStats,
  getUserList,
  updateUserStatus,
  getCompanionList,
  auditCompanion,
  getOrderList,
  getAfterSalesList,
  handleAfterSales,
  getBannerList,
  saveBanner,
  deleteBanner,
  getFaqList,
  saveFaq,
  deleteFaq
};
