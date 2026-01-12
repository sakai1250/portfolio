const filterState = { tag: 'all', year: 'all' };

// 目次FABの初期化
function initTOC() {
  const fab = document.getElementById('toc-fab');
  const menu = document.getElementById('toc-menu');
  if (!fab || !menu) return;

  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !fab.contains(e.target)) {
      menu.classList.remove('show');
    }
  });
}

// 目次生成
function updateTOC() {
  const tocNav = document.getElementById('toc-nav');
  if (!tocNav) return;
  tocNav.innerHTML = '';

  const activeTab = document.querySelector('.tab-content.active');
  const sections = [];

  if (activeTab) {
    activeTab.querySelectorAll('.section-card').forEach(sec => sections.push(sec));
  }
  const contact = document.getElementById('contact');
  if (contact) sections.push(contact);

  sections.forEach((sec, index) => {
    if (getComputedStyle(sec).display === 'none') return;
    const title = sec.querySelector('.section-title');
    if (!title) return;

    if (!sec.id) sec.id = `section-${index}-${Math.random().toString(36).substr(2, 5)}`;

    const a = document.createElement('a');
    // 絵文字のみ抽出して表示 (正規表現で絵文字マッチ)
    const emojiMatch = title.textContent.match(/[\p{Emoji}\u200d]+/u);
    a.textContent = emojiMatch ? emojiMatch[0] : title.textContent.charAt(0);
    a.setAttribute('data-title', title.textContent); // CSS吹き出し用にdata属性へ保存
    a.className = 'toc-link';
    a.onclick = (e) => {
      e.preventDefault();
      const header = document.querySelector('.header-bar');
      const offset = header ? header.offsetHeight + 20 : 20;
      const top = sec.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      // メニューを閉じる
      const menu = document.getElementById('toc-menu');
      if (menu) menu.classList.remove('show');
    };
    tocNav.appendChild(a);
  });
}

// タブ切り替え
function switchTab(tabName) {
  const researchTab = document.getElementById('ja-research');
  const engineerTab = document.getElementById('ja-engineer');
  if (!researchTab || !engineerTab) return;

  researchTab.classList.toggle('active', tabName === 'research');
  engineerTab.classList.toggle('active', tabName === 'engineer');

  const navItems = document.querySelectorAll('.tab-nav .tab-item');
  if (navItems.length >= 2) {
    navItems[0].classList.toggle('active', tabName === 'research');
    navItems[1].classList.toggle('active', tabName === 'engineer');
  }
  applyFilters();
}

function jumpToTab(tabName) {
  switchTab(tabName);

  // タブナビゲーションが見える位置へスクロール調整
  const target = document.querySelector('.tab-nav');
  if (!target) return;

  const header = document.querySelector('.header-bar');
  let offset = 16; // 基本の余白
  if (header && getComputedStyle(header).position === 'sticky') {
    offset += header.offsetHeight;
  }

  const elementPosition = target.getBoundingClientRect().top + window.scrollY;
  const offsetPosition = elementPosition - offset;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: offsetPosition, behavior: prefersReduced ? 'auto' : 'smooth' });
}

function getActiveTab() {
  return document.querySelector('.tab-content.active');
}

