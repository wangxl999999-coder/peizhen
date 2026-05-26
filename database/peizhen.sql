-- 陪诊服务平台数据库设计
-- MySQL 5.7+

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 用户表
-- ----------------------------
DROP TABLE IF EXISTS `pz_user`;
CREATE TABLE `pz_user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `openid` varchar(64) DEFAULT '' COMMENT '微信openid',
  `unionid` varchar(64) DEFAULT '' COMMENT '微信unionid',
  `nickname` varchar(64) DEFAULT '' COMMENT '昵称',
  `avatar` varchar(255) DEFAULT '' COMMENT '头像',
  `gender` tinyint(1) DEFAULT 0 COMMENT '性别 0未知 1男 2女',
  `phone` varchar(20) DEFAULT '' COMMENT '手机号',
  `real_name` varchar(32) DEFAULT '' COMMENT '真实姓名',
  `id_card` varchar(32) DEFAULT '' COMMENT '身份证号',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0禁用 1正常',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ----------------------------
-- 2. 陪诊师表
-- ----------------------------
DROP TABLE IF EXISTS `pz_companion`;
CREATE TABLE `pz_companion` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `openid` varchar(64) DEFAULT '' COMMENT '微信openid',
  `phone` varchar(20) DEFAULT '' COMMENT '手机号',
  `real_name` varchar(32) DEFAULT '' COMMENT '真实姓名',
  `avatar` varchar(255) DEFAULT '' COMMENT '头像',
  `gender` tinyint(1) DEFAULT 0 COMMENT '性别 1男 2女',
  `age` int(3) DEFAULT 0 COMMENT '年龄',
  `id_card` varchar(32) DEFAULT '' COMMENT '身份证号',
  `qualification` varchar(255) DEFAULT '' COMMENT '资质证书',
  `qualification_no` varchar(64) DEFAULT '' COMMENT '资质编号',
  `experience` int(3) DEFAULT 0 COMMENT '从业年限',
  `city` varchar(32) DEFAULT '' COMMENT '服务城市',
  `address` varchar(255) DEFAULT '' COMMENT '详细地址',
  `latitude` decimal(10,6) DEFAULT 0 COMMENT '纬度',
  `longitude` decimal(10,6) DEFAULT 0 COMMENT '经度',
  `rating` decimal(3,2) DEFAULT 5.00 COMMENT '评分 1-5',
  `order_count` int(10) DEFAULT 0 COMMENT '完成订单数',
  `good_rate` decimal(5,2) DEFAULT 100.00 COMMENT '好评率',
  `intro` text COMMENT '个人简介',
  `skills` varchar(255) DEFAULT '' COMMENT '擅长技能',
  `status` tinyint(1) DEFAULT 0 COMMENT '状态 0待审核 1已审核 2已禁用',
  `online_status` tinyint(1) DEFAULT 0 COMMENT '在线状态 0离线 1在线 2忙碌',
  `work_status` tinyint(1) DEFAULT 1 COMMENT '工作状态 0休息 1接单中',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_city` (`city`),
  KEY `idx_rating` (`rating`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陪诊师表';

-- ----------------------------
-- 3. 陪诊师服务案例表
-- ----------------------------
DROP TABLE IF EXISTS `pz_companion_case`;
CREATE TABLE `pz_companion_case` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `title` varchar(100) DEFAULT '' COMMENT '案例标题',
  `content` text COMMENT '案例描述',
  `images` varchar(500) DEFAULT '' COMMENT '案例图片 逗号分隔',
  `service_type` varchar(32) DEFAULT '' COMMENT '服务类型',
  `case_date` date DEFAULT NULL COMMENT '服务日期',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_companion_id` (`companion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陪诊师服务案例表';

-- ----------------------------
-- 4. 就诊人表
-- ----------------------------
DROP TABLE IF EXISTS `pz_patient`;
CREATE TABLE `pz_patient` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) DEFAULT 0 COMMENT '用户ID',
  `name` varchar(32) DEFAULT '' COMMENT '就诊人姓名',
  `gender` tinyint(1) DEFAULT 0 COMMENT '性别 1男 2女',
  `age` int(3) DEFAULT 0 COMMENT '年龄',
  `id_card` varchar(32) DEFAULT '' COMMENT '身份证号',
  `phone` varchar(20) DEFAULT '' COMMENT '联系电话',
  `relation` varchar(16) DEFAULT '' COMMENT '与本人关系 本人 父母 子女 配偶 其他',
  `medical_card` varchar(64) DEFAULT '' COMMENT '医保卡/就诊卡号',
  `allergy` varchar(255) DEFAULT '' COMMENT '过敏史',
  `medical_history` varchar(500) DEFAULT '' COMMENT '病史',
  `is_default` tinyint(1) DEFAULT 0 COMMENT '是否默认 0否 1是',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='就诊人表';

-- ----------------------------
-- 5. 城市表
-- ----------------------------
DROP TABLE IF EXISTS `pz_city`;
CREATE TABLE `pz_city` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(32) DEFAULT '' COMMENT '城市名称',
  `province` varchar(32) DEFAULT '' COMMENT '省份',
  `pinyin` varchar(64) DEFAULT '' COMMENT '拼音',
  `hot` tinyint(1) DEFAULT 0 COMMENT '是否热门 0否 1是',
  `sort` int(10) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0禁用 1启用',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='城市表';

