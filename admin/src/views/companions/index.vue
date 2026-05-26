<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">陪诊师管理</span>
    </div>
    
    <div class="search-bar">
      <el-input
        v-model="searchForm.keyword"
        placeholder="搜索姓名/手机号"
        clearable
        style="width: 240px"
        @clear="loadCompanions"
        @keyup.enter="loadCompanions">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="searchForm.verify_status" placeholder="审核状态" style="width: 140px" @change="loadCompanions">
        <el-option label="全部" value="" />
        <el-option label="待审核" value="pending" />
        <el-option label="已通过" value="approved" />
        <el-option label="已拒绝" value="rejected" />
      </el-select>
      <el-button type="primary" @click="loadCompanions">搜索</el-button>
    </div>
    
    <el-card class="table-container">
      <el-table :data="companionList" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="real_name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="qualification" label="资质" />
        <el-table-column prop="rating" label="评分" width="100">
          <template #default="{ row }">
            <span class="rating">{{ row.rating }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="order_count" label="订单数" width="100" />
        <el-table-column prop="verify_status" label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getVerifyType(row.verify_status)" size="small">
              {{ getVerifyText(row.verify_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button 
              v-if="row.verify_status === 'pending'" 
              link 
              type="success" 
              @click="handleVerify(row, 'approved')">通过</el-button>
            <el-button 
              v-if="row.verify_status === 'pending'" 
              link 
              type="danger" 
              @click="handleVerify(row, 'rejected')">拒绝</el-button>
            <el-button link type="primary" @click="handleViewDetail(row)">详情</el-button>
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
          @size-change="loadCompanions"
          @current-change="loadCompanions" />
      </div>
    </el-card>
    
    <el-dialog
      v-model="detailDialogVisible"
      title="陪诊师详情"
      width="600px">
      <el-descriptions :column="2" border v-if="currentCompanion">
        <el-descriptions-item label="姓名">{{ currentCompanion.real_name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentCompanion.phone }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ currentCompanion.gender === 1 ? '男' : '女' }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ currentCompanion.age }}</el-descriptions-item>
        <el-descriptions-item label="所在城市">{{ currentCompanion.city }}</el-descriptions-item>
        <el-descriptions-item label="从业年限">{{ currentCompanion.experience }}年</el-descriptions-item>
        <el-descriptions-item label="资质证书">{{ currentCompanion.qualification }}</el-descriptions-item>
        <el-descriptions-item label="证书编号">{{ currentCompanion.qualification_no }}</el-descriptions-item>
        <el-descriptions-item label="评分">{{ currentCompanion.rating }}</el-descriptions-item>
        <el-descriptions-item label="订单数">{{ currentCompanion.order_count }}</el-descriptions-item>
        <el-descriptions-item label="个人简介" :span="2">{{ currentCompanion.intro }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCompanionListApi, verifyCompanionApi } from '@/api'

const loading = ref(false)
const companionList = ref([])
const detailDialogVisible = ref(false)
const currentCompanion = ref(null)

const searchForm = reactive({
  keyword: '',
  verify_status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const getVerifyType = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

const getVerifyText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || status
}

const loadCompanions = async () => {
  loading.value = true
  try {
    const data = await getCompanionListApi({
      keyword: searchForm.keyword,
      verify_status: searchForm.verify_status,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    companionList.value = data.list || []
    pagination.total = data.total || 0
  } catch (error) {
    console.error('加载陪诊师列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleVerify = (row, status) => {
  const text = status === 'approved' ? '通过' : '拒绝'
  ElMessageBox.confirm(
    `确定要${text}该陪诊师的审核吗？`,
    '审核确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      await verifyCompanionApi(row.id, { verify_status: status })
      ElMessage.success('操作成功')
      loadCompanions()
    } catch (error) {
      console.error('审核失败:', error)
    }
  }).catch(() => {})
}

const handleViewDetail = (row) => {
  currentCompanion.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  loadCompanions()
})
</script>

<style lang="scss" scoped>
.rating {
  color: #faad14;
  font-weight: 500;
}
</style>
