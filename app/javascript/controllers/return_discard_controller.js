import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    returnUrl: String
  }

  connect() {
    this.form = this.element.closest("form")
    this.pressCount = 0
    this.boundDocClick = this.onDocumentClick.bind(this)
    this.boundFormInput = this.onFormInput.bind(this)

    // Capture initial form state after standard initialization
    setTimeout(() => {
      this.initialState = this.getFormData()
    }, 50)

    document.addEventListener("click", this.boundDocClick)
    if (this.form) {
      this.form.addEventListener("input", this.boundFormInput)
    }
  }

  disconnect() {
    document.removeEventListener("click", this.boundDocClick)
    if (this.form) {
      this.form.removeEventListener("input", this.boundFormInput)
    }
  }

  getFormData() {
    if (!this.form) return ""
    const formData = new FormData(this.form)
    const entries = []
    for (const [key, value] of formData.entries()) {
      if (key === "authenticity_token" || key === "_method") continue
      entries.push(`${key}=${value}`)
    }
    return entries.sort().join("&")
  }

  hasChanges() {
    if (this.initialState === undefined) return false
    return this.getFormData() !== this.initialState
  }

  handleClick(event) {
    event.preventDefault()
    event.stopPropagation()

    if (!this.hasChanges()) {
      // 0 changes: clicking Return immediately returns to index
      this.navigateAway()
      return
    }

    if (this.pressCount === 0) {
      // 1 press: show red button "Discard"
      this.pressCount = 1
      this.setDiscardState()
    } else {
      // 2 presses: return to index without saving changes
      this.navigateAway()
    }
  }

  onDocumentClick(event) {
    // If in Discard state and user clicks anywhere outside the button, revert back to Return
    if (this.pressCount === 1 && !this.element.contains(event.target)) {
      this.setReturnState()
    }
  }

  onFormInput() {
    // If form values are restored back to initial, revert button to Return
    if (this.pressCount === 1 && !this.hasChanges()) {
      this.setReturnState()
    }
  }

  setReturnState() {
    this.pressCount = 0
    this.element.textContent = "Return"
    this.element.classList.remove("btn-discard-active")
    this.element.classList.add("btn-return-subtle")
  }

  setDiscardState() {
    this.element.textContent = "Discard"
    this.element.classList.remove("btn-return-subtle")
    this.element.classList.add("btn-discard-active")
  }

  navigateAway() {
    const url = this.returnUrlValue
    if (!url) return

    if (window.Turbo) {
      window.Turbo.visit(url)
    } else {
      window.location.href = url
    }
  }
}