-- ----------------------------
-- 6. 医院表
-- ----------------------------
DROP TABLE IF EXISTS `pz_hospital`;
CREATE TABLE `pz_hospital` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(100) DEFAULT '' COMMENT '医院名称',
  `city_id` int(11) DEFAULT 0 COMMENT '城市ID',
  `city` varchar(32) DEFAULT '' COMMENT '城市',
  `level` varchar(16) DEFAULT '' COMMENT '医院等级 三甲 三乙 二甲 二乙 其他',
  `address` varchar(255) DEFAULT '' COMMENT '地址',
  `latitude` decimal(10,6) DEFAULT 0 COMMENT '纬度',
  `longitude` decimal(10,6) DEFAULT 0 COMMENT '经度',
  `phone` varchar(20) DEFAULT '' COMMENT '联系电话',
  `intro` text COMMENT '医院简介',
  `image` varchar(255) DEFAULT '' COMMENT '医院图片',
  `sort` int(10) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0禁用 1启用',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_city_id` (`city_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医院表';

-- ----------------------------
-- 7. 科室表
-- ----------------------------
DROP TABLE IF EXISTS `pz_department`;
CREATE TABLE `pz_department` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(32) DEFAULT '' COMMENT '科室名称',
  `parent_id` int(11) DEFAULT 0 COMMENT '父科室ID',
  `icon` varchar(255) DEFAULT '' COMMENT '图标',
  `sort` int(10) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0禁用 1启用',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='科室表';

-- ----------------------------
-- 8. 服务类型表
-- ----------------------------
DROP TABLE IF EXISTS `pz_service_type`;
CREATE TABLE `pz_service_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `type` varchar(32) DEFAULT '' COMMENT '服务类型标识',
  `name` varchar(32) DEFAULT '' COMMENT '服务名称',
  `icon` varchar(255) DEFAULT '' COMMENT '图标',
  `base_price` decimal(10,2) DEFAULT 0 COMMENT '基础价格',
  `unit` varchar(16) DEFAULT '次' COMMENT '计价单位',
  `urgent_fee` decimal(10,2) DEFAULT 0 COMMENT '加急费用',
  `night_fee` decimal(10,2) DEFAULT 0 COMMENT '夜间费用',
  `remote_fee` decimal(10,2) DEFAULT 0 COMMENT '异地费用',
  `night_start` varchar(8) DEFAULT '18:00' COMMENT '夜间开始时间',
  `night_end` varchar(8) DEFAULT '08:00' COMMENT '夜间结束时间',
  `description` varchar(255) DEFAULT '' COMMENT '服务描述',
  `sort` int(10) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0禁用 1启用',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务类型表';

-- ----------------------------
-- 9. 订单表
-- ----------------------------
DROP TABLE IF EXISTS `pz_order`;
CREATE TABLE `pz_order` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_no` varchar(32) DEFAULT '' COMMENT '订单编号',
  `user_id` bigint(20) DEFAULT 0 COMMENT '用户ID',
  `patient_id` bigint(20) DEFAULT 0 COMMENT '就诊人ID',
  `patient_info` text COMMENT '就诊人信息快照JSON',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `companion_info` text COMMENT '陪诊师信息快照JSON',
  `service_type` varchar(32) DEFAULT '' COMMENT '服务类型',
  `service_name` varchar(32) DEFAULT '' COMMENT '服务名称',
  `city_id` int(11) DEFAULT 0 COMMENT '城市ID',
  `city` varchar(32) DEFAULT '' COMMENT '城市',
  `hospital_id` bigint(20) DEFAULT 0 COMMENT '医院ID',
  `hospital_name` varchar(100) DEFAULT '' COMMENT '医院名称',
  `hospital_address` varchar(255) DEFAULT '' COMMENT '医院地址',
  `department_id` int(11) DEFAULT 0 COMMENT '科室ID',
  `department_name` varchar(32) DEFAULT '' COMMENT '科室名称',
  `service_date` date DEFAULT NULL COMMENT '服务日期',
  `time_slot` varchar(32) DEFAULT '' COMMENT '时间段',
  `is_urgent` tinyint(1) DEFAULT 0 COMMENT '是否加急 0否 1是',
  `is_night` tinyint(1) DEFAULT 0 COMMENT '是否夜间 0否 1是',
  `is_remote` tinyint(1) DEFAULT 0 COMMENT '是否异地 0否 1是',
  `base_price` decimal(10,2) DEFAULT 0 COMMENT '基础价格',
  `urgent_fee` decimal(10,2) DEFAULT 0 COMMENT '加急费',
  `night_fee` decimal(10,2) DEFAULT 0 COMMENT '夜间费',
  `remote_fee` decimal(10,2) DEFAULT 0 COMMENT '异地费',
  `total_price` decimal(10,2) DEFAULT 0 COMMENT '总价',
  `paid_price` decimal(10,2) DEFAULT 0 COMMENT '实付金额',
  `refund_price` decimal(10,2) DEFAULT 0 COMMENT '退款金额',
  `symptom` text COMMENT '病情描述',
  `special_req` varchar(500) DEFAULT '' COMMENT '特殊需求',
  `status` varchar(32) DEFAULT 'pending_accept' COMMENT '订单状态 pending_accept待接单 pending_service待服务 in_service服务中 pending_evaluation待评价 completed已完成 cancelled已取消',
  `accept_time` datetime DEFAULT NULL COMMENT '接单时间',
  `arrive_time` datetime DEFAULT NULL COMMENT '到达时间',
  `start_time` datetime DEFAULT NULL COMMENT '服务开始时间',
  `complete_time` datetime DEFAULT NULL COMMENT '服务完成时间',
  `cancel_time` datetime DEFAULT NULL COMMENT '取消时间',
  `cancel_reason` varchar(255) DEFAULT '' COMMENT '取消原因',
  `cancel_by` varchar(16) DEFAULT '' COMMENT '取消方 user companion system',
  `paid_time` datetime DEFAULT NULL COMMENT '支付时间',
  `pay_type` varchar(16) DEFAULT '' COMMENT '支付方式 wechat alipay',
  `transaction_id` varchar(64) DEFAULT '' COMMENT '支付交易号',
  `reschedule_count` int(2) DEFAULT 0 COMMENT '改期次数',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_companion_id` (`companion_id`),
  KEY `idx_status` (`status`),
  KEY `idx_service_date` (`service_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- ----------------------------
