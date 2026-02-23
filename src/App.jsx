import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'georges-goodreads-library-v2';
const ADMIN_SESSION_KEY = 'georges-goodreads-admin-session-v1';
const ADMIN_SESSION_TTL_MS = 3 * 60 * 60 * 1000;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';
const DEFAULT_AUTHOR = '미지정';
const AUTO_GITHUB_PUBLISH = (import.meta.env.VITE_AUTO_GITHUB_PUBLISH || 'false').toLowerCase() === 'true';

const CATEGORY_OPTIONS = [
  { id: 'ai', label: 'ai, 바이브코딩' },
  { id: 'crypto', label: '크립토, 트레이딩, 투자' },
  { id: 'society', label: '경제, 사회' },
  { id: 'life', label: '삶, 건강' },
];

const FILTER_CATEGORIES = [{ id: 'all', label: '전체' }, ...CATEGORY_OPTIONS];

const TYPE_OPTIONS = [
  {
    id: 'article',
    label: '해외 article',
    icon: '🌍',
    color: '#79d18e',
    description: '원문 링크 + md 복붙/업로드',
  },
  {
    id: 'youtube',
    label: '유튜브',
    icon: '▶️',
    color: '#7fc9f4',
    description: '요약 .md 파일 업로드',
  },
  {
    id: 'naver',
    label: '국내 article',
    icon: '🖋️',
    color: '#e7b75f',
    description: '요약 + 리다이렉트 링크 업로드',
  },
];

const seedLibrary = [
  {
    id: 'seed-01',
    title: 'AI 에이전트 보안 체크리스트',
    category: 'ai',
    type: 'article',
    source: 'reddit',
    sourceUrl: 'https://www.reddit.com/r/MachineLearning/',
    tags: ['AI', '보안', '체크리스트'],
    summary: `# AI 에이전트 보안 체크리스트\n\n해외 글을 기반으로 번역한 정리본입니다.\n\n- 입력 검증부터 시작해야 합니다.\n- 툴 호출 범위를 제한해야 합니다.\n- 로그와 추적 포인트를 항상 남겨야 합니다.`,
    createdAt: '2026-02-17T07:00:00.000Z',
  },
  {
    id: 'seed-02',
    title: '유튜브 콘텐츠 분석 리포트',
    category: 'crypto',
    type: 'youtube',
    source: 'YouTube',
    sourceUrl: 'https://www.youtube.com/',
    tags: ['트레이딩', '분석', '리포트'],
    summary: `# 영상 분석 리포트\n\n이 영상은 전략 수립 전에 점검할 위험 항목을 다루고 있습니다.\n\n- 진입 규칙\n- 손절 규칙\n- 감정 통제`,
    createdAt: '2026-02-16T10:20:00.000Z',
  },
  {
    id: 'seed-03',
    title: '경제 뉴스 해설',
    category: 'society',
    type: 'naver',
    source: 'Naver',
    sourceUrl: 'https://blog.naver.com/',
    tags: ['경제', '해설'],
    summary: `# 국내 아티클 요약\n\n핵심 요약만 정리해 놓은 국내 글입니다.\n\n- 지표 해석 시 분모를 확인한다.\n- 헤드라인은 방향성만 보지 않는다.`,
    createdAt: '2026-02-15T14:00:00.000Z',
  },
];

const ADMIN_MODE_DEFAULT = {
  mode: 'article',
  category: 'ai',
  title: '',
  sourceUrl: '',
  source: '',
  author: '',
  tags: '',
  summary: '',
  rawText: '',
  fileName: '',
};

const getAdminSession = () => {
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.until || !session?.token) return null;
    if (session.until < Date.now()) {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

const saveAdminSession = () => {
  try {
    window.localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({
        token: `${ADMIN_PASSWORD || 'legacy'}`,
        until: Date.now() + ADMIN_SESSION_TTL_MS,
      }),
    );
  } catch {
    // ignore
  }
};

const clearAdminSession = () => {
  try {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // ignore
  }
};

const parseTags = (raw) =>
  raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const applyInlineMarkdown = (value) => {
  return value
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
};

