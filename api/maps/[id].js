const { ensureTables, getMapById, updateMap, getComments, addComment, getUpdateLogs } = require('../../db');

module.exports = async (req, res) => {
  const { id } = req.query;
  await ensureTables();

  if (req.method === 'GET') {
    try {
      const map = await getMapById(id);
      if (!map) return res.status(404).json({ error: '地图不存在' });
      res.status(200).json(map);
    } catch (err) {
      res.status(500).json({ error: '获取地图失败' });
    }
  } else if (req.method === 'PUT') {
    try {
      await updateMap(id, req.body.content, req.body.description, req.body.author);
      res.status(200).json({ success: true, message: '更新成功' });
    } catch (err) {
      res.status(500).json({ error: '更新失败' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
