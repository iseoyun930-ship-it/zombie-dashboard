// ☣️ Zombie Dashboard Extension for SillyTavern
// 대시보드 패널 + 타이머 + 알림 시스템

import { getContext } from '../../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';

const EXT_NAME = 'zombie-dashboard';

// ─── 기본 설정 ───────────────────────────────────────────────
const defaultSettings = {
    enabled: true,
    panelOpen: true,
    timerDuration: 60,           // 초 단위
    alertSound: true,
    alertMessage: '⚠️ 감염 경보!',
    secondPanelMode: 'survival', // 타이머 종료 후 2번째 패널 모드
    survivalDays: 0,
    infectionLevel: 0,           // 0~100
    missionLog: [],
};

let settings = Object.assign({}, defaultSettings);
let timerInterval = null;
let timerRemaining = 0;
let timerRunning = false;
let alertQueue = [];

// ─── 설정 로드/저장 ──────────────────────────────────────────
function loadSettings() {
    const ctx = getContext();
    if (!ctx.extensionSettings[EXT_NAME]) {
        ctx.extensionSettings[EXT_NAME] = Object.assign({}, defaultSettings);
    }
    settings = Object.assign({}, defaultSettings, ctx.extensionSettings[EXT_NAME]);
    timerRemaining = settings.timerDuration;
}

function saveSettings() {
    const ctx = getContext();
    ctx.extensionSettings[EXT_NAME] = Object.assign({}, settings);
    saveSettingsDebounced();
}

