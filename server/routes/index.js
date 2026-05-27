const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const config = require('../config');

const auth = require('../middleware/auth');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const orderController = require('../controllers/orderController');
const companionController = require('../controllers/companionController');
const commonController = require('../controllers/commonController');
const adminController = require('../controllers/adminController');
const companionEnhancedController = require('../controllers/companionEnhancedController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.upload.path);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxSize
  }
});

router.post('/auth/wechat-login', authController.wechatLogin);
router.post('/auth/companion-register', authController.companionRegister);
router.post('/auth/companion/login', authController.companionLogin);
router.post('/auth/companion/send-code', authController.companionSendCode);
router.post('/auth/companion/wechat-login', authController.companionWechatLogin);
router.post('/auth/admin-login', authController.adminLogin);

router.get('/common/home-data', commonController.getHomeData);
router.get('/common/banners', commonController.getBanners);
router.get('/common/cities', commonController.getCityList);
router.get('/common/hospitals', commonController.getHospitalList);
router.get('/common/departments', commonController.getDepartmentList);
router.get('/common/service-types', commonController.getServiceTypes);
router.get('/common/time-slots', commonController.getTimeSlots);
router.get('/common/faqs', commonController.getFaqList);
router.get('/common/trainings', commonController.getTrainingList);
router.get('/common/trainings/:id', commonController.getTrainingDetail);
router.get('/common/platform-rules', commonController.getPlatformRules);
router.post('/common/upload', auth(), upload.single('file'), commonController.uploadImage);

router.get('/user/info', auth(['user']), userController.getUserInfo);
router.post('/user/info', auth(['user']), userController.updateUserInfo);
router.get('/user/patients', auth(['user']), userController.getPatientList);
router.post('/user/patients', auth(['user']), userController.addPatient);
router.put('/user/patients/:id', auth(['user']), userController.updatePatient);
router.delete('/user/patients/:id', auth(['user']), userController.deletePatient);
router.post('/user/patients/:id/default', auth(['user']), userController.setDefaultPatient);

router.post('/order/calculate', auth(['user']), orderController.calculatePrice);
router.post('/order', auth(['user']), orderController.createOrder);
router.get('/order', auth(['user']), orderController.getOrderList);
router.get('/order/:id', auth(['user']), orderController.getOrderDetail);
router.post('/order/:id/cancel', auth(['user']), orderController.cancelOrder);
router.post('/order/:id/reschedule', auth(['user']), orderController.rescheduleOrder);
router.post('/order/after-sales', auth(['user']), orderController.createAfterSales);
router.post('/order/evaluation', auth(['user']), orderController.createEvaluation);
router.get('/user/medical-history', auth(['user']), orderController.getMedicalHistory);

router.get('/companion', companionController.getCompanionList);
router.get('/companion/nearby', companionController.getNearbyCompanions);
router.get('/companion/recommend', companionController.getRecommendCompanions);

router.get('/companion/info', auth(['companion']), companionController.getCompanionInfo);
router.get('/companion/orders', auth(['companion']), companionController.getCompanionOrders);
router.post('/companion/orders/:id/accept', auth(['companion']), companionController.acceptOrder);
router.post('/companion/orders/:id/status', auth(['companion']), companionController.updateOrderStatus);
router.post('/companion/post-service', auth(['companion']), companionController.savePostService);
router.post('/companion/work-status', auth(['companion']), companionController.updateWorkStatus);

