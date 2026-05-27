<template>
  <div class="admin-stats">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">用户总数</div>
          <div class="stat-value">{{ userStats.totalUsers || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">今日新增</div>
          <div class="stat-value success">{{ userStats.newToday || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">本月新增</div>
          <div class="stat-value success">{{ userStats.newThisMonth || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">今日活跃</div>
          <div class="stat-value primary">{{ userStats.activeUsers || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="chart-card">
      <template #header>
        <span>用户增长趋势</span>
      </template>
      <div ref="growthChartRef" class="chart-container"></div>
    </el-card>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>活跃度统计</span>
          </template>
          <div ref="activityChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>复购率统计</span>
          </template>
          <div ref="repurchaseChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="chart-card">
      <template #header>
        <span>陪诊师绩效统计</span>
        <el-select v-model="companionStatsPeriod" size="small" style="width: 120px" @change="loadCompanionStats">
          <el-option label="今日" value="today" />
          <el-option label="本周" value="week" />
          <el-option label="本月" value="month" />
        </el-select>
      </template>
      <el-table :data="companionStatsList" style="width: 100%">
        <el-table-column prop="companion_id" label="ID" width="80" />
        <el-table-column prop="companion_name" label="姓名" width="120" />
        <el-table-column prop="order_count" label="接单量" width="100" />
        <el-table-column prop="complete_count" label="完成量" width="100" />
        <el-table-column prop="accept_rate" label="接单率" width="120">
          <template #default="{ row }">{{ row.accept_rate }}%</template>
        </el-table-column>
        <el-table-column prop="good_rate" label="好评率" width="120">
          <template #default="{ row }">{{ row.good_rate }}%</template>
        </el-table-column>
        <el-table-column prop="total_amount" label="收入(元)" width="120" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewPerformance(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="performanceVisible" title="陪诊师绩效详情" width="600px">
      <el-descriptions :column="2" border v-if="performanceData">
        <el-descriptions-item label="陪诊师">{{ performanceData.companion?.name }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ performanceData.companion?.phone }}</el-descriptions-item>
        <el-descriptions-item label="总订单数">{{ performanceData.totalOrders }}</el-descriptions-item>
        <el-descriptions-item label="已接订单">{{ performanceData.acceptedOrders }}</el-descriptions-item>
        <el-descriptions-item label="已完成">{{ performanceData.completedOrders }}</el-descriptions-item>
        <el-descriptions-item label="已取消">{{ performanceData.cancelledOrders }}</el-descriptions-item>
        <el-descriptions-item label="总收入">¥{{ performanceData.totalAmount }}</el-descriptions-item>
        <el-descriptions-item label="平均评分">{{ performanceData.avgScore }}</el-descriptions-item>
        <el-descriptions-item label="好评率">{{ performanceData.ratingRate }}</el-descriptions-item>
        <el-descriptions-item label="投诉数">{{ performanceData.complaintCount }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

const userStats = ref({})
const companionStatsPeriod = ref('month')
const companionStatsList = ref([])
const performanceVisible = ref(false)
const performanceData = ref(null)

const growthChartRef = ref(null)
const activityChartRef = ref(null)
const repurchaseChartRef = ref(null)

let growthChart = null
let activityChart = null
let repurchaseChart = null

const loadUserStats = async () => {
  try {
    const data = await request.get('/admin/users/statistics')
    userStats.value = data
  } catch (e) {
    console.error(e)
  }
}

const loadGrowthStats = async () => {
  try {
    const data = await request.get('/admin/stats/user-growth')
    if (growthChart) {
      growthChart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: data.map(d => d.date)
        },
        yAxis: { type: 'value' },
        series: [{
          data: data.map(d => d.count),
          type: 'line',
          smooth: true,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64,158,255,0.5)' },
              { offset: 1, color: 'rgba(64,158,255,0.1)' }
            ])
          },
          lineStyle: { color: '#409EFF', width: 2 }
        }]
      })
    }
  } catch (e) {
    console.error(e)
  }
}

const loadActivityStats = async () => {
  try {
    const data = await request.get('/admin/stats/activity')
    if (activityChart) {
      const daily = data.last7_days || []
      activityChart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: daily.map(d => d.date)
        },
        yAxis: { type: 'value' },
        series: [{
          name: '活跃用户',
          data: daily.map(d => d.active_count),
          type: 'bar',
          itemStyle: { color: '#67C23A' }
        }]
      })
    }
  } catch (e) {
    console.error(e)
  }
}

const loadRepurchaseStats = async () => {
  try {
    const data = await request.get('/admin/stats/repurchase-rate')
    if (repurchaseChart) {
      repurchaseChart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { value: data.repeat_user_count || 0, name: '复购用户', itemStyle: { color: '#409EFF' } },
            { value: (data.total_users || 0) - (data.repeat_user_count || 0), name: '单次用户', itemStyle: { color: '#E6A23C' } }
          ]
        }]
      })
    }
  } catch (e) {
    console.error(e)
  }
}

const loadCompanionStats = async () => {
  try {
    const data = await request.get('/admin/companion-statistics', {
      params: { period: companionStatsPeriod.value }
    })
    companionStatsList.value = data.list || data || []
  } catch (e) {
    console.error(e)
  }
}

const viewPerformance = async (row) => {
  try {
    const data = await request.get(`/admin/companions/${row.companion_id || row.id}/performance`)
    performanceData.value = data
    performanceVisible.value = true
  } catch (e) {
    console.error(e)
  }
}

const initCharts = () => {
  growthChart = echarts.init(growthChartRef.value)
  activityChart = echarts.init(activityChartRef.value)
  repurchaseChart = echarts.init(repurchaseChartRef.value)

  const handleResize = () => {
    growthChart?.resize()
    activityChart?.resize()
    repurchaseChart?.resize()
  }
  window.addEventListener('resize', handleResize)
}

onMounted(async () => {
  loadUserStats()
  await nextTick()
  initCharts()
  loadGrowthStats()
  loadActivityStats()
  loadRepurchaseStats()
  loadCompanionStats()
})

onUnmounted(() => {
  growthChart?.dispose()
  activityChart?.dispose()
  repurchaseChart?.dispose()
})
</script>

<style scoped lang="scss">
.admin-stats {
  .stats-row {
    margin-bottom: 20px;
  }
  .stat-card {
    text-align: center;
    .stat-label {
      color: #909399;
      font-size: 14px;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #303133;
      &.success { color: #67C23A; }
      &.primary { color: #409EFF; }
    }
  }
  .chart-card {
    margin-bottom: 20px;
  }
  .chart-container {
    height: 300px;
    width: 100%;
  }
}
</style>
