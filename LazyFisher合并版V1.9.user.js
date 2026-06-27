// ==UserScript==
// @name         LazyFisher 合并版
// @namespace    https://lazyfisher.toogle.club/
// @version      V1.9
// @description  合并 lazyfisher辅助增强、LazyFisher信息增强、LazyFisher环境显示
// @author       大白鲨 / 天雨灵泽 / LazyFisher / 土豆土豆斑
// @license      MIT
// @match        *://toogle.club:36018/*
// @match        *://lazyfisher.toogle.club/*
// @icon         https://lazyfisher.toogle.club/pwa/icon-192.png
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @require      https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js
// @run-at       document-start
// @connect      *
// ==/UserScript==

(function LazyFisherMergedBootstrap() {
    'use strict';

    const MODULES = {
        infoEnhance: {
            name: 'LazyFisher信息增强',
            key: 'lf_merged_enable_info_enhance',
            defaultEnabled: true,
            note: '新版统计/信息增强模块',
        },
        publicEnhance: {
            name: 'lazyfisher辅助增强(公开版)',
            key: 'lf_merged_enable_public_enhance',
            defaultEnabled: true,
            note: '公开版辅助增强模块，功能开关见页面底栏「LazyFisher 功能设置」',
        },
        environmentDisplay: {
            name: 'LazyFisher环境显示',
            key: 'lf_merged_enable_environment_display',
            defaultEnabled: false,
            note: '钓鱼概览环境、附近玩家、关联/IP状态显示',
        },
    };

    function getValue(key, fallback) {
        try {
            if (typeof GM_getValue === 'function') return GM_getValue(key, fallback);
            if (typeof GM !== 'undefined' && typeof GM.getValue === 'function') return GM.getValue(key, fallback);
        } catch (error) {
            console.warn('[LazyFisher 合并版] 读取配置失败', key, error);
        }
        return fallback;
    }

    function setValue(key, value) {
        try {
            if (typeof GM_setValue === 'function') return GM_setValue(key, value);
            if (typeof GM !== 'undefined' && typeof GM.setValue === 'function') return GM.setValue(key, value);
        } catch (error) {
            console.warn('[LazyFisher 合并版] 保存配置失败', key, error);
        }
        return undefined;
    }

    function isEnabled(moduleId) {
        const module = MODULES[moduleId];
        if (!module) return false;
        return getValue(module.key, module.defaultEnabled) !== false;
    }

    function setEnabled(moduleId, enabled) {
        const module = MODULES[moduleId];
        if (!module) return;
        setValue(module.key, !!enabled);
    }

    function toggleModule(moduleId) {
        setEnabled(moduleId, !isEnabled(moduleId));
    }

    let _publicFeatureSettings = null;

    function registerFeatureSettings(registry) {
        _publicFeatureSettings = registry;
        if (_settingsPanelApi?.refresh) _settingsPanelApi.refresh();
    }

    function injectSettingsStyles() {
        if (document.getElementById('lf-settings-styles')) return;
        const style = document.createElement('style');
        style.id = 'lf-settings-styles';
        style.textContent = `
#lf-settings-root {
    position: fixed;
    left: calc(100vw - 178px);
    top: calc(100vh - 62px);
    z-index: 999998;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 12px;
    pointer-events: none;
    width: max-content;
}
#lf-settings-root * { box-sizing: border-box; }
.lf-settings-bar {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 8px;
}
.lf-settings-toggle {
    border: 1px solid rgba(30, 64, 175, 0.9);
    background: rgba(30, 64, 175, 0.94);
    color: #fff;
    border-radius: 999px;
    padding: 7px 12px;
    cursor: grab;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.22);
    touch-action: none;
    user-select: none;
}
.lf-settings-toggle:hover { background: #1d4ed8; }
.lf-settings-toggle--dragging { cursor: grabbing; }
.lf-settings-toggle--active {
    background: #0f172a;
    border-color: #0f172a;
}
.lf-settings-hint {
    color: #64748b;
    font-size: 11px;
}
.lf-settings-hint--dirty { color: #b45309; font-weight: 600; }
.lf-settings-refresh {
    border: 1px solid #1e40af;
    background: #1e40af;
    color: #fff;
    border-radius: 6px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 11px;
    display: none;
}
.lf-settings-refresh--show { display: inline-block; }
.lf-settings-panel {
    pointer-events: auto;
    display: none;
    position: absolute;
    right: 0;
    bottom: 44px;
    width: min(560px, calc(100vw - 24px));
    max-height: min(52vh, 420px);
    overflow: auto;
    padding: 10px 14px 12px;
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(148, 163, 184, 0.45);
    border-radius: 10px;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.2);
    backdrop-filter: blur(8px);
}
.lf-settings-panel--open { display: block; }
.lf-settings-panel--align-left {
    left: 0;
    right: auto;
}
.lf-settings-panel--below {
    top: 44px;
    bottom: auto;
}
.lf-settings-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
}
.lf-settings-section {
    margin: 0 auto 10px;
}
.lf-settings-section-title {
    font-size: 11px;
    font-weight: 700;
    color: #475569;
    margin-bottom: 6px;
}
.lf-settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 6px 8px;
}
.lf-settings-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 28px;
    padding: 4px 8px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #fff;
    color: #334155;
    user-select: none;
}
.lf-settings-item-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.lf-settings-item input[type="checkbox"] {
    flex: 0 0 auto;
    width: 14px !important;
    height: 14px !important;
    min-width: 14px !important;
    min-height: 14px !important;
    margin: 0 !important;
    transform: none !important;
    accent-color: #1e40af;
}
.lf-settings-item--disabled { color: #94a3b8; }
.lf-settings-item--disabled input { cursor: not-allowed; }
`;
        (document.head || document.documentElement).appendChild(style);
    }

    const _settingsPanelApi = {};

    function mountSettingsPanel() {
        if (document.getElementById('lf-settings-root')) return;

        injectSettingsStyles();

        const root = document.createElement('div');
        root.id = 'lf-settings-root';

        const panel = document.createElement('div');
        panel.className = 'lf-settings-panel';
        panel.id = 'lf-settings-panel';

        const bar = document.createElement('div');
        bar.className = 'lf-settings-bar';

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'lf-settings-toggle';
        toggleBtn.textContent = 'LazyFisher 设置';
        toggleBtn.title = '点击展开功能设置，拖动可移动位置';

        const hint = document.createElement('span');
        hint.className = 'lf-settings-hint';
        hint.textContent = '更改后刷新页面生效';

        const refreshBtn = document.createElement('button');
        refreshBtn.type = 'button';
        refreshBtn.className = 'lf-settings-refresh';
        refreshBtn.textContent = '立即刷新';

        let panelOpen = false;
        let dirty = false;
        let isDragging = false;
        let hasDragged = false;
        let suppressClick = false;
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;

        const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

        function updatePanelPlacement() {
            const rect = root.getBoundingClientRect();
            panel.classList.toggle('lf-settings-panel--align-left', rect.left < window.innerWidth / 2);
            panel.classList.toggle('lf-settings-panel--below', rect.top < 260);
        }

        function applyRootPosition(left, top) {
            const maxLeft = Math.max(8, window.innerWidth - root.offsetWidth - 8);
            const maxTop = Math.max(8, window.innerHeight - root.offsetHeight - 8);
            root.style.left = `${clamp(left, 8, maxLeft)}px`;
            root.style.top = `${clamp(top, 8, maxTop)}px`;
            updatePanelPlacement();
        }

        function saveRootPosition() {
            const rect = root.getBoundingClientRect();
            setValue('lf_settings_float_pos', { left: Math.round(rect.left), top: Math.round(rect.top) });
        }

        const markDirty = () => {
            dirty = true;
            hint.textContent = '设置已保存，请刷新页面生效';
            hint.classList.add('lf-settings-hint--dirty');
            refreshBtn.classList.add('lf-settings-refresh--show');
        };

        toggleBtn.addEventListener('pointerdown', (event) => {
            if (event.button !== 0 && event.pointerType === 'mouse') return;
            isDragging = true;
            hasDragged = false;
            startX = event.clientX;
            startY = event.clientY;
            const rect = root.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            toggleBtn.classList.add('lf-settings-toggle--dragging');
            toggleBtn.setPointerCapture?.(event.pointerId);
        });

        toggleBtn.addEventListener('pointermove', (event) => {
            if (!isDragging) return;
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;
            applyRootPosition(startLeft + dx, startTop + dy);
        });

        toggleBtn.addEventListener('pointerup', (event) => {
            if (!isDragging) return;
            isDragging = false;
            toggleBtn.classList.remove('lf-settings-toggle--dragging');
            toggleBtn.releasePointerCapture?.(event.pointerId);
            if (hasDragged) {
                suppressClick = true;
                saveRootPosition();
            }
        });

        toggleBtn.addEventListener('pointercancel', () => {
            isDragging = false;
            toggleBtn.classList.remove('lf-settings-toggle--dragging');
        });

        toggleBtn.addEventListener('click', (event) => {
            if (suppressClick) {
                suppressClick = false;
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            panelOpen = !panelOpen;
            panel.classList.toggle('lf-settings-panel--open', panelOpen);
            toggleBtn.classList.toggle('lf-settings-toggle--active', panelOpen);
            updatePanelPlacement();
        });

        refreshBtn.addEventListener('click', () => location.reload());

        const renderItems = () => {
            panel.innerHTML = '';

            const panelHead = document.createElement('div');
            panelHead.className = 'lf-settings-panel-head';
            panelHead.appendChild(hint);
            panelHead.appendChild(refreshBtn);
            panel.appendChild(panelHead);

            const moduleSection = document.createElement('div');
            moduleSection.className = 'lf-settings-section';
            moduleSection.innerHTML = '<div class="lf-settings-section-title">合并版模块</div>';
            const moduleGrid = document.createElement('div');
            moduleGrid.className = 'lf-settings-grid';

            Object.entries(MODULES).forEach(([moduleId, module]) => {
                const label = document.createElement('label');
                label.className = 'lf-settings-item';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = isEnabled(moduleId);
                input.addEventListener('change', () => {
                    setEnabled(moduleId, input.checked);
                    markDirty();
                });
                label.appendChild(document.createElement('span')).className = 'lf-settings-item-name';
                label.lastChild.textContent = module.name;
                label.appendChild(input);
                moduleGrid.appendChild(label);
            });
            moduleSection.appendChild(moduleGrid);
            panel.appendChild(moduleSection);

            const pub = _publicFeatureSettings;
            if (pub?.features?.length) {
                const featSection = document.createElement('div');
                featSection.className = 'lf-settings-section';
                featSection.innerHTML = '<div class="lf-settings-section-title">辅助功能</div>';
                const featGrid = document.createElement('div');
                featGrid.className = 'lf-settings-grid';

                pub.features.forEach(f => {
                    const takenOver = pub.isHandledByInfoEnhance?.(f.id);
                    const label = document.createElement('label');
                    label.className = 'lf-settings-item' + (takenOver ? ' lf-settings-item--disabled' : '');
                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.disabled = !!takenOver;
                    input.checked = takenOver ? false : pub.isEnabled(f.id);
                    if (takenOver) {
                        const takeoverName = pub.getTakeoverLabel?.(f.id) ?? f.name;
                        label.title = `「${takeoverName}」已由信息增强接管`;
                        label.appendChild(document.createElement('span')).className = 'lf-settings-item-name';
                        label.lastChild.textContent = `${f.name}（接管）`;
                        label.appendChild(input);
                    } else {
                        input.addEventListener('change', () => {
                            pub.setEnabled(f.id, input.checked);
                            markDirty();
                        });
                        label.appendChild(document.createElement('span')).className = 'lf-settings-item-name';
                        label.lastChild.textContent = f.name;
                        label.appendChild(input);
                    }
                    featGrid.appendChild(label);
                });
                featSection.appendChild(featGrid);
                panel.appendChild(featSection);
            }
        };

        renderItems();
        _settingsPanelApi.refresh = renderItems;

        bar.appendChild(toggleBtn);
        root.appendChild(panel);
        root.appendChild(bar);
        (document.body ?? document.documentElement).appendChild(root);

        const savedPos = getValue('lf_settings_float_pos', null);
        applyRootPosition(savedPos?.left ?? window.innerWidth - 170, savedPos?.top ?? window.innerHeight - 62);
        window.addEventListener('resize', () => {
            const rect = root.getBoundingClientRect();
            applyRootPosition(rect.left, rect.top);
        });
    }

    function scheduleSettingsPanel() {
        const boot = () => {
            if (!document.body) {
                requestAnimationFrame(boot);
                return;
            }
            mountSettingsPanel();
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', boot);
        } else {
            boot();
        }
    }

    window.LazyFisherMerged = Object.freeze({
        isEnabled,
        setEnabled,
        modules: MODULES,
        registerFeatureSettings,
    });

    scheduleSettingsPanel();
})();


// ============================================================================
// Module: LazyFisher信息增强
// Source: Base/LazyFisher信息增强正式版.js
// Default: enabled
// ============================================================================
try {
    if (window.LazyFisherMerged?.isEnabled('infoEnhance')) {
GM_addStyle(`
    .lll_Button_battlePlayerFood__custom {
    background-color: #546ddb !important;
    color: white;
    border-radius: 5px;
    padding: 5px 10px;
    cursor: pointer;
    transition: background-color 0.15s ease-out;
}

.lll_Button_battlePlayerFood__custom:hover {
    background-color: #6b84ff !important;
}

.lll_Button_battlePlayerLoot__custom {
    background-color: #db5454 !important;
    color: white;
    border-radius: 5px;
    padding: 5px 10px;
    cursor: pointer;
    transition: background-color 0.15s ease-out;
}

.lll_Button_battlePlayerLoot__custom:hover {
    background-color: #ff6b6b !important;
}

:root {
    --button-close: rgb(187, 94, 94);
    --button-close-hover: rgb(228, 117, 117);
    --button-close-click: rgb(168, 86, 86);
    --button-settings: rgb(118, 130, 182);
    --button-settings-hover: rgb(135, 155, 230);
    --button-settings-click: rgb(100, 112, 151);

    --border: rgb(113, 123, 169);
    --border-separator: rgb(73, 81, 113);

    --card-background: rgb(42, 43, 66);
    --card-title-text: rgb(237, 239, 249);
    --card-title-background: rgb(57, 59, 88);

    --item-background: rgb(54, 60, 83);
    --item-border: rgb(103, 113, 149);
    --item-background-hover: #414662;
    --item-border-hover: rgb(123, 133, 179);

    --tab-background: #f8fafc;
    --tab-button: var(--border);
    --tab-button-hover: rgba(108, 117, 160, 0.5);
    --tab-button-click: rgb(68, 75, 111);

    --title-text-shadow: 0 0 1.5px rgba(42, 43, 66, 0.6);

    --lf-exp-baby-color: #06b6d4;
}

/* 钓鱼页：日志起鱼记录 & 上鱼提示框 — 按评级着色（不改动 padding/gap，保持与原 .fishing-log-item 一致） */
.lf-fishing-log-catch,
.lf-catch-alert {
    --lf-rating-emphasis-weight: 600;
    --lf-exp-baby-color: #06b6d4;
}
/* 上鱼框鱼获行：仅着色，不加粗 */
.lf-catch-alert[data-lf-rating] .lf-catch-alert-fishinfo {
    font-weight: 400 !important;
}
/* 上鱼框评级行、日志/消息评级词：加粗着色 */
.lf-catch-alert[data-lf-rating] .lf-catch-alert-rating,
.lf-catch-alert[data-lf-rating] .lf-catch-alert-title,
.lf-catch-alert[data-lf-rating] strong.lf-catch-alert-title,
.lf-rating-label,
.lf-log-rating-label {
    font-weight: var(--lf-rating-emphasis-weight, 600) !important;
}
.lf-rating-label[data-rating="exp_baby"],
.lf-log-rating-label[data-rating="exp_baby"] {
    color: var(--lf-exp-baby-color) !important;
}
/* 狠活/败北标记：消息页、钓鱼日志、上鱼框统一外观 */
.lf-special-mark {
    margin-left: 6px;
    padding: 1px 7px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    vertical-align: middle;
}
.lf-fishing-log-catch .lf-special-mark {
    font-size: 0.85em;
    margin-left: 4px;
    padding: 0 5px;
}
.lf-catch-alert .lf-special-mark {
    margin-left: 6px;
}
/* 日志起鱼行：整行评级着色、不加粗；仅评级词加粗 */
.lf-fishing-log-catch[data-lf-rating="below_standard"] .fishing-log-message {
    color: var(--color-text-muted) !important;
    font-weight: 400 !important;
}
.lf-fishing-log-catch[data-lf-rating="standard"] .fishing-log-message {
    color: var(--color-success) !important;
    font-weight: 400 !important;
}
.lf-fishing-log-catch[data-lf-rating="rare"] .fishing-log-message {
    color: var(--color-primary) !important;
    font-weight: 400 !important;
}
.lf-fishing-log-catch[data-lf-rating="epic"] .fishing-log-message {
    color: var(--color-warning) !important;
    font-weight: 400 !important;
}
.lf-fishing-log-catch[data-lf-rating="legendary"] .fishing-log-message {
    color: var(--color-danger) !important;
    font-weight: 400 !important;
}
.lf-fishing-log-catch[data-lf-rating="exp_baby"] .fishing-log-message {
    color: var(--lf-exp-baby-color) !important;
    font-weight: 400 !important;
}
.lf-fishing-log-catch[data-lf-rating] .lf-log-rating-label {
    font-weight: var(--lf-rating-emphasis-weight, 600) !important;
}
.lf-fishing-log-catch[data-lf-rating="below_standard"] {
    background: color-mix(in srgb, var(--color-text-muted) 18%, var(--color-surface, #fff));
    border-color: color-mix(in srgb, var(--color-text-muted) 24%, transparent);
}
.lf-fishing-log-catch[data-lf-rating="standard"] {
    background: color-mix(in srgb, var(--color-success) 18%, var(--color-surface, #fff));
    border-color: color-mix(in srgb, var(--color-success) 24%, transparent);
}
.lf-fishing-log-catch[data-lf-rating="rare"] {
    background: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface, #fff));
    border-color: color-mix(in srgb, var(--color-primary) 24%, transparent);
}
.lf-fishing-log-catch[data-lf-rating="epic"] {
    background: color-mix(in srgb, var(--color-warning) 18%, var(--color-surface, #fff));
    border-color: color-mix(in srgb, var(--color-warning) 24%, transparent);
}
.lf-fishing-log-catch[data-lf-rating="legendary"] {
    background: color-mix(in srgb, var(--color-danger) 18%, var(--color-surface, #fff));
    border-color: color-mix(in srgb, var(--color-danger) 24%, transparent);
}
.lf-fishing-log-catch[data-lf-rating="exp_baby"] {
    background: color-mix(in srgb, var(--lf-exp-baby-color) 18%, var(--color-surface, #fff));
    border-color: color-mix(in srgb, var(--lf-exp-baby-color) 24%, transparent);
}

/* 消息页：上鱼卡片按评级淡色背景（与日志起鱼行一致） */
.card.message-card.lf-catch-message-card[data-lf-rating="below_standard"] {
    background: color-mix(in srgb, var(--color-text-muted) 18%, var(--color-surface, #fff)) !important;
    border-color: color-mix(in srgb, var(--color-text-muted) 24%, transparent) !important;
}
.card.message-card.lf-catch-message-card[data-lf-rating="standard"] {
    background: color-mix(in srgb, var(--color-success) 18%, var(--color-surface, #fff)) !important;
    border-color: color-mix(in srgb, var(--color-success) 24%, transparent) !important;
}
.card.message-card.lf-catch-message-card[data-lf-rating="rare"] {
    background: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface, #fff)) !important;
    border-color: color-mix(in srgb, var(--color-primary) 24%, transparent) !important;
}
.card.message-card.lf-catch-message-card[data-lf-rating="epic"] {
    background: color-mix(in srgb, var(--color-warning) 18%, var(--color-surface, #fff)) !important;
    border-color: color-mix(in srgb, var(--color-warning) 24%, transparent) !important;
}
.card.message-card.lf-catch-message-card[data-lf-rating="legendary"] {
    background: color-mix(in srgb, var(--color-danger) 18%, var(--color-surface, #fff)) !important;
    border-color: color-mix(in srgb, var(--color-danger) 24%, transparent) !important;
}
.card.message-card.lf-catch-message-card[data-lf-rating="exp_baby"] {
    background: color-mix(in srgb, var(--lf-exp-baby-color) 18%, var(--color-surface, #fff)) !important;
    border-color: color-mix(in srgb, var(--lf-exp-baby-color) 24%, transparent) !important;
}

.lf-catch-alert[data-lf-rating="below_standard"] {
    background: color-mix(in srgb, var(--color-text-muted) 14%, var(--color-surface, #fff)) !important;
    border-color: color-mix(in srgb, var(--color-text-muted) 35%, transparent) !important;
}
.lf-catch-alert[data-lf-rating="below_standard"] .lf-catch-alert-title,
.lf-catch-alert[data-lf-rating="below_standard"] .lf-catch-alert-rating {
    color: var(--color-text-muted) !important;
}
.lf-catch-alert[data-lf-rating="below_standard"] .lf-catch-alert-fishinfo {
    color: var(--color-text-muted) !important;
}
.lf-catch-alert[data-lf-rating="below_standard"] .lf-catch-alert-icon {
    color: var(--color-text-muted) !important;
}
.lf-catch-alert[data-lf-rating="exp_baby"] {
    background: color-mix(in srgb, var(--lf-exp-baby-color) 14%, var(--color-surface, #fff)) !important;
    border-color: color-mix(in srgb, var(--lf-exp-baby-color) 35%, transparent) !important;
}
.lf-catch-alert[data-lf-rating="exp_baby"] .lf-catch-alert-title,
.lf-catch-alert[data-lf-rating="exp_baby"] .lf-catch-alert-rating {
    color: var(--lf-exp-baby-color) !important;
}
.lf-catch-alert[data-lf-rating="exp_baby"] .lf-catch-alert-fishinfo {
    color: var(--lf-exp-baby-color) !important;
}
.lf-catch-alert[data-lf-rating="exp_baby"] .lf-catch-alert-icon {
    color: var(--lf-exp-baby-color) !important;
}
.lf-catch-alert[data-lf-rating="standard"] {
    background: color-mix(in srgb, var(--color-success) 14%, var(--color-surface, #fff)) !important;
    border-color: color-mix(in srgb, var(--color-success) 35%, transparent) !important;
}
.lf-catch-alert[data-lf-rating="standard"] .lf-catch-alert-title,
.lf-catch-alert[data-lf-rating="standard"] .lf-catch-alert-rating {
    color: var(--color-success) !important;
}
.lf-catch-alert[data-lf-rating="standard"] .lf-catch-alert-fishinfo {
    color: var(--color-success) !important;
}
.lf-catch-alert[data-lf-rating="standard"] .lf-catch-alert-icon {
    color: var(--color-success) !important;
}
.lf-catch-alert[data-lf-rating="rare"] {
    background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface, #fff)) !important;
    border-color: color-mix(in srgb, var(--color-primary) 35%, transparent) !important;
}
.lf-catch-alert[data-lf-rating="rare"] .lf-catch-alert-title,
.lf-catch-alert[data-lf-rating="rare"] .lf-catch-alert-rating {
    color: var(--color-primary) !important;
}
.lf-catch-alert[data-lf-rating="rare"] .lf-catch-alert-fishinfo {
    color: var(--color-primary) !important;
}
.lf-catch-alert[data-lf-rating="rare"] .lf-catch-alert-icon {
    color: var(--color-primary) !important;
}
.lf-catch-alert[data-lf-rating="epic"] {
    background: color-mix(in srgb, var(--color-warning) 14%, var(--color-surface, #fff)) !important;
    border-color: color-mix(in srgb, var(--color-warning) 35%, transparent) !important;
}
.lf-catch-alert[data-lf-rating="epic"] .lf-catch-alert-title,
.lf-catch-alert[data-lf-rating="epic"] .lf-catch-alert-rating {
    color: var(--color-warning) !important;
}
.lf-catch-alert[data-lf-rating="epic"] .lf-catch-alert-fishinfo {
    color: var(--color-warning) !important;
}
.lf-catch-alert[data-lf-rating="epic"] .lf-catch-alert-icon {
    color: var(--color-warning) !important;
}
.lf-catch-alert[data-lf-rating="legendary"] {
    background: color-mix(in srgb, var(--color-danger) 14%, var(--color-surface, #fff)) !important;
    border-color: color-mix(in srgb, var(--color-danger) 35%, transparent) !important;
}
.lf-catch-alert[data-lf-rating="legendary"] .lf-catch-alert-title,
.lf-catch-alert[data-lf-rating="legendary"] .lf-catch-alert-rating {
    color: var(--color-danger) !important;
}
.lf-catch-alert[data-lf-rating="legendary"] .lf-catch-alert-fishinfo {
    color: var(--color-danger) !important;
}
.lf-catch-alert[data-lf-rating="legendary"] .lf-catch-alert-icon {
    color: var(--color-danger) !important;
}

/* 鱼获行若带 .text-muted，仍按评级着色 */
.lf-catch-alert[data-lf-rating="below_standard"] .lf-catch-alert-fishinfo.text-muted {
    color: var(--color-text-muted) !important;
}
.lf-catch-alert[data-lf-rating="standard"] .lf-catch-alert-fishinfo.text-muted {
    color: var(--color-success) !important;
}
.lf-catch-alert[data-lf-rating="rare"] .lf-catch-alert-fishinfo.text-muted {
    color: var(--color-primary) !important;
}
.lf-catch-alert[data-lf-rating="epic"] .lf-catch-alert-fishinfo.text-muted {
    color: var(--color-warning) !important;
}
.lf-catch-alert[data-lf-rating="legendary"] .lf-catch-alert-fishinfo.text-muted {
    color: var(--color-danger) !important;
}
.lf-catch-alert[data-lf-rating="exp_baby"] .lf-catch-alert-fishinfo.text-muted {
    color: var(--lf-exp-baby-color) !important;
}

/* 上鱼框边框特效：accent 跟随当前评级配色，特效与颜色解耦 */
.lf-catch-alert[data-lf-rating="below_standard"] { --lf-fx-accent: var(--color-text-muted); }
.lf-catch-alert[data-lf-rating="exp_baby"] { --lf-fx-accent: var(--lf-exp-baby-color); }
.lf-catch-alert[data-lf-rating="standard"] { --lf-fx-accent: var(--color-success); }
.lf-catch-alert[data-lf-rating="rare"] { --lf-fx-accent: var(--color-primary); }
.lf-catch-alert[data-lf-rating="epic"] { --lf-fx-accent: var(--color-warning); }
.lf-catch-alert[data-lf-rating="legendary"] { --lf-fx-accent: var(--color-danger); }

.lf-catch-alert.lf-catch-fx-thick {
    border-width: 3px !important;
    border-color: var(--lf-fx-accent) !important;
}
.lf-catch-alert.lf-catch-fx-glow,
.lf-catch-alert.lf-catch-fx-marquee {
    position: relative;
    isolation: isolate;
}
.lf-catch-alert.lf-catch-fx-glow {
    animation: lf-catch-glow-pulse 2.8s ease-in-out infinite;
}
@keyframes lf-catch-glow-pulse {
    0%, 100% {
        box-shadow:
            0 0 4px color-mix(in srgb, var(--lf-fx-accent) 22%, transparent),
            0 0 10px color-mix(in srgb, var(--lf-fx-accent) 12%, transparent);
    }
    50% {
        box-shadow:
            0 0 8px color-mix(in srgb, var(--lf-fx-accent) 45%, transparent),
            0 0 18px color-mix(in srgb, var(--lf-fx-accent) 28%, transparent),
            0 0 30px color-mix(in srgb, var(--lf-fx-accent) 12%, transparent);
    }
}
.lf-catch-alert.lf-catch-fx-marquee {
    --lf-marquee-period: 3.2s;
}
.lf-catch-alert.lf-catch-fx-marquee .lf-catch-marquee-track {
    position: absolute;
    inset: -1.5px;
    pointer-events: none;
    z-index: 2;
    overflow: visible;
}
.lf-catch-alert.lf-catch-fx-marquee .lf-catch-marquee-dot {
    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--lf-fx-accent);
    box-shadow:
        0 0 4px var(--lf-fx-accent),
        0 0 10px color-mix(in srgb, var(--lf-fx-accent) 70%, transparent);
    offset-path: rect(0 100% 100% 0 round 8px);
    offset-anchor: center;
    offset-distance: 0%;
    animation: lf-catch-marquee-dot var(--lf-marquee-period) linear infinite;
}
.lf-catch-alert.lf-catch-fx-marquee .lf-catch-marquee-dot:nth-child(2) {
    animation-delay: calc(var(--lf-marquee-period) * -0.25);
}
.lf-catch-alert.lf-catch-fx-marquee .lf-catch-marquee-dot:nth-child(3) {
    animation-delay: calc(var(--lf-marquee-period) * -0.5);
}
.lf-catch-alert.lf-catch-fx-marquee .lf-catch-marquee-dot:nth-child(4) {
    animation-delay: calc(var(--lf-marquee-period) * -0.75);
}
.lf-catch-alert.lf-catch-fx-marquee > :not(.lf-catch-marquee-track) {
    position: relative;
    z-index: 1;
}
@keyframes lf-catch-marquee-dot {
    to { offset-distance: 100%; }
}

/* 边框内熔岩流效果：动画 @property 实现 background 中 conic-gradient 旋转，mask 限定仅边框区域可见 */
@property --lf-lava-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
}
.lf-catch-alert.lf-catch-fx-lava {
    position: relative;
    isolation: isolate;
    border-width: 6px !important;             /* 加宽边框让熔岩流可见 */
}
.lf-catch-alert.lf-catch-fx-lava::before {
    content: '';
    position: absolute;
    inset: -6px;                              /* 从边框外缘开始（匹配 border-width） */
    border-radius: inherit;                   /* 继承父级圆角 */
    border: 6px solid transparent;
    background: conic-gradient(
        from var(--lf-lava-angle),
        transparent 0deg,
        transparent 85deg,
        /* 亮斑② — 相隔 180° 与①对称 */
        color-mix(in srgb, var(--lf-fx-accent) 15%, transparent) 85deg,
        var(--lf-fx-accent) 95deg,
        color-mix(in srgb, var(--lf-fx-accent) 60%, #fff) 105deg,
        #fff 115deg,
        color-mix(in srgb, var(--lf-fx-accent) 60%, #fff) 125deg,
        var(--lf-fx-accent) 135deg,
        color-mix(in srgb, var(--lf-fx-accent) 15%, transparent) 145deg,
        transparent 145deg,
        transparent 265deg,
        /* 亮斑① — 原始位置 */
        color-mix(in srgb, var(--lf-fx-accent) 15%, transparent) 265deg,
        var(--lf-fx-accent) 275deg,
        color-mix(in srgb, var(--lf-fx-accent) 60%, #fff) 285deg,
        #fff 295deg,
        color-mix(in srgb, var(--lf-fx-accent) 60%, #fff) 305deg,
        var(--lf-fx-accent) 315deg,
        color-mix(in srgb, var(--lf-fx-accent) 15%, transparent) 325deg,
        transparent 345deg,
        transparent 360deg
    ) border-box;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 0;
    animation: lf-lava-flow 2.4s linear infinite;
}
.lf-catch-alert.lf-catch-fx-lava > * {
    position: relative;
    z-index: 1;
}
@keyframes lf-lava-flow {
    to { --lf-lava-angle: 360deg; }
}


.lll_btn_noSelect {
    cursor: pointer;
    user-select: none;
}

.lll_text_noSelect {
    cursor: default;
    user-select: none;
}

/* popup */
.lll_popup_root {
    background-color: rgb(54, 59, 91);
    border: 2px solid rgba(74, 79, 111, 0.5);
    position: fixed;
    top: 50%;
    left: 50%;
    color: white;
    box-shadow: 0 0 5px 1px black;
    border-radius: 11px 11px 17px 17px;
    z-index: 10000;
    white-space: nowrap;
    display: flex;
    flex-direction: column;
}

.lll_tab_btnContainer {
    margin: 5px 5px 0 5px;
    padding-right: 10px;
    align-items: start;
    display: flex;
    gap: 5px;
    flex: 1;
}

.lll_tab_btnSettingsContainer {
    width: 37px;
    margin: 0 0 0 auto;
    cursor: pointer;
    display: flex;
}

.lll_tab_btnCloseContainer {
    width: 37px;
    margin: 0 0 0 auto;
    cursor: pointer;
    display: flex;
}

.lll_tab_btnClose {
    border-radius: 10px;
    background: var(--button-close);
    border: none;
    box-shadow: 0 0 1px black;
    height: 19px;
    width: 19px;
    margin: auto auto auto 8px;
    transition: background-color 0.1s ease-out;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.lll_tab_btnCloseContainer:hover .lll_tab_btnClose {
    background: var(--button-close-hover);
}

.lll_tab_btnCloseContainer:active .lll_tab_btnClose {
    background: var(--button-close-click);
}

.lll_tab_btnSettings {
    border-radius: 10px;
    background: var(--button-settings);
    border: none;
    box-shadow: 0 0 1px black;
    height: 19px;
    width: 19px;
    margin: auto 8px auto auto;
    transition: background-color 0.1s ease-out;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.lll_tab_btnSettingsContainer:hover .lll_tab_btnSettings {
    background: var(--button-settings-hover);
}

.lll_tab_btnSettingsContainer:active .lll_tab_btnSettings {
    background: var(--button-settings-click);
}

.lll_tab_btn {
    padding: 7px 18px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    font-weight: 500;
    text-shadow: var(--title-text-shadow);
    border-radius: 8px 8px 0 0;
    text-align: center;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.1s ease-out;
}

.lll_tab_btn:hover {
    background-color: var(--tab-button-hover);
}

.lll_tab_btn:active {
    background-color: var(--tab-button-click);
}

.lll_tab_btn.active {
    background-color: var(--tab-button);
    cursor: default;
    color: white;
}

.lll_tab_pageContainer {
    margin: -1px -2px -2px -2px;
    border: 1.5px solid rgba(113, 123, 169, 0.5);
    border-radius: 8px 8px 15px 15px;
    background-color: var(--tab-background);
    min-height: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.lll_tab_pageTitle {
    display: block;
    margin: -1px;
    border-radius: 5px 5px 0 0;
}

.lll_tab_pageTitleText {
    width: fit-content;
    padding: 0 30px;
    margin: auto;
    text-align: center;
    background-color: var(--border);
    border-radius: 0 0 5px 5px;
    font-size: 16px;
    font-weight: bold;
}

.lll_tab_page {
    overflow: hidden;
    display: none;
}

.lll_tab_page.active {
    display: block;
}

.lll_plainPopup_root {
    z-index: 200;
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.lll_plainPopup_background {
    height: 100%;
    width: 100%;
    background-color: var(--color-midnight-800);
    opacity: .8;
}

.lll_plainPopup_containerRoot {
    margin: -1px -2px -2px -2px;
    border: 1.5px solid rgba(214, 222, 255, 0.3);
    border-radius: 8px;
    background-color: var(--tab-background);
    display: flex;
    flex-direction: column;
    min-height: 0;
    position: absolute;
    min-width: 300px;
    max-width: 98%;
    min-height: 100px;
    max-height: 98%;
    padding: 10px;
    box-shadow: 0 0 5px 1px black;
    font-size: 14px;
    font-weight: 400;
    overflow: hidden;
}

.lll_plainPopup_container {
    width: 100%;
    height: 100%;
    color: rgb(231, 231, 231);
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.lll_plainPopup_title {
    font-size: 16px;
    font-weight: 500;
    color: rgb(231, 231, 231);
    text-align: center;
}

/* content */
.lll_div_panelContent {
    margin: 20px;
}

.lll_div_settingPanelContent {
    font-size: 15px;
    margin: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.lll_separator {
    border-top: 1.5px solid var(--border-separator);
}

.lll_div_card {
    padding: 10px;
    border-radius: 10px;
    background-color: var(--card-background);
    border: 1.5px solid var(--border);
    margin: 0px auto;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.lll_div_cardTitle {
    background-color: var(--card-title-background);
    text-align: center;
    font-size: 16px;
    color: var(--card-title-text);
    margin: -10px -10px 8px -10px;
    padding: 5px 0;
    user-select: none;
}

.lll_div_cardTitle.large {
    margin-bottom: 10px;
    padding: 5px 0;
    font-size: 20px;
    font-weight: bold;
    text-shadow: 0 0 2px var(--tab-background);
}

.lll_div_card .lll_separator {
    border-color: var(--border);
}

.lll_div_item {
    display: flex;
    align-items: center;
    background-color: var(--item-background);
    border: 1.5px solid var(--item-border);
    border-radius: 5px;
    padding: 8px;
    white-space: nowrap;
    flex-shrink: 0;
    cursor: default;
}

.lll_div_item:hover {
    background-color: var(--item-background-hover);
    border: 1.5px solid var(--item-border-hover);
}

.lll_div_column {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.lll_div_row {
    display: flex;
    gap: 15px;
    justify-content: center;
}

.lll_label {
    margin: auto 0;
    text-align: center;
}

.lll_btn {
    height: auto;
    position: sticky;
    margin: 5px;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
}

.lll_input_checkbox {
    margin: auto 0;
}

.lll_input_select {
    padding: 5px 10px 5px 5px;
    margin: auto 0;
    border: 1px solid #ced4da;
    border-radius: 5px;
}

.lll_input {
    padding: 5px 10px 5px 5px;
    margin: auto 0;
    border: 1px solid #ced4da;
    border-radius: 5px;
}

.lll_input_sliderWrapper {
    display: flex;
    gap: 10px;
}

.lll_input_sliderLabel {
    min-width: 50px;
    margin: auto 0;
    text-align: left;
}

/* battle */
.lll_btn_battleDropAnalyzer {
    background-color: #21967e !important;
    color: white;
    border-radius: 5px;
    padding: 5px 10px;
    cursor: pointer;
    transition: background-color 0.15s ease-out;
}

.lll_btn_battleDropAnalyzer:hover {
    background-color: rgb(37, 184, 152) !important;
}

/* chest */
.lll_div_chestOpenContent {
    width: 100%;
    height: 100%;
    color: rgb(231, 231, 231);
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.lll_div_chestOpenContent .lll_div_row {
    width: 100%;
    gap: 10px;
}

.lll_div_chestOpenContent .lll_div_card {
    border-radius: 8px;
    background-color: rgb(38, 42, 58);
    border: 1.5px solid rgba(117, 123, 148, 1);
    width: 100%;
    margin: 0;
}

.lll_div_chestOpenContent .lll_div_card .lll_separator {
    border-color: rgba(117, 123, 148, 1);
}

.lll_div_chestOpenContent .lll_div_cardTitle {
    background-color: rgb(66, 71, 90);
    text-align: center;
    font-size: 14px;
    text-align: left;
    color: var(--card-title-text);
    margin: -10px -10px 8px -10px;
    padding: 3px 10px;
}

/* 自有船船钓页 · 鱼种排序栏 */
.lf-boat-fish-sort-panel {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    padding: 8px 10px;
    background: color-mix(in srgb, var(--color-bg) 90%, var(--color-primary) 3%);
    border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.3;
}
.lf-boat-fish-sort-hint,
.lf-boat-fish-sort-group-label {
    color: var(--color-text-muted);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
    user-select: none;
}
.lf-boat-fish-sort-fields {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
}
.lf-boat-fish-sort-item {
    display: inline-flex;
    align-items: stretch;
    border-radius: 6px;
    overflow: hidden;
    background: color-mix(in srgb, var(--color-bg) 75%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.lf-boat-fish-sort-item:hover {
    border-color: color-mix(in srgb, var(--color-text) 18%, transparent);
}
.lf-boat-fish-sort-item--active {
    border-color: color-mix(in srgb, var(--color-primary) 50%, transparent);
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-bg));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 18%, transparent);
}
.lf-boat-fish-sort-label,
.lf-boat-fish-sort-arrow {
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 11px;
    line-height: 1.3;
    padding: 5px 8px;
    transition: color 0.15s ease, background 0.15s ease;
}
.lf-boat-fish-sort-label:hover,
.lf-boat-fish-sort-arrow:hover {
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-text) 6%, transparent);
}
.lf-boat-fish-sort-item--active .lf-boat-fish-sort-label,
.lf-boat-fish-sort-item--active .lf-boat-fish-sort-arrow {
    color: var(--color-primary);
    font-weight: 600;
}
.lf-boat-fish-sort-arrow {
    padding: 5px 7px;
    min-width: 26px;
    border-left: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
    font-size: 10px;
}
.lf-boat-fish-sort-divider {
    flex-shrink: 0;
    width: 1px;
    height: 24px;
    background: color-mix(in srgb, var(--color-text) 12%, transparent);
}
.lf-boat-fish-sort-lock-group {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
}
.lf-boat-fish-sort-lock-btn {
    border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
    border-radius: 6px;
    background: color-mix(in srgb, var(--color-bg) 75%, transparent);
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 11px;
    line-height: 1.3;
    padding: 5px 10px;
    transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}
.lf-boat-fish-sort-lock-btn:hover {
    color: var(--color-text);
    border-color: color-mix(in srgb, var(--color-text) 18%, transparent);
    background: color-mix(in srgb, var(--color-text) 5%, var(--color-bg));
}
.lf-boat-fish-sort-lock-btn--active {
    color: var(--color-primary);
    font-weight: 600;
    border-color: color-mix(in srgb, var(--color-primary) 50%, transparent);
    background: color-mix(in srgb, var(--color-primary) 10%, var(--color-bg));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 18%, transparent);
}

/* 可遇鱼类：水层/饵料/拟饵标签（单行统一外框） */
.lf-fish-tag-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 3px;
    margin-top: 3px;
    line-height: 1.3;
}
.region-fish-card-content .lf-fish-tag-row,
button.region-fish-card-content .lf-fish-tag-row {
    margin-bottom: 2px;
    flex-wrap: nowrap;
    gap: 2px;
    width: 100%;
    max-width: 100%;
}
.region-fish-card-content .lf-fish-badge,
button.region-fish-card-content .lf-fish-badge {
    font-size: 9px;
    padding: 1px 3px;
    min-width: 14px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.65);
    box-shadow: none;
    flex: 0 0 auto;
}
.lf-fish-badge {
    display: inline-block;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
    line-height: 1.35;
    white-space: nowrap;
    box-sizing: border-box;
    border: 1px solid rgba(255, 255, 255, 0.55);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
}
.lf-fish-badge--layer { background: #1565C0; }
.lf-fish-badge--bait { background: #E65100; }
.lf-fish-badge--lure { background: #2E7D32; }
`);

(async function () {
    "use strict";

    //#region default
    const DefaultGameDataCompressed = [
        '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'
    ].join('');
    const DefaultFishInfo = {
        "price": {
            "mandarin_fish": {
                "sum": 26.041666666666664,
                "count": 1
            },
            "golden_pompano": {
                "sum": 93.57169377354836,
                "count": 4
            },
            "white_spotted_conger": {
                "sum": 114.8185316806489,
                "count": 5
            },
            "rockfish": {
                "sum": 164.47079563034993,
                "count": 7
            },
            "cobia": {
                "sum": 623.1522491917431,
                "count": 14
            },
            "snapper_red": {
                "sum": 432.0373946823582,
                "count": 17
            },
            "skipjack_tuna": {
                "sum": 89.0071821709774,
                "count": 2
            },
            "mahi_mahi": {
                "sum": 302.9610835563627,
                "count": 7
            },
            "dogtooth_tuna": {
                "sum": 331.3588506579835,
                "count": 7
            },
            "bohar_snapper": {
                "sum": 225.21377524127874,
                "count": 7
            },
            "blacktip_trevally": {
                "sum": 32.14218188693515,
                "count": 1
            },
            "giant_trevally": {
                "sum": 194.0213883116437,
                "count": 3
            },
            "rainbow_runner": {
                "sum": 177.37466029833345,
                "count": 4
            },
            "spanish_mackerel": {
                "sum": 60.57770238010371,
                "count": 2
            },
            "malabar_grouper": {
                "sum": 136.56501237569216,
                "count": 3
            },
            "mangrove_jack": {
                "sum": 26.686457806973216,
                "count": 1
            },
            "narrowbarred_mackerel": {
                "sum": 135.2374732996969,
                "count": 3
            },
            "bluefin_trevally": {
                "sum": 88.31097830072477,
                "count": 2
            },
            "great_barracuda": {
                "sum": 130.82254761989196,
                "count": 4
            },
            "red_drum": {
                "sum": 96.78891100675996,
                "count": 4
            },
            "golden_trevally": {
                "sum": 104.46313417672917,
                "count": 4
            },
            "green_jobfish": {
                "sum": 95.60447983141464,
                "count": 3
            },
            "coral_trout": {
                "sum": 31.76956475696283,
                "count": 1
            },
            "queenfish_talang": {
                "sum": 31.31284113760414,
                "count": 1
            },
            "wahoo": {
                "sum": 181.35406409761148,
                "count": 4
            },
            "bigeye_trevally": {
                "sum": 31.436655139893112,
                "count": 1
            },
            "yellowfin_tuna": {
                "sum": 137.49602163670468,
                "count": 3
            },
            "diamond_trevally": {
                "sum": 32.64925373134328,
                "count": 1
            },
            "amberjack": {
                "sum": 101.66231757970847,
                "count": 3
            },
            "mackerel_tuna": {
                "sum": 54.291508106164855,
                "count": 2
            },
            "giant_grouper": {
                "sum": 46.24250592554724,
                "count": 1
            },
            "black_porgy": {
                "sum": 98.5924944775036,
                "count": 4
            },
            "olive_flounder": {
                "sum": 109.00857896009911,
                "count": 4
            },
            "japanese_mackerel": {
                "sum": 37.00726141078838,
                "count": 2
            },
            "barracuda": {
                "sum": 216.96230095721995,
                "count": 2
            },
            "threadfin_bream": {
                "sum": 35.933062642288824,
                "count": 2
            },
            "filefish": {
                "sum": 184.46738175103036,
                "count": 4
            },
            "yellow_croaker": {
                "sum": 53.075117370892016,
                "count": 2
            },
            "yellowedge_grouper": {
                "sum": 1812.8401261841395,
                "count": 40
            },
            "cubera_snapper": {
                "sum": 3862.167684597016,
                "count": 60
            },
            "silvertip_shark": {
                "sum": 2201.579447444251,
                "count": 45
            },
            "swordfish_broadbill": {
                "sum": 1383.538702097666,
                "count": 20
            },
            "greater_cobia": {
                "sum": 3961.718425512507,
                "count": 61
            },
            "snowy_grouper": {
                "sum": 1487.7349556510292,
                "count": 33
            },
            "yellowfin_goatfish": {
                "sum": 769.6726358378176,
                "count": 12
            },
            "warsaw_grouper": {
                "sum": 1143.8884172790908,
                "count": 17
            },
            "goliath_grouper": {
                "sum": 1703.1869376728246,
                "count": 25
            },
            "greater_amberjack_giant": {
                "sum": 4268.261338374682,
                "count": 65
            },
            "bigeye_scad": {
                "sum": 659.263985163886,
                "count": 7
            },
            "yellowstripe_scad": {
                "sum": 723.0551859612439,
                "count": 5
            },
            "bigeye_tuna_giant": {
                "sum": 240.87552537037817,
                "count": 5
            },
            "southern_bluefin_tuna": {
                "sum": 609.7186779660407,
                "count": 9
            },
            "blue_shark_giant": {
                "sum": 482.57528666256275,
                "count": 7
            },
            "bluefin_tuna_giant": {
                "sum": 205.37581149937716,
                "count": 3
            },
            "potato_grouper": {
                "sum": 65.15894885408966,
                "count": 1
            },
            "pacific_bluefin_tuna": {
                "sum": 205.41958144037494,
                "count": 3
            },
            "yellowfin_tuna_alpha": {
                "sum": 141.50298855823144,
                "count": 2
            },
            "giant_mako_shark": {
                "sum": 141.55478676183162,
                "count": 2
            },
            "reef_manta_ray": {
                "sum": 69.56998082717064,
                "count": 1
            },
            "tropical_kingfish_giant": {
                "sum": 46.23947179074788,
                "count": 1
            },
            "bluefin_tuna_elder": {
                "sum": 72.68926656366446,
                "count": 1
            },
            "oceanic_whitetip_shark_giant": {
                "sum": 141.97094009891225,
                "count": 2
            },
            "deepwater_amberjack_colossus": {
                "sum": 139.88448320608285,
                "count": 2
            },
            "bigeye_thresher_shark": {
                "sum": 51.19704739197177,
                "count": 1
            },
            "atlantic_sailfish": {
                "sum": 66.45074826893008,
                "count": 1
            },
            "bigeye_trevally_goliath": {
                "sum": 48.29977379760448,
                "count": 1
            },
            "sailfish_pacific": {
                "sum": 65.73265521543038,
                "count": 1
            }
        },
        "exp": {
            "golden_pompano": {
                "sumX": 11.669,
                "sumY": 81.6,
                "sumXX": 34.316095,
                "sumXY": 239.0167,
                "n": 4
            },
            "white_spotted_conger": {
                "sumX": 7.032,
                "sumY": 65.35365853658536,
                "sumXX": 11.090438000000002,
                "sumXY": 96.3003024390244,
                "n": 5
            },
            "rockfish": {
                "sumX": 7.561999999999999,
                "sumY": 84.60731707317073,
                "sumXX": 10.590729999999999,
                "sumXY": 100.19753658536584,
                "n": 7
            },
            "cobia": {
                "sumX": 199.27800000000002,
                "sumY": 994.868292682927,
                "sumXX": 3522.8247319999996,
                "sumXY": 17042.616026829266,
                "n": 14
            },
            "snapper_red": {
                "sumX": 72.375,
                "sumY": 416.6403963414634,
                "sumXX": 392.133229,
                "sumXY": 2078.8936585365855,
                "n": 17
            },
            "skipjack_tuna": {
                "sumX": 37.143,
                "sumY": 181.2,
                "sumXX": 713.2830289999999,
                "sumXY": 3463.839,
                "n": 2
            },
            "mahi_mahi": {
                "sumX": 92.7,
                "sumY": 479.2487804878049,
                "sumXX": 1379.9763379999997,
                "sumXY": 6986.552887804878,
                "n": 7
            },
            "dogtooth_tuna": {
                "sumX": 226.09300000000002,
                "sumY": 1040.6721036585366,
                "sumXX": 9428.333542999999,
                "sumXY": 42542.99119939024,
                "n": 7
            },
            "bohar_snapper": {
                "sumX": 32.318,
                "sumY": 179.98292682926828,
                "sumXX": 185.395666,
                "sumXY": 1012.5459048780489,
                "n": 6
            },
            "blacktip_trevally": {
                "sumX": 5.289,
                "sumY": 31.5,
                "sumXX": 27.973520999999998,
                "sumXY": 166.6035,
                "n": 1
            },
            "giant_trevally": {
                "sumX": 47.509,
                "sumY": 273.66829268292685,
                "sumXX": 823.5818449999999,
                "sumXY": 4677.032102439024,
                "n": 3
            },
            "rainbow_runner": {
                "sumX": 31.85,
                "sumY": 184.03902439024392,
                "sumXX": 307.53372200000007,
                "sumXY": 1691.616692682927,
                "n": 4
            },
            "spanish_mackerel": {
                "sumX": 5.545,
                "sumY": 43.63170731707317,
                "sumXX": 15.541132999999999,
                "sumXY": 121.59662926829269,
                "n": 2
            },
            "malabar_grouper": {
                "sumX": 37.995000000000005,
                "sumY": 189.59024390243903,
                "sumXX": 551.619821,
                "sumXY": 2697.2303780487805,
                "n": 3
            },
            "mangrove_jack": {
                "sumX": 15.832,
                "sumY": 67.03125,
                "sumXX": 250.65222400000002,
                "sumXY": 1061.23875,
                "n": 1
            },
            "narrowbarred_mackerel": {
                "sumX": 20.948,
                "sumY": 126.84878048780487,
                "sumXX": 194.07018999999997,
                "sumXY": 1086.392331707317,
                "n": 3
            },
            "bluefin_trevally": {
                "sumX": 24.776,
                "sumY": 129.5,
                "sumXX": 307.78576,
                "sumXY": 1607.854,
                "n": 2
            },
            "great_barracuda": {
                "sumX": 30.084,
                "sumY": 161.60731707317075,
                "sumXX": 266.31732,
                "sumXY": 1367.8827268292684,
                "n": 4
            },
            "red_drum": {
                "sumX": 73.737,
                "sumY": 302.85853658536587,
                "sumXX": 1486.369761,
                "sumXY": 6044.159048780488,
                "n": 4
            },
            "golden_trevally": {
                "sumX": 17.845,
                "sumY": 95.9,
                "sumXX": 107.18738100000002,
                "sumXY": 574.2443000000001,
                "n": 3
            },
            "green_jobfish": {
                "sumX": 17.732999999999997,
                "sumY": 97.2,
                "sumXX": 116.26309699999999,
                "sumXY": 618.1309,
                "n": 3
            },
            "coral_trout": {
                "sumX": 9.443,
                "sumY": 45.4,
                "sumXX": 89.170249,
                "sumXY": 428.7122,
                "n": 1
            },
            "queenfish_talang": {
                "sumX": 6.962,
                "sumY": 38,
                "sumXX": 48.469443999999996,
                "sumXY": 264.556,
                "n": 1
            },
            "wahoo": {
                "sumX": 54.495999999999995,
                "sumY": 281.4,
                "sumXX": 818.3638080000001,
                "sumXY": 4152.7064,
                "n": 4
            },
            "bigeye_trevally": {
                "sumX": 3.181,
                "sumY": 23.414634146341463,
                "sumXX": 10.118761000000001,
                "sumXY": 74.4819512195122,
                "n": 1
            },
            "yellowfin_tuna": {
                "sumX": 119.31700000000001,
                "sumY": 539.7487804878049,
                "sumXX": 5583.570995000001,
                "sumXY": 24986.406446341465,
                "n": 3
            },
            "diamond_trevally": {
                "sumX": 3.216,
                "sumY": 23.414634146341463,
                "sumXX": 10.342656000000002,
                "sumXY": 75.30146341463414,
                "n": 1
            },
            "amberjack": {
                "sumX": 41.522,
                "sumY": 190.3,
                "sumXX": 576.835078,
                "sumXY": 2642.0197,
                "n": 3
            },
            "mackerel_tuna": {
                "sumX": 12.664,
                "sumY": 67.26341463414634,
                "sumXX": 124.688626,
                "sumXY": 587.8776146341463,
                "n": 2
            },
            "giant_grouper": {
                "sumX": 21.517,
                "sumY": 99.51219512195122,
                "sumXX": 462.981289,
                "sumXY": 2141.203902439024,
                "n": 1
            },
            "black_porgy": {
                "sumX": 4.259,
                "sumY": 53.59024390243903,
                "sumXX": 7.968627000000001,
                "sumXY": 69.4798,
                "n": 4
            },
            "olive_flounder": {
                "sumX": 18.4,
                "sumY": 107.13658536585365,
                "sumXX": 91.69349400000002,
                "sumXY": 519.675012195122,
                "n": 4
            },
            "japanese_mackerel": {
                "sumX": 2.005,
                "sumY": 25.573170731707318,
                "sumXX": 2.0920250000000005,
                "sumXY": 25.926036585365857,
                "n": 2
            },
            "barracuda": {
                "sumX": 0.463,
                "sumY": 24.429268292682927,
                "sumXX": 0.126197,
                "sumXY": 5.7305219512195125,
                "n": 2
            },
            "threadfin_bream": {
                "sumX": 1.17,
                "sumY": 20.5,
                "sumXX": 0.6871880000000001,
                "sumXY": 12.0036,
                "n": 2
            },
            "filefish": {
                "sumX": 1.791,
                "sumY": 35.34390243902439,
                "sumXX": 0.9953350000000001,
                "sumXY": 16.505543902439026,
                "n": 4
            },
            "yellow_croaker": {
                "sumX": 3.011,
                "sumY": 30.602439024390243,
                "sumXX": 4.806121,
                "sumXY": 47.10567073170732,
                "n": 2
            },
            "yellowedge_grouper": {
                "sumX": 732.853,
                "sumY": 3467.9649390243912,
                "sumXX": 15631.379202999999,
                "sumXY": 72981.32174085366,
                "n": 39
            },
            "cubera_snapper": {
                "sumX": 1502.19,
                "sumY": 7900.460899390243,
                "sumXX": 44172.974643999994,
                "sumXY": 230587.07040388716,
                "n": 56
            },
            "silvertip_shark": {
                "sumX": 1946.8850000000002,
                "sumY": 8748.449237804878,
                "sumXX": 88804.36385299997,
                "sumXY": 398267.4535278963,
                "n": 44
            },
            "swordfish_broadbill": {
                "sumX": 1023.2379999999998,
                "sumY": 5216.190472560977,
                "sumXX": 53118.06840999999,
                "sumXY": 270562.8059868903,
                "n": 20
            },
            "greater_cobia": {
                "sumX": 2055.347,
                "sumY": 10692.41631097561,
                "sumXX": 77596.61254699998,
                "sumXY": 400876.19474664633,
                "n": 60
            },
            "snowy_grouper": {
                "sumX": 512.898,
                "sumY": 2477.0173018292685,
                "sumXX": 9010.944441999998,
                "sumXY": 43021.258206859755,
                "n": 32
            },
            "yellowfin_goatfish": {
                "sumX": 4.859,
                "sumY": 114.85609756097563,
                "sumXX": 2.335845,
                "sumXY": 47.801585365853654,
                "n": 12
            },
            "warsaw_grouper": {
                "sumX": 717.9069999999999,
                "sumY": 3641.7556402439022,
                "sumXX": 31567.563439000005,
                "sumXY": 159810.07426417683,
                "n": 17
            },
            "goliath_grouper": {
                "sumX": 1211.6690000000006,
                "sumY": 6113.780487804879,
                "sumXX": 59399.833231000026,
                "sumXY": 299560.25657317083,
                "n": 25
            },
            "greater_amberjack_giant": {
                "sumX": 2191.4959999999987,
                "sumY": 11407.480259146345,
                "sumXX": 81816.660306,
                "sumXY": 423217.83164253033,
                "n": 64
            },
            "bigeye_scad": {
                "sumX": 1.511,
                "sumY": 69.60243902439024,
                "sumXX": 0.38438300000000003,
                "sumXY": 15.228578048780486,
                "n": 7
            },
            "yellowstripe_scad": {
                "sumX": 0.75,
                "sumY": 47.97073170731707,
                "sumXX": 0.13778600000000002,
                "sumXY": 7.288190243902439,
                "n": 5
            },
            "bigeye_tuna_giant": {
                "sumX": 244.408,
                "sumY": 1089.5073170731707,
                "sumXX": 13203.106528000002,
                "sumXY": 58530.14160731708,
                "n": 5
            },
            "southern_bluefin_tuna": {
                "sumX": 448.733,
                "sumY": 2293.4063262195123,
                "sumXX": 22778.675820999997,
                "sumXY": 116296.53003178355,
                "n": 9
            },
            "blue_shark_giant": {
                "sumX": 396.86999999999995,
                "sumY": 2013.1012195121953,
                "sumXX": 22582.917954,
                "sumXY": 114529.21900121952,
                "n": 7
            },
            "bluefin_tuna_giant": {
                "sumX": 165.779,
                "sumY": 842.3000000000001,
                "sumXX": 9161.782001,
                "sumXY": 46549.5032,
                "n": 3
            },
            "potato_grouper": {
                "sumX": 29.758,
                "sumY": 154.2,
                "sumXX": 885.538564,
                "sumXY": 4588.683599999999,
                "n": 1
            },
            "pacific_bluefin_tuna": {
                "sumX": 171.221,
                "sumY": 868.8780487804879,
                "sumXX": 9788.501105000001,
                "sumXY": 49668.30141707318,
                "n": 3
            },
            "yellowfin_tuna_alpha": {
                "sumX": 110.55600000000001,
                "sumY": 563.0292682926829,
                "sumXX": 6111.32409,
                "sumXY": 31123.175312195122,
                "n": 2
            },
            "giant_mako_shark": {
                "sumX": 110.911,
                "sumY": 565.2682926829268,
                "sumXX": 6150.860945,
                "sumXY": 31348.358463414632,
                "n": 2
            },
            "reef_manta_ray": {
                "sumX": 54.765,
                "sumY": 277.3170731707317,
                "sumXX": 2999.205225,
                "sumXY": 15187.269512195122,
                "n": 1
            },
            "tropical_kingfish_giant": {
                "sumX": 47.254,
                "sumY": 211.7,
                "sumXX": 2232.9405159999997,
                "sumXY": 10003.671799999998,
                "n": 1
            },
            "bluefin_tuna_elder": {
                "sumX": 55.015,
                "sumY": 280.2,
                "sumXX": 3026.650225,
                "sumXY": 15415.203,
                "n": 1
            },
            "oceanic_whitetip_shark_giant": {
                "sumX": 109.614,
                "sumY": 556.2,
                "sumXX": 6008.0619560000005,
                "sumXY": 30485.8292,
                "n": 2
            },
            "deepwater_amberjack_colossus": {
                "sumX": 114.738,
                "sumY": 581.3414634146342,
                "sumXX": 6590.760194,
                "sumXY": 33391.1106097561,
                "n": 2
            },
            "bigeye_thresher_shark": {
                "sumX": 61.234,
                "sumY": 269.87804878048786,
                "sumXX": 3749.602756,
                "sumXY": 16525.712439024395,
                "n": 1
            },
            "atlantic_sailfish": {
                "sumX": 17.908,
                "sumY": 101.58536585365854,
                "sumXX": 320.69646400000005,
                "sumXY": 1819.1907317073174,
                "n": 1
            },
            "bigeye_trevally_goliath": {
                "sumX": 53.934,
                "sumY": 239.3,
                "sumXX": 2908.8763559999998,
                "sumXY": 12906.4062,
                "n": 1
            },
            "sailfish_pacific": {
                "sumX": 10.421,
                "sumY": 65.60975609756098,
                "sumXX": 108.59724099999998,
                "sumXY": 683.7192682926828,
                "n": 1
            }
        }
    };
    //#endregion

    const dbg = console.log.bind(null, '%c[摸鱼]%c', 'color:blue', 'color:black');
    const out = console.log.bind(null, '%c[摸鱼]%c', 'color:green', 'color:black');
    const err = console.log.bind(null, '%c[摸鱼]%c', 'color:red', 'color:black');

    console.clear();


    const Utils = new class {
        eps = 1e-6;
        msPerH = 60 * 60 * 1000;

        HSVtoRGB(h, s, v, a = 1) {
            let r, g, b, i, f, p, q, t;
            i = Math.floor(h * 6);
            f = h * 6 - i;
            p = v * (1 - s);
            q = v * (1 - f * s);
            t = v * (1 - (1 - f) * s);
            switch (i % 6) {
                case 0: r = v; g = t; b = p; break;
                case 1: r = q; g = v; b = p; break;
                case 2: r = p; g = v; b = t; break;
                case 3: r = p; g = q; b = v; break;
                case 4: r = t; g = p; b = v; break;
                case 5: r = v; g = p; b = q; break;
            }
            r = Math.round(r * 255);
            g = Math.round(g * 255);
            b = Math.round(b * 255);
            return {
                r: r, g: g, b: b,
                rgb: `rgba(${r}, ${g}, ${b})`,
                rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
            };
        }

        clamp(x, l, r) {
            return Math.max(Math.min(x, r), l);
        }
        floorTo(x, m) {
            return Math.round(Math.floor(x / m) * m);
        }
        erf(x) {
            const sign = x < 0 ? -1 : 1;
            x = Math.abs(x);
            const a1 = 0.254829592;
            const a2 = -0.284496736;
            const a3 = 1.421413741;
            const a4 = -1.453152027;
            const a5 = 1.061405429;
            const p = 0.3275911;
            const t = 1 / (1 + p * x);
            const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
            return sign * y;
        }
        erfc(x) { return 1 - this.erf(x); }
        erfInv(x) {
            // maximum relative error = .00013
            const a = 0.147;
            //if (0 == x) { return 0 }
            const b = 2 / (Math.PI * a) + Math.log(1 - x ** 2) / 2;
            const sqrt1 = Math.sqrt(b ** 2 - Math.log(1 - x ** 2) / a);
            const sqrt2 = Math.sqrt(sqrt1 - b);
            return sqrt2 * Math.sign(x);
        }
        erfcInv(x) {
            return this.erfInv(1 - x);
        }
        phi(x, sigma = 1) {
            return this.erfc(-x / (Math.SQRT2 * sigma)) / 2;
        }
        phiInv(x, sigma = 1) {
            return -Math.SQRT2 * sigma * this.erfcInv(2 * x);
        }
        stdDev(a) {
            if (!a || a.length === 0) return 0;
            const m = this.mean(a);
            return Math.sqrt(a.reduce((s, v) => s + (v - m) * (v - m), 0) / a.length);
        }

        parseDate(s) {
            return Date.parse(s + (s.slice(-1) != 'Z' ? 'Z' : ''));
        }

        /** 消息页 DOM 时间或 API ISO 字符串 → 毫秒时间戳 */
        parseMessageTime(value) {
            const raw = String(value ?? '').trim();
            if (!raw) return null;

            const domPattern = /^\d{4}\/\d{2}\/\d{2}\s+\d{1,2}:\d{2}:\d{2}$/;
            if (domPattern.test(raw)) {
                const normalized = raw.replace(/\//g, '-').replace(/\s+/, 'T');
                const ms = Date.parse(normalized);
                return isNaN(ms) ? null : ms;
            }

            const apiPattern = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})?$/i;
            const apiMatch = apiPattern.exec(raw);
            if (apiMatch) {
                const [, datePart, timePart, , frac = '', tzPart] = apiMatch;
                const ms = frac ? `.${frac.slice(0, 3).padEnd(3, '0')}` : '';
                const tz = tzPart ? (tzPart.toUpperCase() === 'Z' ? 'Z' : tzPart) : 'Z';
                const parsed = Date.parse(`${datePart}T${timePart}${ms}${tz}`);
                return isNaN(parsed) ? null : parsed;
            }

            const fallback = Date.parse(raw);
            return isNaN(fallback) ? null : fallback;
        }

        // format = ('d' | 'D') + ('' | 't' | 'T')
        formatDate(date, format) {
            const t = new Date(date);
            const y = t.getFullYear();
            const M = t.getMonth() + 1;
            const d = t.getDate();
            const h = t.getHours().toString().padStart(2, '0');
            const m = t.getMinutes().toString().padStart(2, '0');
            const s = t.getSeconds().toString().padStart(2, '0');

            let ret = '';
            if (format.includes('D')) ret += `${y}/${M}/${d}`;
            if (format.includes('d')) ret += `${M}/${d}`;
            if (format.includes('T')) ret += ` ${h}:${m}:${s}`;
            if (format.includes('t')) ret += ` ${h}:${m}`;
            return ret;
        }

        formatTimeRange(begin, end) {
            const l = new Date(begin), r = new Date(end);
            const y1 = l.getFullYear(), y2 = r.getFullYear();
            const m1 = l.getMonth() + 1, m2 = r.getMonth() + 1;
            const d1 = l.getDate(), d2 = r.getDate();
            const t1 = l.toLocaleTimeString().slice(0, 5);
            const t2 = r.toLocaleTimeString().slice(0, 5);
            if (y1 != y2) return `${y1}/${m1}/${d1} ${t1} ~ ${y2}/${m2}/${d2} ${t2}`;
            if (m1 != m2 || d1 != d2) return `${m1}/${d1} ${t1} ~ ${m2}/${d2} ${t2}`;
            return `${m1}/${d1} ${t1} ~ ${t2}`;
        };

        formatWeight(w) {
            if (w < 1) return `${(w * 1000).toFixed(0)}g`;
            if (w < 10) return `${w.toFixed(2)}kg`;
            if (w < 100) return `${w.toFixed(1)}kg`;
            return `${w.toFixed(0)}kg`;
        }

        getFishRarity(s) {
            if (s == 'common') return 0;
            if (s == 'uncommon') return 1;
            if (s == 'rare') return 2;
            if (s == 'epic') return 3;
            if (s == 'legendary') return 4;
            return -1;
        }
        scoreToRarity(score) {
            if (score < 35) return 0;
            if (score < 95) return 1;
            if (score < 99) return 2;
            if (score < 99.95) return 3;
            if (score <= 100) return 4;
            return -1;
        }
        fitLinear(data) {
            const n = data.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            for (let i = 0; i < n; i++) {
                sumX += data[i].x;
                sumY += data[i].y;
                sumXY += data[i].x * data[i].y;
                sumXX += data[i].x * data[i].x;
            }
            const k = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const b = (sumY - k * sumX) / n;
            return { k: k, b: b };
        }

        /**
         * 每三个数之间加逗号
         * @param {number} value
         * @returns {string}
         */
        formatNumber(value) {
            return value.toString().replace(/\d+/, function (n) {
                return n.replace(/(\d)(?=(?:\d{3})+$)/g, '$1,')
            })
        }
    };

    /** 评级判定：识别"科技"分数（越线/宝宝）与临界分数，用于偏移统计剔除 */
    const Rarity = new class {
        isFake(score) {
            if (Math.abs(score - 1) < Utils.eps) return true;     // 科技宝宝
            if (Math.abs(score - 35) < Utils.eps) return true;    // 达标地板
            if (Math.abs(score - 95.01) < Utils.eps) return true; // 越线
            if (Math.abs(score - 99.01) < Utils.eps) return true;
            if (Math.abs(score - 99.96) < Utils.eps) return true;
            return false;
        }
        isLimit(score) {
            return score < Utils.eps || score > 100 - Utils.eps;
        }
        isValid(score) {
            return !this.isFake(score) && !this.isLimit(score);
        }
    };

    /** 评级偏移估算：基于最近样本的分数分布拟合系统偏移（含重掷判定） */
    const ScoreOffsetCalc = new class {
        config = {
            minSampleCount: 10,
            sampleCount: 200,
        };

        data = null;
        sortedScoreList = null;

        computeOffset(scoreList) {
            const ys = scoreList
                .sort((a, b) => a - b)
                .filter(score => Rarity.isValid(score * 100))
                .map((score, i, arr) => [(i + 1) / (arr.length + 1), score]);
            this.sortedScoreList = ys;
            if (!ys.length) return { rerollCount: 0, offset: 0 };

            const getOffset = (reroll) => {
                return ys.map(([x, y]) => {
                    const X = Utils.erfcInv(2 * x);
                    const Y = Utils.erfcInv(2 * Math.pow(y, reroll));
                    return Math.SQRT2 * (X - Y);
                });
            };
            const offset = [null, getOffset(1), getOffset(2)];
            const rerollCount = Utils.stdDev(offset[1]) < Utils.stdDev(offset[2]) ? 1 : 2;

            return {
                rerollCount: rerollCount,
                offset: Utils.mean(offset[rerollCount]),
            };
        }

        compute(rawData) {
            this.data = rawData
                .sort((a, b) => b.caughtAt - a.caughtAt)
                .slice(0, this.config.sampleCount)
                .filter(fish => Rarity.isValid(fish.score))
                .map(fish => ({
                    score: fish.score / 100,
                    raw: fish,
                }));
            if (this.data.length < this.config.minSampleCount) return null;
            return this.computeOffset(this.data.map(i => i.score));
        }
    };


    /** Range
     * @typedef {{ min: number, max: number }} Range
     */
    const Range = new class {
        /**
         * @param {Range} a
         * @param {Range} b
         * @returns {Range}
         */
        intersect(a, b) {
            if (!a || !b) return a ?? b;
            return {
                min: Math.max(a.min, b.min),
                max: Math.min(a.max, b.max),
            };
        }

        /**
         * @param {Range} a
         * @returns {boolean}
         */
        valid(a) {
            return a.min < a.max + Utils.eps;
        }

        /**
         * @param {Range} a
         * @returns {number}
         */
        mean(a) {
            return (a.max + a.min) / 2;
        }

        /**
         * @param {Range} a
         * @param {number} n
         * @returns {string}
         */
        format(a, n) {
            let mean = (a.max + a.min) / 2;
            let delta = (a.max - a.min) / 2;
            if (n) {
                mean = mean.toFixed(n);
                delta = delta.toFixed(n);
            }
            return `${mean} ± ${delta}`;
        }

        /**
         * @param {Range} a
         * @param {number} rho
         * @returns {number}
         */
        quantile(a, rho) {
            return a.min + (a.max - a.min) * rho;
        }


        /**
         * @param {Range} a
         * @param {number} x
         * @returns {number}
         */
        position(a, x) {
            return (x - a.min) / (a.max - a.min);
        }
    };

    const DomRetry = {
        /** @returns {boolean} true 表示 fn 执行成功 */
        until(fn, intervalMs = 500, maxAttempts = 120) {
            let attempts = 0;
            const tick = () => {
                try {
                    if (fn()) return;
                } catch (_) { /* 页面未就绪，等待下次重试 */ }
                if (++attempts < maxAttempts) setTimeout(tick, intervalMs);
            };
            tick();
        },
        onReady(fn) {
            if (document.documentElement && document.body) {
                fn();
                return;
            }
            this.until(() => {
                if (!document.documentElement || !document.body) return false;
                fn();
                return true;
            }, 100, 100);
        },
        safeRun(fn, ctx = null) {
            try {
                if (ctx) fn.call(ctx);
                else fn();
            } catch {
                // DOM 未就绪或结构变化，跳过本轮渲染
            }
        },
    };

    //#region LocalStorage

    const LocalStorageName = 'fishing_helper';
    const LocalStorageVersion = '0.0.0';
    const LocalStorageVerbose = false;
    const LocalStorageData = new class {
        data = null;
        modified = false;
        async init() {
            async function decompress(text) {
                const responseBlob = await fetch(text);
                const blob = await responseBlob.blob();
                const decompressionStream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
                const decompressedResponse = new Response(decompressionStream);
                const originalText = await decompressedResponse.text();
                return originalText;
            }
            async function loadData() {
                let storage = localStorage.getItem(LocalStorageName) ?? '{}';
                try {
                    if (storage?.[0] != '{') storage = await decompress(storage);
                } catch {
                    storage = '{}';
                }
                let data = JSON.parse(storage);
                if (data?.version !== LocalStorageVersion) {
                    data = { version: LocalStorageVersion };
                }
                dbg(`localStorage loaded: version = ${data.version}`, data);
                LocalStorageData.data = data;
            }
            await loadData();

            async function compressAndSave(key, text) {
                const stream = new Blob([text]).stream();
                const compressionStream = stream.pipeThrough(new CompressionStream('gzip'));
                const response = new Response(compressionStream);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64String = reader.result;
                    try {
                        localStorage.setItem(key, base64String);
                        dbg(`localStorage saved at ${new Date(Date.now()).toLocaleString()}`);
                    } catch (e) {
                        console.error("LocalStorage 空间不足", e);
                    }
                };
            }

            const doSave = async () => {
                if (!LocalStorageData.data) return;
                if (!LocalStorageData.modified) return;
                await compressAndSave(LocalStorageName, JSON.stringify(LocalStorageData.data));
                LocalStorageData.modified = false;
            };

            // 事件驱动保存：数据变更后延迟 5s 再压缩写入，避免短时间内反复 gzip
            let saveTimer = null;
            LocalStorageData._scheduleSave = () => {
                clearTimeout(saveTimer);
                saveTimer = setTimeout(doSave, 5000);
            };

            // 安全兜底：最长 30s 无保存则强制写一次，防止标签页休眠期间数据丢失
            setInterval(doSave, 30000);
        }
        get(key) {
            if (LocalStorageVerbose) out(`load ${key} from localStorage: ${key} =`, this.data?.[key]);
            return this.data?.[key];
        }
        set(key, value, msg = null) {
            this.data[key] = value;
            this.modified = true;
            this._scheduleSave?.();
            if (LocalStorageVerbose) {
                if (msg) out(`saved ${key} to localStorage:`, msg);
                else out(`saved ${key} to localStorage`);
            }
        }
    };
    await LocalStorageData.init();

    //#endregion

    //#region Listener

    const MessageHandler = new class {
        listeners = { 'any': [] };

        constructor() { this.hookWS(); }

        hookWS() {
            const dataProperty = Object.getOwnPropertyDescriptor(MessageEvent.prototype, "data");
            const oriGet = dataProperty.get;
            dataProperty.get = hookedGet;
            Object.defineProperty(MessageEvent.prototype, "data", dataProperty);
            const handleMessageRecv = this.handleMessageRecv.bind(this);

            function hookedGet() {
                const socket = this.currentTarget;
                if (!(socket instanceof WebSocket)) {
                    return oriGet.call(this);
                }
                if (socket.url.indexOf("lazyfisher.toogle.club/ws") <= -1 && socket.url.indexOf("toogle.club:36018/ws") <= -1) {
                    return oriGet.call(this);
                }
                const message = oriGet.call(this);
                Object.defineProperty(this, "data", { value: message });
                handleMessageRecv(message);
                return message;
            }
        }

        addListener(type, handler, priority = 0) {
            (this.listeners[type] ??= []).push({
                handler: handler,
                priority: priority,
            });
        }

        handleMessageRecv(msg) {
            let obj = JSON.parse(msg);
            if (!obj) return msg;
            this.listeners['any']
                .sort((a, b) => a.priority - b.priority)
                .forEach(f => { f.handler(obj); });
            if (!this.listeners.hasOwnProperty(obj.type)) return msg;
            this.listeners[obj.type]
                .sort((a, b) => a.priority - b.priority)
                .forEach(f => { f.handler(obj); });
            return msg;
        }
    };

    const ActionResultHandler = new class {
        listeners = {};

        addListener(action, handler, priority = 0) {
            (this.listeners[action] ??= []).push({
                handler: handler,
                priority: priority,
            });
        }

        handleMessageRecv(msg) {
            if (!this.listeners.hasOwnProperty(msg.action)) return msg;
            this.listeners[msg.action]
                .sort((a, b) => a.priority - b.priority)
                .forEach(f => { f.handler(msg); });
            return msg;
        }

        constructor() {
            MessageHandler.addListener('action_result', msg => {
                this.handleMessageRecv(msg);
            });
        }

    };

    //#endregion


    //#region Ui

    const Ui = new class {
        constructor() {
        }

        getPriceIcon(width = 14, height = 14) {
            const priceIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-coins" aria-hidden="true"><path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"></path><path d="M15 6h1v4"></path><path d="m6.134 14.768.866-.5 2 3.464"></path><circle cx="16" cy="8" r="6"></circle></svg>`;
            return priceIcon;
        }

        /**
         * @param {HTMLElement} elem
         * @param {Object} options
         */
        applyOptions(elem, options) {
            if (typeof options === 'object') {
                Object.entries(options ?? {}).forEach(([key, value]) => {
                    if (key === 'style' && typeof value === 'object') {
                        Object.entries(value ?? {}).forEach(([k, v]) => { elem.style[k] = v; });
                    } else if (key.includes('-')) {
                        // data-* / aria-* 等带连字符的属性必须用 setAttribute，否则 querySelector 找不到
                        elem.setAttribute(key, value);
                    } else elem[key] = value;
                });
            } else elem.className = options;
        }

        elem(tagName, options = null, child = null) {
            const elem = document.createElement(tagName);
            this.applyOptions(elem, options);
            if (typeof child === 'object') {
                if (Array.isArray(child)) child.forEach(child => { if (child !== null) elem.appendChild(child); });
                else if (child) elem.appendChild(child);
            } else if (typeof child === 'string') elem.innerHTML = child;
            return elem;
        }

        div(options = null, childList = null) {
            return this.elem('div', options, childList);
        }

        button(text, options = null) {
            const button = Ui.elem('button', {
                className: 'btn btn-secondary',
                textContent: text,
            });
            this.applyOptions(button, options);
            return button;
        }

        /**
         * @param {{ options: Object<string, Object>, default: string, onchange: (value: Object) => void }} options
         * @param {Object} uiOptions
         */
        select(options, uiOptions = null) {
            const select = Ui.elem('select');
            const optStr = Object.entries(options.options).map(([k, v]) => [k, JSON.stringify(v)]);
            for (let [key, value] of optStr) {
                let option = new Option(key, value);
                if (key == options.default) option.selected = true;
                select.options.add(option);
            }
            select.onchange = () => {
                const value = JSON.parse(select.options[select.selectedIndex].value);
                options.onchange(value);
            };
            this.applyOptions(select, uiOptions);
            return select;
        }

        /**
         * @param {{ textContent: string, checked: boolean, onchange: (checked: boolean) => void }} options
         * @param {Object} uiOptions
         */
        checkCard(options, uiOptions = null) {
            const className = [
                'card item-card square-item-card',
                'card item-card square-item-card selected'
            ]
            let checked = options.checked;
            const div = Ui.div({
                className: className[checked ? 1 : 0],
                textContent: options.textContent,
                style: 'width: auto; color: black; user-select: none;'
            });
            div.onclick = () => {
                checked = !checked;
                options.onchange(checked);
                div.className = className[checked ? 1 : 0];
            }
            this.applyOptions(div, uiOptions);
            return Ui.div({}, div);
        }

        /**
         * @typedef {Object} SliderOptions
         * @property {number} initValue
         * @property {number} minValue
         * @property {number} maxValue
         * @property {(value: number) => number} mapFunc
         * @property {(sliderValue: number) => number} invMapFunc
         * @property {(value: number) => void} [oninput = null]
         * @property {(value: number) => void} [onchange = null]
         */
        /**
         * @param {SliderOptions} options
         * @param {Object} inputOptions
         * @param {Object} labelOptions
         * @param {Object} wrapperOptions
         */
        slider(options, inputOptions = null, labelOptions = null, wrapperOptions = null) {
            const input = Ui.elem('input', 'lll_input_slider');
            this.applyOptions(input, inputOptions);
            input.type = 'range';
            input.min = Math.ceil(options.invMapFunc(options.minValue)).toString();
            input.max = Math.floor(options.invMapFunc(options.maxValue)).toString();
            input.step = '1';
            input.value = Math.round(options.invMapFunc(options.initValue)).toString();
            const label = Ui.div('lll_input_sliderLabel', options.initValue.toString());
            this.applyOptions(label, labelOptions);
            const wrapper = Ui.div('lll_input_sliderWrapper', [input, label]);
            this.applyOptions(wrapper, wrapperOptions);
            input.oninput = () => {
                const value = options.mapFunc(parseInt(input.value));
                label.innerHTML = value.toString();
                options.oninput?.(value);
            };
            input.onchange = () => {
                const value = options.mapFunc(parseInt(input.value));
                label.innerHTML = value.toString();
                options.onchange?.(value);
            };
            return wrapper;
        }

        /**
         * @typedef {Object} NumberInputOptions
         * @property {number} initValue
         * @property {number} minValue
         * @property {number} maxValue
         * @property {(value: number) => void} [oninput = null]
         * @property {(value: number) => void} [onchange = null]
         */
        /**
         * @param {NumberInputOptions} options
         * @param {Object} uiOptions
         */
        numberInput(options, uiOptions = null) {
            let input = Ui.elem('input', 'lll_input');
            this.applyOptions(input, uiOptions);
            input.type = 'number';
            input.min = options.minValue.toString();
            input.max = options.maxValue.toString();
            input.step = 1;
            input.value = options.initValue.toString();
            input.oninput = () => {
                let val = Math.round(parseInt(input.value));
                options.oninput?.(val);
            }
            input.onchange = () => {
                let val = Math.round(parseInt(input.value));
                val = Math.min(Math.max(val, options.minValue), options.maxValue);
                input.value = val.toString();
                options.onchange?.(val);
            };
            return input;
        }
    };

    class TabbedWindow {
        tabs = [];

        constructor(options = {}) {
            this.tabs = options.tabs ?? [];
            this.width = options.width ?? 800;
            this.height = options.height ?? 600;
            this.minWidth = options.minWidth ?? 300;
            this.minHeight = options.minHeight ?? 200;
            this.showSettings = options.showSettings;
            this.allowResize = options.allowResize ?? true;
            this.allowDragOutsize = options.allowDragOutsize ?? true;

            this.container = null;
            this.isDragging = false;
            this.isResizing = false;

            window.addEventListener('resize', () => { this.rescale(); });
        }

        get isOpening() {
            return this.container !== null;
        }

        addTab(title, tab, style) {
            const idx = this.tabs.length;
            this.tabs.push({
                title: title,
                content: tab.content,
                style: style,
                hasInited: idx === 0,
                onInit: tab.onInit,
                onResize: tab.onResize,
                onShow: tab.onShow,
            });
        }

        onResize() {
            this.tabs.forEach(tab => {
                tab.onResize?.();
            });
        }

        open() {
            if (this.container) return;
            this.createStyles();
            this.createWindow();
            this.initDrag();
            this.initResize();
            this.tabs[0]?.onInit?.();
        }

        createStyles() {
            if (document.getElementById('tm-window-style')) return;
            const style = document.createElement('style');
            style.id = 'tm-window-style';
            style.innerHTML = `
                .tm-win-container {
                    position: fixed;
                    background: #ffffff;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    z-index: 99999;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                }
                .tm-win-container * { box-sizing: border-box; }

                /* 标签页导航栏（作为整体拖动把手） */
                .tm-win-nav-wrapper {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f1f1f1;
                    border-bottom: 1px solid #ddd;
                    border-radius: 6px 6px 0 0;
                    user-select: none;
                    padding-right: 10px;
                }

                .tm-win-tabs-container {
                    display: flex;
                    overflow-x: auto;
                    flex: 1;
                }

                .tm-win-tab {
                    padding: 10px 16px;
                    border-right: 1px solid #ddd;
                    background: #f1f1f1;
                    color: #666666;
                    transition: background 0.2s;
                    font-size: 14px;
                    white-space: nowrap;
                }
                .tm-win-tab:first-child {
                    border-radius: 6px 0 0 0;
                }
                .tm-win-tab:hover { background: #e5e5e5; }
                .tm-win-tab.active {
                    background: #ffffff;
                    border-bottom: 1px solid #ffffff; /* 融入主背景 */
                    color: var(--color-text);
                    cursor: default; /* 激活状态下可恢复默认指针或保持 */
                }

                /* 右侧关闭按钮 */
                .tm-win-close {
                    cursor: pointer;
                    padding: 5px;
                    color: #666666;
                    font-size: 16px;
                    font-weight: bold;
                    line-height: 1;
                    margin-left: 10px;
                    transition: color 0.2s;
                }
                .tm-win-close:hover { color: #f44336; }

                /* 设置 */
                .tm-win-settings {
                    cursor: pointer;
                    padding: 5px;
                    color: #666666;
                    font-size: 24px;
                    margin-top: -2px;
                    font-weight: bold;
                    line-height: 1;
                    margin-left: 10px;
                    transition: color 0.2s;
                }
                .tm-win-settings:hover { color:rgb(84, 135, 210); }

                /* 内容区域 */
                .tm-win-body {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                    font-size: 14px;
                    line-height: 1.5;
                }
                .tm-win-content {
                    width: 100%;
                    height: 100%;
                    display: none;
                    overflow: hidden;
                    min-height: 0;
                }
                .tm-win-content.active { display: block; }

                /* 缩放手柄 */
                .tm-win-resize-handle {
                    position: absolute;
                    right: 0;
                    bottom: 0;
                    width: 12px;
                    height: 12px;
                    cursor: se-resize;
                    background: linear-gradient(135deg, transparent 30%, #999 30%, #999 40%, transparent 40%, transparent 60%, #999 60%, #999 70%, transparent 70%);
                    border-radius: 0 0 6px 0;
                }
            `;
            document.head.appendChild(style);
        }

        createWindow() {
            const container = document.createElement('div');
            this.container = container;
            container.className = 'tm-win-container';
            container.style.width = `${this.width}px`;
            container.style.height = `${this.height}px`;
            container.style.minWidth = `${this.minWidth}px`;
            container.style.minHeight = `${this.minHeight}px`;

            // 创建顶部整合导航栏（含标签和关闭按钮）
            const navWrapper = document.createElement('div');
            navWrapper.className = 'tm-win-nav-wrapper';

            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'tm-win-tabs-container';

            // 渲染内容区
            const body = document.createElement('div');
            body.className = 'tm-win-body';

            this.tabs.forEach((tab, index) => {
                const isActive = index === 0 ? 'active' : '';

                // 创建标签按钮
                const tabEl = document.createElement('div');
                tabEl.className = `tm-win-tab ${isActive}`;
                tabEl.innerText = tab.title;
                tabsContainer.appendChild(tabEl);

                // 创建内容块
                const contentEl = document.createElement('div');
                contentEl.className = `tm-win-content ${isActive}`;
                Ui.applyOptions(contentEl, { style: tab.style });
                if (typeof tab.content === 'object') {
                    contentEl.appendChild(tab.content);
                } else {
                    contentEl.innerHTML = tab.content;
                }
                body.appendChild(contentEl);

                tab.tabEl = tabEl;
                tab.contentEl = contentEl;
            });

            // 标签页切换逻辑
            this.tabs.forEach(t => {
                t.tabEl.addEventListener('click', (e) => {
                    this.tabs.forEach(o => {
                        o.tabEl.classList.remove('active');
                        o.contentEl.classList.remove('active');
                    });
                    t.tabEl.classList.add('active');
                    t.contentEl.classList.add('active');
                    if (!t.hasInited) {
                        t.onInit?.();
                        t.hasInited = true;
                        // 首次切到隐藏 Tab 时，需等布局完成后再 resize，否则 ECharts 尺寸错误
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                t.onResize?.();
                            });
                        });
                    } else {
                        t.onResize?.();
                        t.onShow?.();
                    }
                });
            });

            navWrapper.appendChild(tabsContainer);

            // 创建设置按钮
            if (this.showSettings) {
                const settingsBtn = document.createElement('div');
                settingsBtn.className = 'tm-win-settings';
                settingsBtn.innerHTML = '⚙';
                settingsBtn.addEventListener('click', () => this.showSettings());
                navWrapper.appendChild(settingsBtn);
            }

            // 创建关闭按钮
            const closeBtn = document.createElement('div');
            closeBtn.className = 'tm-win-close';
            closeBtn.innerHTML = '✕';
            closeBtn.addEventListener('click', () => this.close());
            navWrapper.appendChild(closeBtn);

            container.appendChild(navWrapper);
            container.appendChild(body);

            // 渲染缩放手柄
            if (this.allowResize) {
                const resizeHandle = document.createElement('div');
                resizeHandle.className = 'tm-win-resize-handle';
                container.appendChild(resizeHandle);
            }

            document.body.appendChild(container);
            this.rescale();
            container.style.left = `${(window.innerWidth - container.getBoundingClientRect().width) / 2}px`;
            container.style.top = `${(window.innerHeight - container.getBoundingClientRect().height) / 2}px`;
        }

        // 拖动逻辑（绑定在整个导航栏，但点击关闭按钮时无效）
        initDrag() {
            const wrapper = this.container.querySelector('.tm-win-nav-wrapper');
            let startX, startY, startLeft, startTop;

            const onMouseMove = (e) => {
                if (!this.isDragging) return;
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                let newLeft = startLeft + deltaX;
                let newTop = startTop + deltaY;
                if (!this.allowDragOutsize) {
                    newLeft = Utils.clamp(newLeft, 0, window.innerWidth - this.container.clientWidth * this.scale);
                    newTop = Utils.clamp(newTop, 0, window.innerHeight - this.container.clientHeight * this.scale);
                }

                this.container.style.left = `${newLeft}px`;
                this.container.style.top = `${newTop}px`;
            };

            const onMouseUp = () => {
                this.isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            wrapper.addEventListener('mousedown', (e) => {
                if (e.button != 0) return;
                if (e.target.classList.contains('tm-win-close')) return;

                this.isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startLeft = this.container.offsetLeft;
                startTop = this.container.offsetTop;

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                e.preventDefault();
            });
        }

        // 缩放逻辑
        initResize() {
            const handle = this.container.querySelector('.tm-win-resize-handle');
            if (!handle) return;
            let startX, startY, startWidth, startHeight;

            const onMouseMove = (e) => {
                if (!this.isResizing) return;
                const scale = this.scale;
                const deltaX = (e.clientX - startX) / scale;
                const deltaY = (e.clientY - startY) / scale;

                const newWidth = startWidth + deltaX;
                const newHeight = startHeight + deltaY;

                this.container.style.width = `${newWidth}px`;
                this.container.style.height = `${newHeight}px`;
                window.requestAnimationFrame(() => {
                    this.onResize();
                });
            };

            const onMouseUp = () => {
                this.isResizing = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                this.onResize();
            };

            handle.addEventListener('mousedown', (e) => {
                if (e.button != 0) return;
                this.isResizing = true;
                startX = e.clientX;
                startY = e.clientY;

                // 获取当前的物理宽高
                startWidth = parseInt(document.defaultView.getComputedStyle(this.container).width, 10);
                startHeight = parseInt(document.defaultView.getComputedStyle(this.container).height, 10);

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                e.preventDefault();
                e.stopPropagation(); // 防止冒泡触发其他不必要事件
            });
        }

        rescale() {
            if (!this.container) return;
            if (!window?.innerWidth) return;
            const maxWidth = 0.9 * window.innerWidth;
            const scale = Math.min(1, maxWidth / 800);
            this.scale = scale;
            this.container.style.transform = `translate(-${(1 - scale) / 2 * 100}%, -${(1 - scale) / 2 * 100}%) scale(${scale})`;
            this.container.style.maxWidth = `${95 / scale}%`;
            this.container.style.maxHeight = `${95 / scale}%`;

            const newLeft = Utils.clamp(this.container.getBoundingClientRect().left, 0, window.innerWidth - this.container.clientWidth * scale);
            const newTop = Utils.clamp(this.container.getBoundingClientRect().top, 0, window.innerHeight - this.container.clientHeight * scale);
            this.container.style.left = `${newLeft}px`;
            this.container.style.top = `${newTop}px`;
        }

        // 销毁窗口
        close() {
            if (this.container) {
                this.container.remove();
                this.container = null;
                this.tabs = [];
            }
        }
    }

    class CollapseSection {
        constructor(options = {}) {
            this.title = options.title || '折叠面板';
            this.content = options.content || ''; // 支持字符串或 DOM 元素
            this.isExpanded = options.isExpanded || false; // 默认是否展开

            this.element = null;
            this.header = null;
            this.body = null;

            this.init();
        }

        init() {
            this.createStyles();
            this.createElements();
            this.initEvent();
        }


        createStyles() {
            if (document.getElementById('tm-collapse-style')) return;
            const style = document.createElement('style');
            style.id = 'tm-collapse-style';
            style.innerHTML = `
                /* 折叠面板容器 */
                .tm-collapse-item {
                    border: 1px solid #e0e0e0;
                    border-radius: 4px;
                    margin-bottom: 8px;
                    background: #ffffff;
                    overflow: hidden;
                }

                /* 面板头部 */
                .tm-collapse-header {
                    padding: 10px 12px;
                    background: #f7f7f7;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    user-select: none;
                    font-size: 13px;
                    font-weight: 500;
                }
                .tm-collapse-header:hover {
                    background: #eeeeee;
                }

                /* 旋转箭头 */
                .tm-collapse-arrow {
                    font-size: 10px;
                    color: #999;
                    transition: transform 0.2s ease;
                    transform: rotate(-90deg); /* 默认朝左/闭合 */
                }
                .tm-collapse-item.expanded .tm-collapse-arrow {
                    transform: rotate(0deg); /* 展开时朝下 */
                }

                /* 内容动画核心层 */
                .tm-collapse-body {
                    height: 0;
                    overflow: hidden;
                    transition: height 0.25s ease-in-out; /* 平滑高度动画 */
                    background-color: rgb(252, 252, 252);
                }

                /* 内容内衬 */
                .tm-collapse-content {
                    font-size: 13px;
                    color: #333;
                    border-top: 1px solid #eee;
                }
            `;
            document.head.appendChild(style);
        }

        createElements() {
            // 创建主包裹容器
            this.element = document.createElement('div');
            this.element.className = 'tm-collapse-item';
            if (this.isExpanded) this.element.classList.add('expanded');

            // 创建头部（点击切换）
            this.header = document.createElement('div');
            this.header.className = 'tm-collapse-header';
            this.header.innerHTML = `
            <span class="tm-collapse-title">${this.title}</span>
            <span class="tm-collapse-arrow">▼</span>
        `;

            // 创建内容包裹层
            this.body = document.createElement('div');
            this.body.className = 'tm-collapse-body';

            // 创建实际内容层
            const contentInner = document.createElement('div');
            contentInner.className = 'tm-collapse-content';

            if (typeof this.content === 'object') {
                contentInner.appendChild(this.content);
            } else {
                contentInner.innerHTML = this.content;
            }

            this.body.appendChild(contentInner);
            this.element.appendChild(this.header);
            this.element.appendChild(this.body);

            // 如果默认是展开的，初始化时给高度，否则设为 0
            if (this.isExpanded) {
                // 在渲染到页面前，先设置为 auto 确保能撑开
                this.body.style.height = 'auto';
            } else {
                this.body.style.height = '0px';
            }
        }

        initEvent() {
            this.header.addEventListener('click', () => this.toggle());
        }

        toggle() {
            this.isExpanded = !this.isExpanded;
            this.element.classList.toggle('expanded', this.isExpanded);

            if (this.isExpanded) {
                // 展开逻辑：先获取内容的实际高度（由于CSS中设置了过渡，通过高度显式赋值触发动画）
                const contentHeight = this.body.querySelector('.tm-collapse-content').scrollHeight;
                this.body.style.height = `${contentHeight}px`;

                // 动画结束后，将高度设为 auto，防止里面内容后续发生变化（比如动态增删东西）时高度被锁死
                const onTransitionEnd = () => {
                    if (this.isExpanded) this.body.style.height = 'auto';
                    this.body.removeEventListener('transitionend', onTransitionEnd);
                };
                this.body.addEventListener('transitionend', onTransitionEnd);
            } else {
                // 折叠逻辑：如果当前是 auto，必须先赋予精确的物理像素值，下一帧再变为 0，否则动画不生效
                if (this.body.style.height === 'auto') {
                    this.body.style.height = `${this.body.scrollHeight}px`;
                    // 强制重绘
                    this.body.offsetHeight;
                }
                this.body.style.height = '0px';
            }
        }

        // 方便外部将这个组件挂载到任意容器中
        mount(parentContainer) {
            if (parentContainer) {
                parentContainer.appendChild(this.element);
                // 补充处理：如果初始化是展开状态，mount 后重新校准一次高度
                if (this.isExpanded) {
                    this.body.style.height = 'auto';
                }
            }
        }
    }

    //#endregion

    //#region History

    const FishKeepHistory = new class {
        fish = null;
        events = null;
        notes = null;

        latestUpdateTime = new Date(0);
        price = null;
        exp = null;

        priceMultiplier(score) {
            const rarity = Utils.scoreToRarity(score);
            if (rarity == 0) return 0.2;
            if (rarity == 1) return 1;
            if (rarity == 2) return 2;
            if (rarity == 3) return 5;
            if (rarity == 4) return 10;
            return 0;
        }
        expMultiplier(score) {
            const rarity = Utils.scoreToRarity(score);
            if (score <= 2) return 10;
            if (rarity == 0) return 0.82;
            if (rarity == 1) return 1;
            if (rarity == 2) return 1.28;
            if (rarity == 3) return 1.7;
            if (rarity == 4) return 2; // 没测
            return 0;
        }

        computeSmallFishPrice(weight) {
            if (weight >= 0.3) return null;
            if (weight <= 0.005) return 1;
            if (weight <= 0.019) return 2;
            if (weight < 0.061) return 3; // 0.060=3, 0.062=4
            if (weight < 0.119) return 4; // 0.118=4, 0.120=5
            if (weight < 0.200) return 5; // 0.194=5, 0.202=6
            return 6;
        }

        updatePriceInfo(fish) {
            if (!fish.fishKeep) return;
            const weight = fish.weight;
            if (weight <= 0.3) return;
            const price = fish.fishKeep.price;
            const coeff = this.priceMultiplier(fish.score);

            const unitPrice = price / weight / coeff;
            const { sum, count } = this.price[fish.fishId] ?? {};
            this.price[fish.fishId] = {
                sum: (sum ?? 0) + unitPrice,
                count: (count ?? 0) + 1,
            };
        }
        updateExpInfo(fish) {
            if (!fish.fishKeep) return;
            const score = fish.score;
            const exp = fish.fishKeep.exp;
            if (score <= 2 || Utils.scoreToRarity(score) >= 4) return;

            const coeff = this.expMultiplier(fish.score);
            const X = fish.weight;
            const Y = exp / coeff;
            const { sumX, sumY, sumXX, sumXY, n } = this.exp[fish.fishId] ?? {};
            this.exp[fish.fishId] = {
                sumX: (sumX ?? 0) + X,
                sumY: (sumY ?? 0) + Y,
                sumXX: (sumXX ?? 0) + X * X,
                sumXY: (sumXY ?? 0) + X * Y,
                n: (n ?? 0) + 1,
            };
        }
        updateFishInfo(fish, forceUpdate = false) {
            if (!forceUpdate) {
                if (fish.caughtAt <= this.latestUpdateTime) return;
                this.latestUpdateTime = fish.caughtAt;
            }
            // dbg(`更新鱼护信息: ${new Date(fish.caughtAt).toLocaleString()} ${GameData.fishData[fish.fishId].name}`)
            this.updatePriceInfo(fish);
            this.updateExpInfo(fish);
        }

        computeBasePrice(fishId, weight) {
            const info = this.price[fishId];
            if (!info) return null;

            const unit = info.sum / info.count;
            const price = weight * unit;
            return price;
        }
        computeBaseExp(fishId, weight) {
            const info = this.exp[fishId];
            if (!info) return null;

            const { sumX, sumY, sumXX, sumXY, n } = info;
            const d = n * sumXX - sumX * sumX;
            if (n < 2 || Math.abs(d) < Utils.eps) return null;

            const k = (n * sumXY - sumX * sumY) / d;
            const b = (sumY - k * sumX) / n;
            const exp = k * weight + b;
            return exp;
        }
        computePrice(fish) {
            if (fish.fishKeep?.price) return fish.fishKeep.price;
            const smallFish = this.computeSmallFishPrice(fish.weight);
            if (smallFish) return smallFish;
            const base = this.computeBasePrice(fish.fishId, fish.weight);
            if (!base) return null;

            const coeff = this.priceMultiplier(fish.score ?? 50);
            const price = base * coeff;
            return price;
        }
        computeExp(fish) {
            if (fish.fishKeep?.exp) return fish.fishKeep.exp;
            const base = this.computeBaseExp(fish.fishId, fish.weight);
            if (!base) return null;

            const coeff = this.expMultiplier(fish.score);
            const exp = base * coeff;
            return exp;
        }

        computeRefPrice(fishId) {
            const info = this.price[fishId];
            if (!info) return null;

            const unit = info.sum / info.count;
            const weightRange = GameData.fishData[fishId].weightRange;
            const price = Range.quantile(weightRange, 0.3) * unit;
            return price;
        }

        updateByMessage(msg) {
            const time = Utils.parseDate(msg.created_at);
            const id = msg.payload.kept_fish_id;
            this.fish[id] = {
                ...(this.fish[id] ?? {}),
                caughtAt: time,
                keptFishId: id,
                fishId: msg.payload.fish_id,
                fishingSetup: msg.payload.fishing_setup,
                regionId: msg.payload.region_id,
                spotId: msg.payload.spot_id,
                score: msg.payload.rating_score,
                weight: msg.payload.weight_kg,
                size: msg.payload.size_cm,
            };
        }
        updateByFishKeepItem(fish) {
            const time = Utils.parseDate(fish.caught_at);
            const id = fish.id;
            const item = {
                ...(this.fish[id] ?? {}),
                caughtAt: time,
                keptFishId: id,
                fishId: fish.fish_id,
                fishingSetup: fish.fishing_setup,
                regionId: fish.region_id,
                spotId: fish.spot_id,
                score: fish.rating_score,
                weight: fish.weight_kg,
                size: fish.size_cm,
                fishKeep: {
                    exp: fish.release_exp,
                    price: fish.sale_value,
                },
            };
            this.fish[id] = item;
            this.updateFishInfo(item);
        }
        updateReeling(msg) {
            const time = Utils.parseDate(msg.created_at);
            this.events[time] = {
                ...(this.events[time] ?? {}),
                time: time,
                fishId: msg.payload.fish_id,
                weight: msg.payload.weight_kg,
                size: msg.payload.size_cm,
                outcome: msg.payload.outcome,
                body: msg.body,
            };
        }

        validFishKeep() {
            const ret = [];
            Object.values(this.fish).forEach(item => {
                if (item.fishKeep) ret.push(item);
            });
            return ret;
        }
        debug() {
            const formatedPrice = Object.entries(this.price).map(([id, t]) => {
                return `${GameData.fishData[id].name}: ${(t.sum / t.count).toFixed(2)}  (${t.count})`;
            });
            dbg('价格信息 (FishKeepHistory.price)', formatedPrice);
        }

        save() {
            LocalStorageData.set('fish_keep_history', Object.values(this.fish), `length = ${Object.values(this.fish).length}`);
            LocalStorageData.set('reeling_history', Object.values(this.events), `length = ${Object.values(this.events).length}`);
            LocalStorageData.set('fish_keep_notes', Object.values(this.notes), `length = ${Object.values(this.notes).length}`);
            LocalStorageData.set('fish_info', { latestUpdateTime: this.latestUpdateTime, price: this.price, exp: this.exp });
            dbg(`已保存鱼护历史数据: ${Object.values(this.fish).length} 条 (有效 ${this.validFishKeep().length} 条), 溜鱼失败 ${Object.values(this.events).length} 条`);
        }

        saveNotes() {
            LocalStorageData.set('fish_keep_notes', Object.values(this.notes), `length = ${Object.values(this.notes).length}`);
        }

        getNotes() {
            return Object.values(this.notes).sort((a, b) => a.time - b.time);
        }

        upsertNote(note) {
            const time = Number(note.time);
            if (!Number.isFinite(time)) return false;
            const id = note.id || `${time}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
            this.notes[id] = {
                id,
                time,
                title: String(note.title ?? '').trim() || '未命名备注',
                content: String(note.content ?? '').trim(),
                updatedAt: Date.now(),
            };
            this.saveNotes();
            return true;
        }

        deleteNote(id) {
            if (!id || !this.notes[id]) return false;
            delete this.notes[id];
            this.saveNotes();
            return true;
        }

        exportFishKeep() {
            const data = {
                fish: this.fish,
                events: this.events,
            };
            return LZString.compressToBase64(JSON.stringify(data));
        }
        importFishKeep(s, append = false) {
            try {
                const data = JSON.parse(LZString.decompressFromBase64(s));
                if (!append) {
                    this.fish = data.fish;
                    this.events = data.events;
                } else {
                    this.fish = { ...this.fish, ...data.fish };
                    this.events = { ...this.events, ...data.events };
                }
                this.save();
                return true;
            } catch (e) {
                return false;
            }
        }
        clearFishKeep() {
            this.fish = {};
            this.events = {};
            this.save();
        }

        exportFishInfo() {
            const data = {
                price: this.price,
                exp: this.exp,
            };
            return LZString.compressToBase64(JSON.stringify(data));
        }
        importFishInfo(s, append = false) {
            try {
                const data = JSON.parse(LZString.decompressFromBase64(s));
                if (!append) {
                    this.latestUpdateTime = new Date(0);
                    this.price = data.price ?? {};
                    this.exp = data.exp ?? {};
                } else {
                    Object.entries(data.price).forEach(([id, v]) => {
                        const { sum, count } = this.price[id] ?? {};
                        this.price[id] = {
                            sum: (sum ?? 0) + v.sum,
                            count: (count ?? 0) + v.count,
                        };
                    });
                    Object.entries(data.exp).forEach(([id, v]) => {
                        const { sumX, sumY, sumXX, sumXY, n } = this.exp[id] ?? {};
                        this.exp[id] = {
                            sumX: (sumX ?? 0) + v.sumX,
                            sumY: (sumY ?? 0) + v.sumY,
                            sumXX: (sumXX ?? 0) + v.sumXX,
                            sumXY: (sumXY ?? 0) + v.sumXY,
                            n: (n ?? 0) + v.n,
                        };
                    });
                }
                this.save();
                return true;
            } catch (e) {
                return false;
            }
        }
        recomputeFishInfo() {
            this.price = {};
            this.exp = {};
            Object.values(this.fish).forEach(item => {
                this.updateFishInfo(item, true);
            });
            this.latestUpdateTime = Date.now();
            this.save();
            this.debug();
        }

        constructor() {
            this.fish = {};
            (LocalStorageData.get('fish_keep_history') ?? []).forEach(item => { this.fish[item.keptFishId] = item; });

            this.events = {};
            (LocalStorageData.get('reeling_history') ?? []).forEach(item => { this.events[item.time] = item; });

            this.notes = {};
            (LocalStorageData.get('fish_keep_notes') ?? []).forEach(item => {
                if (!Number.isFinite(Number(item.time))) return;
                const id = item.id || `${item.time}`;
                this.notes[id] = { ...item, id, time: Number(item.time) };
            });

            const info = LocalStorageData.get('fish_info') ?? DefaultFishInfo;
            this.latestUpdateTime = new Date(info.latestUpdateTime ?? 0);
            this.price = info.price ?? {};
            this.exp = info.exp ?? {};
        }
    };

    const FishKeepFinder = new class {
        config = {
            searchLimit: 300,
            searchDepthLimit: 4, // 3可能够了
            ignoreKeys: ['fish_dex_stats'],
            ignoreTypes: ['fishing_tick', 'boat_list_update', 'region_update'],
            ignoreActions: ['get_game_data', 'get_my_guild', 'get_rankings'],
        }

        #msgLatestUpdateTime = new Date(0);
        #fishLatestUpdateTime = new Date(0);

        handleMessages(msg) {
            const messages = msg.sort((a, b) => Utils.parseDate(a.created_at) - Utils.parseDate(b.created_at));
            for (const msg of messages) {
                // 处理新消息
                const time = Utils.parseDate(msg.created_at);
                if (time <= this.#msgLatestUpdateTime) continue;

                // 更新上鱼记录
                if (msg.message_type == 'catch') {
                    FishKeepHistory.updateByMessage(msg);
                }

                // 更新溜鱼记录
                if (msg.message_type == 'reeling') {
                    FishKeepHistory.updateReeling(msg);
                }

                this.#msgLatestUpdateTime = time;
            }
        }

        handleFishKeep(fishKeepMsg) {
            const fishKeep = fishKeepMsg.sort((a, b) => Utils.parseDate(a.caught_at) - Utils.parseDate(b.caught_at));
            for (const fish of fishKeep) {
                // 处理新消息
                const time = Utils.parseDate(fish.caught_at);
                if (time <= this.#fishLatestUpdateTime) continue;

                FishKeepHistory.updateByFishKeepItem(fish);

                this.#fishLatestUpdateTime = time;
            }
        }

        findFish(msg) {
            const config = this.config;
            if (config.ignoreTypes.includes(msg.type)) return;
            if (config.ignoreActions.includes(msg.action)) return;

            function isFishKeepItem(m) {
                if (!m.hasOwnProperty('release_exp')) return false;
                if (!m.hasOwnProperty('sale_value')) return false;

                if (!m.hasOwnProperty('rating_score')) return false;
                if (!m.hasOwnProperty('weight_kg')) return false;
                if (!m.hasOwnProperty('size_cm')) return false;

                if (!m.hasOwnProperty('id')) return false;
                if (!m.hasOwnProperty('fish_id')) return false;
                if (!m.hasOwnProperty('caught_at')) return false;
                return true;
            }
            function isMessage(m) {
                if (!m.hasOwnProperty('message_type')) return false;
                if (!m.hasOwnProperty('created_at')) return false;
                if (!m.hasOwnProperty('body')) return false;
                if (!m.hasOwnProperty('payload')) return false;
                return true;
            }
            function findLists(msg) {
                let count = 0;
                const targets = [];
                function isList(m) {
                    if (!Array.isArray(m)) return false;
                    if (m.length === 0) return false;
                    return true;
                }
                function find(m, maxDep, dep = 0) {
                    if (++count > config.searchLimit) {
                        err('已达到消息搜索上限', msg);
                        return;
                    }
                    if (isList(m)) {
                        targets.push(m);
                        return;
                    }

                    if (m == null) return;
                    if (dep >= maxDep) return;
                    if (typeof m !== 'object') return;
                    if (Array.isArray(m)) return;

                    const entries = Object.entries(m);
                    for (const [k, v] of entries) {
                        if (config.ignoreKeys.includes(k)) continue;
                        find(v, maxDep, dep + 1);
                    }
                }
                find(msg, config.searchDepthLimit);
                // dbg(`处理消息 ${msg.type}${msg.action ? ' - ' + msg.action : ''}, ${count}`, msg)
                return targets;
            }

            const lists = findLists(msg);
            let updated = false;
            lists.forEach(l => {
                if (l.every(m => isFishKeepItem(m))) {
                    out(`在 ${msg.type}${msg.action ? ' - ' + msg.action : ''} 中找到鱼护记录`, l);
                    this.handleFishKeep(l);
                    updated = true;
                } else if (l.every(m => isMessage(m))) {
                    out(`在 ${msg.type}${msg.action ? ' - ' + msg.action : ''} 中找到消息记录`, l);
                    this.handleMessages(l);
                    updated = true;
                }
            });
            if (updated) FishKeepHistory.save();
        }

        constructor() {
            MessageHandler.addListener('any', msg => {
                this.findFish(msg);
            });
        }
    };

    //#endregion

    //#region Shared Chart Utilities

    let _echartsLoadPromise = null;
    function ensureEcharts() {
        if (typeof echarts !== 'undefined') return Promise.resolve(echarts);
        if (_echartsLoadPromise) return _echartsLoadPromise;
        _echartsLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/echarts@6.1.0/dist/echarts.min.js';
            script.async = true;
            script.onload = () => resolve(window.echarts);
            script.onerror = () => reject(new Error('[LazyFisher] echarts 加载失败'));
            (document.head || document.documentElement).appendChild(script);
        });
        return _echartsLoadPromise;
    }

    const COLOR_PALETTE = [
        '#E64550', '#F27E52', '#FBC05D', '#91CC75',
        '#73C0DE', '#5470C6', '#9A60B4', '#949AB3',
    ];

    /** 与历史总览「评级」着色一致 */
    function getScoreCategories(colorPalette = COLOR_PALETTE) {
        return [
            { name: '传说', color: colorPalette[0] },
            { name: '罕见', color: colorPalette[2] },
            { name: '稀有', color: colorPalette[4] },
            { name: '达标', color: colorPalette[3] },
            { name: '不达标', color: colorPalette[7] },
        ];
    }

    const ChartTooltip = {
        /**
         * 散点图鱼获提示框
         * @param {Object} param ECharts tooltip param
         * @returns {string} HTML
         */
        fishScatter(param) {
            const fish = param.data[2];
            const time = Utils.formatDate(fish.time, 'DT');
            const name = GameData.fishData[fish.fishId].name;
            const color = param.color;
            const price = fish.price ? Utils.formatNumber(fish.price.toFixed(0)) : '未知';
            const exp = fish.exp ? fish.exp.toFixed(1) : '未知';
            return `<div style="margin: 0px 0 0;line-height:1;"><div style="font-size:14px;color:#6d6e73;font-weight:400;line-height:1;">${time}</div><div style="margin: 10px 0 0;line-height:1;"><div style="margin: 0px 0 0;line-height:1;"><span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span><span style="font-size:14px;color:#6d6e73;font-weight:900;margin-left:2px;">${name}</span><span style="float:right;margin-left:20px;font-size:14px;color:#6d6e73;font-weight:400;display:flex;flex-direction: column;"><span>${fish.weight.toFixed(2)}kg&nbsp;&nbsp;${fish.score.toFixed(2)}%</span><span style="margin-top:5px;">${Ui.getPriceIcon()}${price}&nbsp;&nbsp;${exp} EXP</span></span><div style="clear:both"></div></div><div style="clear:both"></div></div><div style="clear:both"></div></div>`;
        },

        /**
         * 溜鱼事件提示框
         * @param {Object} param ECharts tooltip param
         * @returns {string} HTML
         */
        reelingEvent(param) {
            const data = param.data[2];
            const time = Utils.formatDate(data.time, 'DT');
            const name = GameData.fishData[data.fishId].name;
            let body = data.body;
            if (data.outcome == 'escaped') body = '脱钩';
            else if (data.outcome == 'broken_leader') body = '引线断裂';
            const color = param.color;
            return `<div style="margin: 0px 0 0;line-height:1;"><div style="font-size:14px;color:#6d6e73;font-weight:400;line-height:1;">${time}</div><div style="margin: 10px 0 0;line-height:1;"><div style="margin: 0px 0 0;line-height:1;"><span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span><span style="font-size:14px;color:#6d6e73;font-weight:900;margin-left:2px;">${name}</span><span style="float:right;margin-left:20px;font-size:14px;color:#6d6e73;font-weight:400;display:flex;flex-direction: column;">${body}</span><div style="clear:both"></div></div><div style="clear:both"></div></div><div style="clear:both"></div></div>`;
        },

        /**
         * 钓场区域提示框
         * @param {Object} param ECharts tooltip param
         * @returns {string} HTML
         */
        regionArea(param) {
            const data = param.data.data;
            const name = data.name;
            const color = data.color;
            const beginTime = param.data.coord[0][0];
            const endTime = param.data.coord[1][0];
            const range = Utils.formatTimeRange(beginTime, endTime);
            return `<div style="margin: 0px 0 0;line-height:1;"><div style="font-size:14px;color:#6d6e73;font-weight:400;line-height:1;">${range}</div><div style="margin: 10px 0 0;line-height:1;"><div style="margin: 0px 0 0;line-height:1;"><span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span><span style="font-size:14px;color:#6d6e73;font-weight:900;margin-left:2px;">${name}</span><div style="clear:both"></div></div><div style="clear:both"></div></div><div style="clear:both"></div></div>`;
        },
    };

    /**
     * 创建导入/导出 UI 区块
     * @param {Object} handlers - { onImport(text), onImportAppend(text), onExport(), extraButtons?: HTMLElement[] }
     * @returns {HTMLElement}
     */
    function createImportExportSection(handlers) {
        const textArea = Ui.elem('textarea', { style: 'resize: vertical; min-height: 100px;' });
        const importBtn = Ui.button('导入（覆盖）');
        const importAppendBtn = Ui.button('导入（增量）');
        const exportBtn = Ui.button('导出');
        importBtn.onclick = () => {
            handlers.onImport(textArea.value);
        };
        importAppendBtn.onclick = () => {
            handlers.onImportAppend(textArea.value);
        };
        exportBtn.onclick = () => {
            textArea.value = handlers.onExport();
        };
        const buttons = [importBtn, importAppendBtn, exportBtn];
        if (handlers.extraButtons) buttons.push(...handlers.extraButtons);
        return Ui.div({ style: 'margin: 8px; display: flex; flex-direction: column; gap: 5px;' }, [
            Ui.div({ style: 'display: flex; gap: 5px;' }, buttons),
            textArea,
        ]);
    }

    //#endregion

    //#region Ui

    const SettingsUi = new class {
        popup = new TabbedWindow({
            width: 500,
            height: 500,
            minWidth: 400,
            minHeight: 300,
            allowDragOutsize: true,
            allowResize: true,
        });

        fishKeepPanel() {
            let chart = null;
            let chartDiv = null;
            let minTime = 0, maxTime = 0;
            let onChartSelected;

            function getChartOption(colorPalette) {
                const rawData = Object.values(FishKeepHistory.fish);
                const data = [];

                minTime = Date.now(), maxTime = Date.now();
                let minWeight = 1e9, maxWeight = 0;
                rawData.forEach(fish => {
                    const fishId = fish.fishId;
                    if (fish.caughtAt < minTime) minTime = fish.caughtAt;
                    if (fish.weight < minWeight) minWeight = fish.weight;
                    if (fish.weight > maxWeight) maxWeight = fish.weight;
                    data.push({
                        time: new Date(fish.caughtAt),
                        fishId: fishId,
                        regionId: fish.regionId,
                        spotId: fish.spotId,
                        count: 1,
                        weight: fish.weight,
                        score: fish.score,
                        price: FishKeepHistory.computePrice(fish),
                        exp: FishKeepHistory.computeExp(fish),
                    });
                });

                const catagories = [
                    { name: '传说', color: colorPalette[0] },
                    { name: '罕见', color: colorPalette[2] },
                    { name: '稀有', color: colorPalette[4] },
                    { name: '达标', color: colorPalette[3] },
                    { name: '不达标', color: colorPalette[7] },
                ];
                const mapping = fish => {
                    return catagories[4 - Utils.scoreToRarity(fish.score)].name;
                };
                const yLabels = catagories.map(c => c.name);

                const series = [];

                catagories.forEach(({ name, color }) => {
                    series.push({
                        name: name,
                        type: 'scatter',
                        xAxisIndex: 0,
                        yAxisIndex: 0,
                        data: data.filter(item => mapping(item) == name)
                            .map(item => [item.time, mapping(item), item]),
                        symbolSize: data => Range.position({ min: minWeight, max: maxWeight }, data[2].weight) * 15 + 5,
                        itemStyle: {
                            color: color,
                            opacity: 0.8,
                            borderColor: '#fff',
                            borderWidth: 0.1
                        },
                        tooltip: {
                            formatter: ChartTooltip.fishScatter,
                        },
                        emphasis: {
                            itemStyle: { color: color, opacity: 1 },
                        },
                    });
                });


                const option = {
                    // legend: {
                    //     show: true,
                    //     data: catagories.map(c => c.name),
                    //     top: 10,
                    // },
                    tooltip: {
                        trigger: 'item',
                    },
                    brush: {
                        xAxisIndex: 0,
                        toolbox: ['clear'],
                        brushLink: 'none',
                        brushType: 'lineX',
                        outOfBrush: {
                            colorLightness: 0.9,
                        },
                        z: 0,
                    },
                    grid: [{ top: 10, bottom: 60, left: 60, right: 45 }],
                    dataZoom: [
                        {
                            type: 'slider',
                            xAxisIndex: 0,
                            start: 0,
                            end: 100,
                            bottom: 10,
                            left: 58,
                            right: 45,
                            height: 24,
                            filterMode: 'none',
                            brushSelect: false,
                            showDataShadow: false,
                            labelFormatter: value => Utils.formatDate(value, 'd'),
                        },
                        {
                            type: 'inside', // 鼠标滚轮缩放
                            xAxisIndex: 0,
                        }
                    ],
                    xAxis: [
                        {
                            type: 'time',
                            gridIndex: 0,
                            min: minTime,
                            max: maxTime,
                            axisPointer: {
                                label: {
                                    formatter: (param) => {
                                        const t = new Date(param.value);
                                        const M = t.getMonth() + 1;
                                        const d = t.getDate();
                                        const h = t.getHours().toString().padStart(2, '0');
                                        const m = t.getMinutes().toString().padStart(2, '0');
                                        return `${M}/${d} ${h}:${m}`;
                                    }
                                }
                            },
                            splitLine: { show: true, lineStyle: { type: 'dashed' } }
                        }
                    ],
                    yAxis: [
                        {
                            type: 'category',
                            gridIndex: 0,
                            data: yLabels,
                            inverse: true,
                            boundaryGap: 0,
                            splitLine: { show: true, lineStyle: { type: 'dashed' } }
                        }
                    ],
                    series: series,
                };
                return option;
            }

            function initChart() {
                const totalCount = Object.keys(FishKeepHistory.fish).length;
                const option = getChartOption(COLOR_PALETTE);
                chart.setOption(option);
                chart.on('brushselected', (() => {
                    let brushTimer = null;
                    return e => {
                        clearTimeout(brushTimer);
                        brushTimer = setTimeout(() => {
                            const batch = e.batch?.[0];
                            const range = batch?.areas?.[0]?.coordRange;
                            const count = batch.selected?.reduce((pre, cur) => {
                                return pre + cur.dataIndex.length;
                            }, 0);
                            if (!range) return;
                            onChartSelected(range, count, totalCount);
                        }, 150);
                    };
                })());
                chart.dispatchAction({
                    type: 'takeGlobalCursor',
                    key: 'brush',
                    brushOption: {
                        brushType: 'lineX',
                        brushMode: 'single',
                    }
                });
                chart.dispatchAction({
                    type: 'brush',
                    areas: [
                        {
                            brushType: 'lineX',
                            coordRange: [minTime, Math.max(minTime, Date.now() - 7 * 24 * Utils.msPerH)],
                            xAxisIndex: 0,
                        }
                    ]
                });
            }

            function fishSelectSection() {
                const div = Ui.div({ style: `padding: 5px 0px 10px;` });

                chartDiv = Ui.div({ style: `height: 165px;` });
                div.appendChild(chartDiv);

                return div;
            }

            function fishKeepDeleteSection() {
                const div = Ui.div();

                let minSelected, maxSelected;
                const selectedText = Ui.div();
                const timeRangeText = Ui.div("text-muted");
                onChartSelected = (range, count, total) => {
                    [minSelected, maxSelected] = range;
                    selectedText.textContent = `已选 ${count} / ${total} 条鱼获数据`;
                    timeRangeText.textContent = `${Utils.formatDate(minSelected, 'Dt')} ~ ${Utils.formatDate(maxSelected, 'Dt')}`;
                };

                const deleteBtn = Ui.button('删除所选');
                deleteBtn.onclick = () => {
                    FishKeepHistory.fish = Object.fromEntries(Object.entries(FishKeepHistory.fish).filter(([_, fish]) => {
                        return fish.caughtAt < minSelected || fish.caughtAt > maxSelected;
                    }));

                    FishKeepHistory.events = Object.fromEntries(Object.entries(FishKeepHistory.events).filter(([_, event]) => {
                        return event.time < minSelected || event.time > maxSelected;
                    }));
                    FishKeepHistory.save();
                    initChart();
                }

                div.appendChild(Ui.div({ style: 'padding: 10px; display: flex;' }, [
                    Ui.div({ style: 'flex: 1; margin: auto;' }, [selectedText, timeRangeText]),
                    deleteBtn,
                ]))
                return div;
            }

            function importExportSection() {
                return createImportExportSection({
                    onImport: (text) => {
                        FishKeepHistory.importFishKeep(text);
                        initChart();
                    },
                    onImportAppend: (text) => {
                        FishKeepHistory.importFishKeep(text, true);
                        initChart();
                    },
                    onExport: () => FishKeepHistory.exportFishKeep(),
                });
            }

            function construct() {
                const container = Ui.div({ style: 'margin: 10px;' });

                container.appendChild(fishSelectSection());

                new CollapseSection({
                    title: '记录清理',
                    isExpanded: false,
                    content: fishKeepDeleteSection(),
                }).mount(container);

                new CollapseSection({
                    title: '导入/导出',
                    isExpanded: false,
                    content: importExportSection(),
                }).mount(container);

                return container;
            }

            function onInit() {
                ensureEcharts().then(() => {
                    chart = echarts.init(chartDiv);
                    initChart();
                    const observer = new ResizeObserver((entries) => {
                        window.requestAnimationFrame(() => {
                            if (!Array.isArray(entries) || !entries.length) {
                                return;
                            }
                            chart.resize();
                        });
                    });
                    observer.observe(chartDiv);
                }).catch(e => console.warn(e));
            }

            return {
                content: construct(),
                onInit: onInit,
            }
        }

        fishInfoPanel() {
            function importExportSection() {
                const clearBtn = Ui.button('重新计算');
                clearBtn.onclick = () => {
                    FishKeepHistory.recomputeFishInfo();
                };
                return createImportExportSection({
                    onImport: (text) => FishKeepHistory.importFishInfo(text),
                    onImportAppend: (text) => FishKeepHistory.importFishInfo(text, true),
                    onExport: () => FishKeepHistory.exportFishInfo(),
                    extraButtons: [clearBtn],
                });
            }

            function construct() {
                const container = Ui.div({ style: 'margin: 10px;' });

                new CollapseSection({
                    title: '导入/导出',
                    isExpanded: false,
                    content: importExportSection(),
                }).mount(container);

                return container;
            }

            function onInit() {
                dbg('onInit');
            }
            function onResize() {
                dbg('onResize');
            }

            return {
                content: construct(),
                onInit: onInit,
                onResize: onResize,
            }
        }

        showPopup() {
            if (this.popup.isOpening) return;

            this.popup.addTab('鱼护管理', this.fishKeepPanel(), { overflowX: 'hidden' });
            this.popup.addTab('价格/经验数据', this.fishInfoPanel(), { overflowX: 'hidden' });
            this.popup.open();
        }
    }

    const FishKeepHistoryUi = new class {
        popup = new TabbedWindow({
            width: 800,
            height: 720,
            minWidth: 500,
            minHeight: 400,
            allowDragOutsize: true,
            allowResize: true,
            showSettings: () => {
                SettingsUi.showPopup();
            },
        });
        chart = null;
        chartDiv = null;
        config = null;
        refreshHistoryOverview = null;

        escapeHtml(value) {
            return String(value ?? '').replace(/[&<>"']/g, ch => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            }[ch]));
        }

        toDatetimeLocalValue(ms) {
            const t = new Date(ms);
            const y = t.getFullYear();
            const M = String(t.getMonth() + 1).padStart(2, '0');
            const d = String(t.getDate()).padStart(2, '0');
            const h = String(t.getHours()).padStart(2, '0');
            const m = String(t.getMinutes()).padStart(2, '0');
            return `${y}-${M}-${d}T${h}:${m}`;
        }

        parseDatetimeLocalValue(value) {
            const ms = Date.parse(value);
            return Number.isFinite(ms) ? ms : null;
        }

        historyPanel() {
            const ui = this;
            let chart = null;
            let chartDiv = null;
            let config = null;

            // dim = 'price' | 'exp' | 'weight' | 'count'
            function getOrder(data, order) {
                let totalPrice = {};
                data.forEach(fish => {
                    const id = fish.fishId;
                    let val = null;
                    if (order == 'price') val = FishKeepHistory.computePrice(fish);
                    else if (order == 'exp') val = FishKeepHistory.computeExp(fish);
                    else if (order == 'weight') val = fish.weight;
                    else if (order == 'count') val = 1;
                    totalPrice[id] = (totalPrice[id] ?? 0) + val;
                });
                return Object.entries(totalPrice).sort((a, b) => b[1] - a[1]).map(a => a[0]);;
            }

            /**
             * 将原始鱼获数据标准化为图表可用格式
             * @returns {{ data, minTime, maxTime, minWeight, maxWeight }}
             */
            function prepareChartData(rawData, intervalMs) {
                const data = [];
                let minTime = Utils.floorTo(Date.now(), intervalMs), maxTime = 0;
                let minWeight = 1e9, maxWeight = 0;
                rawData.forEach(fish => {
                    const hour = Utils.floorTo(fish.caughtAt, intervalMs);
                    if (hour < minTime) minTime = hour;
                    if (hour > maxTime) maxTime = hour;
                    if (fish.weight < minWeight) minWeight = fish.weight;
                    if (fish.weight > maxWeight) maxWeight = fish.weight;
                    data.push({
                        time: new Date(fish.caughtAt),
                        hour: new Date(hour),
                        fishId: fish.fishId,
                        regionId: fish.regionId,
                        spotId: fish.spotId,
                        count: 1,
                        weight: fish.weight,
                        score: fish.score,
                        price: FishKeepHistory.computePrice(fish),
                        exp: FishKeepHistory.computeExp(fish),
                    });
                });
                return { data, minTime, maxTime, minWeight, maxWeight };
            }

            /**
             * 构建颜色映射策略工厂
             * @returns {Object} coloringMapList - 按 coloring 类型索引的策略工厂
             */
            function buildColoringMapList(coloring, colorPalette, rawData, fishSpeciesLimit) {
                return {
                    'score': () => {
                        const scoreCat = [
                            { name: '传说', color: colorPalette[0] },
                            { name: '罕见', color: colorPalette[2] },
                            { name: '稀有', color: colorPalette[4] },
                            { name: '达标', color: colorPalette[3] },
                            { name: '不达标', color: colorPalette[7] },
                        ];
                        return {
                            catagories: scoreCat,
                            mapping: fish => scoreCat[4 - Utils.scoreToRarity(fish.score)].name,
                        };
                    },
                    'fishId': () => {
                        const fishIdCat = getOrder(rawData, 'price').slice(0, fishSpeciesLimit);
                        return {
                            catagories: fishIdCat.map((id, n) => ({
                                name: GameData.fishData[id].name,
                                color: colorPalette[n],
                            })).concat([{ name: '其它', color: colorPalette[7] }]),
                            mapping: fish => {
                                const i = fishIdCat.indexOf(fish.fishId);
                                if (i != -1) return GameData.fishData[fish.fishId].name;
                                return '其它';
                            },
                        };
                    },
                    'rarity': () => {
                        const rarityCat = [
                            { name: '传奇', color: colorPalette[0] },
                            { name: '罕见', color: colorPalette[2] },
                            { name: '稀有', color: colorPalette[4] },
                            { name: '少见', color: colorPalette[3] },
                            { name: '常见', color: colorPalette[7] },
                        ];
                        return {
                            catagories: rarityCat,
                            mapping: fish => rarityCat[4 - GameData.fishData[fish.fishId].rarity].name,
                        };
                    },
                    'none': () => ({
                        catagories: [{ name: '', color: colorPalette[7] }],
                        mapping: _ => '',
                    }),
                };
            }

            /**
             * 构建溜鱼事件系列
             */
            function buildReelingEventSeries(colorPalette) {
                const events = Object.values(FishKeepHistory.events);
                return {
                    name: '',
                    type: 'scatter',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: events.map(item => [item.time, '遛鱼失败', item]),
                    symbol: 'triangle',
                    symbolSize: 12,
                    itemStyle: {
                        color: data => {
                            const type = data.data[2].outcome;
                            if (type == 'escaped') return '#74767A';
                            return colorPalette[1];
                        },
                        opacity: 0.8,
                        borderColor: '#fff',
                        borderWidth: 1
                    },
                    tooltip: { formatter: ChartTooltip.reelingEvent },
                    emphasis: { focus: 'series', itemStyle: { opacity: 0.8 } },
                    blur: { itemStyle: { opacity: 0.1 } },
                };
            }

            function buildTimeNoteSeries(minMs, maxMs) {
                const notes = FishKeepHistory.getNotes().filter(note => note.time >= minMs && note.time <= maxMs);
                if (!notes.length) return null;
                return {
                    name: '时间备注',
                    type: 'scatter',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: [],
                    tooltip: {
                        formatter: (param) => {
                            const note = param.data?.data ?? param.data;
                            if (!note) return '';
                            return `<div style="line-height:1.6;text-align:left;">
                                <div style="font-weight:700;color:#6d6e73;">${ui.escapeHtml(Utils.formatDate(note.time, 'DT'))}</div>
                                <div style="color:#6d6e73;font-weight:900;">${ui.escapeHtml(note.title)}</div>
                            </div>`;
                        }
                    },
                    markLine: {
                        symbol: ['none', 'none'],
                        silent: false,
                        lineStyle: { color: '#f59e0b', type: 'dashed', width: 1.5 },
                        emphasis: { lineStyle: { width: 2 } },
                        label: {
                            show: true,
                            formatter: '{b}',
                            color: '#b45309',
                            fontSize: 11,
                        },
                        data: notes.map(note => ({
                            name: note.title,
                            xAxis: note.time,
                            data: note,
                            tooltip: {
                                formatter: () => `<div style="line-height:1.6;text-align:left;">
                                    <div style="font-weight:700;color:#6d6e73;">${ui.escapeHtml(Utils.formatDate(note.time, 'DT'))}</div>
                                    <div style="color:#6d6e73;font-weight:900;">${ui.escapeHtml(note.title)}</div>
                                </div>`,
                            },
                        })),
                    },
                };
            }

            /**
             * 构建钓场区域 markArea（直接追加到 series 数组）
             */
            function buildRegionAreas(series, data) {
                let beginTime = new Date(0);
                let endTime = new Date(0);
                let regionId = null;
                let spotId = null;
                const addRegion = () => {
                    if (!regionId || endTime <= beginTime) return;
                    const getHash = (s) => {
                        let hash = 0;
                        if (s.length === 0) return hash;
                        for (let i = 0; i < s.length; i++) {
                            const chr = s.charCodeAt(i);
                            hash = ((hash << 5) - hash) + chr;
                            hash |= 0;
                        }
                        return (Math.abs(hash) % 32768) / 32768;
                    };
                    const region = GameData.regionData[regionId];
                    const abbr = region.abbr + (spotId ? '' : ' (船)');
                    const name = region.name + (spotId ? ` (岸钓: ${region.spots[spotId].name})` : ' (船钓)');
                    series.push({
                        name: '钓场',
                        type: 'scatter',
                        xAxisIndex: 1,
                        yAxisIndex: 1,
                        markArea: {
                            itemStyle: {
                                color: Utils.HSVtoRGB(getHash(regionId), 0.5, 1, 0.3).rgba,
                            },
                            data: [[
                                {
                                    name: abbr,
                                    xAxis: beginTime,
                                    data: {
                                        regionId, spotId, name,
                                        color: Utils.HSVtoRGB(getHash(regionId), 0.5, 1).rgb,
                                    }
                                },
                                { xAxis: endTime }
                            ]],
                            label: { show: true },
                            blur: { itemStyle: { opacity: 0.75 } },
                            animation: true,
                            tooltip: { formatter: ChartTooltip.regionArea },
                        },
                    });
                };
                data.sort((a, b) => a.caughtAt - b.caughtAt).forEach(fish => {
                    if (fish.regionId != regionId || fish.spotId != spotId) {
                        addRegion();
                        regionId = fish.regionId;
                        spotId = fish.spotId;
                        beginTime = fish.time;
                    }
                    endTime = fish.time;
                });
                addRegion();
            }

            // dim = 'price' | 'exp' | 'weight' | 'count'
            // type = 'bar' | 'line'
            // coloring = 'fishId' | 'score' | 'rarity' | 'none'
            function getChartOption(config) {
                const { dim, type, cum, coloring, showRegion, range, interval, fishSpeciesLimit, colorPalette } = config;
                const periodMs = Utils.msPerH * range;
                const intervalMs = Utils.msPerH * interval;

                // 1. 过滤并标准化数据
                const rawData = Object.values(FishKeepHistory.fish).filter(fish => {
                    return fish.caughtAt >= Utils.floorTo(Date.now() - periodMs - intervalMs, intervalMs);
                });
                const { data, minTime, maxTime, minWeight, maxWeight } = prepareChartData(rawData, intervalMs);
                const effectiveMinTime = Math.max(minTime, maxTime - periodMs);
                const xLabels = [];
                for (let i = effectiveMinTime; i <= maxTime; i += intervalMs) xLabels.push(i);

                // 2. 构建颜色映射和分类
                const coloringMapList = buildColoringMapList(coloring, colorPalette, rawData, fishSpeciesLimit);
                const coloringMap = coloringMapList[coloring]();
                const catagories = coloringMap.catagories;
                const fishIdMap = coloringMapList['fishId']();
                const yLabels = fishIdMap.catagories.map(c => c.name);

                // 3. 构建 X 轴数据（上方图表）
                const getXData = (filter) => {
                    const filteredData = data.filter(filter);
                    if (type == 'line') {
                        let xData = xLabels.concat([maxTime + intervalMs]).map(h => [
                            new Date(Math.min(h, Date.now())),
                            filteredData.filter(item => item.hour.getTime() == h - intervalMs)
                                .reduce((sum, item) => sum + item[dim], 0)
                        ]);
                        if (cum) {
                            for (let i = 1; i < xData.length; ++i) xData[i][1] += xData[i - 1][1];
                        }
                        return xData;
                    } else {
                        let xData = xLabels.map(h =>
                            filteredData.filter(item => item.hour.getTime() == h)
                                .reduce((sum, item) => sum + item[dim], 0)
                        );
                        if (cum) {
                            for (let i = 1; i < xData.length; ++i) xData[i] += xData[i - 1];
                        }
                        return xData;
                    }
                };
                const xData = {};
                catagories.forEach(({ name }) => {
                    xData[name] = getXData(item => coloringMap.mapping(item) == name);
                });

                // 4. 组装所有系列
                const series = [];

                // 上方：堆叠直方图/折线图
                catagories.forEach(({ name, color }, idx) => {
                    const lastCat = idx + 1 == catagories.length;
                    series.push({
                        name, type, stack: 'total',
                        xAxisIndex: 0, yAxisIndex: 0,
                        itemStyle: { color },
                        data: xData[name],
                        barWidth: '99%',
                        triggerEvent: true,
                        tooltip: {
                            formatter: (param) => {
                                const time = param.name;
                                const dataId = param.dataIndex;
                                let totalPrice = 0;
                                let content = '';
                                catagories.forEach(({ name, color }) => {
                                    const val = xData[name][dataId];
                                    totalPrice += val;
                                    if (Math.abs(val) < Utils.eps) return;
                                    content += `<div style="margin-top:5px;line-height:1;">
                                    <span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>
                                    <span style="font-size:14px;color:#6d6e73;font-weight:400;margin-left:2px;">${name}</span>
                                    <span style="float:right;margin-left:20px;font-size:14px;color:#6d6e73;font-weight:400">${Ui.getPriceIcon()}${Utils.formatNumber(val.toFixed(0))}</span>
                                    <div style="clear:both"></div>
                                </div>`;
                                });
                                totalPrice = Utils.formatNumber(totalPrice.toFixed(0));
                                return `<div style="margin: 0px 0 0;line-height:1;">
                                <div style="font-size:14px;color:#6d6e73;font-weight:400;line-height:1;">${time}</div>
                                <div style="margin: 10px 0 0;line-height:1;">
                                    ${content}
                                    <div style="margin-top:7px;line-height:1;">
                                        <span style="font-size:14px;color:#6d6e73;font-weight:900;">总计</span><span
                                            style="float:right;margin-left:20px;font-size:14px;color:#6d6e73;font-weight:900">${Ui.getPriceIcon()}${totalPrice}</span>
                                        <div style="clear:both"></div>
                                    </div>
                                    <div style="clear:both"></div>
                                </div>
                                <div style="clear:both"></div>
                            </div>`;
                            }
                        },
                        lineStyle: { width: lastCat ? 2 : 0 },
                        showSymbol: false,
                        areaStyle: {},
                    });
                });

                // 下方：精准时间散点图
                catagories.forEach(({ name, color }) => {
                    series.push({
                        name, type: 'scatter',
                        xAxisIndex: 1, yAxisIndex: 1,
                        data: data.filter(item => coloringMap.mapping(item) == name)
                            .map(item => [item.time, fishIdMap.mapping(item), item]),
                        symbolSize: data => Range.position({ min: minWeight, max: maxWeight }, data[2].weight) * 17 + 3,
                        itemStyle: { color, opacity: 0.8, borderColor: '#fff', borderWidth: 1 },
                        tooltip: { formatter: ChartTooltip.fishScatter },
                        emphasis: { focus: 'series', itemStyle: { opacity: 0.8 } },
                        blur: { itemStyle: { opacity: 0.1 } },
                    });
                });

                // 溜鱼事件
                series.push(buildReelingEventSeries(colorPalette));

                // 钓鱼地点
                if (showRegion) buildRegionAreas(series, data);

                const noteSeries = buildTimeNoteSeries(effectiveMinTime, maxTime + intervalMs);
                if (noteSeries) series.push(noteSeries);

                // 5. 组装 ECharts option
                const option = {
                    legend: {
                        show: true,
                        data: catagories.map(c => c.name),
                        top: 10,
                    },
                    tooltip: {
                        trigger: 'item',
                        axisPointer: {
                            type: 'cross',
                            link: [{ xAxisIndex: 'all' }],
                        }
                    },
                    grid: [{}, {}],
                    dataZoom: [
                        {
                            type: 'slider',
                            xAxisIndex: [1, 0],
                            start: 0, end: 100,
                            filterMode: 'none',
                            brushSelect: false,
                            showDataShadow: false,
                            labelFormatter: value => Utils.formatDate(value, 'dt'),
                        },
                        {
                            type: 'slider',
                            yAxisIndex: 0,
                            start: 0, end: 100,
                            filterMode: 'none',
                            brushSelect: false,
                            showDataShadow: false,
                            labelFormatter: value => Utils.formatNumber(value.toFixed(0)),
                        },
                        {
                            type: 'inside',
                            xAxisIndex: [1, 0],
                        }
                    ],
                    xAxis: [
                        type == 'line' ? {
                            type: 'time',
                            min: effectiveMinTime,
                            max: maxTime + intervalMs,
                            axisLabel: { show: false, color: '#666' },
                            splitLine: { show: true, lineStyle: { type: 'dashed' } }
                        } : {
                            type: 'category',
                            gridIndex: 0,
                            data: xLabels.map(label => Utils.formatTimeRange(label, label + intervalMs - 1000)),
                            boundaryGap: 1,
                            axisLabel: { show: false, color: '#666' },
                            splitLine: { show: true, lineStyle: { type: 'dashed' } }
                        },
                        {
                            type: 'time',
                            gridIndex: 1,
                            min: effectiveMinTime,
                            max: maxTime + intervalMs,
                            axisPointer: {
                                label: {
                                    formatter: param => Utils.formatDate(param.value, 'dt'),
                                }
                            },
                            splitLine: { show: true, lineStyle: { type: 'dashed' } }
                        }
                    ],
                    yAxis: [
                        {
                            type: 'value',
                            gridIndex: 0,
                            axisLine: { show: true },
                            splitLine: { show: true, lineStyle: { type: 'dashed' } }
                        },
                        {
                            type: 'category',
                            gridIndex: 1,
                            data: yLabels.concat(['遛鱼失败']),
                            inverse: true,
                            boundaryGap: 0,
                            splitLine: { show: true, lineStyle: { type: 'dashed' } }
                        }
                    ],
                    series: series,
                };
                return option;
            }

            function updateOption(option) {
                const w = chartDiv.clientWidth;
                const h = chartDiv.clientHeight;
                option.grid = [
                    { left: '13%', right: '9%', top: 50, bottom: h / 2 + 32.5 },
                    { left: '13%', right: '9%', top: h / 2 + 12.5, bottom: 70 },
                ]
                option.dataZoom[0].top = h - 44;
                option.dataZoom[0].height = 24;
                option.dataZoom[1].top = option.grid[0].top;
                option.dataZoom[1].height = (h - option.grid[0].bottom) - option.grid[0].top + 2;
                option.dataZoom[1].left = '93%';
                option.dataZoom[1].width = 24;
                chart.setOption(option);
            }

            function construct() {
                const settingsDiv = Ui.div({ style: 'display: flex; gap: 5px; padding: 10px;' });

                const refresh = (redraw = true) => {
                    if (!chart || !config) return;
                    if (redraw) chart.clear();
                    const option = getChartOption(config);
                    updateOption(option);
                }
                ui.refreshHistoryOverview = refresh;

                const timeRangeSelect = Ui.select({
                    options: {
                        '24h': 24,
                        '48h': 48,
                        '7d': 24 * 7,
                        '全部': 1e9,
                    },
                    default: '24h',
                    onchange: (value) => {
                        config.range = value;
                        refresh();
                    },
                }, { style: 'width:auto' });
                settingsDiv.appendChild(timeRangeSelect);

                const typeSelect = Ui.select({
                    options: {
                        '柱状图': { type: 'bar', cum: false },
                        '折线图': { type: 'line', cum: false },
                        '折线图（累计）': { type: 'line', cum: true },
                    },
                    default: '柱状图',
                    onchange: (value) => {
                        config.type = value.type;
                        config.cum = value.cum;
                        refresh(false);
                    },
                }, { style: 'width:auto' });
                settingsDiv.appendChild(typeSelect);

                const valueSelect = Ui.select({
                    options: {
                        '价格': 'price',
                        '经验': 'exp',
                        '重量': 'weight',
                        '总数': 'count',
                    },
                    default: '价格',
                    onchange: (value) => {
                        config.dim = value;
                        refresh(false);
                    },
                }, { style: 'width:auto' });
                settingsDiv.appendChild(valueSelect);

                const colorSelect = Ui.select({
                    options: {
                        '评级': 'score',
                        '鱼种': 'fishId',
                        '稀有度': 'rarity',
                        '无': 'none',
                    },
                    default: '评级',
                    onchange: (value) => {
                        config.coloring = value;
                        refresh();
                    },
                }, { style: 'width:auto' });
                settingsDiv.appendChild(colorSelect);

                const colorCheck = Ui.checkCard({
                    textContent: '显示钓场',
                    checked: true,
                    onchange: (checked) => {
                        config.showRegion = checked;
                        refresh();
                    }
                });
                settingsDiv.appendChild(colorCheck);

                settingsDiv.appendChild(Ui.div({ style: 'flex: 1;' }));

                const refreshBtn = Ui.button('刷新');
                refreshBtn.onclick = () => {
                    refresh();
                }
                settingsDiv.appendChild(refreshBtn);

                chartDiv = Ui.div({ style: `width: 100%; height: 100%;` });
                const div = Ui.div({
                    style: `display: flex; flex-direction: column; height: 100%;`
                }, [
                    settingsDiv,
                    chartDiv,
                ]);
                return div;
            }

            function onInit() {
                config = {
                    dim: 'price',
                    type: 'bar',
                    cum: false,
                    coloring: 'score',
                    showRegion: true,
                    range: 24,
                    interval: 1,
                    fishSpeciesLimit: 7,
                    colorPalette: COLOR_PALETTE,
                }

                ensureEcharts().then(() => {
                    chart = echarts.init(chartDiv);
                    const option = getChartOption(config);
                    updateOption(option);
                }).catch(e => console.warn(e));
            }

            function onResize() {
                if (!chart || !chartDiv) return;
                const option = chart.getOption();
                updateOption(option);
                chart.resize();
            }

            return {
                content: construct(),
                onInit: onInit,
                onResize: onResize,
            }
        }

        timestampNotePanel() {
            const ui = this;
            let editingId = null;
            let timeInput = null;
            let titleInput = null;
            let contentInput = null;
            let tbody = null;
            let editHint = null;

            function resetForm() {
                editingId = null;
                timeInput.value = ui.toDatetimeLocalValue(Date.now());
                titleInput.value = '';
                contentInput.value = '';
                editHint.textContent = '新增备注';
            }

            function fillForm(note) {
                editingId = note.id;
                timeInput.value = ui.toDatetimeLocalValue(note.time);
                titleInput.value = note.title ?? '';
                contentInput.value = note.content ?? '';
                editHint.textContent = `编辑：${note.title || '未命名备注'}`;
            }

            function refreshList() {
                if (!tbody) return;
                tbody.innerHTML = '';
                const notes = FishKeepHistory.getNotes();
                if (!notes.length) {
                    const tr = document.createElement('tr');
                    const td = document.createElement('td');
                    td.colSpan = 4;
                    td.textContent = '暂无时间备注';
                    td.style.cssText = 'padding:12px;color:#64748b;text-align:center;';
                    tr.appendChild(td);
                    tbody.appendChild(tr);
                    return;
                }
                notes.forEach(note => {
                    const tr = document.createElement('tr');
                    const timeTd = document.createElement('td');
                    timeTd.textContent = Utils.formatDate(note.time, 'DT');
                    const titleTd = document.createElement('td');
                    titleTd.textContent = note.title;
                    const contentTd = document.createElement('td');
                    contentTd.textContent = note.content;
                    const actionTd = document.createElement('td');
                    actionTd.style.cssText = 'display:flex;gap:6px;white-space:nowrap;';

                    const editBtn = Ui.button('编辑');
                    editBtn.onclick = () => fillForm(note);
                    const deleteBtn = Ui.button('删除');
                    deleteBtn.onclick = () => {
                        if (!confirm(`删除备注「${note.title}」？`)) return;
                        FishKeepHistory.deleteNote(note.id);
                        if (editingId === note.id) resetForm();
                        refreshList();
                        ui.refreshHistoryOverview?.();
                    };
                    actionTd.appendChild(editBtn);
                    actionTd.appendChild(deleteBtn);

                    [timeTd, titleTd, contentTd, actionTd].forEach(td => {
                        td.style.cssText += 'padding:7px 10px;border-bottom:1px solid #eef2f7;vertical-align:top;';
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
            }

            function saveNoteFromForm() {
                const time = ui.parseDatetimeLocalValue(timeInput.value);
                if (time === null) {
                    alert('请填写有效时间');
                    return;
                }
                const title = titleInput.value.trim();
                if (!title) {
                    alert('请填写标题');
                    return;
                }
                FishKeepHistory.upsertNote({
                    id: editingId,
                    time,
                    title,
                    content: contentInput.value,
                });
                resetForm();
                refreshList();
                ui.refreshHistoryOverview?.();
            }

            function construct() {
                const root = Ui.div({ style: 'height:100%;display:flex;flex-direction:column;gap:10px;padding:10px;overflow:hidden;' });
                const form = Ui.div({ style: 'display:grid;grid-template-columns:160px minmax(180px,1fr) auto auto;gap:8px;align-items:center;' });
                editHint = Ui.div({ style: 'font-weight:700;color:#334155;', textContent: '新增备注' });
                timeInput = Ui.elem('input', { type: 'datetime-local', className: 'lll_input', style: 'width:100%;' });
                titleInput = Ui.elem('input', { type: 'text', className: 'lll_input', placeholder: '标题', style: 'width:100%;' });
                const saveBtn = Ui.button('保存备注');
                saveBtn.onclick = saveNoteFromForm;
                const newBtn = Ui.button('新建');
                newBtn.onclick = resetForm;
                form.appendChild(editHint);
                form.appendChild(timeInput);
                form.appendChild(titleInput);
                form.appendChild(saveBtn);
                form.appendChild(Ui.div({ style: 'grid-column:1 / 2;color:#64748b;font-size:12px;', textContent: '内容' }));
                contentInput = Ui.elem('textarea', {
                    className: 'lll_input',
                    placeholder: '备注内容，可留空',
                    style: 'grid-column:2 / 4;width:100%;height:72px;resize:vertical;',
                });
                form.appendChild(contentInput);
                form.appendChild(newBtn);
                root.appendChild(form);

                const tableWrap = Ui.div({ style: 'flex:1;overflow:auto;border:1px solid #e2e8f0;border-radius:8px;background:#fff;' });
                const table = Ui.elem('table', { style: 'width:100%;border-collapse:collapse;font-size:13px;color:#334155;' });
                table.innerHTML = '<thead><tr><th>时间</th><th>标题</th><th>内容</th><th>操作</th></tr></thead><tbody></tbody>';
                table.querySelectorAll('th').forEach(th => {
                    th.style.cssText = 'position:sticky;top:0;background:#f8fafc;padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:left;z-index:1;';
                });
                tbody = table.querySelector('tbody');
                tableWrap.appendChild(table);
                root.appendChild(tableWrap);

                resetForm();
                refreshList();
                return root;
            }

            return {
                content: construct(),
                onShow: refreshList,
            };
        }

        earningsPanel() {
            let priceChart = null;
            let expChart = null;
            let priceChartDiv = null;
            let expChartDiv = null;
            let summaryDiv = null;
            let rangeSelect = null;
            let startInput = null;
            let endInput = null;
            let config = null;
            let syncingInputs = false;
            let chartAnimating = false;
            const CHART_ANIM_MS = 750;

            function floorToHour(ms) {
                return Utils.floorTo(ms, Utils.msPerH);
            }

            function toDatetimeLocalValue(ms) {
                const t = new Date(floorToHour(ms));
                const y = t.getFullYear();
                const M = String(t.getMonth() + 1).padStart(2, '0');
                const d = String(t.getDate()).padStart(2, '0');
                const h = String(t.getHours()).padStart(2, '0');
                return `${y}-${M}-${d}T${h}:00`;
            }

            function parseDatetimeLocalValue(value) {
                if (!value) return null;
                return floorToHour(new Date(value).getTime());
            }

            function getFishTimeBounds() {
                const times = Object.values(FishKeepHistory.fish).map(f => f.caughtAt);
                if (times.length === 0) return { minMs: Date.now() - 24 * Utils.msPerH, maxMs: Date.now() };
                return { minMs: Math.min(...times), maxMs: Math.max(...times) };
            }

            function applyPresetToInputs(hours) {
                syncingInputs = true;
                const now = floorToHour(Date.now());
                const { minMs } = getFishTimeBounds();
                if (hours >= 1e8) {
                    startInput.value = toDatetimeLocalValue(minMs);
                    endInput.value = toDatetimeLocalValue(now);
                } else {
                    startInput.value = toDatetimeLocalValue(now - hours * Utils.msPerH);
                    endInput.value = toDatetimeLocalValue(now);
                }
                syncingInputs = false;
            }

            function getRangeBounds() {
                const startMs = parseDatetimeLocalValue(startInput?.value);
                const endMs = parseDatetimeLocalValue(endInput?.value);
                if (startMs === null || endMs === null) return null;
                return {
                    startMs,
                    endMs: endMs + Utils.msPerH,
                    durationHours: Math.max((endMs + Utils.msPerH - startMs) / Utils.msPerH, 1),
                };
            }

            function formatRangeLabel(bounds) {
                if (!bounds) return '区间无效';
                const endLabel = bounds.endMs - Utils.msPerH;
                return `${Utils.formatDate(bounds.startMs, 'Dt')} ~ ${Utils.formatDate(endLabel, 'Dt')}`;
            }

            function aggregateByBounds(bounds) {
                const categories = getScoreCategories();
                const buckets = Object.fromEntries(
                    categories.map(c => [c.name, { price: 0, exp: 0, count: 0 }])
                );
                let totalPrice = 0, totalExp = 0, totalCount = 0;
                Object.values(FishKeepHistory.fish).forEach(fish => {
                    if (fish.caughtAt < bounds.startMs || fish.caughtAt >= bounds.endMs) return;
                    const name = categories[4 - Utils.scoreToRarity(fish.score)].name;
                    const price = FishKeepHistory.computePrice(fish) ?? 0;
                    const exp = FishKeepHistory.computeExp(fish) ?? 0;
                    buckets[name].price += price;
                    buckets[name].exp += exp;
                    buckets[name].count += 1;
                    totalPrice += price;
                    totalExp += exp;
                    totalCount += 1;
                });
                return { categories, buckets, totalPrice, totalExp, totalCount };
            }

            const CHART_SHIFT_PX = 30;

            function shiftedPct(ratio, chartHeight) {
                const h = chartHeight || 300;
                return `${((ratio * h + CHART_SHIFT_PX) / h * 100).toFixed(2)}%`;
            }

            function buildDonutOption(kind, agg, bounds, chartHeight) {
                const h = chartHeight || 300;
                const { categories, buckets } = agg;
                const field = kind === 'price' ? 'price' : 'exp';
                const total = kind === 'price' ? agg.totalPrice : agg.totalExp;
                const title = kind === 'price' ? '金币收益' : '经验收益';
                const labelMinPercent = 5;
                const seriesData = categories.map(c => {
                    const value = buckets[c.name][field];
                    const percent = total > Utils.eps ? value / total * 100 : 0;
                    const showLabel = percent >= labelMinPercent;
                    return {
                        name: c.name,
                        value,
                        itemStyle: { color: c.color },
                        label: { show: showLabel },
                        labelLine: { show: showLabel },
                    };
                }).filter(d => d.value > Utils.eps);

                const option = {
                    animation: true,
                    animationDuration: CHART_ANIM_MS,
                    animationEasing: 'cubicOut',
                    title: {
                        text: title,
                        left: 'center',
                        top: 6 + CHART_SHIFT_PX,
                        textStyle: { fontSize: 14, fontWeight: 'bold' },
                    },
                    tooltip: {
                        trigger: 'item',
                        formatter: (param) => {
                            const b = buckets[param.name];
                            const val = kind === 'price'
                                ? `${Ui.getPriceIcon()}${Utils.formatNumber(param.value.toFixed(0))}`
                                : `${param.value.toFixed(1)} EXP`;
                            return `${param.marker}${param.name}<br/>${val} (${param.percent.toFixed(1)}%)<br/>${b.count} 条`;
                        },
                    },
                    legend: {
                        orient: 'horizontal',
                        bottom: 44,
                        itemGap: 10,
                        textStyle: { fontSize: 11 },
                        data: categories.map(c => c.name),
                    },
                    series: [{
                        type: 'pie',
                        radius: ['36%', '58%'],
                        center: ['50%', h * 0.41 + CHART_SHIFT_PX],
                        minShowLabelAngle: 18,
                        avoidLabelOverlap: true,
                        labelLayout: { hideOverlap: true },
                        animation: true,
                        animationType: 'expansion',
                        animationEasing: 'cubicOut',
                        animationDuration: CHART_ANIM_MS,
                        animationDelay: (idx) => idx * 80,
                        data: seriesData,
                        label: {
                            position: 'outer',
                            alignTo: 'labelLine',
                            edgeDistance: 10,
                            bleedMargin: 8,
                            fontSize: 11,
                            formatter: (p) => `${p.name}\n${p.percent.toFixed(0)}%`,
                        },
                        labelLine: {
                            length: 10,
                            length2: 8,
                            smooth: 0.15,
                            lineStyle: { width: 1 },
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: 12,
                                fontWeight: 'bold',
                            },
                            labelLine: { show: true },
                        },
                    }],
                };

                if (total > Utils.eps) {
                    const avg = total / bounds.durationHours;
                    const avgText = kind === 'price'
                        ? `时均：${Utils.formatNumber(avg.toFixed(0))}`
                        : `时均：${avg.toFixed(1)}`;
                    option.graphic = [
                        {
                            type: 'text',
                            left: 'center',
                            top: shiftedPct(0.33, h),
                            style: {
                                text: kind === 'price'
                                    ? Utils.formatNumber(Math.round(total).toString())
                                    : Math.round(total).toString(),
                                fontSize: 18,
                                fontWeight: 'bold',
                                fill: '#555',
                                textAlign: 'center',
                            },
                        },
                        {
                            type: 'text',
                            left: 'center',
                            top: shiftedPct(0.40, h),
                            style: {
                                text: avgText,
                                fontSize: 12,
                                fill: '#999',
                                textAlign: 'center',
                            },
                        },
                        {
                            type: 'text',
                            left: 'center',
                            top: shiftedPct(0.47, h),
                            style: {
                                text: kind === 'price' ? '金币' : 'EXP',
                                fontSize: 12,
                                fill: '#999',
                                textAlign: 'center',
                            },
                        },
                    ];
                } else {
                    option.graphic = [{
                        type: 'text',
                        left: 'center',
                        top: shiftedPct(0.50, h),
                        style: {
                            text: '暂无渔获',
                            fontSize: 14,
                            fill: '#aaa',
                            textAlign: 'center',
                        },
                    }];
                }
                return option;
            }

            function updateSummary(bounds, agg) {
                const rangeText = formatRangeLabel(bounds);
                const priceText = Utils.formatNumber(Math.round(agg.totalPrice).toString());
                const expText = Math.round(agg.totalExp).toString();
                summaryDiv.textContent =
                    `统计区间：${rangeText} · 共 ${agg.totalCount} 条 · ` +
                    `金币 ${priceText} · 经验 ${expText} EXP`;
            }

            function updateSummaryError(message) {
                summaryDiv.textContent = message;
            }

            function updateInputLimits() {
                if (!startInput || !endInput) return;
                const now = floorToHour(Date.now());
                const { minMs } = getFishTimeBounds();
                const minValue = toDatetimeLocalValue(minMs);
                const maxValue = toDatetimeLocalValue(now);
                startInput.min = minValue;
                startInput.max = maxValue;
                endInput.min = minValue;
                endInput.max = maxValue;
            }

            function onRangeInputChange() {
                if (syncingInputs) return;
                refresh();
            }

            const chartLoadingOpt = {
                text: '加载中',
                color: '#5470c6',
                textColor: '#666',
                maskColor: 'rgba(255, 255, 255, 0.85)',
                fontSize: 13,
                spinnerRadius: 10,
                lineWidth: 3,
            };

            function showChartsLoading() {
                priceChart?.showLoading(chartLoadingOpt);
                expChart?.showLoading(chartLoadingOpt);
            }

            function hideChartsLoading() {
                priceChart?.hideLoading();
                expChart?.hideLoading();
            }

            function renderCharts(bounds, agg, animate = false) {
                updateSummary(bounds, agg);
                const priceOpt = buildDonutOption('price', agg, bounds, priceChartDiv.clientHeight);
                const expOpt = buildDonutOption('exp', agg, bounds, expChartDiv.clientHeight);
                if (animate) {
                    chartAnimating = true;
                    priceChart.resize();
                    expChart.resize();
                    priceChart.clear();
                    expChart.clear();
                    setTimeout(() => { chartAnimating = false; }, CHART_ANIM_MS + 200);
                }
                priceChart.setOption(priceOpt, { notMerge: true, lazyUpdate: false });
                expChart.setOption(expOpt, { notMerge: true, lazyUpdate: false });
            }

            function refresh(withLoading = false) {
                updateInputLimits();
                const bounds = getRangeBounds();
                if (!bounds) {
                    updateSummaryError('请选择有效的开始与结束时间');
                    hideChartsLoading();
                    return;
                }
                if (bounds.startMs >= bounds.endMs) {
                    updateSummaryError('开始时间必须早于结束时间');
                    hideChartsLoading();
                    return;
                }
                const doRender = () => {
                    const agg = aggregateByBounds(bounds);
                    renderCharts(bounds, agg, withLoading);
                    if (withLoading) {
                        setTimeout(hideChartsLoading, 120);
                    }
                };
                if (withLoading && priceChart) {
                    showChartsLoading();
                    requestAnimationFrame(doRender);
                } else {
                    doRender();
                }
            }

            function construct() {
                const inputStyle = 'width: 168px; font-size: 13px;';

                const settingsDiv = Ui.div({
                    style: 'display: flex; flex-wrap: nowrap; gap: 8px; align-items: center; padding: 8px; overflow: hidden;',
                });

                rangeSelect = Ui.select({
                    options: {
                        '12 小时': { hours: 12 },
                        '24 小时': { hours: 24 },
                        '48 小时': { hours: 48 },
                        '全部': { hours: 1e9 },
                    },
                    default: '12 小时',
                    onchange: (value) => {
                        config.rangeHours = value.hours;
                        applyPresetToInputs(value.hours);
                        refresh();
                    },
                }, { className: 'lll_input_select', style: 'width: auto; min-width: 88px; flex-shrink: 0;' });
                settingsDiv.appendChild(rangeSelect);

                startInput = Ui.elem('input', {
                    className: 'lll_input',
                    type: 'datetime-local',
                    step: '3600',
                    style: inputStyle,
                });
                startInput.onchange = onRangeInputChange;
                settingsDiv.appendChild(startInput);

                settingsDiv.appendChild(Ui.div({
                    style: 'color: #888; flex-shrink: 0;',
                    textContent: '~',
                }));

                endInput = Ui.elem('input', {
                    className: 'lll_input',
                    type: 'datetime-local',
                    step: '3600',
                    style: inputStyle,
                });
                endInput.onchange = onRangeInputChange;
                settingsDiv.appendChild(endInput);

                settingsDiv.appendChild(Ui.div({ style: 'flex: 1; min-width: 8px;' }));

                const refreshBtn = Ui.button('刷新');
                refreshBtn.onclick = () => refresh();
                settingsDiv.appendChild(refreshBtn);

                summaryDiv = Ui.div({
                    style: 'padding: 0 8px 6px; font-size: 13px; color: #666; line-height: 1.5;',
                });

                priceChartDiv = Ui.div({ style: 'flex: 1; height: 100%; min-width: 0;' });
                expChartDiv = Ui.div({ style: 'flex: 1; height: 100%; min-width: 0;' });

                const chartsRow = Ui.div({
                    style: 'display: flex; flex: 1; min-height: 0; gap: 8px; padding: 0 8px 8px;',
                }, [priceChartDiv, expChartDiv]);

                return Ui.div({
                    style: 'display: flex; flex-direction: column; height: 100%;',
                }, [settingsDiv, summaryDiv, chartsRow]);
            }

            function onInit() {
                config = { rangeHours: 12 };
                applyPresetToInputs(12);
                ensureEcharts().then(() => {
                    priceChart = echarts.init(priceChartDiv);
                    expChart = echarts.init(expChartDiv);
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => refresh(true));
                    });
                    const observer = new ResizeObserver(() => {
                        requestAnimationFrame(() => {
                            if (chartAnimating) return;
                            priceChart?.resize();
                            expChart?.resize();
                        });
                    });
                    observer.observe(priceChartDiv);
                    observer.observe(expChartDiv);
                }).catch(e => console.warn(e));
            }

            function onResize() {
                if (chartAnimating) return;
                priceChart?.resize();
                expChart?.resize();
            }

            function onShow() {
                refresh(true);
            }

            return {
                content: construct(),
                onInit: onInit,
                onResize: onResize,
                onShow: onShow,
            };
        }

        recordPanel() {
            let tableBody = null;
            const filters = { name: '', region: '', groupBy: '种类' };
            const groupByOptions = ['无', '地点', '评级', '种类', '时间'];
            const collapsedGroups = new Set();

            function escHtml(text) {
                return String(text)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
            }

            function getFishRows() {
                return Object.values(FishKeepHistory.fish)
                    .map(fish => {
                        const fishData = GameData.fishData[fish.fishId] ?? {};
                        const regionData = GameData.regionData[fish.regionId] ?? {};
                        const score = Number(fish.score ?? 0);
                        return {
                            time: fish.caughtAt,
                            date: Utils.formatDate(fish.caughtAt, 'D'),
                            fishId: fish.fishId,
                            name: fishData.name ?? fish.fishId ?? '未知鱼种',
                            price: FishKeepHistory.computePrice(fish),
                            exp: FishKeepHistory.computeExp(fish),
                            weight: fish.weight,
                            size: fish.size,
                            regionAbbr: regionData.abbr ?? regionData.name ?? fish.regionId ?? '',
                            score,
                            rating: ['不达标', '达标', '稀有', '罕见', '传说'][Utils.scoreToRarity(score)] ?? '宝宝',
                        };
                    })
                    .filter(row => !filters.name || row.name.includes(filters.name))
                    .filter(row => !filters.region || row.regionAbbr.includes(filters.region))
                    .sort((a, b) => b.time - a.time);
            }

            function groupKey(row) {
                if (filters.groupBy === '地点') return row.regionAbbr || '未知地点';
                if (filters.groupBy === '评级') return row.rating;
                if (filters.groupBy === '时间') return row.date;
                if (filters.groupBy === '种类') return row.name;
                return null;
            }

            function rowHtml(row) {
                return `
                    <tr>
                        <td>${Utils.formatDate(row.time, 'dt')}</td>
                        <td>${row.name}</td>
                        <td>${row.price != null ? row.price.toFixed(0) : ''}</td>
                        <td>${row.exp != null ? row.exp.toFixed(1) : ''}</td>
                        <td>${Utils.formatWeight(row.weight)}</td>
                        <td>${Number(row.size ?? 0).toFixed(1)}cm</td>
                        <td>${row.regionAbbr}</td>
                        <td>${row.score.toFixed(2)}%</td>
                    </tr>`;
            }

            function groupHeaderHtml(key, count, collapsed) {
                const icon = collapsed ? '▸' : '▾';
                return `
                    <tr class="lf-record-group" data-group-key="${encodeURIComponent(key)}" title="点击展开/收起">
                        <td colspan="8">
                            <span class="lf-record-group-toggle">${icon}</span>
                            <span class="lf-record-group-name">${escHtml(key)}</span>
                            <span class="lf-record-group-count">${count}</span>
                        </td>
                    </tr>`;
            }

            function refresh() {
                if (!tableBody) return;
                const rows = getFishRows();
                if (filters.groupBy === '无') {
                    tableBody.innerHTML = rows.map(rowHtml).join('');
                    return;
                }

                const groups = new Map();
                rows.forEach(row => {
                    const key = groupKey(row);
                    if (!groups.has(key)) groups.set(key, []);
                    groups.get(key).push(row);
                });
                tableBody.innerHTML = Array.from(groups.entries()).map(([key, items]) => {
                    const collapsed = collapsedGroups.has(key);
                    return `
                        ${groupHeaderHtml(key, items.length, collapsed)}
                        ${collapsed ? '' : items.map(rowHtml).join('')}
                    `;
                }).join('');
            }

            function construct() {
                const wrapper = Ui.div({ style: 'display:flex;flex-direction:column;height:100%;' });
                const controls = Ui.div({ style: 'display:flex;gap:8px;align-items:center;padding:10px;flex-wrap:wrap;' });

                controls.appendChild(Ui.elem('span', { textContent: '分组' }));
                const groupSelect = Ui.elem('select', { className: 'lll_input_select', style: 'width:auto;' });
                groupByOptions.forEach(optionText => {
                    const option = new Option(optionText, optionText);
                    if (optionText === filters.groupBy) option.selected = true;
                    groupSelect.options.add(option);
                });
                groupSelect.onchange = () => {
                    filters.groupBy = groupSelect.value;
                    collapsedGroups.clear();
                    refresh();
                };
                controls.appendChild(groupSelect);

                const nameInput = Ui.elem('input', { className: 'lll_input', placeholder: '鱼种筛选', style: 'width:120px;' });
                nameInput.oninput = () => {
                    filters.name = nameInput.value.trim();
                    refresh();
                };
                controls.appendChild(nameInput);

                const regionInput = Ui.elem('input', { className: 'lll_input', placeholder: '地点筛选', style: 'width:120px;' });
                regionInput.oninput = () => {
                    filters.region = regionInput.value.trim();
                    refresh();
                };
                controls.appendChild(regionInput);

                const refreshBtn = Ui.button('刷新');
                refreshBtn.onclick = refresh;
                controls.appendChild(refreshBtn);
                wrapper.appendChild(controls);

                const tableWrap = Ui.div({ className: 'lf-record-panel', style: 'margin:0 10px 10px;overflow:auto;flex:1;border:1px solid #e2e8f0;border-radius:8px;background:#fff;' });
                tableWrap.innerHTML = `
                    <style>
                        .lf-record-panel .lf-record-table { width:100%; border-collapse:collapse; font-size:13px; color:#334155; background:#fff; }
                        .lf-record-panel .lf-record-table th,
                        .lf-record-panel .lf-record-table td { padding:7px 10px; border-bottom:1px solid #eef2f7; text-align:left; white-space:nowrap; }
                        .lf-record-panel .lf-record-table th { position:sticky; top:0; background:#f8fafc; color:#475569; font-weight:600; z-index:1; box-shadow:0 1px 0 #e2e8f0; }
                        .lf-record-panel .lf-record-table tbody tr:not(.lf-record-group):hover td { background:#f8fafc; }
                        .lf-record-panel .lf-record-group td {
                            background:#f1f5f9;
                            color:#334155;
                            font-weight:600;
                            cursor:pointer;
                            user-select:none;
                        }
                        .lf-record-panel .lf-record-group:hover td { background:#e8eef5; }
                        .lf-record-panel .lf-record-group-toggle { display:inline-block; width:1.1em; color:#64748b; }
                        .lf-record-panel .lf-record-group-name { margin-left:2px; }
                        .lf-record-panel .lf-record-group-count {
                            margin-left:8px;
                            padding:1px 7px;
                            border-radius:999px;
                            background:#e2e8f0;
                            color:#64748b;
                            font-size:12px;
                            font-weight:500;
                        }
                    </style>
                    <table class="lf-record-table">
                        <thead><tr><th>时间</th><th>种类</th><th>价格</th><th>经验</th><th>重量</th><th>体长</th><th>地点</th><th>评分</th></tr></thead>
                        <tbody></tbody>
                    </table>`;
                tableBody = tableWrap.querySelector('tbody');
                tableBody.addEventListener('click', (event) => {
                    const groupRow = event.target.closest('tr.lf-record-group');
                    if (!groupRow || !tableBody.contains(groupRow)) return;
                    const key = decodeURIComponent(groupRow.dataset.groupKey ?? '');
                    if (!key) return;
                    if (collapsedGroups.has(key)) collapsedGroups.delete(key);
                    else collapsedGroups.add(key);
                    refresh();
                });
                wrapper.appendChild(tableWrap);
                refresh();
                return wrapper;
            }

            return {
                content: construct(),
                onShow: refresh,
            };
        }

        statPanel() {
            let summaryDiv = null;
            let tablesDiv = null;
            let offsetTitleEl = null;
            const histChart = { chart: null, div: null };
            const curChart = { chart: null, div: null };

            function buildHistoryOption() {
                const rawData = Object.values(FishKeepHistory.fish).sort((a, b) => a.caughtAt - b.caughtAt);
                const data = [];
                rawData.forEach(fish => {
                    if (Rarity.isLimit(fish.score)) return;
                    const q = Utils.phiInv(fish.score / 100);
                    if (!Number.isFinite(q)) return;
                    data.push({
                        time: new Date(fish.caughtAt),
                        fishId: fish.fishId,
                        regionId: fish.regionId,
                        score: fish.score / 100,
                        q,
                    });
                });

                const range = 100;
                let sum = 0, tot = 0;
                const points = [];
                for (let i = 0, offset = 0; i < data.length; ++i) {
                    sum += data[i].q; ++tot;
                    if (i < range) continue;
                    sum -= data[i - range].q; --tot;
                    const cur = sum / tot;
                    if (i === range) offset = cur;
                    offset += (cur - offset) * 0.1;
                    points.push([data[i].time, offset, data[i]]);
                }

                return {
                    tooltip: {
                        trigger: 'axis',
                        formatter: param => {
                            if (!param || param.length < 1) return '';
                            const d = param[0].data[2];
                            const y = param[0].data[1].toFixed(3);
                            const region = GameData.regionData[d.regionId];
                            const name = region ? region.name : (d.regionId ?? '未知钓场');
                            const time = Utils.formatDate(d.time, 'DT');
                            return `<div style="line-height:1.6;text-align:left;">
                                <div style="font-weight:700;color:#6d6e73;">${time}</div>
                                <div style="color:#6d6e73;">${name}</div>
                                <div style="color:#6d6e73;font-weight:900;">评级偏移: ${y}</div>
                            </div>`;
                        },
                    },
                    grid: [{ top: 20, bottom: 55, left: 45, right: 20 }],
                    dataZoom: [
                        {
                            type: 'slider', xAxisIndex: 0, start: 0, end: 100,
                            height: 20, bottom: 8, filterMode: 'none',
                            brushSelect: false, showDataShadow: false,
                            labelFormatter: v => Utils.formatDate(v, 'd'),
                        },
                        { type: 'inside', xAxisIndex: 0 },
                    ],
                    xAxis: [{ type: 'time', gridIndex: 0, splitLine: { show: true, lineStyle: { type: 'dashed' } } }],
                    yAxis: [{ type: 'value', gridIndex: 0, splitLine: { show: true, lineStyle: { type: 'dashed' } } }],
                    series: [{
                        name: '', type: 'line', xAxisIndex: 0, yAxisIndex: 0,
                        data: points, showSymbol: false,
                        lineStyle: { color: '#6c81ae', width: 2 }, smooth: true,
                    }],
                };
            }

            function buildCurrentOption(computed) {
                if (!computed) return null;
                const { rerollCount, offset } = computed;
                const scoreList = ScoreOffsetCalc.sortedScoreList ?? [];
                const line = [];
                const step = 400;
                for (let i = 1; i < step; i += 1) {
                    const x = i / step;
                    const y = Utils.phi(Utils.phiInv(Math.pow(x, 1 / rerollCount)) + offset);
                    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
                    line.push([x, y]);
                }
                return {
                    grid: [{ top: 20, bottom: 30, left: 42, right: 20 }],
                    xAxis: [{ type: 'value', min: 0, max: 1, gridIndex: 0, splitLine: { show: true, lineStyle: { type: 'dashed' } } }],
                    yAxis: [{
                        name: '评分(%)', type: 'value', min: 0, max: 1, gridIndex: 0,
                        axisLabel: { formatter: v => `${v * 100}` },
                        splitLine: { show: true, lineStyle: { type: 'dashed' } },
                    }],
                    series: [
                        {
                            type: 'scatter', xAxisIndex: 0, yAxisIndex: 0, data: scoreList, symbolSize: 3,
                            itemStyle: { color: '#6c81ae', opacity: 0.8, borderColor: '#fff', borderWidth: 0.1 },
                        },
                        {
                            type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: line, showSymbol: false,
                            lineStyle: { color: '#f09621', width: 2 }, smooth: true,
                        },
                    ],
                };
            }

            function renderCharts() {
                let computed = null;
                try {
                    computed = ScoreOffsetCalc.compute(Object.values(FishKeepHistory.fish));
                } catch (error) {
                    console.warn('[LazyFisher] 评级偏移计算失败', error);
                }
                if (offsetTitleEl) {
                    offsetTitleEl.textContent = computed
                        ? `评级偏移: ${computed.offset.toFixed(3)}${computed.rerollCount > 1 ? '（重掷）' : ''}`
                        : '评级偏移: 数据不足或计算失败';
                }
                if (histChart.chart) {
                    try {
                        histChart.chart.setOption(buildHistoryOption(), true);
                    } catch (error) {
                        console.warn('[LazyFisher] 历史偏移图表渲染失败', error);
                    }
                }
                if (curChart.chart) {
                    try {
                        const opt = buildCurrentOption(computed);
                        curChart.chart.setOption(opt ?? {
                            graphic: { type: 'text', left: 'center', top: 'middle', style: { text: '样本不足，暂无法计算', fill: '#999', fontSize: 13 } },
                        }, true);
                    } catch (error) {
                        console.warn('[LazyFisher] 当前偏移图表渲染失败', error);
                        curChart.chart.setOption({
                            graphic: { type: 'text', left: 'center', top: 'middle', style: { text: '评级偏移渲染失败，请刷新或等待更多样本', fill: '#999', fontSize: 13 } },
                        }, true);
                    }
                }
            }

            function getRows() {
                return Object.values(FishKeepHistory.fish)
                    .map(fish => {
                        const fishData = GameData.fishData[fish.fishId] ?? {};
                        const regionData = GameData.regionData[fish.regionId] ?? {};
                        return {
                            fishId: fish.fishId,
                            name: fishData.name ?? fish.fishId ?? '未知鱼种',
                            region: regionData.abbr ?? regionData.name ?? fish.regionId ?? '',
                            price: FishKeepHistory.computePrice(fish) ?? 0,
                            exp: FishKeepHistory.computeExp(fish) ?? 0,
                            weight: fish.weight ?? 0,
                            score: fish.score ?? 0,
                        };
                    });
            }

            function aggregate(rows, keyFn) {
                const map = new Map();
                rows.forEach(row => {
                    const key = keyFn(row);
                    const item = map.get(key) ?? { name: key, count: 0, price: 0, exp: 0, weight: 0, maxScore: 0 };
                    item.count += 1;
                    item.price += row.price;
                    item.exp += row.exp;
                    item.weight += row.weight;
                    item.maxScore = Math.max(item.maxScore, row.score);
                    map.set(key, item);
                });
                return Array.from(map.values()).sort((a, b) => b.count - a.count);
            }

            function statsTable(title, rows) {
                const table = Ui.div({ style: 'overflow:auto;border:1px solid var(--item-border,#d7dce5);border-radius:6px;' });
                table.innerHTML = `
                    <div style="padding:8px 10px;font-weight:700;background:var(--card-title-background,#f8fafc);">${title}</div>
                    <table class="lf-record-table" style="width:100%;border-collapse:collapse;font-size:13px;">
                        <thead><tr><th>名称</th><th>数量</th><th>总价</th><th>总经验</th><th>总重量</th><th>最高评分</th></tr></thead>
                        <tbody>
                            ${rows.map(row => `
                                <tr>
                                    <td>${row.name}</td>
                                    <td>${row.count}</td>
                                    <td>${row.price.toFixed(0)}</td>
                                    <td>${row.exp.toFixed(1)}</td>
                                    <td>${Utils.formatWeight(row.weight)}</td>
                                    <td>${row.maxScore.toFixed(2)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`;
                return table;
            }

            function refresh() {
                if (!summaryDiv || !tablesDiv) return;
                const rows = getRows();
                const total = rows.reduce((acc, row) => {
                    acc.price += row.price;
                    acc.exp += row.exp;
                    acc.weight += row.weight;
                    acc.maxScore = Math.max(acc.maxScore, row.score);
                    return acc;
                }, { price: 0, exp: 0, weight: 0, maxScore: 0 });

                summaryDiv.innerHTML = `
                    <div class="card" style="padding:10px;">总记录：<b>${rows.length}</b></div>
                    <div class="card" style="padding:10px;">总金币：<b>${total.price.toFixed(0)}</b></div>
                    <div class="card" style="padding:10px;">总经验：<b>${total.exp.toFixed(1)}</b></div>
                    <div class="card" style="padding:10px;">总重量：<b>${Utils.formatWeight(total.weight)}</b></div>
                    <div class="card" style="padding:10px;">最高评分：<b>${total.maxScore.toFixed(2)}%</b></div>
                `;
                tablesDiv.innerHTML = '';
                tablesDiv.appendChild(statsTable('按鱼种统计', aggregate(rows, row => row.name)));
                tablesDiv.appendChild(statsTable('按地点统计', aggregate(rows, row => row.region || '未知地点')));
            }

            function construct() {
                const root = Ui.div({ style: 'margin:10px;display:flex;flex-direction:column;gap:0;' });

                offsetTitleEl = Ui.div({ style: 'font-weight:700;font-size:14px;margin:0 0 6px;', textContent: '评级偏移: 计算中…' });
                root.appendChild(offsetTitleEl);

                histChart.div = Ui.div({ style: 'width:100%;height:280px;' });
                curChart.div = Ui.div({ style: 'width:100%;height:260px;' });
                root.appendChild(Ui.div({ style: 'font-size:12px;color:#888;margin:2px 0;', textContent: '历史偏移（最近样本滑动平均）' }));
                root.appendChild(histChart.div);
                root.appendChild(Ui.div({ style: 'font-size:12px;color:#888;margin:10px 0 2px;', textContent: '当前偏移（分数分布拟合）' }));
                root.appendChild(curChart.div);

                summaryDiv = Ui.div({ style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:14px 0 10px;' });
                root.appendChild(summaryDiv);
                tablesDiv = Ui.div({ style: 'display:flex;flex-direction:column;gap:10px;' });
                root.appendChild(tablesDiv);

                refresh();
                return root;
            }

            function onInit() {
                ensureEcharts().then(() => {
                    if (!histChart.div || !curChart.div) return;
                    histChart.chart = echarts.init(histChart.div);
                    curChart.chart = echarts.init(curChart.div);
                    requestAnimationFrame(() => requestAnimationFrame(() => {
                        renderCharts();
                        histChart.chart?.resize();
                        curChart.chart?.resize();
                    }));
                    const ro = new ResizeObserver(() => requestAnimationFrame(() => {
                        histChart.chart?.resize();
                        curChart.chart?.resize();
                    }));
                    ro.observe(histChart.div);
                    ro.observe(curChart.div);
                }).catch(e => {
                    console.warn(e);
                    if (offsetTitleEl) offsetTitleEl.textContent = '评级偏移: 图表库加载失败';
                });
                refresh();
            }

            function onResize() {
                histChart.chart?.resize();
                curChart.chart?.resize();
            }

            function onShow() {
                refresh();
                renderCharts();
            }

            return {
                content: construct(),
                onInit,
                onResize,
                onShow,
            };
        }

        showPopup() {
            if (this.popup.isOpening) return;

            this.popup.addTab('历史总览', this.historyPanel(), { overflow: 'hidden', height: '100%' });
            this.popup.addTab('收益统计', this.earningsPanel(), { overflow: 'hidden', height: '100%' });
            this.popup.addTab('时间备注', this.timestampNotePanel(), { overflow: 'hidden', height: '100%' });
            this.popup.addTab('鱼护记录', this.recordPanel(), { overflow: 'hidden', height: '100%' });
            this.popup.addTab('统计', this.statPanel(), { overflow: 'auto' });
            this.popup.open();
        }

        constructButton() {
            if (document.getElementById('fish-keep-helper-btn')) return;
            const savedLeft = localStorage.getItem('lf_btn_left');
            const savedTop = localStorage.getItem('lf_btn_top') || '10px';
            const initialRight = savedLeft ? 'auto' : '10px';
            const btn = Ui.button('🐟', {
                id: 'fish-keep-helper-btn',
                style: {
                    position: 'fixed',
                    top: '10px',
                    left: savedLeft || 'auto',
                    right: initialRight,
                    width: '48px',
                    height: '48px',
                    zIndex: '999999',
                    touchAction: 'none',
                    userSelect: 'none',
                }
            });
            btn.style.top = savedTop;

            let isDragging = false;
            let hasMoved = false;
            let startX = 0;
            let startY = 0;
            let startLeft = 0;
            let startTop = 0;

            btn.addEventListener('pointerdown', (e) => {
                if (e.button !== 0 && e.pointerType === 'mouse') return;
                isDragging = true;
                hasMoved = false;
                startX = e.clientX;
                startY = e.clientY;

                const rect = btn.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;
                btn.style.right = 'auto';
                btn.style.left = `${startLeft}px`;
                btn.style.top = `${startTop}px`;
                btn.setPointerCapture?.(e.pointerId);
            });

            btn.addEventListener('pointermove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;

                const newLeft = Math.max(0, Math.min(startLeft + dx, window.innerWidth - 48));
                const newTop = Math.max(0, Math.min(startTop + dy, window.innerHeight - 48));
                btn.style.left = `${newLeft}px`;
                btn.style.top = `${newTop}px`;
            });

            btn.addEventListener('pointerup', (e) => {
                if (!isDragging) return;
                isDragging = false;
                btn.releasePointerCapture?.(e.pointerId);
                if (hasMoved) {
                    localStorage.setItem('lf_btn_left', btn.style.left);
                    localStorage.setItem('lf_btn_top', btn.style.top);
                }
            });

            btn.onclick = () => {
                if (hasMoved) return;
                this.showPopup();
            };
            (document.body ?? document.documentElement).appendChild(btn);
        }

        constructor() {
            DomRetry.onReady(() => this.constructButton());
        }
    };

    //#endregion



    //#region Data

    const GameData = new class {
        #data = {};

        fishData = {};
        regionData = {};
        fishNameToId = {};

        get data() {
            if (!this.#data) return null;
            return this.#data;
        }

        initFishData() {
            const fishData = this.#data.fish;
            fishData.forEach(fish => {
                const data = {
                    id: fish.id,
                    name: fish.name,
                    rarity: Utils.getFishRarity(fish.rarity),
                    sizeRange: { min: fish.size_min_cm, max: fish.size_max_cm }, // 尺寸, z_f
                    weightRange: { min: fish.weight_min_kg, max: fish.weight_max_kg }, // 体重, m_f
                    strength: fish.strength, // 力量, p_f
                    endurance: fish.endurance, // 耐力, e_f
                    agility: fish.agility, // 敏捷, a_f
                    alertness: fish.alertness, // 警觉, q_f
                    baitPreference: fish.bait_preference, // 偏好饵型, b_f
                    lurePreference: fish.lure_preference,
                    biteHours: fish.bite_hours,
                    waterLayer: fish.water_layer, // 偏好水层, l_f
                    offshorePreference: fish.offshore_preference,
                    migrationHabit: fish.migration_habit, // 洄游习惯, m^{mig}_f
                };
                this.fishData[fish.id] = data;
                this.fishNameToId[fish.name] = fish.id;
            });
        }
        initRegionData() {
            const regions = this.#data.regions;
            regions.forEach(region => {
                const spots = {};
                region.spots.forEach(spot => {
                    spots[spot.id] = {
                        id: spot.id,
                        name: spot.name,
                    };
                });
                const dotPos = region.name.indexOf('·');
                const abbr = dotPos == -1 ? region.name : region.name.slice(0, dotPos);
                const data = {
                    id: region.id,
                    name: region.name,
                    abbr: abbr,
                    spots: spots,
                };
                this.regionData[region.id] = data;
            });
        }
        init(msg) {
            if (!msg) return;
            Object.entries(msg).forEach(([k, v]) => {
                this.#data[k] = v;
                if (k == 'fish') this.initFishData();
                if (k == 'regions') this.initRegionData();
            });
        }

        constructor() {
            this.init(JSON.parse(LZString.decompressFromBase64(DefaultGameDataCompressed)));
            this.init(LocalStorageData.get('gameData'));
            ActionResultHandler.addListener('get_game_data', msg => {
                this.init(msg.data);
                LocalStorageData.set('gameData', this.#data);
                // dbg('Game Data', this.data);
            }, -1000);
            dbg('鱼种数据 (GameData.fishData)', this.fishData);
            dbg('钓场数据 (GameData.regionData)', this.regionData);
        }
    };

    const PlayerData = new class {
        #data = null;

        get data() {
            if (!this.#data) return null;
            return this.#data;
        }

        get playerId() {
            return this.#data?.id;
        }
        get exp() {
            return this.#data?.exp;
        }
        get level() {
            return this.#data?.level;
        }
        get rebirth() {
            return this.#data?.rebirth_count;
        }
        expRequirement(lv) {
            return 25 * Math.pow(1.2, this.rebirth || 0) * Math.pow(lv - 1, 2);
        }

        init(data) {
            this.#data = data;
            // dbg('Player data', this.#data);
        }

        update(msg, data) {
            this.#data = data;
            // dbg(`Player data updated on ${msg.type} - ${msg.action}`);
            // dbg(`Player data updated on ${msg.type} - ${msg.action}`, this.#data);
        }

        constructor() {
            MessageHandler.addListener('any', msg => {
                if (msg.action == 'sync') this.init(msg.player);
                if (msg.player) this.update(msg, msg.player);
            });
        }
    };

    const ExpRequirementEnhance = new class {
        crucialLvs = [7, 14, 20, 27, 32, 35, 40, 55, 90, 120, 150, 200];

        updateUi() {
            const panel = document.body?.querySelector('#root > div > aside > div.sidebar-footer > div.player-info');
            if (!panel) return;

            panel.querySelector('#exp-requirement')?.remove();
            const level = PlayerData.level;
            const exp = PlayerData.exp;
            if (typeof level !== 'number' || typeof exp !== 'number') return;

            const targetLevel = this.crucialLvs.find(i => i > level);
            if (!targetLevel) return;

            const requirement = PlayerData.expRequirement(targetLevel) - exp;
            panel.appendChild(Ui.div({ className: 'player-info player-level', id: 'exp-requirement' }, [
                Ui.elem('span', {}, `距离 Lv.${targetLevel} 还差 ${Math.max(0, Math.ceil(requirement))} EXP`)
            ]));
        }

        constructor() {
            const debounce = (fn, delay) => {
                let timer = null;
                return (...args) => {
                    clearTimeout(timer);
                    timer = setTimeout(() => fn(...args), delay);
                };
            };
            const scheduleUpdate = debounce(() => this.updateUi(), 200);
            MessageHandler.addListener('any', msg => {
                if (msg.player) scheduleUpdate();
            });
            DomRetry.onReady(() => {
                scheduleUpdate();
                new MutationObserver(scheduleUpdate).observe(document.body, { childList: true, subtree: true });
            });
        }
    };

    //#endregion


    //#region Fishing

    const FishPredictor = new class {
        hookResult = null;

        predict() {
            const fish = this.hookResult?.fish;
            const fishStaminaMax = this.hookResult?.fishStaminaMax;
            if (!fish || !fishStaminaMax) return null;

            // 鱼最大体力, E_{f,max} = max{5.0, 6.5 e_f + 1.5 m_f + 1.2 a_f}
            const computeStamina = weight => {
                return Math.max(5.0, 6.5 * fish.endurance + 1.5 * weight + 1.2 * fish.agility);
            }
            const wMin = fish.weightRange.min;
            const wMax = fish.weightRange.max;
            const staminaMin = computeStamina(wMin);
            const staminaMax = computeStamina(wMax);
            const pw = (fishStaminaMax - staminaMin) / (staminaMax - staminaMin); // 重量分位
            const weight = Range.quantile(fish.weightRange, pw);

            const alphaSize = 0.531;
            const alphaScore = 0.496, K = -3.527, B = 1.929, sigma = 0.220; // 神秘常数
            const ps = Math.pow(pw, alphaSize); // 长度分位
            const t = K * Math.pow(pw, alphaScore) + B;
            const scoreCDF = (score) => {
                const p = Utils.erfcInv(2 * score) - t;
                return 1 - Utils.erfc(-p / (1.414 * sigma)) / 2;
            };
            const score = (1 - Utils.erf(t)) / 2 * 100;

            const price = FishKeepHistory.computePrice({ fishId: fish.id, weight, score: 50 });
            const exp = FishKeepHistory.computeExp({ fishId: fish.id, weight, score: 50 });
            return {
                weight: weight,
                size: Range.quantile(fish.sizeRange, ps),
                score: score,
                price: price,
                exp: exp,
                scoreCDF: scoreCDF,
            };
        }

        init(data) {
            this.hookResult = {
                fish: GameData.fishData[data.fish_id],
                seq: data.runtime_seq,
            };
            LocalStorageData.set('last_hooked', this.hookResult);
        }

        reel(data) {
            const round = data.current_round;
            const fishStaminaMax = data.fish_stamina_max; // 鱼体力上限
            const beginSeq = data.runtime_seq - round + 1;
            if (!this.hookResult || this.hookResult.seq != beginSeq) {
                this.hookResult = null;
                return;
            }
            this.hookResult.fishStaminaMax = fishStaminaMax;

            const info = this.predict();
            if (round == 1 && info) out(`${this.hookResult.fish.name}: ${info.weight} kg`, info);
            this.tryUpdateUi();
        }

        updateUi(page) {
            if (!(page instanceof Element) || !page.isConnected) return;
            if (!this.hookResult?.fish) return;

            let statusCard = null;
            if (!page.children) return;
            for (const child of page.children) {
                if (!child.textContent?.includes('实时状态')) continue;
                statusCard = child;
                break;
            }
            if (!(statusCard instanceof Element) || !statusCard.isConnected) return;
            if (statusCard.lastChild?.id == 'fish-predictor') return;

            const info = this.predict();
            if (!info) return;

            const div = Ui.div({ id: 'fish-predictor', className: 'fishing-metric-card', style: 'margin-top:4px' });
            const price = info.price ?? 0;
            const exp = info.exp ?? 0;
            const predict = [
                [`不达标`, price * 0.2, exp * 0.82, info.scoreCDF(0.35)],
                [`达标`, price * 1, exp * 1, info.scoreCDF(0.95) - info.scoreCDF(0.35)],
                [`稀有`, price * 2, exp * 1.28, info.scoreCDF(0.99) - info.scoreCDF(0.95)],
                [`罕见`, price * 5, exp * 1.7, info.scoreCDF(0.9995) - info.scoreCDF(0.99)],
                [`传说`, price * 10, exp * 2, 1 - info.scoreCDF(0.9995)],
            ].sort((a, b) => b[3] - a[3]);
            div.appendChild(Ui.div({
                textContent:
                    `${this.hookResult.fish.name}: ${info.weight.toFixed(2)} kg, 估计 ${info.size.toFixed(1)} cm, ${info.score.toFixed(2)}%`
            }));
            for (let p of predict) {
                const [rarity, price, exp, pr] = p;
                if (pr < 0.001) break;
                div.appendChild(Ui.div({
                    textContent:
                        `${(pr * 100).toFixed(1)}% ${rarity}: 价格 ${info.price ? price.toFixed(0) : '未知'}, 经验 ${info.exp ? exp.toFixed(1) : '未知'}`
                }));
            }
            statusCard.appendChild(div);
        }

        tryUpdateUi() {
            const page = document.querySelector('#root > div > main > div.page-wrapper');
            if (!page) return false;
            DomRetry.safeRun(() => this.updateUi(page));
            return true;
        }

        observe() {
            if (!document.body) return;
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(addedNode => {
                        if (!addedNode.classList?.contains('page-wrapper')) return;
                        DomRetry.safeRun(() => this.updateUi(addedNode));
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }

        constructor() {
            this.hookResult = LocalStorageData.get('last_hooked');
            DomRetry.onReady(() => {
                this.observe();
                DomRetry.until(() => this.tryUpdateUi(), 500, 120);
            });
        }
    };

    const FishingTickHandler = new class {
        onHooked(data) {
            if (data.outcome == 'hooked') {
                FishPredictor.init(data);
            }
        }

        onReeling(data) {
            FishPredictor.reel(data);
        }

        constructor() {
            MessageHandler.addListener('hook_result', msg => {
                this.onHooked(msg.data);
            });
            MessageHandler.addListener('fishing_tick', msg => {
                const state = msg.data.state;
                if (state == 'REELING') this.onReeling(msg.data);
            });
        }
    };

    const BoatHelper = new class {
        voyage = null;

        getMembers() {
            const members = {};
            const idToOrder = {};
            this.voyage.members.forEach((m, idx) => {
                idToOrder[m.player_id] = idx;
                members[idx] = {
                    order: idx,
                    name: m.username,
                    id: m.player_id,
                    isCaptain: m.is_captain,
                    totalWeight: m.total_weight_kg,
                    catchCount: m.catch_count,
                    lockedFish: [],
                }
            });
            this.voyage.locked_signals?.entries?.forEach(i => {
                const idx = idToOrder[i.locked_by_player_id];
                if (idx === undefined) return;
                members[idx].lockedFish.push(i.fish_id);
            });
            return members;
        }

        /** 颜色方案（深/浅双背景兼容） */
        STYLE = {
            LAYER: { 'surface': { label: '上层', bg: '#29B6F6' }, 'mid': { label: '中层', bg: '#1976D2' }, 'deep': { label: '下层', bg: '#0D47A1' } },
            // 真饵名与商店 displayText 一致（assets/displayText-DSHu6S2N.js）
            BAIT: {
                algae_paste: { label: '藻饵团', color: '#66BB6A' },
                worm: { label: '虫饵', color: '#A57C52' },
                corn: { label: '玉米', color: '#C9A02E' },
                grain: { label: '谷物', color: '#C4B59C' },
                grass: { label: '草饵', color: '#9CCC65' },
                insect: { label: '昆虫', color: '#BCAAA4' },
                pellet: { label: '颗粒', color: '#78909C' },
                shrimp: { label: '虾饵', color: '#E87461' },
                snail: { label: '螺肉', color: '#7C8C6F' },
                paste: { label: '面饵', color: '#E18EBB' },
                small_fish: { label: '活小鱼', color: '#4DB6AC' },
                crab: { label: '蟹饵', color: '#E65142' },
                shellfish: { label: '贝类', color: '#9C7BBF' },
                earthworm: { label: '蚯蚓', color: '#8D6E63' },
                frog: { label: '青蛙', color: '#7CB342' },
            },
            LURE: { 'jig': { label: '铅头钩', color: '#FF7043' }, 'minnow': { label: '米诺', color: '#26C6DA' }, 'spoon': { label: '亮片', color: '#90A4AE' }, 'topwater': { label: '水面系', color: '#66BB6A' }, 'crank': { label: '摇滚', color: '#EF5350' } },
        };

        FISH_SORT_STORAGE_KEY = 'lazyfisher:boat-fish-sort:v1';
        FISH_SORT_LOCK_POSITION = { TOP: 'top', BOTTOM: 'bottom' };
        FISH_SORT_FIELDS = [
            { key: 'weight', label: '重量' },
            { key: 'water_layer', label: '水层' },
            { key: 'bait', label: '真饵偏好' },
            { key: 'lure', label: '拟饵偏好' },
        ];
        WATER_LAYER_ORDER = { surface: 0, mid: 1, deep: 2 };
        _sortPanelEl = null;
        _activeSortFishGrid = null;
        _fishGridJustSorted = false;
        _fishSortPrefs = null;

        abbreviateFishLabel(label) {
            if (!label || typeof label !== 'string') return '';
            const t = label.trim();
            return t ? t.charAt(0) : '';
        }

        /** 当前应排序/挂面板的可遇鱼类网格（自有船优先，否则取可见弹窗网格） */
        resolveSortFishGrid(fishGrid) {
            if (fishGrid instanceof Element && fishGrid.isConnected
                && fishGrid.matches?.('.region-fish-grid')
                && fishGrid.querySelector('.region-fish-card')) {
                return fishGrid;
            }
            if (this._activeSortFishGrid?.isConnected) return this._activeSortFishGrid;
            const owned = this.findOwnedBoatFishGrid();
            if (owned?.isConnected) return owned;
            for (const grid of document.querySelectorAll('.region-fish-grid')) {
                if (!grid.isConnected || !grid.querySelector('.region-fish-card')) continue;
                const rect = grid.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) return grid;
            }
            return null;
        }

        loadFishSortPrefs() {
            if (this._fishSortPrefs) return this._fishSortPrefs;
            try {
                const raw = localStorage.getItem(this.FISH_SORT_STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed?.field && this.FISH_SORT_FIELDS.some(f => f.key === parsed.field)) {
                        this._fishSortPrefs = {
                            field: parsed.field,
                            asc: parsed.asc !== false,
                            lockPosition: parsed.lockPosition === this.FISH_SORT_LOCK_POSITION.TOP
                                ? this.FISH_SORT_LOCK_POSITION.TOP
                                : this.FISH_SORT_LOCK_POSITION.BOTTOM,
                        };
                        return this._fishSortPrefs;
                    }
                }
            } catch (_) { /* ignore */ }
            this._fishSortPrefs = {
                field: 'weight',
                asc: true,
                lockPosition: this.FISH_SORT_LOCK_POSITION.BOTTOM,
            };
            return this._fishSortPrefs;
        }

        saveFishSortPrefs() {
            if (!this._fishSortPrefs) return;
            try {
                localStorage.setItem(this.FISH_SORT_STORAGE_KEY, JSON.stringify(this._fishSortPrefs));
            } catch (_) { /* ignore */ }
        }

        isOwnedBoatFishPage() {
            if (this.isPublicBoatPage()) return false;
            return !!this.findOwnedBoatFishGrid();
        }

        /** 自有船「探查鱼群」网格（排除区域弹窗内的同名网格） */
        findOwnedBoatFishGrid() {
            for (const grid of document.querySelectorAll('.region-fish-grid')) {
                if (!grid.isConnected) continue;
                if (grid.closest('.modal-body, .modal, [role="dialog"]')) continue;
                // ① 精确匹配：父容器文本含关键标识
                {
                    const section = grid.parentElement;
                    const text = section?.textContent ?? '';
                    if (text.includes('全船共享锁定') || text.includes('探查到的鱼群')) return grid;
                }
                // ② 宽松匹配：grid 所在的页面容器有"全船共享锁定"完整文本
                {
                    const page = grid.closest('.page-wrapper, .main-content');
                    const ctx = page?.textContent ?? '';
                    if (ctx.includes('全船共享锁定') && ctx.includes('探查到的鱼群')) return grid;
                }
                // ③ 兜底：有锁按钮 + 成员排名上下文
                if (grid.querySelector('.region-fish-lock-button') && this.isBoatRankingContext(this.findBoatMemberList())) {
                    return grid;
                }
            }
            return null;
        }

        /** 自有船网格验证（含一次缓存，避免同一帧重复扫描） */
        _ownedGridCache = null;
        _ownedGridCacheTick = 0;
        isOwnedBoatFishGrid(fishGrid) {
            if (!(fishGrid instanceof Element)) return false;
            // 同一帧内复用上次查找结果
            const now = Date.now();
            if (this._ownedGridCacheTick === now) {
                return this._ownedGridCache === fishGrid;
            }
            this._ownedGridCache = this.findOwnedBoatFishGrid();
            this._ownedGridCacheTick = now;
            return this._ownedGridCache != null && this._ownedGridCache === fishGrid;
        }

        isFishCardLocked(card) {
            const btn = card.querySelector('.region-fish-lock-button');
            return btn?.classList.contains('region-fish-lock-button--locked') ?? false;
        }

        extractCardWeight(card) {
            if (!(card instanceof Element)) return 0;
            const muted = card.querySelectorAll('.text-xs.text-muted');
            for (let i = muted.length - 1; i >= 0; i--) {
                const el = muted[i];
                if (el.querySelector('svg.lucide-coins')) continue;
                const raw = el.textContent.trim();
                let m = /^([\d,.]+)\s*kg$/i.exec(raw);
                if (m) {
                    const w = parseFloat(m[1].replace(/,/g, ''));
                    if (!isNaN(w) && w > 0) return w;
                }
                m = /^([\d,.]+)\s*g$/i.exec(raw);
                if (m) {
                    const w = parseFloat(m[1].replace(/,/g, '')) / 1000;
                    if (!isNaN(w) && w > 0) return w;
                }
            }
            const resolved = this.resolveFishCardContent(card);
            const max = resolved?.fishInfo?.weightRange?.max;
            return typeof max === 'number' ? max : 0;
        }

        buildFishSortEntry(node) {
            const card = node.matches?.('.region-fish-card') ? node : node.querySelector?.('.region-fish-card') ?? node;
            const resolved = this.resolveFishCardContent(node);
            const info = resolved?.fishInfo;
            const baitKey = info?.baitPreference ?? null;
            const lureKey = info?.lurePreference ?? null;
            return {
                node,
                weight: this.extractCardWeight(card),
                waterLayer: info?.waterLayer ?? null,
                baitLabel: baitKey ? (this.STYLE.BAIT[baitKey]?.label ?? baitKey) : '',
                lureLabel: lureKey ? (this.STYLE.LURE[lureKey]?.label ?? lureKey) : '',
            };
        }

        compareFishSortEntries(a, b, field, asc) {
            let cmp = 0;
            switch (field) {
                case 'weight':
                    cmp = a.weight - b.weight;
                    break;
                case 'water_layer': {
                    const la = this.WATER_LAYER_ORDER[a.waterLayer] ?? 99;
                    const lb = this.WATER_LAYER_ORDER[b.waterLayer] ?? 99;
                    cmp = la - lb;
                    break;
                }
                case 'bait':
                    cmp = (a.baitLabel || 'zzz').localeCompare(b.baitLabel || 'zzz', 'zh-CN');
                    break;
                case 'lure':
                    cmp = (a.lureLabel || 'zzz').localeCompare(b.lureLabel || 'zzz', 'zh-CN');
                    break;
            }
            if (cmp === 0) cmp = b.weight - a.weight;
            return asc ? cmp : -cmp;
        }

        sortFishGrid(fishGrid) {
            const grid = this.resolveSortFishGrid(fishGrid);
            if (!(grid instanceof Element)) return;
            const nodes = Array.from(grid.children).filter(n =>
                n instanceof Element && n.matches?.('.region-fish-card')
            );
            if (nodes.length === 0) return;

            const prefs = this.loadFishSortPrefs();
            const locked = [];
            const unlocked = [];
            nodes.forEach(node => {
                if (this.isFishCardLocked(node)) locked.push(node);
                else unlocked.push(node);
            });

            // 用 DocumentFragment 批量移动，减少 MutationObserver 触发次数
            const sortedUnlocked = unlocked
                .map(node => this.buildFishSortEntry(node))
                .sort((a, b) => this.compareFishSortEntries(a, b, prefs.field, prefs.asc));

            const lockOnTop = prefs.lockPosition === this.FISH_SORT_LOCK_POSITION.TOP;
            const desiredNodes = lockOnTop
                ? [...locked, ...sortedUnlocked.map(({ node }) => node)]
                : [...sortedUnlocked.map(({ node }) => node), ...locked];
            const currentCards = Array.from(grid.children).filter(n =>
                n instanceof Element && n.matches?.('.region-fish-card')
            );
            if (currentCards.length === desiredNodes.length
                && currentCards.every((n, i) => n === desiredNodes[i])) {
                return;
            }

            const fragment = document.createDocumentFragment();
            if (lockOnTop) {
                locked.forEach(node => fragment.appendChild(node));
                sortedUnlocked.forEach(({ node }) => fragment.appendChild(node));
            } else {
                sortedUnlocked.forEach(({ node }) => fragment.appendChild(node));
                locked.forEach(node => fragment.appendChild(node));
            }

            this._fishGridJustSorted = true;
            grid.appendChild(fragment);
            this._activeSortFishGrid = grid;
            setTimeout(() => { this._fishGridJustSorted = false; }, 500);
            this.updateFishSortPanel();
        }

        setFishSortField(field, asc) {
            const prefs = this.loadFishSortPrefs();
            this._fishSortPrefs = { ...prefs, field, asc };
            this.saveFishSortPrefs();
            this.updateFishSortPanel();
            const fishGrid = this.resolveSortFishGrid();
            if (fishGrid?.isConnected) this.sortFishGrid(fishGrid);
        }

        setFishSortLockPosition(lockPosition) {
            const prefs = this.loadFishSortPrefs();
            const next = lockPosition === this.FISH_SORT_LOCK_POSITION.TOP
                ? this.FISH_SORT_LOCK_POSITION.TOP
                : this.FISH_SORT_LOCK_POSITION.BOTTOM;
            if (prefs.lockPosition === next) return;
            this._fishSortPrefs = { ...prefs, lockPosition: next };
            this.saveFishSortPrefs();
            this.updateFishSortPanel();
            const fishGrid = this.resolveSortFishGrid();
            if (fishGrid?.isConnected) this.sortFishGrid(fishGrid);
        }

        createFishSortPanel() {
            if (this._sortPanelEl?.isConnected) return this._sortPanelEl;

            const fieldsWrap = Ui.div({ className: 'lf-boat-fish-sort-fields' });
            this.FISH_SORT_FIELDS.forEach(field => {
                const item = Ui.elem('span', { className: 'lf-boat-fish-sort-item' });
                const labelBtn = Ui.elem('button', {
                    type: 'button',
                    className: 'lf-boat-fish-sort-label',
                    textContent: field.label,
                });
                labelBtn.dataset.field = field.key;
                labelBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    this.setFishSortField(field.key, true);
                });

                const arrowBtn = Ui.elem('button', {
                    type: 'button',
                    className: 'lf-boat-fish-sort-arrow',
                    textContent: '▼',
                    title: '切换升序/降序',
                });
                arrowBtn.dataset.field = field.key;
                arrowBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    const prefs = this.loadFishSortPrefs();
                    if (prefs.field === field.key) {
                        this.setFishSortField(field.key, !prefs.asc);
                    } else {
                        this.setFishSortField(field.key, false);
                    }
                });

                item.appendChild(labelBtn);
                item.appendChild(arrowBtn);
                fieldsWrap.appendChild(item);
            });

            const lockGroup = Ui.div({ className: 'lf-boat-fish-sort-lock-group' });
            lockGroup.appendChild(Ui.elem('span', { className: 'lf-boat-fish-sort-group-label', textContent: '锁定' }));
            const lockTopBtn = Ui.elem('button', {
                type: 'button',
                className: 'lf-boat-fish-sort-lock-btn',
                textContent: '在上',
                title: '已锁定鱼种排在最上',
            });
            lockTopBtn.dataset.lockPos = this.FISH_SORT_LOCK_POSITION.TOP;
            lockTopBtn.addEventListener('click', e => {
                e.stopPropagation();
                this.setFishSortLockPosition(this.FISH_SORT_LOCK_POSITION.TOP);
            });
            const lockBottomBtn = Ui.elem('button', {
                type: 'button',
                className: 'lf-boat-fish-sort-lock-btn',
                textContent: '在下',
                title: '已锁定鱼种排在最下',
            });
            lockBottomBtn.dataset.lockPos = this.FISH_SORT_LOCK_POSITION.BOTTOM;
            lockBottomBtn.addEventListener('click', e => {
                e.stopPropagation();
                this.setFishSortLockPosition(this.FISH_SORT_LOCK_POSITION.BOTTOM);
            });
            lockGroup.appendChild(lockTopBtn);
            lockGroup.appendChild(lockBottomBtn);
            this._lockTopBtn = lockTopBtn;
            this._lockBottomBtn = lockBottomBtn;

            const panel = Ui.div({ id: 'lf-boat-fish-sort-panel', className: 'lf-boat-fish-sort-panel' }, [
                Ui.elem('span', { className: 'lf-boat-fish-sort-hint', textContent: '排序' }),
                fieldsWrap,
                Ui.elem('span', { className: 'lf-boat-fish-sort-divider', 'aria-hidden': 'true' }),
                lockGroup,
            ]);
            this._sortPanelEl = panel;
            this.updateFishSortPanel();
            return panel;
        }

        updateFishSortPanel() {
            if (!this._sortPanelEl?.isConnected) return;
            const prefs = this.loadFishSortPrefs();
            this._sortPanelEl.querySelectorAll('.lf-boat-fish-sort-item').forEach(item => {
                const fieldKey = item.querySelector('.lf-boat-fish-sort-label')?.dataset.field;
                const isActive = fieldKey === prefs.field;
                item.classList.toggle('lf-boat-fish-sort-item--active', isActive);
                const arrow = item.querySelector('.lf-boat-fish-sort-arrow');
                if (arrow) arrow.textContent = isActive ? (prefs.asc ? '▲' : '▼') : '▼';
            });
            const lockTop = this._lockTopBtn ?? this._sortPanelEl.querySelector('[data-lock-pos="top"]');
            const lockBottom = this._lockBottomBtn ?? this._sortPanelEl.querySelector('[data-lock-pos="bottom"]');
            const onTop = prefs.lockPosition === this.FISH_SORT_LOCK_POSITION.TOP;
            lockTop?.classList.toggle('lf-boat-fish-sort-lock-btn--active', onTop);
            lockBottom?.classList.toggle('lf-boat-fish-sort-lock-btn--active', !onTop);
        }

        ensureFishSortPanel(fishGrid) {
            const grid = this.resolveSortFishGrid(fishGrid);
            if (!(grid instanceof Element)) return;
            this._activeSortFishGrid = grid;
            const existing = document.getElementById('lf-boat-fish-sort-panel');
            if (!existing?.isConnected || existing.parentNode !== grid.parentNode) {
                existing?.remove();
                this._sortPanelEl = null;
                grid.parentNode?.insertBefore(this.createFishSortPanel(), grid);
            } else if (existing.nextElementSibling !== grid) {
                grid.parentNode?.insertBefore(existing, grid);
                this._sortPanelEl = existing;
                this.updateFishSortPanel();
            } else {
                this._sortPanelEl = existing;
                this.updateFishSortPanel();
            }
        }

        /** 饵料/拟饵/水层标签色（与公开版水层模块一致） */
        TAG_LAYER_BG = '#1565C0';
        TAG_BAIT_BG = '#E65100';
        TAG_LURE_BG = '#2E7D32';
        _DB_LAYER_MAP = { '上层': 'surface', '中层': 'mid', '下层': 'deep', '表层': 'surface', '底层': 'deep' };

        findStyleKeyByLabel(styleMap, label) {
            if (!label) return null;
            for (const [key, val] of Object.entries(styleMap)) {
                if (val.label === label) return key;
            }
            return null;
        }

        resolveFishInfoFromDatabase(fishName) {
            const items = window.LazyFisherFishDb?.getItems?.() ?? [];
            if (!fishName || !Array.isArray(items) || items.length === 0) return null;
            const trimmed = fishName.trim();
            const fish = items.find(item => (item.name || item['名称'] || '').trim() === trimmed);
            if (!fish) return null;
            const details = fish.details || fish['详情'] || {};
            const layerCn = details['水层'];
            const baitCn = details['偏好饵料'];
            const lureCn = details['偏好拟饵'];
            const waterLayer = this._DB_LAYER_MAP[layerCn] ?? null;
            const baitPreference = this.findStyleKeyByLabel(this.STYLE.BAIT, baitCn);
            const lurePreference = this.findStyleKeyByLabel(this.STYLE.LURE, lureCn);
            if (!waterLayer && !baitPreference && !lurePreference) return null;
            return { waterLayer, baitPreference, lurePreference, _dbBaitLabel: baitCn, _dbLureLabel: lureCn };
        }

        clearRegionFishCardWeightDecor(card) {
            if (!(card instanceof Element)) return;
            delete card.dataset.weightMarked;
            card.style.removeProperty('border-left');
            card.style.removeProperty('padding-left');
            card.style.removeProperty('border-bottom');
            card.style.removeProperty('background');
        }

        clearLegacyFishInfoNodes(content) {
            if (!(content instanceof Element)) return;
            content.querySelectorAll('.fish-tag-row, .lf-fish-tag-row').forEach(el => el.remove());
            // 清理旧版底部竖排徽章、缩写方块行残留
            for (const child of [...content.children]) {
                if (child.classList?.contains('lf-fish-tag-row') || child.classList?.contains('fish-tag-row')) continue;
                if (child.querySelector?.('.lf-fish-badge')) {
                    child.remove();
                    continue;
                }
                const span = child.querySelector?.(':scope > span');
                if (!(span instanceof Element)) continue;
                const bg = span.style.background || span.style.backgroundColor;
                const isLegacyBadge = (bg && /rgb|#|1565C0|E65100|2E7D32|29B6F6|1976D2/i.test(bg))
                    || span.classList?.contains('lf-fish-badge');
                if (isLegacyBadge && child.childElementCount <= 2) child.remove();
            }
        }

        createFishBadge(label, kind, title) {
            const full = title ?? label;
            const span = Ui.elem('span', {
                className: `lf-fish-badge lf-fish-badge--${kind}`,
                textContent: this.abbreviateFishLabel(label),
                title: full,
            });
            return span;
        }

        buildFishTagRow(content, fishInfo) {
            const nameEl = content.querySelector('.item-name');
            if (!nameEl?.parentNode) return;

            this.clearLegacyFishInfoNodes(content);

            const badges = [];
            if (fishInfo.waterLayer) {
                const s = this.STYLE.LAYER[fishInfo.waterLayer];
                const label = s?.label ?? Object.entries(this._DB_LAYER_MAP).find(([, v]) => v === fishInfo.waterLayer)?.[0];
                if (label) badges.push(this.createFishBadge(label, 'layer', label));
            }
            if (fishInfo.baitPreference) {
                const s = this.STYLE.BAIT[fishInfo.baitPreference];
                if (s) badges.push(this.createFishBadge(s.label, 'bait', s.label));
            } else if (fishInfo._dbBaitLabel) {
                badges.push(this.createFishBadge(fishInfo._dbBaitLabel, 'bait', fishInfo._dbBaitLabel));
            }
            if (fishInfo.lurePreference) {
                const s = this.STYLE.LURE[fishInfo.lurePreference];
                if (s) badges.push(this.createFishBadge(s.label, 'lure', s.label));
            } else if (fishInfo._dbLureLabel) {
                badges.push(this.createFishBadge(fishInfo._dbLureLabel, 'lure', fishInfo._dbLureLabel));
            }
            if (badges.length === 0) return;

            const row = Ui.div({ className: 'lf-fish-tag-row' }, badges);
            const existing = nameEl.parentNode.querySelector(':scope > .lf-fish-tag-row');
            if (existing) existing.replaceWith(row);
            else nameEl.parentNode.insertBefore(row, nameEl.nextSibling);
        }

        appendFishInfo(content, fishInfo) {
            if (!(content instanceof Element) || !fishInfo) return;
            if (content.dataset.lfFishInfo === '1' && content.querySelector('.lf-fish-tag-row')) return;
            this.buildFishTagRow(content, fishInfo);
            content.dataset.lfFishInfo = '1';
        }

        appendFishPrice(content, fishId) {
            if (!(content instanceof Element) || content.dataset.boatHelperPrice === '1') return;
            const price = FishKeepHistory.computeRefPrice(fishId);
            content.appendChild(Ui.div({ className: 'text-xs text-muted' }, [
                Ui.elem('span', { innerHTML: Ui.getPriceIcon(12, 10) }),
                Ui.elem('span', { textContent: price ? Utils.formatNumber(price.toFixed(0)) : '未知' }),
            ]));
            content.dataset.boatHelperPrice = '1';
        }

        trimRetainUserLabels(content) {
            if (!(content instanceof Element)) return;
            const textMutedList = content.querySelectorAll(':scope > div > .text-xs.text-muted');
            for (const el of textMutedList) {
                const raw = el.textContent?.trim() || '';
                const idx = raw.indexOf('保留');
                if (idx <= 0) continue;
                const userName = raw.substring(0, idx);
                const suffix = raw.substring(idx);
                el.title = userName;
                el.style.cssText = 'display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:7em;vertical-align:middle;';
                el.textContent = userName + suffix;
            }
        }

        /** 解析缓存：避免同一卡片重复查询 DOM */
        _resolvedCache = new WeakMap();

        resolveFishCardContent(node) {
            if (!(node instanceof Element)) return null;
            const cached = this._resolvedCache.get(node);
            if (cached) return cached;
            const content = node.matches('button.region-fish-card-content')
                ? node
                : node.querySelector('button.region-fish-card-content');
            if (!(content instanceof Element)) return null;
            const fishNameNode = content.querySelector('.item-name');
            if (!fishNameNode) return null;
            const fishName = fishNameNode.textContent?.trim();
            const fishId = GameData.fishNameToId?.[fishName] ?? null;
            let fishInfo = fishId ? (GameData.fishData?.[fishId] ?? null) : null;
            if (!fishInfo) fishInfo = this.resolveFishInfoFromDatabase(fishName);
            if (!fishInfo) return null;
            const result = { content, fishId, fishInfo };
            this._resolvedCache.set(node, result);
            return result;
        }

        /** 增强单个 region-fish-grid（钓场弹窗、船钓页等共用） */
        enhanceFishGrid(fishGrid, { withPrice = true, trimRetainUser = false } = {}) {
            if (!(fishGrid instanceof Element)) return;
            for (const node of fishGrid.children) {
                if (node instanceof Element && node.matches?.('.region-fish-card')) {
                    this.clearRegionFishCardWeightDecor(node);
                }
                const resolved = this.resolveFishCardContent(node);
                if (!resolved) continue;
                const { content, fishId, fishInfo } = resolved;
                this.appendFishInfo(content, fishInfo);
                if (withPrice && fishId) this.appendFishPrice(content, fishId);
                if (trimRetainUser) this.trimRetainUserLabels(content);
            }
        }

        /** 页面上所有「可遇鱼类」网格：区域详情弹窗、钓位选择弹窗、船钓页等 */
        enhanceAllRegionFishGrids(options = {}) {
            for (const fishGrid of document.querySelectorAll('.region-fish-grid')) {
                if (!fishGrid.isConnected) continue;
                this.enhanceFishGrid(fishGrid, options);
            }
        }

        handleFishGrid(fishGrid) {
            if (!(fishGrid instanceof Element)) return;
            const isOwned = this.isOwnedBoatFishGrid(fishGrid);
            if (!isOwned && !this.voyage) return;
            this.enhanceFishGrid(fishGrid, { withPrice: true, trimRetainUser: isOwned || !!this.voyage });
            this.ensureFishSortPanel(fishGrid);
            if (!this._fishGridJustSorted) {
                this.sortFishGrid(fishGrid);
            }
        }

        findBoatMemberList() {
            return document.querySelector('div.card-list.mt-md.mb-sm');
        }

        /** 成员列表含船主/掌舵，或已被本脚本重排（带 #N 名次） */
        isBoatRankingContext(memberList) {
            if (!(memberList instanceof Element) || !memberList.isConnected) return false;
            for (const card of memberList.querySelectorAll(':scope > .card.item-card')) {
                if (card.querySelector('.ranking-rank')) return true;
                const name = card.querySelector('div.item-header span.item-name')?.textContent ?? '';
                const statsText = card.querySelector('.item-stats')?.textContent ?? '';
                if (name.includes('船主') || name.includes('掌舵') || statsText.includes('掌舵')) return true;
            }
            return false;
        }

        /** 公共船（认缴凑费）无锁鱼/可遇鱼类面板，与自有船 DOM 区分 */
        isPublicBoatPage() {
            if (document.querySelector('div.region-fish-grid')?.isConnected) return false;
            const card = document.querySelector('div.card');
            if (!card) return false;
            const text = card.textContent || '';
            return text.includes('下船并交接') || text.includes('上船要求');
        }

        _memberListSig = null;
        _renderingMembers = false;

        buildMemberMap(members) {
            const byId = {};
            const byName = {};
            for (const m of Object.values(members)) {
                byId[m.id] = m;
                byName[m.name] = m;
            }
            return { byId, byName };
        }

        buildMemberRankSignature(members) {
            return Object.values(members)
                .map(m => `${m.id}|${m.totalWeight}|${m.catchCount}|${m.lockedFish.join(',')}`)
                .sort()
                .join(';');
        }

        parseMemberDisplayName(nameText) {
            const raw = (nameText ?? '').trim();
            const sep = raw.indexOf(' · ');
            return sep >= 0 ? raw.slice(0, sep).trim() : raw;
        }

        getMemberCardContentRoot(card) {
            if (!(card instanceof Element)) return null;
            const body = card.querySelector(':scope > [data-lf-member-body]');
            if (body instanceof Element) return body;
            if (card.querySelector(':scope > .ranking-rank') && card.children[1] instanceof Element) {
                return card.children[1];
            }
            return card;
        }

        /** 保留 React 挂载的交互按钮（如「交给他掌舵」），仅包一层排行外壳 */
        ensureMemberCardShell(card) {
            if (!(card instanceof Element) || !card.isConnected) return null;

            let rankEl = card.querySelector(':scope > .ranking-rank');
            let body = card.querySelector(':scope > [data-lf-member-body]');

            if (!(rankEl instanceof Element)) {
                rankEl = document.createElement('div');
                rankEl.className = 'ranking-rank';
                rankEl.style.marginRight = '6px';
                try { card.insertBefore(rankEl, card.firstChild); } catch (e) { /* React 可能已更新 DOM */ }
            }

            if (!(body instanceof Element)) {
                body = document.createElement('div');
                body.dataset.lfMemberBody = '1';
                body.style.flex = '1';
                body.style.minWidth = '0';
                for (const child of [...card.children]) {
                    if (child !== rankEl && child.parentNode === card) {
                        try { body.appendChild(child); } catch (e) { /* React 并发渲染 */ }
                    }
                }
                try { card.appendChild(body); } catch (e) { /* card 可能已脱离 DOM */ }
            }

            card.classList.add('card', 'item-card');
            card.style.display = 'flex';
            card.style.alignItems = 'center';
            card.style.backgroundOrigin = 'border-box';
            return body;
        }

        isHelmActionElement(el) {
            if (!(el instanceof Element)) return false;
            if (el.matches('button, a[role="button"], .btn')) {
                const text = el.textContent?.trim() ?? '';
                if (/交给/.test(text) && /掌舵/.test(text)) return true;
            }
            return false;
        }

        resolveMemberFromCard(card, memberMap) {
            if (!(card instanceof Element)) return null;
            const cachedId = card.dataset.lfPlayerId;
            if (cachedId && memberMap.byId[cachedId]) return memberMap.byId[cachedId];

            const nameNode = this.getMemberCardContentRoot(card)?.querySelector('div.item-header span.item-name')
                ?? card.querySelector('div.item-header span.item-name');
            const display = this.parseMemberDisplayName(nameNode?.textContent);
            if (display && memberMap.byName[display]) return memberMap.byName[display];

            for (const m of Object.values(memberMap.byId)) {
                const nameNodeText = nameNode?.textContent ?? '';
                if (nameNodeText.includes(m.name)) return m;
            }
            return null;
        }

        syncMemberLockTags(header, member, showLockFish) {
            if (!(header instanceof Element)) return;

            // 计算目标锁鱼签名：鱼ID排序后拼接，用于与现有 DOM 比对
            const targetSig = (showLockFish && member?.lockedFish?.length)
                ? [...member.lockedFish].sort((a, b) => a - b).join(',')
                : '';

            // 查找所有现有锁鱼标签（用 querySelectorAll，防止旧代码残留多个时只取第一个就跳过清理）
            const existingAll = header.querySelectorAll('[data-lf-lock]');

            // 仅当恰好 1 个、且签名匹配时才跳过（内容完全一致，无需操作）
            if (existingAll.length === 1 && existingAll[0].dataset.lfSig === targetSig) return;

            // 清理所有旧锁鱼标签（包括旧代码残留的多余元素）
            existingAll.forEach(el => {
                if (el.parentNode) el.remove();
            });

            // 无需锁鱼（公共船 / 无锁定鱼种）
            if (!targetSig) return;

            const items = member.lockedFish
                .map(fid => GameData.fishData?.[fid])
                .filter(Boolean)
                .map(f => Ui.elem('span', {
                    style: 'background: color-mix(in srgb, var(--color-bg) 60%, transparent); border: 1px solid var(--color-text); border-radius: 3px; padding: 1px 6px; white-space: nowrap;',
                    textContent: f.name,
                }));
            if (!items.length) return;

            const lockDiv = Ui.div({
                'data-lf-lock': '1',
                'data-lf-sig': targetSig,
                style: 'font-size: 9px; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin: 4px 0 0; flex-basis: 100%; min-width: 0;',
            }, [
                Ui.elem('span', { style: 'font-size: 11px;' }, '🔒'),
                ...items,
            ]);
            header.appendChild(lockDiv);
        }

        patchMemberStatsFromVoyage(contentRoot, member) {
            if (!(contentRoot instanceof Element)) return;
            const stats = contentRoot.querySelector('.item-stats');
            if (!(stats instanceof Element)) return;

            for (const span of stats.querySelectorAll('.item-stat')) {
                const t = span.textContent ?? '';
                if (t.startsWith('鱼获')) {
                    span.textContent = `鱼获 ${member.catchCount} 条`;
                } else if (t.startsWith('总重')) {
                    const w = Utils.formatNumber(member.totalWeight.toFixed(2));
                    span.textContent = `总重 ${w}kg`;
                }
            }
        }

        /** 今日船上打窝为 0 时标红加粗（仅处理一次，通过 data 属性防止重复） */
        highlightZeroChum(contentRoot) {
            if (!(contentRoot instanceof Element)) return;
            const stats = contentRoot.querySelector('.item-stats');
            if (!(stats instanceof Element)) return;
            for (const span of stats.querySelectorAll('.item-stat')) {
                if (span.dataset.lfChumChecked) continue;
                span.dataset.lfChumChecked = '1';
                const text = span.textContent ?? '';
                if (!text.startsWith('今日船上打窝')) continue;
                const m = text.match(/打窝\s+(\d+)/);
                if (m && m[1] === '0') {
                    span.innerHTML = text.replace(/\s0$/, ' <span style="color:red;font-weight:bold;">0</span>');
                }
            }
        }

        updateMemberCardChrome(card, member, rankIdx, weightRange) {
            if (!(card instanceof Element)) return;
            card.dataset.lfPlayerId = String(member.id);

            const isMe = member.id === PlayerData.playerId;
            const rankEl = card.querySelector(':scope > .ranking-rank');
            const rankText = `#${rankIdx + 1}`;
            if (rankEl instanceof Element) {
                if (rankEl.textContent !== rankText) rankEl.textContent = rankText;
                rankEl.style.color = isMe ? 'var(--color-primary)' : '';
                rankEl.style.marginRight = '6px';
            }

            const x = Range.position(weightRange, member.totalWeight);
            const pos = 1 + x * 99;
            const barColor = `hsl(${x * 100}, 65%, 87%)`;
            if (isMe) {
                const myC = 'color-mix(in srgb, var(--color-primary) 5%, var(--color-bg))';
                card.style.backgroundImage = `linear-gradient(to right, ${barColor} ${pos}%, ${myC} ${pos}%)`;
                card.style.borderColor = 'var(--color-primary)';
                card.style.boxShadow = '0 0 0 1px color-mix(in srgb, var(--color-primary) 26%, transparent)';
            } else {
                card.style.backgroundImage = `linear-gradient(to right, ${barColor} ${pos}%, var(--color-bg) ${pos}%)`;
                card.style.borderColor = '';
                card.style.boxShadow = '';
            }
            card.style.backgroundOrigin = 'border-box';
            card.style.display = 'flex';
            card.style.alignItems = 'center';
        }

        shouldRefreshMemberList(container) {
            if (!(container instanceof Element) || !container.isConnected) return false;
            if (!container.querySelector(':scope > .card.item-card .ranking-rank')) return true;
            if (!this.voyage) return false;
            const sig = this.buildMemberRankSignature(this.getMembers());
            return sig !== this._memberListSig;
        }

        isFishGridOwnMutation(mutation) {
            const isOwnNode = node => {
                if (!(node instanceof Element)) return false;
                if (node.id === 'lf-boat-fish-sort-panel') return true;
                if (node.classList?.contains('lf-boat-fish-sort-panel')
                    || node.classList?.contains('lf-fish-tag-row')
                    || node.classList?.contains('lf-fish-badge')) return true;
                return !!node.querySelector?.(
                    '#lf-boat-fish-sort-panel, .lf-boat-fish-sort-panel, .lf-fish-tag-row, .lf-fish-badge'
                );
            };
            if (mutation.type === 'attributes' && mutation.target instanceof Element) {
                const t = mutation.target;
                if (t.classList?.contains('lf-fish-tag-row') || t.classList?.contains('lf-fish-badge')) return true;
                if (t.dataset?.lfFishInfo != null || t.dataset?.boatHelperPrice != null) return true;
            }
            if (mutation.type !== 'childList') return false;
            for (const node of [...mutation.addedNodes, ...mutation.removedNodes]) {
                if (isOwnNode(node)) return true;
            }
            return false;
        }

        isBoatHelperOwnMutation(mutation) {
            return this.isMemberListOwnMutation(mutation) || this.isFishGridOwnMutation(mutation);
        }

        isMemberListOwnMutation(mutation) {
            const check = node => {
                if (!(node instanceof Element)) return false;
                return node.classList?.contains('ranking-rank')
                    || node.dataset?.lfPlayerId != null
                    || node.dataset?.lfMemberBody != null
                    || node.dataset?.lfLock != null
                    || !!node.querySelector?.('.ranking-rank, [data-lf-member-body], [data-lf-lock]');
            };
            if (mutation.type === 'attributes' && mutation.target instanceof Element) {
                return mutation.target.dataset?.lfPlayerId != null
                    || mutation.target.classList?.contains('ranking-rank');
            }
            if (mutation.type !== 'childList') return false;
            if (mutation.target instanceof Element && mutation.target.dataset?.lfPlayerId != null) {
                return true;
            }
            for (const node of mutation.addedNodes) {
                if (check(node)) return true;
            }
            for (const node of mutation.removedNodes) {
                if (check(node)) return true;
            }
            return false;
        }

        handleMemberList(container, { showLockFish = true } = {}) {
            if (!container || !this.voyage) return;

            // 500ms 节流，防止 MutationObserver(350ms debounce) / setInterval(3s) / DomRetry / get_boat_state 多源并发
            const now = Date.now();
            if (now - this._lastMemberListTs < 500) return;
            this._lastMemberListTs = now;

            this._renderingMembers = true;
            try {
                const members = this.getMembers();
                const memberMap = this.buildMemberMap(members);
                const cards = Array.from(container.children).filter(n => n.nodeType === 1);

                // ===== 单次遍历：匹配成员 + 更新统计 + 添加锁鱼（参照钓鱼统计脚本） =====
                const matched = [];
                for (const card of cards) {
                    const member = this.resolveMemberFromCard(card, memberMap);
                    if (!member) continue;

                    const contentRoot = this.ensureMemberCardShell(card);
                    if (!contentRoot) continue;

                    card.dataset.lfPlayerId = String(member.id);

                    // header 布局 + 锁鱼标签
                    const header = contentRoot.querySelector('div.item-header');
                    if (header instanceof Element) {
                        header.style.display = 'flex';
                        header.style.alignItems = 'center';
                        header.style.justifyContent = 'space-between';
                        header.style.flexWrap = 'wrap';
                        header.style.gap = '2px';

                        const titleWrap = header.firstElementChild;
                        if (titleWrap instanceof Element && !this.isHelmActionElement(titleWrap)) {
                            titleWrap.style.flex = '1';
                            titleWrap.style.minWidth = '0';
                            titleWrap.style.overflow = 'hidden';
                            titleWrap.querySelector('.item-name')?.classList.remove('item-name--multiline');
                        }

                        // 锁鱼仅自有船显示（showLockFish 由 tryRender 根据 isPublicBoat 控制）
                        this.syncMemberLockTags(header, member, showLockFish);
                    }

                    // 更新鱼获/总重统计
                    this.patchMemberStatsFromVoyage(contentRoot, member);
                    // 今日船上打窝为 0 时标红加粗
                    this.highlightZeroChum(contentRoot);

                    matched.push({ card, member });
                }

                if (matched.length === 0) return;

                // 按总重降序排列
                matched.sort((a, b) => b.member.totalWeight - a.member.totalWeight
                    || b.member.catchCount - a.member.catchCount
                    || a.member.name.localeCompare(b.member.name, 'zh-CN'));

                const weightRange = {
                    min: matched.at(-1).member.totalWeight * 0.95,
                    max: matched[0].member.totalWeight,
                };

                // 应用排行 chrome + 重排 DOM
                let needReorder = false;
                matched.forEach(({ card, member }, idx) => {
                    if (container.children[idx] !== card) needReorder = true;
                    this.updateMemberCardChrome(card, member, idx, weightRange);
                });

                if (needReorder && container.isConnected) {
                    const fragment = document.createDocumentFragment();
                    matched.forEach(({ card }) => {
                        // 确保 card 仍在 container 内（防止 React 并发渲染导致 removeChild 报错）
                        if (card.parentNode === container) {
                            try { fragment.appendChild(card); } catch (e) { /* card 已在并发中被移除 */ }
                        }
                    });
                    if (fragment.childNodes.length) {
                        try { container.replaceChildren(fragment); } catch (e) { /* container 已被 React 替换 */ }
                    }
                }

                this._memberListSig = this.buildMemberRankSignature(members);
            } catch (e) {
                console.warn('[BoatHelper] handleMemberList error:', e);
            } finally {
                this._renderingMembers = false;
            }
        }

        tryRefreshFromDom() {
            return this.tryRender();
        }

        /**
         * 在下一帧渲染，避免阻塞主线程
         */
        _deferRender(fn) {
            requestAnimationFrame(() => setTimeout(fn, 0));
        }

        /**
         * 尝试渲染船钓面板（成员排行；自有船另有鱼种网格增强）
         */
        tryRender() {
            const ownedGrid = this.findOwnedBoatFishGrid();
            const memberList = this.findBoatMemberList();
            const hasBoatMembers = this.isBoatRankingContext(memberList);

            if (!this.voyage && !ownedGrid) return false;
            if (!hasBoatMembers && !ownedGrid) {
                document.getElementById('lf-boat-fish-sort-panel')?.remove();
                this._sortPanelEl = null;
                return false;
            }

            const fishGrid = ownedGrid;
            const isPublicBoat = this.isPublicBoatPage();

            this._deferRender(() => {
                try {
                    // 重新查找网格，避免 defer 期间 DOM 被 React 替换
                    const grid = fishGrid?.isConnected ? fishGrid : this.findOwnedBoatFishGrid();
                    if (grid?.isConnected) {
                        this.handleFishGrid(grid);
                    } else if (!this.findOwnedBoatFishGrid()) {
                        document.getElementById('lf-boat-fish-sort-panel')?.remove();
                        this._sortPanelEl = null;
                    }
                    if (memberList?.isConnected && this.voyage && hasBoatMembers
                        && this.shouldRefreshMemberList(memberList)) {
                        this.handleMemberList(memberList, { showLockFish: !isPublicBoat });
                    }
                } catch (e) {
                    console.warn('[BoatHelper] tryRender error:', e);
                }
            });
            return true;
        }

        scheduleRegionFishGridEnhance() {
            this._deferRender(() => {
                try {
                    const ownedGrid = this.findOwnedBoatFishGrid();
                    for (const fishGrid of document.querySelectorAll('.region-fish-grid')) {
                        if (!fishGrid.isConnected) continue;
                        // 自有船网格由 tryRender 统一处理，这里只增强其他网格（弹窗等）
                        if (fishGrid === ownedGrid) continue;
                        this.enhanceFishGrid(fishGrid, { withPrice: true });
                        this.ensureFishSortPanel(fishGrid);
                        if (!this._fishGridJustSorted) this.sortFishGrid(fishGrid);
                    }
                } catch (e) {
                    console.warn('[BoatHelper] scheduleRegionFishGridEnhance error:', e);
                }
            });
        }

        observeFishGridSort() {
            let debounceTimer = null;
            let panelWatchTimer = null;
            const schedule = (fishGrid, delayMs = 600) => {
                if (!(fishGrid instanceof Element) || !fishGrid.matches?.('.region-fish-grid')) return;
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    try {
                        debounceTimer = null;
                        if (this._fishGridJustSorted || !fishGrid.isConnected) return;
                        const isOwned = this.isOwnedBoatFishGrid(fishGrid);
                        this.enhanceFishGrid(fishGrid, {
                            withPrice: true,
                            trimRetainUser: isOwned || !!this.voyage,
                        });
                        this.ensureFishSortPanel(fishGrid);
                        this.sortFishGrid(fishGrid);
                    } catch (e) {
                        console.warn('[BoatHelper] observeFishGridSort schedule error:', e);
                    }
                }, delayMs);
            };

            const observer = new MutationObserver(mutations => {
                if (this._fishGridJustSorted || this._renderingMembers) return;
                if (mutations.every(m => this.isFishGridOwnMutation(m))) return;
                for (const m of mutations) {
                    // 面板被 React 移除时，立即重建
                    if (m.type === 'childList') {
                        for (const node of m.removedNodes) {
                            if (node instanceof Element
                                && (node.id === 'lf-boat-fish-sort-panel'
                                    || node.querySelector?.('#lf-boat-fish-sort-panel'))) {
                                clearTimeout(panelWatchTimer);
                                panelWatchTimer = setTimeout(() => {
                                    try {
                                        const g = this.resolveSortFishGrid();
                                        if (g) this.ensureFishSortPanel(g);
                                    } catch (e) {
                                        console.warn('[BoatHelper] panelWatchTimer error:', e);
                                    }
                                }, 50);
                            }
                        }
                    }
                    if (m.type === 'attributes' && m.attributeName === 'class'
                        && m.target instanceof Element
                        && m.target.classList.contains('region-fish-lock-button')) {
                        const grid = m.target.closest('.region-fish-grid');
                        if (grid) schedule(grid, 120);
                        return;
                    }
                    if (m.type !== 'childList') continue;
                    const target = m.target;
                    if (target instanceof Element && target.classList.contains('region-fish-grid')) {
                        schedule(target);
                        return;
                    }
                    for (const node of m.addedNodes) {
                        if (!(node instanceof Element)) continue;
                        if (node.classList.contains('region-fish-card')) {
                            schedule(node.parentElement);
                            return;
                        }
                        const grid = node.querySelector?.('.region-fish-grid');
                        if (grid) {
                            schedule(grid);
                            return;
                        }
                    }
                }
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class'],
            });
        }

        observe() {
            if (!document.body) return;
            let _debounceTimer = null;
            const observer = new MutationObserver(mutations => {
                if (this._renderingMembers || this._fishGridJustSorted) return;
                if (mutations.every(m => this.isBoatHelperOwnMutation(m))) return;
                if (_debounceTimer) return;
                _debounceTimer = setTimeout(() => {
                    _debounceTimer = null;
                    if (document.querySelector('.region-fish-grid')?.isConnected) {
                        this.scheduleRegionFishGridEnhance();
                    }
                    this.tryRender();
                }, 600);
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }

        constructor() {
            window.__LF_ENHANCE_FISH_GRIDS = () => this.enhanceAllRegionFishGrids({ withPrice: true });
            ActionResultHandler.addListener('get_boat_state', msg => {
                const voyage = msg.data.active_voyage;
                if (!voyage) return;
                this.voyage = voyage;
                this._memberListSig = null;
                DomRetry.until(() => this.tryRefreshFromDom(), 500, 60);
            });
            ActionResultHandler.addListener('get_game_data', () => {
                DomRetry.safeRun(() => {
                    this.scheduleRegionFishGridEnhance();
                    this.tryRender();
                });
            }, -999);
            DomRetry.onReady(() => {
                this.observe();
                this.observeFishGridSort();
                this.scheduleRegionFishGridEnhance();
                setInterval(() => this.tryRefreshFromDom(), 8000);
                DomRetry.until(() => this.tryRefreshFromDom(), 500, 120);
            });
        }
    };

    //#endregion


    //#region CatchTiming

    const CatchTiming = new class {
        STORAGE_KEY = 'lazyfisher:catch-times:v2';
        EXCLUDED_MESSAGE_TYPES = new Set(['trade', 'system', 'achievement']);
        TIME_TEXT_PATTERN = /^\d{4}[/-]\d{2}[/-]\d{2}\s+\d{1,2}:\d{2}:\d{2}$/;
        LOG_CATCH_PATTERN = /成功起鱼：/;
        CATCH_BODY_WEIGHT_PATTERN = /([\d.]+)\s*kg/i;
        CATCH_BODY_SCORE_PATTERN = /([\d.]+)\s*%/;
        /** 上鱼框鱼获行：鱼名 · 重量 · 长度 */
        CATCH_FISH_INFO_PATTERN = / · [\d.]+kg · [\d.]+cm/i;
        RATING_META = {
            exp_baby: { label: '经验宝宝', color: '#06b6d4' },
            below_standard: { label: '不达标', color: 'var(--color-text-muted)' },
            standard: { label: '达标', color: 'var(--color-success)' },
            rare: { label: '稀有', color: 'var(--color-primary)' },
            epic: { label: '罕见', color: 'var(--color-warning)' },
            legendary: { label: '传说', color: 'var(--color-danger)' },
        };
        /** 上鱼框边框特效：未达标/达标无特效；稀有=加粗；罕见=加粗+荧光；传说=加粗+荧光+熔岩流 */
        CATCH_ALERT_FX = {
            rare: 'thick',
            epic: 'glow',
            legendary: 'lava',
        };
        CATCH_ALERT_FX_PREVIEW = {};
        CATCH_ALERT_FX_CLASSES = ['lf-catch-fx-thick', 'lf-catch-fx-glow', 'lf-catch-fx-marquee', 'lf-catch-fx-lava'];
        /** 与游戏 CatchRatingBar 分段布局一致 */
        RATING_BAR_LAYOUT = [
            { min: 0, max: 35, width: 20 },
            { min: 35, max: 95, width: 50 },
            { min: 95, max: 99, width: 15 },
            { min: 99, max: 99.95, width: 10 },
            { min: 99.95, max: 100, width: 5 },
        ];
        /** 无 ratingScore 时 marker 占位位置（percent） */
        RATING_BAR_DEFAULT_MARKER = {
            below_standard: 10,
            standard: 45,
            rare: 77.5,
            epic: 90,
            legendary: 97.5,
        };

        badgeElement = null;
        lastBadgeMinutes = null;
        lastBadgePenalty = null;
        messagesObserver = null;
        messagesObserverTarget = null;
        fishingObserver = null;
        fishingObserverTarget = null;
        /** @type {Map<string, { fishId: string, weightKg: number, score: number, rating?: string }>} */
        catchPayloadCache = new Map();
        /** 最近一条 WS 上鱼 payload，供钓鱼页 DOM 匹配百分位 */
        lastCatchPayload = null;
        _catchAlertRetryTimer = null;
        _renderingMessages = false;
        _renderingFishing = false;

        safeRun(fn) {
            DomRetry.safeRun(fn, this);
        }

        isValidElement(el) {
            return el instanceof Element && el.isConnected;
        }

        debounce(fn, delay) {
            let timer = null;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        }

        isCatchMessageType(type) {
            return type === 'catch';
        }

        isCatchMessageCard(card) {
            if (!(card instanceof Element) || !card.isConnected) return false;
            if (card.classList.contains('message-card--catch')) return true;
            const title = card.querySelector('.message-title')?.textContent?.trim() ?? '';
            return /^上鱼[:：]/.test(title);
        }

        resolveFishId(fishName) {
            if (!fishName) return null;
            const map = GameData.fishNameToId ?? {};
            if (map[fishName]) return map[fishName];
            const trimmed = fishName.trim();
            for (const [name, id] of Object.entries(map)) {
                if (name === trimmed || name.includes(trimmed) || trimmed.includes(name)) {
                    return id;
                }
            }
            return null;
        }

        getEstimateLabel(payload) {
            if (!payload) {
                return this.hasPriceSamples() ? null : { text: '估价: 需鱼护样本', title: '卖出或保留更多鱼获后，可在此预估金币' };
            }
            const price = this.estimateCatchValue(payload.fishId, payload.weightKg, payload.score);
            if (price != null) {
                return {
                    text: `估价: ${Utils.formatNumber(Math.round(price))} 金`,
                    title: '基于鱼护单价 × 评级系数估算，仅供参考',
                };
            }
            if (!this.hasPriceSamples()) {
                return { text: '估价: 需鱼护样本', title: '卖出或保留更多鱼获后，可在此预估金币' };
            }
            if (FishKeepHistory.price?.[payload.fishId]) {
                return { text: '估价: 样本不足', title: '该鱼种鱼护样本过少，暂无法估算' };
            }
            return { text: '估价: 无该鱼样本', title: '尚未积累该鱼种的售价样本' };
        }

        getMessagesCardList() {
            const lists = [...document.querySelectorAll('.card-list')].filter(
                list => list.isConnected && list.querySelector('.card.message-card'),
            );
            if (lists.length === 0) return null;
            if (lists.length === 1) return lists[0];

            const visible = lists.filter(list => this.isVisibleElement(list));
            const pool = visible.length > 0 ? visible : lists;

            const messageLists = pool.filter(list => {
                const wrapper = list.closest('.page-wrapper');
                if (!wrapper) return true;
                const title = wrapper.querySelector('.section-title');
                return !title || title.textContent.trim() === '消息';
            });
            return (messageLists.length > 0 ? messageLists : pool).at(-1);
        }

        isVisibleElement(el) {
            if (!(el instanceof Element) || !el.isConnected) return false;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        }

        getFishingLogPanel() {
            const list = document.querySelector('.fishing-log-list');
            if (!list) return null;
            if (!this.findFishingLogTitle()) return null;
            return list;
        }

        getFishingPageRoot() {
            const list = document.querySelector('.fishing-log-list');
            return list?.closest('.page-wrapper') ?? null;
        }

        getCatchAlertBox() {
            const wrapper = this.getFishingPageRoot();
            if (!wrapper) return null;
            for (const alert of wrapper.querySelectorAll('.alert')) {
                if (!alert.querySelector('.catch-rating-bar')) continue;
                if (/上鱼/.test(alert.textContent ?? '')) return alert;
            }
            return null;
        }

        ratingKeyFromLabel(label) {
            if (!label) return null;
            const trimmed = String(label).trim();
            for (const [key, meta] of Object.entries(this.RATING_META)) {
                if (meta.label === trimmed) return key;
            }
            return null;
        }

        getRatingMeta(key) {
            return key ? this.RATING_META[key] ?? null : null;
        }

        /**
         * 评分特征标记：
         * - 狠活（蓝）：严格 1% 经验宝宝 / 95.01·99.01·99.96 越线
         * - 败北（红）：区间用原始评分全精度，上界为开区间（不含下一档门槛）
         *   5~6% 不达标 / [94,95) 临界达标 / [98.85,99) 稀有 / [99.85,99.95) 罕见（含 99.948%）
         */
        isThresholdScore(score, target) {
            return typeof score === 'number' && Number.isFinite(score)
                && Math.abs(score - target) < Utils.eps;
        }

        specialCatchMark(score) {
            if (typeof score !== 'number' || !Number.isFinite(score)) return null;
            // 狠活（蓝）：科技越线分（严格阈值）
            if (this.isThresholdScore(score, 1)) return { text: '狠活', color: '#3b82f6' };
            if (this.isThresholdScore(score, 95.01)) return { text: '狠活', color: '#3b82f6' };
            if (this.isThresholdScore(score, 99.01)) return { text: '狠活', color: '#3b82f6' };
            if (this.isThresholdScore(score, 99.96)) return { text: '狠活', color: '#3b82f6' };
            // 败北（红）
            if (score >= 5 && score <= 6) return { text: '败北', color: '#ef4444' };
            if (score >= 94 && score < 95) return { text: '败北', color: '#ef4444' };
            if (score >= 98.85 && score < 99) return { text: '败北', color: '#ef4444' };
            if (score >= 99.85 && score < 99.95) return { text: '败北', color: '#ef4444' };
            return null;
        }

        setSpecialCatchMarkBadge(containerEl, score, anchorEl = null) {
            if (!(containerEl instanceof Element)) return;
            const mark = this.specialCatchMark(typeof score === 'number' ? score : NaN);
            let badge = containerEl.querySelector(':scope > .lf-special-mark')
                ?? containerEl.querySelector('.lf-special-mark');
            if (!mark) {
                badge?.remove();
                return;
            }
            const anchor = anchorEl instanceof Element ? anchorEl : containerEl;
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'lf-special-mark';
                if (anchor !== containerEl && anchor.parentNode === containerEl) {
                    anchor.insertAdjacentElement('afterend', badge);
                } else if (anchor !== containerEl) {
                    anchor.insertAdjacentElement('afterend', badge);
                } else {
                    containerEl.appendChild(badge);
                }
            } else if (anchor !== containerEl && badge.previousElementSibling !== anchor) {
                anchor.insertAdjacentElement('afterend', badge);
            }
            if (badge.textContent !== mark.text) badge.textContent = mark.text;
            if (badge.dataset.mark !== mark.text) {
                badge.style.backgroundColor = mark.color;
                badge.dataset.mark = mark.text;
            }
        }

        applySpecialCatchMark(card, parsed) {
            const titleEl = card?.querySelector?.('.message-title');
            if (!this.isValidElement(titleEl)) return;
            const bodyText = (parsed?.bodyEl ?? this.findCatchBodyEl(card))?.textContent ?? '';
            const score = (typeof parsed?.score === 'number')
                ? parsed.score
                : this.parseCatchBodyScore(bodyText);
            this.setSpecialCatchMarkBadge(titleEl, typeof score === 'number' ? score : NaN);
        }

        isExpBabyScore(score) {
            return this.isThresholdScore(score, 1);
        }

        /** 服务端评级键 + 百分位 → 展示用评级键（≤2% 为经验宝宝，仅消息页使用） */
        resolveDisplayRatingKey(baseKey, score) {
            if (this.isExpBabyScore(score)) return 'exp_baby';
            if (baseKey === 'exp_baby') return 'below_standard';
            return baseKey;
        }

        /** 钓鱼页日志/上鱼框：不单独展示经验宝宝，归入不达标 */
        resolveFishingPageRatingKey(baseKey, score) {
            const key = this.resolveDisplayRatingKey(baseKey, score);
            return key === 'exp_baby' ? 'below_standard' : key;
        }

        parseLogCatchWeight(message) {
            const kg = / · ([\d.]+)\s*kg(?: · |$)/i.exec(message ?? '');
            if (kg) return Number.parseFloat(kg[1]);
            const g = / · ([\d.]+)\s*g(?: · |$)/i.exec(message ?? '');
            if (g) return Number.parseFloat(g[1]) / 1000;
            return null;
        }

        parseLogCatchInfo(message) {
            if (!this.LOG_CATCH_PATTERN.test(message ?? '')) return null;
            const body = message.replace(/^成功起鱼：/u, '');
            const parts = body.split(' · ');
            if (parts.length < 2) return null;
            const fishName = parts[0]?.trim() ?? '';
            const weightPart = parts[1]?.trim() ?? '';
            let weightKg = null;
            let m = /^([\d.]+)\s*kg$/i.exec(weightPart);
            if (m) weightKg = Number.parseFloat(m[1]);
            else {
                m = /^([\d.]+)\s*g$/i.exec(weightPart);
                if (m) weightKg = Number.parseFloat(m[1]) / 1000;
            }
            if (!(weightKg > 0) || !fishName) return null;
            return { fishName, weightKg };
        }

        resolveLogCatchScore(message, weightKg) {
            const parsed = this.parseCatchBodyScore(message);
            if (parsed != null) return parsed;

            const w = weightKg > 0 ? weightKg : this.parseLogCatchWeight(message);
            if (w > 0) {
                const byWeight = this.resolveCatchScoreByWeight(w);
                if (byWeight != null) return byWeight;

                const info = this.parseLogCatchInfo(message);
                const fishId = info?.fishName ? this.resolveFishId(info.fishName) : null;
                for (const entry of this.catchPayloadCache.values()) {
                    if (fishId && entry.fishId !== fishId) continue;
                    if (Math.abs(entry.weightKg - w) < 0.05) return entry.score;
                }
            }

            const info = this.parseLogCatchInfo(message);
            const lp = this.lastCatchPayload;
            if (info && lp) {
                const fishId = this.resolveFishId(info.fishName);
                const nameMatch = fishId != null && fishId === lp.fishId;
                const weightMatch = Math.abs(lp.weightKg - info.weightKg) < 0.05;
                const recent = Date.now() - (lp.ms ?? 0) < 120000;
                if (nameMatch && (weightMatch || recent)) return lp.score;
            }
            return null;
        }

        parseCatchBodyScore(text) {
            if (!text) return null;
            const m = this.CATCH_BODY_SCORE_PATTERN.exec(text);
            if (!m) return null;
            const score = Number.parseFloat(m[1]);
            return Number.isFinite(score) ? score : null;
        }

        /** 消息页正文：787g / 26.2cm 或 1.2kg · 等格式 */
        parseCatchBodyWeight(body) {
            if (!body) return null;
            let m = /([\d.]+)\s*kg\s*\//i.exec(body);
            if (m) {
                const w = Number.parseFloat(m[1]);
                return Number.isFinite(w) && w > 0 ? w : null;
            }
            m = /([\d.]+)\s*g\s*\//i.exec(body);
            if (m) {
                const w = Number.parseFloat(m[1]) / 1000;
                return Number.isFinite(w) && w > 0 ? w : null;
            }
            m = this.CATCH_BODY_WEIGHT_PATTERN.exec(body);
            if (m) {
                const w = Number.parseFloat(m[1]);
                return Number.isFinite(w) && w > 0 ? w : null;
            }
            return null;
        }

        resolveCatchScoreByWeight(weightKg) {
            if (!(weightKg > 0)) return null;
            if (this.lastCatchPayload?.weightKg != null
                && Math.abs(this.lastCatchPayload.weightKg - weightKg) < 0.05) {
                return this.lastCatchPayload.score;
            }
            for (const entry of this.catchPayloadCache.values()) {
                if (Math.abs(entry.weightKg - weightKg) < 0.05) return entry.score;
            }
            return null;
        }

        scoreFromRatingBarPosition(posPct) {
            const pos = Math.min(100, Math.max(0, posPct));
            let cursor = 0;
            for (const seg of this.RATING_BAR_LAYOUT) {
                if (pos <= cursor + seg.width + 1e-6) {
                    const t = seg.width > 0 ? (pos - cursor) / seg.width : 0;
                    return seg.min + t * (seg.max - seg.min);
                }
                cursor += seg.width;
            }
            return 100;
        }

        parseCatchAlertScoreFromBar(alert) {
            if (!(alert instanceof Element)) return null;
            const marker = alert.querySelector('.catch-rating-bar .catch-rating-marker');
            if (!(marker instanceof Element)) return null;
            const left = parseFloat(marker.style.left);
            if (!Number.isFinite(left)) return null;
            const baseKey = this.resolveRatingFromBar(alert);
            const placeholder = baseKey ? this.RATING_BAR_DEFAULT_MARKER[baseKey] : null;
            if (placeholder != null && Math.abs(left - placeholder) < 0.08) return null;
            return this.scoreFromRatingBarPosition(left);
        }

        resolveCatchAlertScore(alert, weightKg) {
            let score = weightKg > 0 ? this.resolveCatchScoreByWeight(weightKg) : null;
            if (score == null) score = this.parseCatchAlertScoreFromBar(alert);
            if (score == null && this.lastCatchPayload) {
                const lp = this.lastCatchPayload;
                const weightMatch = weightKg == null || Math.abs(lp.weightKg - weightKg) < 0.05;
                const recent = Date.now() - (lp.ms ?? 0) < 20000;
                if (weightMatch || recent) score = lp.score;
            }
            return score;
        }

        resolveCatchAlertPayload(alert) {
            const fishInfoEl = this.findCatchAlertFishInfoEl(alert);
            const text = fishInfoEl?.textContent?.trim() ?? '';
            const m = this.CATCH_BODY_WEIGHT_PATTERN.exec(text);
            const weightKg = m ? Number.parseFloat(m[1]) : null;
            const score = this.resolveCatchAlertScore(alert, weightKg);
            if (score == null) return null;
            return { weightKg, score };
        }

        rememberCatchPayload(payload, createdMs, title, messageId) {
            if (!payload?.fish_id || typeof payload.weight_kg !== 'number') return;
            const entry = {
                fishId: payload.fish_id,
                weightKg: payload.weight_kg,
                score: typeof payload.rating_score === 'number' ? payload.rating_score : 50,
                rating: typeof payload.rating === 'string' ? payload.rating : null,
            };
            if (messageId != null) this.catchPayloadCache.set(`id:${messageId}`, entry);
            if (typeof createdMs === 'number') {
                this.catchPayloadCache.set(`${createdMs}|${title ?? ''}`, entry);
            }
            this.lastCatchPayload = {
                ...entry,
                ms: createdMs ?? Date.now(),
                title: title ?? null,
            };
            if (this.getFishingLogPanel()) {
                const ms = createdMs ?? Date.now();
                if (Date.now() - ms < 120000) this.scheduleCatchAlertPaint();
            }
        }

        ingestCatchPayloadFromWs(msg) {
            if (!msg || typeof msg !== 'object') return;
            const candidates = [];
            const data = msg.data;
            if (data?.item) candidates.push(data.item);
            if (data?.message) candidates.push(data.message);
            if (Array.isArray(data?.items)) candidates.push(...data.items);
            if (Array.isArray(data?.messages)) candidates.push(...data.messages);
            for (const item of candidates) {
                if (!item || !this.isCatchMessageType(item.message_type)) continue;
                const payload = item.payload;
                if (!payload?.fish_id || typeof payload.weight_kg !== 'number') continue;
                const ms = Utils.parseMessageTime(item.created_at);
                this.rememberCatchPayload(payload, ms, item.title ?? null, item.id);
            }
        }

        /** 将 var(--color-*) 解析为 computed rgb，避免 .text-muted 等与 CSS 变量不一致 */
        resolveRatingColor(ratingKey) {
            const meta = this.RATING_META[ratingKey];
            if (!meta) return null;
            if (!this._ratingColorCache) this._ratingColorCache = new Map();
            if (this._ratingColorCache.has(ratingKey)) return this._ratingColorCache.get(ratingKey);

            const probe = document.createElement('span');
            probe.style.color = meta.color;
            probe.style.display = 'none';
            document.documentElement.appendChild(probe);
            const resolved = getComputedStyle(probe).color;
            probe.remove();
            this._ratingColorCache.set(ratingKey, resolved);
            return resolved;
        }

        isCatchAlertFishInfoText(text) {
            if (!text || this.ratingKeyFromLabel(text)) return false;
            if (/^参数[：:]/u.test(text)) return false;
            if (/^成功起鱼：/u.test(text)) return false;
            return true;
        }

        isCatchAlertFishInfoNode(node, ratingEl = null) {
            if (!(node instanceof Element) || node === ratingEl) return false;
            if (node.classList.contains('lf-catch-marquee-track')) return false;
            if (node.querySelector('.catch-rating-bar')) return false;
            if (node.matches('.text-xs.text-muted')) return false;
            if (node.querySelector('strong')) return false;
            return this.isCatchAlertFishInfoText(node.textContent?.trim() ?? '');
        }

        applyCatchAlertFishInfoStyle(fishInfoEl, ratingKey) {
            if (!(fishInfoEl instanceof Element) || !ratingKey) return;
            const color = this.resolveRatingColor(ratingKey);
            if (!color) return;
            fishInfoEl.style.setProperty('color', color, 'important');
            fishInfoEl.style.setProperty('font-weight', '400', 'important');
            fishInfoEl.dataset.lfFishinfoRating = ratingKey;
        }

        clearCatchAlertFishInfoStyle(fishInfoEl) {
            if (!(fishInfoEl instanceof Element)) return;
            fishInfoEl.style.removeProperty('color');
            fishInfoEl.style.removeProperty('font-weight');
            delete fishInfoEl.dataset.lfFishinfoRating;
        }

        parseLogCatchRating(message) {
            if (!this.LOG_CATCH_PATTERN.test(message)) return null;
            const tail = message.split(' · ').pop()?.trim();
            return this.ratingKeyFromLabel(tail);
        }

        resolveRatingFromBar(container) {
            if (!(container instanceof Element)) return null;
            const active = container.querySelector('.catch-rating-bar .active[aria-label]');
            if (!(active instanceof Element)) return null;
            return this.ratingKeyFromLabel(active.getAttribute('aria-label'));
        }

        findCatchAlertRatingEl(alert) {
            const bar = alert.querySelector('.catch-rating-bar');
            if (!bar) return null;
            let node = bar.nextElementSibling;
            while (node instanceof Element) {
                if (node.classList.contains('text-xs') && node.classList.contains('text-muted')) break;
                if (node.classList.contains('text-sm')) {
                    const text = node.textContent.trim();
                    if (this.ratingKeyFromLabel(text)) return node;
                }
                node = node.nextElementSibling;
            }
            return null;
        }

        findCatchAlertFishInfoEl(alert) {
            const bar = alert.querySelector('.catch-rating-bar');
            const ratingEl = this.findCatchAlertRatingEl(alert);

            // 游戏 DOM 固定结构：评级条紧邻的上一兄弟节点即为鱼获行
            if (bar?.previousElementSibling instanceof Element) {
                const prev = bar.previousElementSibling;
                if (this.isCatchAlertFishInfoNode(prev, ratingEl)) return prev;
            }

            const headerRow = alert.querySelector('.flex.items-center.gap-sm')?.parentElement;
            if (headerRow?.nextElementSibling instanceof Element) {
                const node = headerRow.nextElementSibling;
                if (this.isCatchAlertFishInfoNode(node, ratingEl)) return node;
            }

            for (const node of alert.querySelectorAll('.text-sm')) {
                if (this.isCatchAlertFishInfoNode(node, ratingEl)) return node;
            }
            for (const node of alert.children) {
                if (this.isCatchAlertFishInfoNode(node, ratingEl)) return node;
            }
            return null;
        }

        findCatchAlertIconEl(alert) {
            const header = alert.querySelector('.flex.items-center.gap-sm');
            return header?.querySelector('svg') ?? null;
        }

        tagCatchAlertIcon(alert) {
            const svg = this.findCatchAlertIconEl(alert);
            if (svg instanceof SVGElement) svg.classList.add('lf-catch-alert-icon');
        }

        applyCatchAlertRatingLabel(ratingEl, displayKey) {
            if (!(ratingEl instanceof Element) || !displayKey) return;
            const meta = this.getRatingMeta(displayKey);
            if (!meta) return;
            if (ratingEl.textContent.trim() !== meta.label) {
                ratingEl.textContent = meta.label;
            }
        }

        tagCatchAlertParts(alert, displayKey = alert?.dataset?.lfRating ?? null) {
            if (!(alert instanceof Element)) return;

            const title = alert.querySelector('strong');
            const fishInfoEl = this.findCatchAlertFishInfoEl(alert);
            const ratingEl = this.findCatchAlertRatingEl(alert);

            alert.querySelectorAll('.lf-catch-alert-title').forEach(el => {
                if (el !== title) el.classList.remove('lf-catch-alert-title');
            });
            alert.querySelectorAll('.lf-catch-alert-fishinfo').forEach(el => {
                if (el !== fishInfoEl) {
                    el.classList.remove('lf-catch-alert-fishinfo');
                    this.clearCatchAlertFishInfoStyle(el);
                }
            });
            alert.querySelectorAll('.lf-catch-alert-rating').forEach(el => {
                if (el !== ratingEl) el.classList.remove('lf-catch-alert-rating');
            });

            if (title) title.classList.add('lf-catch-alert-title');
            if (fishInfoEl) {
                fishInfoEl.classList.add('lf-catch-alert-fishinfo');
                if (displayKey) this.applyCatchAlertFishInfoStyle(fishInfoEl, displayKey);
            }
            if (ratingEl) {
                ratingEl.classList.add('lf-catch-alert-rating');
                this.applyCatchAlertRatingLabel(ratingEl, displayKey);
            }
            this.tagCatchAlertIcon(alert);
            const weightMatch = this.CATCH_BODY_WEIGHT_PATTERN.exec(fishInfoEl?.textContent?.trim() ?? '');
            const weightKg = weightMatch ? Number.parseFloat(weightMatch[1]) : null;
            const score = this.resolveCatchAlertScore(alert, weightKg);
            this.setSpecialCatchMarkBadge(alert, score, ratingEl);
        }

        clearCatchAlertElement(alert) {
            if (!(alert instanceof Element)) return;
            alert.classList.remove('lf-catch-alert', ...this.CATCH_ALERT_FX_CLASSES);
            alert.querySelector(':scope > .lf-catch-marquee-track')?.remove();
            delete alert.dataset.lfRating;
            alert.querySelectorAll(
                '.lf-catch-alert-title, .lf-catch-alert-rating, .lf-catch-alert-fishinfo',
            ).forEach(el => {
                el.classList.remove('lf-catch-alert-title', 'lf-catch-alert-rating', 'lf-catch-alert-fishinfo');
                this.clearCatchAlertFishInfoStyle(el);
            });
            alert.querySelectorAll('.lf-catch-alert-icon').forEach(svg => {
                svg.classList.remove('lf-catch-alert-icon');
            });
            alert.querySelectorAll('.lf-special-mark').forEach(el => el.remove());
        }

        ensureCatchAlertMarqueeTrack(alert) {
            if (!(alert instanceof Element)) return;
            let track = alert.querySelector(':scope > .lf-catch-marquee-track');
            if (track?.childElementCount === 4) return;

            track?.remove();
            track = document.createElement('div');
            track.className = 'lf-catch-marquee-track';
            track.setAttribute('aria-hidden', 'true');
            for (let i = 0; i < 4; i++) {
                const dot = document.createElement('span');
                dot.className = 'lf-catch-marquee-dot';
                track.appendChild(dot);
            }
            alert.insertBefore(track, alert.firstChild);
        }

        applyCatchAlertFx(alert, ratingKey) {
            if (!(alert instanceof Element)) return;
            const fx = this.CATCH_ALERT_FX_PREVIEW[ratingKey]
                ?? this.CATCH_ALERT_FX[ratingKey]
                ?? null;
            alert.classList.remove(...this.CATCH_ALERT_FX_CLASSES);
            if (fx === 'thick') {
                alert.classList.add('lf-catch-fx-thick');
                alert.querySelector(':scope > .lf-catch-marquee-track')?.remove();
            } else if (fx === 'glow') {
                alert.classList.add('lf-catch-fx-thick', 'lf-catch-fx-glow');
                alert.querySelector(':scope > .lf-catch-marquee-track')?.remove();
            } else if (fx === 'marquee') {
                alert.classList.add('lf-catch-fx-thick', 'lf-catch-fx-glow', 'lf-catch-fx-marquee');
                this.ensureCatchAlertMarqueeTrack(alert);
            } else if (fx === 'lava') {
                alert.classList.add('lf-catch-fx-thick', 'lf-catch-fx-glow', 'lf-catch-fx-lava');
                alert.querySelector(':scope > .lf-catch-marquee-track')?.remove();
            } else {
                alert.querySelector(':scope > .lf-catch-marquee-track')?.remove();
            }
        }

        clearCatchAlertRatingStyles(scope) {
            if (!(scope instanceof Element)) return;
            scope.querySelectorAll('.alert').forEach(alert => this.clearCatchAlertElement(alert));
        }

        /** @returns {boolean} 是否已成功着色 */
        styleCatchAlertBox() {
            const alert = this.getCatchAlertBox();
            if (!this.isValidElement(alert)) return false;

            const baseRatingKey = this.resolveRatingFromBar(alert)
                ?? this.ratingKeyFromLabel(this.findCatchAlertRatingEl(alert)?.textContent);
            if (!baseRatingKey) return false;

            const fishInfoEl = this.findCatchAlertFishInfoEl(alert);
            const weightMatch = this.CATCH_BODY_WEIGHT_PATTERN.exec(fishInfoEl?.textContent?.trim() ?? '');
            const weightKg = weightMatch ? Number.parseFloat(weightMatch[1]) : null;
            const score = this.resolveCatchAlertScore(alert, weightKg);
            const displayKey = this.resolveFishingPageRatingKey(baseRatingKey, score);
            const ratingChanged = alert.dataset.lfRating !== displayKey;

            this.getFishingPageRoot()?.querySelectorAll('.lf-catch-alert').forEach(el => {
                if (el !== alert) this.clearCatchAlertElement(el);
            });

            // 仅评级变化时清空，避免重复渲染把鱼获行 inline 样式清掉
            if (ratingChanged) {
                this.clearCatchAlertElement(alert);
            }

            alert.classList.add('lf-catch-alert');
            alert.dataset.lfRating = displayKey;
            this.applyCatchAlertFx(alert, displayKey);
            this.tagCatchAlertParts(alert, displayKey);

            if (score == null && baseRatingKey === 'below_standard') {
                this.scheduleCatchAlertScoreRetry();
            }
            return true;
        }

        scheduleCatchAlertScoreRetry() {
            if (this._catchAlertRetryTimer) clearTimeout(this._catchAlertRetryTimer);
            let attempt = 0;
            const maxAttempts = 20;
            const tick = () => {
                attempt++;
                const alert = this.getCatchAlertBox();
                if (!alert?.isConnected || attempt > maxAttempts) {
                    this._catchAlertRetryTimer = null;
                    return;
                }
                const baseKey = this.resolveRatingFromBar(alert)
                    ?? this.ratingKeyFromLabel(this.findCatchAlertRatingEl(alert)?.textContent);
                const fishInfoEl = this.findCatchAlertFishInfoEl(alert);
                const weightMatch = this.CATCH_BODY_WEIGHT_PATTERN.exec(fishInfoEl?.textContent?.trim() ?? '');
                const weightKg = weightMatch ? Number.parseFloat(weightMatch[1]) : null;
                const score = this.resolveCatchAlertScore(alert, weightKg);
                this.paintCatchAlertFast();
                if (score == null && baseKey === 'below_standard' && attempt < maxAttempts) {
                    this._catchAlertRetryTimer = setTimeout(tick, 100);
                } else {
                    this._catchAlertRetryTimer = null;
                }
            };
            this._catchAlertRetryTimer = setTimeout(tick, 80);
        }

        paintCatchAlertFast() {
            if (!this.getFishingPageRoot()) return;
            this._renderingFishing = true;
            this.pauseFishingObserver();
            try {
                this.styleCatchAlertBox();
            } finally {
                this._renderingFishing = false;
                this.resumeFishingObserver();
            }
        }

        /** 上鱼框优先即时渲染，并在后续帧重试以等待 ratingScore / marker 就绪 */
        scheduleCatchAlertPaint() {
            this.paintCatchAlertFast();
            requestAnimationFrame(() => {
                this.paintCatchAlertFast();
                requestAnimationFrame(() => {
                    this.paintCatchAlertFast();
                    this.scheduleCatchAlertScoreRetry();
                });
            });
        }

        isCatchAlertRelatedMutation(mutations) {
            return mutations.some(mutation => {
                if (mutation.type === 'attributes') {
                    const target = mutation.target;
                    return target instanceof Element
                        && (target.classList?.contains('catch-rating-marker')
                            || target.classList?.contains('catch-rating-bar')
                            || !!target.closest?.('.alert')?.querySelector('.catch-rating-bar'));
                }
                if (mutation.type !== 'childList') return false;
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof Element)) continue;
                    if (node.classList?.contains('catch-rating-bar')) return true;
                    if (node.classList?.contains('catch-rating-marker')) return true;
                    if (node.classList?.contains('alert') && /上鱼/.test(node.textContent ?? '')) return true;
                    if (node.querySelector?.('.catch-rating-bar, .catch-rating-marker')) return true;
                }
                const target = mutation.target;
                if (target instanceof Element && target.closest?.('.alert')?.querySelector('.catch-rating-bar')) {
                    return true;
                }
                return false;
            });
        }

        onFishingDomMutation(mutations) {
            if (this._renderingFishing) return;
            if (this.shouldIgnoreFishingMutation(mutations)) return;
            if (this.isCatchAlertRelatedMutation(mutations)) {
                this.scheduleCatchAlertPaint();
                return;
            }
            this.debouncedFishingSync();
        }

        applyLogCatchMessageStyle(msgEl, ratingKey) {
            if (!(msgEl instanceof Element) || !ratingKey) return;
            const color = this.resolveRatingColor(ratingKey);
            if (!color) return;
            msgEl.style.setProperty('color', color, 'important');
            msgEl.style.setProperty('font-weight', '400', 'important');
        }

        clearLogCatchMessageStyle(msgEl) {
            if (!(msgEl instanceof Element)) return;
            msgEl.style.removeProperty('color');
            msgEl.style.removeProperty('font-weight');
        }

        resetFishingLogMessageFormat(msgEl) {
            if (!(msgEl instanceof Element)) return;
            msgEl.querySelector('.lf-special-mark')?.remove();
            if (!msgEl.querySelector('.lf-log-rating-label')) {
                this.clearLogCatchMessageStyle(msgEl);
                return;
            }
            msgEl.textContent = msgEl.textContent ?? '';
            this.clearLogCatchMessageStyle(msgEl);
        }

        styleLogCatchRatingLabel(msgEl, displayKey, message) {
            if (!(msgEl instanceof Element) || !displayKey || !message) return;
            const meta = this.getRatingMeta(displayKey);
            if (!meta) return;

            const sep = ' · ';
            const lastSep = message.lastIndexOf(sep);
            if (lastSep < 0) return;
            const prefix = message.slice(0, lastSep + sep.length);
            const rawLabel = message.slice(lastSep + sep.length).trim();
            if (!this.ratingKeyFromLabel(rawLabel) && displayKey !== 'exp_baby') return;

            this.applyLogCatchMessageStyle(msgEl, displayKey);

            const existing = msgEl.querySelector('.lf-log-rating-label');
            if (existing?.dataset.rating === displayKey
                && existing.textContent === meta.label
                && msgEl.firstChild?.textContent === prefix) {
                return;
            }

            const span = document.createElement('span');
            span.className = 'lf-log-rating-label';
            span.dataset.rating = displayKey;
            span.textContent = meta.label;
            span.style.setProperty('font-weight', '600', 'important');

            msgEl.replaceChildren(document.createTextNode(prefix), span);
        }

        styleFishingLogItems() {
            const list = this.getFishingLogPanel();
            if (!list) return;

            for (const item of list.querySelectorAll('.fishing-log-item')) {
                const msgEl = item.querySelector('.fishing-log-message');
                const message = msgEl?.textContent?.trim() ?? '';
                if (!this.LOG_CATCH_PATTERN.test(message)) {
                    this.resetFishingLogMessageFormat(msgEl);
                    item.classList.remove('lf-fishing-log-catch');
                    delete item.dataset.lfRating;
                    continue;
                }
                const baseKey = this.parseLogCatchRating(message)
                    ?? msgEl.querySelector('.lf-log-rating-label')?.dataset.rating;
                if (!baseKey) {
                    this.resetFishingLogMessageFormat(msgEl);
                    item.classList.remove('lf-fishing-log-catch');
                    delete item.dataset.lfRating;
                    continue;
                }
                const weightKg = this.parseLogCatchWeight(message);
                const score = this.resolveLogCatchScore(message, weightKg);
                const displayKey = this.resolveFishingPageRatingKey(baseKey, score);
                item.classList.add('lf-fishing-log-catch');
                item.dataset.lfRating = displayKey;
                this.styleLogCatchRatingLabel(msgEl, displayKey, message);
                this.setSpecialCatchMarkBadge(msgEl, score, msgEl.querySelector('.lf-log-rating-label'));
            }
        }

        renderFishingPage() {
            if (!this.getFishingLogPanel()) return;

            this._renderingFishing = true;
            this.pauseFishingObserver();
            try {
                this.styleFishingLogItems();
                this.styleCatchAlertBox();
                this.updateCatchStoreFromFishingLog();
                this.updateFishingBadge();
            } finally {
                this._renderingFishing = false;
                this.resumeFishingObserver();
            }
        }

        estimateCatchValue(fishId, weightKg, score) {
            if (!fishId || !(weightKg > 0)) return null;
            try {
                const price = FishKeepHistory.computePrice({ fishId, weight: weightKg, score: score ?? 50 });
                return price != null && price > 0 ? price : null;
            } catch {
                return null;
            }
        }

        hasPriceSamples() {
            return Object.keys(FishKeepHistory.price ?? {}).length > 0;
        }

        cacheCatchPayloadsFromItems(items) {
            if (!Array.isArray(items)) return;
            for (const item of items) {
                if (!item || !this.isCatchMessageType(item.message_type)) continue;
                const payload = item.payload;
                if (!payload?.fish_id || typeof payload.weight_kg !== 'number') continue;
                const createdMs = Utils.parseMessageTime(item.created_at);
                this.rememberCatchPayload(payload, createdMs, item.title ?? null, item.id);
            }
        }

        normalizeCatchItems(items) {
            if (!Array.isArray(items)) return [];
            return items
                .filter(item => item && !this.EXCLUDED_MESSAGE_TYPES.has(item.message_type))
                .map(item => ({
                    title: item.title,
                    messageType: item.message_type,
                    createdMs: Utils.parseMessageTime(item.created_at),
                }))
                .filter(item => typeof item.createdMs === 'number' && this.isCatchMessageType(item.messageType))
                .sort((a, b) => b.createdMs - a.createdMs);
        }

        updateCatchStoreFromItems(items, source) {
            const catches = this.normalizeCatchItems(items);
            if (catches.length === 0) return;
            this.upsertLastCatch(catches[0].createdMs, source, catches[0].title);
        }

        readCatchStore() {
            try {
                const raw = localStorage.getItem(this.STORAGE_KEY);
                if (!raw) return null;
                const data = JSON.parse(raw);
                if (!data || typeof data !== 'object') return null;
                if (typeof data.lastCatchMs === 'number') return data;
                if (data.lastCatchAt) {
                    const ms = Utils.parseMessageTime(data.lastCatchAt);
                    if (ms != null) return { ...data, lastCatchMs: ms };
                }
                return null;
            } catch {
                return null;
            }
        }

        writeCatchStore(payload) {
            const next = { ...payload, updatedAt: Date.now() };
            try {
                const prev = this.readCatchStore();
                if (prev?.lastCatchMs === next.lastCatchMs) return;
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
                window.dispatchEvent(new CustomEvent('lazyfisher:catch-times-updated'));
            } catch { /* ignore */ }
        }

        upsertLastCatch(catchMs, source, title) {
            if (typeof catchMs !== 'number' || isNaN(catchMs)) return;
            const store = this.readCatchStore();
            if (store?.lastCatchMs && catchMs < store.lastCatchMs) return;
            this.writeCatchStore({
                source,
                lastCatchMs: catchMs,
                lastCatchTitle: title ?? store?.lastCatchTitle ?? null,
            });
        }

        minutesBetween(fromMs, toMs = Date.now()) {
            return Math.max(0, Math.round((toMs - fromMs) / 60000));
        }

        getMessageCards() {
            const list = this.getMessagesCardList();
            return list ? [...list.querySelectorAll('.card.message-card')] : [];
        }

        getTimeText(timeElement) {
            if (!timeElement) return '';
            const clone = timeElement.cloneNode(true);
            clone.querySelectorAll('.catch-extras, .catch-interval, .catch-value-estimate').forEach(el => {
                el.remove();
            });
            for (const node of clone.childNodes) {
                if (node.nodeType !== Node.TEXT_NODE) continue;
                const text = node.textContent.trim();
                if (this.TIME_TEXT_PATTERN.test(text)) return text;
            }
            return clone.textContent.trim();
        }

        /** 清除旧版/其它脚本直接挂在时间行或正文上的重复节点 */
        cleanupLegacyCatchExtras(root) {
            if (!(root instanceof Element)) return;
            root.querySelectorAll(
                '.text-sm.text-muted > .catch-interval, .text-sm.text-muted > .catch-value-estimate',
            ).forEach(el => el.remove());
            for (const timeEl of root.querySelectorAll('.text-xs.text-muted')) {
                timeEl.querySelectorAll(':scope > .catch-interval, :scope > .catch-value-estimate').forEach(el => {
                    el.remove();
                });
                const wraps = timeEl.querySelectorAll(':scope > .catch-extras');
                for (let i = 1; i < wraps.length; i++) wraps[i].remove();
            }
        }

        isOwnCatchExtrasMutation(mutation) {
            const target = mutation.target;
            if (!(target instanceof Element)) return false;
            if (target.classList?.contains('catch-extras')
                || target.classList?.contains('catch-interval')
                || target.classList?.contains('catch-value-estimate')
                || target.classList?.contains('lf-rating-label')) {
                return true;
            }
            if (!!target.closest?.('.catch-extras')) return true;

            for (const node of [...mutation.addedNodes, ...mutation.removedNodes]) {
                if (!(node instanceof Element)) continue;
                if (node.classList?.contains('catch-extras')
                    || node.classList?.contains('catch-interval')
                    || node.classList?.contains('catch-value-estimate')
                    || node.classList?.contains('lf-rating-label')) {
                    return true;
                }
            }
            return false;
        }

        shouldIgnoreMessagesMutation(mutations) {
            return mutations.every(mutation => {
                if (mutation.type !== 'childList') return false;

                const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
                const cardLevel = nodes.some(node => {
                    if (!(node instanceof Element)) return false;
                    return node.classList?.contains('message-card')
                        || node.classList?.contains('card-list')
                        || !!node.querySelector?.('.message-card');
                });
                if (cardLevel) return false;

                // React 重绘会清掉我们注入的节点，此时必须重新渲染
                const removedOurExtras = [...mutation.removedNodes].some(node => {
                    if (!(node instanceof Element)) return false;
                    return node.classList?.contains('catch-extras')
                        || node.classList?.contains('catch-interval')
                        || node.classList?.contains('catch-value-estimate')
                        || node.classList?.contains('lf-rating-label')
                        || !!node.querySelector?.('.catch-extras, .catch-interval, .catch-value-estimate, .lf-rating-label');
                });
                if (removedOurExtras) return false;

                return this.isOwnCatchExtrasMutation(mutation);
            });
        }

        getTimeElement(card) {
            if (!(card instanceof Element)) return null;
            const candidates = [...card.querySelectorAll('.text-xs.text-muted')];
            for (let i = candidates.length - 1; i >= 0; i--) {
                const text = this.getTimeText(candidates[i]);
                if (this.TIME_TEXT_PATTERN.test(text)) return candidates[i];
            }
            for (let i = candidates.length - 1; i >= 0; i--) {
                const text = this.getTimeText(candidates[i]);
                if (/^\d{4}[/-]\d{2}[/-]\d{2}/.test(text)) return candidates[i];
            }
            return null;
        }

        parseCatchCard(card) {
            if (!(card instanceof Element)) return null;
            const titleEl = card.querySelector('.message-title');
            const bodyEl = this.findCatchBodyEl(card);
            if (!titleEl || !bodyEl) return null;

            const title = titleEl.textContent.trim();
            const body = bodyEl.textContent
                .replace(/\s*│\s*鱼口:.*$/g, '')
                .replace(/\s*估价:.*$/g, '')
                .trim();
            const fishName = title.replace(/^上鱼[:：]\s*/, '').trim();
            const weightKg = this.parseCatchBodyWeight(body);
            if (!(weightKg > 0)) return null;

            const score = this.parseCatchBodyScore(body) ?? 50;

            let rating = null;
            for (const [key, meta] of Object.entries(this.RATING_META)) {
                if (new RegExp(`%\\s+${meta.label}(\\s·|$)`).test(body)) {
                    rating = key;
                    break;
                }
            }

            return {
                fishName,
                weightKg,
                score: Number.isFinite(score) ? score : 50,
                rating,
                bodyEl,
            };
        }

        findCatchBodyEl(card) {
            for (const el of card.querySelectorAll('.text-sm.text-muted')) {
                const text = el.textContent ?? '';
                if (/%/.test(text) && /kg/i.test(text)) return el;
            }
            return card.querySelector('.text-sm.text-muted');
        }

        resolveCatchPayload(card, parsed) {
            if (!(card instanceof Element)) return null;
            const messageId = card.getAttribute('data-message-id') ?? card.dataset.messageId;
            if (messageId && this.catchPayloadCache.has(`id:${messageId}`)) {
                return this.catchPayloadCache.get(`id:${messageId}`);
            }

            const timeElement = this.getTimeElement(card);
            const createdMs = timeElement && Utils.parseMessageTime(this.getTimeText(timeElement));
            const title = card.querySelector('.message-title')?.textContent?.trim() ?? '';
            if (typeof createdMs === 'number') {
                const cached = this.catchPayloadCache.get(`${createdMs}|${title}`);
                if (cached) return cached;
            }

            if (!parsed) return null;
            const fishId = this.resolveFishId(parsed.fishName);
            if (!fishId) return null;
            return { fishId, weightKg: parsed.weightKg, score: parsed.score, rating: parsed.rating };
        }

        resolveRatingKey(card, payload, parsed) {
            let baseKey = null;
            if (payload?.rating && this.RATING_META[payload.rating]) {
                baseKey = payload.rating;
            }

            const bodyEl = parsed?.bodyEl ?? this.findCatchBodyEl(card);
            if (!baseKey && bodyEl instanceof Element) {
                if (!baseKey) {
                    const text = bodyEl.textContent ?? '';
                    for (const [key, meta] of Object.entries(this.RATING_META)) {
                        if (new RegExp(`%\\s+${meta.label}(\\s·|$)`).test(text)) {
                            baseKey = key;
                            break;
                        }
                    }
                }
                if (!baseKey) {
                    const cached = bodyEl.querySelector('.lf-rating-label')?.dataset.rating;
                    if (cached && this.RATING_META[cached]) baseKey = cached;
                }
            }

            if (!baseKey) {
                const active = card.querySelector?.('.catch-rating-bar .active[aria-label]');
                if (active instanceof Element) {
                    baseKey = this.ratingKeyFromLabel(active.getAttribute('aria-label'));
                }
            }

            const bodyText = bodyEl instanceof Element ? (bodyEl.textContent ?? '') : '';
            const score = payload?.score
                ?? parsed?.score
                ?? this.parseCatchBodyScore(bodyText);
            return baseKey ? this.resolveDisplayRatingKey(baseKey, score) : null;
        }

        clearCatchMessageCardStyle(card) {
            if (!(card instanceof Element)) return;
            card.classList.remove('lf-catch-message-card');
            delete card.dataset.lfRating;
        }

        styleCatchMessageCard(card, displayKey) {
            if (!(card instanceof Element)) return;
            if (!displayKey) {
                this.clearCatchMessageCardStyle(card);
                return;
            }
            card.classList.add('lf-catch-message-card');
            card.dataset.lfRating = displayKey;
        }

        styleCatchRatingBody(card, displayKey, parsed) {
            const bodyEl = parsed?.bodyEl ?? this.findCatchBodyEl(card);
            if (!this.isValidElement(bodyEl)) return;

            const key = displayKey
                ?? this.resolveRatingKey(card, this.resolveCatchPayload(card, parsed), parsed);
            const meta = this.getRatingMeta(key);
            if (!meta) return;

            const existing = bodyEl.querySelector('.lf-rating-label');
            if (existing?.dataset.rating === key && existing.textContent === meta.label) return;

            const raw = bodyEl.textContent ?? '';
            const labels = Object.values(this.RATING_META)
                .map(m => m.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            const regex = new RegExp(`( · [\\d.]+% )(${labels.join('|')})( · )`);
            const match = regex.exec(raw);
            if (!match) return;

            const span = document.createElement('span');
            span.className = 'lf-rating-label';
            span.dataset.rating = key;
            span.textContent = meta.label;
            const color = this.resolveRatingColor(key);
            if (color) span.style.setProperty('color', color, 'important');

            bodyEl.replaceChildren(
                document.createTextNode(raw.slice(0, match.index) + match[1]),
                span,
                document.createTextNode(match[3] + raw.slice(match.index + match[0].length)),
            );
        }

        ensureCatchExtras(timeElement, intervalMinutes, estimateLabel) {
            if (!this.isValidElement(timeElement)) return;

            // 清理旧版直接挂在 timeElement 下的残留节点
            timeElement.querySelectorAll(':scope > .catch-interval, :scope > .catch-value-estimate').forEach(el => {
                el.remove();
            });

            let wrap = timeElement.querySelector(':scope > .catch-extras');
            const needInterval = intervalMinutes != null;
            const needEstimate = estimateLabel != null;

            if (!needInterval && !needEstimate) {
                wrap?.remove();
                return;
            }

            // 如果已有 wrap 但内容要变，重建以保证鱼口在前、估价在后
            if (wrap) {
                const hasInterval = !!wrap.querySelector('.catch-interval');
                const hasEstimate = !!wrap.querySelector('.catch-value-estimate');
                // 单元素→双元素切换，或前一帧只有估价没有鱼口，都重建
                if ((hasEstimate && !hasInterval && needInterval)
                    || (hasInterval && !hasEstimate && needEstimate)) {
                    wrap.remove();
                    wrap = null;
                }
            }

            if (!wrap) {
                wrap = document.createElement('span');
                wrap.className = 'catch-extras';
                timeElement.appendChild(wrap);
            }

            let intervalSpan = wrap.querySelector('.catch-interval');
            let estimateSpan = wrap.querySelector('.catch-value-estimate');

            if (needInterval) {
                const text = typeof intervalMinutes === 'number'
                    ? ` │ 鱼口: ${intervalMinutes}分钟`
                    : ` │ 鱼口: ${intervalMinutes}`;
                if (!intervalSpan) {
                    intervalSpan = document.createElement('span');
                    intervalSpan.className = 'catch-interval text-xs text-muted';
                    // 鱼口始终插在最前面
                    wrap.insertBefore(intervalSpan, wrap.firstChild);
                }
                if (intervalSpan.textContent !== text) intervalSpan.textContent = text;
            } else {
                intervalSpan?.remove();
            }

            if (needEstimate) {
                if (!estimateSpan) {
                    estimateSpan = document.createElement('span');
                    estimateSpan.className = 'catch-value-estimate text-xs text-muted';
                    wrap.appendChild(estimateSpan);
                }
                estimateSpan.style.marginLeft = needInterval ? '1.5em' : '0';
                if (estimateSpan.textContent !== estimateLabel.text) {
                    estimateSpan.textContent = estimateLabel.text;
                }
                estimateSpan.title = estimateLabel.title ?? '';
            } else {
                estimateSpan?.remove();
            }

            if (!wrap.querySelector('.catch-interval') && !wrap.querySelector('.catch-value-estimate')) {
                wrap.remove();
            }
        }

        renderMessagesPage() {
            if (this._renderingMessages) return;
            const list = this.getMessagesCardList();
            if (!list) return;

            const cards = this.getMessageCards();
            if (cards.length === 0) return;

            this._renderingMessages = true;
            this.pauseMessagesObserver();
            try {
                this.cleanupLegacyCatchExtras(list);

                const catchMessages = [];
                for (const card of cards) {
                    if (!this.isCatchMessageCard(card)) continue;
                    const timeElement = this.getTimeElement(card);
                    if (!this.isValidElement(timeElement)) continue;
                    const ms = Utils.parseMessageTime(this.getTimeText(timeElement));
                    if (ms == null) continue;
                    const parsed = this.parseCatchCard(card);
                    const payload = this.resolveCatchPayload(card, parsed);
                    catchMessages.push({ timeElement, timestamp: ms, payload });
                }

                const intervalMap = new Map();
                for (let i = 0; i < catchMessages.length - 1; i++) {
                    const current = catchMessages[i];
                    const previous = catchMessages[i + 1];
                    intervalMap.set(
                        current.timeElement,
                        this.minutesBetween(previous.timestamp, current.timestamp),
                    );
                }

                for (const entry of catchMessages) {
                    const mins = intervalMap.get(entry.timeElement);
                    const intervalMinutes = mins != null ? mins : '未知';
                    const estimateLabel = this.getEstimateLabel(entry.payload);
                    this.ensureCatchExtras(entry.timeElement, intervalMinutes, estimateLabel);
                }

                for (const card of cards) {
                    if (!this.isCatchMessageCard(card)) {
                        this.clearCatchMessageCardStyle(card);
                        continue;
                    }
                    const parsed = this.parseCatchCard(card);
                    const payload = this.resolveCatchPayload(card, parsed);
                    const displayKey = this.resolveRatingKey(card, payload, parsed);
                    this.styleCatchMessageCard(card, displayKey);
                    this.styleCatchRatingBody(card, displayKey, parsed);
                    this.applySpecialCatchMark(card, parsed);
                }

                this.updateCatchStoreFromDomCards(cards);
            } finally {
                this._renderingMessages = false;
                this.resumeMessagesObserver();
            }
        }

        updateCatchStoreFromDomCards(cards) {
            let newestMs = null;
            let newestTitle = null;
            for (const card of cards) {
                if (!this.isCatchMessageCard(card)) continue;
                const timeElement = this.getTimeElement(card);
                const ms = timeElement && Utils.parseMessageTime(this.getTimeText(timeElement));
                if (ms == null) continue;
                if (newestMs === null || ms > newestMs) {
                    newestMs = ms;
                    newestTitle = card.querySelector('.message-title')?.textContent?.trim() ?? null;
                }
            }
            if (newestMs !== null) this.upsertLastCatch(newestMs, 'messages-dom', newestTitle);
        }

        updateCatchStoreFromFishingLog() {
            const list = this.getFishingLogPanel();
            if (!list) return;

            const now = new Date();
            let newestMs = null;
            let newestTitle = null;

            for (const item of list.querySelectorAll('.fishing-log-item')) {
                const message = item.querySelector('.fishing-log-message')?.textContent?.trim() ?? '';
                if (!this.LOG_CATCH_PATTERN.test(message)) continue;

                const timeText = item.querySelector('.fishing-log-time')?.textContent?.trim() ?? '';
                const match = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(timeText);
                if (!match) continue;

                const catchDate = new Date(
                    now.getFullYear(), now.getMonth(), now.getDate(),
                    Number(match[1]), Number(match[2]), Number(match[3]),
                );
                if (catchDate.getTime() - now.getTime() > 12 * 60 * 60 * 1000) {
                    catchDate.setDate(catchDate.getDate() - 1);
                }

                const ms = catchDate.getTime();
                if (newestMs === null || ms > newestMs) {
                    newestMs = ms;
                    newestTitle = message;
                }
            }

            if (newestMs !== null) this.upsertLastCatch(newestMs, 'fishing-log', newestTitle);
        }

        findFishingLogTitle() {
            const list = document.querySelector('.fishing-log-list');
            if (!list) return null;
            const header = list.previousElementSibling;
            if (!header) return null;
            for (const span of header.querySelectorAll('span')) {
                if (span.classList.contains('lf-catch-since')) continue;
                if (span.textContent.trim() === '日志') return span;
            }
            return null;
        }

        updateFishingBadge() {
            const titleSpan = this.findFishingLogTitle();
            if (!this.isValidElement(titleSpan)) {
                this.badgeElement = null;
                this.lastBadgeMinutes = null;
                this.lastBadgePenalty = null;
                return;
            }

            const store = this.readCatchStore();
            if (!store?.lastCatchMs) {
                this.badgeElement?.remove();
                this.badgeElement = null;
                this.lastBadgeMinutes = null;
                this.lastBadgePenalty = null;
                return;
            }

            const diffMinutes = this.minutesBetween(store.lastCatchMs);
            if (!this.isValidElement(this.badgeElement)) {
                this.badgeElement = titleSpan.parentElement?.querySelector('.lf-catch-since') ?? null;
            }
            if (!this.isValidElement(this.badgeElement)) {
                this.badgeElement = document.createElement('span');
                this.badgeElement.className = 'lf-catch-since text-xs text-muted';
                titleSpan.insertAdjacentElement('afterend', this.badgeElement);
            }
            if (!this.isValidElement(this.badgeElement)) return;

            if (this.lastBadgeMinutes !== diffMinutes || this.lastBadgePenalty !== (diffMinutes > 10)) {
                this.lastBadgePenalty = diffMinutes > 10;
                if (diffMinutes > 10) {
                    this.badgeElement.textContent = ` │ 正在罚站 ${diffMinutes}分钟`;
                    this.badgeElement.style.color = '#ef4444';
                    this.badgeElement.style.fontWeight = '600';
                    this.badgeElement.classList.remove('text-muted');
                } else {
                    this.badgeElement.textContent = ` │ 上次鱼口: ${diffMinutes}分钟前`;
                    this.badgeElement.style.color = '';
                    this.badgeElement.style.fontWeight = '';
                    this.badgeElement.classList.add('text-muted');
                }
                this.lastBadgeMinutes = diffMinutes;
            }
            if (store.lastCatchTitle) {
                this.badgeElement.title = `最近上鱼：${store.lastCatchTitle}`;
            }
        }

        refreshFishingPanel() {
            this.safeRun(this.renderFishingPage);
        }

        onMessagesPage(items) {
            if (!items) return;
            this.cacheCatchPayloadsFromItems(items);
            this.updateCatchStoreFromItems(items, 'ws:get_messages_page');
            if (this.getFishingLogPanel()) {
                this.scheduleCatchAlertPaint();
                this.debouncedFishingSync();
            }
            if (this.getMessagesCardList()) this.debouncedMessageRender();
        }

        onCatchPush(item) {
            if (!item || !this.isCatchMessageType(item.message_type) || !item.created_at) return;
            const ms = Utils.parseMessageTime(item.created_at);
            if (item.payload) this.rememberCatchPayload(item.payload, ms, item.title ?? null, item.id);
            this.cacheCatchPayloadsFromItems([item]);
            if (ms == null) return;
            this.upsertLastCatch(ms, 'ws:push', item.title ?? null);
            if (this.getFishingLogPanel()) {
                this.scheduleCatchAlertPaint();
                this.debouncedFishingSync();
            }
            if (this.getMessagesCardList()) this.debouncedMessageRender();
        }

        teardownMessagesObserver() {
            this.messagesObserver?.disconnect();
            this.messagesObserver = null;
            this.messagesObserverTarget = null;
        }

        pauseMessagesObserver() {
            this.messagesObserver?.disconnect();
        }

        resumeMessagesObserver() {
            if (this.messagesObserver && this.messagesObserverTarget?.isConnected) {
                this.messagesObserver.observe(this.messagesObserverTarget, { childList: true, subtree: true });
            }
        }

        tryAttachMessages() {
            const list = this.getMessagesCardList();
            if (!list) {
                this.teardownMessagesObserver();
                return false;
            }

            const targetStale = this.messagesObserverTarget
                && (this.messagesObserverTarget !== list
                    || !this.messagesObserverTarget.isConnected
                    || !this.isVisibleElement(this.messagesObserverTarget));

            const needSetup = !this.messagesObserver || targetStale;

            if (needSetup) {
                this.teardownMessagesObserver();
                this.messagesObserverTarget = list;
                this.messagesObserver = new MutationObserver((mutations) => {
                    if (this._renderingMessages) return;
                    if (this.shouldIgnoreMessagesMutation(mutations)) return;
                    this.debouncedMessageRender();
                });
                this.messagesObserver.observe(list, { childList: true, subtree: true });
            }

            this.safeRun(this.renderMessagesPage);
            return true;
        }

        teardownFishingObserver() {
            this.fishingObserver?.disconnect();
            this.fishingObserver = null;
            this.fishingObserverTarget = null;
            this.badgeElement = null;
            this.lastBadgeMinutes = null;
            this.lastBadgePenalty = null;
        }

        pauseFishingObserver() {
            this.fishingObserver?.disconnect();
        }

        resumeFishingObserver() {
            if (this.fishingObserver && this.fishingObserverTarget?.isConnected) {
                this.fishingObserver.observe(this.fishingObserverTarget, { childList: true, subtree: true });
            }
        }

        isOwnFishingEnhancementMutation(mutation) {
            const target = mutation.target;
            if (!(target instanceof Element)) return false;
            if (target.classList?.contains('lf-fishing-log-catch')
                || target.classList?.contains('lf-catch-alert')
                || target.classList?.contains('lf-catch-marquee-track')
                || target.classList?.contains('lf-catch-marquee-dot')
                || target.classList?.contains('lf-catch-alert-title')
                || target.classList?.contains('lf-catch-alert-rating')
                || target.classList?.contains('lf-catch-alert-fishinfo')
                || target.classList?.contains('lf-log-rating-label')
                || target.classList?.contains('lf-catch-alert-icon')) {
                return true;
            }
            for (const node of [...mutation.addedNodes, ...mutation.removedNodes]) {
                if (!(node instanceof Element)) continue;
                if (node.classList?.contains('lf-fishing-log-catch')
                    || node.classList?.contains('lf-catch-alert')
                    || node.classList?.contains('lf-catch-marquee-track')
                    || node.classList?.contains('lf-catch-marquee-dot')
                    || node.classList?.contains('lf-log-rating-label')
                    || node.dataset?.lfRating
                    || node.dataset?.lfFishinfoRating) {
                    return true;
                }
            }
            return false;
        }

        shouldIgnoreFishingMutation(mutations) {
            return mutations.every(mutation => {
                if (mutation.type !== 'childList') return false;
                const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
                const pageLevel = nodes.some(node => {
                    if (!(node instanceof Element)) return false;
                    return node.classList?.contains('fishing-log-list')
                        || node.classList?.contains('page-wrapper')
                        || !!node.querySelector?.('.fishing-log-list, .catch-rating-bar');
                });
                if (pageLevel) return false;

                const removedOurs = [...mutation.removedNodes].some(node => {
                    if (!(node instanceof Element)) return false;
                    return node.classList?.contains('lf-fishing-log-catch')
                        || node.classList?.contains('lf-catch-alert')
                        || node.classList?.contains('lf-catch-alert-title')
                        || node.classList?.contains('lf-catch-alert-rating')
                        || node.classList?.contains('lf-catch-alert-fishinfo')
                        || node.classList?.contains('lf-log-rating-label')
                        || node.classList?.contains('lf-catch-alert-icon')
                        || !!node.querySelector?.('.lf-catch-alert, .lf-fishing-log-catch, .lf-catch-alert-icon');
                });
                if (removedOurs) return false;

                return this.isOwnFishingEnhancementMutation(mutation);
            });
        }

        tryAttachFishing() {
            const list = this.getFishingLogPanel();
            if (!list) {
                this.teardownFishingObserver();
                return false;
            }

            const observeTarget = this.getFishingPageRoot() ?? list;
            const needSetup = !this.fishingObserver
                || this.fishingObserverTarget !== observeTarget
                || !observeTarget.isConnected;

            if (needSetup) {
                this.teardownFishingObserver();
                this.fishingObserverTarget = observeTarget;
                this.fishingObserver = new MutationObserver((mutations) => {
                    this.onFishingDomMutation(mutations);
                });
                this.fishingObserver.observe(observeTarget, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style', 'class', 'aria-label'],
                });
            }

            this.safeRun(this.renderFishingPage);
            this.scheduleCatchAlertPaint();
            return true;
        }

        constructor() {
            this.debouncedMessageRender = this.debounce(() => {
                const list = this.getMessagesCardList();
                if (!list) return;
                if (!this.messagesObserver
                    || this.messagesObserverTarget !== list
                    || !this.messagesObserverTarget?.isConnected
                    || !this.isVisibleElement(this.messagesObserverTarget)) {
                    this.tryAttachMessages();
                } else {
                    this.safeRun(this.renderMessagesPage);
                }
            }, 600);
            this.debouncedFishingSync = this.debounce(
                () => this.safeRun(this.renderFishingPage), 250);

            ActionResultHandler.addListener('get_messages_page', msg => {
                this.onMessagesPage(msg.data?.items);
            });

            MessageHandler.addListener('action_result', msg => {
                this.onCatchPush(msg.data?.item ?? msg.data?.message);
            }, 50);

            MessageHandler.addListener('any', msg => {
                this.ingestCatchPayloadFromWs(msg);
            }, -45);

            MessageHandler.addListener('any', msg => {
                if (msg.type !== 'action_result') return;
                const data = msg.data;
                if (!data) return;
                const items = data.items ?? data.messages;
                if (!Array.isArray(items)) return;
                if (!items.some(i => this.isCatchMessageType(i?.message_type))) return;
                this.cacheCatchPayloadsFromItems(items);
            }, -50);

            window.addEventListener('lazyfisher:catch-times-updated', () => {
                if (this.getFishingLogPanel()) this.safeRun(this.updateFishingBadge);
            });

            window.addEventListener('storage', (event) => {
                if (event.key === this.STORAGE_KEY && this.getFishingLogPanel()) {
                    this.safeRun(this.updateFishingBadge);
                }
                if (event.key === LocalStorageName && this.getMessagesCardList()) {
                    this.debouncedMessageRender();
                }
            });

            // 路由监听：SPA 切页时立刻响应，不等轮询
            let _routeDebounceTimer = null;
            const _routeObserver = new MutationObserver(() => {
                clearTimeout(_routeDebounceTimer);
                _routeDebounceTimer = setTimeout(() => {
                    this.tryAttachMessages();
                    this.tryAttachFishing();
                    if (this.getFishingLogPanel()) this.safeRun(this.renderFishingPage);
                }, 200);
            });

            DomRetry.onReady(() => {
                _routeObserver.observe(document.body, { childList: true, subtree: true });
                this.tryAttachMessages();
                this.tryAttachFishing();
                setInterval(() => {
                    const list = this.getMessagesCardList();
                    if (list && (
                        !this.messagesObserverTarget
                        || this.messagesObserverTarget !== list
                        || !this.messagesObserverTarget.isConnected
                        || !this.isVisibleElement(this.messagesObserverTarget)
                    )) {
                        this.tryAttachMessages();
                    }
                    if (!this.fishingObserverTarget?.isConnected) this.tryAttachFishing();
                    else if (this.getFishingLogPanel()) this.safeRun(this.renderFishingPage);
                }, 10000);
            });
        }
    };

    //#endregion


    //#region EquipmentEnhance

    const EquipmentEnhance = new class {
        /** 渔轮卡片增强：显示锁轮拉力和初始收线速度 */
        enhanceReelCard(card) {
            if (card.dataset.llReelEnhanced) return;
            const statsContainer = card.querySelector('.loadout-slot-stats');
            if (!statsContainer) return;

            const dragSpan = [...statsContainer.querySelectorAll('span')].find(s =>
                s.textContent.includes('最大摩擦力') && /\d/.test(s.textContent));
            const speedSpan = [...statsContainer.querySelectorAll('span')].find(s =>
                s.textContent.includes('最大收线速度') && /\d/.test(s.textContent));
            const gearSpan = [...statsContainer.querySelectorAll('span')].find(s =>
                s.textContent.includes('齿比') && /\d/.test(s.textContent));

            const dragMatch = dragSpan?.textContent.match(/最大摩擦力\s+([\d.]+)/);
            const speedMatch = speedSpan?.textContent.match(/最大收线速度\s+([\d.]+)/);
            const gearMatch = gearSpan?.textContent.match(/齿比\s+([\d.]+)/);

            let lockValue = null, lineSpeed = null;
            if (dragMatch) lockValue = (parseFloat(dragMatch[1]) * 1.5).toFixed(1);
            if (speedMatch && gearMatch) {
                lineSpeed = ((parseFloat(speedMatch[1]) / 2.375) * (parseFloat(gearMatch[1]) / 2.3)).toFixed(2);
            }

            if (lockValue !== null || lineSpeed !== null) {
                const span = document.createElement('span');
                let html = '';
                if (lockValue !== null) html += `<span style="color:#64748B;font-weight:bold;">锁轮: ${lockValue} kg</span>`;
                if (lineSpeed !== null) {
                    if (lockValue !== null) html += '  ';
                    html += `<span style="color:#64748B;font-weight:bold;">初速: ${lineSpeed} m/s</span>`;
                }
                span.innerHTML = html;
                statsContainer.appendChild(span);
            }
            card.dataset.llReelEnhanced = '1';
        }

        enhanceAllReels() {
            document.querySelectorAll('.loadout-slot').forEach(c => this.enhanceReelCard(c));
        }

        constructor() {
            DomRetry.onReady(() => {
                DomRetry.until(() => {
                    this.enhanceAllReels();
                    return true;
                }, 500, 10);

                const observer = new MutationObserver(
                    Utils.debounce ? Utils.debounce(() => this.enhanceAllReels(), 400) : () => this.enhanceAllReels()
                );
                observer.observe(document.body, { childList: true, subtree: true });
            });
        }
    };

    //#endregion


    /**************************************** LOCAL TEST ****************************************/

    function LOCAL() {
        MessageHandler.handleMessageRecv(JSON.stringify(_gameData));
        FishKeepHistoryUi.showPopup();
    }
    if (typeof LOCAL_ENABLED != 'undefined') LOCAL();
})();
    }
} catch (error) {
    console.error('[LazyFisher ???] LazyFisher信息增强 ????', error);
}


// ============================================================================
// Module: lazyfisher辅助增强(公开版)
// Source: Base/lazyfisher辅助增强(公开版)-2.6.1.txt
// Default: enabled
// ============================================================================
try {
    if (window.LazyFisherMerged?.isEnabled('publicEnhance')) {
(function() {
    'use strict';

    /** 合并 DOM 监听回调，降低 MutationObserver 高频触发开销 */
    function lfDebounce(fn, waitMs = 150) {
        let timer = null;
        return function debounced(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), waitMs);
        };
    }

const FISH_DATABASE_COMPRESSED = "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";
let _fishDatabaseItems = null;
function getFishDatabaseItems() {
    if (_fishDatabaseItems) return _fishDatabaseItems;
    if (typeof LZString === 'undefined') {
        console.warn('[LazyFisher] LZString 未加载，鱼种库不可用');
        _fishDatabaseItems = [];
        return _fishDatabaseItems;
    }
    try {
        _fishDatabaseItems = JSON.parse(LZString.decompressFromBase64(FISH_DATABASE_COMPRESSED));
    } catch (e) {
        console.warn('[LazyFisher] 鱼种库解析失败', e);
        _fishDatabaseItems = [];
    }
    return _fishDatabaseItems;
}
if (typeof window !== 'undefined') {
    window.LazyFisherFishDb = { getItems: getFishDatabaseItems };
}


    // ============================================================
    // 功能开关管理
    // ============================================================
    const FEATURES = [
        { id: 'lureSoftness',   name:'路亚软竿惩罚系数' },
        { id: 'fishSort',       name: '区域探查鱼群排序' },
        { id: 'boatSort',       name: '可上船只列表排序' },
        { id: 'waterLayer',     name: '鱼群水层显示' },
        { id: 'fishLogColor',   name: '钓鱼日志染色' },
        { id: 'fishStaminaUI', name: '鱼体力UI增强' },
        { id: 'catchInterval',  name: '鱼口时间计算' },
        { id: 'dynamicBorder', name: '实时状态动态边框' },
        { id: 'reelEnhance',    name: '渔轮装备参数增强' },
        { id: 'shopCardEnhance',name: '商店渔轮数增强' },
        { id: 'assemblySim',    name: '装配台模拟器' },
        { id: 'announceLogger', name: '公告记录器' },
        { id: 'fishCardGradeColor', name: '鱼获卡片背景染色' },
        { id: 'fishCardGlow', name: '鱼获卡片动态辉光' },
        { id: 'challengeFishInfo', name: '高难挑战鱼种资料' },
        { id: 'realtimeChart', name: '钓鱼实时波动图' },
        { id: 'fishWeightGlow', name: '区域鱼获重量光晕' },
        { id: 'weeklyTarget',   name: '本周目标鱼场地' },
        { id: 'catchSummary', name: '上鱼记录统计' },
    ];
    const FEATURE_DEFAULTS = {
        lureSoftness: false,
        dynamicBorder: false,
        reelEnhance: false,
        shopCardEnhance: false,
        assemblySim: false,
        announceLogger: false,
        fishCardGlow: false,
        realtimeChart: false,
    };
    // 信息增强已实现这些功能，公开版同名模块需让位，避免重复渲染/反复闪烁
    const INFO_ENHANCE_TAKEOVER = {
        catchInterval: '鱼口时间计算',
        fishSort: '区域探查鱼群排序',
    };
    function isEnabled(featureId) {
        if (isHandledByInfoEnhance(featureId)) {
            return false;
        }
        const val = GM_getValue('feat_' + featureId);
        if (val !== undefined) return val;
        return featureId in FEATURE_DEFAULTS ? FEATURE_DEFAULTS[featureId] : true;
    }
    function isHandledByInfoEnhance(featureId) {
        return !!INFO_ENHANCE_TAKEOVER[featureId] && !!window.LazyFisherMerged?.isEnabled('infoEnhance');
    }
    function setFeatureEnabled(featureId, enabled) {
        GM_setValue('feat_' + featureId, enabled);
    }
    function toggleFeature(featureId) {
        if (isHandledByInfoEnhance(featureId)) return;
        setFeatureEnabled(featureId, !isEnabled(featureId));
    }

    window.LazyFisherMerged?.registerFeatureSettings?.({
        features: FEATURES,
        isEnabled,
        setEnabled: setFeatureEnabled,
        isHandledByInfoEnhance,
        getTakeoverLabel: (id) => INFO_ENHANCE_TAKEOVER[id] ?? id,
    });
// 1.路亚软竿惩罚系数模块
function initLureSoftness() {
        (function LureSoftnessModule() {
            const CONFIG = {
                H_TARGETS: {
                    'bottom_hop': 7.2,
                    'mid_twitch': 8.0
                },
                CHECK_INTERVAL_MS: 500,
                PANEL_ID: 'rf4-lure-penalty-panel',
            };
            function extractRodHardness() {
                const slotTitles = document.querySelectorAll('.loadout-slot-title');
                for (const title of slotTitles) {
                    if (title.textContent.includes('鱼竿')) {
                        const rodSlot = title.closest('.loadout-slot');
                        if (!rodSlot) return null;
                        const stats = rodSlot.querySelectorAll('.loadout-summary-stats span');
                        for (const stat of stats) {
                            if (stat.textContent.includes('硬度')) {
                                const match = stat.textContent.match(/[\d.]+/);
                                return match ? parseFloat(match[0]) : null;
                            }
                        }
                    }
                }
                return null;
            }
            function extractCurrentAction() {
                const controlSummary = document.querySelector('.loadout-control-summary');
                if (!controlSummary) return null;
                const spans = controlSummary.querySelectorAll('span');
                for (const span of spans) {
                    const text = span.textContent.trim();
                    if (text.includes('底层跳动')) return 'bottom_hop';
                    if (text.includes('中层抽动')) return 'mid_twitch';
                }
                return null;
            }
            function calculatePenalty(action, hardness) {
                if (!action || hardness === null || isNaN(hardness)) return null;
                const hTarget = CONFIG.H_TARGETS[action];
                if (hTarget <= 4.0 || hardness <= 4.0) return null;
                const rhoSoft = Math.max(0, Math.min(1, (hTarget - hardness) / (hTarget - 4.0)));
                return Math.max(0.65, Math.min(1.0, 1 - 0.35 * rhoSoft));
            }
            function getOrCreatePanel() {
                let panel = document.getElementById(CONFIG.PANEL_ID);
                if (panel) return panel;
                const summaryNode = document.querySelector('.equipment-selection-summary');
                if (!summaryNode) return null;
                panel = document.createElement('div');
                panel.id = CONFIG.PANEL_ID;
                panel.className = 'equipment-selection-summary';
                panel.innerHTML =
                    `<div class="equipment-selection-summary-block">
                        <div class="text-sm text-muted">软竿惩罚</div>
                        <div class="equipment-selection-summary-value" id="rf4-gamma">--</div>
                    </div>
                    <div class="equipment-selection-summary-block">
                        <div class="text-sm text-muted">状态</div>
                        <div class="equipment-selection-summary-value" id="rf4-status">等待数据</div>
                    </div>`;
                summaryNode.parentNode.insertBefore(panel, summaryNode.nextSibling);
                return panel;
            }
            function updateUI(gamma) {
                const panel = getOrCreatePanel();
                if (!panel) return;
                const valEl = document.getElementById('rf4-gamma');
                const stEl = document.getElementById('rf4-status');
                if (gamma === null) {
                    panel.style.display = 'none';
                    return;
                }
                panel.style.display = '';
                valEl.textContent = gamma.toFixed(2);
                valEl.style.color = '';
                stEl.style.color = '';
                if (gamma === 1.0) {
                    stEl.textContent = '无惩罚';
                } else if (gamma >= 0.8) {
                    stEl.textContent = '轻微惩罚';
                    valEl.style.color = '#f0ad4e';
                } else if (gamma >= 0.65) {
                    stEl.textContent = '严重惩罚';
                    valEl.style.color = '#d9534f';
                } else {
                    stEl.textContent = '上限惩罚';
                    valEl.style.color = '#d9534f';
                }
            }
            let lastAction = null, lastHardness = null;
            function tick() {
                const action = extractCurrentAction();
                const hardness = extractRodHardness();
                if (action !== lastAction || hardness !== lastHardness) {
                    lastAction = action;
                    lastHardness = hardness;
                    updateUI(calculatePenalty(action, hardness));
                }
            }
            setTimeout(() => { tick(); setInterval(tick, CONFIG.CHECK_INTERVAL_MS); }, 1000);
        })();
    }
// 2.区域探查鱼群排序
function initFishSort() {
    (function() {
        'use strict';

        const SORT_MODES = {
            WEIGHT_DESC:   'weight_desc',
            WEIGHT_ASC:    'weight_asc',
            WATER_LAYER:   'water_layer',
            BAIT_TYPE:     'bait_type',
            LURE_TYPE:     'lure_type',
        };

        const SORT_MODE_LABELS = {
            [SORT_MODES.WEIGHT_DESC]:  '重量▼',
            [SORT_MODES.WEIGHT_ASC]:   '重量▲',
            [SORT_MODES.WATER_LAYER]:  '水层',
            [SORT_MODES.BAIT_TYPE]:    '真饵',
            [SORT_MODES.LURE_TYPE]:    '拟饵',
        };

        const WATER_LAYER_ORDER = { '上层': 0, '中层': 1, '下层': 2 };
        const LOCK_POSITION = { TOP: 'top', BOTTOM: 'bottom' };
        const STORAGE_KEY = 'fish_sorter_prefs';

        // 深海夜幕主题配色
const THEME = {
    panelBg:          'rgba(248, 250, 252, 0.75)',
    panelBorder:      'rgba(56, 189, 248, 0.25)',
    labelColor:       '#334155',
    btnDefaultBg:     'rgba(241, 245, 249, 0.6)',
    btnDefaultColor:  '#334155',
    btnDefaultBorder: 'rgba(148, 163, 184, 0.5)',
    btnActiveBg:      '#1e40af',
    btnActiveColor:   '#ffffff',
    btnActiveBorder:  '#1e40af',
    sepColor:         'rgba(148, 163, 184, 0.4)',
};

        class SortPrefsStore {
            static load() {
                try {
                    const raw = localStorage.getItem(STORAGE_KEY);
                    if (raw) return JSON.parse(raw);
                } catch (e) {}
                return { sortMode: SORT_MODES.WEIGHT_DESC, lockPosition: LOCK_POSITION.BOTTOM };
            }
            static save(prefs) {
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) {}
            }
        }

        class RegionFishSorter {
            constructor() {
                this.prefs = SortPrefsStore.load();
                this.panelEl = null;
                this._justSorted = false;
                this._fishLookup = null;
            }

            get fishLookup() {
                if (!this._fishLookup) this._fishLookup = this._buildLookup();
                return this._fishLookup;
            }

            _buildLookup() {
                const table = {};
                getFishDatabaseItems().forEach(fish => {
                    const name = fish.name || fish['名称'];
                    if (name) table[name] = fish.details || fish['详情'] || {};
                });
                return table;
            }

            _getInfo(fishName) { return this.fishLookup[fishName] || {}; }

            isLocked(card) {
                const btn = card.querySelector('.region-fish-lock-button');
                return btn && btn.classList.contains('region-fish-lock-button--locked');
            }

            getFishName(card) {
                const nameEl = card.querySelector('.item-name');
                if (!nameEl) return '';
                let name = '';
                for (const node of nameEl.childNodes) {
                    if (node.nodeType === 3) name += node.textContent;
                }
                return name.trim();
            }

            extractWeight(card) {
                try {
                    const els = card.querySelectorAll('.text-xs.text-muted');
                    if (els.length === 0) return 0;
                    const text = els[els.length - 1].textContent.trim().replace(/[^0-9.]/g, '');
                    const w = parseFloat(text);
                    return isNaN(w) ? 0 : w;
                } catch (e) { return 0; }
            }

            sort(cards, mode) {
                const fishData = cards.map(card => {
                    const name = this.getFishName(card);
                    const info = this._getInfo(name);
                    return {
                        card, name,
                        weight: this.extractWeight(card),
                        waterLayer: info['水层'] || null,
                        bait: info['偏好饵料'] || null,
                        lure: info['偏好拟饵'] || null,
                    };
                });

                switch (mode) {
                    case SORT_MODES.WEIGHT_DESC:
                        fishData.sort((a, b) => b.weight - a.weight);
                        break;
                    case SORT_MODES.WEIGHT_ASC:
                        fishData.sort((a, b) => a.weight - b.weight);
                        break;
                    case SORT_MODES.WATER_LAYER:
                        fishData.sort((a, b) => {
                            const la = WATER_LAYER_ORDER[a.waterLayer] ?? 99;
                            const lb = WATER_LAYER_ORDER[b.waterLayer] ?? 99;
                            if (la !== lb) return la - lb;
                            return b.weight - a.weight;
                        });
                        break;
                    case SORT_MODES.BAIT_TYPE:
                        fishData.sort((a, b) => {
                            const ba = a.bait || 'zzz', bb = b.bait || 'zzz';
                            if (ba !== bb) return ba.localeCompare(bb);
                            return b.weight - a.weight;
                        });
                        break;
                    case SORT_MODES.LURE_TYPE:
                        fishData.sort((a, b) => {
                            const la = a.lure || 'zzz', lb = b.lure || 'zzz';
                            if (la !== lb) return la.localeCompare(lb);
                            return b.weight - a.weight;
                        });
                        break;
                    default:
                        fishData.sort((a, b) => b.weight - a.weight);
                }
                return fishData;
            }

            execute() {
                const grid = document.querySelector('.region-fish-grid');
                if (!grid) return;
                const cards = Array.from(grid.querySelectorAll('.region-fish-card'));
                if (cards.length === 0) return;

                this.markAllLockedNames(cards);

                const locked = [], unlocked = [];
                cards.forEach(card => {
                    if (this.isLocked(card)) locked.push(card);
                    else unlocked.push(card);
                });

                const sortedUnlocked = this.sort(unlocked, this.prefs.sortMode);
                const lockPos = this.prefs.lockPosition;

                if (lockPos === LOCK_POSITION.TOP) {
                    locked.forEach(card => grid.appendChild(card));
                    sortedUnlocked.forEach(({ card }) => grid.appendChild(card));
                } else {
                    sortedUnlocked.forEach(({ card }) => grid.appendChild(card));
                    locked.forEach(card => grid.appendChild(card));
                }

                this._justSorted = true;
                setTimeout(() => { this._justSorted = false; }, 500);
            }

            markLockedName(card) {
                const nameEl = card.querySelector('.item-name');
                if (!nameEl) return;
                if (this.isLocked(card)) {
                    nameEl.style.color = '#ef4444';
                    nameEl.style.fontWeight = 'bold';
                } else {
                    nameEl.style.color = '';
                    nameEl.style.fontWeight = '';
                }
            }

            markAllLockedNames(cards) { cards.forEach(c => this.markLockedName(c)); }

            isDataReady() {
                const cards = document.querySelectorAll('.region-fish-card');
                if (cards.length === 0) return false;
                for (const card of cards) {
                    if (this.extractWeight(card) > 0) return true;
                }
                return false;
            }

            createPanel() {
                if (this.panelEl) return this.panelEl;

                const panel = document.createElement('div');
                panel.id = 'fish-sort-panel';
                panel.style.cssText = `
                    display:flex;flex-wrap:wrap;align-items:center;gap:4px;
                    margin-bottom:6px;padding:6px 8px;
                    background:${THEME.panelBg};
                    border:1px solid ${THEME.panelBorder};
                    border-radius:6px;font-size:0.78em;
                `;

                const label = document.createElement('span');
                label.textContent = '排序:';
                label.style.cssText = `color:${THEME.labelColor};margin-right:2px;`;
                panel.appendChild(label);

                const makeBtn = (text, callback) => {
                    const btn = document.createElement('button');
                    btn.textContent = text;
                    btn.style.cssText = `
                        padding:2px 7px;
                        border:1px solid ${THEME.btnDefaultBorder};
                        border-radius:4px;
                        background:${THEME.btnDefaultBg};
                        color:${THEME.btnDefaultColor};
                        cursor:pointer;font-size:0.75em;white-space:nowrap;
                    `;
                    btn.addEventListener('click', callback);
                    panel.appendChild(btn);
                    return btn;
                };

                Object.entries(SORT_MODE_LABELS).forEach(([mode, txt]) => {
                    const btn = makeBtn(txt, () => this.setSortMode(mode));
                    btn.dataset.mode = mode;
                });

                const sep = document.createElement('span');
                sep.textContent = '|';
                sep.style.cssText = `color:${THEME.sepColor};margin:0 2px;`;
                panel.appendChild(sep);

                const lockLabel = document.createElement('span');
                lockLabel.textContent = '锁定:';
                lockLabel.style.cssText = `color:${THEME.labelColor};`;
                panel.appendChild(lockLabel);

                makeBtn('在上', () => this.setLockPosition(LOCK_POSITION.TOP));
                makeBtn('在下', () => this.setLockPosition(LOCK_POSITION.BOTTOM));

                this.panelEl = panel;
                this._highlightButtons();
                return panel;
            }

            _highlightButtons() {
                if (!this.panelEl) return;
                this.panelEl.querySelectorAll('button').forEach(btn => {
                    const mode = btn.dataset.mode;
                    const isActive =
                        (mode && mode === this.prefs.sortMode) ||
                        (btn.textContent === '在上' && this.prefs.lockPosition === LOCK_POSITION.TOP) ||
                        (btn.textContent === '在下' && this.prefs.lockPosition === LOCK_POSITION.BOTTOM);
                    if (isActive) {
                        btn.style.background = THEME.btnActiveBg;
                        btn.style.color = THEME.btnActiveColor;
                        btn.style.borderColor = THEME.btnActiveBorder;
                    } else {
                        btn.style.background = THEME.btnDefaultBg;
                        btn.style.color = THEME.btnDefaultColor;
                        btn.style.borderColor = THEME.btnDefaultBorder;
                    }
                });
            }

            setSortMode(mode) {
                if (this.prefs.sortMode === mode) return;
                this.prefs.sortMode = mode;
                SortPrefsStore.save(this.prefs);
                this._highlightButtons();
                this.execute();
            }

            setLockPosition(pos) {
                if (this.prefs.lockPosition === pos) return;
                this.prefs.lockPosition = pos;
                SortPrefsStore.save(this.prefs);
                this._highlightButtons();
                this.execute();
            }

            injectPanel() {
                const grid = document.querySelector('.region-fish-grid');
                if (!grid || document.getElementById('fish-sort-panel')) return;
                grid.parentNode.insertBefore(this.createPanel(), grid);
            }
        }

        function init() {
            const sorter = new RegionFishSorter();

            let retries = 0;
            function waitForData() {
                if (sorter.isDataReady()) {
                    sorter.injectPanel();
                    sorter.execute();
                    return;
                }
                if (++retries < 20) setTimeout(waitForData, 500);
                else { sorter.injectPanel(); sorter.execute(); }
            }
            waitForData();

            let timer = null;
            const observer = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    if (m.type === 'attributes' && m.attributeName === 'class') {
                        if (m.target.classList.contains('region-fish-lock-button')) {
                            if (!sorter._justSorted) {
                                const card = m.target.closest('.region-fish-card');
                                if (card) sorter.markLockedName(card);
                            }
                            continue;
                        }
                    }
                    if (m.type === 'childList') {
                        const t = m.target;
                        if (t.classList && t.classList.contains('region-fish-grid')) {
                            clearTimeout(timer);
                            timer = setTimeout(() => {
                                if (sorter.isDataReady()) { sorter.injectPanel(); sorter.execute(); }
                            }, 600);
                            return;
                        }
                        for (const n of m.addedNodes) {
                            if (n.nodeType === 1 && (n.classList.contains('region-fish-card') || n.querySelector('.region-fish-card'))) {
                                clearTimeout(timer);
                                timer = setTimeout(() => {
                                    if (sorter.isDataReady()) { sorter.injectPanel(); sorter.execute(); }
                                }, 600);
                                return;
                            }
                        }
                    }
                }
            });

            observer.observe(document.body, {
                childList: true, subtree: true, attributes: true, attributeFilter: ['class']
            });

            console.log('[鱼群排序] 已启动（深海夜幕主题）');
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    })();
}
// 3.可上船只列表排序
function initBoatSort() {
        (function() {
            'use strict';
            class BoatSorter {
                static canBoard(card) {
                    const button = card.querySelector('button');
                    if (!button) return false;
                    if (button.hasAttribute('disabled')) return false;
                    if (button.textContent.trim() !== '上船') return false;
                    return true;
                }
                static getStateSignature() {
                    const cards = document.querySelectorAll('.card-list .card.item-card');
                    let boardable = 0;
                    let unboardable = 0;
                    cards.forEach(card => {
                        if (this.canBoard(card)) boardable++;
                        else unboardable++;
                    });
                    return `${boardable}|${unboardable}`;
                }
                static isDataReady() {
                    const cards = document.querySelectorAll('.card-list .card.item-card');
                    if (cards.length === 0) return false;
                    for (const card of cards) {
                        if (card.querySelector('button')) return true;
                    }
                    return false;
                }
                static isAlreadySorted() {
                    const list = document.querySelector('.card-list');
                    if (!list) return true;
                    const cards = Array.from(list.querySelectorAll('.card.item-card'));
                    let foundUnboardable = false;
                    for (const card of cards) {
                        if (this.canBoard(card)) {
                            if (foundUnboardable) return false;
                        } else {
                            foundUnboardable = true;
                        }
                    }
                    return true;
                }
                static sort() {
                    const list = document.querySelector('.card-list');
                    if (!list) return;
                    if (this.isAlreadySorted()) return;
                    const cards = Array.from(list.querySelectorAll('.card.item-card'));
                    const boardableCards = [];
                    const unboardableCards = [];
                    cards.forEach(card => {
                        if (this.canBoard(card)) {
                            boardableCards.push(card);
                        } else {
                            unboardableCards.push(card);
                        }
                    });
                    boardableCards.forEach(card => list.appendChild(card));
                    unboardableCards.forEach(card => list.appendChild(card));
                    console.log(`[船只排序] 已完成 - 可上船: ${boardableCards.length}, 不可上船: ${unboardableCards.length}`);
                }
            }
            function init() {
                let initialRetries = 0;
                const MAX_RETRIES = 20;
                const RETRY_DELAY = 500;
                function waitForData() {
                    if (BoatSorter.isDataReady()) {
                        BoatSorter.sort();
                        console.log('[船只排序] 首次排序完成');
                        return;
                    }
                    initialRetries++;
                    if (initialRetries < MAX_RETRIES) {
                        setTimeout(waitForData, RETRY_DELAY);
                    } else {
                        console.warn('[船只排序] 等待超时，强制执行');
                        BoatSorter.sort();
                    }
                }
                waitForData();
                let debounceTimer = null;
                const observer = new MutationObserver((mutations) => {
                    let shouldSort = false;
                    for (const mutation of mutations) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
                            if (mutation.target.nodeType === 1 && mutation.target.tagName === 'BUTTON') {
                                shouldSort = true;
                                break;
                            }
                        }
                        if (mutation.type === 'childList') {
                            const target = mutation.target;
                            if (target.nodeType === 1 && target.classList && target.classList.contains('card-list')) {
                                shouldSort = true;
                                break;
                            }
                            for (const node of mutation.addedNodes) {
                                if (node.nodeType === 1) {
                                    if (node.classList.contains('item-card') || node.querySelector('.item-card')) {
                                        shouldSort = true;
                                        break;
                                    }
                                    if (node.tagName === 'BUTTON' || node.querySelector('button')) {
                                        shouldSort = true;
                                        break;
                                    }
                                }
                            }
                            for (const node of mutation.removedNodes) {
                                if (node.nodeType === 1) {
                                    if (node.classList.contains('item-card') || node.querySelector('.item-card')) {
                                        shouldSort = true;
                                        break;
                                    }
                                }
                            }
                        }
                        if (mutation.type === 'characterData') {
                            const parent = mutation.target.parentNode;
                            if (parent && parent.nodeType === 1 && parent.tagName === 'BUTTON') {
                                shouldSort = true;
                                break;
                            }
                        }
                    }
                    if (shouldSort) {
                        clearTimeout(debounceTimer);
                        debounceTimer = setTimeout(() => {
                            if (BoatSorter.isDataReady()) {
                                BoatSorter.sort();
                            }
                        }, 300);
                    }
                });
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['disabled'],
                    characterData: true,
                });
                let lastSignature = '';
                const POLL_INTERVAL = 2000;
                function pollCheck() {
                    if (!BoatSorter.isDataReady()) return;
                    const currentSignature = BoatSorter.getStateSignature();
                    if (currentSignature !== lastSignature) {
                        lastSignature = currentSignature;
                        BoatSorter.sort();
                    }
                }
                setTimeout(() => {
                    lastSignature = BoatSorter.getStateSignature();
                }, 1000);
                setInterval(pollCheck, POLL_INTERVAL);
                console.log('[船只排序] 已启动（Observer + 轮询双保险）');
            }
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                init();
            }
        })();
    }
// 4.鱼群水层显示
function initWaterLayer() {
    (function() {
        'use strict';

        // 钓鱼主题配色
        const WATER_LAYER_CONFIG = {
            '上层': { color: '#fff', bg: '#1E88E5', short: '上' },  // 海洋蓝
            '中层': { color: '#fff', bg: '#43A047', short: '中' },  // 水草绿
            '下层': { color: '#fff', bg: '#6D4C41', short: '下' },  // 礁石灰
            '表层': { color: '#fff', bg: '#039BE5', short: '表' },  // 浅海蓝
            '底层': { color: '#fff', bg: '#4E342E', short: '底' },  // 深海棕
        };

        const BAIT_SHORT = {
            '活小鱼': '活', '死小鱼': '死', '大整条饵鱼': '大',
            '小整条饵鱼': '小', '切块饵鱼': '切', '虾': '虾',
            '蟹': '蟹', '虫': '虫', '蛤': '蛤',
        };

        const LURE_SHORT = {
            '水面系': '水', '亮片': '亮', '米诺': '米',
            '铅头钩': '铅', '摇滚': '摇', '铁板': '铁',
            '软虫': '软', 'VIB': 'V',
        };

        // 钓鱼主题标签颜色
        const TAG_LAYER_BG = '#1565C0';   // 深海蓝（水层）
        const TAG_BAIT_BG = '#E65100';    // 鱼饵橙（饵料）
        const TAG_LURE_BG = '#2E7D32';    // 渔具绿（拟饵）

        function getBaitShort(bait) { return BAIT_SHORT[bait] || bait.charAt(0); }
        function getLureShort(lure) { return LURE_SHORT[lure] || lure.charAt(0); }

        class FishCardEnhancer {
            static buildLookupTable() {
                const table = {};
                getFishDatabaseItems().forEach(fish => {
                    const name = fish.name || fish['名称'];
                    const details = fish.details || fish['详情'] || {};
                    if (name) table[name] = details;
                });
                return table;
            }

            static getLookupTable() {
                if (!this._lookupTable) this._lookupTable = this.buildLookupTable();
                return this._lookupTable;
            }

            static getFishInfo(fishName) {
                return this.getLookupTable()[fishName] || null;
            }

            static applyToCard(card) {
                // 可遇鱼类网格由信息增强 BoatHelper 统一渲染，避免两套标签并存
                if (card.closest('.region-fish-grid')) {
                    if (typeof window.__LF_ENHANCE_FISH_GRIDS === 'function') return;
                }

                const content = card.querySelector('button.region-fish-card-content, .region-fish-card-content') || card;
                const nameEl = content.querySelector('.item-name') || card.querySelector('.item-name');
                if (!nameEl) return;
                const fishName = nameEl.textContent.trim();
                const info = this.getFishInfo(fishName);
                if (!info) return;
                if (content.querySelector('.lf-fish-tag-row')) return;

                // 清理旧版缩写方块行，避免与统一徽章并存
                content.querySelectorAll('.fish-tag-row').forEach(el => el.remove());

                const hasLayer = info['水层'];
                const hasBait = info['偏好饵料'];
                const hasLure = info['偏好拟饵'];

                if (hasLayer || hasBait || hasLure) {
                    const row = document.createElement('div');
                    row.className = 'lf-fish-tag-row';

                    const addBadge = (label, kind, title) => {
                        const tag = document.createElement('span');
                        tag.className = `lf-fish-badge lf-fish-badge--${kind}`;
                        tag.textContent = label;
                        tag.title = title ?? label;
                        row.appendChild(tag);
                    };

                    if (hasLayer) addBadge(hasLayer, 'layer', hasLayer);
                    if (hasBait) addBadge(hasBait, 'bait', hasBait);
                    if (hasLure) addBadge(hasLure, 'lure', hasLure);

                    nameEl.parentNode.insertBefore(row, nameEl.nextSibling);
                }
            }

            static applyAll() {
                if (typeof window.__LF_ENHANCE_FISH_GRIDS === 'function') {
                    window.__LF_ENHANCE_FISH_GRIDS();
                }
                document.querySelectorAll('.region-fish-card').forEach(card => this.applyToCard(card));
            }
        }

        function init() {
            let retries = 0;
            function wait() {
                const cards = document.querySelectorAll('.region-fish-card');
                if (cards.length > 0) {
                    const first = cards[0].querySelector('.item-name');
                    if (first && first.textContent.trim()) {
                        FishCardEnhancer.applyAll();
                        return;
                    }
                }
                if (++retries < 20) setTimeout(wait, 500);
                else FishCardEnhancer.applyAll();
            }
            wait();

            const scheduleEnhance = () => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    if (typeof window.__LF_ENHANCE_FISH_GRIDS === 'function') {
                        window.__LF_ENHANCE_FISH_GRIDS();
                    }
                    FishCardEnhancer.applyAll();
                }, 400);
            };

            let timer = null;
            const observer = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    if (m.type === 'childList') {
                        const t = m.target;
                        if (t.classList && t.classList.contains('region-fish-grid')) {
                            scheduleEnhance();
                            return;
                        }
                        for (const n of m.addedNodes) {
                            if (n.nodeType === 1 && (n.classList.contains('region-fish-card') || n.querySelector('.region-fish-card'))) {
                                scheduleEnhance();
                                return;
                            }
                        }
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    })();
}
// 5.钓鱼日志染色
function initFishLogColor() {
        (function() {
            'use strict';
            if (!document.getElementById('fish-log-colors-style')) {
                const style = document.createElement('style');
                style.id = 'fish-log-colors-style';
                style.textContent = `
                    .gold-glow {
                        background: linear-gradient(90deg, #FFD700, #EF989A, #FFD700);
                        background-size: 200% 100%;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        animation: shimmer 2s ease-in-out infinite;
                        font-weight: bold;
                    }

                    .green-glow {
                        background: linear-gradient(90deg, #22C55E, #86EFAC, #22C55E);
                        background-size: 200% 100%;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        animation: shimmer 1.5s ease-in-out infinite;
                        font-weight: bold;
                    }

                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                `;
                document.head.appendChild(style);
            }
            const colorRules = [
                { word: '鱼讯',   color: 'green-glow' },
                { word: '传说',   color: 'gold-glow' },
                { word: '不达标', color: '#A7B1BF' },
                { word: '达标',   color: '#22C55E' },
                { word: '罕见',   color: '#F2C77D' },
                { word: '稀有',   color: '#92B9F7' },
                { word: '脱钩逃脱', color: 'red' }
            ];
            function colorizeMessage(el) {
                if (el.dataset.colored) return;
                el.dataset.colored = '1';
                const text = el.textContent || '';
                for (const rule of colorRules) {
                    if (text.includes(rule.word)) {
                        if (rule.color === 'green-glow') {
                            el.classList.add('green-glow');
                        } else if (rule.color === 'gold-glow') {
                            el.classList.add('gold-glow');
                        } else {
                            el.style.color = rule.color;
                            el.style.fontWeight = 'bold';
                        }
                        break;
                    }
                }
            }
            function processLogs() {
                const logs = document.querySelectorAll('.fishing-log-message:not([data-colored])');
                logs.forEach(colorizeMessage);
            }
            function init() {
                const container = document.querySelector('.fishing-log-list')
                               || document.querySelector('.card.mb-md')
                               || document.body;
                if (!container) return;
                processLogs();
                const observer = new MutationObserver(() => {
                    processLogs();
                });
                observer.observe(container, { childList: true, subtree: true });
            }
            if (document.readyState === 'complete') {
                init();
            } else {
                window.addEventListener('DOMContentLoaded', init);
            }
        })();
    }
// 6.鱼口时间计算
function initCatchInterval() {
        (function() {
            'use strict';
            function calculateCatchIntervals() {
                const catchCards = document.querySelectorAll('.message-card--catch');
                if (catchCards.length < 2) return;
                document.querySelectorAll('.message-card--catch .catch-interval').forEach(el => el.remove());
                const catchTimes = [];
                catchCards.forEach(card => {
                    const timeElement = card.querySelector('.text-xs.text-muted');
                    if (timeElement) {
                        const timeStr = timeElement.childNodes[0]?.nodeValue?.trim();
                        if (timeStr) {
                            const time = parseCustomDate(timeStr);
                            if (time && !isNaN(time)) {
                                catchTimes.push({ time: time, timeElement: timeElement });
                            }
                        }
                    }
                });
                for (let i = 0; i < catchTimes.length - 1; i++) {
                    const currentItem = catchTimes[i];
                    const previousItem = catchTimes[i + 1];
                    const diffMs = Math.abs(currentItem.time - previousItem.time);
                    const diffMinutes = Math.round(diffMs / 1000 / 60);
                    const intervalSpan = document.createElement('span');
                    intervalSpan.className = 'catch-interval text-xs text-muted ml-sm';
                    intervalSpan.textContent = ` │ 鱼口: ${diffMinutes}分钟`;
                    currentItem.timeElement.appendChild(intervalSpan);
                }
            }
            function parseCustomDate(dateStr) {
                if (!dateStr) return null;
                const isoStr = dateStr.replace(/\//g, '-').replace(' ', 'T');
                return new Date(isoStr);
            }
            setTimeout(calculateCatchIntervals, 1000);
            const observer = new MutationObserver(function(mutations) {
                clearTimeout(window.catchIntervalTimer);
                window.catchIntervalTimer = setTimeout(calculateCatchIntervals, 300);
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        })();
    }
// 7.渔轮装备参数增强
function initReelEnhance() {
        (function() {
            'use strict';
            function enhanceCard(card) {
                if (card.dataset.reelEnhanced) return;
                const statsContainer = card.querySelector('.loadout-slot-stats');
                if (!statsContainer) return;
                const gearSpan   = [...statsContainer.querySelectorAll('span')].find(s => {
                    const t = s.textContent;
                    return t.includes('齿比') && /\d/.test(t);
                });
                const dragSpan   = [...statsContainer.querySelectorAll('span')].find(s => {
                    const t = s.textContent;
                    return t.includes('最大摩擦力') && /\d/.test(t);
                });
                const speedSpan  = [...statsContainer.querySelectorAll('span')].find(s => {
                    const t = s.textContent;
                    return t.includes('最大收线速度') && /\d/.test(t);
                });
                const dragMatch = dragSpan?.textContent.match(/最大摩擦力\s+([\d.]+)/);
                const speedMatch= speedSpan?.textContent.match(/最大收线速度\s+([\d.]+)/);
                const gearMatch = gearSpan?.textContent.match(/齿比\s+([\d.]+)/);
                if (dragSpan && !dragMatch) return;
                if (speedSpan && !speedMatch) return;
                if (gearSpan && !gearMatch) return;
                if (!dragMatch && !speedMatch) return;
                let lockValue = null;
                if (dragMatch) {
                    lockValue = (parseFloat(dragMatch[1]) * 1.5).toFixed(1);
                }
                let lineSpeed = null;
                if (speedMatch && gearMatch) {
                    const maxSpeed = parseFloat(speedMatch[1]);
                    const gearRatio = parseFloat(gearMatch[1]);
                    lineSpeed = ((maxSpeed / 2.375) * (gearRatio / 2.3)).toFixed(2);
                }
                if (lockValue !== null || lineSpeed !== null) {
                    const combinedSpan = document.createElement('span');
                    let html = '';
                    if (lockValue !== null) {
                        html += `<span style="color:#64748B;font-weight:bold;">锁轮: ${lockValue}</span>`;
                    }
                    if (lineSpeed !== null) {
                        if (lockValue !== null) html += ' <span style="color:var(--color-text-muted);">     </span> ';
                        html += `<span style="color:#64748B;font-weight:bold;">初始速度: ${lineSpeed}</span>`;
                    }
                    combinedSpan.innerHTML = html;
                    statsContainer.appendChild(combinedSpan);
                }
                card.dataset.reelEnhanced = '1';
            }
            function enhanceAll() {
                document.querySelectorAll('.loadout-slot').forEach(enhanceCard);
            }
            setTimeout(enhanceAll, 300);
            const observer = new MutationObserver(() => enhanceAll());
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
            console.log('[渔轮增强 v7] 单行显示，锁轮拉力+初始速度');
        })();
    }
// 8.商店卡片渔轮参数增强
function initShopCardEnhance() {
        (function() {
            'use strict';
            const OBSERVER_OPTIONS = { childList: true, subtree: true, characterData: true };
            function isPlaceholderText(text) {
                if (!text || text.trim() === '') return true;
                if (/加载|数据|请稍|\.\.\./.test(text)) return true;
                if (!/\d/.test(text)) return true;
                return false;
            }
            function findSpanWithData(container, keyword) {
                return [...container.querySelectorAll('span')].find(s => {
                    const t = s.textContent;
                    return t.includes(keyword) && !isPlaceholderText(t);
                });
            }
            function enhanceShopCard(card) {
                const metaContainer = card.querySelector('.shop-card-meta');
                if (!metaContainer) return;
                if (metaContainer.querySelector('.calc-result-bottom')) return;
                const gearSpan  = findSpanWithData(metaContainer, '齿比');
                const dragSpan  = findSpanWithData(metaContainer, '最大摩擦力');
                const speedSpan = findSpanWithData(metaContainer, '最大收线速度');
                const allText = metaContainer.textContent;
                if (allText.includes('齿比') && !gearSpan) return;
                if (allText.includes('最大摩擦力') && !dragSpan) return;
                if (allText.includes('最大收线速度') && !speedSpan) return;
                const dragMatch = dragSpan?.textContent.match(/最大摩擦力[\s:]*([\d.]+)/);
                const speedMatch = speedSpan?.textContent.match(/最大收线速度[\s:]*([\d.]+)/);
                const gearMatch = gearSpan?.textContent.match(/齿比[\s:]*([\d.]+)/);
                let lockValue = null;
                if (dragMatch) {
                    lockValue = (parseFloat(dragMatch[1]) * 1.5).toFixed(1);
                }
                let lineSpeed = null;
                if (speedMatch && gearMatch) {
                    const maxSpeed = parseFloat(speedMatch[1]);
                    const gearRatio = parseFloat(gearMatch[1]);
                    lineSpeed = ((maxSpeed / 2.375) * (gearRatio / 2.3)).toFixed(2);
                }
                if (lockValue === null && lineSpeed === null) return;
                const resultSpan = document.createElement('span');
                resultSpan.className = 'calc-result-bottom';
                let html = '';
                if (lockValue !== null) {
                    html += `锁轮${lockValue}`;
                }
                if (lineSpeed !== null) {
                    if (lockValue !== null) html += '   ';
                    html += `初始速度${lineSpeed}`;
                }
                resultSpan.innerHTML = html;
                resultSpan.style.color = '#64748B';
                resultSpan.style.fontWeight = 'bold';
                metaContainer.appendChild(resultSpan);
            }
            function enhanceAll() {
                document.querySelectorAll('.shop-grid-card').forEach(enhanceShopCard);
            }
            setTimeout(enhanceAll, 500);
            const observer = new MutationObserver(() => enhanceAll());
            observer.observe(document.body, OBSERVER_OPTIONS);
            console.log('[商店卡片增强 v3] 颜色统一#64748B，结果置于底部');
        })();
    }
// 装配台模拟器
function initAssemblySim() {
    (function() {
        'use strict';

        // ==================== 零件库 ====================
        const PART_LIBRARY = {
            "竿胚": [
                { id: "A_std_carbon_blank", name: "A线标准碳布竿胚", rarity: "史诗", attributes: { "最大张力": 44, "硬度": 8.6, "手感": 6.6 } },
                { id: "A_std_heavy_blank", name: "A线标准重载竿胚", rarity: "史诗", attributes: { "最大张力": 52, "硬度": 9.2, "手感": 5.8 } },
                { id: "A_enh_control_blank", name: "A线加强控线竿胚", rarity: "传说", attributes: { "最大张力": 68, "硬度": 10.2, "手感": 7.3 } },
                { id: "A_enh_torque_blank", name: "A线加强扭矩竿胚", rarity: "传说", attributes: { "最大张力": 78, "硬度": 11.0, "手感": 6.4 } },
                { id: "B_heavy_mainspine_blank", name: "B线重载主脊竿胚", rarity: "传说", attributes: { "最大张力": 112, "硬度": 13.4, "手感": 7.0 } },
                { id: "B_heavy_cast_blank", name: "B线重载远投竿胚", rarity: "传说", attributes: { "最大张力": 98, "硬度": 12.2, "手感": 8.1 } },
                { id: "C_exp_antenna_blank", name: "C线试验天线竿胚", rarity: "试验级", attributes: { "最大张力": 132, "硬度": 14.2, "手感": 9.4 } },
                { id: "C_exp_titan_blank", name: "C线试验泰坦竿胚", rarity: "试验级", attributes: { "最大张力": 152, "硬度": 15.8, "手感": 7.6 } }
            ],
            "芯骨": [
                { id: "A_std_quick_core", name: "A线标准快攻芯骨", rarity: "史诗", attributes: { "最大张力": 30, "硬度": 1.8, "手感": 1.4 } },
                { id: "A_std_solid_core", name: "A线标准实心芯骨", rarity: "史诗", attributes: { "最大张力": 38, "硬度": 2.4, "手感": 0.7 } },
                { id: "A_enh_suppress_core", name: "A线加强压制芯骨", rarity: "传说", attributes: { "最大张力": 56, "硬度": 3.1, "手感": 0.9 } },
                { id: "A_enh_flex_core", name: "A线加强柔控芯骨", rarity: "传说", attributes: { "最大张力": 44, "硬度": 2.2, "手感": 2.0 } },
                { id: "B_heavy_buffer_core", name: "B线重载缓冲芯", rarity: "传说", attributes: { "最大张力": 72, "硬度": 3.0, "手感": 2.6 } },
                { id: "B_heavy_spine_core", name: "B线重载脊芯", rarity: "传说", attributes: { "最大张力": 86, "硬度": 4.2, "手感": 1.3 } },
                { id: "C_exp_balance_core", name: "C线试验天衡芯", rarity: "试验级", attributes: { "最大张力": 102, "硬度": 4.4, "手感": 3.4 } },
                { id: "C_exp_void_core", name: "C线试验空渊芯", rarity: "试验级", attributes: { "最大张力": 122, "硬度": 5.6, "手感": 1.6 } }
            ],
            "导环组": [
                { id: "A_std_balance_guide", name: "A线标准平衡导环", rarity: "稀有", attributes: { "最大张力": 8, "硬度": -0.15, "手感": 1.8 } },
                { id: "A_enh_impact_guide", name: "A线加强抗冲导环", rarity: "史诗", attributes: { "最大张力": 18, "硬度": 0.35, "手感": 1.0 } },
                { id: "B_heavy_cast_guide", name: "B线重载远投导环", rarity: "史诗", attributes: { "最大张力": 26, "硬度": 0.25, "手感": 2.2 } },
                { id: "B_heavy_stable_guide", name: "B线重载稳线导环", rarity: "史诗", attributes: { "最大张力": 30, "硬度": 0.18, "手感": 2.6 } },
                { id: "C_exp_axis_guide", name: "C线试验轴线导环", rarity: "传说", attributes: { "最大张力": 38, "硬度": 0.45, "手感": 3.0 } },
                { id: "C_exp_vector_guide", name: "C线试验矢量导环", rarity: "传说", attributes: { "最大张力": 44, "硬度": 0.36, "手感": 3.3 } }
            ],
            "握柄": [
                { id: "A_std_control_grip", name: "A线标准控柄", rarity: "稀有", attributes: { "最大张力": 6, "硬度": -0.2, "手感": 2.3 } },
                { id: "A_enh_lock_grip", name: "A线加强锁柄", rarity: "史诗", attributes: { "最大张力": 18, "硬度": 0.4, "手感": 1.6 } },
                { id: "B_heavy_support_grip", name: "B线重载撑柄", rarity: "史诗", attributes: { "最大张力": 30, "硬度": 0.55, "手感": 2.4 } },
                { id: "B_heavy_balance_grip", name: "B线重载配重握柄", rarity: "史诗", attributes: { "最大张力": 26, "硬度": 0.35, "手感": 3.1 } },
                { id: "C_exp_anchor_grip", name: "C线试验锚柄", rarity: "传说", attributes: { "最大张力": 44, "硬度": 0.75, "手感": 3.2 } },
                { id: "C_exp_balance_grip", name: "C线试验平衡握柄", rarity: "传说", attributes: { "最大张力": 38, "硬度": 0.55, "手感": 4.1 } }
            ],
            "轮架": [
                { id: "A_std_baitcast_frame", name: "A线标准鼓轮轮架", rarity: "史诗", attributes: { "线容量": 1760, "最大摩擦力": 30, "最大收线速度": 1.15 } },
                { id: "A_std_spinning_frame", name: "A线标准纺车轮架", rarity: "史诗", attributes: { "线容量": 820, "最大摩擦力": 24, "最大收线速度": 3.4 } },
                { id: "A_enh_baitcast_frame", name: "A线加强鼓轮轮架", rarity: "传说", attributes: { "线容量": 2340, "最大摩擦力": 54, "最大收线速度": 1.55 } },
                { id: "A_enh_spinning_frame", name: "A线加强纺车轮架", rarity: "传说", attributes: { "线容量": 1120, "最大摩擦力": 42, "最大收线速度": 4.6 } },
                { id: "B_heavy_baitcast_frame", name: "B线重载鼓轮轮架", rarity: "传说", attributes: { "线容量": 3300, "最大摩擦力": 96, "最大收线速度": 2.05 } },
                { id: "B_heavy_spinning_frame", name: "B线重载纺车轮架", rarity: "传说", attributes: { "线容量": 1580, "最大摩擦力": 74, "最大收线速度": 6.0 } },
                { id: "C_exp_baitcast_frame", name: "C线试验鼓轮轮架", rarity: "试验级", attributes: { "线容量": 4620, "最大摩擦力": 154, "最大收线速度": 2.7 } },
                { id: "C_exp_spinning_frame", name: "C线试验纺车轮架", rarity: "试验级", attributes: { "线容量": 2220, "最大摩擦力": 118, "最大收线速度": 7.6 } }
            ],
            "齿列": [
                { id: "A_std_smooth_gear", name: "A线标准顺滑齿列", rarity: "稀有", attributes: { "最大收线速度": 0.25, "抛投系数": 5, "省力系数": 8 } },
                { id: "A_enh_speed_gear", name: "A线加强控速齿列", rarity: "史诗", attributes: { "最大收线速度": 0.35, "抛投系数": 7, "省力系数": 11 } },
                { id: "B_heavy_efficient_gear", name: "B线重载省力齿列", rarity: "史诗", attributes: { "最大收线速度": 0.36, "抛投系数": 8, "省力系数": 18 } },
                { id: "B_heavy_lock_gear", name: "B线重载锁合齿列", rarity: "史诗", attributes: { "最大收线速度": 0.48, "抛投系数": 10, "省力系数": 15 } },
                { id: "C_exp_rail_gear", name: "C线试验环轨齿列", rarity: "传说", attributes: { "最大收线速度": 0.68, "抛投系数": 13, "省力系数": 19 } },
                { id: "C_exp_silent_gear", name: "C线试验静音齿列", rarity: "传说", attributes: { "最大收线速度": 0.52, "抛投系数": 11, "省力系数": 23 } }
            ],
            "线杯": [
                { id: "A_std_long_spool", name: "A线标准长线杯", rarity: "稀有", attributes: { "线容量": 240, "最大摩擦力": 8, "最大收线速度": 0.35 } },
                { id: "A_enh_torque_spool", name: "A线加强扭矩线杯", rarity: "史诗", attributes: { "线容量": 520, "最大摩擦力": 22, "最大收线速度": 0.45 } },
                { id: "B_heavy_cast_spool", name: "B线重载远投线杯", rarity: "史诗", attributes: { "线容量": 760, "最大摩擦力": 34, "最大收线速度": 0.75 } },
                { id: "B_heavy_deep_spool", name: "B线重载深仓线杯", rarity: "史诗", attributes: { "线容量": 920, "最大摩擦力": 42, "最大收线速度": 0.6 } },
                { id: "C_exp_endless_spool", name: "C线试验无尽线杯", rarity: "传说", attributes: { "线容量": 1420, "最大摩擦力": 72, "最大收线速度": 0.8 } },
                { id: "C_exp_cast_spool", name: "C线试验远投线杯", rarity: "传说", attributes: { "线容量": 1180, "最大摩擦力": 62, "最大收线速度": 1.0 } }
            ],
            "制动组": [
                { id: "A_std_carbon_brake", name: "A线标准碳制动栈", rarity: "史诗", attributes: { "最大摩擦力": 38, "最大收线速度": -0.1, "省力系数": 3 } },
                { id: "A_enh_hydraulic_brake", name: "A线加强液压制动栈", rarity: "传说", attributes: { "最大摩擦力": 68, "最大收线速度": -0.08, "省力系数": 5 } },
                { id: "B_heavy_lock_brake", name: "B线重载抱死制动栈", rarity: "传说", attributes: { "最大摩擦力": 112, "最大收线速度": -0.06, "省力系数": 7 } },
                { id: "B_heavy_cool_brake", name: "B线重载散热制动栈", rarity: "传说", attributes: { "最大摩擦力": 104, "最大收线速度": 0.02, "省力系数": 9 } },
                { id: "C_exp_gravity_brake", name: "C线试验重力制动栈", rarity: "试验级", attributes: { "最大摩擦力": 168, "最大收线速度": -0.04, "省力系数": 9 } },
                { id: "C_exp_titanium_brake", name: "C线试验钛合制动栈", rarity: "试验级", attributes: { "最大摩擦力": 156, "最大收线速度": 0.04, "省力系数": 12 } }
            ],
            "材质母件": [
                { id: "A_std_steel_leader", name: "A线标准钢芯前导", rarity: "史诗", attributes: { "最大张力": 180, "线长": 2.4, "线径": 1.42 } },
                { id: "A_std_PE_mainline", name: "A线标准PE母线", rarity: "史诗", attributes: { "最大张力": 190, "线长": 1180, "线径": 1.24 } },
                { id: "A_enh_fluoro_leader", name: "A线加强隐氟前导", rarity: "传说", attributes: { "最大张力": 210, "线长": 4.4, "线径": 1.56 } },
                { id: "A_enh_PE_mainline", name: "A线加强PE母线", rarity: "传说", attributes: { "最大张力": 280, "线长": 1560, "线径": 1.58 } },
                { id: "B_heavy_steel_leader", name: "B线重载钢芯前导", rarity: "传说", attributes: { "最大张力": 360, "线长": 3.2, "线径": 2.05 } },
                { id: "B_heavy_PE_mainline", name: "B线重载PE母线", rarity: "传说", attributes: { "最大张力": 440, "线长": 2240, "线径": 2.08 } },
                { id: "C_exp_fluoro_leader", name: "C线试验隐氟前导", rarity: "试验级", attributes: { "最大张力": 470, "线长": 5.4, "线径": 2.32 } },
                { id: "C_exp_PE_mainline", name: "C线试验PE母线", rarity: "试验级", attributes: { "最大张力": 650, "线长": 3120, "线径": 2.72 } }
            ],
            "短涂层": [
                { id: "A_std_hydro_coat", name: "A线标准静水涂层", rarity: "稀有", attributes: { "最大张力": 8, "线长": 0.2, "线径": 0.01 } },
                { id: "A_std_lowflash_coat", name: "A线标准低闪涂层", rarity: "稀有", attributes: { "最大张力": 6, "线长": 80, "线径": 0.01 } },
                { id: "A_enh_antitbite_coat", name: "A线加强防咬涂层", rarity: "史诗", attributes: { "最大张力": 24, "线长": 0.35, "线径": 0.02 } },
                { id: "A_enh_wear_coat", name: "A线加强耐磨涂层", rarity: "史诗", attributes: { "最大张力": 18, "线长": 140, "线径": 0.02 } },
                { id: "B_heavy_hidden_coat", name: "B线重载隐护涂层", rarity: "史诗", attributes: { "最大张力": 52, "线长": 0.52, "线径": 0.03 } },
                { id: "B_heavy_matte_coat", name: "B线重载消光涂层", rarity: "史诗", attributes: { "最大张力": 44, "线长": 0.58, "线径": 0.025 } },
                { id: "B_heavy_shield_coat", name: "B线重载护盾涂层", rarity: "史诗", attributes: { "最大张力": 42, "线长": 260, "线径": 0.03 } },
                { id: "C_exp_traceless_coat", name: "C线试验无痕涂层", rarity: "传说", attributes: { "最大张力": 82, "线长": 0.78, "线径": 0.04 } },
                { id: "C_exp_shadow_coat", name: "C线试验影幕涂层", rarity: "传说", attributes: { "最大张力": 70, "线长": 0.9, "线径": 0.035 } },
                { id: "C_exp_hidden_coat", name: "C线试验隐幕涂层", rarity: "传说", attributes: { "最大张力": 68, "线长": 420, "线径": 0.04 } }
            ],
            "缓冲层": [
                { id: "A_std_buffer", name: "A线标准缓冲段", rarity: "稀有", attributes: { "最大张力": 12, "线长": 0.35, "线径": 0.02 } },
                { id: "A_enh_iron_buffer", name: "A线加强铁幕缓冲段", rarity: "史诗", attributes: { "最大张力": 34, "线长": 0.55, "线径": 0.04 } },
                { id: "B_heavy_elastic_buffer", name: "B线重载弹性缓冲段", rarity: "史诗", attributes: { "最大张力": 60, "线长": 1.0, "线径": 0.05 } },
                { id: "B_heavy_pulse_buffer", name: "B线重载脉冲缓冲段", rarity: "史诗", attributes: { "最大张力": 68, "线长": 0.82, "线径": 0.06 } },
                { id: "C_exp_gravity_buffer", name: "C线试验重力缓冲段", rarity: "传说", attributes: { "最大张力": 96, "线长": 1.32, "线径": 0.07 } },
                { id: "C_exp_inertia_buffer", name: "C线试验惯性缓冲段", rarity: "传说", attributes: { "最大张力": 108, "线长": 1.1, "线径": 0.08 } }
            ],
            "编织层": [
                { id: "A_std_cast_braid", name: "A线标准远投编织层", rarity: "稀有", attributes: { "最大张力": 12, "线长": 180, "线径": 0.02 } },
                { id: "A_enh_warpspine_braid", name: "A线加强战脊编织层", rarity: "史诗", attributes: { "最大张力": 32, "线长": 260, "线径": 0.05 } },
                { id: "B_heavy_load_braid", name: "B线重载承载编织层", rarity: "史诗", attributes: { "最大张力": 62, "线长": 420, "线径": 0.08 } },
                { id: "B_heavy_lowres_braid", name: "B线重载低阻编织层", rarity: "史诗", attributes: { "最大张力": 54, "线长": 520, "线径": 0.065 } },
                { id: "C_exp_phase_braid", name: "C线试验相位编织层", rarity: "传说", attributes: { "最大张力": 84, "线长": 760, "线径": 0.095 } },
                { id: "C_exp_singularity_braid", name: "C线试验奇点编织层", rarity: "传说", attributes: { "最大张力": 96, "线长": 640, "线径": 0.12 } }
            ],
            "钩型母件": [
                { id: "A_std_single_hook_master", name: "A线标准竞技单钩坯", rarity: "史诗", attributes: { "钩型": "单钩", "号数": "12/0", "最大张力": 300 } },
                { id: "A_enh_treble_hook_master", name: "A线加强爆击三本坯", rarity: "传说", attributes: { "钩型": "三本钩", "号数": "15/0", "最大张力": 420 } },
                { id: "B_heavy_ocean_hook_master", name: "B线重载远洋单钩坯", rarity: "传说", attributes: { "钩型": "单钩", "号数": "23/0", "最大张力": 720 } },
                { id: "C_exp_deep_gun_hook_master", name: "C线试验深海枪钩坯", rarity: "试验级", attributes: { "钩型": "单钩", "号数": "30/0", "最大张力": 960 } }
            ],
            "钩身线材": [
                { id: "A_std_fine_bone_hook_body", name: "A线标准细骨钩身", rarity: "稀有", attributes: { "最大张力": 36, "挂底系数": -1, "识别度": -3 } },
                { id: "A_enh_barb_hook_body", name: "A线加强倒刺钩身", rarity: "史诗", attributes: { "最大张力": 82, "挂底系数": 3, "识别度": 2 } },
                { id: "B_heavy_spine_hook_body", name: "B线重载脊骨钩身", rarity: "史诗", attributes: { "最大张力": 140, "挂底系数": 4, "识别度": 2 } },
                { id: "C_exp_titan_hook_body", name: "C线试验泰坦钩身", rarity: "传说", attributes: { "最大张力": 220, "挂底系数": 5, "识别度": 3 } }
            ],
            "拟饵主体": [
                { id: "A_std_swim_lure_body", name: "A线标准游鱼主体", rarity: "史诗", attributes: { "拟饵类型": "米诺", "颜色": "blue_black", "号数": "61.5号" } },
                { id: "A_enh_deep_jig_lure_body", name: "A线加强深投铁板主体", rarity: "传说", attributes: { "拟饵类型": "铅头钩", "颜色": "abyss_silver", "号数": "72号" } },
                { id: "B_heavy_soft_lure_body", name: "B线重载软饵主体", rarity: "传说", attributes: { "拟饵类型": "软饵", "颜色": "abyss_glow", "号数": "94.5号" } },
                { id: "C_exp_pencil_lure_body", name: "C线试验巡天铅笔主体", rarity: "试验级", attributes: { "拟饵类型": "水面系", "颜色": "bone_blue", "号数": "118.5号" } }
            ],
            "配重组": [
                { id: "A_std_keel_weight", name: "A线标准龙骨配重", rarity: "稀有", attributes: { "号数": "1.6号", "重量": 28, "扰流": 5 } },
                { id: "A_enh_deep_weight", name: "A线加强深沉配重", rarity: "史诗", attributes: { "号数": "2.1号", "重量": 54, "扰流": 8 } },
                { id: "B_heavy_torque_weight", name: "B线重载扭矩配重", rarity: "史诗", attributes: { "号数": "2.8号", "重量": 88, "扰流": 10 } },
                { id: "C_exp_rail_weight", name: "C线试验轨道配重", rarity: "传说", attributes: { "号数": "3.4号", "重量": 126, "扰流": 12 } }
            ]
        };

        // ==================== 槽位配置 ====================
        const EQUIPMENT_SLOTS = {
            "底钓竿": [{ name: "竿胚", required: true, type: "不可逆固化件" }, { name: "芯骨", required: false, type: "不可逆固化件" }, { name: "导环组", required: true, type: "可热插拔模块件" }, { name: "握柄", required: true, type: "可热插拔模块件" }],
            "赛竿": [{ name: "竿胚", required: true, type: "不可逆固化件" }, { name: "芯骨", required: false, type: "不可逆固化件" }, { name: "导环组", required: true, type: "可热插拔模块件" }, { name: "握柄", required: true, type: "可热插拔模块件" }],
            "路亚竿": [{ name: "竿胚", required: true, type: "不可逆固化件" }, { name: "芯骨", required: false, type: "不可逆固化件" }, { name: "导环组", required: true, type: "可热插拔模块件" }, { name: "握柄", required: true, type: "可热插拔模块件" }],
            "纺车轮": [{ name: "轮架", required: true, type: "不可逆固化件" }, { name: "制动组", required: true, type: "可热插拔模块件" }, { name: "线杯", required: true, type: "可热插拔模块件" }, { name: "齿列", required: true, type: "可热插拔模块件" }],
            "鼓轮": [{ name: "轮架", required: true, type: "不可逆固化件" }, { name: "制动组", required: true, type: "可热插拔模块件" }, { name: "线杯", required: true, type: "可热插拔模块件" }, { name: "齿列", required: true, type: "可热插拔模块件" }],
            "主线": [{ name: "材质母件", required: true, type: "不可逆固化件" }, { name: "短涂层", required: false, type: "涂层" }, { name: "编织层", required: false, type: "编织层" }],
            "引线": [{ name: "材质母件", required: true, type: "不可逆固化件" }, { name: "缓冲层", required: false, type: "缓冲层" }, { name: "短涂层", required: false, type: "涂层" }],
            "鱼钩": [{ name: "钩型母件", required: true, type: "不可逆固化件" }, { name: "钩身线材", required: false, type: "可热插拔模块件" }],
            "拟饵": [{ name: "拟饵主体", required: true, type: "不可逆固化件" }, { name: "配重组", required: false, type: "可热插拔模块件" }]
        };

        // ==================== 区间配置 ====================
        const EQUIPMENT_RANGE = {
            "底钓竿": [-20, 20], "赛竿": [-10, -40], "路亚竿": [-20, 20],
            "纺车轮": [-28, 8], "鼓轮": [-5, 42],
            "主线": [-20, 20], "引线": [-20, 20],
            "鱼钩": [-15, 15], "拟饵": [-20, 20]
        };

        // ==================== 稀有度颜色 ====================
        const RARITY_COLORS = { "稀有": "#4a9eff", "史诗": "#a335ee", "传说": "#ff8000", "试验级": "#ff4040" };

        let currentEquipment = null, currentAssembly = {};

        // ==================== 面板管理 ====================
        function getOrCreatePanel() {
            let panel = document.getElementById('asm-sim-panel');
            if (panel) return panel;
            const grid = document.querySelector('.workshop-assembly-slot-grid');
            if (!grid) return null;
            panel = document.createElement('div');
            panel.id = 'asm-sim-panel';
            panel.className = 'card mt-sm';
            panel.innerHTML = `
                <strong>装配模拟器</strong>
                <div class="text-xs text-muted mt-xs">选择零件查看理论属性区间</div>
                <div class="workshop-assembly-slot-grid mt-sm" id="asm-sim-slots">
                    <div class="text-sm text-muted" style="grid-column:1/-1;">请先选择装备类型</div>
                </div>
                <div class="card mt-sm" id="asm-sim-preview">
                    <strong>区间预览</strong>
                    <div class="text-sm text-muted mt-sm">选满所有必选槽位后显示区间预览。</div>
                </div>
                <div class="flex items-center justify-between gap-sm mt-sm">
                    <span class="text-xs text-muted">数据仅供参考，实际效果请以游戏正式版为准。</span>
                    <button class="btn btn-ghost btn-sm" id="asm-sim-reset-btn">重置全部</button>
                </div>`;
            grid.closest('.card').parentNode.insertBefore(panel, grid.closest('.card').nextSibling);
            panel.querySelector('#asm-sim-reset-btn').addEventListener('click', () => {
                Object.keys(currentAssembly).forEach(k => currentAssembly[k] = null);
                renderSlots(); updatePreview();
            });
            return panel;
        }

        // ==================== 状态与渲染 ====================
        function getEquipmentType() {
            const tab = document.querySelector('.workshop-assembly-slot-grid')?.closest('.card')?.querySelector('.tab-active');
            return tab ? tab.textContent.trim() : null;
        }
        function getSlots() { return currentEquipment ? (EQUIPMENT_SLOTS[currentEquipment] || []) : []; }
        function getRange() { return currentEquipment ? (EQUIPMENT_RANGE[currentEquipment] || [-20, 20]) : [-20, 20]; }

        function initState() {
            currentEquipment = getEquipmentType();
            currentAssembly = {};
            getSlots().forEach(s => currentAssembly[s.name] = null);
        }

        function formatAttrShort(attrs) {
            if (!attrs) return '';
            const entries = Object.entries(attrs).filter(([k]) => !k.includes('号数') && !k.includes('号'));
            if (entries.length === 0) return '';
            return entries.length <= 3 ? entries.map(([k, v]) => `${k}: ${v}`).join(' · ') : entries.slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ') + ' ...';
        }

        function renderSlots() {
            const grid = document.getElementById('asm-sim-slots');
            if (!grid) return;
            const slots = getSlots();
            if (!slots.length) { grid.innerHTML = '<div class="text-sm text-muted" style="grid-column:1/-1;">请先选择装备类型</div>'; return; }
            grid.innerHTML = slots.map(s => {
                const p = currentAssembly[s.name], empty = !p, has = PART_LIBRARY[s.name]?.length > 0;
                return `<button class="loadout-slot workshop-assembly-slot-card ${empty ? 'workshop-assembly-slot-card--empty' : ''} ${!has ? 'workshop-assembly-slot-card--disabled' : ''}" data-slot="${s.name}" ${!has ? 'disabled' : ''}>
                    <div class="loadout-slot-top"><div class="loadout-slot-title"><span class="loadout-slot-label">${s.name}</span></div><span class="loadout-slot-action">${empty ? '选择' : '更换'}</span></div>
                    <span class="loadout-slot-empty" style="color:${p ? RARITY_COLORS[p.rarity] || '' : ''}">${p ? p.name : '未选择'}</span></button>`;
            }).join('');
            grid.querySelectorAll('.workshop-assembly-slot-card:not([disabled])').forEach(btn => {
                btn.addEventListener('click', () => showModal(btn.dataset.slot));
            });
        }

        function updatePreview() {
            const card = document.getElementById('asm-sim-preview');
            if (!card) return;
            const slots = getSlots(), [lo, hi] = getRange();
            let ok = true; const totals = {};
            slots.forEach(s => {
                const p = currentAssembly[s.name];
                if (s.required && !p) ok = false;
                if (p?.attributes) Object.entries(p.attributes).forEach(([k, v]) => totals[k] = (totals[k] || 0) + v);
            });
            if (!slots.length) card.innerHTML = '<strong>区间预览</strong><div class="text-sm text-muted mt-sm">请先选择装备类型。</div>';
            else if (!ok || !Object.keys(totals).length) card.innerHTML = '<strong>区间预览</strong><div class="text-sm text-muted mt-sm">选满所有必选槽位后显示区间预览。</div>';
            else card.innerHTML = `<strong>区间预览</strong><div class="flex flex-col gap-xs mt-sm">${Object.entries(totals).map(([k, v]) => `<div class="flex items-center justify-between text-sm"><span>${k}</span><span class="text-muted">${(v * (1 + lo / 100)).toFixed(2)} - ${(v * (1 + hi / 100)).toFixed(2)}</span></div>`).join('')}</div>`;
        }

        // ==================== 弹窗 ====================
        function showModal(slotName) {
            closeModal();
            const parts = PART_LIBRARY[slotName] || [];
            if (!parts.length) return;
            const sel = currentAssembly[slotName];
            const overlay = document.createElement('div');
            overlay.id = 'asm-sim-overlay';
            Object.assign(overlay.style, { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center' });
            const modal = document.createElement('div');
            modal.id = 'asm-sim-modal';
            modal.className = 'card';
            Object.assign(modal.style, { position: 'relative', zIndex: 99999, maxWidth: '520px', width: '92%', maxHeight: '78vh', overflowY: 'auto', padding: '16px' });
            modal.innerHTML = `
                <div class="flex items-center justify-between mb-sm" style="position:sticky;top:0;background:inherit;z-index:1;"><strong>选择 ${slotName}</strong><button class="btn btn-sm" id="asm-sim-close-btn">✕ 关闭</button></div>
                ${sel ? `<div class="alert alert-info mb-sm text-sm">当前已选: <span style="color:${RARITY_COLORS[sel.rarity] || '#fff'};">${sel.name}</span></div><button class="btn btn-sm btn-ghost mb-sm" id="asm-sim-clear-btn">清除选择</button>` : ''}
                <div class="flex flex-col gap-xs">${parts.map(p => {
                    const isSel = sel?.id === p.id;
                    return `<div class="asm-part-item flex items-center justify-between p-sm" data-part-id="${p.id}" style="cursor:pointer;border-radius:4px;background:${isSel ? 'var(--color-base-300,#333)' : 'transparent'};transition:background .15s;">
                        <div><span style="color:${RARITY_COLORS[p.rarity] || '#ccc'};font-weight:600;">${p.name}</span><span class="text-xs text-muted ml-xs">${p.rarity}</span></div>
                        <span class="text-xs text-muted">${formatAttrShort(p.attributes)}</span></div>`;
                }).join('')}</div>`;
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            document.getElementById('asm-sim-close-btn').addEventListener('click', closeModal);
            overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
            const clearBtn = document.getElementById('asm-sim-clear-btn');
            if (clearBtn) clearBtn.addEventListener('click', () => { currentAssembly[slotName] = null; renderSlots(); updatePreview(); closeModal(); });
            modal.querySelectorAll('.asm-part-item').forEach(item => {
                item.addEventListener('click', () => {
                    const p = parts.find(x => x.id === item.dataset.partId);
                    if (p) { currentAssembly[slotName] = p; renderSlots(); updatePreview(); closeModal(); }
                });
                item.addEventListener('mouseenter', function() { this.style.background = 'var(--color-base-300,#333)'; });
                item.addEventListener('mouseleave', function() { this.style.background = sel?.id === item.dataset.partId ? 'var(--color-base-300,#333)' : 'transparent'; });
            });
        }

        function closeModal() { const o = document.getElementById('asm-sim-overlay'); if (o) o.remove(); }

        // ==================== 入口 ====================
        function tryInit() {
            if (!document.querySelector('.workshop-assembly-slot-grid') || document.getElementById('asm-sim-panel')) return;
            getOrCreatePanel(); initState(); renderSlots(); updatePreview();
            const tabs = document.querySelector('.workshop-assembly-slot-grid')?.closest('.card')?.querySelector('.scroll-row');
            if (tabs) tabs.addEventListener('click', e => {
                if (e.target.closest('.tab')) setTimeout(() => { initState(); renderSlots(); updatePreview(); }, 150);
            });
        }

        function main() {
            tryInit();
            new MutationObserver(tryInit).observe(document.body, { childList: true, subtree: true });
            document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
        }

        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
        else main();
    })();
}
// 公告记录器
function initAnnounceLogger() {
    (function() {
        'use strict';
        if (!document.getElementById('announce-logger-merged-style')) {
            const style = document.createElement('style');
            style.id = 'announce-logger-merged-style';
            style.textContent = `
                #announce-logger-panel-merged {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 340px;
                    height: 100vh;
                    background: #1e272e;
                    color: #bdc3c7;
                    z-index: 9999;
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                    box-shadow: -3px 0 15px rgba(0,0,0,0.6);
                    font-family: sans-serif;
                }
                #announce-logger-panel-merged .header {
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #2c3e50;
                }
                #announce-logger-panel-merged .header h3 {
                    margin: 0;
                    color: #ecf0f1;
                    font-size: 16px;
                }
                #announce-logger-panel-merged .close-btn {
                    background: none;
                    border: none;
                    color: #ecf0f1;
                    font-size: 20px;
                    cursor: pointer;
                    line-height: 1;
                }
                #announce-logger-list-merged {
                    overflow-y: auto;
                    height: calc(100% - 70px);
                    padding: 10px 20px;
                    font-size: 14px;
                }
                #announce-logger-list-merged .entry {
                    border-bottom: 1px solid #2c3e50;
                    padding: 8px 0;
                }
                #announce-logger-list-merged .time {
                    font-size: 0.75em;
                    color: #7f8c8d;
                    margin-bottom: 2px;
                }
                #announce-logger-list-merged .text {
                    word-break: break-all;
                }
                #announce-logger-empty-merged {
                    text-align: center;
                    margin-top: 40px;
                    color: #7f8c8d;
                }
            `;
            document.head.appendChild(style);
        }
        const STORAGE_KEY = 'annc_logs_merged';
        const MAX_ITEMS = 1000;

        let logs = [];
        let lastText = '';
        let panel = null;
        let listDiv = null;

        function loadLogs() {
            try {
                const raw = GM_getValue(STORAGE_KEY);
                logs = Array.isArray(raw) ? raw : [];
                if (logs.length > MAX_ITEMS) logs = logs.slice(-MAX_ITEMS);
            } catch (e) {
                logs = [];
            }
        }

        function saveLogs() {
            GM_setValue(STORAGE_KEY, logs);
        }

        function addLog(text) {
            const clean = text.trim();
            if (!clean || clean === lastText) return;
            lastText = clean;
            logs.push({
                time: Date.now(),
                text: clean
            });
            if (logs.length > MAX_ITEMS) logs = logs.slice(-MAX_ITEMS);
            saveLogs();
            updatePanel();
        }

        function formatTime(timestamp) {
            return new Date(timestamp).toLocaleString();
        }

        function updatePanel() {
            if (!listDiv) return;
            if (logs.length === 0) {
                listDiv.innerHTML = '<div id="announce-logger-empty-merged">暂无记录</div>';
                return;
            }
            const html = logs.slice().reverse().map(log => `
                <div class="entry">
                    <div class="time">${escapeHtml(formatTime(log.time))}</div>
                    <div class="text">${escapeHtml(log.text)}</div>
                </div>
            `).join('');
            listDiv.innerHTML = html;
        }

        function escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        function buildPanel() {
            if (panel) return;
            panel = document.createElement('div');
            panel.id = 'announce-logger-panel-merged';
            panel.innerHTML = `
                <div class="header">
                    <h3>公告记录</h3>
                    <button class="close-btn">✕</button>
                </div>
                <div id="announce-logger-list-merged"></div>
            `;
            document.body.appendChild(panel);
            listDiv = panel.querySelector('#announce-logger-list-merged');
            panel.querySelector('.close-btn').addEventListener('click', togglePanel);
            document.addEventListener('click', (e) => {
                if (panel.style.transform === 'translateX(0px)' &&
                    !panel.contains(e.target)) {
                    togglePanel();
                }
            });
        }

        function togglePanel() {
            if (!panel) buildPanel();
            const opened = panel.style.transform === 'translateX(0px)';
            if (opened) {
                panel.style.transform = 'translateX(100%)';
                if (listDiv) listDiv.innerHTML = '';
            } else {
                updatePanel();
                panel.style.transform = 'translateX(0px)';
            }
        }

        function clearLogs() {
            logs = [];
            lastText = '';
            saveLogs();
            if (panel && panel.style.transform === 'translateX(0px)') {
                updatePanel();
            }
        }

        function checkBanner() {
            const span = document.querySelector('.app-announcement-banner span');
            if (span) addLog(span.textContent);
        }

        function registerMenuCommands() {
            const register = (typeof GM_registerMenuCommand === 'function') ? GM_registerMenuCommand :
                             (typeof GM !== 'undefined' && typeof GM.registerMenuCommand === 'function') ? GM.registerMenuCommand :
                             null;
            if (!register) {
                console.error('[公告记录器] 无法注册菜单命令');
                return;
            }
            register('查看公告记录', togglePanel);
            register('清空公告记录', clearLogs);
            console.log('[公告记录器] 菜单命令已注册');
        }

        // ---- 启动 ----
        function init() {
            loadLogs();
            buildPanel();
            checkBanner();
            const bannerEl = document.querySelector('.app-announcement-banner');
            const targetNode = bannerEl ? bannerEl.parentNode : document.body;
            const observer = new MutationObserver(() => checkBanner());
            observer.observe(targetNode, { childList: true, subtree: true, characterData: true });
            registerMenuCommands();
            console.log('[公告记录器] 已启动');
        }

        if (document.readyState === 'complete') {
            init();
        } else {
            window.addEventListener('DOMContentLoaded', init);
        }
    })();
}
// 鱼获卡片分级背景标记
function initFishCardGradeColor() {
    (function() {
        'use strict';
        const FISH_OBSERVER_OPTIONS = { childList: true, subtree: true };
        const GRADE_STYLES = {
            '不达标': { bg: '#CDD3DC', border: '#8390A0' },
            '达标':   { bg: '#C2EFD5', border: '#6FB58A' },
            '稀有':   { bg: '#C5DAFC', border: '#7A9EE0' },
            '罕见':   { bg: '#F7E2B5', border: '#D49E40' },
            '传说':   { bg: '#F5CDCE', border: '#D47478' }
        };
        const LOW_RATING_STYLE = { bg: '#F4F0A2', border: '#C4B530' };
        const LOW_RATING_THRESHOLD = 2.0;

        function getFishCardGradeInfo(card) {
            const metaLine = card.querySelector('.square-card-meta-line');
            if (!metaLine) return null;

            const metaSpans = metaLine.querySelectorAll('.inline-meta');
            if (metaSpans.length < 2) return null;

            const gradeText = metaSpans[0].textContent.trim();
            const percentText = metaSpans[1].textContent.trim().replace('%', '');
            const percent = parseFloat(percentText);
            if (isNaN(percent)) return null;

            return { grade: gradeText, percent: percent };
        }

        function applyCardStyle(card) {
            if (card.dataset.fishGradeStyled) return;

            const info = getFishCardGradeInfo(card);
            if (!info) return;

            let style;
            if (info.percent < LOW_RATING_THRESHOLD) {
                style = LOW_RATING_STYLE;
            } else {
                style = GRADE_STYLES[info.grade];
                if (!style) return;
            }

            card.style.backgroundColor = style.bg;
            card.style.border = '2px solid ' + style.border;
            card.dataset.fishGradeStyled = 'true';
        }

        function processAllCards() {
            document.querySelectorAll('.square-item-card:not([data-fish-grade-styled])').forEach(card => {
                if (!card.querySelector('.square-card-meta-line')) return;
                applyCardStyle(card);
            });
        }

        setTimeout(processAllCards, 500);
        const fishObserver = new MutationObserver(lfDebounce(processAllCards, 150));
        fishObserver.observe(document.body, FISH_OBSERVER_OPTIONS);
        console.log('[鱼获卡片分级背景标记] 已启动（浅色背景+深色边框）');
    })();
}
// 14. 鱼获卡片分级动态辉光
function initFishCardGlow() {
    (function() {
        'use strict';
        const FISH_OBSERVER_OPTIONS = { childList: true, subtree: true };
        const LOW_RATING_THRESHOLD = 2.0;

        // 辉光颜色（取自边框色并提高亮度）
        const GLOW_COLORS = {
            '不达标': '#A0B0C0',
            '达标':   '#90D0A0',
            '稀有':   '#A0C0F0',
            '罕见':   '#F0C880',
            '传说':   '#F08090'
        };
        const LOW_RATING_GLOW_COLOR = '#E0D030';

        // 呼吸周期（秒）：传说最快 → 不达标最慢
        const GLOW_SPEEDS = {
            '不达标': 2.5,
            '达标':   2.0,
            '稀有':   1.6,
            '罕见':   1.2,
            '传说':   0.8,
            'lowRating': 2.2   // <2% 的呼吸速度（略快于达标）
        };

        // 随机偏移量，防止所有卡片同步呼吸
        function randDelay(max = 2.0) {
            return (Math.random() * max).toFixed(2);
        }

        // 动态插入 @keyframes
        function injectKeyframes() {
            if (document.getElementById('fish-glow-keyframes')) return;
            const style = document.createElement('style');
            style.id = 'fish-glow-keyframes';
            let css = '';
            for (const [grade, color] of Object.entries(GLOW_COLORS)) {
                css += `
                @keyframes fishGlow-${grade.replace(/\s/g, '_')} {
                    0%, 100% { box-shadow: 0 0 6px 0px ${color}40; }
                    50%      { box-shadow: 0 0 12px 2px ${color}90; }
                }`;
            }
            // 低评分动画
            css += `
            @keyframes fishGlow-lowRating {
                0%, 100% { box-shadow: 0 0 6px 0px ${LOW_RATING_GLOW_COLOR}40; }
                50%      { box-shadow: 0 0 12px 2px ${LOW_RATING_GLOW_COLOR}90; }
            }`;
            style.textContent = css;
            document.head.appendChild(style);
        }

        // 提取等级信息（复用已有逻辑）
        function getFishCardGradeInfo(card) {
            const metaLine = card.querySelector('.square-card-meta-line');
            if (!metaLine) return null;
            const metaSpans = metaLine.querySelectorAll('.inline-meta');
            if (metaSpans.length < 2) return null;
            const gradeText = metaSpans[0].textContent.trim();
            const percentText = metaSpans[1].textContent.trim().replace('%', '');
            const percent = parseFloat(percentText);
            if (isNaN(percent)) return null;
            return { grade: gradeText, percent: percent };
        }

        // 为卡片应用辉光类
        function applyGlow(card) {
            if (card.dataset.fishGlowApplied) return;
            const info = getFishCardGradeInfo(card);
            if (!info) return;

            let animName, duration;
            if (info.percent < LOW_RATING_THRESHOLD) {
                animName = 'fishGlow-lowRating';
                duration = GLOW_SPEEDS.lowRating;
            } else {
                const speed = GLOW_SPEEDS[info.grade];
                if (!speed) return;
                animName = `fishGlow-${info.grade.replace(/\s/g, '_')}`;
                duration = speed;
            }

            card.style.animation = `${animName} ${duration}s ease-in-out ${randDelay()}s infinite`;
            card.dataset.fishGlowApplied = 'true';
        }

        // 批量处理
        function processAllCards() {
            document.querySelectorAll('.square-item-card:not([data-fish-glow-applied])').forEach(card => {
                if (!card.querySelector('.square-card-meta-line')) return;
                applyGlow(card);
            });
        }

        // 启动
        injectKeyframes();
        setTimeout(processAllCards, 600);
        const fishObserver = new MutationObserver(lfDebounce(processAllCards, 150));
        fishObserver.observe(document.body, FISH_OBSERVER_OPTIONS);
        console.log('[鱼获卡片动态辉光] 已启动（传说最快）');
    })();
}
// 15. 高难挑战鱼种资料自动展示
function initChallengeFishInfo() {
    (function() {
        'use strict';
        const CHALLENGE_OBSERVER_OPTIONS = { childList: true, subtree: true };

        function getFishDb() { return getFishDatabaseItems(); }

        // 名称标准化
        function normalizeName(str) {
            return str.trim().replace(/\s+/g, '');
        }

        // 根据鱼名查找数据库条目（兼容您提供的 JSON 结构）
        function findFishData(fishName) {
            const cleaned = normalizeName(fishName);
            return getFishDb().find(fish => {
                const dbName = fish.名称 || fish.name || ''; // 兼容多种键名
                return normalizeName(dbName) === cleaned;
            }) || null;
        }

        // 提取字段辅助函数
        function getDetail(fishData, key) {
            if (fishData.详情 && fishData.详情[key] !== undefined) {
                return fishData.详情[key];
            }
            if (fishData[key] !== undefined) {
                return fishData[key];
            }
            return '—';
        }

        // 构建信息面板
        function buildInfoPanel(fishData) {
            const area = getDetail(fishData, '分布区域');
            const layer = getDetail(fishData, '水层');
            const bait = getDetail(fishData, '偏好饵料');
            const lure = getDetail(fishData, '偏好拟饵');
            const minWeight = getDetail(fishData, '最小重量');
            const minSize = getDetail(fishData, '最小尺寸');

            const panel = document.createElement('div');
            panel.className = 'challenge-fish-info-panel';
            panel.style.cssText = `
                margin-top: 0.5rem;
                padding: 0.5rem 0.75rem;
                background: rgba(255,255,255,0.06);
                border-radius: 6px;
                font-size: 0.85rem;
                line-height: 1.6;
                color: var(--color-text-secondary, #94a3b8);
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.2rem 1rem;
            `;
            panel.innerHTML = `
                <span><strong>分布区域</strong> ${area}</span>
                <span><strong>水层</strong> ${layer}</span>
                <span><strong>偏好饵料</strong> ${bait}</span>
                <span><strong>偏好拟饵</strong> ${lure}</span>
                <span><strong>最小重量</strong> ${minWeight}</span>
                <span><strong>最小尺寸</strong> ${minSize}</span>
            `;
            return panel;
        }

        // 处理单个挑战卡片
        function enhanceChallengeCard(card) {
            if (card.dataset.challengeInfoEnhanced) return;

            const nameEl = card.querySelector('.license-name');
            if (!nameEl) return;
            const fishName = nameEl.textContent.trim();
            if (!fishName) return;

            const fishData = findFishData(fishName);
            if (!fishData) return; // 数据库中没有该鱼种则不处理

            const progressEl = card.querySelector('.task-progress');
            if (!progressEl) return;
            progressEl.insertAdjacentElement('afterend', buildInfoPanel(fishData));
            card.dataset.challengeInfoEnhanced = 'true';
        }

        // 批量处理
        function processAllChallenges() {
            document.querySelectorAll('.license-card').forEach(card => {
                enhanceChallengeCard(card);
            });
        }

        // 启动
        setTimeout(processAllChallenges, 500);
        const challengeObserver = new MutationObserver(() => processAllChallenges());
        challengeObserver.observe(document.body, CHALLENGE_OBSERVER_OPTIONS);
        console.log('[高难挑战鱼种资料] 已启动（数据库条目：' + FISH_DB.length + '）');
    })();
}
// 16. 钓鱼实时状态波动图
function initRealtimeChart() {
    (function() {
        'use strict';

        const UPDATE_INTERVAL = 500;
        const MAX_DATA_POINTS = 500;          // 总共保留点数（包含首个固定点）
        const CHART_HEIGHT = 160;
        const LINE_COLORS = {
            lineOut: '#D1D1D1',
            playerStamina: '#2F82CC',
            fishStamina: '#ef4444'
        };
        const LINE_LABELS = {
            tension: '张力',
            lineOut: '出线',
            playerStamina: '玩家体力',
            fishStamina: '鱼体力'
        };
        const GRID_COLOR = '#334155';
        const TEXT_COLOR = '#94a3b8';

        let canvas, ctx;
        let dataPoints = [];                  // 始终保留第一个点为 R1
        let lastRecordedRound = null;
        let chartInserted = false;
        let chartInterval = null;

        // 获取包含“实时状态”标题的卡片
        function getStatusCard() {
            const cards = document.querySelectorAll('.fishing-compact-card');
            for (const card of cards) {
                const header = card.querySelector('.flex.items-center.gap-sm span');
                if (header && header.textContent.trim() === '实时状态') {
                    return card;
                }
            }
            return null;
        }

        // 获取当前轮次
        function getCurrentRound() {
            const statusCard = getStatusCard();
            if (!statusCard) return null;
            const roundEl = statusCard.querySelector('.text-xs.text-muted');
            if (!roundEl) return null;
            const match = roundEl.textContent.match(/第\s*(\d+)\s*轮/);
            return match ? match[1] : null;
        }

        // 读取四个指标百分比
        function readPercentages() {
            const statusCard = getStatusCard();
            if (!statusCard) return null;

            const metricCards = statusCard.querySelectorAll('.fishing-metric-card');
            const values = { tension: undefined, lineOut: undefined, playerStamina: undefined, fishStamina: undefined };

            for (const card of metricCards) {
                const labelEl = card.querySelector('.fishing-metric-label');
                if (!labelEl) continue;
                const text = labelEl.textContent.trim();

                if (text.includes('张力') && values.tension === undefined) {
                    values.tension = extractPercent(card);
                } else if (text.includes('出线') && values.lineOut === undefined) {
                    values.lineOut = extractPercent(card);
                } else if (text.includes('玩家体力') && values.playerStamina === undefined) {
                    values.playerStamina = extractPercent(card);
                } else if (text.includes('鱼体力') && values.fishStamina === undefined) {
                    values.fishStamina = extractPercent(card);
                }
            }

            if (Object.values(values).some(v => v === undefined)) return null;
            return values;
        }

        function extractPercent(card) {
            const fill = card.querySelector('.progress-bar-fill');
            if (!fill || !fill.style.width) return undefined;
            const w = parseFloat(fill.style.width);
            if (isNaN(w)) return undefined;
            return w / 100;
        }

        // 动态获取张力进度条颜色
        function getDynamicTensionColor() {
            const statusCard = getStatusCard();
            if (!statusCard) return '#22c55e';
            const cards = statusCard.querySelectorAll('.fishing-metric-card');
            for (const card of cards) {
                const label = card.querySelector('.fishing-metric-label');
                if (label && label.textContent.trim().includes('张力')) {
                    const fill = card.querySelector('.progress-bar-fill');
                    if (fill) {
                        const style = window.getComputedStyle(fill);
                        return style.backgroundColor || '#22c55e';
                    }
                }
            }
            return '#22c55e';
        }

        // 插入 Canvas
        function insertChart() {
            if (chartInserted) return;
            const targetCard = getStatusCard();
            if (!targetCard) return;

            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'realtime-chart-wrapper';
            chartWrapper.style.marginBottom = '0.5rem';

            canvas = document.createElement('canvas');
            canvas.width = targetCard.clientWidth || 600;
            canvas.height = CHART_HEIGHT;
            canvas.style.width = '100%';
            canvas.style.height = CHART_HEIGHT + 'px';
            canvas.style.background = 'rgba(15, 23, 42, 0.8)';
            canvas.style.borderRadius = '8px';

            chartWrapper.appendChild(canvas);
            targetCard.parentNode.insertBefore(chartWrapper, targetCard);

            ctx = canvas.getContext('2d');
            chartInserted = true;

            window.addEventListener('resize', () => {
                if (canvas && targetCard) {
                    canvas.width = targetCard.clientWidth || 600;
                    drawChart();
                }
            });
        }

        // 绘制图表
        function drawChart() {
            if (!ctx || !canvas) return;
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, w, h);

            if (dataPoints.length === 0) {
                ctx.fillStyle = TEXT_COLOR;
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('等待钓鱼数据…', w / 2, h / 2);
                return;
            }

            const padding = { top: 20, bottom: 30, left: 40, right: 20 };
            const chartW = w - padding.left - padding.right;
            const chartH = h - padding.top - padding.bottom;

            // 网格与Y轴
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = 0.5;
            ctx.fillStyle = TEXT_COLOR;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            for (let i = 0; i <= 4; i++) {
                const y = padding.top + (chartH * i / 4);
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(w - padding.right, y);
                ctx.stroke();
                ctx.fillText((100 - i * 25) + '%', padding.left - 5, y + 3);
            }

            // X轴轮次标签（R1 始终位于最左，其余点标签按需显示）
            const totalPoints = dataPoints.length;
            let labelStep = 1;
            if (totalPoints > 15) labelStep = Math.floor(totalPoints / 10);
            if (labelStep < 1) labelStep = 1;
            ctx.textAlign = 'center';
            ctx.fillStyle = TEXT_COLOR;
            ctx.font = '9px sans-serif';
            for (let i = 0; i < totalPoints; i += labelStep) {
                const x = padding.left + (chartW * i / (totalPoints - 1 || 1));
                ctx.fillText('R' + dataPoints[i].round, x, h - padding.bottom + 12);
            }

            // 绘制折线（张力使用动态颜色）
            const dynamicTensionColor = getDynamicTensionColor();
            const keys = ['tension', 'lineOut', 'playerStamina', 'fishStamina'];
            const yPos = (val) => padding.top + chartH * (1 - val);
            keys.forEach(key => {
                ctx.strokeStyle = key === 'tension' ? dynamicTensionColor : LINE_COLORS[key];
                ctx.lineWidth = 2;
                ctx.beginPath();
                dataPoints.forEach((point, idx) => {
                    const x = padding.left + (chartW * idx / (totalPoints - 1 || 1));
                    const y = yPos(point[key]);
                    if (idx === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
            });

            // 图例（右上角）
            const legendX = w - padding.right - 110;
            const legendY = padding.top;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'left';
            keys.forEach((key, i) => {
                const y = legendY + i * 18;
                ctx.fillStyle = key === 'tension' ? dynamicTensionColor : LINE_COLORS[key];
                ctx.fillRect(legendX, y - 7, 12, 12);
                ctx.fillStyle = TEXT_COLOR;
                ctx.fillText(LINE_LABELS[key], legendX + 18, y + 2);
            });
        }

        // 更新数据（平坦省略 + R1 固定逻辑）
        function updateData() {
            const round = getCurrentRound();
            const percents = readPercentages();
            if (!round || !percents) return;

            if (dataPoints.length === 0) {
                // 首次记录
                dataPoints.push({ round, ...percents });
                lastRecordedRound = round;
            } else if (round !== lastRecordedRound) {
                // 轮次变化
                const last = dataPoints[dataPoints.length - 1];
                if (last.tension === percents.tension &&
                    last.lineOut === percents.lineOut &&
                    last.playerStamina === percents.playerStamina &&
                    last.fishStamina === percents.fishStamina) {
                    // 数据未变，仅更新轮次记忆
                    lastRecordedRound = round;
                } else {
                    // 数据有变，追加新点
                    dataPoints.push({ round, ...percents });
                    lastRecordedRound = round;

                    // 超出上限时裁剪：保留第一个（R1） + 最后 MAX-1 个
                    if (dataPoints.length > MAX_DATA_POINTS) {
                        const first = dataPoints[0];
                        const rest = dataPoints.slice(-(MAX_DATA_POINTS - 1));
                        dataPoints = [first, ...rest];
                    }
                }
            } else {
                // 轮次未变，更新最后一个点
                const last = dataPoints[dataPoints.length - 1];
                last.tension = percents.tension;
                last.lineOut = percents.lineOut;
                last.playerStamina = percents.playerStamina;
                last.fishStamina = percents.fishStamina;
            }

            drawChart();
        }

        function start() {
            if (!getStatusCard()) {
                setTimeout(start, 1000);
                return;
            }
            insertChart();
            if (chartInterval) clearInterval(chartInterval);
            chartInterval = setInterval(updateData, UPDATE_INTERVAL);
            updateData();
            console.log('[钓鱼实时波动图] 已启动（R1固定 + 动态色调）');
        }

        function stop() {
            if (chartInterval) {
                clearInterval(chartInterval);
                chartInterval = null;
            }
        }

        const domObserver = new MutationObserver(lfDebounce(() => {
            const statusCard = getStatusCard();
            if (!statusCard && chartInserted) {
                if (canvas && canvas.parentNode) canvas.parentNode.remove();
                chartInserted = false;
                stop();
                dataPoints = [];
                lastRecordedRound = null;
                console.log('[钓鱼实时波动图] 已停止');
            } else if (statusCard && !chartInserted) {
                start();
            }
        }, 200));
        domObserver.observe(document.body, { childList: true, subtree: true });

        setTimeout(start, 800);
    })();
}
// 功能：鱼获卡片重量标记
function initFishWeightGlow() {
    (function() {
        'use strict';
        const WEIGHT_MARKS = [
            { min: 10000, border: '#FF1744', stripe: '#D50000', bg: '#B71C1C' },       // 血红色（绝命巨物）
            { min: 8000,  max: 9999,  border: '#FF5252', stripe: '#C62828', bg: '#B71C1C' }, // 深红（深渊巨兽）
            { min: 6000,  max: 7999,  border: '#FF8A80', stripe: '#D32F2F', bg: '#C62828' }, // 浅红（致命大鱼）
            { min: 5000,  max: 5999,  border: '#FFAB40', stripe: '#E65100', bg: '#BF360C' }, // 橙色（极度危险）
            { min: 4000,  max: 4999,  border: '#FFD740', stripe: '#F57C00', bg: '#E65100' }, // 琥珀（高危险）
            { min: 3000,  max: 3999,  border: '#FFD54F', stripe: '#F9A825', bg: '#F57F17' }, // 金黄（中等危险）
            { min: 2000,  max: 2999,  border: '#64B5F6', stripe: '#1E88E5', bg: '#1565C0' }, // 蓝色（大型）
            { min: 1000,  max: 1999,  border: '#81C784', stripe: '#388E3C', bg: '#2E7D32' }, // 绿色（中型）
            { min: 500,   max: 999,   border: '#90A4AE', stripe: '#546E7A', bg: '#37474F' }, // 灰色（小型）
            { min: 0,     max: 499,   border: '#B0BEC5', stripe: '#607D8B', bg: '#455A64' }, // 浅灰（幼鱼）
        ];
        function isRegionFishSpeciesCard(card) {
            return card instanceof Element && !!card.closest('.region-fish-grid');
        }
        function isFishCard(card) {
            if (isRegionFishSpeciesCard(card)) return false;
            return card.classList.contains('region-fish-card') ||
                   card.querySelector('.lucide-fish') !== null;
        }
        function getWeight(card) {
            if (isRegionFishSpeciesCard(card)) return null;
            const content = card.querySelector('.region-fish-card-content') || card;
            const textNodes = content.querySelectorAll('.text-xs.text-muted');
            for (const node of textNodes) {
                const text = node.textContent.trim();
                // 可遇鱼类展示的是重量区间（如 325g-40.1kg），不做危险色条标记
                if (/\d+\s*g\s*[-–—]\s*[\d.]+\s*kg/i.test(text)
                    || /\d+\s*g\s*[-–—]\s*[\d.]+\s*g/i.test(text)) {
                    return null;
                }
                const match = text.match(/([\d,]+(?:\.\d+)?)\s*kg/i);
                if (match) {
                    const value = parseFloat(match[1].replace(/,/g, ''));
                    return isNaN(value) ? null : value;
                }
            }
            return null;
        }
        function getMark(weight) {
            for (const rule of WEIGHT_MARKS) {
                if (weight >= rule.min && weight <= (rule.max ?? Infinity)) {
                    return rule;
                }
            }
            return WEIGHT_MARKS[0];
        }
        function applyMark(card) {
            if (card.dataset.weightMarked) return;
            const weight = getWeight(card);
            if (weight === null) return;
            const mark = getMark(weight);
            if (!mark) return;
            card.style.borderLeft = `3px solid ${mark.stripe}`;
            card.style.paddingLeft = '4px';
            card.style.borderBottom = `2px solid ${mark.border}80`;
            card.style.background = `
                linear-gradient(180deg,
                    ${mark.bg}18 0%,
                    ${mark.bg}06 50%,
                    transparent 100%
                )
            `;
            card.dataset.weightMarked = 'true';
        }
        function clearStaleRegionFishMarks() {
            document.querySelectorAll('.region-fish-grid .region-fish-card').forEach(card => {
                if (!card.dataset.weightMarked && !card.style.borderLeft) return;
                delete card.dataset.weightMarked;
                card.style.removeProperty('border-left');
                card.style.removeProperty('padding-left');
                card.style.removeProperty('border-bottom');
                card.style.removeProperty('background');
            });
        }
        function processAll() {
            clearStaleRegionFishMarks();
            document.querySelectorAll('.square-item-card:not([data-weight-marked]), .region-fish-card:not([data-weight-marked])').forEach(card => {
                if (isFishCard(card)) applyMark(card);
            });
        }
        setTimeout(processAll, 500);
        const observer = new MutationObserver(lfDebounce(processAll, 150));
        observer.observe(document.body, { childList: true, subtree: true });
        console.log('[鱼获重量标记] 已启动（危险信号配色）');
    })();
}
// 功能：本周目标鱼场地显示
function initWeeklyTarget() {
    (function() {
        'use strict';

        const PANEL_CLASS = 'weekly-spot-panel-v11';

        // 稀有度 → 颜色
        const RARITY_COLORS = {
            '传奇': '#DAA520',
            '传说': '#FF8C00',
            '罕见': '#B8860B',
            '稀有': '#CD853F',
            '少见': '#A0A0A0',
        };

        function getRarityColor(rarity) {
            return RARITY_COLORS[rarity] || '#475569';
        }

        // 构建鱼名 → {场地, 稀有度}
        function buildFishMap() {
            const map = new Map();
            const items = getFishDatabaseItems();
            if (!items.length) return map;

            items.forEach(item => {
                const name = (item.name || item['名称'] || '').trim();
                const rarity = item['稀有度'] || '';
                const details = item.details || item['详情'] || {};
                const spot = details['分布区域'] || '';
                if (name && spot) map.set(name, { spot, rarity });
            });

            return map;
        }

        let _fishMapCache = null;
        function getFishMap() {
            if (!_fishMapCache) _fishMapCache = buildFishMap();
            return _fishMapCache;
        }

        function getFishName(card) {
            const nameEl = card.querySelector('.item-name');
            if (!nameEl) return null;
            for (const node of nameEl.childNodes) {
                if (node.nodeType === 3 && node.textContent.trim()) {
                    return node.textContent.trim();
                }
            }
            return nameEl.textContent.trim();
        }

        function getWeeklyFishNames() {
            const cards = document.querySelectorAll('.weekly-target-fish-card');
            return [...new Set([...cards].map(getFishName).filter(Boolean))];
        }

        function groupBySpot(fishNames) {
            const map = new Map();
            fishNames.forEach(fishName => {
                const info = getFishMap().get(fishName);
                if (!info) return;
                info.spot.split(/[,，、;；]/).map(s => s.trim()).filter(Boolean).forEach(s => {
                    if (!map.has(s)) map.set(s, []);
                    map.get(s).push({ name: fishName, rarity: info.rarity });
                });
            });
            return map;
        }

        // 创建场地卡片
        function createSpotCard(spotName, fishList) {
            const card = document.createElement('div');
            card.style.cssText = `
                border: 1px solid rgba(100, 116, 139, 0.15);
                background: rgba(241, 245, 249, 0.35);
                border-radius: 8px;
                padding: 10px 14px;
                min-width: 160px;
                flex: 1 1 auto;
            `;

            // 场地名
            const spotDiv = document.createElement('div');
            spotDiv.style.cssText = 'color:#334155;font-weight:700;font-size:0.9em;margin-bottom:6px;';
            spotDiv.textContent = spotName;
            card.appendChild(spotDiv);

            // 鱼名列表（带颜色）
            const fishDiv = document.createElement('div');
            fishDiv.style.cssText = 'font-size:0.8em;font-weight:500;line-height:1.8;';

            fishList.forEach((fish, index) => {
                const span = document.createElement('span');
                span.textContent = fish.name;
                span.style.cssText = `
                    color: ${getRarityColor(fish.rarity)};
                    font-weight: 700;
                `;
                fishDiv.appendChild(span);

                if (index < fishList.length - 1) {
                    const sep = document.createElement('span');
                    sep.textContent = '  ·  ';
                    sep.style.cssText = 'color:#94a3b8;font-weight:400;';
                    fishDiv.appendChild(sep);
                }
            });

            card.appendChild(fishDiv);
            return card;
        }

        // 渲染面板
        function renderSpotPanel() {
            const grid = document.querySelector('.weekly-target-fish-grid');
            if (!grid || document.querySelector('.' + PANEL_CLASS)) return;

            const fishNames = getWeeklyFishNames();
            if (fishNames.length === 0) return;

            const grouped = groupBySpot(fishNames);
            if (grouped.size === 0) return;

            requestAnimationFrame(() => {
                const panel = document.createElement('div');
                panel.className = 'card mt-sm ' + PANEL_CLASS;
                panel.style.cssText = 'padding:12px 14px;';

                const title = document.createElement('div');
                title.style.cssText = 'color:#64748b;font-size:0.78em;font-weight:600;margin-bottom:8px;';
                title.textContent = '本周目标鱼可钓场地';
                panel.appendChild(title);

                const spotGrid = document.createElement('div');
                spotGrid.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';

                grouped.forEach((fishList, spotName) => {
                    spotGrid.appendChild(createSpotCard(spotName, fishList));
                });

                panel.appendChild(spotGrid);
                grid.parentNode.insertBefore(panel, grid.nextSibling);
            });
        }

        let timer = null;

        function init() {
            renderSpotPanel();

            const target = document.querySelector('.weekly-competition-panel') || document.body;
            const observer = new MutationObserver(() => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    const old = document.querySelector('.' + PANEL_CLASS);
                    if (old) old.remove();
                    renderSpotPanel();
                }, 250);
            });
            observer.observe(target, { childList: true, subtree: true });
        }

        if (document.readyState === 'complete') init();
        else window.addEventListener('DOMContentLoaded', init);
    })();
}
// 功能：上鱼记录统计总结
function initCatchSummary() {
    (function() {
        'use strict';

        const PANEL_ID = 'catch-summary-panel-v8';

        const GRADE_COLORS = {
            '不达标': '#94a3b8',
            '达标': '#4ade80',
            '稀有': '#60a5fa',
            '罕见': '#fbbf24',
            '传说': '#f87171',
        };
        const GRADE_ORDER = ['不达标', '达标', '稀有', '罕见', '传说'];
        const SCORE_EPS = 1e-6;
        const HENHUO_COLOR = '#3b82f6';
        const BAIBEI_COLOR = '#ef4444';

        function isThresholdScore(score, target) {
            return typeof score === 'number' && Number.isFinite(score)
                && Math.abs(score - target) < SCORE_EPS;
        }

        function specialCatchMark(score) {
            if (typeof score !== 'number' || !Number.isFinite(score)) return null;
            if (isThresholdScore(score, 1)) return '狠活';
            if (isThresholdScore(score, 95.01)) return '狠活';
            if (isThresholdScore(score, 99.01)) return '狠活';
            if (isThresholdScore(score, 99.96)) return '狠活';
            if (score >= 5 && score <= 6) return '败北';
            if (score >= 94 && score < 95) return '败北';
            if (score >= 98.85 && score < 99) return '败北';
            if (score >= 99.85 && score < 99.95) return '败北';
            return null;
        }

        function parseCard(card) {
            const isCatch = card.classList.contains('message-card--catch');
            const isReeling = card.classList.contains('message-card--reeling');
            if (!isCatch && !isReeling) return null;

            const titleEl = card.querySelector('.message-title');
            const titleText = titleEl ? titleEl.textContent.trim() : '';
            let fishName = null;
            const nm = titleText.match(/[：:]\s*(.+)/);
            if (nm) fishName = nm[1].replace(/\s*(狠活|败北)\s*$/, '').trim();

            const detailEl = card.querySelector('.text-sm.text-muted');
            const detailText = detailEl ? detailEl.textContent.trim() : '';
            let grade = null, weight = null, score = null;
            const gm = detailText.match(/(不达标|达标|稀有|罕见|传说)/);
            if (gm) grade = gm[1];
            const sm = detailText.match(/([\d.]+)\s*%/);
            if (sm) score = parseFloat(sm[1]);
            const wm = detailText.match(/([\d,.]+)\s*kg/);
            if (wm) weight = parseFloat(wm[1].replace(/,/g, ''));

            const intervalEl = card.querySelector('.catch-interval');
            let interval = null;
            if (intervalEl) {
                const im = intervalEl.textContent.match(/(\d+)/);
                if (im) interval = parseInt(im[1]);
            }

            const timeMatch = card.textContent.match(/\d{4}\/\d{2}\/\d{2}\s+\d{1,2}:\d{2}:\d{2}/);
            const timestamp = timeMatch ? Date.parse(timeMatch[0].replace(/\//g, '-').replace(/\s+/, 'T')) : null;

            return { type: isCatch ? '上鱼' : '脱钩', fishName, grade, weight, score, interval, timestamp };
        }

        // 钓鱼主题鱼种配色（海洋系）
        const FISH_COLORS = [
            '#38bdf8', '#60a5fa', '#3b82f6', '#1d4ed8',  // 蓝色系
            '#4ade80', '#22c55e', '#16a34a',               // 绿色系
            '#fbbf24', '#f59e0b', '#d97706',               // 金色系
            '#f87171', '#ef4444', '#dc2626',               // 红色系
            '#a78bfa', '#8b5cf6', '#7c3aed',               // 紫色系
            '#fb923c', '#f97316', '#ea580c',               // 橙色系
        ];

        function computeStats(cards) {
            const s = {
                catches: 0, failures: 0, grades: {}, fishBuckets: {},
                weights: [], intervals: [], recentIntervalEntries: [], maxW: 0, maxFish: '',
                henhuoCount: 0, baibeiCount: 0,
            };
            cards.forEach((c, index) => {
                const d = parseCard(c);
                if (!d) return;
                d.domIndex = index;
                if (d.type === '上鱼') {
                    s.catches++;
                    if (d.grade) s.grades[d.grade] = (s.grades[d.grade] || 0) + 1;
                    const mark = specialCatchMark(d.score);
                    if (mark === '狠活') s.henhuoCount++;
                    if (mark === '败北') s.baibeiCount++;
                    if (d.fishName) {
                        const bucket = s.fishBuckets[d.fishName] ?? { normal: 0, henhuo: 0, baibei: 0 };
                        if (mark === '狠活') bucket.henhuo++;
                        else if (mark === '败北') bucket.baibei++;
                        else bucket.normal++;
                        s.fishBuckets[d.fishName] = bucket;
                    }
                    if (d.weight) {
                        s.weights.push(d.weight);
                        if (d.weight > s.maxW) { s.maxW = d.weight; s.maxFish = d.fishName || ''; }
                    }
                } else s.failures++;
                if (d.interval) {
                    s.intervals.push(d.interval);
                    if (d.type === '上鱼') s.recentIntervalEntries.push(d);
                }
            });
            s.total = s.catches + s.failures;
            s.rate = s.total > 0 ? Math.round(s.catches / s.total * 100) : 0;
            s.avgInterval = s.intervals.length > 0
                ? Math.round(s.intervals.reduce((a, b) => a + b, 0) / s.intervals.length) : 0;
            const recentIntervals = s.recentIntervalEntries
                .sort((a, b) => {
                    if (a.timestamp != null && b.timestamp != null) return b.timestamp - a.timestamp;
                    return a.domIndex - b.domIndex;
                })
                .slice(0, 20)
                .map(item => item.interval);
            s.recent20AvgInterval = recentIntervals.length > 0
                ? Math.round(recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length) : 0;
            s.recent20Count = recentIntervals.length;
            // 鱼种列表：普通 / 狠活 / 败北 分开展示
            s.allFish = [];
            Object.entries(s.fishBuckets).forEach(([name, bucket]) => {
                if (bucket.normal > 0) s.allFish.push({ label: name, count: bucket.normal, mark: null });
                if (bucket.henhuo > 0) s.allFish.push({ label: name, count: bucket.henhuo, mark: '狠活' });
                if (bucket.baibei > 0) s.allFish.push({ label: name, count: bucket.baibei, mark: '败北' });
            });
            s.allFish.sort((a, b) => b.count - a.count);
            return s;
        }

        function renderFishMarkBadge(mark) {
            if (!mark) return '';
            const color = mark === '狠活' ? HENHUO_COLOR : BAIBEI_COLOR;
            return `<span class="lf-special-mark" style="display:inline-block;margin-left:2px;padding:0 4px;border-radius:4px;font-size:0.92em;font-weight:700;line-height:1.3;color:#fff;background:${color};vertical-align:baseline;">${mark}</span>`;
        }

        function createPanel(stats) {
            const old = document.getElementById(PANEL_ID);
            if (old) old.remove();

            const panel = document.createElement('div');
            panel.id = PANEL_ID;
            panel.className = 'card mt-sm';
            panel.style.cssText = 'padding:12px 14px;';

            // 标题
            const header = document.createElement('div');
            header.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:8px;';
            header.innerHTML = `
                <span class="text-sm" style="font-weight:700;">本次钓行统计</span>
                <span class="text-xs text-muted">${stats.total}次 · 上鱼率${stats.rate}%</span>
            `;
            panel.appendChild(header);

            // 核心数据
            const grid = document.createElement('div');
            grid.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;';
            grid.innerHTML = `
                <div style="flex:1;text-align:center;"><div style="color:#60a5fa;font-size:1.1em;font-weight:800;">${stats.catches}</div><div class="text-xs text-muted">成功</div></div>
                <div style="flex:1;text-align:center;"><div style="color:#f87171;font-size:1.1em;font-weight:800;">${stats.failures}</div><div class="text-xs text-muted">脱钩</div></div>
                <div style="flex:1;text-align:center;"><div style="color:#fbbf24;font-size:1.1em;font-weight:800;">${stats.maxW.toFixed(1)}</div><div class="text-xs text-muted">最大kg</div></div>
                <div style="flex:1;text-align:center;"><div style="color:#4ade80;font-size:1.1em;font-weight:800;">${stats.avgInterval}</div><div class="text-xs text-muted">均口分</div></div>
                <div style="flex:1;text-align:center;"><div style="color:#a78bfa;font-size:1.1em;font-weight:800;" title="最近${stats.recent20Count}次上鱼鱼口平均值">${stats.recent20AvgInterval}</div><div class="text-xs text-muted">近20均口</div></div>
                <div style="flex:1;text-align:center;"><div style="color:${HENHUO_COLOR};font-size:1.1em;font-weight:800;">${stats.henhuoCount}</div><div class="text-xs text-muted">狠活</div></div>
                <div style="flex:1;text-align:center;"><div style="color:${BAIBEI_COLOR};font-size:1.1em;font-weight:800;">${stats.baibeiCount}</div><div class="text-xs text-muted">败北</div></div>
            `;
            panel.appendChild(grid);

            // 等级分布条
            const gradeBar = document.createElement('div');
            gradeBar.className = 'catch-rating-bar mt-sm';
            GRADE_ORDER.forEach(g => {
                const count = stats.grades[g] || 0;
                const pct = stats.catches > 0 ? (count / stats.catches * 100) : 0;
                if (count > 0) {
                    const seg = document.createElement('div');
                    seg.style.cssText = `width:${pct}%;background:${GRADE_COLORS[g]};`;
                    gradeBar.appendChild(seg);
                }
            });
            panel.appendChild(gradeBar);

            // 等级标签
            const gradeLabels = document.createElement('div');
            gradeLabels.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;font-size:0.68em;margin-top:4px;margin-bottom:8px;';
            const gradeLabelHtml = GRADE_ORDER.filter(g => stats.grades[g]).map(g =>
                `<span><span style="color:${GRADE_COLORS[g]};font-weight:600;">${g}</span> <span class="text-muted">${stats.grades[g]}</span></span>`
            );
            if (stats.henhuoCount > 0) {
                gradeLabelHtml.push(`<span><span style="color:${HENHUO_COLOR};font-weight:600;">狠活</span> <span class="text-muted">${stats.henhuoCount}</span></span>`);
            }
            if (stats.baibeiCount > 0) {
                gradeLabelHtml.push(`<span><span style="color:${BAIBEI_COLOR};font-weight:600;">败北</span> <span class="text-muted">${stats.baibeiCount}</span></span>`);
            }
            gradeLabels.innerHTML = gradeLabelHtml.join('');
            panel.appendChild(gradeLabels);

            // 鱼种分布条（全部鱼种，大到小）
            if (stats.allFish.length > 0) {
                const fishBar = document.createElement('div');
                fishBar.className = 'catch-rating-bar mt-sm';
                stats.allFish.forEach((f, i) => {
                    const pct = stats.catches > 0 ? (f.count / stats.catches * 100) : 0;
                    if (pct > 0) {
                        const seg = document.createElement('div');
                        const markColor = f.mark === '狠活' ? HENHUO_COLOR : (f.mark === '败北' ? BAIBEI_COLOR : FISH_COLORS[i % FISH_COLORS.length]);
                        seg.style.cssText = `width:${pct}%;background:${markColor};`;
                        seg.title = f.mark ? `${f.label} · ${f.mark}: ${f.count}条` : `${f.label}: ${f.count}条`;
                        fishBar.appendChild(seg);
                    }
                });
                panel.appendChild(fishBar);

                // 鱼种标签
                const fishLabels = document.createElement('div');
                fishLabels.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;font-size:0.68em;margin-top:4px;';
                fishLabels.innerHTML = stats.allFish.map((f, i) => {
                    const fishColor = FISH_COLORS[i % FISH_COLORS.length];
                    return `<span><span style="color:${fishColor};font-weight:600;">${f.label}</span>${renderFishMarkBadge(f.mark)} <span class="text-muted">${f.count}</span></span>`;
                }).join('');
                panel.appendChild(fishLabels);
            }

            return panel;
        }

        function insertPanel() {
            const cards = document.querySelectorAll('.message-card--catch, .message-card--reeling');
            if (cards.length === 0) {
                const old = document.getElementById(PANEL_ID);
                if (old) old.remove();
                return;
            }
            const stats = computeStats(cards);
            if (stats.catches === 0) return;
            const panel = createPanel(stats);
            const target = document.querySelector('.flex.items-center.justify-between.gap-sm.mt-sm');
            if (target) target.parentNode.insertBefore(panel, target.nextSibling);
        }

        let timer = null;
        function init() {
            insertPanel();
            timer = setInterval(insertPanel, 2000);
        }
        window.addEventListener('beforeunload', () => { if (timer) clearInterval(timer); });

        if (document.readyState === 'complete') init();
        else window.addEventListener('DOMContentLoaded', init);
    })();
}
// 功能：鱼体力UI增强
function initFishStaminaUI() {
    (function() {
        'use strict';

        const CONFIG = {
            COLORS: ['#FF0000', '#CC00FF', '#00FF00', '#0066FF', '#FFDD00'],
            POINTS_PER_LAYER: 20,
            FLASH_DURATION: 200
        };

        function findFishStaminaCard() {
            const cards = document.querySelectorAll('.fishing-metric-card');
            for (const card of cards) {
                const label = card.querySelector('.fishing-metric-label');
                if (label && label.textContent.includes('鱼体力')) return card;
            }
            return null;
        }

        function initFishStaminaCard(card) {
            const originalFill = card.querySelector('.progress-bar-fill');
            if (!originalFill) return;
            originalFill.style.display = 'none';

            const progressBar = card.querySelector('.fishing-metric-progress');
            if (!progressBar) return;
            progressBar.style.position = 'relative';

            const bottomBar = document.createElement('div');
            Object.assign(bottomBar.style, {
                position: 'absolute', top: '0', left: '0',
                width: '100%', height: '100%', borderRadius: 'inherit'
            });
            progressBar.appendChild(bottomBar);

            const topBar = document.createElement('div');
            Object.assign(topBar.style, {
                position: 'absolute', top: '0', left: '0',
                height: '100%', borderRadius: 'inherit',
                transition: 'width 0.1s ease'
            });
            progressBar.appendChild(topBar);

            let maxStamina = 0, previousStamina = 0;

            function getLayerColor(stamina) {
                return CONFIG.COLORS[Math.floor(stamina / CONFIG.POINTS_PER_LAYER) % CONFIG.COLORS.length];
            }

            function getNextLayerColor(stamina) {
                const idx = Math.floor(stamina / CONFIG.POINTS_PER_LAYER) - 1;
                return CONFIG.COLORS[idx < 0 ? CONFIG.COLORS.length - 1 : idx % CONFIG.COLORS.length];
            }

            function updateBars(stamina) {
                const inLayer = stamina % CONFIG.POINTS_PER_LAYER;
                bottomBar.style.background = getNextLayerColor(stamina);
                topBar.style.background = getLayerColor(stamina);
                topBar.style.width = (inLayer / CONFIG.POINTS_PER_LAYER * 100) + '%';
            }

            function flash(oldStamina, newStamina) {
                const oldW = (oldStamina % CONFIG.POINTS_PER_LAYER) / CONFIG.POINTS_PER_LAYER * 100;
                const newW = (newStamina % CONFIG.POINTS_PER_LAYER) / CONFIG.POINTS_PER_LAYER * 100;
                const oldL = Math.floor(oldStamina / CONFIG.POINTS_PER_LAYER);
                const newL = Math.floor(newStamina / CONFIG.POINTS_PER_LAYER);

                for (let i = newL; i <= oldL; i++) {
                    setTimeout(() => {
                        const f = document.createElement('div');
                        Object.assign(f.style, {
                            position: 'absolute', top: '0', right: '0',
                            height: '100%', background: 'white', opacity: '0',
                            zIndex: '10', pointerEvents: 'none', borderRadius: 'inherit'
                        });
                        if (i === oldL && i === newL) {
                            f.style.width = (oldW - newW) + '%';
                            f.style.right = (100 - oldW) + '%';
                        } else if (i === oldL) {
                            f.style.width = oldW + '%';
                            f.style.right = '0%';
                        } else if (i === newL) {
                            f.style.width = (100 - newW) + '%';
                            f.style.right = newW + '%';
                        } else {
                            f.style.width = '100%';
                            f.style.right = '0%';
                        }
                        progressBar.appendChild(f);
                        f.animate([
                            { opacity: 0 },
                            { opacity: 0.9, offset: 0.3 },
                            { opacity: 0.5, offset: 0.6 },
                            { opacity: 0 }
                        ], { duration: CONFIG.FLASH_DURATION, easing: 'ease-out' }).onfinish = () => f.remove();
                    }, (oldL - i) * 50);
                }
            }

            function parseAndUpdate() {
                const valueElem = card.querySelector('.fishing-metric-value');
                if (!valueElem) return;
                const match = valueElem.textContent.trim().match(/([\d.]+)\s*\/\s*([\d.]+)/);
                if (!match) return;
                const cur = parseFloat(match[1]), max = parseFloat(match[2]);
                if (Math.abs(max - maxStamina) > 0.01) {
                    maxStamina = max; previousStamina = cur; updateBars(cur); return;
                }
                if (cur < previousStamina) flash(previousStamina, cur);
                previousStamina = cur; updateBars(cur);
            }

            const valueElem = card.querySelector('.fishing-metric-value');
            if (valueElem) {
                new MutationObserver(parseAndUpdate).observe(valueElem, {
                    characterData: true, subtree: true, childList: true
                });
            }
            parseAndUpdate();
        }

        function processAll() {
            const card = findFishStaminaCard();
            if (card && !card.dataset.staminaUIEnhanced) {
                card.dataset.staminaUIEnhanced = 'true';
                initFishStaminaCard(card);
            }
        }

        processAll();
        new MutationObserver(processAll).observe(document.body, { childList: true, subtree: true });
    })();
}
// 功能：实时状态动态边框
function initDynamicBorder() {
    (function() {
        'use strict';

        // 注入样式
        if (!document.getElementById('dynamic-border-style')) {
            const style = document.createElement('style');
            style.id = 'dynamic-border-style';
            style.textContent = `
                .fishing-compact-card:has(.fishing-metric-grid) {
                    position: relative !important;
                    border-radius: 8px !important;
                }
                .fishing-compact-card:has(.fishing-metric-grid)::before {
                    content: '' !important;
                    position: absolute !important;
                    inset: -2px !important;
                    border-radius: inherit !important;
                    padding: 2px !important;
                    background: var(--db-gradient) !important;
                    background-size: 400% 100% !important;
                    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0) !important;
                    mask-composite: exclude !important;
                    -webkit-mask-composite: xor !important;
                    pointer-events: none !important;
                    opacity: var(--db-opacity, 0.7) !important;
                    filter: brightness(var(--db-brightness, 1.2)) saturate(var(--db-saturation, 1.5)) !important;
                    animation: dbGradientFlow 3s linear infinite !important;
                }
                .fishing-compact-card:has(.fishing-metric-grid)::after {
                    content: '' !important;
                    position: absolute !important;
                    inset: -4px !important;
                    border-radius: inherit !important;
                    background: var(--db-glow, rgba(0,212,255,0.3)) !important;
                    background-size: 400% 100% !important;
                    filter: blur(8px) !important;
                    z-index: -1 !important;
                    opacity: var(--db-glow-opacity, 0.4) !important;
                    animation: dbGradientFlow 3s linear infinite !important;
                    pointer-events: none !important;
                }
                @keyframes dbGradientFlow {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 400% 50%; }
                }
            `;
            document.head.appendChild(style);
        }

        function getPercent(label) {
            const cards = document.querySelectorAll('.fishing-metric-card');
            for (const card of cards) {
                if (card.querySelector('.fishing-metric-label')?.textContent?.includes(label)) {
                    const fill = card.querySelector('.progress-bar-fill');
                    if (fill) return parseFloat(fill.style.width) || 0;
                }
            }
            return 0;
        }

        function buildGradient(tension, stamina) {
            const t = tension > 80 ? '#ff1744, #ff6d00' :
                      tension > 50 ? '#ff9100, #ffd740' :
                      tension > 20 ? '#ffd740, #00e676' : '#00e676, #00e5ff';
            const s = stamina > 70 ? '#d500f9, #ff1744' :
                      stamina > 40 ? '#ff6d00, #ff9100' :
                      stamina > 15 ? '#ffd740, #00e676' : '#00e676, #00e5ff';
            return `linear-gradient(90deg, ${t}, ${s})`;
        }

        function buildGlow(tension) {
            return tension > 80 ? 'rgba(255,23,68,0.4)' :
                   tension > 50 ? 'rgba(255,145,0,0.35)' :
                   tension > 20 ? 'rgba(255,215,64,0.3)' : 'rgba(0,229,255,0.3)';
        }

        function update() {
            const card = document.querySelector('.fishing-compact-card:has(.fishing-metric-grid)');
            if (!card) return;
            const tension = getPercent('张力');
            const stamina = getPercent('鱼体力');
            const style = card.style;
            style.setProperty('--db-gradient', buildGradient(tension, stamina));
            style.setProperty('--db-glow', buildGlow(tension));
            style.setProperty('--db-opacity', Math.min(0.5 + tension / 100, 0.9));
            style.setProperty('--db-brightness', Math.min(1 + tension / 200, 1.5));
            style.setProperty('--db-saturation', Math.min(1.2 + tension / 150, 1.8));
            style.setProperty('--db-glow-opacity', Math.min(0.15 + tension / 120, 0.6));
        }

        setInterval(update, 500);
        new MutationObserver(update).observe(document.body, { childList: true, subtree: true, attributes: true });
        update();
    })();
}
    // ============================================================
    // 根据开关状态启动功能
    // ============================================================
    const INIT_MAP = {
        lureSoftness: initLureSoftness,
        fishSort: initFishSort,
        boatSort: initBoatSort,
        waterLayer: initWaterLayer,
        fishLogColor: initFishLogColor,
        catchInterval: initCatchInterval,
        reelEnhance: initReelEnhance,
        shopCardEnhance: initShopCardEnhance,
        assemblySim: initAssemblySim,
        announceLogger: initAnnounceLogger,
        fishCardGradeColor: initFishCardGradeColor,
        fishCardGlow: initFishCardGlow,
        challengeFishInfo: initChallengeFishInfo,
        realtimeChart: initRealtimeChart,
        fishWeightGlow: initFishWeightGlow,
        weeklyTarget: initWeeklyTarget,
        catchSummary: initCatchSummary,
        fishStaminaUI: initFishStaminaUI,
        dynamicBorder: initDynamicBorder,
    };

    /** 非关键功能延后到浏览器空闲时初始化，缩短首屏阻塞 */
    const DEFERRED_FEATURES = new Set([
        'fishWeightGlow', 'fishCardGlow', 'fishCardGradeColor',
        'catchSummary', 'weeklyTarget', 'challengeFishInfo',
        'dynamicBorder', 'fishStaminaUI', 'announceLogger',
        'realtimeChart', 'assemblySim', 'shopCardEnhance', 'reelEnhance',
    ]);
    function lfRunIdle(fn, delayMs = 0) {
        const run = () => setTimeout(fn, delayMs);
        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(run, { timeout: 2500 });
        } else {
            run();
        }
    }

    let _deferredInitIndex = 0;
    FEATURES.forEach(f => {
        if (isEnabled(f.id)) {
            const initFn = INIT_MAP[f.id];
            if (!initFn) return;
            if (DEFERRED_FEATURES.has(f.id)) {
                lfRunIdle(initFn, _deferredInitIndex * 35);
                _deferredInitIndex++;
            } else {
                initFn();
            }
        }
    });

})();
    }
} catch (error) {
    console.error('[LazyFisher ???] lazyfisher辅助增强(公开版) ????', error);
}


// ============================================================================
// Module: LazyFisher环境显示
// Source: Base/LazyFisher 环境显示-4.2.2.user.js
// Default: enabled
// ============================================================================
try {
    if (window.LazyFisherMerged?.isEnabled('environmentDisplay')) {
(function(){
'use strict';
var T='ws/game';
var E={},P=[],U=null,LU=null;

function S(k,v){try{localStorage.setItem('lz_'+k,JSON.stringify(v))}catch(e){}}
function L(k,f){try{var r=localStorage.getItem('lz_'+k);return r===null?JSON.parse(f):JSON.parse(r)}catch(e){return JSON.parse(f)}}

function ts(){var d=new Date();return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0')}

function chk(){return document.querySelector('.fishing-compact-card')&&document.querySelector('.lucide-anchor')&&document.querySelector('.fishing-overview-grid')}

function uAI(d){
var as=document.querySelectorAll('.lucide-anchor');
for(var i=0;i<as.length;i++){
var r=as[i].closest('.flex.items-center.justify-between');
if(!r)r=as[i].closest('.flex');if(!r)continue;
var o=r.querySelector('.lz-ai');if(o)o.remove();
var se=r.querySelector('.text-sm.text-muted');
var n=document.createElement('span');n.className='lz-ai';
n.style.cssText='display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#94a3b8;margin-right:4px';
var ip=d.li||'--',sf=d.sb?'已软封':'正常',sc=d.sb?'#f87171':'#94a3b8',t=LU||ts();
n.innerHTML='<span>关联:'+(d.ap||0)+'</span><span style="color:'+sc+'">'+sf+'</span><span>IP:'+ip+'</span><span style="color:#64748b">'+t+'</span>';
if(se)se.parentNode.insertBefore(n,se);else r.appendChild(n);break}}

function gEI(){var is=document.querySelectorAll('.fishing-overview-item');for(var i=0;i<is.length;i++){if(is[i].querySelector('.weather-icon-row'))return is[i]}return null}
function cEC(){var ei=gEI();if(!ei)return false;if(document.getElementById('lz-ec'))return true;
var c=document.createElement('div');c.id='lz-ec';c.className='fishing-overview-item';
c.innerHTML='<span class="text-xs text-muted">水流/湿度</span><strong id="lz-ev" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:0.875rem"></strong>';
ei.parentNode.insertBefore(c,ei.nextSibling);return true}

function uEC(d){cEC();var v=document.getElementById('lz-ev');if(!v)return;var h='';
if(d.wf!==undefined){h+='<span title="水流" style="color:#38bdf8;display:inline-flex;align-items:center;gap:2px;font-weight:600"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h2M6 8h2M10 16h2M14 4h2M18 20h2M22 12h2"/></svg>'+Number(d.wf).toFixed(1)+'</span>'}
if(d.wt!==undefined){h+='<span title="湿度" style="color:#818cf8;display:inline-flex;align-items:center;gap:2px;font-weight:600"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>'+Number(d.wt).toFixed(1)+'</span>'}
if(d.rs!==undefined){var rh=Number(d.rs);if(rh>0){h+='<span title="连雨时长" style="color:#818cf8;display:inline-flex;align-items:center;gap:2px;font-weight:600"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9M16 14v6M8 14v6M12 16v6"/></svg>连'+rh.toFixed(1)+'h</span>'}else{h+='<span title="连雨时长" style="color:#94a3b8;display:inline-flex;align-items:center;gap:2px;font-weight:600"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>无雨</span>'}}
v.innerHTML=h}

function gOG(){return document.querySelector('.fishing-overview-grid')}
function cPC(){var g=gOG();if(!g)return false;if(document.getElementById('lz-pw'))return true;
var w=document.createElement('div');w.id='lz-pw';w.style.cssText='margin-top:6px';
w.innerHTML='<div class="text-xs text-muted" style="margin-bottom:3px">附近玩家</div><div id="lz-pc" class="fishing-overview-grid"></div>';
g.parentNode.insertBefore(w,g.nextSibling);return true}

function uPC(pl){cPC();var c=document.getElementById('lz-pc');if(!c)return;
if(!pl||!pl.length){c.innerHTML='<div class="fishing-overview-item"><span class="text-xs text-muted" style="color:#64748b">暂无其他玩家</span></div>';return}
var sm={REELING:'上鱼中',FIGHTING:'搏斗中',FISHING:'守钓中',IDLE:'空闲'};var h='';
pl.forEach(function(p){var st=p.st||'IDLE',sl=sm[st]||st;var g=p.gs||'';var nm=g?'['+g+'] '+p.nm:p.nm;var cl=(st==='REELING'||st==='FIGHTING')?'#f87171':(st==='FISHING'?'#38bdf8':'#94a3b8');
h+='<div class="fishing-overview-item" style="padding:3px 0"><strong style="display:flex;align-items:center;gap:4px;font-size:0.8rem"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">'+nm+'</span><span style="color:'+cl+';font-weight:600;white-space:nowrap">'+sl+'</span></strong></div>'});
c.innerHTML=h}

var RT=null;
function rA(){if(!chk())return;var e=L('env','{}');var p=L('players','[]');if(!Array.isArray(p))p=[];LU=L('lt','""')||null;uEC(e);if(e._a)uAI(e._a);uPC(p)}

function wD(){new MutationObserver(function(){if(chk()&&!document.getElementById('lz-ec'))rA()}).observe(document.body,{childList:true,subtree:true})}
function tI(){if(chk()){rA();if(!RT)RT=setInterval(rA,10000);return}setTimeout(tI,500)}

function oR(d){
if(d.water_flow!==undefined)E.wf=d.water_flow;if(d.wind!==undefined)E.wd=d.wind;
if(d.cloud!==undefined)E.cd=d.cloud;if(d.rain!==undefined)E.rn=d.rain;
if(d._rain_streak_wetness!==undefined)E.wt=d._rain_streak_wetness;if(d._rain_streak_hours!==undefined)E.rs=d._rain_streak_hours;
if(d.region_time!==undefined)E.rt=d.region_time;if(d.region_id!==undefined)E.ri=d.region_id;
LU=ts();S('lt',LU);S('env',E)}

function oT(d){var e=d.environment;if(!e)return;
if(e.water_flow!==undefined)E.wf=e.water_flow;if(e.wind!==undefined)E.wd=e.wind;
if(e.cloud!==undefined)E.cd=e.cloud;if(e.rain!==undefined)E.rn=e.rain;
if(e.region_time!==undefined)E.rt=e.region_time;LU=ts();S('lt',LU);S('env',E)}

function oP(d,pd){
if(pd){E._a={ap:pd.association_points,sb:pd.soft_banned,li:pd.last_known_ip};S('env',E)}
if(!U&&pd&&pd.id)U=pd.id;if(d.region_name!==undefined){E.rn=d.region_name;S('env',E)}
var l=[];(d.players||[]).forEach(function(p){if(p.id!==U)l.push({nm:p.username||'?',st:p.state||p.status||'IDLE',gs:p.guild_short_name})});
P=l;S('players',P);LU=ts();S('lt',LU)}

function ps(raw){if(typeof raw!=='string')return;try{var m=JSON.parse(raw);
if(m.type==='region_update'&&m.data)oR(m.data);
else if(m.type==='fishing_tick'&&m.data&&m.data.environment)oT(m.data);
else if(m.type==='action_result'&&m.action==='get_pond_view'&&m.data)oP(m.data,m.player)}catch(e){}}

function hk(){if(typeof WebSocket==='undefined'){setTimeout(hk,100);return}
var O=WebSocket;WebSocket=function(u,p){var w=new O(u,p);if(u&&u.indexOf(T)!==-1)w.addEventListener('message',function(e){ps(e.data)});return w};
WebSocket.prototype=O.prototype;WebSocket.CONNECTING=O.CONNECTING;WebSocket.OPEN=O.OPEN;WebSocket.CLOSING=O.CLOSING;WebSocket.CLOSED=O.CLOSED}

function mn(){hk();tI();wD()}mn();
})();
    }
} catch (error) {
    console.error('[LazyFisher 合并版] LazyFisher环境显示 启动失败', error);
}


