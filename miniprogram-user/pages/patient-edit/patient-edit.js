const app = getApp();

Page({
  data: {
    id: '',
    form: {
      name: '',
      gender: 1,
      age: 0,
      id_card: '',
      phone: '',
      relation: '',
      medical_card: '',
      allergy: '',
      medical_history: '',
      is_default: false
    },
    relationOptions: ['本人', '父母', '子女', '配偶', '朋友', '其他'],
    relationIndex: 0,
    genderIndex: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadPatient(options.id);
    }
  },

  async loadPatient(id) {
    try {
      const data = await app.request({ url: '/user/patients' });
      const patient = data.find(item => item.id == id);
      if (patient) {
        this.setData({
          form: { ...this.data.form, ...patient },
          relationIndex: this.data.relationOptions.indexOf(patient.relation),
          genderIndex: patient.gender === 1 ? 0 : 1
        });
      }
    } catch (err) {
      console.error('加载就诊人失败', err);
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  selectGender(e) {
    const index = e.detail.value;
    this.setData({
      genderIndex: index,
      'form.gender': index === 0 ? 1 : 2
    });
  },

  selectRelation(e) {
    const index = e.detail.value;
    this.setData({
      relationIndex: index,
      'form.relation': this.data.relationOptions[index]
    });
  },

  toggleDefault(e) {
    this.setData({
      'form.is_default': e.detail.value
    });
  },

  async submit() {
    const { form } = this.data;

    if (!form.name) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!form.id_card) {
      wx.showToast({ title: '请输入身份证号', icon: 'none' });
      return;
    }
    if (!form.phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!form.relation) {
      wx.showToast({ title: '请选择关系', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      if (this.data.id) {
        await app.request({
          url: `/user/patients/${this.data.id}`,
          method: 'PUT',
          data: form
        });
      } else {
        await app.request({
          url: '/user/patients',
          method: 'POST',
          data: form
        });
      }

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      wx.hideLoading();
    }
  }
})
