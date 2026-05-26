const data = {
  users: [
    {
      id: 1,
      openid: 'test_user_001',
      unionid: '',
      nickname: '测试用户',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=friendly%20young%20person%20avatar%20portrait&image_size=square',
      phone: '13800138000',
      gender: 1,
      create_time: '2024-01-01 00:00:00',
      last_login_time: '2024-01-01 00:00:00',
      status: 1
    }
  ],
  companions: [
    {
      id: 1,
      openid: 'test_companion_001',
      phone: '13800138001',
      real_name: '张护士',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20nurse%20portrait%20friendly%20smile%20medical%20uniform&image_size=square',
      gender: 2,
      age: 32,
      id_card: '110101199001011234',
      qualification: '护士执业证书',
      qualification_no: '201511001234',
      experience: 8,
      city: '北京',
      address: '北京市朝阳区建国路88号',
      rating: 4.9,
      order_count: 156,
      good_rate: 98.5,
      intro: '从事护理工作8年，有丰富的临床陪护经验，熟悉北京各大医院就诊流程，性格开朗有耐心，善于沟通。',
      skills: '内科陪护,术后护理,老年陪护',
      status: 1,
      online_status: 1,
      work_status: 1,
      create_time: '2024-01-01 00:00:00',
      last_login_time: '2024-01-01 00:00:00'
    },
    {
      id: 2,
      openid: 'test_companion_002',
      phone: '13800138002',
      real_name: '李医生',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20male%20doctor%20portrait%20friendly%20smile%20white%20coat&image_size=square',
      gender: 1,
      age: 35,
      id_card: '110101198805055678',
      qualification: '医师资格证书',
      qualification_no: '201211005678',
      experience: 10,
      city: '北京',
      address: '北京市海淀区中关村大街1号',
      rating: 4.8,
      order_count: 203,
      good_rate: 97.8,
      intro: '临床医学专业，曾在三甲医院工作多年，熟悉各类疾病就诊流程，专业细心，服务至上。',
      skills: '专业问诊,就医指导,报告解读',
      status: 1,
      online_status: 1,
      work_status: 1,
      create_time: '2024-01-01 00:00:00',
      last_login_time: '2024-01-01 00:00:00'
    },
    {
      id: 3,
      openid: 'test_companion_003',
      phone: '13800138003',
      real_name: '王陪诊',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20healthcare%20worker%20portrait%20warm%20smile%20business%20attire&image_size=square',
      gender: 2,
      age: 28,
      id_card: '110101199503039012',
      qualification: '健康管理师',
      qualification_no: '201811009012',
      experience: 5,
      city: '上海',
      address: '上海市浦东新区陆家嘴金融中心',
      rating: 4.95,
      order_count: 89,
      good_rate: 99.2,
      intro: '健康管理专业毕业，专注陪诊服务5年，熟悉上海各大医院，服务细致周到，深受客户好评。',
      skills: '全程陪诊,住院陪护,产检陪诊',
      status: 1,
      online_status: 1,
      work_status: 1,
      create_time: '2024-01-01 00:00:00',
      last_login_time: '2024-01-01 00:00:00'
    }
  ],
  banners: [
    { id: 1, title: '新用户专享', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=medical%20healthcare%20promotional%20banner%20green%20theme%20discount&image_size=landscape_16_9', link: '', type: 'promotion', status: 1, sort: 1 },
    { id: 2, title: '专业陪诊服务', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20medical%20escort%20service%20banner%20hospital%20background&image_size=landscape_16_9', link: '', type: 'service', status: 1, sort: 2 },
    { id: 3, title: '限时优惠', image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=limited%20time%20offer%20medical%20service%20discount%20banner&image_size=landscape_16_9', link: '', type: 'promotion', status: 1, sort: 3 }
  ],
  cities: [
    { id: 1, name: '北京', pinyin: 'beijing', hot: 1, sort: 1 },
    { id: 2, name: '上海', pinyin: 'shanghai', hot: 1, sort: 2 },
    { id: 3, name: '广州', pinyin: 'guangzhou', hot: 1, sort: 3 },
    { id: 4, name: '深圳', pinyin: 'shenzhen', hot: 1, sort: 4 },
    { id: 5, name: '杭州', pinyin: 'hangzhou', hot: 0, sort: 5 },
    { id: 6, name: '成都', pinyin: 'chengdu', hot: 0, sort: 6 }
  ],
  hospitals: [
    { id: 1, city_id: 1, name: '北京协和医院', level: '三甲', address: '北京市东城区帅府园一号', phone: '010-69156114', sort: 1 },
    { id: 2, city_id: 1, name: '北京大学第一医院', level: '三甲', address: '北京市西城区西什库大街8号', phone: '010-83572211', sort: 2 },
    { id: 3, city_id: 1, name: '中国人民解放军总医院', level: '三甲', address: '北京市海淀区复兴路28号', phone: '010-66936611', sort: 3 },
    { id: 4, city_id: 2, name: '上海瑞金医院', level: '三甲', address: '上海市黄浦区瑞金二路197号', phone: '021-64370045', sort: 1 },
    { id: 5, city_id: 2, name: '复旦大学附属中山医院', level: '三甲', address: '上海市徐汇区枫林路180号', phone: '021-64041990', sort: 2 }
  ],
  departments: [
    { id: 1, hospital_id: 1, name: '内科', sort: 1 },
    { id: 2, hospital_id: 1, name: '外科', sort: 2 },
    { id: 3, hospital_id: 1, name: '妇产科', sort: 3 },
    { id: 4, hospital_id: 1, name: '儿科', sort: 4 },
    { id: 5, hospital_id: 1, name: '眼科', sort: 5 },
    { id: 6, hospital_id: 2, name: '内科', sort: 1 },
    { id: 7, hospital_id: 2, name: '外科', sort: 2 }
  ],
  services: [
    { id: 1, name: '全程陪诊', code: 'full_accompany', description: '全程陪同就诊，包括挂号、排队、缴费、取药等', base_price: 299, duration: 4, sort: 1, status: 1 },
    { id: 2, name: '代挂号', code: 'registration', description: '代为排队挂号', base_price: 99, duration: 1, sort: 2, status: 1 },
    { id: 3, name: '代取药', code: 'get_medicine', description: '代为取药并送达', base_price: 59, duration: 1, sort: 3, status: 1 },
    { id: 4, name: '代取报告', code: 'get_report', description: '代为领取检查报告', base_price: 49, duration: 1, sort: 4, status: 1 },
    { id: 5, name: '代问诊', code: 'consultation', description: '代为咨询医生病情', base_price: 199, duration: 2, sort: 5, status: 1 },
    { id: 6, name: '住院陪诊', code: 'hospitalization', description: '住院期间陪护', base_price: 499, duration: 8, sort: 6, status: 1 },
    { id: 7, name: '术后陪诊', code: 'postoperative', description: '手术后康复陪护', base_price: 399, duration: 4, sort: 7, status: 1 },
    { id: 8, name: '产检陪诊', code: 'prenatal', description: '产检全程陪同', base_price: 299, duration: 3, sort: 8, status: 1 }
  ],
  timeSlots: [
    { id: 1, start_time: '08:00', end_time: '10:00', status: 1 },
    { id: 2, start_time: '10:00', end_time: '12:00', status: 1 },
    { id: 3, start_time: '14:00', end_time: '16:00', status: 1 },
    { id: 4, start_time: '16:00', end_time: '18:00', status: 1 }
  ],
  faqs: [
    { id: 1, question: '什么是陪诊服务？', answer: '陪诊服务是指专业陪诊人员陪同患者就医，帮助完成挂号、排队、缴费、取药等流程，节省您的时间和精力。', sort: 1, status: 1 },
    { id: 2, question: '陪诊师的资质如何？', answer: '我们的陪诊师都经过严格筛选，具备医疗相关背景或多年陪诊经验，并通过专业培训后上岗。', sort: 2, status: 1 },
    { id: 3, question: '如何预约陪诊服务？', answer: '您可以在小程序中选择服务类型、时间、地点和陪诊师，下单后等待陪诊师接单即可。', sort: 3, status: 1 },
    { id: 4, question: '取消订单如何退款？', answer: '服务开始前2小时可免费取消，退款将在1-3个工作日内原路返回。', sort: 4, status: 1 },
    { id: 5, question: '服务不满意怎么办？', answer: '如对服务不满意，可在订单详情页申请售后，我们会有专人跟进处理。', sort: 5, status: 1 }
  ],
  patients: [
    { id: 1, user_id: 1, name: '张三', id_card: '110101199001011234', phone: '13800138001', gender: 1, age: 30, relation: '本人', is_default: 1, create_time: '2024-01-01 00:00:00' },
    { id: 2, user_id: 1, name: '李四', id_card: '110101199202022345', phone: '13800138002', gender: 2, age: 28, relation: '配偶', is_default: 0, create_time: '2024-01-01 00:00:00' }
  ],
  orders: [
    { id: 1, order_no: 'PZ202401010001', user_id: 1, companion_id: 1, service_id: 1, patient_id: 1, city_id: 1, hospital_id: 1, department_id: 1, service_date: '2024-01-15', time_slot: '08:00-10:00', base_price: 299, urgent_fee: 0, night_fee: 0, remote_fee: 0, total_price: 299, status: 'completed', symptom: '头疼、头晕', special_needs: '需要帮助排队', create_time: '2024-01-10 10:00:00' }
  ],
  evaluations: [
    { id: 1, order_id: 1, user_id: 1, companion_id: 1, rating: 5, tags: '专业,耐心,准时', comment: '张护士非常专业，全程陪同很贴心，节省了很多时间。', images: '', create_time: '2024-01-16 10:00:00' }
  ],
  companionCases: [
    { id: 1, companion_id: 1, title: '陪伴张阿姨完成白内障手术', content: '张阿姨今年65岁，独自一人来北京做白内障手术。我提前一天到医院熟悉流程，当天早上7点就到医院帮她排队挂号，陪同做各项术前检查，术后送她回到住处，术后连续3天提醒她用药和复查。', service_type: 'full_accompany', case_date: '2024-01-15' },
    { id: 2, companion_id: 1, title: '协助李先生完成术后复查', content: '李先生是外地患者，在北京做了心脏支架手术，需要每月复查。我每次都会提前帮他挂号，陪同见医生，帮他记录医嘱，取药后详细讲解用法用量。', service_type: 'postoperative', case_date: '2024-02-20' }
  ],
  admins: [
    { id: 1, username: 'admin', password: 'e10adc3949ba59abbe56e057f20f883e', real_name: '管理员', role: 'super_admin', status: 1, create_time: '2024-01-01 00:00:00', last_login_time: '2024-01-01 00:00:00' }
  ],
  settings: {
    platform_name: '陪诊服务平台',
    service_phone: '400-888-8888',
    service_email: 'service@peizhen.com',
    work_hours: '周一至周日 08:00-20:00',
    urgent_fee: 20,
    night_fee: 30,
    remote_fee: 50,
    night_start_time: '18:00',
    night_end_time: '08:00',
    cancel_hours: 2,
    order_timeout: 30,
    user_agreement: '用户协议内容...',
    privacy_policy: '隐私政策内容...',
    min_withdraw_amount: 100,
    withdraw_fee_rate: 0,
    withdraw_period: 'T+1'
  }
};

let nextId = {
  users: 2,
  companions: 4,
  banners: 4,
  cities: 7,
  hospitals: 6,
  departments: 8,
  services: 9,
  timeSlots: 5,
  faqs: 6,
  patients: 3,
  orders: 2,
  evaluations: 2,
  companionCases: 3,
  admins: 2,
  afterSales: 1,
  complaints: 1
};

function getNextId(table) {
  return nextId[table]++;
}

function findAll(table, where = {}, orderBy = null) {
  let results = [...data[table]];
  for (const [key, value] of Object.entries(where)) {
    results = results.filter(item => item[key] === value);
  }
  if (orderBy) {
    const [field, direction] = orderBy.split(' ');
    results.sort((a, b) => {
      if (direction === 'DESC') {
        return b[field] - a[field];
      }
      return a[field] - b[field];
    });
  }
  return results;
}

function findOne(table, where) {
  const results = findAll(table, where);
  return results[0] || null;
}

function insert(table, item) {
  const id = getNextId(table);
  const newItem = { id, ...item, create_time: new Date().toISOString().slice(0, 19).replace('T', ' ') };
  data[table].push(newItem);
  return id;
}

function update(table, id, updates) {
  const index = data[table].findIndex(item => item.id === id);
  if (index !== -1) {
    data[table][index] = { ...data[table][index], ...updates };
    return 1;
  }
  return 0;
}

function remove(table, id) {
  const index = data[table].findIndex(item => item.id === id);
  if (index !== -1) {
    data[table].splice(index, 1);
    return 1;
  }
  return 0;
}

function query(sql, params = []) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerSql = sql.toLowerCase();
      
      if (lowerSql.includes('select')) {
        if (lowerSql.includes('count')) {
          let count = 0;
          if (lowerSql.includes('pz_user')) {
            count = data.users.length;
          } else if (lowerSql.includes('pz_companion')) {
            count = data.companions.length;
          } else if (lowerSql.includes('pz_order')) {
            count = data.orders.length;
          } else if (lowerSql.includes('pz_evaluation')) {
            count = data.evaluations.length;
          } else {
            count = 100;
          }
          resolve([{ count }]);
          return;
        }
        
        if (lowerSql.includes('sum')) {
          let total = 0;
          if (lowerSql.includes('pz_order')) {
            total = data.orders.reduce((sum, order) => sum + (order.total_price || 0), 0);
          }
          resolve([{ total }]);
          return;
        }
      }
      
      resolve([]);
    }, 10);
  });
}

function queryOne(sql, params = []) {
  return new Promise(async (resolve) => {
    const rows = await query(sql, params);
    resolve(rows[0] || null);
  });
}

function execute(sql, params = []) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, 10);
  });
}

function transaction(callback) {
  return callback({
    execute: execute,
    query: query
  });
}

module.exports = {
  data,
  getNextId,
  findAll,
  findOne,
  insert,
  update,
  remove,
  query,
  queryOne,
  execute,
  transaction
};