function applyFilters() {
  const searchInput = document.getElementById('search');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let globalCount = 0;
  const tabCounts = { 'research': 0, 'engineer': 0 };

  // アイテムが所属するタブに応じたフィルタ設定を取得するヘルパー
  const getEffectiveFilters = (item) => {
    const parentTab = item.closest('.tab-content');
    if (!parentTab) return { tag: 'all', year: 'all' };

    const hasTagFilter = Boolean(parentTab.querySelector('.filter-row:not(.year-filter)'));
    const hasYearFilter = Boolean(parentTab.querySelector('.year-filter'));

    return {
      tag: hasTagFilter ? filterState.tag : 'all',
      year: hasYearFilter ? filterState.year : 'all'
    };
  };

  // メインコンテンツ内の全セクションを走査
  const sections = document.querySelectorAll('.main-content .section-card');

  sections.forEach(section => {
    const titleEl = section.querySelector('.section-title');
    const titleText = titleEl ? titleEl.textContent.toLowerCase() : '';
    // セクションタイトルが一致すれば、その中身も（フィルタ条件を満たす限り）表示対象とする
    const isSectionMatch = query && titleText.includes(query);

    const items = section.querySelectorAll('.filterable-item');

    if (items.length > 0) {
      let visibleInThisSection = 0;

      items.forEach(item => {
        const filters = getEffectiveFilters(item);
        const text = item.textContent.toLowerCase();

        // 検索ヒット条件: (クエリなし) OR (アイテム内テキスト一致) OR (親セクションタイトル一致)
        const isItemMatch = !query || text.includes(query) || isSectionMatch;

        // タグ・年度フィルタの適用
        const tags = (item.dataset.tags || '').toLowerCase().split(/\s+/).filter(Boolean);
        const itemYear = item.dataset.year || '';
        const matchesTag = filters.tag === 'all' || tags.includes(filters.tag);
        const matchesYear = filters.year === 'all' || itemYear === filters.year;

        if (isItemMatch && matchesTag && matchesYear) {
          item.style.display = '';
          visibleInThisSection++;

          // タブごとのヒット数を集計
          const tab = item.closest('.tab-content');
          if (tab) {
            if (tab.id === 'ja-research') tabCounts.research++;
            if (tab.id === 'ja-engineer') tabCounts.engineer++;
          }
        } else {
          item.style.display = 'none';
        }
      });

      // 表示アイテムがあればセクションを表示、なければ隠す
      if (visibleInThisSection > 0) {
        section.style.display = '';
        globalCount += visibleInThisSection;
      } else {
        section.style.display = 'none';
      }
    } else {
      // リストを持たない静的セクション（Contactなど）
      if (query) {
        const text = section.textContent.toLowerCase();
        if (text.includes(query)) {
          section.style.display = '';
          globalCount++;
        } else {
          section.style.display = 'none';
        }
      } else {
        section.style.display = '';
      }
    }
  });

  const countEl = document.getElementById('search-count');
  if (countEl) countEl.textContent = globalCount;

  // タブにヒット件数バッジを表示
  const tabs = document.querySelectorAll('.tab-nav .tab-item');
  tabs.forEach(tab => {
    const key = tab.dataset.tab; // 'research' or 'engineer'
    let badge = tab.querySelector('.tab-count');

    if (tabCounts[key] !== undefined && query) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'tab-count';
        badge.style.cssText = 'font-size: 10px; margin-left: 6px; background: var(--surface-3); padding: 2px 6px; border-radius: 10px; vertical-align: middle;';
        tab.appendChild(badge);
      }
      badge.textContent = tabCounts[key];
      badge.style.display = 'inline-block';
    } else if (badge) {
      badge.style.display = 'none';
    }
  });
  updateTOC();
}

function resetFilters(container) {
  container.querySelectorAll('.filter-row .chip').forEach((chip) => {
    if (chip.dataset.filter) {
      chip.classList.toggle('active', chip.dataset.filter === 'all');
    }
    if (chip.dataset.year) {
      chip.classList.toggle('active', chip.dataset.year === 'all');
    }
  });
  filterState.tag = 'all';
  filterState.year = 'all';
}

function initFilters() {
  const container = document.getElementById('content');
  if (!container) return;

  container.querySelectorAll('.repo-list li, .app-card').forEach((item) => {
    item.classList.add('filterable-item');
  });

  const searchInput = document.getElementById('search');
  const clearBtn = document.getElementById('clear');

  if (searchInput) {
    searchInput.addEventListener('input', () => applyFilters());
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        searchInput.value = '';
        applyFilters();
      }
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      resetFilters(container);
      applyFilters();
    });
  }

  const tagRow = container.querySelector('.filter-row:not(.year-filter)');
  if (tagRow) {
    const activeChip = tagRow.querySelector('.chip.active');
    if (activeChip) {
      filterState.tag = activeChip.dataset.filter || 'all';
    }

    tagRow.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        tagRow.querySelectorAll('.chip').forEach((btn) => {
          btn.classList.toggle('active', btn === chip);
        });
        filterState.tag = chip.dataset.filter || 'all';
        applyFilters();
      });
    });
  }

  const yearRow = container.querySelector('.year-filter');
  if (yearRow) {
    const activeChip = yearRow.querySelector('.chip.active');
    if (activeChip) {
      filterState.year = activeChip.dataset.year || 'all';
    }

    yearRow.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        yearRow.querySelectorAll('.chip').forEach((btn) => {
          btn.classList.toggle('active', btn === chip);
        });
        filterState.year = chip.dataset.year || 'all';
        applyFilters();
      });
    });
  }

  // リスト内の年度バッジをクリックした時の処理
  container.querySelectorAll('.badge-year').forEach(badge => {
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      const li = badge.closest('li');
      const year = li ? li.dataset.year : null;

      if (year && yearRow) {
        filterState.year = year;
        yearRow.querySelectorAll('.chip').forEach(chip => {
          chip.classList.toggle('active', chip.dataset.year === year);
        });
        applyFilters();
      }
    });
  });
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.setAttribute('readonly', '');
    temp.style.position = 'absolute';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    temp.select();
    const success = document.execCommand('copy');
    temp.remove();
    if (success) {
      resolve();
    } else {
      reject(new Error('copy failed'));
    }
  });
}

