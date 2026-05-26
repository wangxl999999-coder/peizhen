Page({
  data: {
    cities: [],
    hospitals: [],
    departments: [],
    serviceTypes: [],
    timeSlots: [],
    
    selectedCityIds: [],
    selectedHospitalIds: [],
    selectedDepartmentIds: [],
    selectedServiceTypeIds: [],
    selectedTimeSlotIds: [],
    
    basePrice: '',
    pricePerHour: '',
    workStatus: 1,
    
    cityIndex: 0,
    hospitalIndex: 0,
    
    isLoading: false,
    isSaving: false
  },

  onLoad() {
    this.loadCommonData();
    this.loadServiceSettings();
  },

  async loadCommonData() {
    try {
      const app = getApp();
      const [cities, serviceTypes, timeSlots] = await Promise.all([
        app.request({ url: '/common/cities' }),
        app.request({ url: '/common/service-types' }),
        app.request({ url: '/common/time-slots' })
      ]);
      
      this.setData({
        cities: cities.all_cities ? Object.values(cities.all_cities).flat() : [],
        serviceTypes,
        timeSlots
      });
    } catch (err) {
      console.error('加载公共数据失败:', err);
    }
  },

  async loadServiceSettings() {
    try {
      this.setData({ isLoading: true });
      const app = getApp();
      const data = await app.request({
        url: '/companion/service-settings'
      });
      
      this.setData({
        selectedCityIds: data.city_ids || [],
        selectedHospitalIds: data.hospital_ids || [],
        selectedDepartmentIds: data.department_ids || [],
        selectedServiceTypeIds: data.service_type_ids || [],
        selectedTimeSlotIds: data.time_slot_ids || [],
        basePrice: data.base_price || '',
        pricePerHour: data.price_per_hour || '',
        workStatus: data.work_status || 1
      });
      
      if (data.city_ids && data.city_ids.length > 0) {
        this.loadHospitals();
      }
    } catch (err) {
      console.error('加载服务设置失败:', err);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async loadHospitals() {
    if (this.data.selectedCityIds.length === 0) {
      this.setData({ hospitals: [], departments: [] });
      return;
    }

    try {
      const app = getApp();
      const hospitalData = await app.request({
        url: '/common/hospitals',
        data: { city_id: this.data.selectedCityIds[0] }
      });
      
      this.setData({
        hospitals: hospitalData.list || []
      });

      if (this.data.selectedHospitalIds.length > 0) {
        this.loadDepartments();
      }
    } catch (err) {
      console.error('加载医院列表失败:', err);
    }
  },

  async loadDepartments() {
    if (this.data.selectedHospitalIds.length === 0) {
      this.setData({ departments: [] });
      return;
    }

    try {
      const app = getApp();
      const departments = await app.request({
        url: '/common/departments',
        data: { hospital_id: this.data.selectedHospitalIds[0] }
      });
      
      this.setData({ departments });
    } catch (err) {
      console.error('加载科室列表失败:', err);
    }
  },

  onCityChange(e) {
    const { value } = e.detail;
    const city = this.data.cities[parseInt(value)];
    
    this.setData({
      cityIndex: parseInt(value),
      selectedCityIds: [city.id],
      selectedHospitalIds: [],
      selectedDepartmentIds: [],
      hospitals: [],
      departments: []
    });
    
    this.loadHospitals();
  },

  onHospitalChange(e) {
    const { value } = e.detail;
    const hospital = this.data.hospitals[parseInt(value)];
    
    this.setData({
      hospitalIndex: parseInt(value),
      selectedHospitalIds: [hospital.id],
      selectedDepartmentIds: [],
      departments: []
    });
    
    this.loadDepartments();
  },

  toggleServiceType(e) {
    const { id } = e.currentTarget.dataset;
    const selected = [...this.data.selectedServiceTypeIds];
    const index = selected.indexOf(id);
    
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(id);
    }
    
    this.setData({ selectedServiceTypeIds: selected });
  },

  toggleDepartment(e) {
    const { id } = e.currentTarget.dataset;
    const selected = [...this.data.selectedDepartmentIds];
    const index = selected.indexOf(id);
    
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(id);
    }
    
    this.setData({ selectedDepartmentIds: selected });
  },

  toggleTimeSlot(e) {
    const { id } = e.currentTarget.dataset;
    const selected = [...this.data.selectedTimeSlotIds];
    const index = selected.indexOf(id);
    
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(id);
    }
    
    this.setData({ selectedTimeSlotIds: selected });
  },

  onPriceInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
  },

  onWorkStatusChange(e) {
    this.setData({ workStatus: e.detail.value ? 1 : 0 });
  },

  async save() {
    const {
      selectedCityIds,
      selectedHospitalIds,
      selectedDepartmentIds,
      selectedServiceTypeIds,
      selectedTimeSlotIds,
      basePrice,
      pricePerHour,
      workStatus,
      isSaving
    } = this.data;

    if (isSaving) return;

    if (selectedCityIds.length === 0) {
      wx.showToast({ title: '请选择服务城市', icon: 'none' });
      return;
    }

    if (selectedServiceTypeIds.length === 0) {
      wx.showToast({ title: '请选择服务类型', icon: 'none' });
      return;
    }

    if (selectedTimeSlotIds.length === 0) {
      wx.showToast({ title: '请选择工作时间段', icon: 'none' });
      return;
    }

    if (!basePrice || parseFloat(basePrice) <= 0) {
      wx.showToast({ title: '请输入基础服务价格', icon: 'none' });
      return;
    }

    try {
      this.setData({ isSaving: true });
      const app = getApp();
      
      await app.request({
        url: '/companion/service-settings',
        method: 'POST',
        data: {
          city_ids: selectedCityIds,
          hospital_ids: selectedHospitalIds,
          department_ids: selectedDepartmentIds,
          service_type_ids: selectedServiceTypeIds,
          time_slot_ids: selectedTimeSlotIds,
          base_price: parseFloat(basePrice),
          price_per_hour: pricePerHour ? parseFloat(pricePerHour) : 0,
          work_status: workStatus
        }
      });

      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('保存服务设置失败:', err);
      this.setData({ isSaving: false });
    }
  }
});
