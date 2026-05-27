<template>
  <div class="admin-finance">
    <el-card class="stats-card">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">¥{{ financeStats.totalAmount || '0.00' }}</div>
          <div class="stat-label">订单总额</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">¥{{ financeStats.totalPlatformIncome || '0.00' }}</div>
          <div class="stat-label">平台收入</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">¥{{ financeStats.totalCompanionIncome || '0.00' }}</div>
          <div class="stat-label">陪诊师收入</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ financeStats.orderCount || 0 }}</div>
          <div class="stat-label">订单数量</div>
        </div>
      </div>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>分成明细</span>
          <el-button type="primary" @click="exportData">导出</el-button>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="陪诊师ID">
          <el-input v-model="queryForm.companion_id" placeholder="陪诊师ID" clearable />
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="queryForm.start_date" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="queryForm.end_date" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="user_id" label="用户ID" width="100" />
        <el-table-column prop="companion_id" label="陪诊师ID" width="120" />
        <el-table-column prop="total_amount" label="订单金额" width="120">
          <template #default="{ row }">¥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column prop="platform_amount" label="平台分成" width="120">
          <template #default="{ row }">
            <span style="color: #67C23A">¥{{ row.platform_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="companion_amount" label="陪诊师分成" width="120">
          <template #default="{ row }">
            <span style="color: #E6A23C">¥{{ row.companion_amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="platform_rate" label="分成比例" width="100" />
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const tableData = ref([])
const financeStats = ref({})

const queryForm = reactive({
  companion_id: '',
  start_date: '',
  end_date: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const loadData = async () => {
  try {
    const res = await request.get('/admin/finance/commission', {
      params: { ...queryForm, page: pagination.page, pageSize: pagination.pageSize }
    })
    if (res.code === 200) {
      tableData.value = res.data.list
      pagination.total = res.data.total
      if (res.data.summary) {
        financeStats.value = {
          totalAmount: res.data.summary.totalAmount,
          totalPlatformIncome: res.data.summary.totalPlatform,
          totalCompanionIncome: res.data.summary.totalCompanion,
          orderCount: res.data.summary.orderCount
        }
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const loadStats = async () => {
  try {
    const res = await request.get('/admin/finance/statistics')
    if (res.code === 200) {
      financeStats.value = res.data
    }
  } catch (e) {
    console.error(e)
  }
}

const resetSearch = () => {
  queryForm.companion_id = ''
  queryForm.start_date = ''
  queryForm.end_date = ''
  pagination.page = 1
  loadData()
}

const exportData = () => {
  ElMessage.info('导出功能开发中')
}

onMounted(() => {
  loadData()
  loadStats()
})
</script>

<style scoped lang="scss">
.admin-finance {
  .stats-card {
    margin-bottom: 20px;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .stat-item {
    text-align: center;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;
  }
  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #409EFF;
    margin-bottom: 8px;
  }
  .stat-label {
    color: #909399;
    font-size: 14px;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .search-form {
    margin-bottom: 20px;
  }
  .pagination-container {
    margin-top: 20px;
    text-align: right;
  }
}
</style>
