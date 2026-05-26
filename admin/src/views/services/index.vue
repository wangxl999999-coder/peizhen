<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">服务管理</span>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增服务
      </el-button>
    </div>
    
    <el-card class="table-container">
      <el-table :data="serviceList" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="服务名称" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="base_price" label="基础价格" width="120">
          <template #default="{ row }">
            <span class="price">¥{{ row.base_price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长(分钟)" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              link 
              :type="row.status === 1 ? 'danger' : 'success'"
              @click="handleToggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑服务' : '新增服务'"
      width="500px">
      <el-form :model="serviceForm" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="服务名称" prop="name">
          <el-input v-model="serviceForm.name" placeholder="请输入服务名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="serviceForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入服务描述" />
        </el-form-item>
        <el-form-item label="基础价格" prop="base_price">
          <el-input-number 
            v-model="serviceForm.base_price" 
            :min="0" 
            :step="10" 
            style="width: 100%" />
        </el-form-item>
        <el-form-item label="服务时长" prop="duration">
          <el-input-number 
            v-model="serviceForm.duration" 
            :min="30" 
            :step="15" 
            style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { getServiceListApi, createServiceApi, updateServiceApi } from '@/api'

const loading = ref(false)
const serviceList = ref([])
const formDialogVisible = ref(false)
const isEdit = ref(false)
const currentServiceId = ref(null)
const formRef = ref<FormInstance>()

const serviceForm = reactive({
  name: '',
  description: '',
  base_price: 100,
  duration: 120
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入服务名称', trigger: 'blur' }],
  base_price: [{ required: true, message: '请输入基础价格', trigger: 'change' }],
  duration: [{ required: true, message: '请输入服务时长', trigger: 'change' }]
}

const loadServices = async () => {
  loading.value = true
  try {
    const data = await getServiceListApi()
    serviceList.value = data.list || data || []
  } catch (error) {
    console.error('加载服务列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  currentServiceId.value = null
  serviceForm.name = ''
  serviceForm.description = ''
  serviceForm.base_price = 100
  serviceForm.duration = 120
  formDialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentServiceId.value = row.id
  serviceForm.name = row.name
  serviceForm.description = row.description
  serviceForm.base_price = row.base_price
  serviceForm.duration = row.duration
  formDialogVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await updateServiceApi(currentServiceId.value, serviceForm)
        } else {
          await createServiceApi(serviceForm)
        }
        ElMessage.success('保存成功')
        formDialogVisible.value = false
        loadServices()
      } catch (error) {
        console.error('保存失败:', error)
      }
    }
  })
}

const handleToggleStatus = (row) => {
  ElMessageBox.confirm(
    `确定要${row.status === 1 ? '禁用' : '启用'}该服务吗？`,
    '提示',
    { type: 'warning' }
  ).then(async () => {
    try {
      await updateServiceApi(row.id, { status: row.status === 1 ? 0 : 1 })
      ElMessage.success('操作成功')
      loadServices()
    } catch (error) {
      console.error('操作失败:', error)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadServices()
})
</script>

<style lang="scss" scoped>
.price {
  color: #f5222d;
  font-weight: 500;
}
</style>
