<template>
  <main class="page">
    <div class="page-inner">
      <div class="page-header">
        <h1>Profile</h1>
      </div>

      <!-- ── Level card ──────────────────────────────────────────────────── -->
      <div class="level-card card">
        <!-- SVG ring -->
        <div class="ring-wrap">
          <svg viewBox="0 0 100 100" class="ring-svg">
            <!-- Track -->
            <circle cx="50" cy="50" r="42" class="ring-track" />
            <!-- Fill -->
            <circle
              cx="50" cy="50" r="42"
              class="ring-fill"
              :style="{ strokeDashoffset: trackOffset }"
            />
          </svg>
          <div class="ring-center">
            <span class="ring-level">{{ gStore.level }}</span>
            <span class="ring-label">LVL</span>
          </div>
        </div>

        <div class="level-info">
          <div class="level-title">Level {{ gStore.level }}</div>
          <div class="xp-row">
            <span class="xp-value">{{ gStore.xp.toLocaleString() }} XP</span>
          </div>
          <div class="xp-bar">
            <div class="xp-fill" :style="{ width: (gStore.progress * 100).toFixed(1) + '%' }" />
          </div>
          <div class="xp-caption text-xs text-muted">
            {{ gStore.xpThisLevel.toLocaleString() }} / {{ gStore.xpNextLevel.toLocaleString() }} XP
            · {{ gStore.xpToNext.toLocaleString() }} to Level {{ gStore.level + 1 }}
          </div>
        </div>
      </div>

      <!-- ── Weekly missions ─────────────────────────────────────────────── -->
      <h2 class="section-title">Weekly Missions</h2>
      <div class="missions-list">
        <div
          v-for="mission in WEEKLY_MISSIONS"
          :key="mission.id"
          class="mission-card card"
          :class="{ 'mission-done': gStore.isMissionCompleted(mission.id) }"
        >
          <div class="mission-header">
            <span class="mission-icon">{{ mission.icon }}</span>
            <div class="mission-info">
              <span class="mission-title">{{ mission.title }}</span>
              <span class="mission-desc text-xs text-muted">{{ mission.description }}</span>
            </div>
            <div class="mission-reward">
              <span v-if="gStore.isMissionCompleted(mission.id)" class="mission-check">✓</span>
              <span v-else class="mission-xp">+{{ mission.xp }} XP</span>
            </div>
          </div>
          <div class="mission-progress">
            <div class="mission-bar">
              <div
                class="mission-fill"
                :style="{ width: missionPct(mission) + '%' }"
              />
            </div>
            <span class="mission-count text-xs text-muted">
              {{ missionProgressLabel(mission) }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── Achievements ────────────────────────────────────────────────── -->
      <div class="section-header">
        <h2 class="section-title" style="margin-bottom:0">Achievements</h2>
        <span class="badge badge-green">{{ earnedCount }} / {{ ACHIEVEMENTS.length }}</span>
      </div>

      <div class="achievements-grid">
        <div
          v-for="ach in ACHIEVEMENTS"
          :key="ach.id"
          class="ach-cell"
          :class="[`rarity-${ach.rarity}`, { 'ach-locked': !isEarned(ach.id) }]"
          @click="selectAchievement(ach)"
        >
          <span class="ach-icon">{{ ach.icon }}</span>
          <span class="ach-name">{{ ach.title }}</span>
        </div>
      </div>
    </div>
  </main>

  <!-- Achievement detail sheet -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="selectedAch" class="overlay" @click="selectedAch = null" />
    </Transition>
    <Transition name="slide-up">
      <div v-if="selectedAch" class="sheet ach-sheet">
        <div class="sheet-handle" />
        <div class="sheet-body" style="padding-top: 20px">
          <div class="ach-detail-icon">{{ selectedAch.icon }}</div>
          <div class="ach-detail-title">{{ selectedAch.title }}</div>
          <div class="ach-detail-desc text-muted">{{ selectedAch.description }}</div>

          <div class="ach-detail-meta">
            <span class="badge" :class="rarityBadge(selectedAch.rarity)">
              {{ selectedAch.rarity }}
            </span>
            <span class="ach-detail-xp">+{{ selectedAch.xp }} XP</span>
          </div>

          <div v-if="isEarned(selectedAch.id)" class="ach-earned-msg">
            <span>✓ Unlocked</span>
          </div>
          <div v-else class="ach-locked-msg text-muted text-sm">
            🔒 Not yet unlocked
          </div>

          <button class="btn btn-outline btn-full" style="margin-top: 20px" @click="selectedAch = null">
            Close
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGamificationStore } from '../stores/gamification'
import { ACHIEVEMENTS, WEEKLY_MISSIONS } from '../utils/gamificationDefs'
import type { AchievementDef, MissionDef } from '../types/gamification'

const gStore = useGamificationStore()

// ── Level ring ────────────────────────────────────────────────────────────────
const CIRCUMFERENCE = 2 * Math.PI * 42  // r=42
const trackOffset = computed(() => CIRCUMFERENCE * (1 - gStore.progress))

// ── Achievements ──────────────────────────────────────────────────────────────
const earnedCount   = computed(() => gStore.achievements.length)
const selectedAch   = ref<AchievementDef | null>(null)

