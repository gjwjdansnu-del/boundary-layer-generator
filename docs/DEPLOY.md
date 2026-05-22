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

### push 403 (`denied to podobooks-ganghwa`) 일 때

터미널 Git/`gh`가 **podobooks-ganghwa** 토큰을 쓰고 있어서, `gjwjdansnu-del` 저장소에 쓸 권한이 없습니다.

**방법 A — 브라우저에서 협력자 추가 (가장 빠름)**

1. `gjwjdansnu-del`로 로그인 → `boundary-layer-generator` → **Settings → Collaborators**
2. **Add people** → `podobooks-ganghwa` (또는 본인이 쓰는 계정) → **Write** 권한
3. 터미널에서 **한 줄씩** (같은 줄에 `#` 주석 붙이지 말 것):

```bash
cd /Users/apl/projects/blasius_LST_toy/boundary_layer_generator
git push -u origin main
```

**방법 B — `gh`를 `gjwjdansnu-del` 계정으로 다시 로그인**

```bash
gh auth logout -h github.com
gh auth login -h github.com -p https -w
```

브라우저에서 **gjwjdansnu-del** 계정으로 승인한 뒤:

```bash
gh api user --jq .login
```

출력이 `gjwjdansnu-del` (또는 그 계정의 사용자명)이어야 합니다.

```bash
gh auth setup-git
cd /Users/apl/projects/blasius_LST_toy/boundary_layer_generator
git push -u origin main
```

## 2. GitHub Pages

1. **Settings → Pages → Build and deployment → Source:** **GitHub Actions**
2. `main`에 push → workflow `Deploy frontend to GitHub Pages` 실행
3. 사이트: **https://gjwjdansnu-del.github.io/boundary-layer-generator/**

## 3. Vite base

`frontend/vite.config.ts`의 `base`는 `/boundary-layer-generator/` (저장소 이름과 일치).
