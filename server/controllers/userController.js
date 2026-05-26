const db = require('../utils/db');
const { success, error, paginate } = require('../utils/response');

async function getUserInfo(req, res) {
  const userId = req.user.id;

  try {
    const user = await db.queryOne('SELECT id, openid, nickname, avatar, gender, phone, real_name, create_time FROM pz_user WHERE id = ?', [userId]);
    res.json(success(user));
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.json(error('获取用户信息失败'));
  }
}

async function updateUserInfo(req, res) {
  const userId = req.user.id;
  const { nickname, avatar, gender, phone, real_name, id_card } = req.body;

  try {
    await db.execute(
      'UPDATE pz_user SET nickname = ?, avatar = ?, gender = ?, phone = ?, real_name = ?, id_card = ? WHERE id = ?',
      [nickname, avatar, gender, phone, real_name, id_card, userId]
    );
    res.json(success(null, '更新成功'));
  } catch (err) {
    console.error('更新用户信息失败:', err);
    res.json(error('更新失败'));
  }
}

async function getPatientList(req, res) {
  const userId = req.user.id;

  try {
    const list = await db.query('SELECT * FROM pz_patient WHERE user_id = ? ORDER BY is_default DESC, create_time DESC', [userId]);
    res.json(success(list));
  } catch (err) {
    console.error('获取就诊人列表失败:', err);
    res.json(error('获取失败'));
  }
}

async function addPatient(req, res) {
  const userId = req.user.id;
  const { name, gender, age, id_card, phone, relation, medical_card, allergy, medical_history, is_default } = req.body;

  if (!name || !id_card || !phone || !relation) {
    return res.json(error('请填写必填信息'));
  }

  try {
    if (is_default) {
      await db.execute('UPDATE pz_patient SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    const id = await db.insert(
      `INSERT INTO pz_patient 
       (user_id, name, gender, age, id_card, phone, relation, medical_card, allergy, medical_history, is_default) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, gender, age, id_card, phone, relation, medical_card || '', allergy || '', medical_history || '', is_default ? 1 : 0]
    );

    res.json(success({ id }, '添加成功'));
  } catch (err) {
    console.error('添加就诊人失败:', err);
    res.json(error('添加失败'));
  }
}

async function updatePatient(req, res) {
  const userId = req.user.id;
  const patientId = req.params.id;
  const { name, gender, age, id_card, phone, relation, medical_card, allergy, medical_history, is_default } = req.body;

  try {
    const patient = await db.queryOne('SELECT id FROM pz_patient WHERE id = ? AND user_id = ?', [patientId, userId]);
    if (!patient) {
      return res.json(error('就诊人不存在'));
    }

    if (is_default) {
      await db.execute('UPDATE pz_patient SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    await db.execute(
      `UPDATE pz_patient SET 
       name = ?, gender = ?, age = ?, id_card = ?, phone = ?, relation = ?, 
       medical_card = ?, allergy = ?, medical_history = ?, is_default = ? 
       WHERE id = ?`,
      [name, gender, age, id_card, phone, relation, medical_card || '', allergy || '', medical_history || '', is_default ? 1 : 0, patientId]
    );

    res.json(success(null, '更新成功'));
  } catch (err) {
    console.error('更新就诊人失败:', err);
    res.json(error('更新失败'));
  }
}

async function deletePatient(req, res) {
  const userId = req.user.id;
  const patientId = req.params.id;

  try {
    const patient = await db.queryOne('SELECT id FROM pz_patient WHERE id = ? AND user_id = ?', [patientId, userId]);
    if (!patient) {
      return res.json(error('就诊人不存在'));
    }

    await db.execute('DELETE FROM pz_patient WHERE id = ?', [patientId]);
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error('删除就诊人失败:', err);
    res.json(error('删除失败'));
  }
}

async function setDefaultPatient(req, res) {
  const userId = req.user.id;
  const patientId = req.params.id;

  try {
    await db.execute('UPDATE pz_patient SET is_default = 0 WHERE user_id = ?', [userId]);
    await db.execute('UPDATE pz_patient SET is_default = 1 WHERE id = ? AND user_id = ?', [patientId, userId]);
    res.json(success(null, '设置成功'));
  } catch (err) {
    console.error('设置默认就诊人失败:', err);
    res.json(error('设置失败'));
  }
}

module.exports = {
  getUserInfo,
  updateUserInfo,
  getPatientList,
  addPatient,
  updatePatient,
  deletePatient,
  setDefaultPatient
};
