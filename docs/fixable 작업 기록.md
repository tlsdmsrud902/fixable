# fixable (쇼핑몰 웹사이트 판매 회사 사이트) 작업 기록 — 2026-10-03

쇼핑몰 스킨 시리즈와는 **별도 작업**이다. **wear902(여성 의류) 스킨**의 코드를 바탕으로,
우리가 만든 카페24 쇼핑몰 6곳을 **판매하는** 회사 사이트 **fixable** 을 만든 기록.
물건을 파는 쇼핑몰이 아니라 "쇼핑몰 디자인(스킨)"을 파는 사이트라, 메인은 **디자인 에이전시 상세페이지형**으로 새로 짰다.

| 항목 | 값 |
|---|---|
| 카페24 계정 (mall_id) | `fixable902` (`https://fixable902.cafe24.com`) |
| 화면 브랜드 이름 | `fixable` (로고 `fixable.`) |
| GitHub 저장소 | `tlsdmsrud902/fixable` |
| 스킨 폴더 | `fixable902_s2_260925195134_d_skin1_E/skin1` |
| 디자인 코드 · 번호 | `base` · `1` (`ez/ez-settings.json`) — 새 계정 기본값. 다르면 고친다 |
| 이미지 서버 번호 | **아직 모름** → 코드에는 `PG_NUMBER` 그대로. `docs/pack.py` 가 복구 파일을 만들 때 넣어 준다 |
| 이미지 폴더 | `SkinImg/fixable/` (파일업로더 폴더도 `fixable`) |
| 코드 이름 | 클래스 `fixable-*` · 메인 `fx-*`, 전역 변수 `FIXABLE_*`, 페이지 `/fixable/guide.html`, 편집 이벤트 `fixable:cms` |

## 1. 판매 상품 6개

| 코드 | 임시 번호 | 상품 | 분류 | 라이브 데모 |
|---|---|---|---|---|
| p01 | 11 | WEAR902 — 여성 의류 쇼핑몰 스킨 | 24 패션 · 뷰티 | https://wear902.cafe24.com |
| p02 | 12 | EPPUM902 — K-뷰티 화장품 쇼핑몰 스킨 | 24 패션 · 뷰티 | https://eppum902.cafe24.com |
| p03 | 13 | BABYANG — 아기용품 쇼핑몰 스킨 | 25 키즈 · 펫 | https://babyyang902.cafe24.com |
| p04 | 14 | FOOD902 — 식품 쇼핑몰 스킨 | 26 푸드 · 리빙 | https://food902.cafe24.com |
| p05 | 15 | INTER902 — 북유럽풍 인테리어 가구 쇼핑몰 스킨 | 26 푸드 · 리빙 | https://inter902.cafe24.com |
| p06 | 16 | PETPIA — 반려동물 용품 쇼핑몰 스킨 | 25 키즈 · 펫 | https://petpia902.cafe24.com |

- 데이터 : `cafe24-assets/products/products.json` (+ 이미지 `p01~p06.jpg`, 800×800)
- 가격 : 모두 **250,000원** (디자인센터 단순복사 가격). 커스터마이징 430,000원은 메인 「가격」에 안내 — 카페24 상품 옵션으로 넣는다
- `groups` : 한 상품을 여러 메인 진열에 넣는다 (`rec` 추천 · `new` 신상품 · `best` 인기). 메인에는 **추천(진열 2번) 6개만** 나온다
- 임시 번호 11 ~ 16 은 wear902 때처럼 "새 계정 첫 상품 = 11" 기준. 등록 뒤 번호가 다르면 `index.html` 의 `product_no=11~16` 을 바꾼다
- 리뷰 예시 : `cafe24-assets/reviews.json` 6개 (제목 앞 **[연출 예시]**)

## 2. 분류 · 메뉴

| 번호 | 분류 | 목록 배너 키 |
|---|---|---|
| 28 | 전체 스킨 | all |
| 24 | 패션 · 뷰티 | fashion |
| 25 | 키즈 · 펫 | family |
| 26 | 푸드 · 리빙 | living |
| 27 | SALE (메뉴에는 안 넣음, 세일 화면 · 쿠폰 뽑기는 그대로 살아 있음) | — |

