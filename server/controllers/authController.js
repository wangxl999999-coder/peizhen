const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config');
const db = require('../utils/db');
const { success, error } = require('../utils/response');

async function wechatLogin(req, res) {
  const { code, userInfo, role = 'user' } = req.body;

  if (!code) {
    return res.json(error('code不能为空'));
  }

  try {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wechat.appId}&secret=${config.wechat.appSecret}&js_code=${code}&grant_type=authorization_code`;
    
    let openid = `test_${role}_${Date.now()}`;
    let unionid = '';

    if (config.wechat.appId && config.wechat.appId !== 'your_app_id') {
      const response = await axios.get(url);
      if (response.data.errcode) {
        return res.json(error('微信登录失败: ' + response.data.errmsg));
      }
      openid = response.data.openid;
      unionid = response.data.unionid || '';
    }

    let user;
    if (role === 'companion') {
      user = await db.queryOne('SELECT * FROM pz_companion WHERE openid = ?', [openid]);
      
      if (!user) {
        return res.json(success({
          isRegistered: false,
          openid,
          unionid
        }, '请先注册成为陪诊师'));
      }

      if (user.status === 0) {
        return res.json(error('您的账号正在审核中，请耐心等待'));
      }
      if (user.status === 2) {
        return res.json(error('您的账号已被禁用'));
      }
    } else {
      user = await db.queryOne('SELECT * FROM pz_user WHERE openid = ?', [openid]);

      if (!user) {
        const userId = await db.insert(
          'INSERT INTO pz_user (openid, unionid, nickname, avatar, gender, last_login_time) VALUES (?, ?, ?, ?, ?, NOW())',
          [openid, unionid, userInfo?.nickName || '', userInfo?.avatarUrl || '', userInfo?.gender || 0]
        );
        user = await db.queryOne('SELECT * FROM pz_user WHERE id = ?', [userId]);
      } else {
        await db.execute(
          'UPDATE pz_user SET nickname = ?, avatar = ?, gender = ?, last_login_time = NOW() WHERE id = ?',
          [userInfo?.nickName || user.nickname, userInfo?.avatarUrl || user.avatar, userInfo?.gender || user.gender, user.id]
        );
        user = await db.queryOne('SELECT * FROM pz_user WHERE id = ?', [user.id]);
      }
    }

    const token = jwt.sign(
      { id: user.id, openid: user.openid, role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json(success({
      token,
      userInfo: {
        id: user.id,
        nickname: user.nickname || user.real_name,
        avatar: user.avatar,
        phone: user.phone || '',
        role
      }
    }, '登录成功'));
  } catch (err) {
    console.error('微信登录失败:', err);
    res.json(error('登录失败，请重试'));
  }
}

async function companionRegister(req, res) {
  const { openid, phone, real_name, gender, age, id_card, qualification, qualification_no, experience, city, address, intro, skills } = req.body;

  if (!openid || !phone || !real_name || !id_card || !qualification) {
    return res.json(error('请填写完整信息'));
  }

  try {
    const existing = await db.queryOne('SELECT id FROM pz_companion WHERE phone = ? OR id_card = ?', [phone, id_card]);
    if (existing) {
      return res.json(error('该手机号或身份证已注册'));
    }

    const id = await db.insert(
      `INSERT INTO pz_companion 
       (openid, phone, real_name, gender, age, id_card, qualification, qualification_no, experience, city, address, intro, skills, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [openid, phone, real_name, gender || 0, age || 0, id_card, qualification, qualification_no || '', experience || 0, city, address || '', intro || '', skills || '']
    );

    res.json(success({ id }, '注册成功，等待审核'));
  } catch (err) {
    console.error('陪诊师注册失败:', err);
    res.json(error('注册失败，请重试'));
  }
}

async function adminLogin(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json(error('请输入用户名和密码'));
  }

  try {
    const crypto = require('crypto');
    const passwordHash = crypto.createHash('md5').update(password).digest('hex');

    const admin = await db.queryOne('SELECT * FROM pz_admin WHERE username = ? AND password = ?', [username, passwordHash]);
    
    if (!admin) {
      return res.json(error('用户名或密码错误'));
    }

    if (admin.status !== 1) {
      return res.json(error('账号已被禁用'));
    }

    await db.execute('UPDATE pz_admin SET last_login_time = NOW() WHERE id = ?', [admin.id]);

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json(success({
      token,
      userInfo: {
        id: admin.id,
        username: admin.username,
        real_name: admin.real_name,
        role: admin.role
      }
    }, '登录成功'));
  } catch (err) {
    console.error('管理员登录失败:', err);
    res.json(error('登录失败，请重试'));
  }
}

module.exports = {
  wechatLogin,
  companionRegister,
  adminLogin
};