router.get('/companion/verification', auth(['companion']), companionEnhancedController.getVerification);
router.post('/companion/verification', auth(['companion']), companionEnhancedController.submitVerification);
router.get('/companion/qualifications', auth(['companion']), companionEnhancedController.getQualificationList);
router.post('/companion/qualifications', auth(['companion']), companionEnhancedController.addQualification);
router.delete('/companion/qualifications/:id', auth(['companion']), companionEnhancedController.deleteQualification);
router.get('/companion/service-settings', auth(['companion']), companionEnhancedController.getServiceSettings);
router.post('/companion/service-settings', auth(['companion']), companionEnhancedController.saveServiceSettings);
router.get('/companion/hall-orders', auth(['companion']), companionEnhancedController.getHallOrders);
router.post('/companion/orders/:id/grab', auth(['companion']), companionEnhancedController.grabOrder);
router.post('/companion/orders/:id/accept-order', auth(['companion']), companionEnhancedController.acceptOrder);
router.post('/companion/orders/:id/reject', auth(['companion']), companionEnhancedController.rejectOrder);
router.post('/companion/orders/:id/checkin', auth(['companion']), companionEnhancedController.checkin);
router.get('/companion/orders/:id/checkins', auth(['companion']), companionEnhancedController.getCheckinList);
router.post('/companion/orders/:id/nodes', auth(['companion']), companionEnhancedController.addOrderNode);
router.get('/companion/orders/:id/nodes', auth(['companion']), companionEnhancedController.getOrderNodes);
router.post('/companion/orders/:id/files', auth(['companion']), companionEnhancedController.uploadServiceFile);
router.get('/companion/orders/:id/files', auth(['companion']), companionEnhancedController.getServiceFiles);
router.get('/companion/income/statistics', auth(['companion']), companionEnhancedController.getIncomeStatistics);
router.get('/companion/income/list', auth(['companion']), companionEnhancedController.getIncomeList);
router.post('/companion/withdraw', auth(['companion']), companionEnhancedController.createWithdraw);
router.get('/companion/withdraw/list', auth(['companion']), companionEnhancedController.getWithdrawList);
router.get('/companion/profile', auth(['companion']), companionEnhancedController.getProfile);
router.get('/companion/profile-detail', auth(['companion']), companionEnhancedController.getProfileDetail);
router.get('/companion/evaluations', auth(['companion']), companionEnhancedController.getEvaluationList);
router.get('/companion/statistics', auth(['companion']), companionEnhancedController.getStatistics);
router.get('/companion/orders/today', auth(['companion']), companionEnhancedController.getTodayOrders);
router.get('/companion/orders/:id', auth(['companion']), companionEnhancedController.getOrderDetail);
router.post('/companion/orders/:id/start', auth(['companion']), companionEnhancedController.startService);
router.post('/companion/orders/:id/complete', auth(['companion']), companionEnhancedController.completeService);
router.get('/companion/skills', auth(['companion']), companionEnhancedController.getSkills);
router.put('/companion/skills', auth(['companion']), companionEnhancedController.updateSkills);
router.get('/companion/trainings', auth(['companion']), companionEnhancedController.getTrainingList);
router.get('/companion/trainings/:id', auth(['companion']), companionEnhancedController.getTrainingDetail);
router.get('/companion/platform-rules', auth(['companion']), companionEnhancedController.getPlatformRules);
router.post('/companion/complaints', auth(['companion']), companionEnhancedController.createComplaint);
router.get('/companion/complaints', auth(['companion']), companionEnhancedController.getComplaintList);

router.get('/companion/:id', companionController.getCompanionDetail);

router.get('/admin/dashboard', auth(['admin']), adminController.getDashboardStats);

router.get('/admin/users', auth(['admin']), adminController.getUserList);
router.get('/admin/users/:id', auth(['admin']), adminController.getUserDetail);
router.post('/admin/users/:id/status', auth(['admin']), adminController.updateUserStatus);

router.get('/admin/companions', auth(['admin']), adminController.getCompanionList);
router.get('/admin/companions/:id', auth(['admin']), adminController.getCompanionDetail);
router.post('/admin/companions/:id/audit', auth(['admin']), adminController.auditCompanion);
router.post('/admin/verifications/:id/audit', auth(['admin']), adminController.auditVerification);
router.post('/admin/qualifications/:id/audit', auth(['admin']), adminController.auditQualification);
router.put('/admin/companion-services/:id', auth(['admin']), adminController.updateCompanionService);
router.put('/admin/companions/:id/rating', auth(['admin']), adminController.updateCompanionRating);
router.get('/admin/companion-statistics', auth(['admin']), adminController.getCompanionStatistics);