function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = button.dataset.copy;
      if (!text) return;

      const label = button.dataset.label || button.textContent;
      const successLabel = button.dataset.success || 'Copied';
      const errorLabel = button.dataset.error || 'Error';

      try {
        await copyText(text);
        button.textContent = successLabel;
        button.classList.add('success');
        setTimeout(() => {
          button.textContent = label;
          button.classList.remove('success');
        }, 1600);
      } catch (error) {
        button.textContent = errorLabel;
        setTimeout(() => {
          button.textContent = label;
        }, 1600);
      }
    });
  });
}

function initBackToTop() {
  const button = document.getElementById('back-to-top');
  if (!button) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.addEventListener('scroll', () => {
    button.classList.toggle('show', window.scrollY > 320);
  }, { passive: true });

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });
}

function initHeaderNav() {
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.jump;
      if (tabName) jumpToTab(tabName);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    const activeTag = document.activeElement && document.activeElement.tagName;
    if (activeTag && /input|textarea/i.test(activeTag)) return;

    event.preventDefault();
    const searchInput = document.getElementById('search');
    if (searchInput) searchInput.focus();
  });
}

// テーマ切り替え機能
function initTheme() {
  const themeBtn = document.getElementById('theme-toggle');

  // 保存されたテーマ または システム設定を確認
  const savedTheme = localStorage.getItem('theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const initialTheme = savedTheme || systemTheme;

  // アイコンやメタタグの更新のみ行う（属性はhead内で設定済みのため）
  updateThemeAssets(initialTheme);

  // ボタンイベント
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';

      // View Transitions API Support
      if (document.startViewTransition) {
        document.startViewTransition(() => setTheme(next));
      } else {
        setTheme(next);
      }
    });
  }
}

function setTheme(theme) {
  // HTMLタグに属性を設定 (CSS切り替え用)
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeAssets(theme);
}

function updateThemeAssets(theme) {

  // アイコン切り替え
  const themeIcon = document.getElementById('theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'light' ? '☀️' : '🌙';
  }

  // ブラウザのテーマカラー(アドレスバーの色)を更新
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'light' ? '#ffffff' : '#0d1117');
  }

  // GitHub Statsのテーマ更新 (lightならdefault, darkならdracula)
  const statsTheme = theme === 'light' ? 'default' : 'dracula';
  const statsIds = ['stats-langs', 'stats-general'];

  statsIds.forEach(id => {
    const img = document.getElementById(id);
    if (img) {
      const currentSrc = img.src;
      // URLパラメータの theme=... を置換
      const newSrc = currentSrc.replace(/theme=[^&]+/, `theme=${statsTheme}`);
      if (currentSrc !== newSrc) img.src = newSrc;
    }
  });
}

// ヘッダーのスクロール制御 (PCのみ)
function initStickyHeader() {
  const header = document.querySelector('.header-bar');
  if (!header) return;

  const updateHeader = () => {
    // モバイル(768px以下)は処理しない
    if (window.innerWidth <= 768) {
      header.classList.remove('scrolled');
      return;
    }

    // スクロール量に応じてクラス付与
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // ヘッダーの高さをCSS変数にセット（タブナビの位置調整用）
    const height = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--header-height', `${height}px`);
  };

  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader);
  updateHeader(); // 初期実行
}

