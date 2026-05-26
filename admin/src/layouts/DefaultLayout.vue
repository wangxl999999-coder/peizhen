<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="layout-aside">
      <div class="logo">
        <el-icon :size="28"><Service /></el-icon>
        <span>陪诊管理后台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        @select="handleMenuSelect">
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon :size="20"><DataAnalysis /></el-icon>
          <span>{{ pageTitle }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" class="avatar">管</el-avatar>
              <span>{{ adminName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()

const adminName = ref('管理员')

const menuItems = [
  { path: '/dashboard', title: '数据统计', icon: 'DataAnalysis' },
  { path: '/users', title: '用户管理', icon: 'User' },
  { path: '/companions', title: '陪诊师管理', icon: 'Avatar' },
  { path: '/orders', title: '订单管理', icon: 'List' },
  { path: '/services', title: '服务管理', icon: 'Service' },
  { path: '/cities', title: '城市管理', icon: 'Location' },
  { path: '/banners', title: 'Banner管理', icon: 'Picture' },
  { path: '/complaints', title: '投诉处理', icon: 'Warning' },
  { path: '/settings', title: '系统设置', icon: 'Setting' }
]

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta.title || '管理后台')

const handleMenuSelect = (path) => {
  router.push(path)
}

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      localStorage.removeItem('adminToken')
      router.push('/login')
      ElMessage.success('退出登录成功')
    }).catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background: #001529;
  transition: width 0.3s;
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 1px solid #1f3a5f;
  }
  
  .menu {
    border-right: none;
    background: #001529;
    
    :deep(.el-menu-item) {
      color: rgba(255, 255, 255, 0.85);
      
      &:hover {
        background: #1890ff;
        color: #fff;
      }
      
      &.is-active {
        background: #1890ff;
        color: #fff;
      }
    }
  }
}

.layout-header {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 500;
  }
  
  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      
      .avatar {
        background: #1890ff;
      }
    }
  }
}

.layout-main {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
