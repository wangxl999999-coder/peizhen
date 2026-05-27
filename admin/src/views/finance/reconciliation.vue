<template>
  <div class="admin-reconciliation">
    <el-card class="summary-card">
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-value income">¥{{ summary.totalIncome || '0.00' }}</div>
          <div class="summary-label">总收入</div>
        </div>
        <div class="summary-item">
          <div class="summary-value expense">¥{{ summary.totalExpense || '0.00' }}</div>
          <div class="summary-label">总支出</div>
        </div>
        <div class="summary-item">
          <div class="summary-value balance">¥{{ summary.balance || '0.00' }}</div>
          <div class="summary-label">结余</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">{{ totalRecords }}</div>
          <div class="summary-label">记录数</div>
        </div>
      </div>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>对账明细</span>
          <el-button type="primary" @click="exportData">导出</el-button>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="类型">
          <el-select v-model="queryForm.type" placeholder="全部" clearable>
            <el-option label="收入" value="收入" />
            <el-option label="支出" value="支出" />
          </el-select>
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
        <el-table-column prop="id" label="编号" width="120" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === '收入' ? 'success' : 'danger'">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="150">
          <template #default="{ row }">
            <span :style="{ color: row.type === '收入' ? '#67C23A' : '#F56C6C' }">
              {{ row.type === '收入' ? '+' : '' }}¥{{ Math.abs(row.amount).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" show-overflow-tooltip />
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
const summary = ref({})
const totalRecords = ref(0)

const queryForm = reactive({
  type: '',
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
    const res = await request.get('/admin/finance/reconciliation', {
      params: { ...queryForm, page: pagination.page, pageSize: pagination.pageSize }
    })
    if (res.code === 200) {
      tableData.value = res.data.list
      pagination.total = res.data.total
      totalRecords.value = res.data.total
      if (res.data.summary) {
        summary.value = res.data.summary
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const resetSearch = () => {
  queryForm.type = ''
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
})
</script>

<style scoped lang="scss">
.admin-reconciliation {
  .summary-card {
    margin-bottom: 20px;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .summary-item {
    text-align: center;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;
  }
  .summary-value {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
    &.income { color: #67C23A; }
    &.expense { color: #F56C6C; }
    &.balance { color: #409EFF; }
  }
  .summary-label {
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
