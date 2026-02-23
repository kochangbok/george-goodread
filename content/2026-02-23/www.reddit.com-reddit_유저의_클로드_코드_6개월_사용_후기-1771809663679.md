# reddit 유저의 클로드 코드 6개월 사용 후기


# reddit 유저의 클로드 코드 6개월 사용 후기
- 원문 링크: https://www.reddit.com/r/ClaudeAI/comments/1oivjvm/claude_code_is_a_beast_tips_from_6_months_of/
- 저자: JokeGold5455
- 출처: www.reddit.com
# Claude Code는 대단하다 — 6개월 하드코어 사용 후기: 실전 팁
원문 링크: https://www.reddit.com/r/ClaudeAI/comments/1oivjvm/claude\_code\_is\_a\_beast\_tips\_from\_6\_months\_of/
원문 서명/출처: r/ClaudeAI (Reddit)
많은 텍스트 음성 변환 AI(예: ElevenLabs Reader, Natural Reader)를 쓰면, 이 긴 글을 음성으로 들어가며 읽을 수 있습니다.
수정 요청이 많아서 며칠 내로 저장소 링크를 올리겠다고 했고, 당시에는 사내 프로젝트 작업 연계라 바로 공개할 수 없어 익명 처리 시간이 필요했다고 설명했습니다.
마지막 수정: 바로 정리해서 공개를 진행했고, 추가 내용은 포스트에 올리거나 아래 저장소에서 확인할 수 있다고 덧붙였습니다.
**레포지토리:** https://github.com/diet103/claude-code-infrastructure-showcase
# 면책조항
저자는 1주일간의 강도 높은 사용기를 6개월 전 공개했지만, 최근에는 6개월 동안의 추가 실전 운영을 정리해 올렸고 내용이 길어질 수 있으니 마음의 준비를 하라고 말합니다.
작성한 내용은 저자 본인 기준에서 잘 맞던 방식의 정리일 뿐 정답이 아니며, AI 에이전트 코딩 작업을 개선하기 위한 참고 자료로 봐 달라고 강조했습니다. 20x Max 플랜으로 진행했기 때문에 비용·사용량 체감은 다를 수 있고, vibe-coding만을 위한 팁이 아니라 협업·계획·리뷰·반복 개선 중심으로 써야 효과를 본다는 점도 명시했습니다.
# 핵심 개요
6개월 동안 Claude Code를 밀어붙여(단독으로 30만 LOC 정도를 재작성) 정리한 시스템은 다음 네 가지입니다.
- 필요 시 실제로 자동 활성화되는 스킬
- Claude가 맥락을 잃지 않도록 방지하는 개발 문서 워크플로우
- PM2 + 훅으로 뒤처리되지 않는 오류 처리
- 리뷰·테스트·기획을 담당하는 특화 에이전트군