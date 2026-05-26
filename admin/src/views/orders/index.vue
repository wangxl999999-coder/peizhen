<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">订单管理</span>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索订单号/用户"
        clearable
        style="width: 240px"
        @clear="loadOrders"
        @keyup.enter="loadOrders">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="searchForm.status" placeholder="订单状态" style="width: 140px" @change="loadOrders">
        <el-option label="全部" value="" />
        <el-option label="待接单" value="pending_accept" />
        <el-option label="待服务" value="pending_service" />
        <el-option label="服务中" value="in_service" />
        <el-option label="待评价" value="pending_evaluation" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-button type="primary" @click="loadOrders">搜索</el-button>
    </div>
    
    <el-card class="table-container">
      <el-table :data="orderList" v-loading="loading" style="width: 100%">
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="service_name" label="服务类型" />
        <el-table-column prop="user_name" label="用户" width="100" />
        <el-table-column prop="companion_name" label="陪诊师" width="100" />
        <el-table-column prop="service_date" label="服务日期" width="120" />
        <el-table-column prop="total_price" label="金额" width="100">
          <template #default="{ row }">
            <span class="price">¥{{ row.total_price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="下单时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row)">详情</el-button>
            <el-button 
              v-if="row.status === 'pending_accept'" 
              link 
              type="danger" 
              @click="handleCancel(row)">取消</el-button>
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
          @size-change="loadOrders"
          @current-change="loadOrders" />
      </div>
    </el-card>
    
    <el-dialog
      v-model="detailDialogVisible"
      title="订单详情"
      width="600px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentOrder.status)" size="small">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="服务类型">{{ currentOrder.service_name }}</el-descriptions-item>
        <el-descriptions-item label="服务金额">¥{{ currentOrder.total_price }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentOrder.user_name }}</el-descriptions-item>
        <el-descriptions-item label="陪诊师">{{ currentOrder.companion_name }}</el-descriptions-item>
        <el-descriptions-item label="服务日期">{{ currentOrder.service_date }}</el-descriptions-item>
        <el-descriptions-item label="服务时段">{{ currentOrder.start_time }} - {{ currentOrder.end_time }}</el-descriptions-item>
        <el-descriptions-item label="服务医院" :span="2">{{ currentOrder.hospital_name }}</el-descriptions-item>
        <el-descriptions-item label="病情描述" :span="2">{{ currentOrder.symptom_description || '无' }}</el-descriptions-item>
        <el-descriptions-item label="下单时间" :span="2">{{ currentOrder.create_time }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderListApi, getOrderDetailApi } from '@/api'

const loading = ref(false)
const orderList = ref([])
const detailDialogVisible = ref(false)
const currentOrder = ref(null)

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getStatusType = (status) => {
  const map = {
    pending_accept: 'warning',
    pending_service: 'primary',
    in_service: 'success',
    pending_evaluation: 'warning',
    completed: 'info',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending_accept: '待接单',
    pending_service: '待服务',
    in_service: '服务中',
    pending_evaluation: '待评价',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const loadOrders = async () => {
  loading.value = true
  try {
    const data = await getOrderListApi({
      keyword: searchForm.keyword,
      status: searchForm.status,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    orderList.value = data.list || []
    pagination.total = data.total || 0
  } catch (error) {
    console.error('加载订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleViewDetail = async (row) => {
  try {
    const data = await getOrderDetailApi(row.id)
    currentOrder.value = data
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取订单详情失败:', error)
  }
}

const handleCancel = (row) => {
  ElMessageBox.confirm(
    '确定要取消该订单吗？',
    '取消订单',
    { type: 'warning' }
  ).then(() => {
    ElMessage.success('订单已取消')
    loadOrders()
  }).catch(() => {})
}

onMounted(() => {
  loadOrders()
})
</script>

<style lang="scss" scoped>
.price {
  color: #f5222d;
  font-weight: 500;
}
</style>
