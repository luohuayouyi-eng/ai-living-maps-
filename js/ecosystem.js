// ==================== 生态地图 Ecosystem Map v2.0 ====================
// 数据文件：data/maps.json 中的 ecosystem.content
// 设计原则：与领域地图 v2.0 同构——对象有入选理由、关系有类型与依据、
//          运转有维度案例、内容有来源与核实状态、修改有记录。

const EM = {
  data: null,
  currentView: 'overview',
  currentNode: null   // 当前选中对象（按 name 索引）
};

const EM_VIEWS = ['overview', 'relations', 'dynamics', 'updates'];
const EM_VIEW_NAMES = { overview: '前沿入口', relations: '关系与依据', dynamics: '生态如何运转', updates: '更新与来源' };

const EM_TYPES = [
  { key: '会议', name: '学术会议', q: '领域重要工作在哪里发表？级别依据哪个目录？' },
  { key: '企业', name: '企业与产品团队', q: '谁把能力做成产品？走什么商业模式？' },
  { key: '产品团队', name: '产品团队', q: '谁把模型能力集成进设计工作流？' },
  { key: '实验室', name: '实验室与研究机构', q: '谁在产生奠基性与前沿研究？' },
  { key: '学者', name: '学者', q: '哪个人推动了关键节点？' },
  { key: '独立实验室', name: '独立实验室', q: '小团队如何占据生态位？' },
  { key: '开源社区', name: '开源社区', q: '开放协作如何完成分工？' },
  { key: '非营利组织', name: '非营利组织 / 数据集', q: '公共数据基础设施由谁提供？' },
  { key: '机构', name: '机构 / 研究机构', q: '方法与规范的奠基者是谁？' },
  { key: '参与者', name: '使用者（需求端）', q: '谁在用、谁付费、谁反馈？生态的需求从哪来？' },
  { key: '信息渠道', name: '持续跟踪渠道', q: '从哪里持续获得可靠信息？' }
];

// ==================== 数据加载 ====================

async function emLoad() {
  if (EM.data) return;
  const maps = await fetch('data/maps.json').then(r => r.json());
  EM.data = maps.ecosystem.content;
  EM.typesIndex = {};
  EM.data.nodes.forEach(n => { EM.typesIndex[n.name] = n; });
}

function emObjByName(name) { return EM.typesIndex[name] || null; }

// 端点是否为可点击对象；否则作为纯文本展示（成果/能力指代，如 ControlNet）
function emIsNode(name) { return !!EM.typesIndex[name]; }

function emEndpoint(name, clickable) {
  if (!clickable || !emIsNode(name)) return `<span style="color:var(--text-secondary)">${name}</span>`;
  return `<span class="e-node" onclick="emOpenNode('${name}')">${name}</span>`;
}

function emStatusBadge(status) {
  if (!status) return '';
  const cls = status === '已核实' ? 'st-verified' : status === '待核实' ? 'st-pending' : 'st-infer';
  return `<span class="em-badge ${cls}">${status}</span>`;
}

function emEraBadge(era) {
  if (!era) return '';
  return `<span class="em-badge ${era === '奠基' ? 'era-found' : 'era-active'}">${era === '奠基' ? '🏛 奠基贡献' : '⚡ 当前活跃'}</span>`;
}

function emStatusTag(status) {
  if (!status) return '';
  const cls = status === '已核实' ? 't-verified' : status === '推断' ? 't-infer' : 't-pending';
  return `<span class="em-tag ${cls}">${status}</span>`;
}

// ==================== 入口（由 app.js 调用） ====================

window.renderEcosystemPage = async function () {
  const page = document.getElementById('mapDetailPage');
  try {
    await emLoad();
  } catch (e) {
    page.innerHTML = '<div class="em-app"><p style="color:var(--neon-orange)">生态地图数据加载失败，请刷新重试。</p></div>';
    return;
  }
  if (!document.getElementById('ecosystemApp')) buildEmShell(page);
  emApplyRoute();
};

