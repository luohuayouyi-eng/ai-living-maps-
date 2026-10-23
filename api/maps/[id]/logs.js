const { ensureTables, getUpdateLogs } = require('../../db');

module.exports = async (req, res) => {
  const { id } = req.query;
  await ensureTables();

  if (req.method === 'GET') {
    try {
      const logs = await getUpdateLogs(id);
      res.status(200).json(logs);
    } catch (err) {
      res.status(500).json({ error: '获取记录失败' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
