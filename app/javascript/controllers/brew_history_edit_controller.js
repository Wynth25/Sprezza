import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "viewStats", "editStats",
    "doseDisplay", "grindDisplay",
    "editBtn", "starBtn",
    "saveBtn", "discardBtn"
  ]
  static values = {
    url: String,
    brewId: Number,
    dose: Number,
    grind: Number,
    isLatest: Boolean
  }

  connect() {
    this.originalDose = this.doseValue
    this.originalGrind = this.grindValue
    this.currentDose = this.doseValue
    this.currentGrind = this.grindValue
  }

  startEdit(event) {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    this.originalDose = this.doseValue
    this.originalGrind = this.grindValue
    this.currentDose = this.doseValue
    this.currentGrind = this.grindValue
    this.renderValues()

    this.viewStatsTarget.classList.add("hidden")
    this.editStatsTarget.classList.remove("hidden")

    this.editBtnTarget.classList.add("hidden")
    if (this.hasStarBtnTarget) this.starBtnTarget.classList.add("hidden")

    this.saveBtnTarget.classList.remove("hidden")
    this.discardBtnTarget.classList.remove("hidden")

    this.element.classList.add("is-editing")
  }

  discard(event) {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    this.currentDose = this.originalDose
    this.currentGrind = this.originalGrind
    this.renderValues()
    this.exitEditMode()
  }

  adjustDose(event) {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    const delta = parseFloat(event.currentTarget.dataset.delta || 0)
    this.currentDose = parseFloat((this.currentDose + delta).toFixed(1))
    if (this.currentDose < 0) this.currentDose = 0
    this.renderValues()
  }

  adjustGrind(event) {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    const delta = parseFloat(event.currentTarget.dataset.delta || 0)
    this.currentGrind = parseFloat((this.currentGrind + delta).toFixed(1))
    if (this.currentGrind < 0) this.currentGrind = 0
    this.renderValues()
  }

  async save(event) {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    const newDose = this.currentDose
    const newGrind = this.currentGrind

    this.doseValue = newDose
    this.grindValue = newGrind
    this.originalDose = newDose
    this.originalGrind = newGrind

    this.renderValues()
    this.exitEditMode()

    // Update main dial base values if this is the latest brew
    if (this.isLatestValue) {
      this.updateRecipeDial(newDose, newGrind)
    }

    // Persist via PATCH to Rails backend
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
    if (this.urlValue) {
      try {
        await fetch(this.urlValue, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-CSRF-Token": csrfToken
          },
          body: JSON.stringify({
            brew: {
              dose: newDose,
              grind: newGrind
            }
          })
        })
      } catch (err) {
        console.warn("Could not save brew adjustment:", err)
      }
    }

    // Also update sessionStorage if in sandbox mode
    const sandboxStateRaw = sessionStorage.getItem("sprezza_sandbox_state")
    if (sandboxStateRaw) {
      try {
        const parsed = JSON.parse(sandboxStateRaw)
        if (parsed.brews && parsed.brews[this.brewIdValue]) {
          parsed.brews[this.brewIdValue].dose = newDose
          parsed.brews[this.brewIdValue].grind = newGrind
          sessionStorage.setItem("sprezza_sandbox_state", JSON.stringify(parsed))
        }
      } catch (e) {}
    }
  }

  renderValues() {
    const doseStr = this.currentDose.toFixed(1)
    const grindStr = this.currentGrind.toFixed(1)

    if (this.hasDoseDisplayTarget) {
      this.doseDisplayTarget.innerHTML = `${doseStr}<small>g</small>`
    }
    if (this.hasGrindDisplayTarget) {
      this.grindDisplayTarget.innerHTML = `${grindStr}<i class="fa-solid fa-gear"></i>`
    }
  }

  exitEditMode() {
    this.viewStatsTarget.classList.remove("hidden")
    this.editStatsTarget.classList.add("hidden")

    this.editBtnTarget.classList.remove("hidden")
    if (this.hasStarBtnTarget) this.starBtnTarget.classList.remove("hidden")

    this.saveBtnTarget.classList.add("hidden")
    this.discardBtnTarget.classList.add("hidden")

    this.element.classList.remove("is-editing")
  }

  updateRecipeDial(dose, grind) {
    const dialContainer = document.querySelector('[data-controller="brew-adjust"]')
    if (!dialContainer) return

    const brewAdjust = this.application.getControllerForElementAndIdentifier(dialContainer, "brew-adjust")
    if (brewAdjust) {
      brewAdjust.baseDoseValue = dose
      brewAdjust.baseGrindValue = grind
      if (brewAdjust.hasDoseInputTarget) brewAdjust.doseInputTarget.value = dose.toFixed(1)
      if (brewAdjust.hasGrindInputTarget) brewAdjust.grindInputTarget.value = grind.toFixed(1)
      brewAdjust.checkDoseUI()
      brewAdjust.checkGrindUI()
    }
  }
}
