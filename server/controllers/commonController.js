const db = require('../utils/db');
const { success, error } = require('../utils/response');

async function getBanners(req, res) {
  const { position = 'home' } = req.query;

  try {
    const list = await db.query(
      `SELECT id, title, image, link_type, link_value 
       FROM pz_banner 
       WHERE position = ? AND status = 1 
       AND (start_time IS NULL OR start_time <= NOW()) 
       AND (end_time IS NULL OR end_time >= NOW())
       ORDER BY sort ASC`,
      [position]
    );
    res.json(success(list));
  } catch (err) {
    console.error('获取Banner失败:', err);
    res.json(error('获取失败'));
  }
}

async function getCityList(req, res) {
  try {
    const hotCities = await db.query(
      'SELECT id, name, province, pinyin, hot FROM pz_city WHERE hot = 1 AND status = 1 ORDER BY sort ASC'
    );

    const allCities = await db.query(
      'SELECT id, name, province, pinyin, hot FROM pz_city WHERE status = 1 ORDER BY pinyin ASC'
    );

    const cityMap = {};
    allCities.forEach(city => {
      const letter = city.pinyin.charAt(0).toUpperCase();
      if (!cityMap[letter]) {
        cityMap[letter] = [];
      }
      cityMap[letter].push(city);
    });

    res.json(success({
      hot_cities: hotCities,
      all_cities: cityMap
    }));
  } catch (err) {
    console.error('获取城市列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getHospitalList(req, res) {
  const { city_id, keyword, page = 1, pageSize = 20 } = req.query;

  try {
    let whereSql = 'WHERE status = 1';
    let params = [];

    if (city_id) {
      whereSql += ' AND city_id = ?';
      params.push(city_id);
    }

    if (keyword) {
      whereSql += ' AND name LIKE ?';
      params.push(`%${keyword}%`);
    }

    const countResult = await db.queryOne(`SELECT COUNT(*) as total FROM pz_hospital ${whereSql}`, params);
    const total = countResult.total;

    const offset = (page - 1) * pageSize;
    const list = await db.query(
      `SELECT id, name, city, level, address, phone, image, intro 
       FROM pz_hospital ${whereSql} 
       ORDER BY sort ASC, id DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(success({ list, total }));
  } catch (err) {
    console.error('获取医院列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getDepartmentList(req, res) {
  try {
    const list = await db.query(
      'SELECT id, name, parent_id, icon FROM pz_department WHERE status = 1 ORDER BY sort ASC, id ASC'
    );
    res.json(success(list));
  } catch (err) {
    console.error('获取科室列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getServiceTypes(req, res) {
  try {
    const list = await db.query(
      `SELECT id, type, name, icon, base_price, unit, urgent_fee, night_fee, remote_fee, description 
       FROM pz_service_type 
       WHERE status = 1 
       ORDER BY sort ASC`
    );
    res.json(success(list));
  } catch (err) {
    console.error('获取服务类型失败:', err);
    res.json(error('获取失败'));
  }
}

async function getTimeSlots(req, res) {
  try {
    const list = await db.query(
      'SELECT id, start_time, end_time, name, is_night FROM pz_time_slot WHERE status = 1 ORDER BY sort ASC'
    );

    list.forEach(item => {
      item.time = `${item.start_time}-${item.end_time}`;
      item.label = `${item.name} ${item.start_time}-${item.end_time}`;
    });

    res.json(success(list));
  } catch (err) {
    console.error('获取时间段失败:', err);
    res.json(error('获取失败'));
  }
}

async function getFaqList(req, res) {
  const { category } = req.query;

  try {
    let whereSql = 'WHERE status = 1';
    let params = [];

    if (category) {
      whereSql += ' AND category = ?';
      params.push(category);
    }

    const list = await db.query(
      `SELECT id, question, answer, category 
       FROM pz_faq ${whereSql} 
       ORDER BY sort ASC, id DESC`,
      params
    );

    res.json(success(list));
  } catch (err) {
    console.error('获取常见问题失败:', err);
    res.json(error('获取失败'));
  }
}

async function uploadImage(req, res) {
  if (!req.file) {
    return res.json(error('请选择要上传的图片'));
  }

  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const filePath = `/uploads/${req.file.filename}`;
    
    res.json(success({
      url: baseUrl + filePath,
      path: filePath,
      filename: req.file.filename,
      size: req.file.size
    }, '上传成功'));
  } catch (err) {
    console.error('上传图片失败:', err);
    res.json(error('上传失败'));
  }
}

async function getHomeData(req, res) {
  const { city } = req.query;

  try {
    const banners = await db.query(
      `SELECT id, title, image, link_type, link_value 
       FROM pz_banner 
       WHERE position = 'home' AND status = 1 
       AND (start_time IS NULL OR start_time <= NOW()) 
       AND (end_time IS NULL OR end_time >= NOW())
       ORDER BY sort ASC`
    );

    const services = await db.query(
      `SELECT id, type, name, icon, base_price, description 
       FROM pz_service_type 
       WHERE status = 1 
       ORDER BY sort ASC`
    );

    let recommendWhere = 'WHERE c.status = 1 AND c.work_status = 1';
    let recommendParams = [];
    if (city) {
      recommendWhere += ' AND c.city = ?';
      recommendParams.push(city);
    }

    const recommendCompanions = await db.query(
      `SELECT c.id, c.real_name, c.avatar, c.gender, c.age, c.qualification, c.city,
              c.rating, c.order_count, c.good_rate, c.intro
       FROM pz_companion c ${recommendWhere}
       ORDER BY c.rating DESC, c.order_count DESC
       LIMIT 6`,
      recommendParams
    );

    const hotFaqs = await db.query(
      `SELECT id, question, answer 
       FROM pz_faq 
       WHERE status = 1 
       ORDER BY sort ASC 
       LIMIT 5`
    );

    res.json(success({
      banners,
      services,
      recommend_companions: recommendCompanions,
      hot_faqs: hotFaqs
    }));
  } catch (err) {
    console.error('获取首页数据失败:', err);
    res.json(error('获取失败'));
  }
}

module.exports = {
  getBanners,
  getCityList,
  getHospitalList,
  getDepartmentList,
  getServiceTypes,
  getTimeSlots,
  getFaqList,
  uploadImage,
  getHomeData
};