// 研究業績の「もっと見る」機能
function initShowMore() {
  const researchTab = document.getElementById('ja-research');
  if (!researchTab) return;

  // 「研究業績」セクション内のリストを対象にする
  const lists = researchTab.querySelectorAll('.section-card .repo-list');

  lists.forEach(list => {
    // セクションタイトルを確認（研究業績セクションのみに適用する場合）
    const sectionTitle = list.closest('.section-card').querySelector('.section-title');
    if (!sectionTitle || !sectionTitle.textContent.includes('研究業績')) return;

    const items = list.querySelectorAll('li');
    const threshold = 3; // 3件以上で折りたたむ

    if (items.length > threshold) {
      for (let i = threshold; i < items.length; i++) items[i].classList.add('hidden-item');

      const btnArea = document.createElement('div');
      btnArea.style.cssText = 'text-align: center; margin-top: 12px;';
      btnArea.innerHTML = `<button class="btn btn-sm" style="color: var(--accent-2); border-color: var(--stroke); background: var(--surface-2);">もっと見る</button>`;
      btnArea.querySelector('button').onclick = () => {
        items.forEach(i => i.classList.remove('hidden-item'));
        btnArea.remove();
      };
      list.after(btnArea);
    }
  });
}

// スクロール時のフェードインアニメーション
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

  document.querySelectorAll('.section-card').forEach(section => {
    section.classList.add('reveal-on-scroll');
    observer.observe(section);
  });
}

// ローディング画面
function initLoader() {
  const loader = document.getElementById('loading-screen');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => { loader.classList.add('hidden'); }, 400);
  });
}

// アプリ詳細モーダル
function initAppModal() {
  const modal = document.getElementById('app-modal');
  const closeBtn = modal.querySelector('.modal-close');
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalLinks = document.getElementById('modal-links');
  let lastFocusedElement = null;

  const closeModal = () => {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    if (lastFocusedElement) {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  document.querySelectorAll('.app-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      // リンクをクリックした場合はモーダルを開かない
      if (e.target.closest('a')) return;

      lastFocusedElement = document.activeElement;

      modalImg.src = card.querySelector('.app-thumb').src;
      modalTitle.textContent = card.querySelector('.app-title').textContent;
      modalDesc.textContent = card.querySelector('.app-desc').textContent;
      modalLinks.innerHTML = card.querySelector('.app-links').innerHTML;

      modal.classList.add('open');
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden'; // 背景スクロール防止
      modal.querySelector('.modal-container').focus();
    });
  });
}

// GitHub Actionsで生成されたデータを読み込む
async function loadPortfolioData() {
  const dataUrl = 'assets/data.json';

  try {
    const response = await fetch(dataUrl);
    if (!response.ok) return;
    const data = await response.json();

    // 1. バッジの更新
    const updateBadges = (id, images) => {
      const container = document.getElementById(id);
      if (!container || !images || images.length === 0) return;

      // 既存のバッジをクリアして更新 (h4は見出しとして残す)
      const h4 = container.querySelector('h4');
      container.innerHTML = '';
      if (h4) container.appendChild(h4);

      images.forEach(img => {
        const imgEl = document.createElement('img');
        imgEl.src = img.src;
        imgEl.alt = img.alt;
        imgEl.loading = 'lazy';
        container.appendChild(imgEl);
        container.appendChild(document.createTextNode(' ')); // スペース
      });
    };

    if (data.badges) {
      updateBadges('badges-languages', data.badges['badges-languages']);
      updateBadges('badges-frameworks', data.badges['badges-frameworks']);
      updateBadges('badges-orgs', data.badges['badges-orgs']);
    }

    // 2. アプリ情報の更新
    if (data.apps) {
      document.querySelectorAll('.app-card').forEach(card => {
        const links = card.querySelectorAll('a');
        let repoSlug = null;
        for (const link of links) {
          const match = link.href.match(/github\.com\/([^\/]+\/[^\/]+)/);
          if (match) {
            repoSlug = match[1].replace(/\.git$/, '');
            break;
          }
        }

        if (repoSlug && data.apps[repoSlug]) {
          const appInfo = data.apps[repoSlug];
          const descEl = card.querySelector('.app-desc');
          const imgEl = card.querySelector('.app-thumb');

          if (descEl && appInfo.desc) descEl.textContent = appInfo.desc;
          if (imgEl && appInfo.img) imgEl.src = appInfo.img;
        }
      });
    }

  } catch (e) {
    console.warn('Failed to load portfolio data:', e);
  }
}

