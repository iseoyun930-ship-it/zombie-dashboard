# ☣️ Zombie Dashboard — SillyTavern Extension

좀비 아포칼립스 테마의 SillyTavern 확장입니다.  
대시보드, 카운트다운 타이머, 작전 패널(자원/경보/임무)을 포함합니다.

## 📁 파일 구조

```
zombie-dashboard/
├── manifest.json   ← 확장 메타데이터
├── index.js        ← 메인 로직
├── style.css       ← 좀비 테마 스타일
└── README.md       ← 설치 안내
```

## 🔧 설치 방법

1. 이 폴더 전체를 SillyTavern의 아래 경로에 복사합니다:
   ```
   SillyTavern/data/<유저명>/extensions/zombie-dashboard/
   ```
   또는 전체 유저 공유 설치 시:
   ```
   SillyTavern/public/scripts/extensions/third-party/zombie-dashboard/
   ```

2. SillyTavern을 재시작합니다.

3. 우측 상단 **Extensions(퍼즐 아이콘)** → **Manage Extensions** 에서  
   **☣️ Zombie Dashboard** 를 활성화합니다.

4. Extensions 설정 패널에 좀비 대시보드가 나타납니다!

---

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

### ☢ 작전 탭 (타이머 종료 후 2번째 색인)
세 가지 모드 중 선택:

| 모드 | 내용 |
|------|------|
| 🏕 생존 | 식량/물/탄약/의약품 자원 게이지 |
| 🚨 경보 | 커스텀 메시지 경보 발령 + 히스토리 |
| 📋 임무 | 임무 목록 추가/완료/삭제 |

---

## ⚙️ 설정 저장
모든 설정(감염도, 생존일수, 임무목록 등)은 SillyTavern의  
`extensionSettings`에 자동 저장됩니다.
