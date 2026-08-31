# 스파이디 트래커

스파이디 트래커 UI를 그대로 가져온 픽셀 웹앱.
내 사진으로 **수트 업** → **직접 거미줄을 타고** 뉴욕을 건너 → **MJ 구출** →
**데일리 뷰글 1면** / **옥상 피자 데이트**로 끝나고, 사진·GIF·영상으로 저장합니다.
트래커의 메시지 센터는 **방명록**으로 씁니다.

- UI 에셋은 **원본 파일**(`assets/ui`, `assets/fonts`)을 그대로 씁니다 — 버튼 3-슬라이스, 스파이디 머리 스프라이트시트(46프레임), 레이더, 핀, 필터 칩, 티커, PF Videotext Pro 폰트.
- 지도·캐릭터·거미줄·신문은 코드로 그립니다.
- 라이브러리 **0개** — GIF 인코더까지 직접 구현.
- 사진은 브라우저 밖으로 나가지 않습니다.

---

## 화면 구성 (레퍼런스 UI)

| 위치 | 요소 |
|---|---|
| 좌상단 원형(주황) | 마스크 눈 아이콘 → ABOUT |
| 상단 플레이트 | `스파이디 [거미로고] 트래커` |
| 우상단 사각(흰색) | 거미 아이콘 → **시작** (거미줄이 내려오는 연출) |
| 좌측 칩 2개 | 초록 = 스캔(레이더 핑) / 빨강 = 링크 공유 |
| 좌하단 | 픽셀 스파이디 마스코트 (탭하면 시작) |
| 하단 티커 | **방명록(메시지 센터)** 열기 |
| 우하단 원형 | 소리 on/off |
| 지도 우하단 | 거미줄 레이더(web watch) + 조준경 |

지도는 픽셀로 그린 뉴욕입니다 — 허드슨/이스트리버, 센트럴파크, 하이웨이 실드(9A·495·95·278·678),
한/영 지명, 마젠타 이동 경로, 레이더 스윕, 목격 마커.
**버튼에 이모지는 하나도 쓰지 않았습니다.** 모든 아이콘은 픽셀 캔버스로 그려 넣습니다.

---

## 조작 (스윙은 직접 하는 게임)

```
누르고 있으면  →  거미줄 발사 + 매달려서 스윙
손을 떼면      →  놓기 (접선 방향으로 날아감)
```

- 스페이스바도 같은 조작입니다.
- 길바닥에 닿으면 게임 오버 → `다시하기` / `결말 보기`.
- **빌런 3종이 방해합니다. 닿으면 즉사.**
  - 진 그레이 — 상공에서 불꽃을 두르고 좌우로 흘러옵니다
  - 더 핸드 — 옥상에서 뛰어오릅니다
  - 스콜피온 — 건물 벽면을 오르내립니다
  - 오른쪽 가장자리에 빨간 점으로 접근 경고가 뜹니다
- 목표 거리(기본 **900m**)에 닿으면 스파이더 센스가 울리고 **MJ 구출 시퀀스**로 이어집니다.
- 최고 기록은 브라우저에 저장됩니다.

물리는 실제 진자입니다 — `ω' = -(g/L)·sinθ`, 앵커는 앞쪽 위 옥상에서 고르고
(`CITY.anchorAhead`), 놓으면 접선 속도로 포물선을 그립니다. 끊긴 거미줄은 따로 흩날립니다.
난이도는 `js/game.js` 상단의 `G_ACC`(중력) · `GOAL_M`(목표 거리) · `METER`,
그리고 `ensureFoes()`의 간격(`430 + rand*380`)으로 조절하세요.

---

## 방명록 붙이기 (Supabase)

깃허브 페이지는 정적 호스팅이라 저장소가 없습니다. Supabase를 연결하면 됩니다.
**설정 전에는 "로컬 모드"** 로 동작합니다(내 브라우저에만 저장).

### 1. 테이블 만들기 — Supabase → SQL Editor

```sql
create table guestbook (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 1 and 12),
  message    text not null check (char_length(message) between 1 and 200),
  created_at timestamptz not null default now()
);

alter table guestbook enable row level security;
create policy "read"   on guestbook for select using (true);
create policy "insert" on guestbook for insert with check (true);
```

> 수정·삭제 정책은 만들지 않았으므로 누구도 남의 글을 지우거나 고칠 수 없습니다.
> 관리가 필요하면 Supabase 대시보드에서 직접 지우세요.

### 2. 키 넣기 — `js/config.js`

```js
window.SPIDEY_CONFIG = {
  SUPABASE_URL: 'https://xxxxxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...',
  TABLE: 'guestbook',
  POLL_MS: 6000
};
```

Project Settings → API 의 **Project URL** 과 **anon public** 키입니다.
anon 키는 공개돼도 되는 키지만, 위 RLS 정책 때문에 읽기·쓰기만 가능합니다.

### 3. 동작

`fetch` 로 PostgREST를 직접 호출합니다(SDK 없음). 6초마다 폴링해서
다른 사람이 남긴 글이 새로고침 없이 목록에 올라옵니다.
클라이언트에서 이름 12자·본문 200자 제한과 8초 연속 전송 제한을 겁니다.

> Giscus로 가고 싶다면 깃허브 Discussions를 켜고 `js/guestbook.js`를 통째로
> giscus 스크립트로 바꾸면 됩니다. 다만 **작성자가 깃허브 로그인을 해야** 합니다.
> 로그인 없이 아무나 남기게 하려면 Supabase 쪽이 맞습니다.

---

## 깃허브 페이지 배포

```bash
cd spidey-tracker
git init
git add .
git commit -m "spidey tracker"
git branch -M main
git remote add origin https://github.com/<내아이디>/spidey-tracker.git
git push -u origin main
```

