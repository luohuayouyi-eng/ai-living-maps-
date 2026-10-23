const { ensureTables, getMaps } = require('../db');

function findMatches(content, query) {
  const matches = [];
  const lowerQuery = query.toLowerCase();
  function search(obj) {
    if (typeof obj === 'string') {
      if (obj.toLowerCase().includes(lowerQuery)) matches.push({ context: obj });
    } else if (Array.isArray(obj)) {
      obj.forEach(item => search(item));
    } else if (obj && typeof obj === 'object') {
      if (obj.name && (
        obj.name.toLowerCase().includes(lowerQuery) ||
        (obj.detail && obj.detail.toLowerCase().includes(lowerQuery)) ||
        (obj.description && obj.description.toLowerCase().includes(lowerQuery))
      )) {
        matches.push(obj);
      } else {
        Object.values(obj).forEach(v => search(v));
      }
    }
  }
  search(content);
  return matches.slice(0, 5);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: '请输入查询内容' });

  try {
    await ensureTables();
    const maps = await getMaps();
    const results = [];

    for (const map of maps) {
      const fullMap = await require('../db').getMapById(map.id);
      if (!fullMap || !fullMap.content) continue;
      try {
        const content = JSON.parse(fullMap.content);
        const contentStr = JSON.stringify(content);
        if (contentStr.toLowerCase().includes(query.toLowerCase())) {
          const matches = findMatches(content, query);
          results.push({ map_id: map.id, map_title: map.title, matches });
        }
      } catch (e) {
        if (fullMap.content.includes(query)) {
          results.push({ map_id: map.id, map_title: map.title, matches: [{ context: fullMap.content.substring(0, 200) }] });
        }
      }
    }

    let answer;
    if (results.length === 0) {
      answer = `未在地图中找到与"${query}"直接相关的内容。建议尝试其他关键词，或在留言区提出你的问题。`;
    } else {
      answer = `关于"${query}"，在三张地图中找到以下关联信息：\n\n`;
      results.forEach(r => {
        answer += `【${r.map_title}】\n`;
        r.matches.forEach(m => {
          if (m.name) answer += `  - ${m.name}：${m.detail || m.description || ''}\n`;
          else if (m.context) answer += `  - ${m.context}\n`;
        });
        answer += '\n';
      });
      answer += `（以上内容来自地图数据，可点击对应地图查看完整信息）`;
    }
    res.status(200).json({ answer, results });
  } catch (err) {
    console.error('AI query error:', err.message);
    res.status(500).json({ error: '查询失败', detail: err.message });
  }
};