// ─── HTML 패널 렌더링 ─────────────────────────────────────────
function buildPanel() {
    return `
<div id="zombie-panel" class="zombie-panel ${settings.panelOpen ? '' : 'collapsed'}">

  <!-- 헤더 -->
  <div class="zombie-header" id="zombie-toggle-btn">
    <span class="zombie-skull">☣</span>
    <span class="zombie-title">DEAD ZONE CONTROL</span>
    <span class="zombie-chevron">▲</span>
  </div>

  <!-- 패널 본문 -->
  <div class="zombie-body">

    <!-- ══ 탭 메뉴 ══ -->
    <div class="zombie-tabs">
      <button class="z-tab active" data-tab="dashboard">📊 대시보드</button>
      <button class="z-tab" data-tab="timer">⏱ 타이머</button>
      <button class="z-tab" data-tab="panel2">☢ 작전</button>
    </div>

    <!-- ══ 탭 1: 대시보드 ══ -->
    <div class="z-tabcontent active" id="ztab-dashboard">

      <div class="zombie-stat-row">
        <div class="zombie-stat">
          <div class="zstat-label">생존 일수</div>
          <div class="zstat-value" id="z-survival-days">${settings.survivalDays}</div>
        </div>
        <div class="zombie-stat">
          <div class="zstat-label">감염도</div>
          <div class="zstat-value infection" id="z-infection">${settings.infectionLevel}%</div>
        </div>
        <div class="zombie-stat">
          <div class="zstat-label">메시지 수</div>
          <div class="zstat-value" id="z-msg-count">0</div>
        </div>
      </div>

      <!-- 감염도 게이지 -->
      <div class="z-gauge-wrap">
        <div class="z-gauge-label">⚠ 감염 레벨</div>
        <div class="z-gauge-bg">
          <div class="z-gauge-fill" id="z-gauge-fill" style="width:${settings.infectionLevel}%"></div>
        </div>
      </div>

      <!-- 알림 로그 -->
      <div class="z-alert-log" id="z-alert-log">
        <div class="z-log-header">📡 생존 로그</div>
        <div class="z-log-list" id="z-log-list">
          <div class="z-log-entry init">— 시스템 부팅 완료 —</div>
        </div>
      </div>

      <!-- 빠른 액션 -->
      <div class="z-action-row">
        <button class="z-btn danger" id="z-inc-infection">감염 +10</button>
        <button class="z-btn safe" id="z-dec-infection">치료 -10</button>
        <button class="z-btn neutral" id="z-inc-days">+1일</button>
      </div>
    </div>

    <!-- ══ 탭 2: 타이머 ══ -->
    <div class="z-tabcontent" id="ztab-timer">

      <div class="z-timer-display" id="z-timer-display">
        ${formatTime(settings.timerDuration)}
      </div>

      <div class="z-timer-label" id="z-timer-label">대기 중</div>

      <!-- 프리셋 -->
      <div class="z-preset-row">
        <button class="z-preset" data-sec="30">30초</button>
        <button class="z-preset" data-sec="60">1분</button>
        <button class="z-preset" data-sec="180">3분</button>
        <button class="z-preset" data-sec="300">5분</button>
      </div>

      <!-- 커스텀 입력 -->
      <div class="z-custom-row">
        <input type="number" id="z-custom-sec" class="z-input" min="1" max="9999"
               placeholder="초 입력" value="${settings.timerDuration}" />
        <button class="z-btn neutral" id="z-set-custom">설정</button>
      </div>

      <!-- 컨트롤 -->
      <div class="z-control-row">
        <button class="z-btn safe" id="z-timer-start">▶ 시작</button>
        <button class="z-btn danger" id="z-timer-stop">■ 정지</button>
        <button class="z-btn neutral" id="z-timer-reset">↺ 리셋</button>
      </div>

      <div class="z-timer-note">타이머 종료 시 → <b>작전</b> 패널 자동 활성화</div>
    </div>

    <!-- ══ 탭 3: 2번째 색인 - 작전 패널 ══ -->
    <div class="z-tabcontent" id="ztab-panel2">

      <div class="z-mission-header">☢ 생존 작전 본부</div>

      <!-- 모드 선택 -->
      <div class="z-mode-row">
        <button class="z-mode-btn ${settings.secondPanelMode === 'survival' ? 'active' : ''}"
                data-mode="survival">🏕 생존</button>
        <button class="z-mode-btn ${settings.secondPanelMode === 'alert' ? 'active' : ''}"
                data-mode="alert">🚨 경보</button>
        <button class="z-mode-btn ${settings.secondPanelMode === 'mission' ? 'active' : ''}"
                data-mode="mission">📋 임무</button>
      </div>

      <!-- 생존 모드 -->
      <div class="z-mode-content" id="zmode-survival"
           style="display:${settings.secondPanelMode === 'survival' ? 'block' : 'none'}">
        <div class="z-survival-grid">
          <div class="z-resource">
            <div class="z-res-icon">🍖</div>
            <div class="z-res-name">식량</div>
            <div class="z-res-bar"><div class="z-res-fill food" style="width:60%"></div></div>
          </div>
          <div class="z-resource">
            <div class="z-res-icon">💧</div>
            <div class="z-res-name">물</div>
            <div class="z-res-bar"><div class="z-res-fill water" style="width:40%"></div></div>
          </div>
          <div class="z-resource">
            <div class="z-res-icon">🔫</div>
            <div class="z-res-name">탄약</div>
            <div class="z-res-bar"><div class="z-res-fill ammo" style="width:25%"></div></div>
          </div>
          <div class="z-resource">
            <div class="z-res-icon">💊</div>
            <div class="z-res-name">의약품</div>
            <div class="z-res-bar"><div class="z-res-fill meds" style="width:80%"></div></div>
          </div>
        </div>
        <button class="z-btn neutral" id="z-refresh-resources" style="margin-top:10px;width:100%">
          🔄 자원 업데이트
        </button>
      </div>

      <!-- 경보 모드 -->
      <div class="z-mode-content" id="zmode-alert"
           style="display:${settings.secondPanelMode === 'alert' ? 'block' : 'none'}">
        <div class="z-alert-config">
          <label class="z-label">경보 메시지</label>
          <input type="text" id="z-alert-msg" class="z-input" value="${settings.alertMessage}" />
          <label class="z-label z-toggle-row">
            <input type="checkbox" id="z-alert-sound" ${settings.alertSound ? 'checked' : ''} />
            <span>소리 알림 활성화</span>
          </label>
          <button class="z-btn danger" id="z-trigger-alert" style="width:100%;margin-top:8px">
            🚨 경보 발령
          </button>
        </div>

        <!-- 경보 히스토리 -->
        <div class="z-alert-history" id="z-alert-history">
          <div class="z-label" style="margin-top:12px">최근 경보</div>
          <div class="z-history-list" id="z-history-list"></div>
        </div>
      </div>

      <!-- 임무 모드 -->
      <div class="z-mode-content" id="zmode-mission"
           style="display:${settings.secondPanelMode === 'mission' ? 'block' : 'none'}">
        <div class="z-mission-input-row">
          <input type="text" id="z-mission-input" class="z-input" placeholder="새 임무 입력..." />
          <button class="z-btn safe" id="z-add-mission">추가</button>
        </div>
        <div class="z-mission-list" id="z-mission-list">
          ${settings.missionLog.map((m, i) => renderMission(m, i)).join('')}
        </div>
        <button class="z-btn danger" id="z-clear-missions" style="width:100%;margin-top:8px">
          🗑 임무 전체 삭제
        </button>
      </div>
    </div>

  </div><!-- /zombie-body -->
</div><!-- /zombie-panel -->
    `;
}

