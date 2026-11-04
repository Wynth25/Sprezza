import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { admin: Boolean }

  connect() {
    if (this.adminValue) return

    this.initWatchdog()
    this.applyOverrides()

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
      alert("Sandbox has been reset after 15 minutes of inactivity.")
      window.location.reload()
    } else {
      state.lastActive = now
      this.saveState(state)
    }
  }

  resetSandbox() {
    if (confirm("Reset the sandbox back to fresh seed data?")) {
      sessionStorage.removeItem("sprezza_sandbox_state")
      window.location.reload()
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

  // --- Apply Browser Overrides to DOM ---

  applyOverrides() {
    const state = this.getState()

    // 0. If user wiped sandbox data completely
    if (state.clearedAll) {
      const emptyMarkup = `
        <div style="text-align: center; padding: 48px 20px; background: var(--card-cream); border: 2px dashed var(--btn-bg); border-radius: 16px;">
          <i class="fa-solid fa-mug-hot" style="font-size: 2.2rem; color: #b5a999; margin-bottom: 12px; display: block;"></i>
          <h3 style="color: var(--header-brown); margin: 0 0 6px 0;">Sandbox is Empty</h3>
          <p style="color: #7b7267; font-size: 0.95rem; margin-bottom: 18px;">All mock beans, baskets, and recipes have been cleared.</p>
          <button type="button" class="btn-primary" onclick="sessionStorage.removeItem('sprezza_sandbox_state'); window.location.reload();" style="border-radius: 10px; padding: 10px 18px; font-weight: 700; cursor: pointer;">
            <i class="fa-solid fa-rotate-left"></i> Restore Seed Data
          </button>
        </div>
      `
      const beanList = document.querySelector('[data-dashboard-target="beanList"]')
      if (beanList) beanList.innerHTML = emptyMarkup

      const basketList = document.querySelector('[data-dashboard-target="basketList"]')
      if (basketList) basketList.innerHTML = emptyMarkup

      return
    }

    // 1. Hide deleted baskets (and any recipes using those baskets)
    if (state.deletedBasketIds && state.deletedBasketIds.length > 0) {
      state.deletedBasketIds.forEach(id => {
        document.querySelectorAll(`.basket-card[data-id="${id}"]`).forEach(el => el.remove())
        document.querySelectorAll(`.recipe-card-wrapper[data-basket-id="${id}"]`).forEach(el => el.remove())
      })
    }

    // 2. Hide deleted recipes
    if (state.deletedRecipeIds && state.deletedRecipeIds.length > 0) {
      state.deletedRecipeIds.forEach(id => {
        const wrapper = document.querySelector(`.recipe-card-wrapper[data-id="${id}"]`)
        if (wrapper) wrapper.remove()
      })
    }

    // 3. Apply latest brews to recipe cards & show page
    if (state.recipeBrews) {
      Object.entries(state.recipeBrews).forEach(([recipeId, brews]) => {
        if (!brews || brews.length === 0) return
        const latest = brews[brews.length - 1]
        const card = document.querySelector(`.recipe-card-wrapper[data-id="${recipeId}"] .recipe-card-stats`)
        if (card) {
          card.innerHTML = `<div class="recipe-stat recipe-stat-dose">${latest.dose}<small>g</small></div><div class="recipe-stat recipe-stat-grind">${latest.grind}<i class="fa-solid fa-gear"></i></div>`
        }

        const showHeader = document.getElementById("recipe-latest-stat")
        const form = document.querySelector(`form[data-recipe-id="${recipeId}"]`)
        if (showHeader && form) {
          showHeader.innerHTML = `<span class="stat-dose">${latest.dose}</span>g, <span class="stat-grind">${latest.grind}</span>`
          const historyList = document.getElementById("brew-history-list")
          if (historyList) {
            historyList.querySelectorAll(".sandbox-brew").forEach(el => el.remove())
            brews.forEach(b => {
              const li = document.createElement("li")
              li.className = "sandbox-brew"
              li.innerHTML = `<strong>${b.date} (Sandbox)</strong><br>Dose: <span class="history-dose">${b.dose}</span>g | Grind: <span class="history-grind">${b.grind}</span>`
              const empty = historyList.querySelector(".empty-history")
              if (empty) empty.remove()
              historyList.prepend(li)
            })
          }
        }
      })
    }

    // 4. Reorder beans if custom sort exists
    if (state.beanOrder && state.beanOrder.length > 0) {
      const beanList = document.querySelector('[data-dashboard-target="beanList"]')
      if (beanList) {
        state.beanOrder.forEach(id => {
          const el = beanList.querySelector(`:scope > [data-id="${id}"]`)
          if (el) beanList.appendChild(el)
        })
      }
    }

    // 5. Reorder baskets if custom sort exists
    if (state.basketOrder && state.basketOrder.length > 0) {
      const basketList = document.querySelector('[data-dashboard-target="basketList"]')
      if (basketList) {
        state.basketOrder.forEach(id => {
          const el = basketList.querySelector(`.basket-card[data-id="${id}"]`)
          if (el) basketList.appendChild(el)
        })
      }
    }

    // 6. Reorder recipes per bean grid if custom sort exists
    if (state.recipeOrders) {
      Object.entries(state.recipeOrders).forEach(([beanId, recipeIds]) => {
        const grid = document.querySelector(`.recipe-grid[data-bean-id="${beanId}"]`)
        if (grid && Array.isArray(recipeIds)) {
          recipeIds.forEach(id => {
            const el = grid.querySelector(`.recipe-card-wrapper[data-id="${id}"]`)
            if (el) grid.appendChild(el)
          })
        }
      })
    }
  }

  // --- Intercepted Actions in Sandbox Mode ---

  quickLog(event) {
    if (this.adminValue) return

    event.preventDefault()
    const form = event.currentTarget
    const recipeId = form.dataset.recipeId
    const doseInput = form.querySelector('[data-brew-adjust-target="doseInput"]') || form.querySelector('input[name="dose"]')
    const grindInput = form.querySelector('[data-brew-adjust-target="grindInput"]') || form.querySelector('input[name="grind"]')

    const dose = parseFloat(doseInput.value).toFixed(1)
    const grind = parseFloat(grindInput.value).toFixed(1)
    const dateStr = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) + " - " + new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })

    const state = this.getState()
    if (!state.recipeBrews[recipeId]) state.recipeBrews[recipeId] = []
    state.recipeBrews[recipeId].push({ dose, grind, date: dateStr })
    this.saveState(state)

    const showHeader = document.getElementById("recipe-latest-stat")
    if (showHeader) {
      showHeader.innerHTML = `<span class="stat-dose">${dose}</span>g, <span class="stat-grind">${grind}</span>`
    }

    const historyList = document.getElementById("brew-history-list")
    if (historyList) {
      const empty = historyList.querySelector(".empty-history")
      if (empty) empty.remove()
      const li = document.createElement("li")
      li.className = "sandbox-brew"
      li.style.backgroundColor = "rgba(201, 214, 178, 0.25)"
      li.style.padding = "6px 8px"
      li.style.borderRadius = "8px"
      li.innerHTML = `<strong>${dateStr} (Sandbox)</strong><br>Dose: ${dose}g | Grind: ${grind}`
      historyList.prepend(li)
    }

    this.showToast("Brewed!")
  }

  deleteRecipe(event) {
    if (this.adminValue) return

    event.preventDefault()
    event.stopImmediatePropagation()
    const button = event.currentTarget
    const cardWrapper = button.closest(".recipe-card-wrapper")
    if (!cardWrapper) return

    const recipeId = cardWrapper.dataset.id
    if (!recipeId) return

    const confirmMsg = button.dataset.turboConfirm || "Delete this recipe?"
    if (!confirm(confirmMsg)) return

    const state = this.getState()
    if (!state.deletedRecipeIds.includes(recipeId)) {
      state.deletedRecipeIds.push(recipeId)
    }
    this.saveState(state)

    cardWrapper.style.transition = "opacity 0.25s, transform 0.25s"
    cardWrapper.style.opacity = "0"
    cardWrapper.style.transform = "scale(0.85)"
    setTimeout(() => cardWrapper.remove(), 250)

    this.showToast("Recipe removed from Sandbox.")
  }

  deleteBasket(event) {
    if (this.adminValue) return

    event.preventDefault()
    event.stopImmediatePropagation()
    const button = event.currentTarget
    const basketCard = button.closest(".basket-card")
    if (!basketCard) return

    const basketId = basketCard.dataset.id
    if (!basketId) return

    const confirmMsg = button.dataset.turboConfirm || "Delete this basket?"
    if (!confirm(confirmMsg)) return

    const state = this.getState()
    if (!state.deletedBasketIds.includes(basketId)) {
      state.deletedBasketIds.push(basketId)
    }
    this.saveState(state)

    basketCard.style.transition = "opacity 0.25s, transform 0.25s"
    basketCard.style.opacity = "0"
    basketCard.style.transform = "scale(0.95)"
    setTimeout(() => basketCard.remove(), 250)

    this.showToast("Basket removed from Sandbox.")
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
