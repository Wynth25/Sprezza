import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "viewStats", "editStats",
    "viewInfo", "editInfo",
    "doseDisplay", "grindDisplay",
    "dateDisplay", "ageDisplay",
    "doseInput", "grindInput",
    "datetimeInput",
    "starDateToggleBtn", "starDatePopup", "starDatetimeInput",
    "editBtn", "starBtn",
    "saveBtn", "discardBtn"
  ]
  static values = {
    url: String,
    brewId: Number,
    dose: Number,
    grind: Number,
    createdAt: String,
    starredAt: String,
    isStarred: Boolean,
    roastDate: String,
    isLatest: Boolean
  }

  connect() {
    this.originalDose = this.doseValue
    this.originalGrind = this.grindValue
    this.originalCreatedAt = this.createdAtValue
    this.originalStarredAt = this.starredAtValue || ""

    this.currentDose = this.doseValue
    this.currentGrind = this.grindValue
    this.currentCreatedAt = this.createdAtValue
    this.currentStarredAt = this.starredAtValue || ""

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
    this.originalCreatedAt = this.createdAtValue
    this.originalStarredAt = this.starredAtValue || ""

    this.currentDose = this.doseValue
    this.currentGrind = this.grindValue
    this.currentCreatedAt = this.createdAtValue
    this.currentStarredAt = this.starredAtValue || ""

    if (this.hasDoseInputTarget) this.doseInputTarget.value = this.currentDose.toFixed(1)
    if (this.hasGrindInputTarget) this.grindInputTarget.value = this.currentGrind.toFixed(1)
    if (this.hasDatetimeInputTarget) this.datetimeInputTarget.value = this.currentCreatedAt
    if (this.hasStarDatetimeInputTarget) this.starDatetimeInputTarget.value = this.currentStarredAt

    this.resetDiscardConfirm()
    this.closeStarDatePopup()

    this.viewStatsTarget.classList.add("hidden")
    this.editStatsTarget.classList.remove("hidden")

    if (this.hasViewInfoTarget) this.viewInfoTarget.classList.add("hidden")
    if (this.hasEditInfoTarget) this.editInfoTarget.classList.remove("hidden")

    this.editBtnTarget.classList.add("hidden")
    if (this.hasStarBtnTarget) this.starBtnTarget.classList.add("hidden")

    this.saveBtnTarget.classList.remove("hidden")
    this.discardBtnTarget.classList.remove("hidden")

    this.element.classList.add("is-editing")

    if (this.hasDoseInputTarget) {
      setTimeout(() => this.doseInputTarget.focus(), 50)
    }
  }

  toggleStarDatePopup(event) {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    if (!this.hasStarDatePopupTarget) return

    this.starDatePopupTarget.classList.toggle("hidden")
    const isVisible = !this.starDatePopupTarget.classList.contains("hidden")
    if (this.hasStarDateToggleBtnTarget) {
      this.starDateToggleBtnTarget.classList.toggle("active", isVisible)
    }
    if (isVisible && this.hasStarDatetimeInputTarget) {
      this.starDatetimeInputTarget.focus()
    }
  }

  closeStarDatePopup() {
    if (this.hasStarDatePopupTarget) {
      this.starDatePopupTarget.classList.add("hidden")
    }
    if (this.hasStarDateToggleBtnTarget) {
      this.starDateToggleBtnTarget.classList.remove("active")
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

  onDatetimeInput() {
    if (this.hasDatetimeInputTarget && this.datetimeInputTarget.value) {
      this.currentCreatedAt = this.datetimeInputTarget.value
    }
    this.resetDiscardConfirm()
  }

  onStarDatetimeInput() {
    if (this.hasStarDatetimeInputTarget && this.starDatetimeInputTarget.value) {
      this.currentStarredAt = this.starDatetimeInputTarget.value
    }
    this.resetDiscardConfirm()
  }

  hasChanges() {
    const doseDiff = Math.abs(this.currentDose - this.originalDose)
    const grindDiff = Math.abs(this.currentGrind - this.originalGrind)
    const dateChanged = this.currentCreatedAt !== this.originalCreatedAt
    const starDateChanged = this.currentStarredAt !== this.originalStarredAt
    return doseDiff >= 0.05 || grindDiff >= 0.05 || dateChanged || starDateChanged
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
    this.closeStarDatePopup()
    this.currentDose = this.originalDose
    this.currentGrind = this.originalGrind
    this.currentCreatedAt = this.originalCreatedAt
    this.currentStarredAt = this.originalStarredAt
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
    if (this.hasDatetimeInputTarget && this.datetimeInputTarget.value) {
      this.currentCreatedAt = this.datetimeInputTarget.value
    }
    if (this.hasStarDatetimeInputTarget && this.starDatetimeInputTarget.value) {
      this.currentStarredAt = this.starDatetimeInputTarget.value
    }

    const newDose = this.currentDose
    const newGrind = this.currentGrind
    const newCreatedAt = this.currentCreatedAt
    const newStarredAt = this.currentStarredAt

    this.doseValue = newDose
    this.grindValue = newGrind
    this.createdAtValue = newCreatedAt
    this.starredAtValue = newStarredAt
    this.originalDose = newDose
    this.originalGrind = newGrind
    this.originalCreatedAt = newCreatedAt
    this.originalStarredAt = newStarredAt

    this.renderDisplayValues()
    this.exitEditMode()

    // Update main dial base values if this is the latest brew
    if (this.isLatestValue) {
      this.updateRecipeDial(newDose, newGrind)
    }

    // Persist via PATCH to Rails backend
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
    if (this.urlValue) {
      const payload = {
        brew: {
          dose: newDose,
          grind: newGrind,
          created_at: newCreatedAt
        }
      }
      if (this.isStarredValue && newStarredAt) {
        payload.brew.starred_at = newStarredAt
      }

      try {
        await fetch(this.urlValue, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-CSRF-Token": csrfToken
          },
          body: JSON.stringify(payload)
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
          parsed.brews[this.brewIdValue].createdAt = new Date(newCreatedAt).toISOString()
          if (this.isStarredValue && newStarredAt) {
            parsed.brews[this.brewIdValue].starredAt = new Date(newStarredAt).toISOString()
          }
          sessionStorage.setItem("sprezza_sandbox_state", JSON.stringify(parsed))
        }
        if (this.isStarredValue && newStarredAt) {
          parsed.brewStars = parsed.brewStars || {}
          parsed.brewStars[this.brewIdValue] = {
            star: true,
            starredAt: new Date(newStarredAt).toISOString()
          }
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

    if (this.hasDateDisplayTarget && this.currentCreatedAt) {
      const d = new Date(this.currentCreatedAt)
      if (!isNaN(d.getTime())) {
        const now = new Date()
        const day = d.getDate()
        const month = d.getMonth() + 1
        const hours = String(d.getHours()).padStart(2, "0")
        const mins = String(d.getMinutes()).padStart(2, "0")
        const formatted = (d.getFullYear() === now.getFullYear())
          ? `${day}.${month} ${hours}:${mins}`
          : `${day}.${month}.${d.getFullYear()} ${hours}:${mins}`
        this.dateDisplayTarget.textContent = formatted
      }
    }

    // Update age display if present
    const ageEl = this.element.querySelector(".history-card-age")
    if (ageEl) {
      const now = new Date()
      now.setHours(0, 0, 0, 0)

      if (this.isStarredValue) {
        const refDateStr = this.currentStarredAt || this.currentCreatedAt
        const refDate = new Date(refDateStr)
        refDate.setHours(0, 0, 0, 0)
        const starDays = Math.max(0, Math.floor((now - refDate) / (1000 * 60 * 60 * 24)))
        
        let label = (starDays <= 0) ? "Starred today" : (starDays === 1 ? "Starred 1 day ago" : `Starred ${starDays} days ago`)
        
        if (this.hasRoastDateValue && this.roastDateValue) {
          const rDate = new Date(this.roastDateValue)
          rDate.setHours(0, 0, 0, 0)
          const beanAge = Math.max(0, Math.floor((refDate - rDate) / (1000 * 60 * 60 * 24)))
          label += ` (${beanAge}d bean)`
        }
        ageEl.textContent = label
      } else if (this.currentCreatedAt) {
        const cDate = new Date(this.currentCreatedAt)
        cDate.setHours(0, 0, 0, 0)
        const daysAgo = Math.max(0, Math.floor((now - cDate) / (1000 * 60 * 60 * 24)))
        ageEl.textContent = (daysAgo <= 0) ? "Today" : (daysAgo === 1 ? "1 day since" : `${daysAgo} days since`)
      }
    }
  }

  exitEditMode() {
    this.resetDiscardConfirm()
    this.closeStarDatePopup()

    this.viewStatsTarget.classList.remove("hidden")
    this.editStatsTarget.classList.add("hidden")

    if (this.hasViewInfoTarget) this.viewInfoTarget.classList.remove("hidden")
    if (this.hasEditInfoTarget) this.editInfoTarget.classList.add("hidden")

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
