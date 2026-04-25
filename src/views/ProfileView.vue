<template>
  <main class="page">
    <div class="page-inner">
      <div class="page-header">
        <h1>You</h1>
        <button class="header-circle-btn" @click="toggleTheme" :title="isDarkMode ? 'Switch to light' : 'Switch to dark'">
          <span v-if="isDarkMode">☀</span>
          <span v-else>🌙</span>
        </button>
      </div>

      <// ── Achievements ─────────────────────────────────────────────────────────── Hero card with avatar ───────────────────────────────────────── -->
      <div class="profile-hero card">
        <div class="profile-hero-glow" />
        <div class="profile-hero-inner">
          <div class="profile-avatar">
            {{ authStore.email ? authStore.email.charAt(0).toUpperCase() : 'G' }}
          </div>
          <div class="profile-hero-info">
            <div class="profile-hero-name">{{ authStore.email?.split('@')[0] || 'Guest' }}</div>
            <div class="profile-hero-email mono text-xs text-muted">{{ authStore.email || 'Not signed in' }}</div>
            <div class="profile-hero-badge">
              ⚡ L{{ gStore.level }} · {{ gStore.xp.toLocaleString() }} XP
            </div>
          </div>
        </div>
      </div>

      <!-- ── Nutrition targets ───────────────────────────────────────────── -->
      <div class="section-header">
        <h2 class="section-title" style="margin-bottom:0">Nutrition Targets</h2>
        <button class="btn btn-ghost btn-sm" @click="openNutrition">
          {{ store.nutritionProfile ? 'Edit' : 'Set up' }}
        </button>
      </div>

      <!-- Configured state -->
      <div v-if="store.nutritionProfile && store.latestWeight" class="nutrition-card card">
        <div class="nutrition-goal-row">
          <span class="nutrition-goal-badge" :class="`ngoal-${store.nutritionProfile.goal}`">
            {{ NUTRITION_GOAL_LABELS[store.nutritionProfile.goal] }}
          </span>
          <span class="text-xs text-muted">{{ ACTIVITY_LABELS[store.nutritionProfile.activityLevel] }}</span>
        </div>

        <div class="calories-row">
          <span class="calories-number">{{ targets.calories.toLocaleString() }}</span>
          <span class="calories-unit text-muted">kcal / day</span>
        </div>

        <div class="macros-grid">
          <div class="macro-cell">
            <span class="macro-value">{{ targets.proteinG }}g</span>
            <span class="macro-label">Protein</span>
            <div class="macro-bar"><div class="macro-fill protein-fill" :style="{ width: macroBarPct(targets.proteinG * 4, targets.calories) + '%' }" /></div>
          </div>
          <div class="macro-cell">
            <span class="macro-value">{{ targets.carbG }}g</span>
            <span class="macro-label">Carbs</span>
            <div class="macro-bar"><div class="macro-fill carb-fill" :style="{ width: macroBarPct(targets.carbG * 4, targets.calories) + '%' }" /></div>
          </div>
          <div class="macro-cell">
            <span class="macro-value">{{ targets.fatG }}g</span>
            <span class="macro-label">Fat</span>
            <div class="macro-bar"><div class="macro-fill fat-fill" :style="{ width: macroBarPct(targets.fatG * 9, targets.calories) + '%' }" /></div>
          </div>
        </div>

        <p class="nutrition-basis text-xs text-muted">
          Based on {{ store.latestWeight.kg }}kg · {{ store.nutritionProfile.heightCm }}cm · {{ store.nutritionProfile.ageYears }}yo
        </p>
      </div>

      <!-- Needs weight logged -->
      <div v-else-if="store.nutritionProfile && !store.latestWeight" class="nutrition-card card nutrition-empty">
        <p class="text-sm text-muted">Log your body weight on the home screen to see your targets.</p>
      </div>

      <!-- Not set up -->
      <div v-else class="nutrition-card card nutrition-empty">
        <p class="text-sm text-muted">Set up your daily calorie and macro targets based on your goal.</p>
        <button class="btn btn-outline btn-sm" style="margin-top: 12px" @click="openNutrition">Set Up Nutrition</button>
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

  <!-- Nutrition setup sheet -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showNutrition" class="overlay" @click="showNutrition = false" />
    </Transition>
    <Transition name="slide-up">
      <div v-if="showNutrition" class="sheet">
        <div class="sheet-handle" />
        <div class="sheet-header">
          <div class="flex items-center justify-between mb-12">
            <h2>Nutrition Setup</h2>
            <button class="btn btn-ghost btn-icon" @click="showNutrition = false">✕</button>
          </div>
        </div>
        <div class="sheet-body nutrition-form">

          <div class="nfield">
            <label class="label">Sex</label>
            <div class="npill-row">
              <button class="npill" :class="{ active: nForm.sex === 'male' }"   @click="nForm.sex = 'male'">♂ Male</button>
              <button class="npill" :class="{ active: nForm.sex === 'female' }" @click="nForm.sex = 'female'">♀ Female</button>
            </div>
          </div>

          <div class="nfield-row">
            <div class="nfield">
              <label class="label">Age</label>
              <input v-model.number="nForm.ageYears" type="number" inputmode="numeric" class="input" placeholder="25" min="10" max="100" />
            </div>
            <div class="nfield">
              <label class="label">Height (cm)</label>
              <input v-model.number="nForm.heightCm" type="number" inputmode="numeric" class="input" placeholder="175" min="100" max="250" />
            </div>
          </div>

          <div class="nfield">
            <label class="label">Activity level</label>
            <div class="npill-col">
              <button v-for="a in ACTIVITY_OPTIONS" :key="a.value" class="npill npill-wide" :class="{ active: nForm.activityLevel === a.value }" @click="nForm.activityLevel = a.value">
                <span class="npill-title">{{ a.label }}</span>
                <span class="npill-desc">{{ a.desc }}</span>
              </button>
            </div>
          </div>

          <div class="nfield">
            <label class="label">Goal</label>
            <div class="npill-row">
              <button v-for="g in NUTRITION_GOALS" :key="g.value" class="npill" :class="{ active: nForm.goal === g.value, [`ngoal-${g.value}`]: nForm.goal === g.value }" @click="nForm.goal = g.value">
                {{ g.icon }} {{ g.label }}
              </button>
            </div>
            <p class="ngoal-hint text-xs text-muted">{{ NUTRITION_GOAL_HINTS[nForm.goal] }}</p>
          </div>

          <button class="btn btn-primary btn-full" :disabled="!nFormValid" @click="saveNutrition">Save Targets</button>
        </div>
      </div>
    </Transition>
  </Teleport>

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
import { computed, reactive, ref } from 'vue'
import { useGamificationStore } from '../stores/gamification'
import { useWorkoutsStore } from '../stores/workouts'
import { useAuthStore } from '../stores/auth'
import { ACHIEVEMENTS, WEEKLY_MISSIONS } from '../utils/gamificationDefs'
import type { AchievementDef, MissionDef } from '../types/gamification'
import type { NutritionProfile } from '../types'