const markdownToHtml = (markdown) => {
  const source = escapeHtml(markdown);
  const lines = source.split('\n');
  let html = '';
  let inUl = false;
  const closeList = () => {
    if (inUl) {
      html += '</ul>';
      inUl = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    let match = trimmed.match(/^###\s+(.*)$/);
    if (match) {
      closeList();
      html += `<h3>${match[1]}</h3>`;
      continue;
    }

    match = trimmed.match(/^##\s+(.*)$/);
    if (match) {
      closeList();
      html += `<h2>${match[1]}</h2>`;
      continue;
    }

    match = trimmed.match(/^#\s+(.*)$/);
    if (match) {
      closeList();
      html += `<h1>${match[1]}</h1>`;
      continue;
    }

    match = trimmed.match(/^- (.*)$/);
    if (match) {
      if (!inUl) {
        html += '<ul>';
        inUl = true;
      }
      html += `<li>${applyInlineMarkdown(match[1])}</li>`;
      continue;
    }

    match = trimmed.match(/^>\s*(.*)$/);
    if (match) {
      closeList();
      html += `<blockquote>${applyInlineMarkdown(match[1])}</blockquote>`;
      continue;
    }

    match = trimmed.match(/^\[(.)\]\s+(.*)$/);
    if (match) {
      closeList();
      html += `<p><span class="md-check">[${match[1]}]</span> ${applyInlineMarkdown(match[2])}</p>`;
      continue;
    }

    closeList();
    html += `<p>${applyInlineMarkdown(trimmed)}</p>`;
  }

  closeList();
  return html || '<p class="muted">내용이 비어 있습니다.</p>';
};

const MarkdownBlock = ({ markdown }) => {
  const html = useMemo(() => markdownToHtml(markdown), [markdown]);
  return <div className="markdown-block" dangerouslySetInnerHTML={{ __html: html }} />;
};

const truncate = (value, max = 160) => {
  const raw = String(value || '').replace(/\n/g, ' ').trim();
  return raw.length > max ? `${raw.slice(0, max - 3)}...` : raw;
};

const normalizeUrl = (url) => {
  const value = url.trim();
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const safeFileName = (value) => {
  const fallback = 'george-goodreads-content';
  return `${String(value || fallback).replace(/[^a-zA-Z0-9가-힣._-]/g, '_').slice(0, 45)}.md`;
};

const normalizeExtracted = (text) => {
  return String(text)
    .replace(/\r/g, '')
    .replace(/(?:^|\n)Source:\s*.*$/gm, '')
    .replace(/(?:^|\n)Date:\s*.*$/gm, '')
    .replace(/(?:^|\n)Url:\s*.*$/gm, '')
    .replace(/(?:^|\n)From:\s*.*$/gm, '')
    .replace(/^\s+|\s+$/g, '')
    .trim();
};

const pickTitleFromText = (sourceText, fallbackUrl) => {
  const candidate = sourceText
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && line.length > 1 && line.length < 120 && !/^[#-]/.test(line));
  if (candidate) return candidate.replace(/^#+\s*/, '');
  try {
    const url = new URL(normalizeUrl(fallbackUrl));
    return `${url.hostname} 콘텐츠 요약`;
  } catch {
    return '해외 article 번역';
  }
};

async function fetchArticleText(url) {
  const normalized = normalizeUrl(url);
  const cleaned = normalized.replace(/^https?:\/\//i, '');
  const endpoint = `https://r.jina.ai/http://${cleaned}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`본문 추출 실패: ${response.status}`);
  }
  const raw = await response.text();
  return normalizeExtracted(raw);
}

function buildOverseasMarkdown({ title, sourceUrl, author, markdownBody }) {
  const href = normalizeUrl(sourceUrl);
  let host = '미확인';
  try {
    host = new URL(href).hostname;
  } catch {
    // keep fallback
  }

  const normalizedBody = String(markdownBody || '').trim();
  const finalBody = normalizedBody || '요약이 비어 있습니다.';
  const hasSourceMeta = /^\s*-\s*원문 링크:\s*/m.test(normalizedBody);
  if (hasSourceMeta) {
    return normalizedBody;
  }
  return `# ${title}\n\n- 원문 링크: ${href}\n- 저자: ${author || DEFAULT_AUTHOR}\n- 출처: ${host}\n\n${finalBody}`;
}

function buildDomesticMarkdown({ title, sourceUrl, summary }) {
  return `# ${title}\n\n- 리다이렉트 링크: ${sourceUrl}\n\n${summary || '요약이 비어 있습니다.'}`;
}

function buildYoutubeMarkdown({ sourceUrl, sourceName, summary, markdown }) {
  if (markdown?.trim()) return markdown;
  return `# 유튜브 콘텐츠 요약\n\n- 출처 링크: ${sourceUrl}\n- 채널: ${sourceName || '미지정'}\n\n${summary || '요약이 비어 있습니다.'}`;
}

const buildGitHubPath = (title, sourceUrl) => {
  const prefix = new Date().toISOString().slice(0, 10);
  const safe = safeFileName(title || 'content').replace(/\.md$/, '');
  const origin = (() => {
    try {
      return new URL(sourceUrl).hostname.replace(/[^\w.-]/g, '-');
    } catch {
      return 'source';
    }
  })();
  return `${prefix}/${origin}-${safe}-${Date.now()}.md`;
};

const publishToGitHub = async (payload) => {
  const response = await fetch('/api/publish-content', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || 'GitHub 업로드 실패');
  }

  return body;
};

export default function App() {
  const [library, setLibrary] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return seedLibrary;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) return parsed;
      return seedLibrary;
    } catch {
      return seedLibrary;
    }
  });

  const [viewMode, setViewMode] = useState('feed');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [query, setQuery] = useState('');
  const [openItems, setOpenItems] = useState({});
  const [adminForm, setAdminForm] = useState(ADMIN_MODE_DEFAULT);
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminGenerated, setAdminGenerated] = useState('');
  const [adminDownloadName, setAdminDownloadName] = useState('contents.md');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthenticated, setAdminAuthenticated] = useState(() => Boolean(getAdminSession()));

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }, [library]);

  const totalByCategory = useMemo(() => {
    const map = CATEGORY_OPTIONS.reduce((acc, cur) => {
      acc[cur.id] = 0;
      return acc;
    }, {});
    library.forEach((row) => {
      if (map[row.category] !== undefined) map[row.category] += 1;
    });
    return map;
  }, [library]);

  const totalByType = useMemo(() => {
    const map = TYPE_OPTIONS.reduce((acc, cur) => {
      acc[cur.id] = 0;
      return acc;
    }, {});
    library.forEach((row) => {
      if (map[row.type] !== undefined) map[row.type] += 1;
    });
    return map;
  }, [library]);

  const filteredItems = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return library
      .filter((item) => {
        if (activeCategory !== 'all' && item.category !== activeCategory) return false;
        if (activeType !== 'all' && item.type !== activeType) return false;
        if (!needle) return true;
        const haystack = `${item.title} ${item.source} ${item.summary} ${item.tags?.join(' ')}`.toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [activeCategory, activeType, library, query]);

  const toggleOpen = (id) => setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const removeItem = (id) => {
    if (!window.confirm('정말 삭제할까요?')) return;
    setLibrary((prev) => prev.filter((item) => item.id !== id));
    setOpenItems((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const buildItemAndSave = ({ id, title, category, type, source, sourceUrl, summary, tags }) => {
    if (!title.trim() || !summary.trim()) return;
    setLibrary((prev) => [
      {
        id,
        title: title.trim(),
        category,
        type,
        source: source.trim() || sourceUrl || '미지정',
        sourceUrl: sourceUrl.trim(),
        summary: summary.trim(),
        tags: tags || [],
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const downloadMarkdown = () => {
    if (!adminGenerated) return;
    const blob = new Blob([adminGenerated], {
      type: 'text/markdown;charset=utf-8',
    });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = adminDownloadName;
    link.click();
    URL.revokeObjectURL(href);
  };

  const resetAdminForm = (mode = adminForm.mode) => {
    const nextCategory = mode === 'article' ? adminForm.category : adminForm.category || 'ai';
    setAdminForm({
      ...ADMIN_MODE_DEFAULT,
      mode,
      category: nextCategory,
    });
    setAdminGenerated('');
    setAdminMessage('');
    setAdminDownloadName('contents.md');
  };

  const handleAdminField = (event) => {
    const { name, value } = event.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminMode = (mode) => {
    resetAdminForm(mode);
  };

  const adminPasswordValid = (value) => {
    if (ADMIN_PASSWORD) return value === ADMIN_PASSWORD;
    return value === 'admin1234';
  };

  const handleAdminLogin = (event) => {
    event.preventDefault();
    if (!adminPassword.trim()) {
      setAdminMessage('비밀번호를 입력하세요.');
      return;
    }
    if (!adminPasswordValid(adminPassword.trim())) {
      setAdminMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    saveAdminSession();
    setAdminAuthenticated(true);
    setAdminMessage('관리자 인증이 완료되었습니다.');
    setAdminPassword('');
  };

  const handleAdminLogout = () => {
    clearAdminSession();
    setAdminAuthenticated(false);
    setAdminMessage('로그아웃 되었습니다.');
  };

  const handleFetchSourceText = async () => {
    if (!adminForm.sourceUrl.trim()) {
      setAdminMessage('해외 article url이 필요합니다.');
      return;
    }
    try {
      setAdminBusy(true);
      setAdminMessage('원문을 가져오는 중...');
      const fullText = await fetchArticleText(adminForm.sourceUrl);
      setAdminForm((prev) => ({ ...prev, rawText: fullText }));
      if (!adminForm.title.trim()) {
        const titleFromSource = pickTitleFromText(fullText, adminForm.sourceUrl);
        setAdminForm((prev) => ({ ...prev, title: titleFromSource }));
      }
      setAdminMessage(`원문 추출 완료 (${fullText.length}자)`);
    } catch (error) {
      console.error(error);
      setAdminMessage('원문 추출에 실패했습니다. 원문 텍스트를 직접 붙여주세요.');
    } finally {
      setAdminBusy(false);
    }
  };

  const handleGenerateForArticle = async () => {
    if (!adminForm.sourceUrl.trim()) {
      setAdminMessage('해외 article url이 필요합니다.');
      return;
    }
    if (!adminForm.summary.trim()) {
      setAdminMessage('번역본 .md 내용을 붙여넣거나 파일 업로드해주세요.');
      return;
    }
    try {
      setAdminBusy(true);
      setAdminMessage('마크다운 정리 중...');
      const sourceTitle = adminForm.title.trim() || pickTitleFromText(adminForm.summary, adminForm.sourceUrl);
      if (!adminForm.title.trim()) {
        setAdminForm((prev) => ({ ...prev, title: sourceTitle }));
      }
      const markdown = buildOverseasMarkdown({
        title: sourceTitle,
        sourceUrl: normalizeUrl(adminForm.sourceUrl),
        author: adminForm.author.trim() || DEFAULT_AUTHOR,
        markdownBody: adminForm.summary,
      });
      setAdminGenerated(markdown);
      setAdminDownloadName(adminForm.fileName ? safeFileName(adminForm.fileName) : safeFileName(`${sourceTitle}-overseas-article`));
      setAdminMessage('해외 article 마크다운 생성 완료');
    } catch (error) {
      console.error(error);
      setAdminMessage('마크다운 생성에 실패했습니다.');
    } finally {
      setAdminBusy(false);
    }
  };

  const handleGenerateDomestic = () => {
    if (!adminForm.sourceUrl.trim() || !adminForm.summary.trim()) {
      setAdminMessage('국내 article의 경우 링크와 요약이 필요합니다.');
      return;
    }
    const title = adminForm.title.trim() || '국내 article';
    const markdown = buildDomesticMarkdown({
      title,
      sourceUrl: normalizeUrl(adminForm.sourceUrl),
      summary: adminForm.summary,
    });
    setAdminGenerated(markdown);
    setAdminDownloadName(safeFileName(`${title}-korea-article`));
    setAdminMessage('국내 article 마크다운 생성 완료');
  };

  const handleMarkdownFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/markdown' && !file.name.endsWith('.md')) {
      setAdminMessage('업로드는 .md 파일만 지원합니다.');
      return;
    }

    try {
      const raw = await file.text();
      if (!raw.trim()) {
        setAdminMessage('.md 파일이 비어 있습니다.');
        return;
      }
      setAdminForm((prev) => ({
        ...prev,
        summary: raw,
        fileName: file.name,
      }));
      setAdminGenerated(raw);
      setAdminDownloadName(file.name || 'youtube-summary.md');
      setAdminMessage('요약 .md 업로드 완료');
    } catch (error) {
      console.error(error);
      setAdminMessage('.md 파일을 읽는 동안 오류가 발생했습니다.');
    }
  };

  const publishMarkdownToGitHub = async (entry, markdownText) => {
    if (!AUTO_GITHUB_PUBLISH) return null;
    const filePath = buildGitHubPath(entry.title, entry.sourceUrl || entry.source);
    const payload = {
      filePath,
      content: markdownText,
      commitMessage: `${entry.type}: ${entry.title}`,
      branch: import.meta.env.VITE_GITHUB_BRANCH || 'main',
      tags: entry.tags || [],
      category: entry.category,
      source: entry.source,
      sourceUrl: entry.sourceUrl,
    };
    return publishToGitHub(payload);
  };

  const handleSaveAdmin = async () => {
    if (!adminGenerated) {
      setAdminMessage('저장할 markdown가 먼저 생성되어야 합니다.');
      return;
    }

    let entry;
    if (adminForm.mode === 'article') {
      entry = {
        id: `admin-${Date.now()}`,
        title: adminForm.title.trim() || '해외 article',
        category: adminForm.category,
        type: 'article',
        source: adminForm.source || '해외 article',
        sourceUrl: normalizeUrl(adminForm.sourceUrl),
        summary: adminGenerated,
        tags: parseTags(adminForm.tags),
      };
    } else if (adminForm.mode === 'naver') {
      entry = {
        id: `admin-${Date.now()}`,
        title: adminForm.title.trim() || '국내 article',
        category: adminForm.category,
        type: 'naver',
        source: adminForm.source || '국내 article',
        sourceUrl: normalizeUrl(adminForm.sourceUrl),
        summary: adminGenerated,
        tags: parseTags(adminForm.tags),
      };
    } else {
      if (!adminForm.sourceUrl.trim()) {
        setAdminMessage('유튜브는 링크 입력과 .md 생성이 필요합니다.');
        return;
      }
      entry = {
        id: `admin-${Date.now()}`,
        title: adminForm.title.trim() || '유튜브 요약',
        category: adminForm.category,
        type: 'youtube',
        source: adminForm.source || 'YouTube',
        sourceUrl: normalizeUrl(adminForm.sourceUrl),
        summary: buildYoutubeMarkdown({
          sourceUrl: normalizeUrl(adminForm.sourceUrl),
          sourceName: adminForm.source,
          markdown: adminGenerated,
        }),
        tags: parseTags(adminForm.tags),
      };
    }

    if (!entry.sourceUrl) {
      setAdminMessage('저장할 때 링크는 필수입니다.');
      return;
    }

    setAdminBusy(true);
    try {
      buildItemAndSave({
        id: entry.id,
        title: entry.title,
        category: entry.category,
        type: entry.type,
        source: entry.source,
        sourceUrl: entry.sourceUrl,
        summary: entry.summary,
        tags: entry.tags,
      });
      setAdminMessage('콘텐츠가 라이브러리에 저장되었습니다.');

      if (AUTO_GITHUB_PUBLISH) {
        try {
          const result = await publishMarkdownToGitHub(entry, entry.summary);
          if (result?.commit) {
            setAdminMessage('콘텐츠 저장 + GitHub 커밋 완료.');
          } else {
            setAdminMessage('콘텐츠 저장 완료. GitHub 자동 업로드는 비활성입니다.');
          }
        } catch (error) {
          console.error(error);
          setAdminMessage(`콘텐츠 저장은 완료되었지만 GitHub 업로드 실패: ${error.message}`);
        }
      }
    } finally {
      setAdminBusy(false);
    }
  };

  const handleSaveAndDownload = async () => {
    if (!adminGenerated) {
      setAdminMessage('저장 전 마크다운이 먼저 생성되어야 합니다.');
      return;
    }
    downloadMarkdown();
    await handleSaveAdmin();
  };

  return (
    <div className="app-shell">
      <header className="panel hero">
        <p className="eyebrow">George&apos;s Goodreads</p>
        <div className="hero-title-row">
          <h1>george&apos;s goodreads</h1>
          <span className="hero-count">{library.length}개 콘텐츠</span>
        </div>
        <p className="hero-desc">
          내가 좋다고 생각한 콘텐츠를 카테고리/형식별로 저장해 관리하는 큐레이션 페이지입니다.
        </p>

        <div className="view-switch" role="tablist" aria-label="뷰 전환">
          <button
            type="button"
            className={`chip ${viewMode === 'feed' ? 'is-active' : ''}`}
            onClick={() => setViewMode('feed')}
          >
            콘텐츠 뷰
          </button>
          <button
            type="button"
            className={`chip ${viewMode === 'admin' ? 'is-active' : ''}`}
            onClick={() => setViewMode('admin')}
          >
            관리자 업로드
          </button>
        </div>
      </header>

      <section className="panel controls">
        <div className="control-row">
          <label htmlFor="query-input">검색</label>
          <input
            id="query-input"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목, 출처, 태그"
          />
        </div>

        <div className="control-group">
          <div className="control-label">카테고리</div>
          <div className="chip-row">
            {FILTER_CATEGORIES.map((category) => {
              const active = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  className={`chip ${active ? 'is-active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.label}
                  {category.id !== 'all' ? ` (${totalByCategory[category.id] || 0})` : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="control-group">
          <div className="control-label">콘텐츠 타입</div>
          <div className="chip-row">
            <button
              type="button"
              className={`chip ${activeType === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveType('all')}
            >
              전체
            </button>
            {TYPE_OPTIONS.map((type) => {
              const active = activeType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  className={`chip ${active ? 'is-active' : ''}`}
                  onClick={() => setActiveType(type.id)}
                >
                  {type.label} ({totalByType[type.id] || 0})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {viewMode === 'feed' ? (
        <main className="content-layout">
          <section className="panel feed-panel">
            <div className="feed-head">
              <h2>보관 중인 콘텐츠</h2>
              <p className="muted">
                {filteredItems.length}개
                {activeCategory !== 'all' && ` · ${FILTER_CATEGORIES.find((c) => c.id === activeCategory)?.label}`}
                {activeType !== 'all' && ` · ${TYPE_OPTIONS.find((t) => t.id === activeType)?.label}`}
                {query && ` · 검색: ${query}`}
              </p>
            </div>
            {filteredItems.length === 0 ? (
              <p className="muted empty-text">조건에 맞는 항목이 없습니다.</p>
            ) : (
              <div className="card-stack">
                {filteredItems.map((item) => {
                  const type = TYPE_OPTIONS.find((entry) => entry.id === item.type) ?? TYPE_OPTIONS[0];
                  const category = CATEGORY_OPTIONS.find((entry) => entry.id === item.category)?.label ?? '기타';
                  const isOpen = !!openItems[item.id];
                  return (
                    <article key={item.id} className="item-card">
                      <div className="item-head">
                        <span className="type-chip" style={{ borderColor: type.color }}>
                          <span>{type.icon}</span>
                          {type.label}
                        </span>
                        <span className="item-date">{formatDate(item.createdAt)}</span>
                      </div>
                      <h3>{item.title}</h3>
                      <div className="item-meta">
                        <span className="meta-pill">{category}</span>
                        <span className="muted">출처: {item.source || '미지정'}</span>
                      </div>
                      <p className="excerpt">
                        {isOpen ? (
                          <MarkdownBlock markdown={item.summary} />
                        ) : (
                          truncate(item.summary, 180)
                        )}
                      </p>
                      <p className="muted tags-row">
                        {item.tags.map((tag) => `#${tag}`).join(' ') || '태그 없음'}
                      </p>
                      <div className="item-actions">
                        <button type="button" className="btn" onClick={() => toggleOpen(item.id)}>
                          {isOpen ? '닫기' : '마크다운 열기'}
                        </button>
                        {item.sourceUrl ? (
                          <a className="btn ghost" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                            원문 열기
                          </a>
                        ) : null}
                        <button type="button" className="btn danger" onClick={() => removeItem(item.id)}>
                          삭제
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          <aside className="panel composer">
            <h2>업로드 가이드</h2>
            <p className="muted">관리자 페이지에서 타입별로 업로드하세요.</p>
            <div className="md-guide">
              <p className="md-guide-title">해외 article</p>
              <p>원문 링크 + 번역본 md 붙여넣기 또는 업로드</p>
              <p className="md-guide-title">국내 article</p>
              <p>요약 + 리다이렉트 링크만 등록</p>
              <p className="md-guide-title">유튜브</p>
              <p>요약 `.md` 파일을 업로드</p>
            </div>
          </aside>
        </main>
      ) : (
        <section className="panel admin-panel">
          <div className="admin-head-row">
            <h2>콘텐츠 업로드 관리자</h2>
            {adminAuthenticated ? (
              <button type="button" className="btn" onClick={handleAdminLogout}>
                로그아웃
              </button>
            ) : null}
          </div>
          {adminAuthenticated ? (
            <>
              <p className="muted">타입을 선택하고 조건에 맞게 업로드하면 `.md`를 자동 생성/다운로드할 수 있습니다.</p>

              <div className="admin-mode-switch">
                {TYPE_OPTIONS.map((mode) => {
                  const active = adminForm.mode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      className={`chip ${active ? 'is-active' : ''}`}
                      onClick={() => {
                        setAdminForm((prev) => ({ ...ADMIN_MODE_DEFAULT, mode: mode.id, category: prev.category || 'ai' }));
                        setAdminGenerated('');
                        setAdminMessage('');
                        setAdminDownloadName('contents.md');
                      }}
                    >
                      {mode.label}
                      <span className="admin-mode-note">{mode.description}</span>
                    </button>
                  );
                })}
              </div>

              <div className="admin-grid">
                <form
                  className="admin-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (adminForm.mode === 'article') {
                      handleGenerateForArticle();
                    } else if (adminForm.mode === 'naver') {
                      handleGenerateDomestic();
                    } else if (adminForm.mode === 'youtube') {
                      if (adminForm.summary.trim()) {
                        setAdminGenerated(
                          buildYoutubeMarkdown({
                            sourceUrl: adminForm.sourceUrl,
                            sourceName: adminForm.source,
                            markdown: adminForm.summary,
                          }),
                        );
                        setAdminMessage('유튜브 요약 미리보기 준비됨');
                      } else {
                        setAdminMessage('유튜브 `.md` 파일을 업로드하세요.');
                      }
                    }
                  }}
                >
                  <label className="form-row">
                    카테고리
                    <select name="category" value={adminForm.category} onChange={handleAdminField}>
                      {CATEGORY_OPTIONS.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-row">
                    제목
                    <input
                      name="title"
                      value={adminForm.title}
                      onChange={handleAdminField}
                      placeholder="콘텐츠 제목"
                    />
                  </label>

                  <label className="form-row">
                    링크
                    <input
                      name="sourceUrl"
                      value={adminForm.sourceUrl}
                      onChange={handleAdminField}
                      placeholder="https://..."
                    />
                  </label>

                  <label className="form-row">
                    출처/채널명
                    <input
                      name="source"
                      value={adminForm.source}
                      onChange={handleAdminField}
                      placeholder="reddit, X, YouTube, Naver ... "
                    />
                  </label>

                  <label className="form-row">
                    태그(쉼표)
                    <input
                      name="tags"
                      value={adminForm.tags}
                      onChange={handleAdminField}
                      placeholder="AI, 트레이딩, 건강"
                    />
                  </label>

                  {adminForm.mode === 'article' && (
                    <>
                      <label className="form-row">
                        저자
                        <input
                          name="author"
                          value={adminForm.author}
                          onChange={handleAdminField}
                          placeholder="원문 저자"
                        />
                      </label>
                      <div className="form-row two-cols">
                        <button
                          type="button"
                          className="btn"
                          onClick={handleFetchSourceText}
                          disabled={adminBusy}
                        >
                          원문 링크에서 제목만 추출(선택)
                        </button>
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={handleGenerateForArticle}
                          disabled={adminBusy || !adminForm.summary.trim()}
                        >
                          마크다운 생성
                        </button>
                      </div>
                      <label className="form-row">
                        번역 .md 업로드
                        <input type="file" accept=".md,text/markdown" onChange={handleMarkdownFileUpload} />
                      </label>
                      <label className="form-row">
                        번역 .md 붙여넣기
                        <textarea
                          name="summary"
                          value={adminForm.summary}
                          onChange={handleAdminField}
                          rows={12}
                          placeholder="해외 article 번역본 마크다운을 붙여넣으세요."
                        />
                      </label>
                      <p className="muted">
                        번역된 최종 마크다운을 붙여넣으면 제목은 그대로 저장됩니다.
                        제목 자동 추출이 필요하면 먼저 제목 가져오기 버튼을 눌러보세요.
                      </p>
                    </>
                  )}

                  {adminForm.mode === 'naver' && (
                    <label className="form-row">
                      요약
                      <textarea
                        name="summary"
                        value={adminForm.summary}
                        onChange={handleAdminField}
                        rows={12}
                        placeholder="요약 문단만 입력하세요."
                      />
                    </label>
                  )}

                  {adminForm.mode === 'youtube' && (
                    <>
                      <label className="form-row">
                        요약 .md 파일 업로드
                        <input type="file" accept=".md,text/markdown" onChange={handleMarkdownFileUpload} />
                      </label>
                      <label className="form-row">
                        업로드 예외 텍스트(직접 붙여넣기)
                        <textarea
                          name="summary"
                          value={adminForm.summary}
                          onChange={handleAdminField}
                          rows={10}
                          placeholder="# 제목\n요약 내용..."
                        />
                      </label>
                    </>
                  )}

                  <div className="admin-actions">
                    <button type="submit" className="btn btn-submit">
                      미리보기 생성
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={handleSaveAdmin}
                      disabled={adminBusy || !adminGenerated}
                    >
                      저장만
                    </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={handleSaveAndDownload}
                  disabled={adminBusy || !adminGenerated}
                >
                  md 다운로드 + 저장
                </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleAdminMode(adminForm.mode)}
                    >
                      초기화
                    </button>
                  </div>
                </form>

                <aside className="admin-preview">
                  <div className="feed-head" style={{ marginBottom: 8 }}>
                    <h3>생성된 .md</h3>
                    <span className="item-date">저장 전 미리보기</span>
                  </div>
                  <div className="admin-preview-box">
                    {adminGenerated ? (
                      <MarkdownBlock markdown={adminGenerated} />
                    ) : (
                      <p className="muted">여기에 생성된 마크다운이 표시됩니다.</p>
                    )}
                  </div>

                  <div className="admin-download-row">
                    <button
                      type="button"
                      className="btn btn-submit"
                      onClick={downloadMarkdown}
                      disabled={!adminGenerated}
                    >
                      md 다운로드
                    </button>
                    <input
                      type="text"
                      className="download-name"
                      value={adminDownloadName}
                      onChange={(event) => setAdminDownloadName(event.target.value)}
                      placeholder="파일명.md"
                    />
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <form className="admin-auth" onSubmit={handleAdminLogin}>
              <h3>관리자 인증</h3>
              <p className="muted">관리자 페이지 접근을 위해 비밀번호를 입력해주세요.</p>
              <label className="form-row">
                관리자 비밀번호
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  placeholder={ADMIN_PASSWORD ? '비밀번호' : '기본 비밀번호: admin1234'}
                />
              </label>
              <div className="admin-actions">
                <button type="submit" className="btn btn-submit">
                  인증하기
                </button>
              </div>
              {!ADMIN_PASSWORD ? (
                <p className="muted">
                  운영에서는 VITE_ADMIN_PASSWORD 환경변수를 설정하면 보안을 강화할 수 있습니다.
                </p>
              ) : null}
            </form>
          )}

          {adminMessage ? <p className="muted status">{adminMessage}</p> : null}
          {adminBusy ? <p className="muted">작업 중...</p> : null}
        </section>
      )}
    </div>
  );
}
