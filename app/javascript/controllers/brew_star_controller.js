import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    url: String,
    starred: Boolean,
    brewId: Number
  }

  connect() {
    this.confirmingUnstar = false
    this.boundDocClick = this.onDocumentClick.bind(this)
    document.addEventListener("click", this.boundDocClick)
  }

  disconnect() {
    document.removeEventListener("click", this.boundDocClick)
  }

  onDocumentClick(event) {
    if (!this.element.contains(event.target) && this.confirmingUnstar) {
      this.resetConfirm()
    }
  }

  resetConfirm() {
    this.confirmingUnstar = false
    this.element.classList.remove("confirm-unstar")
    this.element.title = "Starred"
  }

  toggle(event) {
    event.preventDefault()
    event.stopPropagation()

    // If currently starred, require 2-step confirmation to unstar
    if (this.starredValue) {
      if (!this.confirmingUnstar) {
        this.confirmingUnstar = true
        this.element.classList.add("confirm-unstar")
        this.element.title = "Tap again to remove star"
        return
      }
    }

    this.confirmingUnstar = false
    this.element.classList.remove("confirm-unstar")

    this.starredValue = !this.starredValue
    this.updateVisuals()

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content

    if (this.urlValue) {
      fetch(this.urlValue, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({ brew: { star: this.starredValue }, star: this.starredValue })
      })
      .then(res => res.json())
      .then(data => {
        // Synchronize history-edit controller if present on the same card
        const card = this.element.closest(".history-card")
        if (card) {
          const editCtrl = this.application.getControllerForElementAndIdentifier(card, "brew-history-edit")
          if (editCtrl) {
            editCtrl.syncStarState(data.star, data.starred_at)
          }
        }
      })
      .catch(err => {
        console.warn("Could not save star to server:", err)
      })
    }

    // Synchronize history-edit controller immediately in DOM
    const card = this.element.closest(".history-card")
    if (card) {
      const editCtrl = this.application.getControllerForElementAndIdentifier(card, "brew-history-edit")
      if (editCtrl) {
        const todayStr = new Date().toISOString().split("T")[0]
        editCtrl.syncStarState(this.starredValue, this.starredValue ? todayStr : "")
      }
    }

    const sandboxStateRaw = sessionStorage.getItem("sprezza_sandbox_state")
    if (sandboxStateRaw) {
      try {
        const parsed = JSON.parse(sandboxStateRaw)
        parsed.brewStars = parsed.brewStars || {}
        parsed.brewStars[this.brewIdValue] = {
          star: this.starredValue,
          starredAt: this.starredValue ? new Date().toISOString() : null
        }
        sessionStorage.setItem("sprezza_sandbox_state", JSON.stringify(parsed))
      } catch (e) {}
    }
  }

  updateVisuals() {
    const icon = this.element.querySelector("i")
    const card = this.element.closest(".history-card")
    const ageEl = card?.querySelector(".history-card-age")

    if (this.starredValue) {
      this.element.classList.add("starred")
      this.element.title = "Starred"
      if (icon) {
        icon.classList.remove("fa-regular")
        icon.classList.add("fa-solid")
      }
      if (card) {
        card.classList.add("starred")
      }
      if (ageEl) {
        // Starred just now -> counts from today
        const beanAgeStr = ageEl.dataset.beanAge ? ` (${ageEl.dataset.beanAge}d bean)` : ""
        ageEl.textContent = `Starred today${beanAgeStr}`
      }
    } else {
      this.element.classList.remove("starred")
      this.element.title = "Star Brew"
      if (icon) {
        icon.classList.remove("fa-solid")
        icon.classList.add("fa-regular")
      }
      if (card) {
        card.classList.remove("starred")
      }
      if (ageEl) {
        // Unstarred -> recalculate days since brew was created
        const createdAtStr = ageEl.dataset.createdAt
        if (createdAtStr) {
          const createdDate = new Date(createdAtStr)
          const now = new Date()
          const diffTime = Math.abs(now.setHours(0,0,0,0) - createdDate.setHours(0,0,0,0))
          const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          if (daysAgo <= 0) {
            ageEl.textContent = "Today"
          } else if (daysAgo === 1) {
            ageEl.textContent = "1 day since"
          } else {
            ageEl.textContent = `${daysAgo} days since`
          }
        }
      }
    }
  }
}