const gStore = useGamificationStore()
const store  = useWorkoutsStore()
const authStore = useAuthStore()

// ── Theme toggle ───────────────────────────────────────────────────────────────
const isDarkMode = ref(document.documentElement.getAttribute('data-theme') !== 'light')

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.removeAttribute('data-theme')
    localStorage.removeItem('ff_theme')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('ff_theme', 'light')
  }
}

// ── Nutrition ──────────────────────────────────────────────────────────────────
const showNutrition = ref(false)

const nForm = reactive<NutritionProfile>({
  sex:           'male',
  ageYears:      25,
  heightCm:      175,
  activityLevel: 'moderate',
  goal:          'maintain',
})

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',   label: 'Sedentary',        desc: 'Desk job, little or no exercise' },
  { value: 'light',       label: 'Lightly active',   desc: '1–3 days of exercise per week' },
  { value: 'moderate',    label: 'Moderately active', desc: '3–5 days of exercise per week' },
  { value: 'active',      label: 'Very active',       desc: '6–7 days of hard exercise' },
  { value: 'very-active', label: 'Extremely active',  desc: 'Physical job + daily training' },
] as const

const ACTIVITY_LABELS: Record<string, string> = {
  'sedentary':   'Sedentary',
  'light':       'Lightly active',
  'moderate':    'Moderately active',
  'active':      'Very active',
  'very-active': 'Extremely active',
}

const NUTRITION_GOALS = [
  { value: 'cut',      label: 'Lose Fat',    icon: '🔥' },
  { value: 'maintain', label: 'Maintain',    icon: '⚖️' },
  { value: 'bulk',     label: 'Build Muscle', icon: '💪' },
] as const

const NUTRITION_GOAL_LABELS: Record<string, string> = {
  cut:      '🔥 Fat Loss',
  maintain: '⚖️ Maintain',
  bulk:     '💪 Build Muscle',
}

const NUTRITION_GOAL_HINTS: Record<string, string> = {
  cut:      '−500 kcal/day deficit — roughly 0.5 kg loss per week',
  maintain: 'Match your total daily energy expenditure (TDEE)',
  bulk:     '+250 kcal/day surplus for lean muscle gain',
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  'sedentary':   1.2,
  'light':       1.375,
  'moderate':    1.55,
  'active':      1.725,
  'very-active': 1.9,
}

function calcTargets(profile: NutritionProfile, weightKg: number) {
  const bmr = profile.sex === 'male'
    ? 10 * weightKg + 6.25 * profile.heightCm - 5 * profile.ageYears + 5
    : 10 * weightKg + 6.25 * profile.heightCm - 5 * profile.ageYears - 161
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel])
  const calories = profile.goal === 'cut' ? tdee - 500 : profile.goal === 'bulk' ? tdee + 250 : tdee
  const proteinG = Math.round(profile.goal === 'cut' ? weightKg * 2.2 : profile.goal === 'bulk' ? weightKg * 2.0 : weightKg * 1.8)
  const fatG     = Math.round((calories * (profile.goal === 'cut' ? 0.25 : 0.28)) / 9)
  const carbG    = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4))
  return { calories, proteinG, carbG, fatG }
}

