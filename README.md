# george's goodreads

좋은 콘텐츠를 저장하고 읽는 개인 큐레이션 웹앱입니다.

## API (OpenClaw/자동화 에이전트용)

콘텐츠 업로드/수정은 서버 API를 통해 가능합니다.

환경 변수:

- `ADMIN_API_KEYS` (콤마(`,`) 구분 문자열, 예: `key-a,key-b`)
- `GITHUB_TOKEN`
- `GITHUB_REPO` (예: `owner/repo`)
- `GITHUB_BRANCH`

### 영구 저장 API

- `POST /api/save-content` : 콘텐츠 저장(신규/수정)
- `POST /api/delete-content` : 콘텐츠 삭제
- `GET /api/load-library` : 목록 조회 (공개 조회)

`ADMIN_API_KEYS`가 설정되지 않은 경우 기존 동작과 동일하게 인증 없이 동작합니다.
설정한 경우 아래 헤더에 키를 넣어 호출해야 합니다.

헤더/파라미터
- `x-api-key: <발급키>` 또는 `Authorization: Bearer <발급키>`
- 또는 JSON body/query에 `apiKey`(권장 X)

#### 1) OpenClaw용 업로드 요청 예시 (최신 단순 포맷)

요청 바디 (요약형 스키마):

```json
{
  "id": "item-2026-02-23-001",
  "title": "하루만에 인생 고치는 법",
  "category": "life",
  "type": "article",
  "source": "x.com",
  "sourceUrl": "https://x.com/...",
  "summary": "# 제목\\n\\n요약/번역 전문 markdown",
  "markdown": "# 제목\\n\\n원문 전문 markdown ...",
  "filePath": "2026-02-23/x.com-haru.md",
  "tags": ["삶", "생산성"]
}
```

- `summary`는 목록용 전문 정리본(현재 구현상 `index.json`의 설명에 반영됨)
- `markdown`는 실제 저장될 본문 파일 전문
- `filePath` 미지정 시 서버에서 자동 생성합니다.
- `id`가 동일하면 기존 항목으로 업데이트됩니다.

예시(curl):

```bash
curl -X POST "https://george-goodread.vercel.app/api/save-content" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "id":"item-openclaw-001",
    "title":"예제 글",
    "category":"ai",
    "type":"article",
    "source":"reddit",
    "sourceUrl":"https://example.com/article",
    "summary":"# 예제 글\\n\\n요약입니다.",
    "markdown":"# 예제 글\\n\\n본문 markdown..."
  }'
```

삭제 예시:

```bash
curl -X POST "https://george-goodread.vercel.app/api/delete-content" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{ "id": "item-openclaw-001" }'
```

## 배포

```bash
npm install
npm run build
vercel --prod
```