상단 메뉴(`header.html`, `store-content.js` 의 `menu.editorial: true`) : 전체 스킨 · 패션·뷰티 · 키즈·펫 · 푸드·리빙 · 작업물(`/#fx-works`) · 가격(`/#fx-price`) · 후기 · 문의(프로젝트 문의 / 자주묻는질문 / 공지사항)

## 3. 메인 — 에이전시 상세페이지형 (`index.html`)

한 장의 상세페이지처럼 위에서 아래로 읽힌다. 섹션마다 `?edit=1` [고치기] 버튼이 붙는다 (12곳 확인).

| 순서 | 섹션 | 내용 |
|---|---|---|
| 1 | 첫 화면 (스크롤 영상 히어로) | myjiwon.com(TRENDIN) 히어로 영상과 같은 방식. 화면이 고정된 채 **스크롤 진행률이 그대로 영상 재생 위치**가 되어 내리면 얼굴이 정면에서 옆으로 돈다(PC · 휴대폰). 오른쪽 카드는 **스킨 상품 01 WEAR902 → 06 PETPIA** 로 바뀐다(사진 · 이름 · 가격 · 스킨 보기). 제목 한 글자씩 등장, 진행선, 마우스 시차, 탭을 누르면 그 카드로 이동 |
| 1-2 | 숫자 띠 · 쇼릴 | 숫자 4칸, 쇼릴 사진은 세라핌 필름 리빌(가장자리부터 펼쳐짐) + 패럴랙스 |
| 2 | 글자 띠 두 줄 | 스스로 흐르면서 스크롤 방향에 따라 두 줄이 서로 반대로 밀림 (세라핌 마퀴) |
| 3 | 01 About | 소개 문장이 스크롤에 맞춰 한 단어씩 진해짐 |
| 4 | 02 Why fixable | 고민 4개 → 해결 4개 |
| 5 | 03 Selected works | 작업물 8개를 한 줄씩 크게 — 스킨 6종 + 맞춤 제작 사례 2곳(07 TRENDIN myjiwon.com · 08 SERAPHIN adia90222.cafe24.com). 사진은 필름 리빌 + 패럴랙스, 마우스를 올리면 DEMO / VISIT 커서 |
| 6 | 04 What's inside | 공통 기능 8개 |
| 7 | 05 Mobile first | 휴대폰 화면 6개가 옆으로 흐름 (검정 배경) |
| 8 | 06 Shop the skins | 카페24 메인 진열 1(추천상품) 6개, 3열 |
| 9 | 07 Process | 4단계 (왼쪽 제목 고정) |
| 10 | 08 Pricing | Basic 250,000 · Custom 430,000 · Studio 별도 견적 |
| 11 | 09 Client notes | 상품 사용후기(4번) 사진 후기 — `fixable-reviews.js` |
| 12 | 10 FAQ | 질문 5개 |
| 13 | 문의 | "Let's fix your store." + 문의 버튼 (검정 배경, 푸터와 바로 붙음) |

- 파일 : `layout/basic/css/fixable-agency.css`, `layout/basic/js/fixable-agency.js` (외부 라이브러리 없음)
- 세라핌(adia90222) 효과 중 가져온 것 : 맨 위 스크롤 진행 막대, 필름 리빌, 사진 패럴랙스, 스크롤 마퀴, 커서 라벨 (원본은 `layout.html` 의 s9-fx 와 `seraphin.js`)
- 모션 줄이기 설정이면 연속 움직임은 끄고, 히어로는 스크롤로 챕터만 넘어간다
- 지운 파일 : `fixable-cozy-home.css/js`, `fixable-modern.css`, `fixable-editorial.css`, `st-world.css` (옛 쇼핑몰 메인 전용)
- `<main id="lw-home">` 는 그대로 둔다 → 공통 CSS 의 `body:has(#lw-home)` 와 편집 모드가 메인으로 알아본다
- 이벤트 팝업은 끔 (`store-content.js` 의 `popup.enabled = false`)

## 4. 이미지