const targets = computed(() => {
  if (!store.nutritionProfile || !store.latestWeight) return { calories: 0, proteinG: 0, carbG: 0, fatG: 0 }
  return calcTargets(store.nutritionProfile, store.latestWeight.kg)
})

function macroBarPct(cals: number, total: number) {
  return total > 0 ? Math.round((cals / total) * 100) : 0
}

const nFormValid = computed(() =>
  nForm.ageYears > 0 && nForm.heightCm > 0
)

function openNutrition() {
  if (store.nutritionProfile) {
    Object.assign(nForm, store.nutritionProfile)
  }
  showNutrition.value = true
}

function saveNutrition() {
  store.saveNutrition({ ...nForm })
  showNutrition.value = false
}

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
/* ── Nutrition card ──────────────────────────────────────────────────────── */
.nutrition-card {
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nutrition-empty {
  align-items: center;
  text-align: center;
  padding: 20px;
}

.nutrition-goal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nutrition-goal-badge {
  font-size: 0.8125rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 100px;
}
.ngoal-cut      { background: rgba(248,113,113,0.15); color: var(--danger); }
.ngoal-maintain { background: var(--primary-dim);  color: var(--primary); }
.ngoal-bulk     { background: rgba(167,139,250,0.12); color: var(--accent); }

.calories-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.calories-number {
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text);
  line-height: 1;
}

.calories-unit {
  font-size: 0.9375rem;
  font-weight: 500;
}

.macros-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.macro-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(8, 12, 26, 0.5);
  border-radius: var(--radius);
  padding: 10px 12px;
}

.macro-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.macro-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.macro-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 2px;
}

.macro-fill { height: 100%; border-radius: 2px; }
.protein-fill { background: var(--danger); }
.carb-fill    { background: var(--primary); }
.fat-fill     { background: var(--flame); }

.nutrition-basis { margin-top: -4px; }

/* ── Nutrition form (sheet) ──────────────────────────────────────────────── */
.nutrition-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nfield { display: flex; flex-direction: column; gap: 6px; }

.nfield-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.npill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.npill-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.npill {
  padding: 8px 16px;
  border-radius: 100px;
  border: 1.5px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.npill.active {
  background: var(--primary-dim);
  border-color: var(--primary);
  color: var(--primary);
}
.npill.ngoal-cut.active      { background: rgba(248,113,113,0.12); border-color: var(--danger);  color: var(--danger); }
.npill.ngoal-maintain.active { background: var(--primary-dim);     border-color: var(--primary); color: var(--primary); }
.npill.ngoal-bulk.active     { background: var(--accent-dim);      border-color: var(--accent);  color: var(--accent); }

.npill-wide {
  border-radius: var(--radius);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.npill-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: inherit;
}

.npill-desc {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-muted);
  line-height: 1.3;
}

.npill-wide.active .npill-desc { color: var(--primary); opacity: 0.8; }

.ngoal-hint {
  padding: 6px 2px 0;
  line-height: 1.4;
}

/* ── Profile hero ────────────────────────────────────────────────────────── */
.header-circle-btn {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  color: var(--text);
}
.header-circle-btn:active { transform: scale(0.92); }

.profile-hero {
  position: relative;
  overflow: hidden;
  padding: 18px;
  border-radius: 22px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--surface), var(--surface-2));
}
.profile-hero-glow {
  position: absolute;
  top: -30px;
  right: -30px;
  width: 160px;
  height: 160px;
  border-radius: 80px;
  background: rgba(212, 255, 58, 0.1);
  filter: blur(30px);
  pointer-events: none;
}
.profile-hero-inner {
  position: relative;
  display: flex;
  gap: 14px;
  align-items: center;
}
.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: linear-gradient(135deg, var(--accent), var(--flame));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-ink);
  font-weight: 800;
  font-family: var(--font-display);
  font-size: 1.75rem;
  flex-shrink: 0;
}
.profile-hero-info { flex: 1; }
.profile-hero-name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.profile-hero-email { margin-top: 2px; }
.profile-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 3px 8px;
  background: rgba(212, 255, 58, 0.15);
  border-radius: 999px;
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.08em;
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
  border-color: rgba(212, 255, 58, 0.25);
  background: rgba(212, 255, 58, 0.05);
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

.mission-xp   { color: var(--accent); }
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
  background: linear-gradient(90deg, var(--accent), var(--primary));
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
.rarity-common.ach-cell:not(.ach-locked)    { border-color: rgba(212, 255, 58, 0.18); }
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
  color: var(--accent);
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
  color: var(--accent);
}
</style>
