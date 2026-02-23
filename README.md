# george's goodreads

좋은 콘텐츠를 저장하고 읽는 개인 큐레이션 웹앱입니다.

## 1) 키 설정

### 서버 인증 키(권장)

서버 API 보호에 사용:

- `ADMIN_API_KEYS`  
  쉼표(`,`)로 구분한 키 목록 (예: `agent-key-01,agent-key-02`)

### Vite 클라이언트 키(관리자 페이지 연동용)

- `VITE_ADMIN_API_KEY` 또는 `VITE_ADMIN_API_KEYS`  
  (브라우저에서 `/api/save-content`, `/api/delete-content` 호출 시 자동으로 헤더에 포함)

### GitHub 연동

- `GITHUB_TOKEN`
- `GITHUB_REPO` (예: `owner/repo`)
- `GITHUB_BRANCH`

## 2) API 엔드포인트

- `GET /api/load-library`  
  콘텐츠 목록 조회/필터
- `POST /api/save-content`  
  콘텐츠 저장(신규/수정)
- `POST /api/delete-content`  
  콘텐츠 삭제

## 3) `GET /api/load-library`

쿼리:

- `q` : 검색 키워드
- `category` : `ai` | `crypto` | `society` | `life`
- `type` : `article` | `youtube` | `naver`
- `limit` : 페이지 크기 (미지정 시 전체 반환)
- `page` : 페이지 번호(1부터)
- `id` : 단건 조회할 `item.id`
- `markdown=true` : 단건 조회 시 본문 markdown도 함께 조회

응답:

- 목록 조회: `{ items, total, count }`
- 단건 조회: `{ item, markdown, itemCount }`

## 4) `POST /api/save-content`

키가 설정된 경우 아래 헤더 중 하나 필요:

- `x-api-key: <KEY>`
- `x-openclaw-client: <KEY>`
- `Authorization: Bearer <KEY>`

요청 바디(권장 단순형):

```json
{
  "id": "item-2026-02-23-001",
  "title": "하루만에 인생 고치는 법",
  "category": "life",
  "type": "article",
  "source": "x.com",
  "sourceUrl": "https://x.com/...",
  "summary": "# 제목\\n\\n요약/번역 markdown",
  "markdown": "# 제목\\n\\n원문 전문 markdown ...",
  "filePath": "2026-02-23/x.com-haru.md",
  "tags": ["삶", "생산성"]
}
```

호환형(기존 구조)도 지원됩니다:

```json
{
  "item": { ... },
  "markdown": "..."
}
```

동작:

- `id`가 존재하면 덮어쓰기(수정)
- `id`가 없으면 생성(현재는 서버에서 임시 id 생성)
- `filePath`가 없으면 자동 생성

## 5) `POST /api/delete-content`

헤더는 저장 API와 동일.

요청 바디:

```json
{ "id": "item-2026-02-23-001" }
```

## 6) OpenClaw / 에이전트 가이드(짧은 버전)

### 업로드

```bash
curl -X POST "https://george-goodread.vercel.app/api/save-content" \
  -H "Content-Type: application/json" \
  -H "x-openclaw-client: YOUR_API_KEY" \
  -d '{
    "id": "item-openclaw-001",
    "title": "예제 글",
    "category": "ai",
    "type": "article",
    "source": "reddit",
    "sourceUrl": "https://example.com/article",
    "summary": "# 예제 글\\n요약입니다.",
    "markdown": "# 예제 글\\n원문 전문 markdown..."
  }'
```

### 삭제

```bash
curl -X POST "https://george-goodread.vercel.app/api/delete-content" \
  -H "Content-Type: application/json" \
  -H "x-openclaw-client: YOUR_API_KEY" \
  -d '{ "id": "item-openclaw-001" }'
```

### 조회

```bash
curl "https://george-goodread.vercel.app/api/load-library?q=하루만에&category=life&type=article&limit=20"
curl "https://george-goodread.vercel.app/api/load-library?id=item-openclaw-001&markdown=true"
```

## 배포

```bash
npm install
npm run build
vercel --prod
```