-- 10. 订单改期记录表
-- ----------------------------
DROP TABLE IF EXISTS `pz_order_reschedule`;
CREATE TABLE `pz_order_reschedule` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` bigint(20) DEFAULT 0 COMMENT '订单ID',
  `old_date` date DEFAULT NULL COMMENT '原服务日期',
  `old_time_slot` varchar(32) DEFAULT '' COMMENT '原时间段',
  `new_date` date DEFAULT NULL COMMENT '新服务日期',
  `new_time_slot` varchar(32) DEFAULT '' COMMENT '新时间段',
  `reason` varchar(255) DEFAULT '' COMMENT '改期原因',
  `operator_type` varchar(16) DEFAULT '' COMMENT '操作人类型 user companion admin',
  `operator_id` bigint(20) DEFAULT 0 COMMENT '操作人ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单改期记录表';

-- ----------------------------
-- 11. 评价表
-- ----------------------------
DROP TABLE IF EXISTS `pz_evaluation`;
CREATE TABLE `pz_evaluation` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` bigint(20) DEFAULT 0 COMMENT '订单ID',
  `user_id` bigint(20) DEFAULT 0 COMMENT '用户ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `rating` tinyint(1) DEFAULT 5 COMMENT '评分 1-5',
  `content` text COMMENT '评价内容',
  `images` varchar(500) DEFAULT '' COMMENT '评价图片 逗号分隔',
  `tags` varchar(255) DEFAULT '' COMMENT '评价标签 逗号分隔',
  `is_anonymous` tinyint(1) DEFAULT 0 COMMENT '是否匿名 0否 1是',
  `reply_content` text COMMENT '陪诊师回复',
  `reply_time` datetime DEFAULT NULL COMMENT '回复时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_companion_id` (`companion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价表';

-- ----------------------------
-- 12. 诊后服务表
-- ----------------------------
DROP TABLE IF EXISTS `pz_post_service`;
CREATE TABLE `pz_post_service` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` bigint(20) DEFAULT 0 COMMENT '订单ID',
  `user_id` bigint(20) DEFAULT 0 COMMENT '用户ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `medical_advice` text COMMENT '医嘱',
  `medication_list` text COMMENT '用药清单JSON',
  `recheck_time` datetime DEFAULT NULL COMMENT '复诊时间',
  `notes` varchar(500) DEFAULT '' COMMENT '备注',
  `images` varchar(500) DEFAULT '' COMMENT '相关图片',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='诊后服务表';

-- ----------------------------
-- 13. 售后表
-- ----------------------------
DROP TABLE IF EXISTS `pz_after_sales`;
CREATE TABLE `pz_after_sales` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` bigint(20) DEFAULT 0 COMMENT '订单ID',
  `user_id` bigint(20) DEFAULT 0 COMMENT '用户ID',
  `type` varchar(16) DEFAULT '' COMMENT '售后类型 refund退款 complaint投诉',
  `reason` varchar(255) DEFAULT '' COMMENT '原因',
  `description` text COMMENT '详细描述',
  `images` varchar(500) DEFAULT '' COMMENT '凭证图片',
  `refund_amount` decimal(10,2) DEFAULT 0 COMMENT '申请退款金额',
  `status` varchar(16) DEFAULT 'pending' COMMENT '状态 pending待处理 processing处理中 completed已完成 rejected已拒绝',
  `handle_result` text COMMENT '处理结果',
  `handle_time` datetime DEFAULT NULL COMMENT '处理时间',
  `handler_id` bigint(20) DEFAULT 0 COMMENT '处理人ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后表';

