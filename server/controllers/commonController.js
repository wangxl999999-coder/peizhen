const memoryDb = require('../utils/memoryDb');
const { success, error } = require('../utils/response');

async function getBanners(req, res) {
  try {
    const list = memoryDb.findAll('banners', { status: 1 }, 'sort ASC');
    res.json(success(list));
  } catch (err) {
    console.error('获取Banner失败:', err);
    res.json(error('获取失败'));
  }
}

async function getCityList(req, res) {
  try {
    const allCities = memoryDb.findAll('cities', {}, 'sort ASC');
    
    const hotCities = allCities.filter(city => city.hot === 1);
    
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
  const { city_id, city } = req.query;

  try {
    let hospitals = memoryDb.data.hospitals;
    
    if (city_id) {
      hospitals = hospitals.filter(h => h.city_id === parseInt(city_id));
    }
    
    if (city) {
      const cityObj = memoryDb.findOne('cities', { name: city });
      if (cityObj) {
        hospitals = hospitals.filter(h => h.city_id === cityObj.id);
      }
    }
    
    hospitals.sort((a, b) => a.sort - b.sort);

    res.json(success({ list: hospitals, total: hospitals.length }));
  } catch (err) {
    console.error('获取医院列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getDepartmentList(req, res) {
  const { hospital_id } = req.query;
  
  try {
    let departments = memoryDb.data.departments;
    
    if (hospital_id) {
      departments = departments.filter(d => d.hospital_id === parseInt(hospital_id));
    }
    
    departments.sort((a, b) => a.sort - b.sort);
    
    res.json(success(departments));
  } catch (err) {
    console.error('获取科室列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function getServiceTypes(req, res) {
  try {
    const list = memoryDb.findAll('services', { status: 1 }, 'sort ASC');
    res.json(success(list));
  } catch (err) {
    console.error('获取服务类型失败:', err);
    res.json(error('获取失败'));
  }
}

async function getTimeSlots(req, res) {
  try {
    const list = memoryDb.findAll('timeSlots', { status: 1 }, 'id ASC');
    
    const result = list.map(item => ({
      ...item,
      time: `${item.start_time}-${item.end_time}`,
      label: `${item.start_time}-${item.end_time}`
    }));

    res.json(success(result));
  } catch (err) {
    console.error('获取时间段失败:', err);
    res.json(error('获取失败'));
  }
}

async function getFaqList(req, res) {
  try {
    const list = memoryDb.findAll('faqs', { status: 1 }, 'sort ASC');
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
    const banners = memoryDb.findAll('banners', { status: 1 }, 'sort ASC');

    const services = memoryDb.findAll('services', { status: 1 }, 'sort ASC');

    let companions = memoryDb.findAll('companions', { status: 1, work_status: 1 }, 'rating DESC');
    
    if (city) {
      companions = companions.filter(c => c.city === city || c.city.includes(city));
    }
    
    const recommendCompanions = companions.slice(0, 6).map(c => ({
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
      intro: c.intro,
      skills: c.skills
    }));

    const hotFaqs = memoryDb.findAll('faqs', { status: 1 }, 'sort ASC').slice(0, 5);

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

    res.json(success({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) }));
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

module.exports = {
  getBanners,
  getCityList,
  getHospitalList,
  getDepartmentList,
  getServiceTypes,
  getTimeSlots,
  getFaqList,
  uploadImage,
  getHomeData,
  getTrainingList,
  getTrainingDetail,
  getPlatformRules
};