Settings → Pages → Source: `main` / `(root)`. `.nojekyll` 이 들어 있습니다.

### 배포 후 꼭 할 것

1. `index.html` 의 OG 태그에서 `YOUR-ID` 를 실제 아이디로 교체
2. 배포된 사이트에서 **`/og.html` → "og.png 저장"** 후 그 파일을 루트에 커밋 (카톡 썸네일)
3. **파일을 고칠 때마다 `index.html` 의 `?v=숫자`를 바꾸세요.**
   브라우저·CDN 캐시 때문에 옛날 JS가 계속 뜨는 걸 막아줍니다.

> 카카오톡은 썸네일을 캐시합니다. 안 바뀌면
> [카카오 개발자 도구 캐시 초기화](https://developers.kakao.com/tool/clear/og) 에서 URL을 넣고 초기화하세요.

---

## 카카오톡 "글씨 커짐" 대응

1. `viewport` 를 `user-scalable=no, maximum-scale=1.0` 으로 고정
2. `html, body, *` 에 `-webkit-text-size-adjust: none !important`
3. 텍스트 컨테이너에 `max-height: 1000000px` — **안드로이드 WebView 폰트 부스팅**을 무력화합니다. 카톡에서 글씨가 커지는 진짜 원인이 이것입니다.
4. 지도·게임·신문의 모든 글자는 DOM 텍스트가 아니라 **캔버스에 그린 픽셀 비트맵**이라 OS 글꼴 크기 설정의 영향을 아예 받지 않습니다.

추가로 `visibilitychange` / `pageshow` 마다 다시 강제하고, 더블탭·핀치 확대도 막습니다.

---

## 파일 구조

```
spidey-tracker/
├─ index.html          앱 셸 + OG 태그 (에셋 ?v= 캐시버전)
├─ og.html             카톡 썸네일(og.png) 생성기
├─ .nojekyll
├─ css/style.css       레퍼런스 UI 토큰 + 카톡 폰트부스팅 차단
└─ js/
   ├─ config.js        ★ Supabase 키를 여기에
   ├─ pixelfont.js     한글/영문 픽셀 비트맵 + 자동 줄바꿈/축소(fit·wrap·block)
   ├─ engine.js        저해상도 버퍼 + 컨테이너를 꽉 채우는 정수배 스케일
   ├─ face.js          크롭 → 축소 → 팔레트 양자화 → 배경 자동 제거
   ├─ sprites.js       스파이디/MJ/소품/UI 아이콘 전부
   ├─ gif.js           의존성 없는 GIF89a + LZW 인코더
   ├─ audio.js         WebAudio 8비트 효과음·BGM
   ├─ stage.js         게임·시네마 공용 무대 + 캡처/녹화/PNG
   ├─ city.js          시차 스크롤 야경
   ├─ map.js           픽셀 뉴욕 지도 + 레이더 + web watch
   ├─ game.js          ★ 직접 하는 스윙 게임 + 구출 시퀀스
   ├─ cinema.js        수트업 / 데일리 뷰글 / 옥상 데이트
   ├─ guestbook.js     메시지 센터 = 방명록 (Supabase REST)
   └─ main.js          UI 배선 / 아이콘 주입 / 흐름 / 내보내기
```

---

## 사진이 "오려붙인 것처럼" 보이지 않게 한 방법

1. 16~24px로 줄인 뒤 **스프라이트와 같은 계열의 고정 팔레트 31색**으로 양자화
2. 네 모서리에서 시작하는 **플러드 필로 배경을 제거** — 이웃 픽셀과의 색차가 작으면 계속 번지므로 그라디언트 배경도 지워집니다. 얼굴까지 먹으면(제거율 58% 초과) 자동 취소합니다.
3. 사진에서 뽑은 **볼 부근 피부톤**으로 머리 실루엣을 먼저 칠하고, 얼굴은 그보다 **한 겹 안쪽에만** 넣습니다 → 테두리가 피부톤 링이 되어 사각형 티가 사라집니다.
4. 머리 모양(`destination-in`)으로 오려서 합성합니다.

그래도 **얼굴이 크게 나온 사진**일수록 결과가 좋습니다. 모달의 점선 원에 얼굴을 꽉 채우세요.
등록 화면 아래의 미리보기는 실제 수트업 흉상을 그대로 보여줍니다.

---

## 저장

| 버튼 | 결과 |
|---|---|
| 사진 저장 | 현재 화면 4배 확대 PNG (뷰글 1면 / 옥상 엔딩) |
| GIF 저장 | 구출~뷰글 하이라이트 GIF (프레임 자동 솎아내기) |
| 영상 저장 | `MediaRecorder` WebM (미지원 브라우저는 GIF 안내) |

> 카톡·인스타 인앱 브라우저는 `<a download>` 를 막기도 합니다.
> 그럴 땐 이미지를 길게 눌러 저장하거나 사파리/크롬으로 여세요(앱에서도 토스트로 안내합니다).

---

## 엔딩

- **데일리 뷰글 1면** — 실제 1면 레이아웃(상단 티저 2칸 / 빨간 띠 마스트헤드 / 왼쪽 대형 헤드라인 / 오른쪽 사진 / 검은 부제 박스 / 하단 빨간 띠)
- **옥상 엔딩** — 스파이더맨과 MJ가 거미줄을 타고 건물 위에 서 있는 장면

두 엔딩은 버튼으로 오갈 수 있고 각각 저장됩니다.

---

Fan-made / 비상업 개인 프로젝트입니다. Spider-Man © Marvel & Sony Pictures.
`assets/` 의 UI 이미지·폰트는 원본 사이트 에셋이므로 상업적 재배포는 하지 마세요.
