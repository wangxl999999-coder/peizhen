<template>
  <div class="admin-hospitals">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>医院管理</span>
          <el-button type="primary" @click="showDialog()">新增医院</el-button>
        </div>
      </template>
      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="名称">
          <el-input v-model="queryForm.keyword" placeholder="医院名称" clearable />
        </el-form-item>
        <el-form-item label="城市">
          <el-select v-model="queryForm.city_id" placeholder="全部" clearable>
            <el-option v-for="city in cities" :key="city.id" :label="city.name" :value="city.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="name" label="医院名称" />
        <el-table-column prop="level" label="等级" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.level">{{ getLevelText(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" show-overflow-tooltip />
        <el-table-column prop="phone" label="电话" width="150" />
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
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑医院' : '新增医院'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="医院名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入医院名称" />
        </el-form-item>
        <el-form-item label="等级">
          <el-select v-model="form.level" placeholder="请选择等级">
            <el-option label="三甲" value="3甲" />
            <el-option label="三乙" value="3乙" />
            <el-option label="二甲" value="2甲" />
            <el-option label="二乙" value="2乙" />
            <el-option label="一甲" value="1甲" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属城市" prop="city_id">
          <el-select v-model="form.city_id" placeholder="请选择城市" style="width: 100%">
            <el-option v-for="city in cities" :key="city.id" :label="city.name" :value="city.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" placeholder="请输入电话" />
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
const cities = ref([])
const dialogVisible = ref(false)
const formRef = ref(null)

const queryForm = reactive({
  keyword: '',
  city_id: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  name: '',
  level: '',
  city_id: '',
  address: '',
  phone: '',
  sort_order: 0,
  status: 1
})

const rules = {
  name: [{ required: true, message: '请输入医院名称', trigger: 'blur' }]
}

const loadCities = async () => {
  try {
    const res = await request.get('/admin/cities')
    if (res.code === 200) {
      cities.value = res.data.list || []
    }
  } catch (e) {
    console.error(e)
  }
}

const loadData = async () => {
  try {
    const res = await request.get('/admin/hospitals', {
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
  queryForm.city_id = ''
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
      level: '',
      city_id: '',
      address: '',
      phone: '',
      sort_order: 0,
      status: 1
    })
  }
  dialogVisible.value = true
}

const saveItem = async () => {
  try {
    await formRef.value.validate()
    const url = form.id ? `/admin/hospitals/${form.id}` : '/admin/hospitals'
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
    const res = await request.put(`/admin/hospitals/${row.id}`, {
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
    const res = await request.delete(`/admin/hospitals/${row.id}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch (e) {
    console.error(e)
  }
}

const getLevelText = (level) => {
  const map = { '3甲': '三甲', '3乙': '三乙', '2甲': '二甲', '2乙': '二乙', '1甲': '一甲', '其他': '其他' }
  return map[level] || level
}

onMounted(() => {
  loadCities()
  loadData()
})
</script>

<style scoped lang="scss">
.admin-hospitals {
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