// Qiitaの記事取得
async function fetchQiitaArticles() {
  const rssUrl = 'https://qiita.com/sakai1250/feed';
  // rss2json APIを使用してCORSを回避
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const container = document.getElementById('qiita-list');
  if (!container) return;

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.status === 'ok' && data.items.length > 0) {
      container.innerHTML = '';
      data.items.slice(0, 5).forEach(item => { // 最新5件を表示
        const li = document.createElement('li');
        const date = new Date(item.pubDate).toLocaleDateString('ja-JP');

        const link = document.createElement('a');
        link.href = item.link;
        link.target = '_blank';
        link.style.cssText = 'font-weight:600; color:var(--text-main); display:block; margin-bottom:4px;';
        link.textContent = item.title;

        const meta = document.createElement('div');
        meta.className = 'muted';
        meta.textContent = `Qiita | ${date}`;

        li.appendChild(link);
        li.appendChild(meta);
        container.appendChild(li);
      });
    } else {
      container.innerHTML = '<li>記事が見つかりませんでした。</li>';
    }
  } catch (e) {
    container.innerHTML = '<li>読み込みに失敗しました。</li>';
  }
}

// お問い合わせフォーム送信処理
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('form-status');
    const btn = form.querySelector('button[type="submit"]');

    // FormspreeのIDが設定されていない場合の警告
    if (form.action.includes('YOUR_FORM_ID')) {
      // デモモード: ID未設定時は成功したふりをする
      btn.disabled = true;
      btn.textContent = '送信中...';
      await new Promise(resolve => setTimeout(resolve, 1500));
      status.textContent = '送信完了（デモ）: 実際には送信されていません。HTMLのaction属性にFormspree IDを設定してください。';
      status.style.color = 'var(--accent)';
      form.reset();
      btn.disabled = false;
      btn.textContent = '送信する';
      return;
    }

    const data = new FormData(form);
    btn.disabled = true;
    btn.textContent = '送信中...';

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        status.textContent = '送信しました！お問い合わせありがとうございます。';
        status.style.color = 'var(--accent)';
        form.reset();
      } else {
        const result = await response.json();
        if (Object.hasOwn(result, 'errors')) {
          status.textContent = result.errors.map(error => error.message).join(", ");
        } else {
          status.textContent = '送信に失敗しました。再度お試しください。';
        }
        status.style.color = 'var(--accent-warm)';
      }
    } catch (error) {
      status.textContent = 'エラーが発生しました。';
      status.style.color = 'var(--accent-warm)';
    } finally {
      btn.disabled = false;
      btn.textContent = '送信する';
    }
  });
}

// スムーズスクロール (汎用)
function initSmoothScroll() {
  document.querySelectorAll('.scroll-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (!target) return;

      const header = document.querySelector('.header-bar');
      let offset = 16;
      if (header && getComputedStyle(header).position === 'sticky') {
        offset += header.offsetHeight;
      }

      const elementPosition = target.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: offsetPosition, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });
}

// タイピングアニメーション
function initTyping() {
  const textEl = document.getElementById('typing-text');
  if (!textEl) return;

  const texts = ["I'm Taigo Sakai", "Researcher of Deep Learning", "Engineer of iOS / Web"];
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let wait = 2000;

  function type() {
    const current = texts[textIndex];
    if (isDeleting) charIndex--; else charIndex++;
    textEl.textContent = current.substring(0, charIndex);

    let speed = isDeleting ? 50 : 100;
    if (!isDeleting && charIndex === current.length) { speed = wait; isDeleting = true; }
    else if (isDeleting && charIndex === 0) { isDeleting = false; textIndex = (textIndex + 1) % texts.length; speed = 500; }

    setTimeout(type, speed);
  }
  setTimeout(type, 1000);
}

function initTabNav() {
  const tabs = document.querySelectorAll('.tab-nav .tab-item');
  tabs.forEach(tab => {
    // Click event
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      if (target) switchTab(target);
    });
    // Keyboard support (Enter/Space)
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const target = tab.dataset.tab;
        if (target) switchTab(target);
      }
    });
  });
}

function initConsoleMessage() {
  console.log(
    '%c Taigo Sakai %c Portfolio ',
    'background: #2ea043; color: #fff; border-radius: 3px 0 0 3px; padding: 4px 8px; font-weight: bold;',
    'background: #0d1117; color: #fff; border-radius: 0 3px 3px 0; padding: 4px 8px;',
  );
  console.log('%cWelcome to my portfolio! Feel free to check the source code on GitHub.', 'color: #58a6ff; font-size: 12px; margin-top: 4px;');
}