router.get('/admin/orders', auth(['admin']), adminController.getOrderList);
router.get('/admin/orders/:id', auth(['admin']), adminController.getOrderDetail);
router.get('/admin/orders/statistics', auth(['admin']), adminController.getOrderStatistics);
router.get('/admin/orders/export', auth(['admin']), adminController.exportOrders);

router.get('/admin/after-sales', auth(['admin']), adminController.getAfterSalesList);
router.post('/admin/after-sales/:id/handle', auth(['admin']), adminController.handleAfterSales);

router.get('/admin/banners', auth(['admin']), adminController.getBannerList);
router.post('/admin/banners', auth(['admin']), adminController.saveBanner);
router.delete('/admin/banners/:id', auth(['admin']), adminController.deleteBanner);

router.get('/admin/hospitals', auth(['admin']), adminController.getHospitalList);
router.post('/admin/hospitals', auth(['admin']), adminController.saveHospital);
router.delete('/admin/hospitals/:id', auth(['admin']), adminController.deleteHospital);

router.get('/admin/departments', auth(['admin']), adminController.getDepartmentList);
router.post('/admin/departments', auth(['admin']), adminController.saveDepartment);
router.delete('/admin/departments/:id', auth(['admin']), adminController.deleteDepartment);

router.get('/admin/coupons', auth(['admin']), adminController.getCouponList);
router.post('/admin/coupons', auth(['admin']), adminController.saveCoupon);
router.delete('/admin/coupons/:id', auth(['admin']), adminController.deleteCoupon);

router.get('/admin/services', auth(['admin']), adminController.getServiceList);
router.post('/admin/services', auth(['admin']), adminController.saveService);
router.delete('/admin/services/:id', auth(['admin']), adminController.deleteService);

router.get('/admin/cities', auth(['admin']), adminController.getCityList);
router.post('/admin/cities', auth(['admin']), adminController.saveCity);
router.delete('/admin/cities/:id', auth(['admin']), adminController.deleteCity);

router.get('/admin/faqs', auth(['admin']), adminController.getFaqList);
router.post('/admin/faqs', auth(['admin']), adminController.saveFaq);
router.delete('/admin/faqs/:id', auth(['admin']), adminController.deleteFaq);

router.get('/admin/settings', auth(['admin']), adminController.getSettings);
router.put('/admin/settings', auth(['admin']), adminController.updateSettings);

router.get('/admin/complaints', auth(['admin']), adminController.getComplaintList);
router.post('/admin/complaints/:id/handle', auth(['admin']), adminController.handleComplaint);

router.get('/admin/finance', auth(['admin']), adminController.getFinanceList);
router.get('/admin/finance/statistics', auth(['admin']), adminController.getFinanceStatistics);

router.get('/admin/withdraws', auth(['admin']), adminController.getWithdrawList);
router.post('/admin/withdraws/:id/handle', auth(['admin']), adminController.handleWithdraw);

router.get('/admin/invoices', auth(['admin']), adminController.getInvoiceList);
router.post('/admin/invoices/:id/handle', auth(['admin']), adminController.handleInvoice);

router.get('/admin/stats/user-growth', auth(['admin']), adminController.getUserGrowthStats);
router.get('/admin/stats/activity', auth(['admin']), adminController.getActivityStats);
router.get('/admin/stats/repurchase-rate', auth(['admin']), adminController.getRepurchaseRate);
router.get('/admin/users/statistics', auth(['admin']), adminController.getUserStatistics);
router.post('/admin/orders/:id/refund', auth(['admin']), adminController.processRefund);
router.get('/admin/finance/commission', auth(['admin']), adminController.getCommissionList);
router.get('/admin/companions/:id/performance', auth(['admin']), adminController.getCompanionPerformance);
router.get('/admin/disputes', auth(['admin']), adminController.getDisputeList);
router.get('/admin/finance/reconciliation', auth(['admin']), adminController.getReconciliationList);

module.exports = router;