// ─── 임무 항목 렌더링 ────────────────────────────────────────
function renderMission(m, i) {
    return `
<div class="z-mission-item ${m.done ? 'done' : ''}" data-idx="${i}">
  <input type="checkbox" class="z-mission-check" ${m.done ? 'checked' : ''} />
  <span class="z-mission-text">${m.text}</span>
  <button class="z-mission-del">✕</button>
</div>`;
}

// ─── 시간 포맷 ───────────────────────────────────────────────
function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// ─── 로그 추가 ───────────────────────────────────────────────
function addLog(msg, type = '') {
    const list = document.getElementById('z-log-list');
    if (!list) return;
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement('div');
    div.className = `z-log-entry ${type}`;
    div.innerHTML = `<span class="z-log-time">${now}</span> ${msg}`;
    list.prepend(div);
    // 최대 20개 유지
    while (list.children.length > 20) list.removeChild(list.lastChild);
}

// ─── 알림 발령 ───────────────────────────────────────────────
function triggerAlert(msg) {
    // 화면 플래시
    const panel = document.getElementById('zombie-panel');
    if (panel) {
        panel.classList.add('alert-flash');
        setTimeout(() => panel.classList.remove('alert-flash'), 1000);
    }
    // 히스토리 추가
    const histList = document.getElementById('z-history-list');
    if (histList) {
        const now = new Date().toLocaleTimeString('ko-KR');
        const item = document.createElement('div');
        item.className = 'z-history-item';
        item.textContent = `[${now}] ${msg}`;
        histList.prepend(item);
        while (histList.children.length > 10) histList.removeChild(histList.lastChild);
    }
    addLog(msg, 'alert');
    // 소리 알림 (Web Audio API)
    if (settings.alertSound) playBeep();
}

// ─── 비프음 ─────────────────────────────────────────────────
function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [0, 0.15, 0.3].forEach(offset => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            osc.type = 'square';
            gain.gain.setValueAtTime(0.3, ctx.currentTime + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.12);
            osc.start(ctx.currentTime + offset);
            osc.stop(ctx.currentTime + offset + 0.12);
        });
    } catch (e) { /* 오디오 컨텍스트 없으면 무시 */ }
}

// ─── 타이머 로직 ─────────────────────────────────────────────
function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    updateTimerUI();
    timerInterval = setInterval(() => {
        timerRemaining--;
        updateTimerUI();
        if (timerRemaining <= 0) {
            clearInterval(timerInterval);
            timerRunning = false;
            onTimerEnd();
        }
    }, 1000);
    addLog('⏱ 타이머 시작', 'info');
}

function stopTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    const lbl = document.getElementById('z-timer-label');
    if (lbl) lbl.textContent = '정지됨';
    addLog('⏱ 타이머 정지');
}

function resetTimer() {
    stopTimer();
    timerRemaining = settings.timerDuration;
    updateTimerUI(true);
}

function updateTimerUI(reset = false) {
    const disp = document.getElementById('z-timer-display');
    const lbl  = document.getElementById('z-timer-label');
    if (!disp) return;
    disp.textContent = formatTime(timerRemaining);

    const pct = timerRemaining / settings.timerDuration;
    disp.className = 'z-timer-display';
    if (!reset) {
        if (pct <= 0.25) disp.classList.add('danger');
        else if (pct <= 0.5) disp.classList.add('warning');
    }
    if (lbl) lbl.textContent = timerRunning ? '작동 중...' : (reset ? '대기 중' : lbl.textContent);
}