// "Decoding" Text Effect for Header Name
function initHackerEffect() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const element = document.querySelector('.header-name');
  if (!element) return;

  const originalText = element.innerText;

  element.addEventListener('mouseover', event => {
    let iteration = 0;
    clearInterval(element.interval);

    element.interval = setInterval(() => {
      event.target.innerText = originalText
        .split("")
        .map((letter, index) => {
          if (index < iteration) {
            return originalText[index];
          }
          // スペースはそのまま維持
          if (originalText[index] === ' ') return ' ';
          return letters[Math.floor(Math.random() * letters.length)];
        })
        .join("");

      if (iteration >= originalText.length) {
        clearInterval(element.interval);
        event.target.innerText = originalText;
      }

      iteration += 1 / 3;
    }, 30);
  });
}

// Web Share API Integration
function initShare() {
  const shareBtn = document.getElementById('share-btn');
  if (!shareBtn || !navigator.share) return;

  shareBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await navigator.share({
        title: 'Taigo Sakai | Portfolio',
        text: "Check out Taigo Sakai's Portfolio! Deep Learning Researcher & Engineer.",
        url: window.location.href,
      });
    } catch (err) {
      // キャンセル時などは何もしない（フォールバック不要、クリックイベント消費済み）
      console.debug('Share canceled');
    }
  });
}

