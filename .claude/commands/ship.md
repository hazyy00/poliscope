# /ship

세션 마무리 시 memory 업데이트 → 파일 정리 → GitHub push → Vercel 배포를 순서대로 실행한다.

## 실행 순서

### 1. Memory 업데이트
이번 세션에서 새로 알게 된 것 중 미래 대화에서도 유용한 내용을 저장한다:
- 프로젝트 구조·상태 변경 → `project_*.md`
- 사용자 피드백·선호 → `feedback_*.md`
- 참조 정보 → `reference_*.md`

저장 위치: `/Users/jaekim/.claude/projects/-Users-jaekim-Desktop-poliscope/memory/`
저장 후 `MEMORY.md` 인덱스도 반드시 갱신한다.

### 2. CLAUDE.md 확인 및 업데이트
`/Users/jaekim/Desktop/poliscope/CLAUDE.md`를 읽고, 이번 세션에서 바뀐 내용(완료된 작업, 새 구조, 새 규칙 등)이 있으면 업데이트한다.

### 3. Git commit & push
```bash
git -C /Users/jaekim/Desktop/poliscope status
git -C /Users/jaekim/Desktop/poliscope add -p   # 변경 파일 확인 후 스테이징
git -C /Users/jaekim/Desktop/poliscope commit -m "<커밋 메시지>"
git -C /Users/jaekim/Desktop/poliscope push
```
커밋 메시지는 이번 세션의 주요 변경 사항을 한 줄로 요약한다.

### 4. Vercel 프로덕션 배포
```bash
cd /Users/jaekim/Desktop/poliscope && vercel --prod
```

## 주의
- git push 전에 반드시 변경 파일 목록을 사용자에게 보여주고 확인받는다.
- 민감한 파일(.env.local 등)은 절대 커밋하지 않는다.
