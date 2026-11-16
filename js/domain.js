// ==================== 领域地图 Domain Map v2.0 ====================
// 数据文件：data/domain.json（元数据/任务流/课程/关系/来源/更新记录）
//          data/domain-nodes.json（五层节点库）
// 设计原则：所有回答可回溯到节点与来源；不调用外部模型，不编造内容。

const DM = {
  meta: null,
  nodesData: null,
  nodeIndex: {},
  currentView: 'overview',
  currentNode: null,
  aiMode: 'search'
};

// 浙江大学 2019 级工业设计专业培养方案课程对照（来源 s-zju）
const DM_COURSES = {
  'cs-basic': { name: '计算机科学基础（A）', code: '211G0290', sem: '一(秋冬)' },
  'python': { name: 'Python 程序设计', code: '211G0200', sem: '一(春夏)' },
  'calc1': { name: '微积分（甲）Ⅰ', code: '821T0150', sem: '一(秋冬)' },
  'calc2': { name: '微积分（甲）Ⅱ', code: '821T0160', sem: '一(春夏)' },
  'linalg': { name: '线性代数（甲）', code: '821T0190', sem: '一(秋冬)' },
  'phys': { name: '大学物理（丙）', code: '761T0050', sem: '一(春夏)' },
  'draw': { name: '设计绘画', code: '211D0130', sem: '一(秋冬)' },
  'design-base': { name: '设计基础', code: '211D0100', sem: '一(春夏)' },
  'design-think': { name: '设计思维与表达', code: '21191511', sem: '二(秋冬)' },
  'game': { name: '计算机游戏程序设计', code: '21190912', sem: '二(秋冬)' },
  'form': { name: '产品形式与方式设计', code: '21120062', sem: '二(春)' },
  'shape': { name: '造型基础', code: '21120350', sem: '二(春)' },
  'structure': { name: '实体与结构', code: '21121370', sem: '二(春)' },
  'ergo': { name: '人机工程学与创新设计', code: '21120243', sem: '二(夏)' },
  'viz': { name: '跨媒体数据可视化', code: '21191590', sem: '三(秋)' },
  'biz': { name: '商业创新设计', code: '21191650', sem: '三(秋)' },
  'ux': { name: '用户体验与产品创新设计', code: '21121201', sem: '三(冬)' },
  'infoprod': { name: '信息产品设计', code: '21121092', sem: '三(春夏)' },
  'interact': { name: '信息与交互设计技术', code: '21121390', sem: '三(春夏)' },
  'hist': { name: '工业设计史', code: '21120130', sem: '二(秋)' },
  'ai': { name: '人工智能', code: '21191890', sem: '二(秋冬)' },
  'intro-design': { name: 'Introduction to Design', code: '47120090', sem: '二(秋冬)' },
  'psych': { name: '设计心理学', code: '21120911', sem: '二(冬)' },
  'layout': { name: '版面编排设计', code: '21120010', sem: '二(春)' },
  'service': { name: '服务创新设计', code: '21191623', sem: '二(春夏)' },
  'techform': { name: '技术构成与创新设计', code: '21191810', sem: '二(春夏)' },
  'mlapp': { name: '机器学习及应用', code: '21191900', sem: '二(夏)' },
  'media': { name: '数字媒体资源管理', code: '21120920', sem: '三(秋)' },
  'photo': { name: '数字摄影', code: '21191320', sem: '三(秋)' },
  'startup': { name: '创业设计', code: '21121121', sem: '三(秋冬)' },
  'culture': { name: '文化构成与创新设计', code: '21120942', sem: '三(冬)' },
  'bizdata': { name: '商业数据分析', code: '21121250', sem: '三(冬)' },
  'techcreate': { name: '技术创意', code: '21191800', sem: '三(春夏)' },
  'vr': { name: '虚拟现实与数字娱乐', code: '21191370', sem: '三(夏)' },
  'cad': { name: '计算机辅助工业设计', code: '21120161', sem: '一(短)' },
  'practice1': { name: '设计创新实践', code: '21188120', sem: '二(短)' },
  'practice2': { name: '工程实践', code: '21120721', sem: '三(短)' },
  'integrate': { name: '整合与创新设计', code: '21191503', sem: '四(秋冬)' },
  'thesis': { name: '毕业设计（论文）', code: '21189030', sem: '四(春夏)' }
};

const DM_VIEWS = ['overview', 'task', 'curriculum', 'relations', 'ai', 'updates'];
const DM_VIEW_NAMES = { overview: '全景分层', task: '典型任务', curriculum: '课程与能力', relations: '关系与依据', ai: 'AI 助手', updates: '更新与来源' };

// ==================== 数据加载 ====================

