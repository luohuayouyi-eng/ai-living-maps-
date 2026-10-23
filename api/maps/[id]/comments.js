const { ensureTables, getComments, addComment } = require('../../db');

module.exports = async (req, res) => {
  const { id } = req.query;
  await ensureTables();

  if (req.method === 'GET') {
    try {
      const comments = await getComments(id);
      res.status(200).json(comments);
    } catch (err) {
      res.status(500).json({ error: '获取留言失败' });
    }
  } else if (req.method === 'POST') {
    const { author, content } = req.body;
    if (!author || !content) return res.status(400).json({ error: '昵称和内容不能为空' });
    try {
      const commentId = await addComment(id, author, content, req.body.parent_id);
      res.status(200).json({ success: true, id: commentId });
    } catch (err) {
      res.status(500).json({ error: '提交失败' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
