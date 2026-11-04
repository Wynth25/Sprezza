import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    url: String,
    starred: Boolean,
    brewId: Number
  }

  toggle(event) {
    event.preventDefault()
    event.stopPropagation()

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
        body: JSON.stringify({ star: this.starredValue })
      }).catch(err => {
        console.warn("Could not save star to server:", err)
      })
    }

    const sandboxState = localStorage.getItem("sprezza_state")
    if (sandboxState) {
      try {
        const parsed = JSON.parse(sandboxState)
        parsed.brewStars = parsed.brewStars || {}
        parsed.brewStars[this.brewIdValue] = this.starredValue
        localStorage.setItem("sprezza_state", JSON.stringify(parsed))
      } catch (e) {}
    }
  }

  updateVisuals() {
    const icon = this.element.querySelector("i")
    const card = this.element.closest(".history-card")
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
    }
  }
}