function buildEmShell(page) {
  const c = EM.data;
  page.innerHTML = `
    <div class="em-app" id="ecosystemApp">
      <a href="#/" class="em-back">← 返回主页</a>
      <div class="em-head">
        <div class="em-icon">🔗</div>
        <div>
          <h1>生态地图 · 智能设计（AI 辅助的产品与交互设计）</h1>
          <div class="em-sub">谁在推动这个领域？技术、资源、商业与产业关系如何运转——每条关系都说明类型与依据。</div>
        </div>
        <div class="em-meta" id="emMeta"></div>
      </div>
      <div class="em-boundary" id="emBoundary"></div>
      <div class="em-tabs" id="emTabs"></div>
      <div class="em-layout">
        <div class="em-main">
          <div class="em-view" id="emview-overview"></div>
          <div class="em-view" id="emview-relations"></div>
          <div class="em-view" id="emview-dynamics"></div>
          <div class="em-view" id="emview-updates"></div>
          <details class="em-comments">
            <summary>💬 留言反馈 — 挑错 / 提问 / 建议补充对象（互评同学请具体到节点或关系）</summary>
            <div class="comment-form" style="margin-top:10px;">
              <input type="text" id="commentAuthor" placeholder="你的昵称" maxlength="20">
              <textarea id="commentContent" placeholder="例如：某某团队也应该入选，理由是什么？这条关系的依据可靠吗？" rows="3" maxlength="500"></textarea>
              <button onclick="submitComment('ecosystem')">提交留言</button>
            </div>
            <div class="comment-list" id="commentList"></div>
          </details>
        </div>
        <aside class="em-panel" id="emPanel"></aside>
      </div>
    </div>
  `;

  document.getElementById('emMeta').innerHTML = `
    <span class="em-badge">${c.meta.version}</span>
    <span class="em-badge">更新 ${c.meta.updated}</span>
    <span class="em-badge">${c.nodes.length} 入口 · ${c.edges.length} 关系 · ${c.dynamics.length} 维度</span>
    <div style="margin-top:6px;font-size:0.72rem;color:var(--text-secondary)">会议级别依据 CCF 推荐目录（2022 发布版）</div>
  `;

  document.getElementById('emBoundary').innerHTML = `
    <div class="b-card"><b>这张图做什么</b>围绕本组选题「智能设计（AI 辅助的产品与交互设计）」整理前沿入口：会议、实验室、学者、企业、开源社区、数据集与信息渠道，并用带依据的关系连线呈现生态运转。</div>
    <div class="b-card"><b>入选标准</b>每个对象说明主要贡献与入选理由，并标注它与领域地图哪个节点相关；不凭知名度排名，区分奠基贡献与当前活跃工作。</div>
    <div class="b-card warn"><b>不声明的事</b>会议级别仅依据 CCF 2022 目录标注；未证实的联系标注为推断；版权诉讼等仅记录事实存在，不提供法律结论。</div>
  `;

  document.getElementById('emTabs').innerHTML = EM_VIEWS.map(v =>
    `<button class="em-tab" data-view="${v}" onclick="emGoView('${v}')">${EM_VIEW_NAMES[v]}</button>`
  ).join('');

  emRenderOverview();
  emRenderRelations();
  emRenderDynamics();
  emRenderUpdates();
}

// ==================== 路由 ====================

function emApplyRoute() {
  const rest = window.__routeRest || [];
  let view = null, objName = null;
  if (rest[0] === 'node') { objName = decodeURIComponent(rest[1] || ''); }
  else if (rest.length && EM_VIEWS.includes(rest[0])) { view = rest[0]; }

  if (objName && emObjByName(objName)) EM.currentNode = objName;
  if (view) EM.currentView = view;

  emSetView(EM.currentView);
  emHighlightChips();
  emUpdatePanel();
}