async function dmLoad() {
  if (DM.meta) return;
  const [meta, nodes] = await Promise.all([
    fetch('data/domain.json').then(r => r.json()),
    fetch('data/domain-nodes.json').then(r => r.json())
  ]);
  DM.meta = meta;
  DM.nodesData = nodes;
  nodes.nodes.forEach(n => { DM.nodeIndex[n.id] = n; });
}

function nodeById(id) { return DM.nodeIndex[id] || null; }
function nodeLabel(id) { const n = nodeById(id); return n ? n.name : id; }

function courseChip(id) {
  const c = DM_COURSES[id];
  if (!c) return `<span class="p-chip course">📚 ${id}（待核实）</span>`;
  return `<span class="p-chip course" title="课程号 ${c.code} · 建议学期 ${c.sem}">📚 ${c.name} <small style="opacity:.7">${c.code}</small></span>`;
}

function levelBadge(level) {
  if (!level) return '';
  const cls = level.includes('初步') ? 'lv-understood' : level.includes('尝试') ? 'lv-tried' : 'lv-pending';
  return `<span class="dm-badge ${cls}">理解程度：${level}</span>`;
}

function statusBadge(status) {
  if (!status) return '';
  const cls = status === '已核实' ? 'st-verified' : status === '待核实' ? 'st-pending' : 'st-infer';
  const mean = (DM.meta.statusMeaning && DM.meta.statusMeaning[status]) || '';
  return `<span class="dm-badge ${cls}" title="${mean}">${status}</span>`;
}

// ==================== 入口（由 app.js 调用） ====================

window.renderDomainPage = async function () {
  const page = document.getElementById('mapDetailPage');
  try {
    await dmLoad();
  } catch (e) {
    page.innerHTML = '<div class="dm-app"><p style="color:var(--neon-orange)">领域地图数据加载失败，请刷新重试。</p></div>';
    return;
  }
  if (!document.getElementById('domainApp')) buildShell(page);
  applyRoute();
};

function buildShell(page) {
  page.innerHTML = `
    <div class="dm-app" id="domainApp">
      <a href="#/" class="dm-back">← 返回主页</a>
      <div class="dm-head">
        <div class="dm-icon">🌐</div>
        <div>
          <h1>领域地图 · ${DM.meta.meta.domain}</h1>
          <div class="dm-sub">${DM.meta.meta.oneLineGoal}</div>
        </div>
        <div class="dm-meta" id="dmMeta"></div>
      </div>
      <div class="dm-boundary" id="dmBoundary"></div>
      <div class="dm-tabs" id="dmTabs"></div>
      <div class="dm-layout">
        <div class="dm-main">
          <div class="dm-view" id="view-overview"></div>
          <div class="dm-view" id="view-task"></div>
          <div class="dm-view" id="view-curriculum"></div>
          <div class="dm-view" id="view-relations"></div>
          <div class="dm-view" id="view-ai"></div>
          <div class="dm-view" id="view-updates"></div>
          <details class="dm-comments">
            <summary>💬 留言反馈 — 挑错 / 提问 / 建议补充节点（互评同学请具体到节点）</summary>
            <div class="comment-form" style="margin-top:10px;">
              <input type="text" id="commentAuthor" placeholder="你的昵称" maxlength="20">
              <textarea id="commentContent" placeholder="例如：扩散模型节点里的“替代方案”是否应该是 GAN？依据是什么？" rows="3" maxlength="500"></textarea>
              <button onclick="submitComment('domain')">提交留言</button>
            </div>
            <div class="comment-list" id="commentList"></div>
          </details>
        </div>
        <aside class="dm-panel" id="dmPanel"></aside>
      </div>
    </div>
  `;

  // 头部元信息
  document.getElementById('dmMeta').innerHTML = `
    <span class="dm-badge">${DM.meta.meta.version}</span>
    <span class="dm-badge">更新 ${DM.meta.meta.updated}</span>
    <span class="dm-badge">${DM.meta.meta.orientation}</span>
    <div style="margin-top:6px;font-size:0.72rem;color:var(--text-secondary)">课程依据：浙江大学 2019 级工业设计培养方案</div>
  `;

  // 边界声明
  const b = DM.meta.meta.boundary;
  document.getElementById('dmBoundary').innerHTML = `
    <div class="b-card"><b>我们研究什么</b>${b.weStudy}</div>
    <div class="b-card"><b>典型任务（例子）</b>${b.typicalTask}</div>
    <div class="b-card warn"><b>暂不展开</b>${b.notCovered}</div>
    <div class="b-card warn"><b>不声明的事</b>${b.notClaim}</div>
  `;

  // 选项卡
  document.getElementById('dmTabs').innerHTML = DM_VIEWS.map(v =>
    `<button class="dm-tab" data-view="${v}" onclick="dmGoView('${v}')">${DM_VIEW_NAMES[v]}</button>`
  ).join('');

  renderOverview();
  renderTask();
  renderCurriculum();
  renderRelations();
  renderAI();
  renderUpdates();
}

