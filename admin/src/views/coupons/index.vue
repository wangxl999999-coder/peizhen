<template>
  <div class="admin-coupons">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>优惠券管理</span>
          <el-button type="primary" @click="showDialog()">新增优惠券</el-button>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="名称">
          <el-input v-model="queryForm.keyword" placeholder="优惠券名称" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="queryForm.type" placeholder="全部" clearable>
            <el-option label="满减券" :value="1" />
            <el-option label="折扣券" :value="2" />
            <el-option label="无门槛券" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 2 ? 'warning' : 'primary'">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="面值/折扣" width="120">
          <template #default="{ row }">
            <span v-if="row.type === 2">{{ row.discount }}折</span>
            <span v-else>¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="min_amount" label="满减条件" width="100">
          <template #default="{ row }">
            <span>{{ row.min_amount ? '满' + row.min_amount : '无门槛' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_count" label="总数" width="80" />
        <el-table-column prop="used_count" label="已用" width="80" />
        <el-table-column prop="valid_days" label="有效期(天)" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDialog(row)">编辑</el-button>
            <el-button link type="warning" @click="toggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-popconfirm title="确定删除？" @confirm="deleteItem(row)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
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
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑优惠券' : '新增优惠券'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入优惠券名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="满减券" :value="1" />
            <el-option label="折扣券" :value="2" />
            <el-option label="无门槛券" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.type !== 2" label="面值" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item v-if="form.type === 2" label="折扣" prop="discount">
          <el-input-number v-model="form.discount" :min="0.1" :max="9.9" :step="0.1" />
        </el-form-item>
        <el-form-item label="满减条件">
          <el-input-number v-model="form.min_amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="发放数量" prop="total_count">
          <el-input-number v-model="form.total_count" :min="1" />
        </el-form-item>
        <el-form-item label="有效期(天)" prop="valid_days">
          <el-input-number v-model="form.valid_days" :min="1" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveItem">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const tableData = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)

const queryForm = reactive({
  keyword: '',
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  name: '',
  type: 1,
  amount: 10,
  discount: 9,
  min_amount: 0,
  total_count: 100,
  valid_days: 30,
  status: 1
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  total_count: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  valid_days: [{ required: true, message: '请输入有效期', trigger: 'blur' }]
}

const loadData = async () => {
  try {
    const res = await request.get('/admin/coupons', {
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
  queryForm.keyword = ''
  queryForm.type = ''
  queryForm.status = ''
  pagination.page = 1
  loadData()
}

const showDialog = (row) => {
  if (row) {
    Object.assign(form, row)
  } else {
    Object.assign(form, {
      id: null,
      name: '',
      type: 1,
      amount: 10,
      discount: 9,
      min_amount: 0,
      total_count: 100,
      valid_days: 30,
      status: 1
    })
  }
  dialogVisible.value = true
}

const saveItem = async () => {
  try {
    await formRef.value.validate()
    const url = form.id ? `/admin/coupons/${form.id}` : '/admin/coupons'
    const method = form.id ? 'put' : 'post'
    const res = await request[method](url, form)
    if (res.code === 200) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (e) {
    if (e.message) {
      ElMessage.error(e.message)
    }
  }
}

const toggleStatus = async (row) => {
  try {
    const res = await request.put(`/admin/coupons/${row.id}`, {
      ...row,
      status: row.status === 1 ? 0 : 1
    })
    if (res.code === 200) {
      ElMessage.success('操作成功')
      loadData()
    }
  } catch (e) {
    console.error(e)
  }
}

const deleteItem = async (row) => {
  try {
    const res = await request.delete(`/admin/coupons/${row.id}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (e) {
    console.error(e)
  }
}

const getTypeText = (type) => {
  const map = { 1: '满减券', 2: '折扣券', 3: '无门槛券' }
  return map[type] || '未知'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.admin-coupons {
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
