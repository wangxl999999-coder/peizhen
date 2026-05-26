<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">投诉处理</span>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索订单号/用户"
        clearable
        style="width: 240px"
        @clear="loadComplaints"
        @keyup.enter="loadComplaints">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="searchForm.status" placeholder="处理状态" style="width: 140px" @change="loadComplaints">
        <el-option label="全部" value="" />
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已处理" value="resolved" />
        <el-option label="已关闭" value="closed" />
      </el-select>
      <el-button type="primary" @click="loadComplaints">搜索</el-button>
    </div>
    
    <el-card class="table-container">
      <el-table :data="complaintList" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="user_name" label="投诉人" width="100" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            {{ row.type === 'complaint' ? '投诉' : row.type === 'refund' ? '退款' : '其他' }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="投诉时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row)">处理</el-button>
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
          @size-change="loadComplaints"
          @current-change="loadComplaints" />
      </div>
    </el-card>
    
    <el-dialog
      v-model="detailDialogVisible"
      title="投诉详情"
      width="550px">
      <el-descriptions :column="1" border v-if="currentComplaint">
        <el-descriptions-item label="订单号">{{ currentComplaint.order_no }}</el-descriptions-item>
        <el-descriptions-item label="投诉人">{{ currentComplaint.user_name }}</el-descriptions-item>
        <el-descriptions-item label="投诉类型">
          {{ currentComplaint.type === 'complaint' ? '投诉' : currentComplaint.type === 'refund' ? '退款' : '其他' }}
        </el-descriptions-item>
        <el-descriptions-item label="投诉原因">{{ currentComplaint.reason }}</el-descriptions-item>
        <el-descriptions-item label="详细描述">{{ currentComplaint.description || '无' }}</el-descriptions-item>
        <el-descriptions-item label="投诉时间">{{ currentComplaint.create_time }}</el-descriptions-item>
      </el-descriptions>
      
      <div class="handle-section">
        <el-form :model="handleForm" label-width="80px">
          <el-form-item label="处理状态">
            <el-select v-model="handleForm.status" style="width: 100%">
              <el-option label="处理中" value="processing" />
              <el-option label="已处理" value="resolved" />
              <el-option label="已关闭" value="closed" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理结果">
            <el-input 
              v-model="handleForm.result" 
              type="textarea" 
              :rows="3"
              placeholder="请输入处理结果" />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="detailDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getComplaintListApi, handleComplaintApi } from '@/api'

const loading = ref(false)
const complaintList = ref([])
const detailDialogVisible = ref(false)
const currentComplaint = ref(null)

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const handleForm = reactive({
  status: '',
  result: ''
})

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    processing: 'primary',
    resolved: 'success',
    closed: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已处理',
    closed: '已关闭'
  }
  return map[status] || status
}

const loadComplaints = async () => {
  loading.value = true
  try {
    const data = await getComplaintListApi({
      keyword: searchForm.keyword,
      status: searchForm.status,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    complaintList.value = data.list || []
    pagination.total = data.total || 0
  } catch (error) {
    console.error('加载投诉列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleViewDetail = (row) => {
  currentComplaint.value = row
  handleForm.status = row.status
  handleForm.result = ''
  detailDialogVisible.value = true
}

const handleSave = async () => {
  try {
    await handleComplaintApi(currentComplaint.value.id, handleForm)
    ElMessage.success('处理成功')
    detailDialogVisible.value = false
    loadComplaints()
  } catch (error) {
    console.error('处理失败:', error)
  }
}

onMounted(() => {
  loadComplaints()
})
</script>

<style lang="scss" scoped>
.handle-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
