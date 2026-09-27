# ☣️ Zombie Dashboard — SillyTavern Extension

좀비 아포칼립스 테마의 SillyTavern 확장입니다.
화면 위에 떠 있는 작은 창(플로팅 패널)으로 대시보드, 카운트다운 타이머, 작전 패널(자원/경보/임무)을 보여줍니다.

## 📁 파일 구조

```
zombie-dashboard/
├── manifest.json   ← 확장 메타데이터
├── index.js        ← 메인 로직
├── style.css       ← 좀비 테마 스타일
└── README.md       ← 이 문서
```

## 🔧 설치 방법

**방법 1. SillyTavern 안에서 바로 설치 (추천)**

1. SillyTavern 우측 상단 **Extensions(퍼즐 아이콘)** → **Install Extension**
2. 이 저장소 주소를 입력:
   ```
   https://github.com/iseoyun930-ship-it/zombie-dashboard
   ```
3. 설치가 끝나면 자동으로 확장 목록에 **☣️ Zombie Dashboard**가 나타납니다.

> ⚠️ 이 방법이 작동하려면 저장소 최상위(root)에 `manifest.json`이 바로 있어야 합니다.
> `zombie-dashboard/zombie-dashboard/...`처럼 폴더가 중첩되어 있으면 `Internal Server Error`가 납니다.

**방법 2. 수동 설치**

이 4개 파일을 SillyTavern 서버의 아래 경로에 직접 복사합니다:
```
SillyTavern/public/scripts/extensions/third-party/zombie-dashboard/
```
복사 후 서버를 재시작하세요.

## 🧟 사용 방법

- 확장을 켜면 화면 오른쪽 위에 **작은 창이 자동으로 뜹니다.**
- 헤더(상단 바)를 잡고 드래그하면 원하는 위치로 옮길 수 있고, 위치는 자동 저장됩니다.
- 헤더의 **▲** 를 누르면 창 내용만 접혔다 펴집니다.
- 헤더의 **✕** 를 누르면 창이 완전히 닫힙니다.
- 다시 열고 싶으면 채팅 입력창 옆 **마법봉(⚡ 확장 메뉴)** 아이콘을 눌러 **Zombie Dashboard** 항목을 클릭하세요.

## 🧟 기능 설명

### 📊 대시보드 탭
- **생존 일수** / **감염도** / **메시지 수** 실시간 표시
- 감염 레벨 게이지 (녹색 → 주황 → 빨강)
- 생존 로그 (최근 20개)
- 감염 +/-10 버튼, +1일 버튼

### ⏱ 타이머 탭
- 30초 / 1분 / 3분 / 5분 프리셋
- 커스텀 초 직접 입력
- **타이머 종료 시 → 자동으로 작전 패널 전환 + 경보 발령**

### ☢ 작전 탭 (타이머 종료 후 2번째 탭)
세 가지 모드 중 선택:

| 모드 | 내용 |
|------|------|
| 🏕 생존 | 식량/물/탄약/의약품 자원 게이지 |
| 🚨 경보 | 커스텀 메시지 경보 발령 + 히스토리 |
| 📋 임무 | 임무 목록 추가/완료/삭제 |

## ⚙️ 설정 저장

감염도, 생존일수, 임무 목록, 창 위치/표시 여부 등 모든 설정은
SillyTavern의 `extensionSettings`에 자동 저장됩니다.
