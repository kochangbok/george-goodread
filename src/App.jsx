import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'georges-goodreads-library-v1';

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
    label: '해외 article 번역',
    icon: '🌏',
    color: '#79d18e',
  },
  {
    id: 'youtube',
    label: '유튜브 분석 리포트',
    icon: '▶️',
    color: '#7fc9f4',
  },
  {
    id: 'naver',
    label: '좋은 네이버 블로그',
    icon: '✍️',
    color: '#e7b75f',
  },
];

const initialDraft = {
  title: '',
  category: 'ai',
  type: 'article',
  source: '',
  sourceUrl: '',
  summary: '',
  tags: '',
};

const seedLibrary = [
  {
    id: 'seed-ai-01',
    title: 'AI 에이전트와 보안: Reddit에서 본 실전 적용 포인트',
    category: 'ai',
    type: 'article',
    source: 'Reddit /r/MachineLearning',
    sourceUrl: 'https://www.reddit.com/r/MachineLearning/',
    tags: ['AI', '보안', '에이전트'],
    summary: `# 핵심 요약\n\n해외 포럼에서 나온 최신 AI 에이전트 운영 팁을 번역한 내용입니다.\n\n## 주요 포인트\n- **에이전트 간 계약(Contract)**을 먼저 정의하면 장애 전파를 줄일 수 있습니다.\n- **실행 로그(trace)** 를 남기면 책임 소재 추적이 쉬워집니다.\n- 입력값 검증 없이 외부 함수를 호출하면 리스크가 급격히 커집니다.\n\n> 실무 포인트: \n> 1) 고정된 도메인에서만 tool call 허용\n> 2) 실패 시 복구 플랜을 미리 넣기\n> 3) 출력 포맷을 강제하여 후속 파싱 신뢰도 확보\n\n결론적으로, AI 코드를 빠르게 붙이기보다 **실험 조건을 코드화**해두는 쪽이 훨씬 중요합니다.`,
    createdAt: '2026-02-17T09:15:00.000Z',
  },
  {
    id: 'seed-ai-02',
    title: '바이브코딩 프로젝트: LLM을 활용한 자동 문서화 워크플로우',
    category: 'ai',
    type: 'youtube',
    source: 'YouTube - 실무AI톡',
    sourceUrl: 'https://www.youtube.com/watch?v=K4JX8JrQk5M',
    tags: ['바이브코딩', 'LLM', '자동화'],
    summary: `# 영상 분석 리포트\n\n이 영상은 "아이디어-요청-테스트"로 AI 문서화를 구조화하는 방법을 다룹니다.\n\n## 분석 요약\n- 아이디어를 5줄 템플릿으로 정제하면 품질 편차가 줄어듭니다.\n- 모델에게 반드시 "출력 형식"과 "반례"를 함께 제시해야 합니다.\n- 리포트는 생성 즉시 신뢰하지 말고, 체크리스트에 통과 시점 추가가 필요합니다.\n\n## 적용 체크리스트\n- [x] 요구사항 -> 테스트 케이스 -> 실패 사례 분리\n- [x] 출력 포맷 (JSON, YAML, Markdown) 확정\n- [ ] 배포 전 스모크 테스트 자동화`,
    createdAt: '2026-02-15T18:40:00.000Z',
  },
  {
    id: 'seed-ai-03',
    title: '개발자가 알아두면 좋은 AI 논문 메모 정리 글',
    category: 'ai',
    type: 'naver',
    source: 'Naver Blog',
    sourceUrl: 'https://blog.naver.com/',
    tags: ['paper', '요약', '프롬프트'],
    summary: `# 네이버 블로그 리다이렉트\n\n실제 글의 아이디어만 참고용으로 정리한 페이지입니다.\n\n## 읽고 정리한 점\n- 논문을 바로 읽지 못할 때, 핵심 개념을 먼저 뽑고 용어 사전을 만든다.\n- 실험 수치보다 **재현 가능 조건**을 우선 확인한다.\n- 한국어로 번역할 때 용어를 하나로 고정해야 오해가 줄어든다.`,
    createdAt: '2026-02-10T13:20:00.000Z',
  },
  {
    id: 'seed-crypto-01',
    title: 'On-Chain 데이터로 보는 변동성 확대 구간',
    category: 'crypto',
    type: 'article',
    source: 'Twitter/X - finance signal',
    sourceUrl: 'https://x.com/',
    tags: ['트레이딩', '온체인', '변동성'],
    summary: `# 번역 포인트\n\n해외 트위터 스레드 중심으로 정리한 실전 리포트입니다.\n\n## 요약\n- 금리 사이클 전환 국면에서는 변동성 피크가 먼저 나타난다.\n- 단기 유입/유출보다 **지갑 집적도 변화**가 더 강한 선행 신호가 될 수 있다.\n- 레버리지 포지션 비율이 높아질수록 급락 구간에서 동조성이 커진다.\n\n\`공포/탐욕 지표\`를 무조건 추종하지 말고, 가격 지표와 함께 보는 것이 안전합니다.`,
    createdAt: '2026-02-12T07:50:00.000Z',
  },
  {
    id: 'seed-crypto-02',
    title: '주요 암호화폐 트레이딩 전략 정리',
    category: 'crypto',
    type: 'youtube',
    source: 'YouTube - TraderLab',
    sourceUrl: 'https://www.youtube.com/watch?v=9xS8fV6hN0I',
    tags: ['리스크', '포지션', '스탑로스'],
    summary: `# 영상 분석\n\n영상 내용의 핵심만 압축했습니다.\n\n## 체크포인트\n- 레버리지 2배 이상 구간에서는 손절 규칙을 자동화할 것\n- 수익이 쌓이는 구간에서도 청산선을 먼저 확인\n- 변동성 급등 구간은 진입보다 **청산 시그널 처리**가 더 중요\n\n예시 규칙:\n- 목표 수익률 1.5배 이상에서 30% 축소\n- 하락 모멘텀 시 12틱 간격 재진입 금지`,
    createdAt: '2026-02-14T21:05:00.000Z',
  },
  {
    id: 'seed-society-01',
    title: '정치·경제 뉴스의 데이터 해석 프레임 정리',
    category: 'society',
    type: 'article',
    source: 'Reddit Economy',
    sourceUrl: 'https://www.reddit.com/r/economics/',
    tags: ['경제', '통계', '해석'],
    summary: `# 해외 이코노미 포스트 번역\n\n숫자만 보고 과대해석할 수 있는 대표적 함정을 지적합니다.\n\n## 핵심\n- 기저율(베이스)과 증분률(변화율)을 분리해야 한다.\n- 헤드라인은 종종 방향성만 남기므로 **정책 문맥**을 반드시 읽어야 함\n- 월별/분기별 차이를 섞으면 추세 판단이 틀어진다`,
    createdAt: '2026-02-11T11:05:00.000Z',
  },
  {
    id: 'seed-life-01',
    title: '수면 품질을 올리는 루틴 30일 실험',
    category: 'life',
    type: 'naver',
    source: 'Naver Blog',
    sourceUrl: 'https://blog.naver.com/',
    tags: ['건강', '수면', '루틴'],
    summary: `# 네이버 블로그 추천 콘텐츠\n\n좋은 습관은 규칙성이 전부입니다.\n\n## 실천 포인트\n- **고정 기상 시간**: 기저 시간대를 잡으면 체내 리듬이 빠르게 안정화\n- 카페인 컷오프 기준을 스스로 정해 실패율 낮추기\n- 저조도 모드 + 동일 수면전 스크립트 구성\n\n"완벽하지 않아도 매일 1개만 지키는" 방식이 지속률이 높았습니다.`,
    createdAt: '2026-02-09T19:30:00.000Z',
  },
];

