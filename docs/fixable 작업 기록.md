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
| 1 | 첫 화면 | 큰 영문 "We design stores that actually sell." + 제목 · 버튼 2개 + 숫자 4칸 + 작업물 쇼릴 사진(스크롤하면 커짐) |
| 2 | 업종 띠 | Fashion · Beauty · Kids · Food · Living · Pet 이 옆으로 흐름 |
| 3 | 01 About | 소개 문장이 스크롤에 맞춰 한 단어씩 진해짐 |
| 4 | 02 Why fixable | 고민 4개 → 해결 4개 |
| 5 | 03 Selected works | 작업물 6개를 한 줄씩 크게 (목업 · 업종 · 설명 · 특징 태그 · 스킨 자세히 보기 · 라이브 데모) |
| 6 | 04 What's inside | 공통 기능 8개 |
| 7 | 05 Mobile first | 휴대폰 화면 6개가 옆으로 흐름 (검정 배경) |
| 8 | 06 Shop the skins | 카페24 메인 진열 1(추천상품) 6개, 3열 |
| 9 | 07 Process | 4단계 (왼쪽 제목 고정) |
| 10 | 08 Pricing | Basic 250,000 · Custom 430,000 · Studio 별도 견적 |
| 11 | 09 Client notes | 상품 사용후기(4번) 사진 후기 — `fixable-reviews.js` |
| 12 | 10 FAQ | 질문 5개 |
| 13 | 문의 | "Let's fix your store." + 문의 버튼 (검정 배경, 푸터와 바로 붙음) |

- 파일 : `layout/basic/css/fixable-agency.css`, `layout/basic/js/fixable-agency.js` (외부 라이브러리 없음)
- 지운 파일 : `fixable-cozy-home.css/js`, `fixable-modern.css`, `fixable-editorial.css`, `st-world.css` (옛 쇼핑몰 메인 전용)
- `<main id="lw-home">` 는 그대로 둔다 → 공통 CSS 의 `body:has(#lw-home)` 와 편집 모드가 메인으로 알아본다
- 이벤트 팝업은 끔 (`store-content.js` 의 `popup.enabled = false`)

## 4. 이미지

| 이미지 | 만드는 법 |
|---|---|
| `work-*.webp` (PC 첫 화면) · `mobile-*.webp` (휴대폰 첫 화면) | 6개 쇼핑몰 캡처 |
| `mock-*.webp` (1672×1100) · 상품 `p01~p06.jpg` | 브라우저 창 + 휴대폰 목업 |
| `hero-fixable.webp` (1920×1080) | 6개 화면을 기울어진 격자로 놓은 쇼릴 |
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
1. 파일업로더에 `fixable` 폴더 → `SkinImg/fixable/*.webp` 24개 올리기 → **이미지 주소의 `pg…` 번호 확인**
2. 디자인 백업 → `python3 docs/pack.py <백업.tar.gz> <pg번호>` → 디자인 복구 (처음 한 번만, 다음부터는 코드 편집기)
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