| 이미지 | 만드는 법 |
|---|---|
| `work-*.webp` (PC 첫 화면) · `mobile-*.webp` (휴대폰 첫 화면) | 6개 쇼핑몰 캡처 |
| `mock-*.webp` (1672×1100) · 상품 `p01~p06.jpg` | 브라우저 창 + 휴대폰 목업 |
| `hero-fixable.webp` (1920×1080) | 화면들을 기울어진 격자로 놓은 쇼릴 |
| 첫 화면 영상 | `video/hero-fixable.mp4`(스크럽용 1600×900 · 2.2MB) · `video/hero-fixable-loop.mp4`(모션 줄이기용) — viral-finder `public/trendar/hero/hero-pearl-04.mp4` 그대로. 카페24 스킨 폴더에는 mp4 를 둘 수 없어 **jsDelivr 주소**(`…/gh/tlsdmsrud902/fixable@1e76b45/video/…`)로 연결. 영상을 바꾸면 새 커밋 번호로 `index.html` 의 `data-fx-scrub` · `data-fx-loop` 를 고친다 (jsDelivr 는 저장소 전체 50MB 제한) |
| `hero-fixable-poster.webp` | 영상 첫 프레임 — 영상을 받기 전 · 데이터 절약 모드에서 보인다 |
| `sq-*.webp` (480×480) | 첫 화면 카드의 상품 사진 (상품 이미지 p01~p06 을 줄인 것) |
| `mock-trendin.webp` · `work-trendin.webp` | TRENDIN : `tlsdmsrud902/viral-finder` 를 `npm ci` → `npx next dev -p 3100` 로 띄워 찍음 |
| `mock-seraphin.webp` | 세라핌 : **글자형 임시 이미지**. 이 작업 환경에서 adia90222.cafe24.com 이 막혀 캡처하지 못했다 → `_deploy/shots/seraphin-d.png` · `-m.png` 를 넣고 `fixable-images.js` 의 SITES 에 추가해 다시 만든다 |
| `card-style.webp` · `card-life.webp` | 휴대폰 3대 |
| `logo-fixable.webp` · `logo-fixable-white.webp` · `wordmark-fixable.webp` | Jost 글자 로고, 배경 투명 |

다시 만드는 순서 :
```bash
# 1) 6개 저장소를 ../tlsdmsrud902/ 에 받기 (wear k_eppum baby food902 inter pet)
# 2) 미리보기 서버 6개 (8801 ~ 8806, sites-shots.js 의 순서와 같게)
i=0; for r in wear k_eppum baby food902 inter pet; do i=$((i+1)); REPO=../tlsdmsrud902/$r PORT=$((8800+i)) node docs/tools/sites-serve.js & done
# 3) 캡처 → _deploy/shots/   4) 이미지 → SkinImg/fixable/ · cafe24-assets/products/
node docs/tools/sites-shots.js
node docs/tools/fixable-images.js          # 부분만 : skin | logo | products
```
- 첫 장면이 영상인 쇼핑몰(baby · pet)은 헤드리스 크롬이 mp4 를 못 틀어 빈 화면 → 캡처 전에 포스터(없으면 2번 장면 사진)로 바꿔 찍는다 (`sites-shots.js`)
- 이미지 속 글꼴은 웹 글꼴이 늦게 붙어 명조로 찍혔다 → Jost 파일을 `_deploy/fonts/` 에 받아 `@font-face` 로 쓴다
- 데모 쇼핑몰 화면이 바뀌면 다시 찍고, 파일업로더에는 **새 이름**으로 올린다 (CDN 캐시)

## 5. 그 밖에 바뀐 것
- 일괄 치환 `node docs/tools/rebrand-fixable.js` (이미 실행함) : wear902 → fixable / fixable902, `WEAR902_` → `FIXABLE_`, `SkinImg/wear/` → `SkinImg/fixable/`, 분류 키 outer/tops/dress → fashion/family/living
- `fixable/submenu-hero.html` (목록 · 게시판 배너), `fixable/guide.html` (주문 · 스킨 고르기 · 편집 모드 · 쿠폰/타임세일 안내), `store-content.js` (세일 화면 · 저널 · 리뷰 문구), `product/list.html` (세일 화면 기본 글자), `layout.html` `<title>`, `header.html` 띠배너 · 메뉴
- 푸터 · 회사소개의 전화 · 이메일 흐림(`fixable-blur`, 샘플 사이트용) 제거
- 지운 것 : wear 디자인센터 상세(`designcenter/`, `*-designcenter-*.html`), 설명서(`manual-cms/`), wear 전용 도구, wear 사진 · 상품 30개

