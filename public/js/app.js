// ==================== 主页逻辑 ====================

async function loadHome() {
  try {
    const res = await fetch('/api/maps');
    const maps = await res.json();
    
    const container = document.getElementById('mapCards');
    container.innerHTML = '';
    
    const colors = { domain: 'cyan', ecosystem: 'magenta', cognitive: 'green' };
    
    maps.forEach((map, idx) => {
      const card = document.createElement('a');
      card.className = 'map-card';
      card.dataset.map = map.id;
      card.href = `/map/${map.id}`;
      card.innerHTML = `
        <div class="card-number">0${idx + 1}</div>
        <div class="icon">${map.icon}</div>
        <div class="card-title">${map.title}</div>
        <div class="card-subtitle">${map.subtitle || ''}</div>
        <div class="enter-btn">进入地图 →</div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('加载失败:', err);
  }
}

// ==================== 地图详情页逻辑 ====================

async function loadMapDetail(mapId) {
  const homePage = document.getElementById('homePage');
  const detailPage = document.getElementById('mapDetailPage');
  
  homePage.style.display = 'none';
  detailPage.style.display = 'block';
  
  detailPage.innerHTML = `
    <a href="/" class="back-btn">← 返回主页</a>
    <div class="map-detail-container">
      <div class="map-content-area">
        <div class="loader"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
      </div>
      <div class="comment-sidebar">
        <h3>💬 留言反馈</h3>
        <div class="loader"><div class="dot"></div><div class="dot"></div></div>
      </div>
    </div>
  `;

  try {
    const res = await fetch(`/api/maps/${mapId}`);
    const map = await res.json();
    
    renderMapDetail(map);
    loadComments(mapId);
  } catch (err) {
    console.error('加载地图失败:', err);
    detailPage.querySelector('.map-content-area').innerHTML = '<p>加载失败，请刷新重试</p>';
  }
}

function renderMapDetail(map) {
  const detailPage = document.getElementById('mapDetailPage');
  let contentHtml = '';
  
  try {
    const content = JSON.parse(map.content);
    
    if (map.id === 'domain') {
      contentHtml = renderDomainMap(content);
    } else if (map.id === 'ecosystem') {
      contentHtml = renderEcosystemMap(content);
    } else if (map.id === 'cognitive') {
      contentHtml = renderCognitiveMap(content);
    }
  } catch (e) {
    contentHtml = `<p style="color:var(--neon-orange)">内容解析失败，请编辑后重新保存。</p>`;
  }
  
  const colorClass = map.id === 'domain' ? 'var(--neon-cyan)' : 
                     map.id === 'ecosystem' ? 'var(--neon-magenta)' : 
                     'var(--neon-green)';
  
  detailPage.innerHTML = `
    <a href="/" class="back-btn">← 返回主页</a>
    <div class="map-detail-container">
      <div class="map-content-area">
        <div class="map-header">
          <div class="map-icon" style="color:${colorClass}">${map.icon}</div>
          <div>
            <h1 style="color:${colorClass}">${map.title}</h1>
            <div class="map-subtitle">${map.subtitle || ''}</div>
          </div>
          <button class="edit-btn" onclick="toggleEdit()">编辑</button>
        </div>
        
        <div class="map-description">${map.description || ''}</div>
        
        <!-- AI查询面板 -->
        <div class="ai-panel">
          <h3>🤖 AI概念查询</h3>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:12px;">
            输入概念名称，AI将根据三张地图的数据为你检索相关信息（所有回答基于地图内容，不会编造）
          </p>
          <div class="ai-query-box">
            <input type="text" id="aiQueryInput" placeholder="例如：Stable Diffusion、深度学习、系统拆解..." onkeypress="if(event.key==='Enter')aiQuery()">
            <button onclick="aiQuery()">查询</button>
          </div>
          <div class="ai-answer" id="aiAnswer"></div>
        </div>
        
        <!-- 地图内容 -->
        <div id="mapContent">${contentHtml}</div>
        
        <!-- 编辑区域 -->
        <textarea class="edit-area" id="editArea" placeholder="在此粘贴JSON格式的地图内容..."></textarea>
        <div>
          <button class="save-btn" id="saveBtn" onclick="saveMapContent('${map.id}')" style="display:none;">保存</button>
          <button class="save-btn" id="cancelBtn" onclick="toggleEdit()" style="display:none;border-color:var(--neon-orange);color:var(--neon-orange);">取消</button>
        </div>
      </div>
      
      <div class="comment-sidebar">
        <h3>💬 留言反馈</h3>
        <div class="comment-form">
          <input type="text" id="commentAuthor" placeholder="你的昵称" maxlength="20">
          <textarea id="commentContent" placeholder="写下你的问题或评论..." rows="3" maxlength="500"></textarea>
          <button onclick="submitComment('${map.id}')">提交留言</button>
        </div>
        <div class="comment-list" id="commentList">
          <div class="loader"><div class="dot"></div><div class="dot"></div></div>
        </div>
      </div>
    </div>
  `;
  
  // 存储原始内容供编辑使用
  window.currentMapContent = map.content;
  window.currentMapId = map.id;
}

// ==================== 领域地图渲染 ====================

function renderDomainMap(content) {
  let html = '';
  if (content.sections) {
    content.sections.forEach(section => {
      html += `<div class="content-section">
        <h3>${section.title}</h3>`;
      section.items.forEach(item => {
        const levelTag = item.level ? `<span class="tag ${levelClass(item.level)}">${item.level}</span>` : '';
        const courseTags = item.courses ? item.courses.split(',').map(c => `<span class="tag course">📚 ${c.trim()}</span>`).join('') : '';
        html += `
          <div class="content-item">
            <div class="item-name">${item.name}</div>
            <div class="item-detail">${item.detail || ''}</div>
            <div class="item-meta">${levelTag} ${courseTags}</div>
          </div>`;
      });
      html += `</div>`;
    });
  }
  return html;
}

function levelClass(level) {
  if (level.includes('初步理解')) return 'level-understood';
  if (level.includes('尝试')) return 'level-tried';
  if (level.includes('待深入')) return 'level-pending';
  return 'level-understood';
}

// ==================== 生态地图渲染 ====================

function renderEcosystemMap(content) {
  let html = '';
  
  if (content.nodes) {
    html += `<div class="content-section">
      <h3>关键节点</h3>`;
    content.nodes.forEach(node => {
      html += `
        <div class="eco-node">
          <div class="node-name">${node.name} <span class="node-type">${node.type}</span></div>
          <div class="item-detail">主要贡献：${node.contribution || ''}</div>
          <div class="item-detail">入选理由：${node.reason || ''}</div>
        </div>`;
    });
    html += `</div>`;
  }
  
  if (content.edges) {
    html += `<div class="content-section">
      <h3>关系网络</h3>`;
    content.edges.forEach(edge => {
      html += `
        <div class="eco-edge">
          <strong>${edge.from}</strong>
          <span class="edge-relation"> — ${edge.relation}→ </span>
          <strong>${edge.to}</strong>
          <div class="item-detail" style="margin-top:4px;">${edge.detail || ''}</div>
        </div>`;
    });
    html += `</div>`;
  }
  
  return html;
}

// ==================== 认知地图渲染 ====================

function renderCognitiveMap(content) {
  let html = '';
  
  if (content.methods) {
    html += `<div class="content-section">
      <h3>分析方法与案例</h3>`;
    content.methods.forEach(method => {
      html += `
        <div class="cog-method">
          <h4>🔧 ${method.name}</h4>
          <div class="cog-step">
            <div class="step-label">方法说明</div>
            <div class="step-content">${method.description || ''}</div>
          </div>`;
      if (method.case) {
        html += `
          <div class="cog-step">
            <div class="step-label">具体问题</div>
            <div class="step-content">${method.case.problem || ''}</div>
          </div>
          <div class="cog-step">
            <div class="step-label">方法应用</div>
            <div class="step-content">${method.case.method || ''}</div>
          </div>
          <div class="cog-step">
            <div class="step-label">依据与比较</div>
            <div class="step-content">${method.case.basis || ''}</div>
          </div>
          <div class="cog-step">
            <div class="step-label">当前判断</div>
            <div class="step-content">${method.case.judgment || ''}</div>
          </div>
          <div class="cog-step">
            <div class="step-label">尚存疑问</div>
            <div class="step-content" style="color:var(--neon-orange)">❓ ${method.case.doubts || ''}</div>
          </div>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
  }
  
  if (content.revision) {
    const r = content.revision;
    html += `
      <div class="cog-revision">
        <h4>🔄 认识修正记录</h4>
        <div class="revision-step">
          <div class="rev-label">原来以为</div>
          <div class="rev-content">${r.before || ''}</div>
        </div>
        <div class="revision-step">
          <div class="rev-label">什么带来了变化</div>
          <div class="rev-content">${r.trigger || ''}</div>
        </div>
        <div class="revision-step">
          <div class="rev-label">现在如何理解</div>
          <div class="rev-content">${r.after || ''}</div>
        </div>
        <div class="revision-step">
          <div class="rev-label">哪些仍不知道</div>
          <div class="rev-content" style="color:var(--neon-orange)">❓ ${r.unknowns || ''}</div>
        </div>
      </div>`;
  }
  
  return html;
}

// ==================== 留言功能 ====================

async function loadComments(mapId) {
  try {
    const res = await fetch(`/api/maps/${mapId}/comments`);
    const comments = await res.json();
    
    const list = document.getElementById('commentList');
    if (comments.length === 0) {
      list.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;text-align:center;padding:20px;">暂无留言，快来抢沙发！</p>';
      return;
    }
    
    list.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-author">${escapeHtml(c.author)}</div>
        <div class="comment-time">${formatTime(c.createdAt)}</div>
        <div class="comment-content">${escapeHtml(c.content)}</div>
      </div>
    `).join('');
  } catch (err) {
    console.error('加载留言失败:', err);
  }
}

async function submitComment(mapId) {
  const author = document.getElementById('commentAuthor').value.trim();
  const content = document.getElementById('commentContent').value.trim();
  
  if (!author || !content) {
    alert('请填写昵称和留言内容');
    return;
  }
  
  try {
    const res = await fetch(`/api/maps/${mapId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content })
    });
    
    if (res.ok) {
      document.getElementById('commentAuthor').value = '';
      document.getElementById('commentContent').value = '';
      loadComments(mapId);
    }
  } catch (err) {
    alert('提交失败，请重试');
  }
}

