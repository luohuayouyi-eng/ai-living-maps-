const { ensureTables, getMaps } = require('../db');

module.exports = async (req, res) => {
  try {
    await ensureTables();
    const maps = await getMaps();
    res.status(200).json(maps);
  } catch (err) {
    console.error('GET /api/maps error:', err.message);
    res.status(500).json({ error: '获取地图失败', detail: err.message });
  }
};
