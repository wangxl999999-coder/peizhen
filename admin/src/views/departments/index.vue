<template>
  <div class="admin-departments">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>科室管理</span>
          <el-button type="primary" @click="showDialog()">新增科室</el-button>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="科室名称">
          <el-input v-model="queryForm.keyword" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="医院">
          <el-select v-model="queryForm.hospital_id" placeholder="全部" clearable>
            <el-option v-for="h in hospitals" :key="h.id" :label="h.name" :value="h.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="name" label="科室名称" />
        <el-table-column prop="hospital_name" label="所属医院" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="sort_order" label="排序" width="80" />
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
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑科室' : '新增科室'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="科室名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入科室名称" />
        </el-form-item>
        <el-form-item label="所属医院" prop="hospital_id">
          <el-select v-model="form.hospital_id" placeholder="请选择医院" style="width: 100%">
            <el-option v-for="h in hospitals" :key="h.id" :label="h.name" :value="h.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" />
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
const hospitals = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)

const queryForm = reactive({
  keyword: '',
  hospital_id: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  name: '',
  hospital_id: '',
  description: '',
  sort_order: 0,
  status: 1
})

const rules = {
  name: [{ required: true, message: '请输入科室名称', trigger: 'blur' }],
  hospital_id: [{ required: true, message: '请选择医院', trigger: 'change' }]
}

const loadHospitals = async () => {
  try {
    const res = await request.get('/admin/hospitals', { params: { pageSize: 1000 } })
    if (res.code === 200) {
      hospitals.value = res.data.list || []
    }
  } catch (e) {
    console.error(e)
  }
}

const loadData = async () => {
  try {
    const res = await request.get('/admin/departments', {
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
  queryForm.hospital_id = ''
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
      hospital_id: '',
      description: '',
      sort_order: 0,
      status: 1
    })
  }
  dialogVisible.value = true
}

const saveItem = async () => {
  try {
    await formRef.value.validate()
    const url = form.id ? `/admin/departments/${form.id}` : '/admin/departments'
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
    const res = await request.put(`/admin/departments/${row.id}`, {
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
    const res = await request.delete(`/admin/departments/${row.id}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadHospitals()
  loadData()
})
</script>

<style scoped lang="scss">
.admin-departments {
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
