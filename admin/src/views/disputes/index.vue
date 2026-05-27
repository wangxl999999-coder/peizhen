<template>
  <div class="admin-disputes">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>纠纷处理</span>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable>
            <el-option label="待处理" :value="0" />
            <el-option label="处理中" :value="1" />
            <el-option label="已处理" :value="2" />
            <el-option label="已关闭" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="queryForm.keyword" placeholder="搜索内容" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="user_name" label="用户" width="120" />
        <el-table-column prop="user_phone" label="用户电话" width="130" />
        <el-table-column prop="companion_name" label="陪诊师" width="120" />
        <el-table-column prop="companion_phone" label="陪诊师电话" width="130" />
        <el-table-column prop="content" label="投诉内容" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDialog(row)">处理</el-button>
            <el-button link type="info" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
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
    <el-dialog v-model="dialogVisible" title="处理纠纷" width="500px">
      <el-descriptions v-if="currentRow" :column="1" border>
        <el-descriptions-item label="订单号">{{ currentRow.order_no }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentRow.user_name }} ({{ currentRow.user_phone }})</el-descriptions-item>
        <el-descriptions-item label="陪诊师">{{ currentRow.companion_name }} ({{ currentRow.companion_phone }})</el-descriptions-item>
        <el-descriptions-item label="投诉内容">{{ currentRow.content }}</el-descriptions-item>
      </el-descriptions>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" style="margin-top: 20px">
        <el-form-item label="处理结果" prop="status">
          <el-select v-model="form.status" placeholder="请选择" style="width: 100%">
            <el-option label="处理中" :value="1" />
            <el-option label="已处理" :value="2" />
            <el-option label="已关闭" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入处理意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveHandle">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="detailVisible" title="纠纷详情" width="600px">
      <el-descriptions v-if="currentRow" :column="1" border>
        <el-descriptions-item label="ID">{{ currentRow.id }}</el-descriptions-item>
        <el-descriptions-item label="订单号">{{ currentRow.order_no }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{ currentRow.user_name }} ({{ currentRow.user_phone }})</el-descriptions-item>
        <el-descriptions-item label="陪诊师">{{ currentRow.companion_name }} ({{ currentRow.companion_phone }})</el-descriptions-item>
        <el-descriptions-item label="投诉内容">{{ currentRow.content }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentRow.status)">{{ getStatusText(currentRow.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理备注">{{ currentRow.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentRow.created_at }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ currentRow.handled_at || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const tableData = ref([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const currentRow = ref(null)
const formRef = ref(null)

const queryForm = reactive({
  status: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  status: 2,
  remark: ''
})

const rules = {
  status: [{ required: true, message: '请选择处理结果', trigger: 'change' }],
  remark: [{ required: true, message: '请输入处理意见', trigger: 'blur' }]
}

const loadData = async () => {
  try {
    const res = await request.get('/admin/disputes', {
      params: { ...queryForm, page: pagination.page, pageSize: pagination.pageSize }
    })
    if (res.code === 200) {
      tableData.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (e) {
    console.error(e)
  }
}

const resetSearch = () => {
  queryForm.status = ''
  queryForm.keyword = ''
  pagination.page = 1
  loadData()
}

const handleDialog = (row) => {
  currentRow.value = row
  form.status = 2
  form.remark = ''
  dialogVisible.value = true
}

const viewDetail = (row) => {
  currentRow.value = row
  detailVisible.value = true
}

const saveHandle = async () => {
  try {
    await formRef.value.validate()
    const res = await request.post(`/admin/complaints/${currentRow.value.id}/handle`, form)
    if (res.code === 200) {
      ElMessage.success('处理成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.message || '处理失败')
    }
  } catch (e) {
    if (e.message) {
      ElMessage.error(e.message)
    }
  }
}

const getStatusText = (status) => {
  const map = { 0: '待处理', 1: '处理中', 2: '已处理', 3: '已关闭' }
  return map[status] || '未知'
}

const getStatusType = (status) => {
  const map = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'info' }
  return map[status] || 'info'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.admin-disputes {
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
