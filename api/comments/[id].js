const { ensureTables, deleteComment } = require('../db');

module.exports = async (req, res) => {
  const { id } = req.query;
  await ensureTables();

  if (req.method === 'DELETE') {
    try {
      await deleteComment(id);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: '删除失败' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
