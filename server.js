const express = require('express');
const cors = require('cors');
const path = require('path');
const {
  initDb, getMaps, getMapById, updateMap,
  getComments, addComment, deleteComment, getUpdateLogs
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============ 地图API ============

app.get('/api/maps', async (req, res) => {
  try {
    const maps = await getMaps();
    res.json(maps);
  } catch (err) {
    res.status(500).json({ error: '获取地图失败' });
  }
});

app.get('/api/maps/:id', async (req, res) => {
  try {
    const map = await getMapById(req.params.id);
    if (!map) return res.status(404).json({ error: '地图不存在' });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: '获取地图失败' });
  }
});

app.put('/api/maps/:id', async (req, res) => {
  try {
    await updateMap(req.params.id, req.body.content, req.body.description, req.body.author);
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: '更新失败' });
  }
});

// ============ 留言API ============

app.get('/api/maps/:id/comments', async (req, res) => {
  try {
    const comments = await getComments(req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: '获取留言失败' });
  }
});

app.post('/api/maps/:id/comments', async (req, res) => {
  const { author, content } = req.body;
  if (!author || !content) return res.status(400).json({ error: '昵称和内容不能为空' });
  try {
    const id = await addComment(req.params.id, author, content, req.body.parent_id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: '提交失败' });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    await deleteComment(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除失败' });
  }
});

// ============ AI概念查询 ============

app.post('/api/ai/query', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: '请输入查询内容' });

  try {
    const maps = await getMaps();
    const results = [];

    for (const map of maps) {
      if (!map.content) continue;
      try {
        const content = JSON.parse(map.content);
        const contentStr = JSON.stringify(content);
        if (contentStr.toLowerCase().includes(query.toLowerCase())) {
          const matches = findMatches(content, query);
          results.push({ map_id: map.id, map_title: map.title, matches });
        }
      } catch (e) {
        if (map.content.includes(query)) {
          results.push({ map_id: map.id, map_title: map.title, matches: [{ context: map.content.substring(0, 200) }] });
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
    res.json({ answer, results });
  } catch (err) {
    res.status(500).json({ error: '查询失败' });
  }
});

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

// ============ 更新记录 ============

app.get('/api/maps/:id/logs', async (req, res) => {
  try {
    const logs = await getUpdateLogs(req.params.id);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: '获取记录失败' });
  }
});

// SPA路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  服务器已启动: http://localhost:${PORT}`);
      console.log(`  三张活地图网站运行中...`);
      console.log(`========================================`);
    });
  } catch (err) {
    console.error('启动失败:', err.message);
    console.error('请检查 DATABASE_URL 环境变量是否正确设置');
    process.exit(1);
  }
}

start();
