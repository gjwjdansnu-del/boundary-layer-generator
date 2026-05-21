# 배포 (학술용 GitHub)

**대상 계정:** `gjwjdansnu-del` (flow-sketch와 동일). `podobooks-ganghwa`에 올리지 않습니다.

## 1. 저장소 만들기 (최초 1회)

`gjwjdansnu-del`로 GitHub 로그인한 뒤:

1. **New repository** → 이름 `boundary-layer-generator`, Public
2. 로컬에서 remote 확인:

```bash
git remote set-url origin https://github.com/gjwjdansnu-del/boundary-layer-generator.git
git push -u origin main
```

(현재 CLI는 `podobooks-ganghwa`로만 인증되어 있으면, `gjwjdansnu-del` 계정으로 `gh auth login` 후 push)

## 2. GitHub Pages

1. **Settings → Pages → Build and deployment → Source:** **GitHub Actions**
2. `main`에 push → workflow `Deploy frontend to GitHub Pages` 실행
3. 사이트: **https://gjwjdansnu-del.github.io/boundary-layer-generator/**

## 3. Vite base

`frontend/vite.config.ts`의 `base`는 `/boundary-layer-generator/` (저장소 이름과 일치).