function onTimerEnd() {
    const lbl = document.getElementById('z-timer-label');
    if (lbl) lbl.textContent = '⚠ 시간 종료!';
    addLog('⏱ 타이머 종료 → 작전 패널 전환', 'alert');
    triggerAlert('⏰ 타이머 종료 — 작전 패널을 확인하세요!');
    // 자동으로 2번째 탭(작전) 활성화
    switchTab('panel2');
}

// ─── 탭 전환 ─────────────────────────────────────────────────
function switchTab(name) {
    document.querySelectorAll('.z-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.z-tabcontent').forEach(c => {
        c.classList.toggle('active', c.id === `ztab-${name}`);
    });
}

// ─── 감염도 업데이트 ──────────────────────────────────────────
function updateInfection(delta) {
    settings.infectionLevel = Math.max(0, Math.min(100, settings.infectionLevel + delta));
    const el = document.getElementById('z-infection');
    const fill = document.getElementById('z-gauge-fill');
    if (el) el.textContent = settings.infectionLevel + '%';
    if (fill) fill.style.width = settings.infectionLevel + '%';
    fill?.className && (fill.className = 'z-gauge-fill ' + (
        settings.infectionLevel >= 80 ? 'critical' :
        settings.infectionLevel >= 50 ? 'high' : ''
    ));
    addLog(delta > 0 ? `🦠 감염도 증가: ${settings.infectionLevel}%` : `💉 감염도 감소: ${settings.infectionLevel}%`,
           settings.infectionLevel >= 80 ? 'alert' : 'info');
    saveSettings();
}

// ─── 메시지 카운트 동기화 ────────────────────────────────────
function syncMsgCount() {
    const ctx = getContext();
    const el = document.getElementById('z-msg-count');
    if (el && ctx.chat) el.textContent = ctx.chat.length;
}

// ─── 이벤트 바인딩 ───────────────────────────────────────────
function bindEvents() {
    // 패널 토글
    document.getElementById('zombie-toggle-btn')?.addEventListener('click', () => {
        const panel = document.getElementById('zombie-panel');
        const chev  = panel?.querySelector('.zombie-chevron');
        settings.panelOpen = !settings.panelOpen;
        panel?.classList.toggle('collapsed', !settings.panelOpen);
        if (chev) chev.textContent = settings.panelOpen ? '▲' : '▼';
        saveSettings();
    });

    // 탭 전환
    document.querySelectorAll('.z-tab').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // 타이머 컨트롤
    document.getElementById('z-timer-start')?.addEventListener('click', startTimer);
    document.getElementById('z-timer-stop')?.addEventListener('click', stopTimer);
    document.getElementById('z-timer-reset')?.addEventListener('click', resetTimer);

    // 프리셋
    document.querySelectorAll('.z-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            settings.timerDuration = parseInt(btn.dataset.sec);
            timerRemaining = settings.timerDuration;
            resetTimer();
            const inp = document.getElementById('z-custom-sec');
            if (inp) inp.value = settings.timerDuration;
            saveSettings();
        });
    });

    // 커스텀 초 설정
    document.getElementById('z-set-custom')?.addEventListener('click', () => {
        const val = parseInt(document.getElementById('z-custom-sec')?.value);
        if (val > 0) {
            settings.timerDuration = val;
            timerRemaining = val;
            resetTimer();
            saveSettings();
        }
    });

    // 감염도
    document.getElementById('z-inc-infection')?.addEventListener('click', () => updateInfection(10));
    document.getElementById('z-dec-infection')?.addEventListener('click', () => updateInfection(-10));

    // +1일
    document.getElementById('z-inc-days')?.addEventListener('click', () => {
        settings.survivalDays++;
        const el = document.getElementById('z-survival-days');
        if (el) el.textContent = settings.survivalDays;
        addLog(`📅 생존 ${settings.survivalDays}일째`, 'info');
        saveSettings();
    });

    // 경보 발령
    document.getElementById('z-trigger-alert')?.addEventListener('click', () => {
        const msg = document.getElementById('z-alert-msg')?.value || settings.alertMessage;
        settings.alertMessage = msg;
        triggerAlert(msg);
        saveSettings();
    });

    // 알림 사운드 토글
    document.getElementById('z-alert-sound')?.addEventListener('change', e => {
        settings.alertSound = e.target.checked;
        saveSettings();
    });

    // 모드 전환 (작전 패널)
    document.querySelectorAll('.z-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            settings.secondPanelMode = btn.dataset.mode;
            document.querySelectorAll('.z-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
            document.querySelectorAll('.z-mode-content').forEach(c => {
                c.style.display = c.id === `zmode-${btn.dataset.mode}` ? 'block' : 'none';
            });
            saveSettings();
        });
    });

    // 임무 추가
    document.getElementById('z-add-mission')?.addEventListener('click', addMission);
    document.getElementById('z-mission-input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') addMission();
    });

    // 임무 삭제 (이벤트 위임)
    document.getElementById('z-mission-list')?.addEventListener('click', e => {
        const item = e.target.closest('.z-mission-item');
        if (!item) return;
        const idx = parseInt(item.dataset.idx);
        if (e.target.classList.contains('z-mission-del')) {
            settings.missionLog.splice(idx, 1);
            refreshMissionList();
            saveSettings();
        } else if (e.target.classList.contains('z-mission-check')) {
            settings.missionLog[idx].done = e.target.checked;
            item.classList.toggle('done', e.target.checked);
            addLog(e.target.checked ? `✅ 임무 완료: ${settings.missionLog[idx].text}` : `↩ 임무 재개: ${settings.missionLog[idx].text}`);
            saveSettings();
        }
    });

    // 임무 전체 삭제
    document.getElementById('z-clear-missions')?.addEventListener('click', () => {
        settings.missionLog = [];
        refreshMissionList();
        addLog('🗑 임무 전체 삭제');
        saveSettings();
    });

    // 자원 업데이트 (랜덤 시뮬레이션)
    document.getElementById('z-refresh-resources')?.addEventListener('click', refreshResources);
}