-- ----------------------------
-- 14. 聊天消息表
-- ----------------------------
DROP TABLE IF EXISTS `pz_chat_message`;
CREATE TABLE `pz_chat_message` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` bigint(20) DEFAULT 0 COMMENT '订单ID',
  `sender_type` varchar(16) DEFAULT '' COMMENT '发送方 user companion system',
  `sender_id` bigint(20) DEFAULT 0 COMMENT '发送者ID',
  `receiver_type` varchar(16) DEFAULT '' COMMENT '接收方',
  `receiver_id` bigint(20) DEFAULT 0 COMMENT '接收者ID',
  `msg_type` varchar(16) DEFAULT 'text' COMMENT '消息类型 text image voice location',
  `content` text COMMENT '消息内容',
  `is_read` tinyint(1) DEFAULT 0 COMMENT '是否已读 0否 1是',
  `read_time` datetime DEFAULT NULL COMMENT '阅读时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_sender_receiver` (`sender_id`,`receiver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天消息表';

-- ----------------------------
-- 15. Banner表
-- ----------------------------
DROP TABLE IF EXISTS `pz_banner`;
CREATE TABLE `pz_banner` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(64) DEFAULT '' COMMENT '标题',
  `image` varchar(255) DEFAULT '' COMMENT '图片',
  `link_type` varchar(16) DEFAULT '' COMMENT '链接类型 page service hospital none',
  `link_value` varchar(255) DEFAULT '' COMMENT '链接值',
  `position` varchar(16) DEFAULT 'home' COMMENT '位置 home首页',
  `sort` int(10) DEFAULT 0 COMMENT '排序',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0禁用 1启用',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Banner表';

-- ----------------------------
-- 16. 常见问题表
-- ----------------------------
DROP TABLE IF EXISTS `pz_faq`;
CREATE TABLE `pz_faq` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `question` varchar(255) DEFAULT '' COMMENT '问题',
  `answer` text COMMENT '答案',
  `category` varchar(32) DEFAULT '' COMMENT '分类',
  `sort` int(10) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0禁用 1启用',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='常见问题表';

-- ----------------------------
-- 17. 管理员表
-- ----------------------------
DROP TABLE IF EXISTS `pz_admin`;
CREATE TABLE `pz_admin` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `username` varchar(32) DEFAULT '' COMMENT '用户名',
  `password` varchar(64) DEFAULT '' COMMENT '密码',
  `real_name` varchar(32) DEFAULT '' COMMENT '真实姓名',
  `phone` varchar(20) DEFAULT '' COMMENT '手机号',
  `role` varchar(16) DEFAULT 'admin' COMMENT '角色 admin超级管理员 operator运营',
  `avatar` varchar(255) DEFAULT '' COMMENT '头像',
  `last_login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(32) DEFAULT '' COMMENT '最后登录IP',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0禁用 1启用',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- ----------------------------
-- 18. 服务时间段表
-- ----------------------------
DROP TABLE IF EXISTS `pz_time_slot`;
CREATE TABLE `pz_time_slot` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `start_time` varchar(8) DEFAULT '' COMMENT '开始时间',
  `end_time` varchar(8) DEFAULT '' COMMENT '结束时间',
  `name` varchar(16) DEFAULT '' COMMENT '名称 上午 下午 夜间',
  `is_night` tinyint(1) DEFAULT 0 COMMENT '是否夜间 0否 1是',
  `sort` int(10) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0禁用 1启用',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务时间段表';

-- ----------------------------
-- 19. 陪诊师实名认证表
-- ----------------------------
DROP TABLE IF EXISTS `pz_companion_verification`;
CREATE TABLE `pz_companion_verification` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `real_name` varchar(32) DEFAULT '' COMMENT '真实姓名',
  `id_card` varchar(32) DEFAULT '' COMMENT '身份证号',
  `id_card_front` varchar(255) DEFAULT '' COMMENT '身份证正面照',
  `id_card_back` varchar(255) DEFAULT '' COMMENT '身份证反面照',
  `face_photo` varchar(255) DEFAULT '' COMMENT '人脸识别照片',
  `verification_status` tinyint(1) DEFAULT 0 COMMENT '认证状态 0待审核 1已通过 2已拒绝',
  `verification_time` datetime DEFAULT NULL COMMENT '审核时间',
  `verification_remark` varchar(255) DEFAULT '' COMMENT '审核备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_companion_id` (`companion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陪诊师实名认证表';

-- ----------------------------
-- 20. 陪诊师资质表
-- ----------------------------
DROP TABLE IF EXISTS `pz_companion_qualification`;
CREATE TABLE `pz_companion_qualification` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `type` varchar(32) DEFAULT '' COMMENT '资质类型 health_cert健康证 training_cert培训证 nurse_license护士证 doctor_license医师证 other其他',
  `type_name` varchar(32) DEFAULT '' COMMENT '资质名称',
  `cert_no` varchar(64) DEFAULT '' COMMENT '证件编号',
  `issue_date` date DEFAULT NULL COMMENT '发证日期',
  `expire_date` date DEFAULT NULL COMMENT '有效期至',
  `images` varchar(500) DEFAULT '' COMMENT '证件照片 逗号分隔',
  `status` tinyint(1) DEFAULT 0 COMMENT '状态 0待审核 1已通过 2已拒绝',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  `audit_remark` varchar(255) DEFAULT '' COMMENT '审核备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_companion_id` (`companion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陪诊师资质表';

-- ----------------------------
-- 21. 陪诊师服务设置表
-- ----------------------------
DROP TABLE IF EXISTS `pz_companion_service`;
CREATE TABLE `pz_companion_service` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `service_type` varchar(32) DEFAULT '' COMMENT '服务类型',
  `service_name` varchar(32) DEFAULT '' COMMENT '服务名称',
  `base_price` decimal(10,2) DEFAULT 0 COMMENT '基础价格',
  `custom_price` decimal(10,2) DEFAULT 0 COMMENT '自定义价格',
  `is_enabled` tinyint(1) DEFAULT 1 COMMENT '是否启用 0否 1是',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_companion_id` (`companion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陪诊师服务设置表';

-- ----------------------------
-- 22. 陪诊师服务城市表
-- ----------------------------
DROP TABLE IF EXISTS `pz_companion_city`;
CREATE TABLE `pz_companion_city` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `city_id` int(11) DEFAULT 0 COMMENT '城市ID',
  `city_name` varchar(32) DEFAULT '' COMMENT '城市名称',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_companion_id` (`companion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陪诊师服务城市表';

-- ----------------------------
-- 23. 陪诊师服务医院表
-- ----------------------------
DROP TABLE IF EXISTS `pz_companion_hospital`;
CREATE TABLE `pz_companion_hospital` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `hospital_id` bigint(20) DEFAULT 0 COMMENT '医院ID',
  `hospital_name` varchar(100) DEFAULT '' COMMENT '医院名称',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_companion_id` (`companion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陪诊师服务医院表';

-- ----------------------------
-- 24. 陪诊师服务科室表
-- ----------------------------
DROP TABLE IF EXISTS `pz_companion_department`;
CREATE TABLE `pz_companion_department` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `department_id` int(11) DEFAULT 0 COMMENT '科室ID',
  `department_name` varchar(32) DEFAULT '' COMMENT '科室名称',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_companion_id` (`companion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陪诊师服务科室表';

-- ----------------------------
-- 25. 陪诊师工作时间表
-- ----------------------------
DROP TABLE IF EXISTS `pz_companion_work_time`;
CREATE TABLE `pz_companion_work_time` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `day_of_week` tinyint(1) DEFAULT 0 COMMENT '星期几 0周日 1周一 ... 6周六',
  `time_slot_id` int(11) DEFAULT 0 COMMENT '时间段ID',
  `start_time` varchar(8) DEFAULT '' COMMENT '开始时间',
  `end_time` varchar(8) DEFAULT '' COMMENT '结束时间',
  `is_enabled` tinyint(1) DEFAULT 1 COMMENT '是否启用 0否 1是',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_companion_id` (`companion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='陪诊师工作时间表';

-- ----------------------------
-- 26. 订单打卡记录表
-- ----------------------------
DROP TABLE IF EXISTS `pz_order_checkin`;
CREATE TABLE `pz_order_checkin` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` bigint(20) DEFAULT 0 COMMENT '订单ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `type` varchar(16) DEFAULT '' COMMENT '打卡类型 arrive到达医院 start开始服务 complete结束服务',
  `latitude` decimal(10,6) DEFAULT 0 COMMENT '纬度',
  `longitude` decimal(10,6) DEFAULT 0 COMMENT '经度',
  `address` varchar(255) DEFAULT '' COMMENT '地址',
  `photo` varchar(255) DEFAULT '' COMMENT '打卡照片',
  `remark` varchar(255) DEFAULT '' COMMENT '备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单打卡记录表';

-- ----------------------------
-- 27. 订单就诊节点表
-- ----------------------------
DROP TABLE IF EXISTS `pz_order_node`;
CREATE TABLE `pz_order_node` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` bigint(20) DEFAULT 0 COMMENT '订单ID',
  `node_type` varchar(32) DEFAULT '' COMMENT '节点类型 registered已挂号 waiting等待叫号 in_diagnosis就诊中 examination检查中 medication取药中 completed已完成',
  `node_name` varchar(32) DEFAULT '' COMMENT '节点名称',
  `remark` varchar(500) DEFAULT '' COMMENT '备注',
  `images` varchar(500) DEFAULT '' COMMENT '相关图片 逗号分隔',
  `operator_id` bigint(20) DEFAULT 0 COMMENT '操作人ID',
  `operator_type` varchar(16) DEFAULT 'companion' COMMENT '操作人类型 companion用户',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单就诊节点表';

-- ----------------------------
-- 28. 订单服务资料表
-- ----------------------------
DROP TABLE IF EXISTS `pz_order_service_file`;
CREATE TABLE `pz_order_service_file` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` bigint(20) DEFAULT 0 COMMENT '订单ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `file_type` varchar(32) DEFAULT '' COMMENT '文件类型 examination检查单 prescription处方单 receipt缴费单 other其他',
  `file_name` varchar(100) DEFAULT '' COMMENT '文件名称',
  `file_url` varchar(255) DEFAULT '' COMMENT '文件地址',
  `remark` varchar(255) DEFAULT '' COMMENT '备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单服务资料表';

-- ----------------------------
-- 29. 收入明细表
-- ----------------------------
DROP TABLE IF EXISTS `pz_income`;
CREATE TABLE `pz_income` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `order_id` bigint(20) DEFAULT 0 COMMENT '订单ID',
  `order_no` varchar(32) DEFAULT '' COMMENT '订单编号',
  `type` varchar(16) DEFAULT 'order' COMMENT '收入类型 order订单收入 refund退款 withdraw提现',
  `amount` decimal(10,2) DEFAULT 0 COMMENT '金额',
  `platform_fee` decimal(10,2) DEFAULT 0 COMMENT '平台分成',
  `service_fee` decimal(10,2) DEFAULT 0 COMMENT '手续费',
  `actual_amount` decimal(10,2) DEFAULT 0 COMMENT '实际到账',
  `remark` varchar(255) DEFAULT '' COMMENT '备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_companion_id` (`companion_id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收入明细表';

-- ----------------------------
-- 30. 提现表
-- ----------------------------
DROP TABLE IF EXISTS `pz_withdraw`;
CREATE TABLE `pz_withdraw` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `withdraw_no` varchar(32) DEFAULT '' COMMENT '提现单号',
  `amount` decimal(10,2) DEFAULT 0 COMMENT '提现金额',
  `service_fee` decimal(10,2) DEFAULT 0 COMMENT '手续费',
  `actual_amount` decimal(10,2) DEFAULT 0 COMMENT '实际到账',
  `pay_type` varchar(16) DEFAULT 'wechat' COMMENT '提现方式 wechat微信 alipay支付宝 bank银行卡',
  `account_name` varchar(64) DEFAULT '' COMMENT '账户姓名',
  `account_no` varchar(64) DEFAULT '' COMMENT '账号',
  `status` varchar(16) DEFAULT 'pending' COMMENT '状态 pending待处理 processing处理中 success成功 failed失败',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  `pay_time` datetime DEFAULT NULL COMMENT '打款时间',
  `remark` varchar(255) DEFAULT '' COMMENT '备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_withdraw_no` (`withdraw_no`),
  KEY `idx_companion_id` (`companion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现表';

-- ----------------------------
-- 31. 培训资料表
-- ----------------------------
DROP TABLE IF EXISTS `pz_training`;
CREATE TABLE `pz_training` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(100) DEFAULT '' COMMENT '标题',
  `category` varchar(32) DEFAULT '' COMMENT '分类 knowledge专业知识 process服务流程 skill服务技巧 safety安全规范',
  `content` text COMMENT '内容',
  `cover_image` varchar(255) DEFAULT '' COMMENT '封面图',
  `file_url` varchar(255) DEFAULT '' COMMENT '附件地址',
  `view_count` int(10) DEFAULT 0 COMMENT '浏览次数',
  `sort` int(10) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0禁用 1启用',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='培训资料表';

-- ----------------------------
-- 32. 平台规则表
-- ----------------------------
DROP TABLE IF EXISTS `pz_platform_rule`;
CREATE TABLE `pz_platform_rule` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(100) DEFAULT '' COMMENT '标题',
  `type` varchar(32) DEFAULT '' COMMENT '类型 agreement协议 rule规则 notice公告',
  `content` text COMMENT '内容',
  `version` varchar(32) DEFAULT '' COMMENT '版本号',
  `sort` int(10) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 0禁用 1启用',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='平台规则表';

-- ----------------------------
-- 33. 投诉建议表
-- ----------------------------
DROP TABLE IF EXISTS `pz_complaint`;
CREATE TABLE `pz_complaint` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint(20) DEFAULT 0 COMMENT '用户ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `type` varchar(16) DEFAULT 'suggestion' COMMENT '类型 complaint投诉 suggestion建议',
  `order_id` bigint(20) DEFAULT 0 COMMENT '关联订单ID',
  `title` varchar(100) DEFAULT '' COMMENT '标题',
  `content` text COMMENT '内容',
  `images` varchar(500) DEFAULT '' COMMENT '图片 逗号分隔',
  `contact` varchar(64) DEFAULT '' COMMENT '联系方式',
  `status` varchar(16) DEFAULT 'pending' COMMENT '状态 pending待处理 processing处理中 completed已完成',
  `handle_result` text COMMENT '处理结果',
  `handle_time` datetime DEFAULT NULL COMMENT '处理时间',
  `handler_id` int(11) DEFAULT 0 COMMENT '处理人ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_companion_id` (`companion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投诉建议表';

-- ----------------------------
-- 34. 订单抢单表
-- ----------------------------
DROP TABLE IF EXISTS `pz_order_grab`;
CREATE TABLE `pz_order_grab` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` bigint(20) DEFAULT 0 COMMENT '订单ID',
  `companion_id` bigint(20) DEFAULT 0 COMMENT '陪诊师ID',
  `grab_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '抢单时间',
  `is_success` tinyint(1) DEFAULT 0 COMMENT '是否成功 0否 1是',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_companion_id` (`companion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单抢单表';

-- ----------------------------
-- 初始化数据
-- ----------------------------

-- 管理员账号 admin/123456
INSERT INTO `pz_admin` (`username`, `password`, `real_name`, `phone`, `role`) VALUES
('admin', 'e10adc3949ba59abbe56e057f20f883e', '超级管理员', '13800138000', 'admin');

-- 服务类型
INSERT INTO `pz_service_type` (`type`, `name`, `icon`, `base_price`, `unit`, `urgent_fee`, `night_fee`, `remote_fee`, `description`, `sort`) VALUES
('full_accompany', '全程陪诊', '/icons/full.png', 199.00, '次', 100.00, 50.00, 150.00, '全程陪同就医，包括挂号、取号、排队、缴费、取药等', 1),
('register', '代挂号', '/icons/register.png', 59.00, '次', 30.00, 20.00, 50.00, '代替用户排队挂号', 2),
('get_medicine', '代取药', '/icons/medicine.png', 39.00, '次', 20.00, 15.00, 30.00, '代替用户到医院取药', 3),
('get_report', '代取报告', '/icons/report.png', 39.00, '次', 20.00, 15.00, 30.00, '代替用户到医院取检查报告', 4),
('consultation', '代问诊', '/icons/consult.png', 129.00, '次', 50.00, 30.00, 80.00, '代替用户向医生咨询病情', 5),
('hospital_accompany', '住院陪诊', '/icons/hospital.png', 299.00, '天', 150.00, 80.00, 200.00, '住院期间全程陪护', 6),
('postoperative', '术后陪诊', '/icons/postop.png', 249.00, '次', 120.00, 60.00, 180.00, '手术后复诊陪同', 7),
('prenatal', '产检陪诊', '/icons/prenatal.png', 179.00, '次', 90.00, 45.00, 130.00, '孕妇产检全程陪同', 8);

-- 时间段
INSERT INTO `pz_time_slot` (`start_time`, `end_time`, `name`, `is_night`, `sort`) VALUES
('08:00', '10:00', '上午早段', 0, 1),
('10:00', '12:00', '上午', 0, 2),
('12:00', '14:00', '中午', 0, 3),
('14:00', '16:00', '下午早段', 0, 4),
('16:00', '18:00', '下午', 0, 5),
('18:00', '20:00', '傍晚', 1, 6),
('20:00', '22:00', '夜间', 1, 7),
('22:00', '08:00', '深夜', 1, 8);

-- 科室
INSERT INTO `pz_department` (`name`, `parent_id`, `sort`) VALUES
('内科', 0, 1),
('外科', 0, 2),
('儿科', 0, 3),
('妇产科', 0, 4),
('骨科', 0, 5),
('眼科', 0, 6),
('耳鼻喉科', 0, 7),
('口腔科', 0, 8),
('皮肤科', 0, 9),
('神经内科', 0, 10),
('心血管内科', 0, 11),
('呼吸内科', 0, 12),
('消化内科', 0, 13),
('内分泌科', 0, 14),
('肿瘤科', 0, 15),
('中医科', 0, 16),
('康复科', 0, 17),
('急诊科', 0, 18);

-- 热门城市
INSERT INTO `pz_city` (`name`, `province`, `pinyin`, `hot`, `sort`) VALUES
('北京', '北京市', 'beijing', 1, 1),
('上海', '上海市', 'shanghai', 1, 2),
('广州', '广东省', 'guangzhou', 1, 3),
('深圳', '广东省', 'shenzhen', 1, 4),
('杭州', '浙江省', 'hangzhou', 1, 5),
('南京', '江苏省', 'nanjing', 1, 6),
('成都', '四川省', 'chengdu', 1, 7),
('武汉', '湖北省', 'wuhan', 1, 8),
('西安', '陕西省', 'xian', 0, 9),
('重庆', '重庆市', 'chongqing', 0, 10),
('天津', '天津市', 'tianjin', 0, 11),
('苏州', '江苏省', 'suzhou', 0, 12);

-- 常见问题
INSERT INTO `pz_faq` (`question`, `answer`, `category`, `sort`) VALUES
('如何预约陪诊服务？', '您可以在首页选择需要的服务类型，然后选择城市、医院、科室、服务时间和陪诊师，填写就诊人信息后提交订单并支付即可。', '预约相关', 1),
('可以取消订单吗？', '在服务开始前2小时可以免费取消，退款将在1-3个工作日内原路返回。2小时内取消将收取30%的违约金。', '取消改期', 2),
('如何改期？', '在订单详情页点击"改期"按钮，选择新的服务日期和时间段即可。每张订单最多可改期2次。', '取消改期', 3),
('陪诊师都是什么资质？', '我们的陪诊师都经过严格的资质审核，包括医学背景、从业经验、服务意识等多方面考核，并持有相关资质证书。', '陪诊师', 4),
('服务过程中出现问题怎么办？', '您可以通过订单详情页的"联系客服"或"投诉"按钮反馈问题，我们会有专人及时处理。', '售后', 5),
('如何申请退款？', '在订单详情页点击"申请售后"，选择退款类型并填写原因提交，工作人员会在1-3个工作日内处理。', '售后', 6);

-- Banner
INSERT INTO `pz_banner` (`title`, `image`, `link_type`, `link_value`, `sort`) VALUES
('新用户首单立减50元', '/banners/banner1.png', 'none', '', 1),
('专业陪诊 暖心服务', '/banners/banner2.png', 'service', 'full_accompany', 2),
('限时特惠 住院陪诊8折', '/banners/banner3.png', 'service', 'hospital_accompany', 3);

-- 示例医院
INSERT INTO `pz_hospital` (`name`, `city_id`, `city`, `level`, `address`, `sort`) VALUES
('北京协和医院', 1, '北京', '三甲', '北京市东城区帅府园一号', 1),
('中国人民解放军总医院', 1, '北京', '三甲', '北京市海淀区复兴路28号', 2),
('北京天坛医院', 1, '北京', '三甲', '北京市丰台区南四环西路119号', 3),
('上海瑞金医院', 2, '上海', '三甲', '上海市黄浦区瑞金二路197号', 1),
('复旦大学附属中山医院', 2, '上海', '三甲', '上海市徐汇区枫林路180号', 2),
('广州中山一院', 3, '广州', '三甲', '广州市越秀区中山二路58号', 1),
('广东省人民医院', 3, '广州', '三甲', '广州市越秀区中山二路106号', 2),
('深圳北大医院', 4, '深圳', '三甲', '深圳市福田区莲花路1120号', 1),
('浙江大学医学院附属第一医院', 5, '杭州', '三甲', '杭州市上城区庆春路79号', 1);

-- 示例陪诊师
INSERT INTO `pz_companion` (`openid`, `phone`, `real_name`, `avatar`, `gender`, `age`, `id_card`, `qualification`, `qualification_no`, `experience`, `city`, `address`, `rating`, `order_count`, `good_rate`, `intro`, `skills`, `status`, `online_status`, `work_status`) VALUES
('test_companion_001', '13800138001', '张护士', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20nurse%20portrait%20friendly%20smile%20medical%20uniform&image_size=square', 2, 32, '110101199001011234', '护士执业证书', '201511001234', 8, '北京', '北京市朝阳区建国路88号', 4.9, 156, 98.5, '从事护理工作8年，有丰富的临床陪护经验，熟悉北京各大医院就诊流程，性格开朗有耐心，善于沟通。', '内科陪护,术后护理,老年陪护', 1, 1, 1),
('test_companion_002', '13800138002', '李医生', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20male%20doctor%20portrait%20friendly%20smile%20white%20coat&image_size=square', 1, 35, '110101198805055678', '医师资格证书', '201211005678', 10, '北京', '北京市海淀区中关村大街1号', 4.8, 203, 97.8, '临床医学专业，曾在三甲医院工作多年，熟悉各类疾病就诊流程，专业细心，服务至上。', '专业问诊,就医指导,报告解读', 1, 1, 1),
('test_companion_003', '13800138003', '王陪诊', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20healthcare%20worker%20portrait%20warm%20smile%20business%20attire&image_size=square', 2, 28, '110101199503039012', '健康管理师', '201811009012', 5, '上海', '上海市浦东新区陆家嘴金融中心', 4.95, 89, 99.2, '健康管理专业毕业，专注陪诊服务5年，熟悉上海各大医院，服务细致周到，深受客户好评。', '全程陪诊,住院陪护,产检陪诊', 1, 1, 1),
('test_companion_004', '13800138004', '陈护师', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20male%20nurse%20portrait%20confident%20friendly%20medical%20uniform&image_size=square', 1, 30, '310101199307073456', '护士执业证书', '201631003456', 7, '上海', '上海市静安区南京西路1266号', 4.7, 124, 96.5, '七年临床护理经验，擅长急诊和术后陪护，应变能力强，能处理各种突发状况。', '急诊陪护,术后护理,康复陪护', 1, 1, 1),
('test_companion_005', '13800138005', '刘女士', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20medical%20escort%20portrait%20caring%20expression%20smart%20casual&image_size=square', 2, 33, '440101199010107890', '高级育婴师', '201744007890', 6, '广州', '广州市天河区珠江新城', 4.85, 167, 98.0, '专业母婴护理师，尤其擅长产检陪诊和儿科陪护，有爱心有耐心，是宝妈们的贴心守护者。', '产检陪诊,儿科陪护,母婴护理', 1, 1, 1);

-- 陪诊师案例
INSERT INTO `pz_companion_case` (`companion_id`, `title`, `content`, `service_type`, `case_date`) VALUES
(1, '陪伴张阿姨完成白内障手术', '张阿姨今年65岁，独自一人来北京做白内障手术。我提前一天到医院熟悉流程，当天早上7点就到医院帮她排队挂号，陪同做各项术前检查，术后送她回到住处，术后连续3天提醒她用药和复查。', 'full_accompany', '2024-01-15'),
(1, '协助李先生完成术后复查', '李先生是外地患者，在北京做了心脏支架手术，需要每月复查。我每次都会提前帮他挂号，陪同见医生，帮他记录医嘱，取药后详细讲解用法用量。', 'postoperative', '2024-02-20'),
(2, '为外地患者解读体检报告', '王先生是深圳的客户，在北京做了全面体检但没时间等报告。我帮他取了所有检查报告，联系相关科室医生进行解读，并将报告和医生建议整理成文档发送给他。', 'get_report', '2024-01-28'),
(3, '全程陪同孕妇产检', '李女士怀孕7个月，老公经常出差没人陪同。我从怀孕5个月开始接手，每次产检都提前到达，帮她排队、缴费、拿报告，全程搀扶照顾，让她老公可以安心工作。', 'prenatal', '2024-03-10');

SET FOREIGN_KEY_CHECKS = 1;
