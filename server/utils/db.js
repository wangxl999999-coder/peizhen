const memoryDb = require('./memoryDb');

async function query(sql, params = []) {
  const lowerSql = sql.toLowerCase();
  
  if (lowerSql.includes('select * from pz_companion where phone = ?')) {
    const companion = memoryDb.findOne('companions', { phone: params[0] });
    return companion ? [companion] : [];
  }
  
  if (lowerSql.includes('select * from pz_companion where openid = ?')) {
    const companion = memoryDb.findOne('companions', { openid: params[0] });
    return companion ? [companion] : [];
  }
  
  if (lowerSql.includes('select * from pz_user where openid = ?')) {
    const user = memoryDb.findOne('users', { openid: params[0] });
    return user ? [user] : [];
  }
  
  if (lowerSql.includes('select * from pz_user where id = ?')) {
    const user = memoryDb.findOne('users', { id: params[0] });
    return user ? [user] : [];
  }
  
  if (lowerSql.includes('select * from pz_admin where username = ?')) {
    const admin = memoryDb.findOne('admins', { username: params[0] });
    return admin ? [admin] : [];
  }
  
  if (lowerSql.includes('from pz_banner where status = 1')) {
    const banners = memoryDb.findAll('banners', { status: 1 }, 'sort ASC');
    return banners;
  }
  
  if (lowerSql.includes('from pz_city where status = 1') || lowerSql.includes('from pz_city')) {
    return memoryDb.findAll('cities', {}, 'sort ASC');
  }
  
  if (lowerSql.includes('from pz_hospital where city_id = ?')) {
    return memoryDb.findAll('hospitals', { city_id: params[0] }, 'sort ASC');
  }
  
  if (lowerSql.includes('from pz_department where hospital_id = ?')) {
    return memoryDb.findAll('departments', { hospital_id: params[0] }, 'sort ASC');
  }
  
  if (lowerSql.includes('from pz_service where status = 1')) {
    return memoryDb.findAll('services', { status: 1 }, 'sort ASC');
  }
  
  if (lowerSql.includes('from pz_time_slot where status = 1')) {
    return memoryDb.findAll('timeSlots', { status: 1 }, 'id ASC');
  }
  
  if (lowerSql.includes('from pz_faq where status = 1')) {
    return memoryDb.findAll('faqs', { status: 1 }, 'sort ASC');
  }
  
  if (lowerSql.includes('from pz_patient where user_id = ?')) {
    return memoryDb.findAll('patients', { user_id: params[0] }, 'id DESC');
  }
  
  if (lowerSql.includes('from pz_companion where status = 1') && lowerSql.includes('order by rating desc')) {
    let companions = memoryDb.findAll('companions', { status: 1 }, 'rating DESC');
    if (params.length > 0 && lowerSql.includes('city')) {
      companions = companions.filter(c => c.city.includes(params[0]));
    }
    const limit = lowerSql.includes('limit') ? 10 : companions.length;
    return companions.slice(0, limit);
  }
  
  if (lowerSql.includes('from pz_companion_case where companion_id = ?')) {
    return memoryDb.findAll('companionCases', { companion_id: params[0] }, 'id DESC');
  }
  
  if (lowerSql.includes('from pz_evaluation where companion_id = ?')) {
    return memoryDb.findAll('evaluations', { companion_id: params[0] }, 'id DESC');
  }
  
  if (lowerSql.includes('from pz_order where user_id = ?')) {
    return memoryDb.findAll('orders', { user_id: params[0] }, 'id DESC');
  }
  
  if (lowerSql.includes('from pz_order where id = ?')) {
    const order = memoryDb.findOne('orders', { id: params[0] });
    return order ? [order] : [];
  }
  
  if (lowerSql.includes('select count') || lowerSql.includes('sum(')) {
    if (lowerSql.includes('pz_user')) return [{ count: memoryDb.data.users.length }];
    if (lowerSql.includes('pz_companion')) return [{ count: memoryDb.data.companions.length }];
    if (lowerSql.includes('pz_order') && lowerSql.includes('total_price')) {
      return [{ total: memoryDb.data.orders.reduce((sum, o) => sum + o.total_price, 0) }];
    }
    if (lowerSql.includes('pz_order')) return [{ count: memoryDb.data.orders.length }];
    return [{ count: 100 }];
  }
  
  return [];
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function insert(sql, params = []) {
  const lowerSql = sql.toLowerCase();
  
  if (lowerSql.includes('insert into pz_user')) {
    return memoryDb.insert('users', {
      openid: params[0],
      unionid: params[1],
      nickname: params[2],
      avatar: params[3],
      gender: params[4],
      status: 1
    });
  }
  
  if (lowerSql.includes('insert into pz_patient')) {
    return memoryDb.insert('patients', {
      user_id: params[0],
      name: params[1],
      id_card: params[2],
      phone: params[3],
      gender: params[4],
      age: params[5],
      relation: params[6],
      is_default: params[7] || 0
    });
  }
  
  if (lowerSql.includes('insert into pz_order')) {
    return memoryDb.insert('orders', {
      order_no: params[0],
      user_id: params[1],
      companion_id: params[2],
      service_id: params[3],
      patient_id: params[4],
      city_id: params[5],
      hospital_id: params[6],
      department_id: params[7],
      service_date: params[8],
      time_slot: params[9],
      base_price: params[10],
      urgent_fee: params[11],
      night_fee: params[12],
      remote_fee: params[13],
      total_price: params[14],
      status: params[15],
      symptom: params[16],
      special_needs: params[17]
    });
  }
  
  if (lowerSql.includes('insert into pz_evaluation')) {
    return memoryDb.insert('evaluations', {
      order_id: params[0],
      user_id: params[1],
      companion_id: params[2],
      rating: params[3],
      tags: params[4],
      comment: params[5],
      images: params[6] || ''
    });
  }
  
  return Math.floor(Date.now() / 1000);
}

async function execute(sql, params = []) {
  const lowerSql = sql.toLowerCase();
  
  if (lowerSql.includes('update pz_user set') && lowerSql.includes('where id = ?')) {
    const id = params[params.length - 1];
    const updates = {};
    if (lowerSql.includes('nickname')) updates.nickname = params[0];
    if (lowerSql.includes('last_login_time')) {
      return memoryDb.update('users', id, { last_login_time: new Date().toISOString().slice(0, 19).replace('T', ' ') });
    }
    return memoryDb.update('users', id, updates);
  }
  
  if (lowerSql.includes('update pz_companion set') && lowerSql.includes('where id = ?')) {
    const id = params[params.length - 1];
    return memoryDb.update('companions', id, { last_login_time: new Date().toISOString().slice(0, 19).replace('T', ' ') });
  }
  
  if (lowerSql.includes('update pz_patient set') && lowerSql.includes('where id = ?')) {
    const id = params[params.length - 1];
    if (lowerSql.includes('is_default')) {
      return memoryDb.update('patients', id, { is_default: params[0] });
    }
  }
  
  if (lowerSql.includes('update pz_order set') && lowerSql.includes('where id = ?')) {
    const id = params[params.length - 1];
    if (lowerSql.includes('status')) {
      return memoryDb.update('orders', id, { status: params[0] });
    }
  }
  
  if (lowerSql.includes('update pz_admin set') && lowerSql.includes('where id = ?')) {
    const id = params[params.length - 1];
    return memoryDb.update('admins', id, { last_login_time: new Date().toISOString().slice(0, 19).replace('T', ' ') });
  }
  
  if (lowerSql.includes('delete from pz_patient where id = ?')) {
    return memoryDb.remove('patients', params[0]);
  }
  
  return 1;
}

async function transaction(callback) {
  const connection = {
    execute: execute,
    query: query
  };
  return callback(connection);
}

module.exports = {
  query,
  queryOne,
  insert,
  execute,
  transaction,
  pool: {
    getConnection: () => Promise.resolve({
      execute: execute,
      query: query,
      beginTransaction: () => Promise.resolve(),
      commit: () => Promise.resolve(),
      rollback: () => Promise.resolve(),
      release: () => {}
    })
  }
};
