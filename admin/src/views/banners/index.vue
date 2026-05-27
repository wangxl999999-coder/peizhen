<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">Banner管理</span>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增Banner
      </el-button>
    </div>
    
    <el-card class="table-container">
      <el-table :data="bannerList" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="image_url" label="图片" width="120">
          <template #default="{ row }">
            <el-image 
              :src="row.image_url" 
              style="width: 80px; height: 40px" 
              fit="cover"
              :preview-src-list="[row.image_url]" />
          </template>
        </el-table-column>
        <el-table-column prop="link_type" label="链接类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.link_type === 'page' ? 'primary' : 'success'" size="small">
              {{ row.link_type === 'page' ? '内部页面' : '外部链接' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
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
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑Banner' : '新增Banner'"
      width="500px">
      <el-form :model="bannerForm" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="bannerForm.title" placeholder="请输入Banner标题" />
        </el-form-item>
        <el-form-item label="图片链接" prop="image_url">
          <el-input v-model="bannerForm.image_url" placeholder="请输入图片链接" />
        </el-form-item>
        <el-form-item label="链接类型">
          <el-select v-model="bannerForm.link_type" style="width: 100%">
            <el-option label="内部页面" value="page" />
            <el-option label="外部链接" value="url" />
          </el-select>
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="bannerForm.link_url" placeholder="请输入跳转链接" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="bannerForm.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="bannerForm.status" :active-value="1" :inactive-value="0" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBannerListApi, createBannerApi, updateBannerApi, deleteBannerApi } from '@/api'

const loading = ref(false)
const bannerList = ref([])
const formDialogVisible = ref(false)
const isEdit = ref(false)
const currentBannerId = ref(null)
const formRef = ref(null)

const bannerForm = reactive({
  title: '',
  image_url: '',
  link_type: 'page',
  link_url: '',
  sort: 0,
  status: 1
})

const formRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  image_url: [{ required: true, message: '请输入图片链接', trigger: 'blur' }]
}

const loadBanners = async () => {
  loading.value = true
  try {
    const data = await getBannerListApi()
    bannerList.value = data.list || data || []
  } catch (error) {
    console.error('加载Banner列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  currentBannerId.value = null
  bannerForm.title = ''
  bannerForm.image_url = ''
  bannerForm.link_type = 'page'
  bannerForm.link_url = ''
  bannerForm.sort = 0
  bannerForm.status = 1
  formDialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentBannerId.value = row.id
  bannerForm.title = row.title
  bannerForm.image_url = row.image_url
  bannerForm.link_type = row.link_type
  bannerForm.link_url = row.link_url
  bannerForm.sort = row.sort
  bannerForm.status = row.status
  formDialogVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await updateBannerApi(currentBannerId.value, bannerForm)
        } else {
          await createBannerApi(bannerForm)
        }
        ElMessage.success('保存成功')
        formDialogVisible.value = false
        loadBanners()
      } catch (error) {
        console.error('保存失败:', error)
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该Banner吗？',
    '删除确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      await deleteBannerApi(row.id)
      ElMessage.success('删除成功')
      loadBanners()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadBanners()
})
</script>
