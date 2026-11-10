import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { admin: Boolean }

  connect() {
    if (this.adminValue) return

    this.initWatchdog()

    this.boundTouch = this.touchActivity.bind(this)
    window.addEventListener("pointerdown", this.boundTouch, { passive: true })
    window.addEventListener("keydown", this.boundTouch, { passive: true })
  }

  disconnect() {
    if (this.watchdogInterval) clearInterval(this.watchdogInterval)
    if (this.boundTouch) {
      window.removeEventListener("pointerdown", this.boundTouch)
      window.removeEventListener("keydown", this.boundTouch)
    }
  }

  // --- 15-Minute Inactivity Watchdog ---

  initWatchdog() {
    this.checkInactivity()
    this.watchdogInterval = setInterval(() => {
      this.checkInactivity()
    }, 30000) // check every 30s
  }

  touchActivity() {
    const state = this.getState()
    state.lastActive = Date.now()
    this.saveState(state)
  }

  checkInactivity() {
    const state = this.getState()
    const now = Date.now()
    const maxInactive = 15 * 60 * 1000 // 15 minutes

    if (state.lastActive && now - state.lastActive > maxInactive) {
      sessionStorage.removeItem("sprezza_sandbox_state")
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
      fetch("/reset_sandbox", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken }
      }).finally(() => {
        alert("Sandbox has been reset after 15 minutes of inactivity.")
        window.location.href = "/"
      })
    } else {
      state.lastActive = now
      this.saveState(state)
    }
  }

  resetSandbox() {
    if (confirm("Reset the sandbox back to fresh seed data?")) {
      sessionStorage.removeItem("sprezza_sandbox_state")
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
      fetch("/reset_sandbox", {
        method: "POST",
        headers: { "X-CSRF-Token": csrfToken }
      }).finally(() => {
        window.location.href = "/"
      })
    }
  }

  // --- State Storage Helpers ---

  defaultState() {
    return {
      lastActive: Date.now(),
      clearedAll: false,
      deletedRecipeIds: [],
      deletedBasketIds: [],
      recipeBrews: {},
      brewStars: {},
      beanFreezeDates: {},
      beanOrder: [],
      basketOrder: [],
      recipeOrders: {}
    }
  }

  getState() {
    try {
      const data = sessionStorage.getItem("sprezza_sandbox_state")
      return data ? { ...this.defaultState(), ...JSON.parse(data) } : this.defaultState()
    } catch (e) {
      return this.defaultState()
    }
  }

  saveState(state) {
    try {
      sessionStorage.setItem("sprezza_sandbox_state", JSON.stringify(state))
    } catch (e) {
      console.warn("Unable to save sandbox state:", e)
    }
  }

  // --- Database backed Sandbox Mode: DOM mirrors server DB directly ---

  applyOverrides() {
    // Under Option A, database is the single source of truth
    return
  }

  renderHistoryCard(brew, recipeId) {
    const card = document.createElement("div")
    const isStarred = Boolean(brew.star)
    card.className = `history-card sandbox-brew-card ${isStarred ? 'starred' : ''}`
    card.dataset.brewId = brew.id

    const brewDate = brew.createdAt ? new Date(brew.createdAt) : new Date()
    const now = new Date()
    const isCurrentYear = brewDate.getFullYear() === now.getFullYear()
    const day = brewDate.getDate()
    const month = brewDate.getMonth() + 1
    const hours = String(brewDate.getHours()).padStart(2, "0")
    const minutes = String(brewDate.getMinutes()).padStart(2, "0")
    const dateFormatted = isCurrentYear ? `${day}.${month} ${hours}:${minutes}` : `${day}.${month}.${brewDate.getFullYear()} ${hours}:${minutes}`

    const ageFormatted = isStarred ? "Starred today" : "Today"

    card.innerHTML = `
      <div class="history-card-main">
        <div class="history-card-stats">
          <div class="recipe-stat recipe-stat-dose">${brew.dose}<small>g</small></div>
          <div class="recipe-stat recipe-stat-grind">${brew.grind}<i class="fa-solid fa-gear"></i></div>
        </div>

        <div class="history-card-divider-v"></div>

        <div class="history-card-info">
          <div class="history-card-date">${dateFormatted}</div>
          <div class="history-card-age" data-created-at="${brewDate.toISOString()}">${ageFormatted}</div>
        </div>

        <div class="history-card-actions">
          <button type="button" class="action-icon-btn history-action-btn" title="Edit Entry">
            <i class="fa-solid fa-pencil"></i>
          </button>
          <button type="button" 
                  class="action-icon-btn history-action-btn ${isStarred ? 'starred' : ''}" 
                  title="${isStarred ? 'Starred' : 'Star'}"
                  data-controller="brew-star"
                  data-brew-star-url-value=""
                  data-brew-star-starred-value="${isStarred ? 'true' : 'false'}"
                  data-brew-star-brew-id-value="${brew.id}"
                  data-action="click->brew-star#toggle">
            <i class="${isStarred ? 'fa-solid fa-star' : 'fa-regular fa-star'}"></i>
          </button>
        </div>
      </div>
      ${brew.notes ? `
        <div class="history-card-divider-h"></div>
        <div class="history-card-notes">${brew.notes}</div>
      ` : ''}
    `
    return card
  }

  // --- Intercepted Actions in Sandbox Mode ---

  quickLog(event) {
    // Under Option A, quick_log form submits directly to server
  }

  deleteRecipe(event) {
    // Under Option A, recipe delete form submits directly to server
  }

  deleteBasket(event) {
    // Under Option A, basket delete form submits directly to server
  }

  showToast(message) {
    const existing = document.querySelector(".sandbox-toast")
    if (existing) existing.remove()

    const toast = document.createElement("div")
    toast.className = "sandbox-toast"
    toast.textContent = message
    toast.style.cssText = "position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #2c3e50; color: white; padding: 10px 20px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.25); z-index: 9999; animation: fadeIn 0.3s;"
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.opacity = "0"
      toast.style.transition = "opacity 0.5s"
      setTimeout(() => toast.remove(), 500)
    }, 2500)
  }
}
