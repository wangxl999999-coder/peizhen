const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config');
const memoryDb = require('../utils/memoryDb');
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

async function companionLogin(req, res) {
  const { phone, code, openid } = req.body;

  if (!phone) {
    return res.json(error('请输入手机号'));
  }

  if (!code) {
    return res.json(error('请输入验证码'));
  }

  if (code !== '123456') {
    return res.json(error('验证码错误，测试请输入 123456'));
  }

  try {
    const companion = memoryDb.findOne('companions', { phone });
    
    if (!companion) {
      const testPhones = memoryDb.data.companions.map(c => c.phone).join('、');
      return res.json(error(`该手机号未注册，测试手机号：${testPhones}`));
    }

    if (companion.status === 0) {
      return res.json(error('您的账号正在审核中，请耐心等待'));
    }
    if (companion.status === 2) {
      return res.json(error('您的账号已被禁用'));
    }

    memoryDb.update('companions', companion.id, { last_login_time: new Date().toISOString().slice(0, 19).replace('T', ' ') });

    const token = jwt.sign(
      { id: companion.id, openid: companion.openid, role: 'companion' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json(success({
      token,
      user: {
        id: companion.id,
        real_name: companion.real_name,
        phone: companion.phone,
        avatar: companion.avatar || '',
        status: companion.status
      }
    }, '登录成功'));
  } catch (err) {
    console.error('陪诊师登录失败:', err);
    res.json(error('登录失败，请重试'));
  }
}

async function companionSendCode(req, res) {
  const { phone } = req.body;

  if (!phone) {
    return res.json(error('请输入手机号'));
  }

  try {
    res.json(success({}, '验证码已发送'));
  } catch (err) {
    console.error('发送验证码失败:', err);
    res.json(error('发送失败，请重试'));
  }
}

async function companionWechatLogin(req, res) {
  const { code } = req.body;

  if (!code) {
    return res.json(error('code不能为空'));
  }

  try {
    let openid = `test_companion_${Date.now()}`;

    if (config.wechat.appId && config.wechat.appId !== 'your_app_id') {
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wechat.appId}&secret=${config.wechat.appSecret}&js_code=${code}&grant_type=authorization_code`;
      const response = await axios.get(url);
      if (response.data.errcode) {
        return res.json(error('微信登录失败: ' + response.data.errmsg));
      }
      openid = response.data.openid;
    }

    const companion = await db.queryOne('SELECT * FROM pz_companion WHERE openid = ?', [openid]);
    
    if (!companion) {
      return res.json(success({
        isRegistered: false,
        openid
      }, '请先注册成为陪诊师'));
    }

    if (companion.status === 0) {
      return res.json(error('您的账号正在审核中，请耐心等待'));
    }
    if (companion.status === 2) {
      return res.json(error('您的账号已被禁用'));
    }

    await db.execute('UPDATE pz_companion SET last_login_time = NOW() WHERE id = ?', [companion.id]);

    const token = jwt.sign(
      { id: companion.id, openid: companion.openid, role: 'companion' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json(success({
      token,
      user: {
        id: companion.id,
        real_name: companion.real_name,
        phone: companion.phone,
        avatar: companion.avatar || '',
        status: companion.status
      }
    }, '登录成功'));
  } catch (err) {
    console.error('陪诊师微信登录失败:', err);
    res.json(error('登录失败，请重试'));
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

    const admin = memoryDb.findOne('admins', { username });
    
    if (!admin || admin.password !== passwordHash) {
      return res.json(error('用户名或密码错误'));
    }

    if (admin.status !== 1) {
      return res.json(error('账号已被禁用'));
    }

    memoryDb.update('admins', admin.id, { last_login_time: new Date().toISOString() });

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json(success({
      token,
      user: {
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
  companionLogin,
  companionSendCode,
  companionWechatLogin,
  adminLogin
};
