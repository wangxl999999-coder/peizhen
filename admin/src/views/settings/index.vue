<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">系统设置</span>
    </div>
    
    <el-card class="settings-card">
      <template #header>
        <span>基本设置</span>
      </template>
      <el-form :model="settingsForm" label-width="120px" class="settings-form">
        <el-form-item label="平台名称">
          <el-input v-model="settingsForm.platform_name" />
        </el-form-item>
        <el-form-item label="客服电话">
          <el-input v-model="settingsForm.service_phone" />
        </el-form-item>
        <el-form-item label="客服邮箱">
          <el-input v-model="settingsForm.service_email" />
        </el-form-item>
        <el-form-item label="工作时间">
          <el-input v-model="settingsForm.work_hours" />
        </el-form-item>
        <el-form-item label="加急费">
          <el-input-number 
            v-model="settingsForm.urgent_fee" 
            :min="0" 
            :step="10" 
            style="width: 200px" />
          <span class="form-tip">元/单</span>
        </el-form-item>
        <el-form-item label="夜间费">
          <el-input-number 
            v-model="settingsForm.night_fee" 
            :min="0" 
            :step="10" 
            style="width: 200px" />
          <span class="form-tip">元/单</span>
        </el-form-item>
        <el-form-item label="异地费">
          <el-input-number 
            v-model="settingsForm.remote_fee" 
            :min="0" 
            :step="10" 
            style="width: 200px" />
          <span class="form-tip">元/单</span>
        </el-form-item>
        <el-form-item label="夜间开始时间">
          <el-time-picker 
            v-model="settingsForm.night_start_time" 
            format="HH:mm" 
            value-format="HH:mm"
            style="width: 200px" />
        </el-form-item>
        <el-form-item label="夜间结束时间">
          <el-time-picker 
            v-model="settingsForm.night_end_time" 
            format="HH:mm" 
            value-format="HH:mm"
            style="width: 200px" />
        </el-form-item>
        <el-form-item label="退款时限">
          <el-input-number 
            v-model="settingsForm.cancel_hours" 
            :min="0" 
            :step="1" 
            style="width: 200px" />
          <span class="form-tip">小时（提前多少小时可退）</span>
        </el-form-item>
        <el-form-item label="订单超时时间">
          <el-input-number 
            v-model="settingsForm.order_timeout" 
            :min="1" 
            :step="1" 
            style="width: 200px" />
          <span class="form-tip">分钟（陪诊师未接单超时自动取消）</span>
        </el-form-item>
      </el-form>
      <div class="form-actions">
        <el-button type="primary" size="large" @click="handleSave">保存设置</el-button>
      </div>
    </el-card>
    
    <el-card class="settings-card">
      <template #header>
        <span>协议设置</span>
      </template>
      <el-form :model="settingsForm" label-width="120px" class="settings-form">
        <el-form-item label="用户协议">
          <el-input 
            v-model="settingsForm.user_agreement" 
            type="textarea" 
            :rows="6"
            placeholder="请输入用户协议内容" />
        </el-form-item>
        <el-form-item label="隐私政策">
          <el-input 
            v-model="settingsForm.privacy_policy" 
            type="textarea" 
            :rows="6"
            placeholder="请输入隐私政策内容" />
        </el-form-item>
      </el-form>
      <div class="form-actions">
        <el-button type="primary" size="large" @click="handleSave">保存设置</el-button>
      </div>
    </el-card>
    
    <el-card class="settings-card">
      <template #header>
        <span>提现设置</span>
      </template>
      <el-form :model="settingsForm" label-width="120px" class="settings-form">
        <el-form-item label="最低提现金额">
          <el-input-number 
            v-model="settingsForm.min_withdraw_amount" 
            :min="0" 
            :step="10" 
            style="width: 200px" />
          <span class="form-tip">元</span>
        </el-form-item>
        <el-form-item label="提现手续费率">
          <el-input-number 
            v-model="settingsForm.withdraw_fee_rate" 
            :min="0" 
            :max="100" 
            :step="0.1" 
            style="width: 200px" />
          <span class="form-tip">%</span>
        </el-form-item>
        <el-form-item label="提现周期">
          <el-select v-model="settingsForm.withdraw_period" style="width: 200px">
            <el-option label="T+1" value="T+1" />
            <el-option label="T+3" value="T+3" />
            <el-option label="T+7" value="T+7" />
            <el-option label="月结" value="monthly" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="form-actions">
        <el-button type="primary" size="large" @click="handleSave">保存设置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSettingsApi, updateSettingsApi } from '@/api'

const loading = ref(false)

const settingsForm = reactive({
  platform_name: '',
  service_phone: '',
  service_email: '',
  work_hours: '',
  urgent_fee: 20,
  night_fee: 30,
  remote_fee: 50,
  night_start_time: '18:00',
  night_end_time: '08:00',
  cancel_hours: 2,
  order_timeout: 30,
  user_agreement: '',
  privacy_policy: '',
  min_withdraw_amount: 100,
  withdraw_fee_rate: 0,
  withdraw_period: 'T+1'
})

const loadSettings = async () => {
  loading.value = true
  try {
    const data = await getSettingsApi()
    if (data) {
      Object.assign(settingsForm, data)
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  try {
    await updateSettingsApi(settingsForm)
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style lang="scss" scoped>
.settings-card {
  margin-bottom: 20px;
  
  .settings-form {
    max-width: 600px;
  }
  
  .form-tip {
    margin-left: 10px;
    color: #909399;
    font-size: 14px;
  }
  
  .form-actions {
    margin-top: 20px;
    text-align: center;
  }
}
</style>
