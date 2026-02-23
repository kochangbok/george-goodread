import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'georges-goodreads-library-v2';
const DEFAULT_AUTHOR = '미지정';
const AMBIGUITY_HINT = /\b(maybe|perhaps|likely|roughly|about|around|approximately|arguably|usually|could|might|appear to|appears to|generally|possibly|presumably|seems|seem to|appears)\b/i;
const EXTRACT_PARAGRAPH_MAX = 1700;

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
    description: 'URL 기반 전문 추출 후 한국어 번역 업로드',
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
  notes: '',
  rawText: '',
  fileName: '',
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

const splitTextByLength = (text, max = EXTRACT_PARAGRAPH_MAX) => {
  const raw = text.trim();
  if (!raw) return [];
  const lines = raw.split('\n');
  const chunks = [];
  let current = '';

  for (const line of lines) {
    const segment = line.trim();
    if (!segment) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      continue;
    }
    if (segment.length > max) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      for (let i = 0; i < segment.length; i += max) {
        chunks.push(segment.slice(i, i + max));
      }
      continue;
    }
    if (current.length + segment.length + 1 > max) {
      chunks.push(current.trim());
      current = segment;
      continue;
    }
    current = current ? `${current}\n${segment}` : segment;
  }

  if (current) chunks.push(current.trim());
  return chunks;
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

const extractAmbiguityNotes = (text) => {
  return (
    text
      .toString()
      .replace(/\r/g, '')
      .replace(/\n+/g, ' ')
      .match(/[^.!?]+[.!?]*/g)
      ?.map((item) => item.trim())
      .filter((item) => item.length > 24 && AMBIGUITY_HINT.test(item))
      .slice(0, 3)
      .map((line) => {
        const safeLine = line.length > 120 ? `${line.slice(0, 120)}...` : line;
        return `(원문: "${safeLine.replace(/"/g, '\\"')}")`;
      }) ?? []
  );
};

async function translateWithGoogle(text) {
  if (!text.trim()) return text;
  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error('번역 API 호출 실패');
  }
  const payload = await response.json();
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) return text;
  return payload[0]
    .map((part) => part?.[0] ?? '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
};

async function translateToKorean(fullText, manualNotes) {
  const splitToSentences = (text) =>
    text
      .replace(/\r/g, '')
      .replace(/\n+/g, ' ')
      .match(/[^.!?]+[.!?]*/g)
      ?.map((item) => item.trim())
      .filter(Boolean) ?? [];

  const chunks = splitTextByLength(fullText);
  const translatedBlocks = [];
  for (const chunk of chunks) {
    const sentences = splitToSentences(chunk);
    const translatedSentences = [];
    const sourceSentences = sentences.length ? sentences : [chunk];
    for (const sentence of sourceSentences) {
      if (!sentence.trim()) continue;
      const translated = await translateWithGoogle(sentence);
      const line = AMBIGUITY_HINT.test(sentence)
        ? `${translated} (원문: "${sentence.replace(/"/g, '\\"')}")`
        : translated;
      translatedSentences.push(line);
      await new Promise((resolve) => setTimeout(resolve, 90));
    }
    translatedBlocks.push(translatedSentences.join('\n\n'));
  }

  const merged = translatedBlocks.join('\n\n');
  const ambiguity = extractAmbiguityNotes(fullText).join('\n\n');
  const cleanManual = manualNotes
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `(역자 주. "${line.replace(/"/g, '\\"')}")`)
    .join('\n');
  const appendix = [ambiguity, cleanManual].filter(Boolean).join('\n\n');
  return `${merged}${appendix ? `\n\n${appendix}` : ''}`;
}

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

function buildOverseasMarkdown({ title, sourceUrl, author, translatedBody }) {
  const href = normalizeUrl(sourceUrl);
  let host = '미확인';
  try {
    host = new URL(href).hostname;
  } catch {
    // keep fallback
  }

  return `# ${title}\n\n- 원문 링크: ${href}\n- 저자: ${author || DEFAULT_AUTHOR}\n- 출처: ${host}\n- 영어 원문: [링크](${href})\n\n## 번역본\n\n${translatedBody}\n\n---\n\n원문 링크와 저자만 보존하고, 전체 본문을 빠짐없이 자연스러운 한국어로 번역한 결과입니다.`;
}

function buildDomesticMarkdown({ title, sourceUrl, summary }) {
  return `# ${title}\n\n- 리다이렉트 링크: ${sourceUrl}\n\n${summary || '요약이 비어 있습니다.'}`;
}

