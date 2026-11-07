import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "viewStats", "editStats",
    "doseDisplay", "grindDisplay",
    "doseInput", "grindInput",
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
    this.confirmingDiscard = false
    this.boundDocClick = this.onDocumentClick.bind(this)
    document.addEventListener("click", this.boundDocClick)
  }

  disconnect() {
    document.removeEventListener("click", this.boundDocClick)
  }

  onDocumentClick(event) {
    if (this.confirmingDiscard && this.hasDiscardBtnTarget && !this.discardBtnTarget.contains(event.target)) {
      this.resetDiscardConfirm()
    }
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

    if (this.hasDoseInputTarget) this.doseInputTarget.value = this.currentDose.toFixed(1)
    if (this.hasGrindInputTarget) this.grindInputTarget.value = this.currentGrind.toFixed(1)

    this.resetDiscardConfirm()

    this.viewStatsTarget.classList.add("hidden")
    this.editStatsTarget.classList.remove("hidden")

    this.editBtnTarget.classList.add("hidden")
    if (this.hasStarBtnTarget) this.starBtnTarget.classList.add("hidden")

    this.saveBtnTarget.classList.remove("hidden")
    this.discardBtnTarget.classList.remove("hidden")

    this.element.classList.add("is-editing")

    if (this.hasDoseInputTarget) {
      setTimeout(() => this.doseInputTarget.focus(), 50)
    }
  }

  onDoseInput() {
    const val = parseFloat(this.doseInputTarget.value)
    if (!isNaN(val)) {
      this.currentDose = val
    }
    this.resetDiscardConfirm()
  }

  onGrindInput() {
    const val = parseFloat(this.grindInputTarget.value)
    if (!isNaN(val)) {
      this.currentGrind = val
    }
    this.resetDiscardConfirm()
  }

  hasChanges() {
    const doseDiff = Math.abs(this.currentDose - this.originalDose)
    const grindDiff = Math.abs(this.currentGrind - this.originalGrind)
    return doseDiff >= 0.05 || grindDiff >= 0.05
  }

  discard(event) {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Double-press required ONLY if changes were made
    if (this.hasChanges() && !this.confirmingDiscard) {
      this.confirmingDiscard = true
      this.discardBtnTarget.classList.add("confirm-discard")
      this.discardBtnTarget.title = "Tap again to discard changes"
      return
    }

    this.resetDiscardConfirm()
    this.currentDose = this.originalDose
    this.currentGrind = this.originalGrind
    this.renderDisplayValues()
    this.exitEditMode()
  }

  resetDiscardConfirm() {
    this.confirmingDiscard = false
    if (this.hasDiscardBtnTarget) {
      this.discardBtnTarget.classList.remove("confirm-discard")
      this.discardBtnTarget.title = "Discard Changes"
    }
  }

  async save(event) {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    // Read latest values from inputs
    if (this.hasDoseInputTarget) {
      const d = parseFloat(this.doseInputTarget.value)
      if (!isNaN(d)) this.currentDose = parseFloat(d.toFixed(1))
    }
    if (this.hasGrindInputTarget) {
      const g = parseFloat(this.grindInputTarget.value)
      if (!isNaN(g)) this.currentGrind = parseFloat(g.toFixed(1))
    }

    const newDose = this.currentDose
    const newGrind = this.currentGrind

    this.doseValue = newDose
    this.grindValue = newGrind
    this.originalDose = newDose
    this.originalGrind = newGrind

    this.renderDisplayValues()
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

  renderDisplayValues() {
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
    this.resetDiscardConfirm()

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
