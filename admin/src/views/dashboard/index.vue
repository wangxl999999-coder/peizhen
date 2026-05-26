<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6" v-for="item in statCards" :key="item.label">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
          <el-icon :size="48" :color="item.color" class="stat-icon">
            <component :is="item.icon" />
          </el-icon>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>订单趋势</span>
              <el-radio-group v-model="chartType" size="small">
                <el-radio-button label="week">近7天</el-radio-button>
                <el-radio-button label="month">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="orderChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>服务类型分布</span>
          </template>
          <div ref="serviceChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>最新订单</span>
          </template>
          <el-table :data="latestOrders" style="width: 100%">
            <el-table-column prop="order_no" label="订单号" width="160" />
            <el-table-column prop="service_name" label="服务类型" />
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
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>热门陪诊师</span>
          </template>
          <el-table :data="topCompanions" style="width: 100%">
            <el-table-column prop="real_name" label="姓名" />
            <el-table-column prop="order_count" label="订单数" width="100" />
            <el-table-column prop="rating" label="评分" width="100">
              <template #default="{ row }">
                <span class="rating">{{ row.rating }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { getStatisticsApi } from '@/api'

const orderChartRef = ref()
const serviceChartRef = ref()
let orderChart = null
let serviceChart = null

const chartType = ref('week')
const statCards = ref([
  { label: '用户总数', value: 0, icon: 'User', color: '#1890ff' },
  { label: '陪诊师总数', value: 0, icon: 'Avatar', color: '#52c41a' },
  { label: '今日订单', value: 0, icon: 'List', color: '#faad14' },
  { label: '今日收入', value: '¥0', icon: 'Money', color: '#f5222d' }
])

const latestOrders = ref([])
const topCompanions = ref([])

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

const initCharts = () => {
  if (orderChartRef.value) {
    orderChart = echarts.init(orderChartRef.value)
  }
  
  if (serviceChartRef.value) {
    serviceChart = echarts.init(serviceChartRef.value)
  }
}

const updateOrderChart = (data) => {
  if (!orderChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.dates,
      boundaryGap: false
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '订单数',
        type: 'line',
        data: data.order_counts,
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#1890ff',
          width: 2
        },
        itemStyle: {
          color: '#1890ff'
        }
      }
    ]
  }
  
  orderChart.setOption(option)
}

const updateServiceChart = (data) => {
  if (!serviceChart) return
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '服务类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  }
  
  serviceChart.setOption(option)
}

const loadData = async () => {
  try {
    const data = await getStatisticsApi()
    
    statCards.value = [
      { label: '用户总数', value: data.user_count || 0, icon: 'User', color: '#1890ff' },
      { label: '陪诊师总数', value: data.companion_count || 0, icon: 'Avatar', color: '#52c41a' },
      { label: '今日订单', value: data.today_orders || 0, icon: 'List', color: '#faad14' },
      { label: '今日收入', value: `¥${data.today_income || 0}`, icon: 'Money', color: '#f5222d' }
    ]
    
    latestOrders.value = data.latest_orders || []
    topCompanions.value = data.top_companions || []
    
    if (chartType.value === 'week') {
      updateOrderChart(data.week_data || { dates: [], order_counts: [] })
    } else {
      updateOrderChart(data.month_data || { dates: [], order_counts: [] })
    }
    
    updateServiceChart(data.service_distribution || [])
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const handleResize = () => {
  orderChart?.resize()
  serviceChart?.resize()
}

watch(chartType, () => {
  loadData()
})

onMounted(() => {
  initCharts()
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  orderChart?.dispose()
  serviceChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  .stat-row {
    margin-bottom: 20px;
    
    .stat-card {
      border: none;
      
      :deep(.el-card__body) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px;
      }
      
      .stat-content {
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }
      
      .stat-icon {
        opacity: 0.8;
      }
    }
  }
  
  .chart-row {
    margin-bottom: 20px;
    
    .chart-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .chart-container {
        height: 300px;
      }
    }
  }
}

.price {
  color: #f5222d;
  font-weight: 500;
}

.rating {
  color: #faad14;
  font-weight: 500;
}
</style>
