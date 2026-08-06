const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '123456',
    database: 'celeris_ccms'
  });

  try {
    const [result] = await connection.query('UPDATE ccms_users SET CM_Role_ID = ? WHERE CM_User_ID = ?', ['ROL000001', 'USR000001']);
    console.log('UPDATE RESULT:', result);

    const [userRow] = await connection.query('SELECT CM_User_ID, CM_Role_ID FROM ccms_users WHERE CM_User_ID = ?', ['USR000001']);
    console.log('UPDATED USER:', userRow[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

test();