// ==================== 路由 ====================

function applyRoute() {
  const rest = window.__routeRest || [];
  let view = null, nodeId = null;
  if (rest[0] === 'node') { nodeId = rest[1]; }
  else if (rest.length && DM_VIEWS.includes(rest[0])) { view = rest[0]; }

  if (nodeId && nodeById(nodeId)) DM.currentNode = nodeId;
  if (view) DM.currentView = view;

  setView(DM.currentView);
  highlightChips();
  updatePanel();
}

function setView(view) {
  document.querySelectorAll('.dm-view').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('view-' + view);
  if (el) el.classList.add('active');
  document.querySelectorAll('.dm-tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  DM.currentView = view;
}

window.dmGoView = function (v) {
  window.location.hash = '#/map/domain/' + v;
};

window.dmOpenNode = function (id) {
  window.location.hash = '#/map/domain/node/' + id;
};

function highlightChips() {
  document.querySelectorAll('.dm-chip[data-id]').forEach(ch => {
    ch.classList.toggle('selected', ch.dataset.id === DM.currentNode);
  });
}

// ==================== 视图 1：全景分层 ====================

function renderOverview() {
  const layers = DM.nodesData.layers;
  const order = ['problem', 'concept', 'method', 'tool', 'resource'];
  let html = `
    <div class="dm-view-intro">
      <b>怎么读这张图：</b>${DM.meta.meta.howToRead}
      点击任意节点，右侧会展开它的任务、前置知识、对应课程、局限与来源。
    </div>
  `;
  order.forEach(key => {
    const ly = layers[key];
    const nodes = DM.nodesData.nodes.filter(n => n.layer === key);
    html += `
      <div class="dm-layer ly-${key}">
        <div class="dm-layer-head">
          <span class="ly-name">${ly.name} <span style="opacity:.6;font-size:.8rem">${ly.en}</span></span>
          <span class="ly-q">${ly.question}</span>
          <span class="ly-q" style="margin-left:auto">${nodes.length} 个节点</span>
        </div>
        <div class="dm-chips">
          ${nodes.map(n => `<button class="dm-chip" data-id="${n.id}" title="${n.oneline}" onclick="dmOpenNode('${n.id}')">${n.name}<small>${n.en}</small></button>`).join('')}
        </div>
      </div>
    `;
  });
  html += `
    <div class="dm-view-intro" style="border-color:var(--neon-purple)">
      <b>三层支撑关系：</b>问题层的每个问题由方法层的某些方法应对，方法依赖概念层提供的原理，概念通过工具层落地，工具与评测又依赖资源层的数据与环境。
      方法与工具之间的依赖 / 并列 / 替代 / 协同关系，见 <a href="#/map/domain/relations" style="color:var(--neon-cyan)">关系与依据</a> 视图。
    </div>
  `;
  document.getElementById('view-overview').innerHTML = html;
}

// ==================== 视图 2：典型任务 ====================

function renderTask() {
  const tf = DM.meta.taskflow;
  let html = `
    <div class="dm-view-intro">
      <b>${tf.task}</b><br>${tf.note}<br>
      每一步：做什么 → 用什么工具/概念（可点击） → 产出 → 常见失误 → 对应课程。
    </div>
  `;
  tf.steps.forEach((s, i) => {
    html += `
      <div class="dm-step">
        <span class="st-no">STEP ${s.n}</span>
        <h4>${s.name}</h4>
        <div class="st-goal">目标：${s.goal}</div>
        <ul class="st-do">${s.do.map(d => `<li>${d}</li>`).join('')}</ul>
        <div class="st-row"><span class="st-label">工具/方法</span>${s.tools.map(t => `<button class="dm-chip" data-id="${t}" onclick="dmOpenNode('${t}')">${nodeLabel(t)}</button>`).join('')}</div>
        <div class="st-row"><span class="st-label">背后概念</span>${s.concepts.map(c => `<button class="dm-chip" data-id="${c}" onclick="dmOpenNode('${c}')">${nodeLabel(c)}</button>`).join('')}</div>
        <div class="st-row"><span class="st-label">产出</span><span class="st-out">${s.output}</span></div>
        <div class="st-row"><span class="st-label">常见失误</span><span class="st-pit">⚠ ${s.pitfall}</span></div>
        <div class="st-row"><span class="st-label">对应课程</span>${s.courses.map(c => courseChip(c)).join('')}</div>
      </div>
    `;
    if (i < tf.steps.length - 1) html += `<div class="dm-flow-arrow">▼ 下一步依赖本步的产出</div>`;
  });
  document.getElementById('view-task').innerHTML = html;
}

// ==================== 视图 3：课程与能力 ====================

function renderCurriculum() {
  const cur = DM.meta.curriculum;
  const legend = ['前置基础', '核心覆盖', '部分涉及', '实践应用', '自主拓展'];
  let html = `
    <div class="dm-view-intro">
      <b>关联顺序：培养要求 → 具体能力 → 课程内容 → 概念或工具 → 后续实践。</b><br>
      依据：${cur.basis}。课程号与建议学期摘自培养方案原文；覆盖程度为本组判断；无法确认的内容标注“待核实”。<br>
      <span style="color:var(--neon-orange)">注：未来专业课程是学习入口，不能被当成先修要求。</span>
    </div>
    <div class="dm-legend">${legend.map(l => `<span>${l}</span>`).join('')}</div>
    <div class="dm-table-wrap">
      <table class="dm-table">
        <thead><tr>
          <th>培养要求</th><th>具体能力</th><th>课程（课程号 · 学期）</th><th>对应概念或工具</th><th>后续实践</th><th>覆盖程度</th><th>依据</th>
        </tr></thead>
        <tbody>
          ${cur.chains.map(c => `
            <tr>
              <td class="req">${c.req}</td>
              <td>${c.ability}</td>
              <td>${c.courses.map(x => `<div>📚 ${x}</div>`).join('')}</td>
              <td>${c.nodes.map(n => `<span class="node-link" onclick="dmOpenNode('${n}')">${nodeLabel(n)}</span>`).join('')}</td>
              <td>${c.next}</td>
              <td><span class="dm-badge cov">${c.coverage}</span></td>
              <td style="font-size:.74rem">${c.basis}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="dm-view-intro" style="margin-top:16px;border-color:var(--neon-yellow)">
      <b>取向说明：</b>${cur.orientation}<br>
      <b>工程师取向备注：</b>${cur.engineerNote}
    </div>
  `;
  document.getElementById('view-curriculum').innerHTML = html;
}

// ==================== 视图 4：关系与依据 ====================

function renderRelations() {
  let html = `
    <div class="dm-view-intro">
      <b>关系必须说明类型与依据。</b>每条连线标注 依赖 / 并列 / 替代 / 协同 / 扩展 / 输出到 / 互补 等具体关系，
      并给出依据（论文、官方文档或团队使用记录）。尚未证实的联系不在此列出。
    </div>
  `;
  DM.meta.relationGroups.forEach(g => {
    html += `<div class="dm-relgroup"><h3>${g.name}</h3>`;
    g.edges.forEach(e => {
      html += `
        <div class="dm-edge">
          <span class="e-node" onclick="dmOpenNode('${e.from}')">${nodeLabel(e.from)}</span>
          <span class="e-rel">${e.rel} →</span>
          <span class="e-node" onclick="dmOpenNode('${e.to}')">${nodeLabel(e.to)}</span>
          <div class="e-note">${e.note}　<b>依据：${e.basis}</b></div>
        </div>
      `;
    });
    html += `</div>`;
  });

  html += `
    <div class="dm-relgroup">
      <h3>三张地图的相互关联（从领域地图出发）</h3>
      <div class="dm-table-wrap">
        <table class="dm-table" style="min-width:640px">
          <thead><tr><th>领域地图节点</th><th>→ 生态地图（谁在推动）</th><th>→ 认知地图（怎样分析）</th></tr></thead>
          <tbody>
            ${DM.meta.crossMap.map(r => `<tr><td class="req">${r.domainNode}</td><td>${r.ecosystem}</td><td>${r.cognitive}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:10px">
        <a href="#/map/ecosystem" class="dm-back" style="margin-right:8px">进入生态地图 →</a>
        <a href="#/map/cognitive" class="dm-back">进入认知地图 →</a>
      </div>
    </div>
  `;
  document.getElementById('view-relations').innerHTML = html;
}

// ==================== 视图 5：AI 助手 ====================

function renderAI() {
  document.getElementById('view-ai').innerHTML = `
    <div class="dm-view-intro">
      <b>AI 能力直接服务于地图：</b>概念检索（一个概念 → 任务/前置/课程/局限）、路线对比（两个节点逐项对比）、
      学习路径（从基础概念到课程的顺序）。全部基于本地图的结构化数据做确定性检索，<span style="color:var(--neon-green)">不调用外部大模型，答案的每一条都可回溯到节点与来源</span>；查不到就明说查不到。
    </div>
    <div class="dm-ai-modes">
      <button class="dm-ai-mode active" data-mode="search" onclick="dmAiMode('search')">① 概念检索</button>
      <button class="dm-ai-mode" data-mode="compare" onclick="dmAiMode('compare')">② 路线对比</button>
      <button class="dm-ai-mode" data-mode="path" onclick="dmAiMode('path')">③ 学习路径</button>
    </div>
    <div id="dmAiInput"></div>
    <div class="dm-ai-result" id="dmAiResult"></div>
  `;
  dmRenderAiInput();
}

window.dmAiMode = function (m) {
  DM.aiMode = m;
  document.querySelectorAll('.dm-ai-mode').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  document.getElementById('dmAiResult').innerHTML = '';
  dmRenderAiInput();
};

function dmRenderAiInput() {
  const box = document.getElementById('dmAiInput');
  const all = DM.nodesData.nodes;
  if (DM.aiMode === 'search') {
    box.innerHTML = `
      <div class="dm-ai-box">
        <input type="text" id="dmAiQuery" placeholder="输入概念 / 工具 / 课程名，例如：可控性、LoRA、可用性、扩散模型..."
               onkeypress="if(event.key==='Enter')dmAiSearch()">
        <button onclick="dmAiSearch()">检索地图</button>
      </div>`;
  } else if (DM.aiMode === 'compare') {
    const opts = all.map(n => `<option value="${n.id}">${nodeLabel(n)}</option>`).join('');
    box.innerHTML = `
      <select class="dm-ai-select" id="dmCmpA">${opts}</select>
      <select class="dm-ai-select" id="dmCmpB">${opts}</select>
      <div class="dm-ai-box"><button onclick="dmAiCompare()">对比两条路线</button></div>`;
    document.getElementById('dmCmpA').value = 't-mj';
    document.getElementById('dmCmpB').value = 't-sd';
  } else {
    box.innerHTML = `
      <select class="dm-ai-select" id="dmPathSel">
        <option value="__g1">目标：独立完成一次 AI 辅助的界面设计任务</option>
        <option value="__g2">目标：建立团队可控的品牌风格（逆转审美趋同）</option>
        <option value="__g3">目标：为生成结果建立可辩护的评测</option>
        <option value="__g4">目标：理解生成模型原理并向同学解释</option>
        ${all.map(n => `<option value="${n.id}">围绕节点：${nodeLabel(n)}</option>`).join('')}
      </select>
      <div class="dm-ai-box"><button onclick="dmAiPath()">生成学习路径</button></div>`;
  }
}

function dmFindNodes(q) {
  const lower = q.toLowerCase();
  const scored = [];
  DM.nodesData.nodes.forEach(n => {
    let score = 0;
    const hay = [n.name, n.en, (n.aka || []).join(' ')].join(' ').toLowerCase();
    if (hay.includes(lower)) score += 5;
    const body = [n.oneline, n.what, (n.tasks || []).join(' '), n.prereq || '', (n.limits || []).join(' ')].join(' ').toLowerCase();
    if (body.includes(lower)) score += 2;
    (n.courses || []).forEach(c => {
      const co = DM_COURSES[c];
      if (co && (co.name.toLowerCase().includes(lower) || co.code.includes(q))) score += 3;
    });
    if (score > 0) scored.push({ n, score });
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 4).map(s => s.n);
}

window.dmAiSearch = function () {
  const q = (document.getElementById('dmAiQuery').value || '').trim();
  const out = document.getElementById('dmAiResult');
  if (!q) { out.innerHTML = '<div class="dm-ai-card">请输入要检索的概念。</div>'; return; }
  const hits = dmFindNodes(q);
  if (!hits.length) {
    out.innerHTML = `
      <div class="dm-ai-card">
        地图中没有找到与“<b style="color:var(--neon-yellow)">${q}</b>”直接相关的内容。<br>
        可以尝试：扩散模型 / 潜空间 / 可控性 / 一致性 / 可用性 / LoRA / ControlNet / Figma / 培养方案相关课程名。
        如果你认为应该有这个节点，请在下方留言区提出（这正是地图可更新的方式）。
      </div>`;
    return;
  }
  out.innerHTML = hits.map(n => `
    <div class="dm-ai-card">
      <h5 onclick="dmOpenNode('${n.id}')">${n.name} <span style="font-size:.72rem;color:var(--text-secondary)">${n.en} · ${DM.nodesData.layers[n.layer].name}</span> ↗</h5>
      <div>${n.oneline}</div>
      <div class="kv"><b>能做什么</b>${(n.tasks || []).join('；')}</div>
      <div class="kv"><b>使用前需要</b>${n.prereq || '—'}</div>
      <div class="kv"><b>对应课程</b>${(n.courses || []).map(c => DM_COURSES[c] ? `${DM_COURSES[c].name}（${DM_COURSES[c].code}）` : c + '（待核实）').join('；') || '—'}</div>
      <div class="kv"><b>主要局限</b>${(n.limits || []).join('；') || '—'}</div>
      <div class="kv"><b>继续探索</b>${(n.concepts || []).concat(n.alternatives || []).map(id => `<span class="node-link" style="cursor:pointer" onclick="dmOpenNode('${id}')">${nodeLabel(id)}</span>`).join('、') || '—'}</div>
      ${levelBadge(n.level)} ${statusBadge(n.status)}
    </div>
  `).join('') + `<div class="dm-ai-disclaim">以上内容逐条来自地图节点数据与来源清单，未调用外部模型；点击节点名查看完整信息与原文出处。</div>`;
};

window.dmAiCompare = function () {
  const a = nodeById(document.getElementById('dmCmpA').value);
  const b = nodeById(document.getElementById('dmCmpB').value);
  const out = document.getElementById('dmAiResult');
  if (!a || !b) return;
  if (a.id === b.id) { out.innerHTML = '<div class="dm-ai-card">请选择两个不同的节点。</div>'; return; }
  const rows = [
    ['定位', `${DM.nodesData.layers[a.layer].name}：${a.oneline}`, `${DM.nodesData.layers[b.layer].name}：${b.oneline}`],
    ['能完成的任务', (a.tasks || []).join('；') || '—', (b.tasks || []).join('；') || '—'],
    ['背后概念', (a.concepts || []).map(nodeLabel).join('、') || '—', (b.concepts || []).map(nodeLabel).join('、') || '—'],
    ['使用前需要', a.prereq || '—', b.prereq || '—'],
    ['对应课程', (a.courses || []).map(c => DM_COURSES[c] ? DM_COURSES[c].name : c).join('、') || '—', (b.courses || []).map(c => DM_COURSES[c] ? DM_COURSES[c].name : c).join('、') || '—'],
    ['适用条件', a.conditions || '—', b.conditions || '—'],
    ['主要局限', (a.limits || []).join('；') || '—', (b.limits || []).join('；') || '—'],
    ['替代/相关', (a.alternatives || []).map(nodeLabel).join('、') || '—', (b.alternatives || []).map(nodeLabel).join('、') || '—'],
    ['理解程度', a.level || '—', b.level || '—'],
    ['来源', (a.sources || []).length + ' 条（' + (a.sources || []).join('、') + '）', (b.sources || []).length + ' 条（' + (b.sources || []).join('、') + '）']
  ];
  out.innerHTML = `
    <div class="dm-ai-card" style="padding:0;overflow-x:auto">
      <table class="dm-cmp-table">
        <tr><th>对比维度</th><th><span style="cursor:pointer" onclick="dmOpenNode('${a.id}')">${a.name} ↗</span></th><th><span style="cursor:pointer" onclick="dmOpenNode('${b.id}')">${b.name} ↗</span></th></tr>
        ${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}
      </table>
    </div>
    <div class="dm-ai-disclaim">对比条件一致性提醒：两者的“适用条件”与“局限”基于不同的观测场景，直接得出“谁更好”的结论前，请先确认对比条件一致（认知地图·对照比较方法的要求）。</div>`;
};

const DM_GOALS = {
  __g1: ['p-need', 'm-research', 'm-define', 'm-diverge', 't-mj', 'm-structure', 't-figma', 't-v0', 'm-eval'],
  __g2: ['c-homogen', 'c-consist', 'm-style', 't-lora', 't-sd'],
  __g3: ['c-align', 'r-metric', 'r-bench', 'm-eval', 'm-metric'],
  __g4: ['c-diffusion', 'c-latent', 'c-cond', 'c-align', 't-sd']
};

window.dmAiPath = function () {
  const sel = document.getElementById('dmPathSel').value;
  const out = document.getElementById('dmAiResult');
  let ids;
  if (DM_GOALS[sel]) {
    ids = DM_GOALS[sel];
  } else {
    const t = nodeById(sel);
    if (!t) return;
    // 从地图结构推导：基础概念 → 相关方法 → 工具/资源 → 课程
    const methods = DM.nodesData.nodes.filter(n => n.layer === 'method' && ((n.concepts || []).includes(sel) || (n.relations || []).some(r => r.to === sel)));
    const tools = DM.nodesData.nodes.filter(n => (n.layer === 'tool' || n.layer === 'resource') && ((n.concepts || []).includes(sel) || (n.relations || []).some(r => r.to === sel)));
    ids = [...(t.concepts || []), t.id, ...methods.map(m => m.id), ...tools.slice(0, 4).map(x => x.id)];
  }
  const nodes = ids.map(nodeById).filter(Boolean);
  const stageNames = ['① 先建立的基础', '② 核心节点', '③ 上手的方法与工具', '④ 配套资源'];
  let html = '<div class="dm-ai-card">';
  html += '<div style="margin-bottom:10px"><b style="color:var(--neon-cyan)">学习路径（按依赖顺序）</b>　<span style="font-size:.74rem">依据：每个节点的前置概念、对应课程与来源</span></div>';
  nodes.forEach((n, i) => {
    const courses = (n.courses || []).map(c => DM_COURSES[c] ? `${DM_COURSES[c].name}` : c).join('、');
    html += `
      <div class="dm-path-step">
        <div class="p-no">${i + 1}</div>
        <div class="p-body">
          <b style="cursor:pointer" onclick="dmOpenNode('${n.id}')">${n.name}</b>　<span style="font-size:.72rem;color:var(--text-secondary)">${DM.nodesData.layers[n.layer].name}</span><br>
          ${n.oneline}
          ${courses ? `<br><span style="font-size:.74rem;color:var(--neon-purple)">📚 ${courses}</span>` : ''}
        </div>
      </div>`;
  });
  html += `
      <div class="kv" style="margin-top:8px"><b>检验标准</b>能用自己的话向同学解释每个节点“是什么、解决什么、和什么相关”，并指出自己哪一步还只是“听说过”——不要把“听说过”写成“已经掌握”。</div>
    </div>
    <div class="dm-ai-disclaim">路径由地图数据自动推导（前置概念 → 方法 → 工具 → 课程），可在“课程与能力”视图对照培养方案核实课程号。</div>`;
  out.innerHTML = html;
};

// ==================== 视图 6：更新与来源 ====================

function renderUpdates() {
  const m = DM.meta;
  document.getElementById('view-updates').innerHTML = `
    <div class="dm-view-intro">
      <b>可更新 · 有记录：</b>每周至少检查一次地图；重要修改记录“日期、对象、依据、修改内容与原因”。
      未经成员核实的新信息先进入“待核实”，不直接进入正式节点。
    </div>
    <div class="dm-h">更新记录</div>
    ${m.updates.map(u => `
      <div class="dm-update-item">
        <div><span class="u-date">${u.date}</span><span class="u-obj">${u.object}</span>　<span style="font-size:.74rem;color:var(--text-secondary)">记录人：${u.by}</span></div>
        <div class="u-line"><b>依据</b>${u.basis}</div>
        <div class="u-line"><b>修改</b>${u.change}</div>
        <div class="u-line"><b>原因</b>${u.reason}</div>
      </div>
    `).join('')}

    <div class="dm-h">来源清单（${m.sources.length} 条 · 检索日期 2026-10-29）</div>
    ${m.sources.map(s => `
      <div class="dm-src-item">
        <div style="flex:1">
          <div class="s-title">${s.title} <span style="color:var(--text-secondary);font-size:.74rem">— ${s.pub} · ${s.date}</span></div>
          <div class="s-meta">${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${s.url}</a><br>` : ''}核实情况：${s.checked}</div>
        </div>
        <div>${statusBadge(s.status)}</div>
      </div>
    `).join('')}

    <div class="dm-h">当前局限（本组自己标出来的）</div>
    <div class="dm-view-intro" style="border-color:var(--neon-orange)">
      <ul style="margin:0;padding-left:18px">${m.limits.map(l => `<li>${l}</li>`).join('')}</ul>
    </div>

    <div class="dm-h">后续学习入口与计划</div>
    <div class="dm-view-intro" style="border-color:var(--neon-green)">
      <ul style="margin:0;padding-left:18px">${m.nextSteps.map(l => `<li>${l}</li>`).join('')}</ul>
    </div>

    <div class="dm-view-intro" style="border-color:var(--neon-magenta)">
      <b>待补充（期末提交要求）：</b>成员贡献说明 — 每位成员的资料核查 / 内容撰写 / 开发 / 测试 / 组织记录，待各成员确认后在此登记。
    </div>
  `;
}

// ==================== 右侧详情面板 ====================

function updatePanel() {
  const panel = document.getElementById('dmPanel');
  const n = nodeById(DM.currentNode);
  if (!n) {
    panel.innerHTML = `
      <div class="dm-panel-empty">
        <span class="big">◉</span>
        点击左侧任意 <b style="color:var(--neon-cyan)">节点</b>（分层、任务流、课程表、关系图中的彩色名字均可）<br>
        这里会展开：<br>
        它能完成的任务 · 背后的概念 · 使用前需要的知识 · 对应课程 ·
        适用条件与局限 · 替代方案 · 来源与核实状态 · 三张地图的关联
      </div>`;
    return;
  }

  const ly = DM.nodesData.layers[n.layer];
  // 计算指向该节点的关系（入边）
  const incoming = [];
  DM.nodesData.nodes.forEach(other => {
    (other.relations || []).forEach(r => { if (r.to === n.id) incoming.push({ from: other.id, type: r.type, note: r.note }); });
  });

  const eco = (n.maps && n.maps.ecosystem) || [];
  const cog = (n.maps && n.maps.cognitive) || [];

  panel.innerHTML = `
    <h3>${n.name}</h3>
    <div class="p-en">${n.en} · ${ly.name} ${ly.en}</div>
    <div class="p-oneline">${n.oneline}</div>
    <div class="p-badges">${levelBadge(n.level)} ${statusBadge(n.status)}</div>
    ${n.what ? `<div class="p-sec"><div class="p-label">它解释什么</div><div class="p-text">${n.what}</div></div>` : ''}
    ${(n.tasks && n.tasks.length) ? `<div class="p-sec"><div class="p-label">能完成的任务</div><div class="p-text">${n.tasks.map(t => '· ' + t).join('<br>')}</div></div>` : ''}
    ${(n.concepts && n.concepts.length) ? `<div class="p-sec"><div class="p-label">背后概念 / 关联节点</div><div class="p-chips">${n.concepts.map(id => `<span class="p-chip" onclick="dmOpenNode('${id}')">${nodeLabel(id)}</span>`).join('')}</div></div>` : ''}
    ${n.prereq ? `<div class="p-sec"><div class="p-label">使用前需要</div><div class="p-text">${n.prereq}</div></div>` : ''}
    ${(n.courses && n.courses.length) ? `<div class="p-sec"><div class="p-label">对应课程（培养方案 s-zju）</div><div class="p-chips">${n.courses.map(c => courseChip(c)).join('')}</div></div>` : ''}
    ${n.conditions ? `<div class="p-sec"><div class="p-label">适用条件</div><div class="p-text">${n.conditions}</div></div>` : ''}
    ${(n.limits && n.limits.length) ? `<div class="p-sec"><div class="p-label">主要局限</div><div class="p-text" style="color:var(--neon-orange)">${n.limits.map(t => '⚠ ' + t).join('<br>')}</div></div>` : ''}
    ${(n.alternatives && n.alternatives.length) ? `<div class="p-sec"><div class="p-label">替代 / 相关方案</div><div class="p-chips">${n.alternatives.map(id => `<span class="p-chip" onclick="dmOpenNode('${id}')">${nodeLabel(id)}</span>`).join('')}</div></div>` : ''}
    ${((n.relations || []).length || incoming.length) ? `
      <div class="p-sec"><div class="p-label">在关系网中的位置</div>
        <div class="p-text">
          ${(n.relations || []).map(r => `「${n.name}」—${r.type}→「<span style="color:var(--neon-cyan);cursor:pointer" onclick="dmOpenNode('${r.to}')">${nodeLabel(r.to)}</span>」<span style="opacity:.75">${r.note ? '：' + r.note : ''}</span>`).join('<br>')}
          ${incoming.map(r => `「<span style="color:var(--neon-cyan);cursor:pointer" onclick="dmOpenNode('${r.from}')">${nodeLabel(r.from)}</span>」—${r.type}→「${n.name}」<span style="opacity:.75">${r.note ? '：' + r.note : ''}</span>`).join('<br>')}
        </div>
      </div>` : ''}
    ${(n.sources && n.sources.length) ? `
      <div class="p-sec"><div class="p-label">来源（可追溯）</div>
        <div class="p-src">
          ${n.sources.map(sid => {
            const s = (DM.meta.sources || []).find(x => x.id === sid);
            if (!s) return '· ' + sid;
            return `· <a href="${s.url || 'javascript:void(0)'}" ${s.url ? 'target="_blank" rel="noopener"' : ''}>${s.title}</a><br><span style="opacity:.75">　${s.pub} · ${s.date} · ${s.checked}</span>`;
          }).join('<br><br>')}
        </div>
      </div>` : ''}
    ${(eco.length || cog.length) ? `
      <div class="p-sec"><div class="p-label">三张地图的关联</div>
        <div class="p-cross">
          ${eco.length ? `<b>生态地图：</b>${eco.map(e => `<span class="p-chip" onclick="location.hash='#/map/ecosystem'">${e} ↗</span>`).join('')}<br>` : ''}
          ${cog.length ? `<b>认知地图：</b>${cog.map(c => `<span class="p-chip" onclick="location.hash='#/map/cognitive'">${c} ↗</span>`).join('')}` : ''}
        </div>
      </div>` : ''}
    <div style="text-align:right;margin-top:6px">
      <button class="dm-ai-mode" onclick="location.hash='#/map/domain/ai';setTimeout(()=>{dmAiMode('compare');document.getElementById('dmCmpA').value='${n.id}';},80)">与其它路线对比 →</button>
    </div>
  `;
  panel.scrollTop = 0;
}

// 打开节点（保持当前视图，滚动到详情）
window.dmOpenNodeFromHash = function () {};