function buildYoutubeMarkdown({ sourceUrl, sourceName, summary, markdown }) {
  if (markdown?.trim()) return markdown;
  return `# 유튜브 콘텐츠 요약\n\n- 출처 링크: ${sourceUrl}\n- 채널: ${sourceName || '미지정'}\n\n${summary || '요약이 비어 있습니다.'}`;
}

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
      tags,
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
    if (!adminForm.rawText.trim() && !adminForm.summary.trim()) {
      setAdminMessage('원문 텍스트가 비어 있습니다. URL 추출 또는 본문 입력이 필요합니다.');
      return;
    }
    try {
      setAdminBusy(true);
      setAdminMessage('번역/정규화 중...');
      const sourceText = adminForm.rawText.trim() || adminForm.summary.trim();
      const sourceTitle = pickTitleFromText(sourceText, adminForm.sourceUrl);
      const translated = await translateToKorean(sourceText, adminForm.notes);
      const title = adminForm.title.trim() || sourceTitle;
      const markdown = buildOverseasMarkdown({
        title,
        sourceUrl: normalizeUrl(adminForm.sourceUrl),
        author: adminForm.author.trim() || DEFAULT_AUTHOR,
        translatedBody: translated,
      });
      setAdminGenerated(markdown);
      setAdminDownloadName(safeFileName(`${title}-overseas-article`));
      setAdminMessage('번역 마크다운 생성 완료');
    } catch (error) {
      console.error(error);
      setAdminMessage('번역 생성에 실패했습니다.');
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

  const handleYoutubeFile = async (event) => {
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
      setAdminMessage('유튜브 요약 .md 업로드 완료');
    } catch (error) {
      console.error(error);
      setAdminMessage('.md 파일을 읽는 동안 오류가 발생했습니다.');
    }
  };

  const handleSaveAdmin = () => {
    if (adminForm.mode === 'article') {
      if (!adminGenerated) {
        setAdminMessage('해외 article는 번역 마크다운을 먼저 생성해야 합니다.');
        return;
      }
      buildItemAndSave({
        id: `admin-${Date.now()}`,
        title: adminForm.title.trim() || '해외 article',
        category: adminForm.category,
        type: 'article',
        source: adminForm.source || '해외 article',
        sourceUrl: normalizeUrl(adminForm.sourceUrl),
        summary: adminGenerated,
        tags: parseTags(adminForm.tags),
      });
      setAdminMessage('해외 article가 라이브러리에 저장되었습니다.');
      return;
    }

    if (adminForm.mode === 'naver') {
      if (!adminForm.sourceUrl.trim() || !adminGenerated) {
        setAdminMessage('국내 article는 요약 링크 생성 후 저장하세요.');
        return;
      }
      buildItemAndSave({
        id: `admin-${Date.now()}`,
        title: adminForm.title.trim() || '국내 article',
        category: adminForm.category,
        type: 'naver',
        source: adminForm.source || '국내 article',
        sourceUrl: normalizeUrl(adminForm.sourceUrl),
        summary: adminGenerated,
        tags: parseTags(adminForm.tags),
      });
      setAdminMessage('국내 article가 라이브러리에 저장되었습니다.');
      return;
    }

    if (!adminGenerated || !adminForm.sourceUrl.trim()) {
      setAdminMessage('유튜브는 .md 업로드 후 저장하세요.');
      return;
    }

    buildItemAndSave({
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
    });
    setAdminMessage('유튜브 요약이 라이브러리에 저장되었습니다.');
  };

  const handleSaveAndDownload = () => {
    if (!adminGenerated) {
      setAdminMessage('저장 전 마크다운이 먼저 생성되어야 합니다.');
      return;
    }
    downloadMarkdown();
    handleSaveAdmin();
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
              <p>URL + 전문 + 번역 생성 후 .md 업로드 저장</p>
              <p className="md-guide-title">국내 article</p>
              <p>요약 + 리다이렉트 링크만 등록</p>
              <p className="md-guide-title">유튜브</p>
              <p>요약 `.md` 파일을 업로드</p>
            </div>
          </aside>
        </main>
      ) : (
        <section className="panel admin-panel">
          <h2>콘텐츠 업로드 관리자</h2>
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
                      buildYoutubeMarkdown({ sourceUrl: adminForm.sourceUrl, sourceName: adminForm.source, markdown: adminForm.summary }),
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
                      해외 URL 원문 추출
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={handleGenerateForArticle}
                      disabled={adminBusy || (!adminForm.rawText.trim() && !adminForm.summary.trim())}
                    >
                      번역.md 생성
                    </button>
                  </div>
                  <label className="form-row">
                    원문(자동 추출 실패 시 붙여넣기)
                    <textarea
                      name="rawText"
                      value={adminForm.rawText}
                      onChange={handleAdminField}
                      rows={12}
                      placeholder="url 추출 후 본문이 들어옵니다. 필요하면 직접 붙여넣어도 됩니다."
                    />
                  </label>
                  <label className="form-row">
                    번역 보조 메모 (문장 뒤에 역자주로 반영)
                    <textarea
                      name="notes"
                      value={adminForm.notes}
                      onChange={handleAdminField}
                      rows={4}
                      placeholder="예: 핵심 문장의 배경 설명 필요\n예: 용어는 그대로 두는 게 맞음"
                    />
                  </label>
                  <p className="muted">
                    프롬프트 기반 처리 규칙:
                    <br />
                    이 글 전문 full text를 한 문장도 빼지 말고 번역하며, 가능한 의역을 사용하고, 모호한 표현은 (원문: "...") / (역자 주. "...") 형식으로 처리합니다.
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
                    <input type="file" accept=".md,text/markdown" onChange={handleYoutubeFile} />
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
                  파일 저장 + 저장
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

          {adminMessage ? <p className="muted status">{adminMessage}</p> : null}
          {adminBusy ? <p className="muted">작업 중...</p> : null}
        </section>
      )}
    </div>
  );
}
