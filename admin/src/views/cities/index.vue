<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">城市管理</span>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增城市
      </el-button>
    </div>
    
    <el-card class="table-container">
      <el-table :data="cityList" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="城市名称" />
        <el-table-column prop="first_letter" label="首字母" width="120" />
        <el-table-column prop="is_hot" label="热门" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_hot === 1 ? 'danger' : 'info'" size="small">
              {{ row.is_hot === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑城市' : '新增城市'"
      width="450px">
      <el-form :model="cityForm" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="城市名称" prop="name">
          <el-input v-model="cityForm.name" placeholder="请输入城市名称" />
        </el-form-item>
        <el-form-item label="首字母" prop="first_letter">
          <el-input v-model="cityForm.first_letter" placeholder="请输入首字母（大写）" maxlength="1" />
        </el-form-item>
        <el-form-item label="是否热门">
          <el-switch v-model="cityForm.is_hot" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="cityForm.sort" :min="0" style="width: 100%" />
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
import { getCityListApi, createCityApi, updateCityApi, deleteCityApi } from '@/api'

const loading = ref(false)
const cityList = ref([])
const formDialogVisible = ref(false)
const isEdit = ref(false)
const currentCityId = ref(null)
const formRef = ref<FormInstance>()

const cityForm = reactive({
  name: '',
  first_letter: '',
  is_hot: 0,
  sort: 0
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入城市名称', trigger: 'blur' }],
  first_letter: [{ required: true, message: '请输入首字母', trigger: 'blur' }]
}

const loadCities = async () => {
  loading.value = true
  try {
    const data = await getCityListApi()
    cityList.value = data.list || data || []
  } catch (error) {
    console.error('加载城市列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  currentCityId.value = null
  cityForm.name = ''
  cityForm.first_letter = ''
  cityForm.is_hot = 0
  cityForm.sort = 0
  formDialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentCityId.value = row.id
  cityForm.name = row.name
  cityForm.first_letter = row.first_letter
  cityForm.is_hot = row.is_hot
  cityForm.sort = row.sort
  formDialogVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await updateCityApi(currentCityId.value, cityForm)
        } else {
          await createCityApi(cityForm)
        }
        ElMessage.success('保存成功')
        formDialogVisible.value = false
        loadCities()
      } catch (error) {
        console.error('保存失败:', error)
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该城市吗？',
    '删除确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      await deleteCityApi(row.id)
      ElMessage.success('删除成功')
      loadCities()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadCities()
})
</script>
