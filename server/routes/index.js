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
router.post('/auth/admin-login', authController.adminLogin);

router.get('/common/home-data', commonController.getHomeData);
router.get('/common/banners', commonController.getBanners);
router.get('/common/cities', commonController.getCityList);
router.get('/common/hospitals', commonController.getHospitalList);
router.get('/common/departments', commonController.getDepartmentList);
router.get('/common/service-types', commonController.getServiceTypes);
router.get('/common/time-slots', commonController.getTimeSlots);
router.get('/common/faqs', commonController.getFaqList);
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
router.get('/companion/:id', companionController.getCompanionDetail);

router.get('/companion/info', auth(['companion']), companionController.getCompanionInfo);
router.get('/companion/orders', auth(['companion']), companionController.getCompanionOrders);
router.post('/companion/orders/:id/accept', auth(['companion']), companionController.acceptOrder);
router.post('/companion/orders/:id/status', auth(['companion']), companionController.updateOrderStatus);
router.post('/companion/post-service', auth(['companion']), companionController.savePostService);
router.post('/companion/work-status', auth(['companion']), companionController.updateWorkStatus);

router.get('/admin/dashboard', auth(['admin']), adminController.getDashboardStats);

router.get('/admin/users', auth(['admin']), adminController.getUserList);
router.post('/admin/users/:id/status', auth(['admin']), adminController.updateUserStatus);

router.get('/admin/companions', auth(['admin']), adminController.getCompanionList);
router.post('/admin/companions/:id/audit', auth(['admin']), adminController.auditCompanion);

router.get('/admin/orders', auth(['admin']), adminController.getOrderList);

router.get('/admin/after-sales', auth(['admin']), adminController.getAfterSalesList);
router.post('/admin/after-sales/:id/handle', auth(['admin']), adminController.handleAfterSales);

router.get('/admin/banners', auth(['admin']), adminController.getBannerList);
router.post('/admin/banners', auth(['admin']), adminController.saveBanner);
router.delete('/admin/banners/:id', auth(['admin']), adminController.deleteBanner);

router.get('/admin/faqs', auth(['admin']), adminController.getFaqList);
router.post('/admin/faqs', auth(['admin']), adminController.saveFaq);
router.delete('/admin/faqs/:id', auth(['admin']), adminController.deleteFaq);

module.exports = router;
