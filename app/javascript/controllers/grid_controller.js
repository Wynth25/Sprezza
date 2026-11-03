import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "twoColBtn", "threeColBtn" ]
  static values = {
    admin: Boolean,
    desktop: { type: String, default: "3" },
    mobile: { type: String, default: "2" }
  }

  connect() {
    // Clean up legacy localStorage key from older version
    try { localStorage.removeItem("sprezza_grid_cols") } catch (_) {}

    this.boundResize = this.applyGrid.bind(this)
    window.addEventListener("resize", this.boundResize, { passive: true })
    this.applyGrid()
  }

  disconnect() {
    if (this.boundResize) {
      window.removeEventListener("resize", this.boundResize)
    }
  }

  twoColBtnTargetConnected() {
    this.applyGrid()
  }

  threeColBtnTargetConnected() {
    this.applyGrid()
  }

  isMobileViewport() {
    return window.innerWidth < 1000
  }

  getSandboxState() {
    try {
      const raw = sessionStorage.getItem("sprezza_sandbox_state")
      return raw ? JSON.parse(raw) : {}
    } catch (_) {
      return {}
    }
  }

  saveSandboxGrid(device, cols) {
    try {
      const raw = sessionStorage.getItem("sprezza_sandbox_state")
      const state = raw ? JSON.parse(raw) : {
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
      if (device === "mobile") {
        state.gridMobile = cols
      } else {
        state.gridDesktop = cols
      }
      sessionStorage.setItem("sprezza_sandbox_state", JSON.stringify(state))
    } catch (e) {
      console.warn("Unable to save sandbox grid preference:", e)
    }
  }

  effectiveCols() {
    if (this.adminValue) {
      return {
        desktop: this.desktopValue === "2" ? "2" : "3",
        mobile: this.mobileValue === "3" ? "3" : "2"
      }
    }

    const state = this.getSandboxState()
    return {
      desktop: state.gridDesktop === "2" ? "2" : "3",
      mobile: state.gridMobile === "3" ? "3" : "2"
    }
  }

  applyGrid() {
    const { desktop, mobile } = this.effectiveCols()
    this.element.style.setProperty("--desktop-cols", desktop)
    this.element.style.setProperty("--mobile-cols", mobile)

    const activeCols = this.isMobileViewport() ? mobile : desktop
    this.updateButtonsUI(activeCols)
  }

  setTwoCols() {
    this.savePreference("2")
  }

  setThreeCols() {
    this.savePreference("3")
  }

  savePreference(cols) {
    const device = this.isMobileViewport() ? "mobile" : "desktop"

    if (this.adminValue) {
      if (device === "mobile") {
        this.mobileValue = cols
      } else {
        this.desktopValue = cols
      }
      this.applyGrid()

      const csrfToken = document.querySelector("[name='csrf-token']")?.content
      fetch("/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({ device, cols })
      })
    } else {
      this.saveSandboxGrid(device, cols)
      this.applyGrid()
    }
  }

  updateButtonsUI(activeCols) {
    if (this.hasTwoColBtnTarget && this.hasThreeColBtnTarget) {
      if (activeCols === "3") {
        this.threeColBtnTarget.classList.add("active-grid-btn")
        this.twoColBtnTarget.classList.remove("active-grid-btn")
      } else {
        this.twoColBtnTarget.classList.add("active-grid-btn")
        this.threeColBtnTarget.classList.remove("active-grid-btn")
      }
    }
  }
}