// 1. Dynamic Last Updated from GitHub API
async function fetchLastUpdated() {
  const dateEl = document.getElementById('last-updated');
  if (!dateEl) return;

  // GitHub Pagesのリポジトリ名を指定 (通常は username.github.io)
  const repo = 'sakai1250/sakai1250.github.io';

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`);
    if (res.ok) {
      const data = await res.json();
      const date = new Date(data[0].commit.committer.date);

      // 2. Modern JS: Relative Time Format (No external libraries)
      const now = new Date();
      const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
      const rtf = new Intl.RelativeTimeFormat('ja', { numeric: 'auto' });
      const relative = rtf.format(diffDays, 'day');

      const dateStr = date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
      dateEl.innerHTML = `${dateStr} <span style="color:var(--muted); font-weight:400;">(${relative})</span>`;
    }
  } catch (e) {
    console.debug('Failed to fetch last updated date');
  }
}

// 2. Web Vitals Logger (Performance Engineering)
function initWebVitals() {
  if (typeof PerformanceObserver === 'undefined') return;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // LCP: Largest Contentful Paint
        if (entry.entryType === 'largest-contentful-paint') {
          console.log(`%c[Web Vitals] LCP: ${Math.round(entry.startTime)}ms`, 'color: #bf3989; font-weight: bold;');
        }
        // CLS: Cumulative Layout Shift
        if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
          console.log(`%c[Web Vitals] CLS: ${entry.value.toFixed(4)}`, 'color: #bf3989; font-weight: bold;');
        }
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) { }
}

// 3. Magnetic Button Effect (UI/UX Engineering)
function initMagneticButtons() {
  const btn = document.querySelector('.header-btn.primary');
  if (!btn) return;

  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // ボタンを中心から少しずらす (磁力のような演出)
    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0, 0)';
  });
}

// 3D Draggable Rotate Effect
function initDraggableCard() {
  const card = document.querySelector('.profile-card');
  if (!card) return;

  let isDragging = false;
  let startX, startY;
  let currentRotateX = 0;
  let currentRotateY = 0;
  let targetRotateX = 0;
  let targetRotateY = 0;

  const onMouseDown = (e) => {
    isDragging = true;
    card.style.cursor = 'grabbing';
    card.style.transition = 'none'; // ドラッグ中は即時反応

    const pageX = e.pageX || e.touches[0].pageX;
    const pageY = e.pageY || e.touches[0].pageY;

    startX = pageX;
    startY = pageY;
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const pageX = e.pageX || e.touches[0].pageX;
    const pageY = e.pageY || e.touches[0].pageY;

    const deltaX = pageX - startX;
    const deltaY = pageY - startY;

    // 感度調整
    targetRotateY = currentRotateY + deltaX * 0.5;
    targetRotateX = currentRotateX - deltaY * 0.5;

    card.style.transform = `perspective(1000px) rotateX(${targetRotateX}deg) rotateY(${targetRotateY}deg)`;
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    card.style.cursor = 'grab';
    // 元の位置に戻す
    currentRotateX = 0; currentRotateY = 0;
    targetRotateX = 0; targetRotateY = 0;

    // 手を離したらゆっくり戻る
    card.style.transition = 'transform 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  };

  // ダブルクリックでリセット
  card.addEventListener('dblclick', () => {
    currentRotateX = 0;
    currentRotateY = 0;
    targetRotateX = 0;
    targetRotateY = 0;
    card.style.transition = 'transform 0.5s ease';
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  });

  card.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  card.addEventListener('touchstart', onMouseDown, { passive: false });
  window.addEventListener('touchmove', onMouseMove, { passive: false });
  window.addEventListener('touchend', onMouseUp);
}

// Draggable Avatar with Tooltip
function initDraggableAvatar() {
  const avatar = document.querySelector('.header-top img');
  if (!avatar) return;

  avatar.style.cursor = 'grab';
  avatar.style.zIndex = '1000';
  avatar.style.position = 'relative';

  let isDragging = false;
  let startX, startY;
  let tooltip = null;

  const createTooltip = () => {
    const el = document.createElement('div');
    el.className = 'drag-tooltip';
    document.body.appendChild(el);
    return el;
  };

  const updateTooltip = (x, y) => {
    if (!tooltip) tooltip = createTooltip();

    // アバターを一時的に非表示にして下の要素を判定
    const prevDisplay = avatar.style.display;
    avatar.style.display = 'none';
    const elemBelow = document.elementFromPoint(x, y);
    avatar.style.display = prevDisplay;

    let text = 'ここは...';
    if (elemBelow) {
      if (elemBelow.closest('.header-bar')) text = 'ここは「ヘッダー」だよ';
      else if (elemBelow.closest('.profile-sidebar')) text = 'ここは「プロフィール」だよ';
      else if (elemBelow.closest('#ja-research')) text = 'ここは「研究業績」だよ';
      else if (elemBelow.closest('#ja-engineer')) text = 'ここは「開発実績」だよ';
      else if (elemBelow.closest('#contact')) text = 'ここは「お問い合わせ」だよ';
      else if (elemBelow.closest('.footer')) text = 'ここは「フッター」だよ';
      else text = 'ここは「ページ背景」だよ';
    }

    tooltip.textContent = text;
    const rect = avatar.getBoundingClientRect();
    tooltip.style.left = `${rect.right}px`;
    tooltip.style.top = `${rect.top}px`;
    tooltip.classList.add('visible');
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    isDragging = true;
    avatar.style.cursor = 'grabbing';
    avatar.style.transition = 'none';
    startX = e.pageX || e.touches[0].pageX;
    startY = e.pageY || e.touches[0].pageY;
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    const pageX = e.pageX || e.touches[0].pageX;
    const pageY = e.pageY || e.touches[0].pageY;
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    avatar.style.transform = `translate(${pageX - startX}px, ${pageY - startY}px) scale(1.1)`;
    updateTooltip(clientX, clientY);
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    avatar.style.cursor = 'grab';
    avatar.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    avatar.style.transform = 'translate(0, 0) scale(1)';
    if (tooltip) tooltip.classList.remove('visible');
  };

  avatar.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  avatar.addEventListener('touchstart', onMouseDown, { passive: false });
  window.addEventListener('touchmove', onMouseMove, { passive: false });
  window.addEventListener('touchend', onMouseUp);
}

// 3. Network Status Monitor (Resilience)
function initNetworkStatus() {
  const showToast = (msg, type) => {
    let toast = document.getElementById('network-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'network-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === 'error' ? 'var(--accent-warm)' : 'var(--accent)';
    toast.style.color = '#fff';
    toast.classList.add('show');

    if (type === 'success') {
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  };

  window.addEventListener('offline', () => showToast('オフラインモード: 接続を確認してください', 'error'));
  window.addEventListener('online', () => showToast('オンラインに復帰しました', 'success'));
}

function initKonami() {
  // Konami Code: Up, Up, Down, Down, Left, Right, Left, Right, B, A
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let cursor = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key === code[cursor]) {
      cursor++;
      if (cursor === code.length) {
        console.log('%c★ Konami Code Activated! ★', 'color: #f78166; font-size: 20px; font-weight: bold;');
        document.body.style.transition = 'transform 1s ease';
        document.body.style.transform = 'rotate(360deg)'; // 画面が一回転する演出
        setTimeout(() => { document.body.style.transform = 'none'; }, 1000);
        cursor = 0;
      }
    } else {
      cursor = 0;
    }
  });
}

// Click Sparkle Effect
function initSparkles() {
  document.addEventListener('click', (e) => {
    // Trigger on interactive elements
    if (!e.target.closest('button, a, .chip, .badge-year, .app-card, .profile-card, .nav-btn')) return;

    const colors = [
      'var(--accent)', 'var(--accent-2)', 'var(--accent-warm)', '#FFD700', '#FF69B4'
    ];

    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.classList.add('sparkle');

      const x = e.clientX;
      const y = e.clientY;

      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];

      const angle = Math.random() * Math.PI * 2;
      const velocity = 20 + Math.random() * 40;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;

      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);

      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 600);
    }
  });
}

// 自動スクロール機能
function initAutoScroll() {
  let isAutoScrolling = true;
  let animationId = null;
  let lastEncounteredSection = null;

  const stopAutoScroll = () => {
    isAutoScrolling = false;
    if (animationId) cancelAnimationFrame(animationId);
    document.querySelectorAll('.highlight-active').forEach(el => el.classList.remove('highlight-active'));
    ['wheel', 'mousedown', 'touchstart', 'touchmove', 'keydown'].forEach(event => {
      window.removeEventListener(event, stopAutoScroll);
    });
  };

  ['wheel', 'mousedown', 'touchstart', 'touchmove', 'keydown'].forEach(event => {
    window.addEventListener(event, stopAutoScroll, { passive: true });
  });

  const highlightItems = () => {
    const nav = document.querySelector('.tab-nav');
    const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
    const targetY = navBottom + 60;

    const targets = document.querySelectorAll('.tab-content.active .repo-list li, .tab-content.active .app-card');
    const toHighlight = [];
    const toUnhighlight = [];

    targets.forEach(el => {
      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      if (Math.abs(elCenter - targetY) < 60) {
        toHighlight.push(el);
      } else {
        toUnhighlight.push(el);
      }
    });

    toHighlight.forEach(el => el.classList.add('highlight-active'));
    toUnhighlight.forEach(el => el.classList.remove('highlight-active'));
  };

  const step = () => {
    if (!isAutoScrolling) return;

    // "もっと見る"ボタンの自動クリック
    const currentTab = document.querySelector('.tab-content.active');
    if (currentTab) {
      const showMoreBtns = currentTab.querySelectorAll('button');
      showMoreBtns.forEach(btn => {
        if (btn.textContent.includes('もっと見る')) {
          const rect = btn.getBoundingClientRect();
          if (rect.top < window.innerHeight) btn.click();
        }
      });
    }

    highlightItems();

    // セクションタイトルでの一時停止
    const nav = document.querySelector('.tab-nav');
    const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
    const checkY = navBottom + 30;
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
      const sections = activeTab.querySelectorAll('.section-title');
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top >= checkY && rect.top < checkY + 10 && lastEncounteredSection !== section) {
          lastEncounteredSection = section;
          section.classList.add('flash-active');
          setTimeout(() => section.classList.remove('flash-active'), 1000);
          setTimeout(() => { if (isAutoScrolling) step(); }, 1200);
          return;
        }
      }
    }

    // Contactセクション到達または最下部でループ
    const contactSection = document.getElementById('contact');
    let isEnd = false;
    if (contactSection && contactSection.getBoundingClientRect().top <= window.innerHeight) isEnd = true;
    if (!isEnd && (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2) isEnd = true;

    if (isEnd) {
      setTimeout(() => {
        if (!isAutoScrolling) return;
        const researchTab = document.getElementById('ja-research');
        if (researchTab && researchTab.classList.contains('active')) switchTab('engineer');
        else switchTab('research');
        window.scrollTo(0, 0);
        lastEncounteredSection = null;
        setTimeout(() => { if (isAutoScrolling) step(); }, 1000);
      }, 2000);
      return;
    }

    window.scrollBy(0, 2.4);
    animationId = requestAnimationFrame(step);
  };

  window.addEventListener('load', () => {
    setTimeout(() => {
      if (isAutoScrolling && window.scrollY < 50) step();
    }, 2000);
  });
}

// 初期化
(function init() {
  initTheme();
  initFilters();
  initCopyButtons();
  initBackToTop();
  initHeaderNav();
  initStickyHeader();
  initShowMore();
  initScrollReveal();
  initAppModal();
  initLoader();
  loadPortfolioData();
  fetchQiitaArticles();
  initContactForm();
  initSmoothScroll();
  initTyping();
  initTabNav();
  applyFilters();
  initConsoleMessage();
  initHackerEffect();
  initShare();
  initKonami();
  fetchLastUpdated();
  initWebVitals();
  initMagneticButtons();
  initDraggableCard();
  initDraggableAvatar();
  initNetworkStatus();
  initAutoScroll();
  initSparkles();
  initTOC();
})();