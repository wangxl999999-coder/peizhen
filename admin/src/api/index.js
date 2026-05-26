import request from '@/utils/request'

export const loginApi = (data) => {
  return request.post('/auth/admin/login', data)
}

export const getStatisticsApi = () => {
  return request.get('/admin/statistics')
}

export const getUserListApi = (params) => {
  return request.get('/admin/users', { params })
}

export const updateUserApi = (id, data) => {
  return request.put(`/admin/users/${id}`, data)
}

export const deleteUserApi = (id) => {
  return request.delete(`/admin/users/${id}`)
}

export const getCompanionListApi = (params) => {
  return request.get('/admin/companions', { params })
}

export const verifyCompanionApi = (id, data) => {
  return request.put(`/admin/companions/${id}/verify`, data)
}

export const updateCompanionApi = (id, data) => {
  return request.put(`/admin/companions/${id}`, data)
}

export const deleteCompanionApi = (id) => {
  return request.delete(`/admin/companions/${id}`)
}

export const getOrderListApi = (params) => {
  return request.get('/admin/orders', { params })
}

export const getOrderDetailApi = (id) => {
  return request.get(`/admin/orders/${id}`)
}

export const refundOrderApi = (id, data) => {
  return request.post(`/admin/orders/${id}/refund`, data)
}

export const getServiceListApi = (params) => {
  return request.get('/admin/services', { params })
}

export const createServiceApi = (data) => {
  return request.post('/admin/services', data)
}

export const updateServiceApi = (id, data) => {
  return request.put(`/admin/services/${id}`, data)
}

export const deleteServiceApi = (id) => {
  return request.delete(`/admin/services/${id}`)
}

export const getCityListApi = (params) => {
  return request.get('/admin/cities', { params })
}

export const createCityApi = (data) => {
  return request.post('/admin/cities', data)
}

export const updateCityApi = (id, data) => {
  return request.put(`/admin/cities/${id}`, data)
}

export const deleteCityApi = (id) => {
  return request.delete(`/admin/cities/${id}`)
}

export const getBannerListApi = (params) => {
  return request.get('/admin/banners', { params })
}

export const createBannerApi = (data) => {
  return request.post('/admin/banners', data)
}

export const updateBannerApi = (id, data) => {
  return request.put(`/admin/banners/${id}`, data)
}

export const deleteBannerApi = (id) => {
  return request.delete(`/admin/banners/${id}`)
}

export const getComplaintListApi = (params) => {
  return request.get('/admin/complaints', { params })
}

export const handleComplaintApi = (id, data) => {
  return request.put(`/admin/complaints/${id}`, data)
}

export const getSettingsApi = () => {
  return request.get('/admin/settings')
}

export const updateSettingsApi = (data) => {
  return request.put('/admin/settings', data)
}