const parseTags = (raw) =>
  raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

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

    match = trimmed.match(/^-\s+(.*)$/);
    if (match) {
      if (!inUl) {
        html += '<ul>';
        inUl = true;
      }
      html += `<li>${applyInlineMarkdown(match[1])}</li>`;
      continue;
    }

    match = trimmed.match(/^>\s+(.*)$/);
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

const excerptFromMarkdown = (markdown) => {
  const plain = markdown
    .replace(/`[^`]*`/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n/g, ' ')
    .trim();
  return plain.length > 160 ? `${plain.slice(0, 157)}...` : plain;
};

function App() {
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

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [query, setQuery] = useState('');
  const [openItems, setOpenItems] = useState({});
  const [draft, setDraft] = useState(initialDraft);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }, [library]);

  const totalByCategory = useMemo(() => {
    const map = CATEGORY_OPTIONS.reduce((acc, current) => {
      acc[current.id] = 0;
      return acc;
    }, {});
    library.forEach((item) => {
      if (map[item.category] !== undefined) map[item.category] += 1;
    });
    return map;
  }, [library]);

  const totalByType = useMemo(() => {
    const map = TYPE_OPTIONS.reduce((acc, current) => {
      acc[current.id] = 0;
      return acc;
    }, {});
    library.forEach((item) => {
      if (map[item.type] !== undefined) map[item.type] += 1;
    });
    return map;
  }, [library]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return library
      .filter((item) => {
        if (activeCategory !== 'all' && item.category !== activeCategory) return false;
        if (activeType !== 'all' && item.type !== activeType) return false;
        if (!normalizedQuery) return true;
        const tags = item.tags.join(' ');
        const searchable = `${item.title} ${item.source} ${item.summary} ${tags}`.toLowerCase();
        return searchable.includes(normalizedQuery);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [activeCategory, activeType, library, query]);

  const handleInput = (event) => {
    const { name, value } = event.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const addItem = (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.summary.trim()) return;

    const next = {
      id: `manual-${Date.now()}`,
      title: draft.title.trim(),
      category: draft.category,
      type: draft.type,
      source: draft.source.trim(),
      sourceUrl: draft.sourceUrl.trim(),
      summary: draft.summary.trim(),
      tags: parseTags(draft.tags),
      createdAt: new Date().toISOString(),
    };

    setLibrary((prev) => [next, ...prev]);
    setDraft(initialDraft);
  };

  const removeItem = (id) => {
    if (!window.confirm('정말 삭제할까요?')) return;
    setLibrary((prev) => prev.filter((item) => item.id !== id));
    setOpenItems((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const toggleOpen = (id) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="app-shell">
      <header className="panel hero">
        <p className="eyebrow">George's Goodreads</p>
        <div className="hero-title-row">
          <h1>george&apos;s goodreads</h1>
          <span className="hero-count">{library.length}개 콘텐츠</span>
        </div>
        <p className="hero-desc">
          내가 좋다고 생각한 자료들을 카테고리와 타입으로 정리해 한 번에 볼 수 있는 큐레이션 페이지입니다.
        </p>
      </header>

      <section className="panel controls">
        <div className="control-row">
          <label htmlFor="query-input">검색</label>
          <input
            id="query-input"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목, 출처, 태그로 검색"
          />
        </div>

        <div className="control-group">
          <div className="control-label">카테고리</div>
          <div className="chip-row">
            {FILTER_CATEGORIES.map((category) => {
              const selected = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  className={`chip ${selected ? 'is-active' : ''}`}
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
          <div className="control-label">콘텐츠 종류</div>
          <div className="chip-row">
            <button
              type="button"
              className={`chip ${activeType === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveType('all')}
            >
              전체
            </button>
            {TYPE_OPTIONS.map((type) => (
              <button
                key={type.id}
                type="button"
                className={`chip ${activeType === type.id ? 'is-active' : ''}`}
                onClick={() => setActiveType(type.id)}
              >
                {type.label} ({totalByType[type.id] || 0})
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="content-layout">
        <section className="panel feed-panel">
          <div className="feed-head">
            <h2>보관 중인 콘텐츠</h2>
            <p className="muted">
              {filteredItems.length}개
              {activeCategory !== 'all' && ` · ${FILTER_CATEGORIES.find((c) => c.id === activeCategory)?.label}`}
              {activeType !== 'all' && ` · ${TYPE_OPTIONS.find((t) => t.id === activeType)?.label}`}
              {query && ` · 검색: "${query}"`}
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

                    {!isOpen ? <p className="excerpt">{excerptFromMarkdown(item.summary)}</p> : <MarkdownBlock markdown={item.summary} />}

                    <p className="muted tags-row">
                      {item.tags.map((tag) => `#${tag}`).join(' ')}
                    </p>

                    <div className="item-actions">
                      <button type="button" className="btn" onClick={() => toggleOpen(item.id)}>
                        {isOpen ? '요약 닫기' : '마크다운 열기'}
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
          <h2>새 콘텐츠 추가</h2>
          <p className="muted">
            기본 형식은 마크다운입니다. 제목/카테고리/타입/요약(필수)만 입력하면 바로 등록됩니다.
          </p>
          <form className="composer-form" onSubmit={addItem}>
            <label className="form-row" htmlFor="title">
              제목
              <input id="title" name="title" value={draft.title} onChange={handleInput} placeholder="예: 좋은 아티클 제목" />
            </label>

            <div className="form-row two-cols">
              <label htmlFor="category">
                카테고리
                <select id="category" name="category" value={draft.category} onChange={handleInput}>
                  {CATEGORY_OPTIONS.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </label>

              <label htmlFor="type">
                콘텐츠 종류
                <select id="type" name="type" value={draft.type} onChange={handleInput}>
                  {TYPE_OPTIONS.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label htmlFor="source">
              출처
              <input
                id="source"
                name="source"
                value={draft.source}
                onChange={handleInput}
                placeholder="reddit, X, naver blog, youtube ..."
              />
            </label>

            <label htmlFor="sourceUrl">
              링크
              <input
                id="sourceUrl"
                name="sourceUrl"
                value={draft.sourceUrl}
                onChange={handleInput}
                placeholder="https://..."
              />
            </label>

            <label htmlFor="tags">
              태그(쉼표)
              <input id="tags" name="tags" value={draft.tags} onChange={handleInput} placeholder="AI, 투자, 건강" />
            </label>

            <label htmlFor="summary">
              본문(마크다운)
              <textarea
                id="summary"
                name="summary"
                value={draft.summary}
                onChange={handleInput}
                rows={10}
                placeholder="예: # 제목\n- 목록\n**굵게**\n*기울임*\n[텍스트](https://link)"
              />
            </label>

            <button type="submit" className="btn btn-submit">
              저장
            </button>
          </form>
        </aside>
      </main>
    </div>
  );
}

export default App;