## 6. 남은 일 (카페24 관리자 — fixable902 계정)
1. **디자인 복구** : `python3 docs/tools/make-restore.py` → `_deploy/fixable902_s2_261004003838_d_base_E.tar.gz` → 관리자 › 디자인 › 디자인 백업/복구 › 내 컴퓨터에서 복구 (처음 한 번만, 다음부터는 코드 편집기)
   - 백업 원본 없이 만든다 : 최상위 폴더 `base`, 스킨 파일 전부 + **스킨 이미지(`SkinImg/fixable/`)도 포함** → 이미지 주소는 `/SkinImg/fixable/…` 그대로 (파일업로더 · pg 번호 불필요)
   - 주문서 바로가기 링크 51개는 카페24 서버 공통 경로라 `docs/tools/restore-links.txt` 로 만든다 (pet 백업에서 뽑음)
   - 복구가 "파일 압축 형식이 다릅니다" 로 막히면 형식을 `application/x-gzip` 으로 넣는다. 두 번째 복구부터는 **새 백업 이름**으로 (같은 이름이면 반영이 안 된다)
2. (선택) 백업 원본을 받은 경우 : 파일업로더 `fixable` 폴더에 이미지를 올리고 `python3 docs/pack.py <백업.tar.gz> <pg번호>` 방식도 쓸 수 있다
3. 분류 이름 변경 : 24 패션 · 뷰티 · 25 키즈 · 펫 · 26 푸드 · 리빙 · 27 SALE · 28 전체 스킨
4. 상품 6개 등록(사진 **파일 업로드**) · 메인 진열 2(추천)에 6개 모두 · 옵션(단순 적용 / 커스터마이징 +180,000원)
5. 실제 상품번호가 11 ~ 16 이 아니면 `index.html` 의 `product_no=` 6곳 교체
6. **세일 쿠폰** : `store-content.js` 의 쿠폰 번호 4개는 **wear902 쿠폰**이다 → fixable902 에서 4종을 만들고 교체, `layout.html` 의 `store-content.js?v=` 올리기
7. 게시판 2번(화면 관리) · 3번(FAQ) `is_using_board` · `use_board` 켜기, 6번(상품 Q&A)을 "프로젝트 문의"로 이름 변경
8. 회사 정보(대표 전화 · 이메일 · 주소 · 사업자 번호) 입력 — 푸터에 그대로 보인다
9. 리뷰 6개 [연출 예시] 등록 (스킨 적용 **뒤에** 올려야 상품에 연결된다)

## 7. 확인 결과 (로컬 미리보기 `node docs/tools/serve.js`)
- PC · 휴대폰 메인 : 깨진 이미지 0, 스크립트 오류 0 (jQuery 류는 카페24 서버에서만 채워지는 스크립트라 정상)
- `?edit=1` : 섹션 12곳 [고치기] 버튼, 편집 막대 정상
- 전체 스킨 목록 · 배너, 가이드, 상품 상세 화면 확인

## 8. 쇼핑 도우미(챗봇) — 이벤트 기간 구매 시에만 제공 (2026-10-04)

wear 저장소에서 단독 기능으로 분리한 쇼핑 도우미(`tlsdmsrud902/wear` 브랜치 `claude/loving-lovelace-k9podc`, 커밋 `f872708`)를 그대로 가져왔다. 자세한 사용법은 `docs/4. 사이트 챗봇 도우미.md`.