// ==================== AI查询功能 ====================

async function aiQuery() {
  const input = document.getElementById('aiQueryInput');
  const query = input.value.trim();
  if (!query) return;
  
  const answerEl = document.getElementById('aiAnswer');
  answerEl.classList.add('active');
  answerEl.innerHTML = '<span style="color:var(--neon-cyan)">AI正在检索地图数据...</span>';
  
  try {
    const res = await fetch('/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    answerEl.innerHTML = data.answer;
  } catch (err) {
    answerEl.innerHTML = '<span style="color:var(--neon-orange)">查询失败，请重试</span>';
  }
}

// ==================== 编辑功能 ====================

function toggleEdit() {
  const editArea = document.getElementById('editArea');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const mapContent = document.getElementById('mapContent');
  
  if (editArea.classList.contains('active')) {
    editArea.classList.remove('active');
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    mapContent.style.display = 'block';
  } else {
    editArea.value = window.currentMapContent || '';
    editArea.classList.add('active');
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
    mapContent.style.display = 'none';
  }
}

async function saveMapContent(mapId) {
  const editArea = document.getElementById('editArea');
  const newContent = editArea.value.trim();
  
  try {
    JSON.parse(newContent); // 验证JSON格式
  } catch (e) {
    alert('JSON格式有误，请检查后重试');
    return;
  }
  
  try {
    const res = await fetch(`/api/maps/${mapId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent })
    });
    
    if (res.ok) {
      alert('保存成功！');
      window.currentMapContent = newContent;
      toggleEdit();
      loadMapDetail(mapId); // 重新加载
    }
  } catch (err) {
    alert('保存失败，请重试');
  }
}

// ==================== 工具函数 ====================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const d = new Date(timeStr + 'Z');
  return d.toLocaleString('zh-CN', { 
    month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit' 
  });
}

// ==================== 路由 ====================

function router() {
  const path = window.location.pathname;
  
  if (path === '/' || path === '') {
    document.getElementById('homePage').style.display = 'flex';
    document.getElementById('mapDetailPage').style.display = 'none';
    loadHome();
  } else if (path.startsWith('/map/')) {
    const mapId = path.split('/')[2];
    if (['domain', 'ecosystem', 'cognitive'].includes(mapId)) {
      loadMapDetail(mapId);
    } else {
      window.location.href = '/';
    }
  } else {
    window.location.href = '/';
  }
}

// 处理浏览器前进/后退
window.addEventListener('popstate', router);

// 拦截所有链接点击，使用pushState实现SPA
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  
  const href = link.getAttribute('href');
  if (!href || href.startsWith('http') || href.startsWith('#')) return;
  
  e.preventDefault();
  window.history.pushState({}, '', href);
  router();
});

// 初始化
router();
