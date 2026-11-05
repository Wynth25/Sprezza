import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "doseInput", "grindInput", "doseBtn", "grindBtn", "doseResetBtn", "grindResetBtn", "notesBox", "notesBtn" ]
  static values = { baseDose: Number, baseGrind: Number }

  connect() {
    this.checkDoseUI()
    this.checkGrindUI()
  }

  toggleNotes(event) {
    if (event) event.preventDefault()
    if (this.hasNotesBoxTarget) {
      this.notesBoxTarget.classList.toggle("hidden")
      const isVisible = !this.notesBoxTarget.classList.contains("hidden")
      if (this.hasNotesBtnTarget) {
        this.notesBtnTarget.classList.toggle("active", isVisible)
      }
      if (isVisible) {
        const input = this.notesBoxTarget.querySelector("textarea, input")
        if (input) input.focus()
      }
    }
  }

  // --- DOSE ACTIONS ---
  selectDose(event) {
    event.preventDefault()
    const amount = parseFloat(event.currentTarget.dataset.amount)
    
    // Toggle check: if already active, toggle off back to base
    const current = parseFloat(this.doseInputTarget.value)
    const targetVal = parseFloat((this.baseDoseValue + amount).toFixed(1))
    
    if (Math.abs(current - targetVal) < 0.01) {
      this.resetDose()
    } else {
      this.doseInputTarget.value = targetVal.toFixed(1)
      this.doseInputTarget.dispatchEvent(new Event("input", { bubbles: true }))
      this.checkDoseUI()
    }
  }

  manualDose() {
    this.checkDoseUI()
  }

  resetDose(event) {
    if (event) event.preventDefault()
    this.doseInputTarget.value = this.baseDoseValue.toFixed(1)
    this.doseInputTarget.dispatchEvent(new Event("input", { bubbles: true }))
    this.checkDoseUI()
  }

  checkDoseUI() {
    const current = parseFloat(this.doseInputTarget.value)
    const diff = isNaN(current) ? 0 : parseFloat((current - this.baseDoseValue).toFixed(2))
    const isChanged = !isNaN(current) && Math.abs(current - this.baseDoseValue) >= 0.01

    let matchedBtn = null
    this.doseBtnTargets.forEach(btn => {
      const btnAmount = parseFloat(btn.dataset.amount)
      btn.disabled = false

      if (isChanged && Math.abs(diff - btnAmount) < 0.01) {
        btn.classList.add("active")
        matchedBtn = btn
      } else {
        btn.classList.remove("active")
      }
    })

    const doseBox = this.doseInputTarget.closest(".dial-input-box")
    if (isChanged && !matchedBtn) {
      if (doseBox) doseBox.classList.add("custom-highlight")
      this.doseInputTarget.classList.add("custom-highlight")
    } else {
      if (doseBox) doseBox.classList.remove("custom-highlight")
      this.doseInputTarget.classList.remove("custom-highlight")
    }

    if (this.hasDoseResetBtnTarget) {
      if (isChanged) {
        this.doseResetBtnTarget.classList.remove("hidden")
      } else {
        this.doseResetBtnTarget.classList.add("hidden")
      }
    }
  }

  // --- GRIND ACTIONS ---
  selectGrind(event) {
    event.preventDefault()
    const amount = parseFloat(event.currentTarget.dataset.amount)
    
    // Toggle check: if already active, toggle off back to base
    const current = parseFloat(this.grindInputTarget.value)
    const targetVal = parseFloat((this.baseGrindValue + amount).toFixed(1))
    
    if (Math.abs(current - targetVal) < 0.01) {
      this.resetGrind()
    } else {
      this.grindInputTarget.value = targetVal.toFixed(1)
      this.grindInputTarget.dispatchEvent(new Event("input", { bubbles: true }))
      this.checkGrindUI()
    }
  }

  manualGrind() {
    this.checkGrindUI()
  }

  resetGrind(event) {
    if (event) event.preventDefault()
    this.grindInputTarget.value = this.baseGrindValue.toFixed(1)
    this.grindInputTarget.dispatchEvent(new Event("input", { bubbles: true }))
    this.checkGrindUI()
  }

  checkGrindUI() {
    const current = parseFloat(this.grindInputTarget.value)
    const diff = isNaN(current) ? 0 : parseFloat((current - this.baseGrindValue).toFixed(2))
    const isChanged = !isNaN(current) && Math.abs(current - this.baseGrindValue) >= 0.01

    let matchedBtn = null
    this.grindBtnTargets.forEach(btn => {
      const btnAmount = parseFloat(btn.dataset.amount)
      btn.disabled = false

      if (isChanged && Math.abs(diff - btnAmount) < 0.01) {
        btn.classList.add("active")
        matchedBtn = btn
      } else {
        btn.classList.remove("active")
      }
    })

    const grindBox = this.grindInputTarget.closest(".dial-input-box")
    if (isChanged && !matchedBtn) {
      if (grindBox) grindBox.classList.add("custom-highlight")
      this.grindInputTarget.classList.add("custom-highlight")
    } else {
      if (grindBox) grindBox.classList.remove("custom-highlight")
      this.grindInputTarget.classList.remove("custom-highlight")
    }

    if (this.hasGrindResetBtnTarget) {
      if (isChanged) {
        this.grindResetBtnTarget.classList.remove("hidden")
      } else {
        this.grindResetBtnTarget.classList.add("hidden")
      }
    }
  }
}