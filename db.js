const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    let connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL 环境变量未设置');
    }
    // 移除可能导致连接问题的参数
    connectionString = connectionString.replace(/&channel_binding=require/g, '').replace(/channel_binding=require&?/g, '');
    pool = new Pool({
      connectionString,
      ssl: 'require',
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
    });
    pool.on('error', (err) => {
      console.error('数据库连接池错误:', err.message);
    });
  }
  return pool;
}

// 确保数据库表存在（幂等）
async function ensureTables() {
  const client = getPool();
  await client.query(`CREATE TABLE IF NOT EXISTS maps (id TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT, icon TEXT, description TEXT, content TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());`);
  await client.query(`CREATE TABLE IF NOT EXISTS comments (id BIGSERIAL PRIMARY KEY, map_id TEXT NOT NULL, author TEXT NOT NULL, content TEXT NOT NULL, parent_id BIGINT, created_at TIMESTAMPTZ DEFAULT NOW());`);
  await client.query(`CREATE TABLE IF NOT EXISTS update_logs (id BIGSERIAL PRIMARY KEY, map_id TEXT NOT NULL, action TEXT, description TEXT, author TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`);
  const res = await client.query('SELECT COUNT(*) FROM maps');
  if (parseInt(res.rows[0].count) === 0) {
    await seedData();
  }
}

async function seedData() {
  const client = getPool();
  const domainContent = JSON.stringify({sections:[{title:'核心问题',items:[{name:'智能设计是什么',detail:'探讨AI在设计领域的应用边界与核心定义',level:'已初步理解'},{name:'AI如何辅助创意',detail:'生成式AI在创意设计中的角色与局限',level:'已经尝试'},{name:'人机协作模式',detail:'设计师与AI工具的协作流程与分工',level:'待深入学习'}]},{title:'关键知识与方法',items:[{name:'深度学习基础',detail:'神经网络、反向传播、Transformer架构',level:'已初步理解',courses:'机器学习, 深度学习'},{name:'生成式模型',detail:'GAN、Diffusion Model、LLM的原理与应用',level:'已经尝试',courses:'计算机视觉, 自然语言处理'},{name:'设计思维',detail:'以用户为中心的设计方法论',level:'已初步理解',courses:'交互设计, 用户体验设计'}]},{title:'工具与平台',items:[{name:'Midjourney',detail:'AI图像生成工具，用于概念设计与视觉探索',level:'已经尝试'},{name:'Stable Diffusion',detail:'开源图像生成模型，支持本地部署与微调',level:'已经尝试'},{name:'ChatGPT / Claude',detail:'大语言模型，用于设计需求分析、方案生成',level:'已初步理解'},{name:'Figma AI',detail:'设计平台集成的AI辅助功能',level:'待深入学习'}]},{title:'学习路径',items:[{name:'阶段一：基础认知',detail:'理解AI基本原理、设计思维方法论',level:'已初步理解',courses:'人工智能导论, 设计基础'},{name:'阶段二：工具实践',detail:'使用AI工具完成实际设计任务',level:'已经尝试',courses:'交互设计, 创意编程'},{name:'阶段三：深度探索',detail:'研究前沿论文、参与开源社区',level:'待深入学习',courses:'机器学习, 计算机视觉'}]}]});
  const ecosystemContent = JSON.stringify({nodes:[{name:'OpenAI',type:'企业',contribution:'GPT系列大语言模型、DALL-E图像生成',reason:'引领生成式AI浪潮'},{name:'Stability AI',type:'企业',contribution:'Stable Diffusion开源模型',reason:'推动AI图像生成民主化'},{name:'Google DeepMind',type:'企业',contribution:'AlphaFold、Gemini、Imagen',reason:'AI研究与产业应用结合'},{name:'MIT Media Lab',type:'实验室',contribution:'可触摸界面、情感计算、设计+AI交叉研究',reason:'设计与技术融合的先驱'},{name:'CMU HCI Institute',type:'实验室',contribution:'人机交互、用户体验研究',reason:'HCI领域顶级研究机构'},{name:'SIGGRAPH',type:'会议',contribution:'计算机图形与交互顶会',reason:'CCF A类，AI+设计前沿发表地'},{name:'CHI',type:'会议',contribution:'人机交互顶会',reason:'CCF A类，交互设计研究核心阵地'},{name:'Hugging Face',type:'开源社区',contribution:'模型托管、数据集、NLP工具库',reason:'AI开源生态核心枢纽'},{name:'LAION',type:'数据集',contribution:'大规模图文对数据集',reason:'Stable Diffusion训练数据来源'}],edges:[{from:'OpenAI',to:'Hugging Face',relation:'采用',detail:'GPT系列模型通过API和社区集成广泛传播'},{from:'Stability AI',to:'LAION',relation:'依赖',detail:'Stable Diffusion训练依赖LAION数据集'},{from:'Stability AI',to:'Hugging Face',relation:'合作',detail:'模型在Hugging Face平台托管分发'},{from:'Google DeepMind',to:'SIGGRAPH',relation:'发表',detail:'在SIGGRAPH发表AI图形学研究'},{from:'MIT Media Lab',to:'CHI',relation:'发表',detail:'在CHI发表交互设计研究'},{from:'OpenAI',to:'Google DeepMind',relation:'竞争',detail:'大语言模型与多模态模型领域竞争'},{from:'CMU HCI Institute',to:'CHI',relation:'发表',detail:'CHI核心投稿机构之一'}]});
  const cognitiveContent = JSON.stringify({methods:[{name:'系统拆解',description:'将复杂系统分解为可理解的子系统',case:{problem:'AI设计工具如何影响设计师的工作流程',method:'将"AI辅助设计"系统拆解为：输入层（需求描述）、生成层（AI模型）、筛选层（人工选择）、迭代层（反馈优化）',basis:'参考了实际使用Midjourney和Figma AI的工作流程',judgment:'AI在生成和筛选阶段提供高效率，但在需求理解和最终决策上仍需人类设计师',doubts:'不同设计领域（UI/平面/3D）受影响程度是否不同？'}},{name:'对照比较',description:'通过对比不同方案揭示各自特点',case:{problem:'Midjourney vs Stable Diffusion：哪个更适合设计教学',method:'从可控性、部署成本、输出质量、学习曲线四个维度对比',basis:'实际使用两个工具完成同一设计任务后的观察',judgment:'Midjourney适合快速概念探索，Stable Diffusion适合需要精确控制的场景',doubts:'随着两者功能趋同，这种差异是否会消失？'}},{name:'演进分析',description:'追踪技术/概念的发展脉络',case:{problem:'生成式AI在设计中角色的演变',method:'梳理从GAN(2014)→StyleGAN→DALL-E→Stable Diffusion→Midjourney v6的发展脉络',basis:'基于各模型发布时间线和能力变化',judgment:'从"辅助工具"逐步变为"创意伙伴"，但核心创意决策仍在人类',doubts:'未来AI是否能承担创意决策？这是否是设计领域想要的？'}}],revision:{before:'原来以为AI设计工具只是提高效率的工具，会取代部分设计师的工作',trigger:'实际使用Midjourney和ChatGPT后发现，AI更多是扩展了设计可能性的边界，而非简单替代',after:'现在理解为AI是设计师的"创意放大器"——它扩展了探索空间，但设计师的判断力和审美仍然是核心竞争力',unknowns:'AI生成内容的版权归属、AI审美趋同对设计多样性的影响仍不清楚'}});
  const maps = [
    ['domain','领域地图','Domain Map — 理清"这个领域有什么"','🌐','呈现所选领域的问题、知识、方法、工具和学习路径。将模型/工具与它能完成的任务、背后的概念、所需知识、对应课程关联起来，并标注理解程度。',domainContent],
    ['ecosystem','生态地图','Ecosystem Map — 理清"谁在推动，关系如何运转"','🔗','找到可靠的前沿入口（CCF A类会议、实验室、学者、企业、开源社区、论文/数据集等），说明每个对象的主要贡献和入选理由。用具体案例画出真实关系。',ecosystemContent],
    ['cognitive','认知地图','Cognitive Map — 理清"我们怎样思考和分析"','🧠','运用系统观、发展观等认识方法，选取2-3种分析方法，每种方法配一个实际分析过的案例，呈现思考过程。展示一次真实的认识修正。',cognitiveContent]
  ];
  for (const [id, title, subtitle, icon, desc, content] of maps) {
    await client.query('INSERT INTO maps (id, title, subtitle, icon, description, content) VALUES ($1, $2, $3, $4, $5, $6)', [id, title, subtitle, icon, desc, content]);
  }
}

