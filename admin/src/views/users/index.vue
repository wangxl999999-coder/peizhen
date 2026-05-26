<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">用户管理</span>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索昵称/手机号"
        clearable
        style="width: 240px"
        @clear="loadUsers"
        @keyup.enter="loadUsers">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="loadUsers">搜索</el-button>
    </div>
    
    <el-card class="table-container">
      <el-table :data="userList" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 1 ? '男' : row.gender === 2 ? '女' : '未知' }}
          </template>
        </el-table-column>
        <el-table-column prop="order_count" label="订单数" width="100" />
        <el-table-column prop="create_time" label="注册时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
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
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadUsers"
          @current-change="loadUsers" />
      </div>
    </el-card>
    
    <el-dialog
      v-model="editDialogVisible"
      title="编辑用户"
      width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="editForm.real_name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserListApi, updateUserApi } from '@/api'

const loading = ref(false)
const userList = ref([])
const editDialogVisible = ref(false)
const currentUserId = ref(null)

const searchForm = reactive({
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const editForm = reactive({
  nickname: '',
  phone: '',
  real_name: ''
})

const loadUsers = async () => {
  loading.value = true
  try {
    const data = await getUserListApi({
      keyword: searchForm.keyword,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    userList.value = data.list || []
    pagination.total = data.total || 0
  } catch (error) {
    console.error('加载用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleEdit = (row) => {
  currentUserId.value = row.id
  editForm.nickname = row.nickname
  editForm.phone = row.phone
  editForm.real_name = row.real_name
  editDialogVisible.value = true
}

const handleSave = async () => {
  try {
    await updateUserApi(currentUserId.value, editForm)
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    loadUsers()
  } catch (error) {
    console.error('保存失败:', error)
  }
}

const handleToggleStatus = (row) => {
  ElMessageBox.confirm(
    `确定要${row.status === 1 ? '禁用' : '启用'}该用户吗？`,
    '提示',
    { type: 'warning' }
  ).then(async () => {
    try {
      await updateUserApi(row.id, { status: row.status === 1 ? 0 : 1 })
      ElMessage.success('操作成功')
      loadUsers()
    } catch (error) {
      console.error('操作失败:', error)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadUsers()
})
</script>