function isEarned(id: string) { return gStore.achievements.includes(id) }

function selectAchievement(ach: AchievementDef) { selectedAch.value = ach }

function rarityBadge(rarity: string) {
  return {
    common: 'badge-green',
    rare: 'badge-purple',
    epic: 'badge-warm',
    legendary: 'rarity-legendary-badge',
  }[rarity] ?? 'badge-green'
}

// ── Missions ──────────────────────────────────────────────────────────────────
function missionPct(m: MissionDef): number {
  if (gStore.isMissionCompleted(m.id)) return 100
  return Math.min(100, Math.round((gStore.getMissionProgress(m.id) / m.target) * 100))
}

function missionProgressLabel(m: MissionDef): string {
  if (gStore.isMissionCompleted(m.id)) return 'Complete!'
  const prog = gStore.getMissionProgress(m.id)
  if (m.target >= 10_000) {
    return `${prog.toLocaleString()} / ${m.target.toLocaleString()}`
  }
  return `${prog} / ${m.target}`
}
</script>

<style scoped>
/* ── Level card ──────────────────────────────────────────────────────────── */
.level-card {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
  padding: 20px;
}

.ring-wrap {
  position: relative;
  width: 88px;
  height: 88px;
  flex-shrink: 0;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: var(--border);
  stroke-width: 8;
}

.ring-fill {
  fill: none;
  stroke: url(#levelGradient);
  stroke: var(--primary);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: v-bind(CIRCUMFERENCE);
  transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.55));
}

.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-level {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
}

.ring-label {
  font-size: 0.5625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.level-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.level-title {
  font-size: 1.125rem;
  font-weight: 700;
}

.xp-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.xp-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
}

.xp-bar {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-dark), var(--primary));
  border-radius: 3px;
  transition: width 0.5s ease;
}

.xp-caption {
  margin-top: 2px;
  line-height: 1.3;
}

/* ── Section header ──────────────────────────────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  margin-bottom: 12px;
}

/* ── Missions ────────────────────────────────────────────────────────────── */
.missions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
}

.mission-card {
  padding: 14px 16px;
  transition: border-color 0.2s;
}

.mission-card.mission-done {
  border-color: rgba(56, 189, 248, 0.35);
  background: rgba(56, 189, 248, 0.05);
}

.mission-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.mission-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  line-height: 1.2;
}

.mission-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mission-title {
  font-size: 0.9375rem;
  font-weight: 700;
}

.mission-desc {
  line-height: 1.3;
}

.mission-reward {
  flex-shrink: 0;
  font-size: 0.8125rem;
  font-weight: 700;
}

.mission-xp   { color: #fbbf24; }
.mission-check { color: var(--primary); font-size: 1rem; }

.mission-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mission-bar {
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.mission-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-dark), var(--primary));
  border-radius: 3px;
  transition: width 0.4s ease;
}

.mission-done .mission-fill { background: var(--primary); }

.mission-count {
  flex-shrink: 0;
  min-width: 60px;
  text-align: right;
}

/* ── Achievements grid ───────────────────────────────────────────────────── */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}

.ach-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px 10px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: rgba(15, 22, 36, 0.62);
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  text-align: center;
}

.ach-cell:active { background: var(--card-hover); }

.ach-icon {
  font-size: 1.5rem;
  line-height: 1;
  transition: filter 0.2s;
}

.ach-name {
  font-size: 0.5625rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.01em;
  line-height: 1.2;
}

/* Rarity borders (unlocked) */
.rarity-common.ach-cell:not(.ach-locked)    { border-color: rgba(56, 189, 248, 0.25); }
.rarity-rare.ach-cell:not(.ach-locked)      { border-color: rgba(167, 139, 250, 0.4); }
.rarity-epic.ach-cell:not(.ach-locked)      { border-color: rgba(251, 146, 60, 0.4); }
.rarity-legendary.ach-cell:not(.ach-locked) { border-color: rgba(251, 191, 36, 0.5); box-shadow: 0 0 12px rgba(251, 191, 36, 0.2); }

/* Locked state */
.ach-locked .ach-icon  { filter: grayscale(1) opacity(0.35); }
.ach-locked .ach-name  { color: var(--text-dim); }
.ach-locked            { background: rgba(8, 12, 26, 0.4); border-color: var(--border); }

/* ── Achievement detail sheet ────────────────────────────────────────────── */
.ach-sheet { z-index: 101; }

.ach-detail-icon {
  font-size: 3.5rem;
  text-align: center;
  margin-bottom: 12px;
}

.ach-detail-title {
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 6px;
}

.ach-detail-desc {
  text-align: center;
  font-size: 0.9375rem;
  margin-bottom: 16px;
  line-height: 1.5;
}

.ach-detail-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.ach-detail-xp {
  font-size: 0.875rem;
  font-weight: 700;
  color: #fbbf24;
}

.ach-earned-msg {
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
  padding: 8px;
  background: var(--primary-dim);
  border-radius: var(--radius-sm);
}

.ach-locked-msg {
  text-align: center;
  padding: 8px;
}

.rarity-legendary-badge {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}
</style>