function addMission() {
    const inp = document.getElementById('z-mission-input');
    const text = inp?.value.trim();
    if (!text) return;
    settings.missionLog.push({ text, done: false });
    refreshMissionList();
    addLog(`📋 임무 추가: ${text}`, 'info');
    inp.value = '';
    saveSettings();
}

function refreshMissionList() {
    const list = document.getElementById('z-mission-list');
    if (list) list.innerHTML = settings.missionLog.map((m, i) => renderMission(m, i)).join('');
}

function refreshResources() {
    const fills = { food: null, water: null, ammo: null, meds: null };
    Object.keys(fills).forEach(key => {
        const el = document.querySelector(`.z-res-fill.${key}`);
        if (el) {
            const pct = Math.floor(Math.random() * 90) + 5;
            el.style.width = pct + '%';
        }
    });
    addLog('🔄 자원 현황 업데이트', 'info');
}

// ─── 진입점 ──────────────────────────────────────────────────
jQuery(async () => {
    loadSettings();

    // SillyTavern 사이드바 Extensions 섹션에 패널 추가
    // ST 버전에 따라 컨테이너 id가 다를 수 있어 순서대로 시도
    const target =
        document.getElementById('extensions_settings') ||
        document.getElementById('extensions_settings2') ||
        document.body;

    if (target) {
        const container = document.createElement('div');
        container.innerHTML = buildPanel();
        target.appendChild(container);
    } else {
        console.error('[ZombieDashboard] 패널을 붙일 위치를 찾지 못했습니다.');
    }

    // 이벤트 바인딩
    bindEvents();
    syncMsgCount();

    // 채팅 업데이트마다 메시지 수 동기화
    const ctx = getContext();
    ctx.eventSource?.on(ctx.event_types?.MESSAGE_RECEIVED, syncMsgCount);
    ctx.eventSource?.on(ctx.event_types?.MESSAGE_SENT, syncMsgCount);

    addLog('☣ Zombie Dashboard 로드 완료', 'info');
    console.log('[ZombieDashboard] 확장 초기화 완료');
});
