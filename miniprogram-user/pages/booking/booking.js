const app = getApp();

Page({
  data: {
    serviceType: '',
    serviceTypes: [],
    cities: [],
    hospitals: [],
    departments: [],
    timeSlots: [],
    patients: [],
    companions: [],
    
    selectedService: null,
    selectedCity: null,
    selectedHospital: null,
    selectedDepartment: null,
    selectedDate: '',
    selectedTimeSlot: '',
    selectedCompanion: null,
    selectedPatient: null,
    
    isUrgent: false,
    isRemote: false,
    isNight: false,
    
    symptom: '',
    specialReq: '',
    
    priceInfo: null,
    
    dates: [],
    currentStep: 1
  },

  onLoad(options) {
    this.generateDates();
    this.loadServiceTypes();
    this.loadTimeSlots();
    this.loadCities();
    this.loadPatients();

    if (options.service_type) {
      this.setData({ serviceType: options.service_type });
    }
  },

  generateDates() {
    const dates = [];
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        date: app.formatDate(date),
        day: date.getDate(),
        week: i === 0 ? '今天' : i === 1 ? '明天' : '周' + weekDays[date.getDay()]
      });
    }
    this.setData({ dates });
  },

  async loadServiceTypes() {
    try {
      const data = await app.request({ url: '/common/service-types' });
      this.setData({ serviceTypes: data });
      if (this.data.serviceType) {
        const service = data.find(item => item.type === this.data.serviceType);
        if (service) {
          this.setData({ selectedService: service });
        }
      }
    } catch (err) {
      console.error('加载服务类型失败', err);
    }
  },

  async loadCities() {
    try {
      const data = await app.request({ url: '/common/cities' });
      this.setData({ cities: data.all_cities ? Object.values(data.all_cities).flat() : [] });
    } catch (err) {
      console.error('加载城市列表失败', err);
    }
  },

  async loadTimeSlots() {
    try {
      const data = await app.request({ url: '/common/time-slots' });
      this.setData({ timeSlots: data });
    } catch (err) {
      console.error('加载时间段失败', err);
    }
  },

  async loadPatients() {
    if (!app.globalData.token) return;
    try {
      const data = await app.request({ url: '/user/patients' });
      this.setData({ patients: data });
      const defaultPatient = data.find(item => item.is_default === 1);
      if (defaultPatient) {
        this.setData({ selectedPatient: defaultPatient });
      }
    } catch (err) {
      console.error('加载就诊人失败', err);
    }
  },

  async loadHospitals(cityId) {
    try {
      const data = await app.request({
        url: '/common/hospitals',
        data: { city_id: cityId }
      });
      this.setData({ hospitals: data.list || [] });
    } catch (err) {
      console.error('加载医院列表失败', err);
    }
  },

  async loadDepartments() {
    try {
      const data = await app.request({ url: '/common/departments' });
      this.setData({ departments: data });
    } catch (err) {
      console.error('加载科室列表失败', err);
    }
  },

  async loadCompanions() {
    try {
      const data = await app.request({
        url: '/companion',
        data: {
          city: this.data.selectedCity ? this.data.selectedCity.name : '',
          service_type: this.data.serviceType,
          page: 1,
          pageSize: 20
        }
      });
      this.setData({ companions: data.list || [] });
    } catch (err) {
      console.error('加载陪诊师列表失败', err);
    }
  },

  selectService(e) {
    const id = e.currentTarget.dataset.id;
    const service = this.data.serviceTypes.find(item => item.id === id);
    this.setData({
      selectedService: service,
      serviceType: service.type
    });
    this.calculatePrice();
  },

  selectCity(e) {
    const id = e.currentTarget.dataset.id;
    const city = this.data.cities.find(item => item.id === id);
    this.setData({
      selectedCity: city,
      selectedHospital: null
    });
    this.loadHospitals(city.id);
    this.loadDepartments();
    this.loadCompanions();
  },

  selectHospital(e) {
    const id = e.currentTarget.dataset.id;
    const hospital = this.data.hospitals.find(item => item.id === id);
    this.setData({ selectedHospital: hospital });
  },

  selectDepartment(e) {
    const id = e.currentTarget.dataset.id;
    const department = this.data.departments.find(item => item.id === id);
    this.setData({ selectedDepartment: department });
  },

  selectDate(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({ selectedDate: date });
  },

  selectTimeSlot(e) {
    const time = e.currentTarget.dataset.time;
    const isNight = e.currentTarget.dataset.isNight;
    this.setData({
      selectedTimeSlot: time,
      isNight: isNight === 1 || isNight === true
    });
    this.calculatePrice();
  },

  selectCompanion(e) {
    const id = e.currentTarget.dataset.id;
    const companion = this.data.companions.find(item => item.id === id);
    this.setData({ selectedCompanion: companion });
  },

  selectPatient(e) {
    const id = e.currentTarget.dataset.id;
    const patient = this.data.patients.find(item => item.id === id);
    this.setData({ selectedPatient: patient });
  },

  toggleUrgent() {
    this.setData({ isUrgent: !this.data.isUrgent });
    this.calculatePrice();
  },

  toggleRemote() {
    this.setData({ isRemote: !this.data.isRemote });
    this.calculatePrice();
  },

  onSymptomInput(e) {
    this.setData({ symptom: e.detail.value });
  },

  onSpecialReqInput(e) {
    this.setData({ specialReq: e.detail.value });
  },

  async calculatePrice() {
    if (!this.data.selectedService) return;

    try {
      const data = await app.request({
        url: '/order/calculate',
        method: 'POST',
        data: {
          service_type: this.data.serviceType,
          is_urgent: this.data.isUrgent,
          is_night: this.data.isNight,
          is_remote: this.data.isRemote
        }
      });
      this.setData({ priceInfo: data });
    } catch (err) {
      console.error('计算价格失败', err);
    }
  },

  nextStep() {
    if (this.data.currentStep === 1) {
      if (!this.data.selectedService) {
        wx.showToast({ title: '请选择服务类型', icon: 'none' });
        return;
      }
      if (!this.data.selectedCity) {
        wx.showToast({ title: '请选择城市', icon: 'none' });
        return;
      }
      if (!this.data.selectedHospital) {
        wx.showToast({ title: '请选择医院', icon: 'none' });
        return;
      }
      if (!this.data.selectedDepartment) {
        wx.showToast({ title: '请选择科室', icon: 'none' });
        return;
      }
      this.setData({ currentStep: 2 });
    } else if (this.data.currentStep === 2) {
      if (!this.data.selectedDate) {
        wx.showToast({ title: '请选择服务日期', icon: 'none' });
        return;
      }
      if (!this.data.selectedTimeSlot) {
        wx.showToast({ title: '请选择服务时间段', icon: 'none' });
        return;
      }
      if (!this.data.selectedCompanion) {
        wx.showToast({ title: '请选择陪诊师', icon: 'none' });
        return;
      }
      this.setData({ currentStep: 3 });
    }
  },

  prevStep() {
    if (this.data.currentStep > 1) {
      this.setData({ currentStep: this.data.currentStep - 1 });
    }
  },

  async submitOrder() {
    if (!app.globalData.token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/login/login' });
      }, 1500);
      return;
    }

    if (!this.data.selectedPatient) {
      wx.showToast({ title: '请选择就诊人', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...' });

    try {
      const data = await app.request({
        url: '/order',
        method: 'POST',
        data: {
          patient_id: this.data.selectedPatient.id,
          service_type: this.data.serviceType,
          city_id: this.data.selectedCity.id,
          city: this.data.selectedCity.name,
          hospital_id: this.data.selectedHospital.id,
          hospital_name: this.data.selectedHospital.name,
          hospital_address: this.data.selectedHospital.address,
          department_id: this.data.selectedDepartment.id,
          department_name: this.data.selectedDepartment.name,
          service_date: this.data.selectedDate,
          time_slot: this.data.selectedTimeSlot,
          is_urgent: this.data.isUrgent ? 1 : 0,
          is_remote: this.data.isRemote ? 1 : 0,
          companion_id: this.data.selectedCompanion.id,
          symptom: this.data.symptom,
          special_req: this.data.specialReq
        }
      });

      wx.hideLoading();
      wx.showToast({ title: '下单成功', icon: 'success' });

      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/order-detail/order-detail?id=${data.order_id}`
        });
      }, 1500);
    } catch (err) {
      wx.hideLoading();
    }
  },

  goAddPatient() {
    wx.navigateTo({ url: '/pages/patient-edit/patient-edit' });
  }
})
