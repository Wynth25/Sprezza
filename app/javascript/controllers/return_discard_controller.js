import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    returnUrl: String,
    preserveContent: { type: Boolean, default: false }
  }

  connect() {
    this.form = this.element.closest("form")
    this.pressCount = 0
    this.originalHtml = this.element.innerHTML

    this.boundDocClick = this.onDocumentClick.bind(this)
    this.boundFormInput = this.onFormInput.bind(this)

    this.captureInitialValues()

    document.addEventListener("click", this.boundDocClick)
    if (this.form) {
      this.form.addEventListener("input", this.boundFormInput)
      this.form.addEventListener("change", this.boundFormInput)
    }
  }

  disconnect() {
    document.removeEventListener("click", this.boundDocClick)
    if (this.form) {
      this.form.removeEventListener("input", this.boundFormInput)
      this.form.removeEventListener("change", this.boundFormInput)
    }
  }

  captureInitialValues() {
    if (!this.form) return
    this.initialValues = new Map()
    const inputs = this.form.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select")
    inputs.forEach(input => {
      const key = input.name || input.id
      if (key) {
        this.initialValues.set(key, input.value)
      }
    })
  }

  onFormInput() {
    if (this.pressCount === 1 && !this.hasChanges()) {
      this.setReturnState()
    }
  }

  hasChanges() {
    if (!this.form || !this.initialValues) return false

    const inputs = this.form.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, select")
    for (const input of inputs) {
      const key = input.name || input.id
      if (key && this.initialValues.has(key)) {
        const initial = this.initialValues.get(key)
        if (input.type === "number") {
          const numVal = parseFloat(input.value)
          const numInit = parseFloat(initial)
          if (isNaN(numVal) && isNaN(numInit)) continue
          if (isNaN(numVal) || isNaN(numInit) || Math.abs(numVal - numInit) >= 0.001) {
            return true
          }
        } else {
          if (input.value !== initial) {
            return true
          }
        }
      }
    }
    return false
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
    if (this.pressCount === 1 && !this.element.contains(event.target)) {
      this.setReturnState()
    }
  }

  setReturnState() {
    this.pressCount = 0
    if (!this.preserveContentValue) {
      this.element.innerHTML = this.originalHtml
    }
    this.element.classList.remove("btn-discard-active")
    this.element.classList.add("btn-return-subtle")
  }

  setDiscardState() {
    if (!this.preserveContentValue) {
      this.element.textContent = "Discard"
    }
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