| 무엇 | 내용 |
|---|---|
| 파일 | `addons/shop-helper/` (원본 · README · demo) + 스킨 `skin1/addons/shop-helper/shop-helper.js` · `shop-helper.config.js`, 테스트 `docs/tools/shop-helper/` |
| 넣은 곳 | `layout.html` 의 `</body>` 바로 앞 두 줄 (설정 → 본체). **빼려면 그 두 줄을 지운다** |
| fixable 설정 | `shop-helper.config.js` : 이름 「fixable 도우미」, 메뉴 6개(스킨 고르기 · 가격 · 이벤트 · 설치 · 적용 · 수정 · 편집 모드 · 결제 · 환불 · 상담원 연결) + 자주 묻는 질문, 질문과 답 14개를 스킨 판매용으로 통째로 바꿈 (배송 · 사이즈 같은 기본 질문은 쓰지 않음) |
| 이벤트 안내 | **10월 31일까지 구매한 분께만 스킨에 무료 설치**, 기간 뒤 구매는 포함 안 됨 — 메인 새 섹션 「이벤트 쇼핑 도우미」(D-day · 휴대폰 속 대화 시연 · [지금 직접 써 보기] 로 실제 도우미 열기), 가격표 Basic · Custom 맨 위 줄, 자주 묻는 질문, 맨 위 띠배너, 도우미 자신의 답 |
| 마감일 바꾸기 | `index.html` 의 `data-fx-dday` · 문구 「10월 31일」(메인 · 가격 · FAQ · 띠배너 `header.html`) · `shop-helper.config.js` 의 greeting · 답 — 같이 고친다. 마감일이 지나면 D-day 자리에 「마감」 |
| ⚠ 주의 | AI 가 아니라 사장님이 적어 둔 질문 · 답으로만 답하는 상담 창이라, 소개 문구에 「AI」를 쓰지 않았다. fixable 은 wear-cms 계열이 아니라서 `?edit=1` 의 [쇼핑 도우미 고치기] 편집 창은 없다 → 설정 파일로 고친다 |
| 확인 | 로컬 : PC · 휴대폰 메뉴 7개(자주 묻는 질문 포함) → 「가격 · 이벤트」 → 「쇼핑 도우미(챗봇)도 같이 주나요?」 답, [지금 직접 써 보기] 로 열림, 오류 0. 실제 카페24 · 실제 휴대폰은 아직 |

## 9. 기능 쇼케이스 · 편집 주소 비공개 (2026-10-04)

- 메인 「04 What's inside」를 **움직이는 시연**으로 다시 만들었다 : 01 ~ 08 을 **벤토 그리드**(크기가 다른 어두운 카드 모자이크)로. 위 작업물이 좌우 교차라 같은 패턴이 반복되지 않게 바꿨다. 카드 = 위 설명(번호 · 분류 · 제목 · 설명) + 아래 시연. PC `01 02 / 03 + 07(세로 긴 카드) / 04 / 05 06 / 08(한 줄 전체 · 따뜻한 빛)`, 태블릿 `01 / 02 05 / 03 / 04 / 06 07 / 08`, 휴대폰 한 줄씩. 시연은 화면에 들어올 때마다 처음부터 재생되고, 누르면 다시 재생
  | # | 기능 | 시연 |
  |---|---|---|
  | 01 | 편집 모드 | [첫 화면 고치기] → 편집 창에 글자가 써지고 저장 → 제목이 바뀜 |
  | 02 | 쿠폰 뽑기 | 카드 섞기 → 가운데 카드가 뒤집혀 50% → 축하 조각 |
  | 03 | 타임세일 | TIME SALE 스티커 · 1초씩 줄어드는 남은 시간 띠 |
  | 04 | **마감 카운트다운** (스크롤 히어로 대신) | 이벤트 마감(`data-fx-countdown`, 10/31)까지 실제로 흐르는 넘김 시계 |
  | 05 | 장면 속 상품 | 마우스가 + 로 가서 누르면 상품 창 |
  | 06 | 포토리뷰 자동 진열 | 후기 카드가 쌓이고 ★ 4.9 · 리뷰 128 (예시 숫자) |
  | 07 | 반응형 | PC → 태블릿 → 휴대폰으로 화면이 줄어듦 |
  | 08 | **쇼핑 도우미 챗봇** (Easy 편집기 대신) | 질문 → 입력 중 … → 답 · 이벤트 D-day · [지금 직접 써 보기] |
- 시연 사진 `SkinImg/fixable/demo-*.webp` (inter 책장 · 각 쇼핑몰 히어로 사진)
- **편집 주소(`?edit=1`)는 영업 비밀** → 손님에게 보이는 문구 · 도우미 답 · HTML 주석 · 설정 파일 주석에서 모두 뺐다(「관리자 전용 편집 모드」로). 스크립트가 편집 모드를 알아보는 코드 자체(`/[?&]edit=1/`)는 기능이라 남아 있다
- ⚠ GitHub 저장소가 공개라면 `docs/` 문서들에는 편집 주소가 그대로 적혀 있다 (이전 프로젝트 기록 포함)