function emSetView(view) {
  document.querySelectorAll('.em-view').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('emview-' + view);
  if (el) el.classList.add('active');
  document.querySelectorAll('.em-tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  EM.currentView = view;
}

window.emGoView = function (v) {
  window.location.hash = '#/map/ecosystem/' + v;
};

window.emOpenNode = function (name) {
  window.location.hash = '#/map/ecosystem/node/' + encodeURIComponent(name);
};

function emHighlightChips() {
  document.querySelectorAll('.em-chip[data-name]').forEach(ch => {
    ch.classList.toggle('selected', ch.dataset.name === EM.currentNode);
  });
}

// ==================== 视图 1：前沿入口 ====================

function emRenderOverview() {
  const c = EM.data;
  let html = `
    <div class="em-view-intro">
      <b>怎么读这张图：</b>对象按类型分组，每组回答一个观察问题。点击任意对象，右侧会展开它的贡献、入选理由、
      领域地图关联、来源与核实状态。「奠基 / 当前活跃」仅区分时间维度，不是质量排名。
    </div>
  `;
  EM_TYPES.forEach(t => {
    const objs = c.nodes.filter(n => n.type === t.key);
    if (!objs.length) return;
    html += `
      <div class="em-group">
        <div class="em-group-head">
          <span class="g-name">${t.name}</span>
          <span class="g-q">${t.q}</span>
          <span class="g-count">${objs.length} 个对象</span>
        </div>
        <div class="em-chips">
          ${objs.map(n => `<button class="em-chip" data-name="${n.name}" title="${n.contribution}" onclick="emOpenNode('${n.name}')">${n.name}${n.era ? `<small>${n.era}</small>` : ''}</button>`).join('')}
        </div>
      </div>
    `;
  });
  // 兜底：没归入已知类型的对象
  const known = new Set(EM_TYPES.map(t => t.key));
  const rest = c.nodes.filter(n => !known.has(n.type));
  if (rest.length) {
    html += `
      <div class="em-group">
        <div class="em-group-head"><span class="g-name">其他对象</span><span class="g-count">${rest.length} 个</span></div>
        <div class="em-chips">${rest.map(n => `<button class="em-chip" data-name="${n.name}" onclick="emOpenNode('${n.name}')">${n.name}</button>`).join('')}</div>
      </div>
    `;
  }
  html += `
    <div class="em-view-intro" style="border-color:var(--neon-purple)">
      <b>对象之间的关系（谁依赖谁、谁付钱给谁、谁起诉谁）</b>见
      <a href="#/map/ecosystem/relations" style="color:var(--neon-cyan)">关系与依据</a> 视图；
      生态如何运转（商业逻辑 / 产业分工 / 规则责任）见
      <a href="#/map/ecosystem/dynamics" style="color:var(--neon-cyan)">生态如何运转</a> 视图。
    </div>
  `;
  document.getElementById('emview-overview').innerHTML = html;
}

// ==================== 视图 2：关系与依据 ====================

function emRenderRelations() {
  const c = EM.data;
  let html = `
    <div class="em-view-intro">
      <b>关系必须说明类型与依据。</b>每条连线标注 依赖 / 合作 / 起诉 / 付费 / 提出 / 扩展 / 采用 / 托管 / 竞争 / 集成 / 首发 等具体关系，
      并给出依据（论文、官方文档或公开报道）。尚未证实的联系标注为「推断」，不冒充事实。
    </div>
  `;
  c.edges.forEach(e => {
    html += `
      <div class="em-edge">
        ${emEndpoint(e.from, true)}
        <span class="e-rel">— ${e.relation} →</span>
        ${emEndpoint(e.to, true)}
        <div class="e-note">${e.detail || ''}</div>
        <div class="e-meta">
          ${e.basis ? `<span class="em-tag t-basis">📎 依据：${e.basis}</span>` : ''}
          ${emStatusTag(e.status)}
        </div>
      </div>
    `;
  });
  document.getElementById('emview-relations').innerHTML = html;
}

// ==================== 视图 3：生态如何运转 ====================

function emRenderDynamics() {
  const c = EM.data;
  let html = `
    <div class="em-view-intro">
      <b>宏观框架需要具体例子支撑。</b>每个维度按「追问 → 案例 → 依据 → 当前判断 → 尚存疑问」呈现——
      让同学看懂分析过程，而不只是记住结论。维度是观察入口，不必平均展开。
    </div>
  `;
  c.dynamics.forEach(d => {
    html += `
      <div class="em-dyn">
        <h4>${d.dimension}</h4>
        <div class="kv"><b>追问</b><span class="kv-text">${d.question}</span></div>
        <div class="kv"><b>案例</b><span class="kv-text">${d.case}</span></div>
        <div class="kv"><b>依据</b><span class="kv-text">${d.basis}</span></div>
        <div class="kv"><b>当前判断</b><span class="kv-text">${d.judgment}</span></div>
        <div class="kv doubt"><b>尚存疑问</b><span class="kv-text">${d.doubts}</span></div>
      </div>
    `;
  });
  document.getElementById('emview-dynamics').innerHTML = html;
}

// ==================== 视图 4：更新与来源 ====================

function emRenderUpdates() {
  const c = EM.data;
  document.getElementById('emview-updates').innerHTML = `
    <div class="em-view-intro">
      <b>可更新 · 有记录：</b>每周至少检查一次；自动获取的信息先作为待核实线索，经成员检查后再进入正式地图。
      重要修改记录「日期、对象、依据、修改内容与原因」。
    </div>
    <div class="em-h">版本说明</div>
    <div class="em-view-intro">${c.meta.ccfNote}</div>
    <div class="em-h">更新记录</div>
    ${c.updates.map(u => `
      <div class="em-update-item">
        <div><span class="u-date">${u.date}</span><span class="u-obj">${u.object}</span>　<span style="font-size:.74rem;color:var(--text-secondary)">记录人：${u.by}</span></div>
        <div class="u-line"><b>依据</b>${u.basis}</div>
        <div class="u-line"><b>修改</b>${u.change}</div>
        <div class="u-line"><b>原因</b>${u.reason}</div>
      </div>
    `).join('')}
    <div class="em-h">本图来源清单（${c.sources.length} 条）</div>
    ${c.sources.map(s => `
      <div class="em-src-item">
        <div style="flex:1">
          <div class="s-title">${s.id} · ${s.title}</div>
          <div class="s-meta">${s.note || ''}${s.url ? `<br><a href="${s.url}" target="_blank" rel="noopener">${s.url}</a>` : ''}</div>
        </div>
        <div>${emStatusBadge(s.status)}</div>
      </div>
    `).join('')}
    <div class="em-h">局限与边界</div>
    <div class="em-limits">
      ${(c.limits || []).map(l => `<div class="limit-item">▸ ${l}</div>`).join('')}
    </div>
    <div class="em-h">后续计划</div>
    <div class="em-next">
      ${(c.nextSteps || []).map((s, i) => `<div class="next-item"><span class="next-n">${i + 1}</span>${s}</div>`).join('')}
    </div>
    <div class="em-view-intro" style="margin-top:16px;border-color:var(--neon-magenta)">
      <b>与领域地图的关联：</b>本图对象的入选理由均标注了对应的领域地图节点（如 t-sd / p-rights / r-laion），
      可在<a href="#/map/domain" style="color:var(--neon-cyan)">领域地图</a>中查看节点的完整信息、局限与来源。
    </div>
  `;
}

// ==================== 右侧详情面板 ====================

function emUpdatePanel() {
  const panel = document.getElementById('emPanel');
  const n = emObjByName(EM.currentNode);
  if (!n) {
    panel.innerHTML = `
      <div class="em-panel-empty">
        <span class="big">◉</span>
        点击左侧任意 <b style="color:var(--neon-magenta)">对象</b>（入口分组、关系网络中的彩色名字均可）<br>
        这里会展开：<br>
        主要贡献 · 入选理由 · 与领域地图的关联 ·
        奠基 / 当前活跃 · 来源与核实状态 · 与它相连的关系
      </div>`;
    return;
  }

  // 计算与该对象相连的关系
  const rels = EM.data.edges.filter(e => e.from === n.name || e.to === n.name);
  const src = EM.data.sources.find(s => s.id === n.src);

  panel.innerHTML = `
    <h3>${n.name}</h3>
    <div class="p-en">${n.type} ${n.era ? '· ' + n.era : ''}</div>
    <div class="p-oneline">${n.contribution || ''}</div>
    <div class="p-badges">${emEraBadge(n.era)} ${emStatusBadge(n.status)}</div>
    <div class="p-sec"><div class="p-label">入选理由</div><div class="p-text">${n.reason || '—'}</div></div>
    ${n.domain ? `<div class="p-sec"><div class="p-label">领域地图关联</div>
      <div class="p-chips"><span class="p-chip" onclick="location.hash='#/map/domain'">${n.domain} ↗</span></div>
      <div class="p-text" style="margin-top:5px;font-size:.74rem">在领域地图中可查看这些节点的任务、前置知识、课程、局限与来源。</div>
    </div>` : ''}
    ${src ? `<div class="p-sec"><div class="p-label">来源（可追溯）</div>
      <div class="p-text">${src.title}${src.note ? '<br><span style="opacity:.75">' + src.note + '</span>' : ''}</div>
    </div>` : (n.src ? `<div class="p-sec"><div class="p-label">来源（可追溯）</div><div class="p-text">${n.src}</div></div>` : '')}
    ${rels.length ? `
      <div class="p-sec"><div class="p-label">在生态中的位置（${rels.length} 条关系）</div>
        <div class="p-text">
          ${rels.map(e => {
            const iAmFrom = e.from === n.name;
            const other = iAmFrom ? e.to : e.from;
            const arrow = iAmFrom ? `—${e.relation}→` : `←${e.relation}—`;
            const otherHtml = emIsNode(other)
              ? `<span style="color:var(--neon-magenta);cursor:pointer" onclick="emOpenNode('${other}')">${other}</span>`
              : `<span style="color:var(--text-secondary)">${other}</span>`;
            return `「${iAmFrom ? n.name : otherHtml}」${arrow}「${iAmFrom ? otherHtml : n.name}」<span style="opacity:.75">${e.detail ? '：' + e.detail : ''}</span>　${emStatusTag(e.status)}`;
          }).join('<br><br>')}
        </div>
      </div>` : ''}
  `;
  panel.scrollTop = 0;
}