async function getMaps() {
  const client = getPool();
  const res = await client.query('SELECT id, title, subtitle, icon, description FROM maps ORDER BY id');
  return res.rows;
}

async function getMapById(id) {
  const client = getPool();
  const res = await client.query('SELECT * FROM maps WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function updateMap(id, content, description, author) {
  const client = getPool();
  await client.query('UPDATE maps SET content = $1, description = $2, updated_at = NOW() WHERE id = $3', [content, description, id]);
  await client.query('INSERT INTO update_logs (map_id, action, description, author) VALUES ($1, $2, $3, $4)', [id, '编辑内容', '地图内容被更新', author || '匿名']);
}

async function getComments(mapId) {
  const client = getPool();
  const res = await client.query('SELECT * FROM comments WHERE map_id = $1 ORDER BY created_at DESC', [mapId]);
  return res.rows;
}

async function addComment(mapId, author, content, parentId) {
  const client = getPool();
  const res = await client.query('INSERT INTO comments (map_id, author, content, parent_id) VALUES ($1, $2, $3, $4) RETURNING id', [mapId, author, content, parentId || null]);
  return res.rows[0].id;
}

async function deleteComment(id) {
  const client = getPool();
  await client.query('DELETE FROM comments WHERE id = $1', [id]);
}

async function getUpdateLogs(mapId) {
  const client = getPool();
  const res = await client.query('SELECT * FROM update_logs WHERE map_id = $1 ORDER BY created_at DESC LIMIT 20', [mapId]);
  return res.rows;
}

module.exports = {
  ensureTables, getMaps, getMapById, updateMap,
  getComments, addComment, deleteComment, getUpdateLogs
};
