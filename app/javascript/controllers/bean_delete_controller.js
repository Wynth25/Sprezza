import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "modal", "input", "submitBtn" ]

  connect() {
    this.boundKeydown = this.handleKeydown.bind(this)
    window.addEventListener("keydown", this.boundKeydown)
  }

  disconnect() {
    window.removeEventListener("keydown", this.boundKeydown)
  }

  handleKeydown(e) {
    if (e.key === "Escape" && this.hasModalTarget && !this.modalTarget.classList.contains("hidden")) {
      this.closeModal()
    }
  }

  stopProp(e) {
    e.stopPropagation()
  }

  openModal(event) {
    if (event) event.preventDefault()
    if (!this.hasModalTarget) return

    this.modalTarget.classList.remove("hidden")
    if (this.hasInputTarget) {
      this.inputTarget.value = ""
      this.inputTarget.style.borderColor = "var(--btn-bg, #eaddcf)"
      setTimeout(() => this.inputTarget.focus(), 60)
    }
    if (this.hasSubmitBtnTarget) {
      this.submitBtnTarget.disabled = true
      this.submitBtnTarget.style.opacity = "0.4"
      this.submitBtnTarget.style.cursor = "not-allowed"
    }
  }

  closeModal(event) {
    if (event) event.preventDefault()
    if (this.hasModalTarget) {
      this.modalTarget.classList.add("hidden")
    }
  }

  validateInput() {
    const val = this.inputTarget.value.trim().toLowerCase()
    if (val === "delete") {
      this.submitBtnTarget.disabled = false
      this.submitBtnTarget.style.opacity = "1"
      this.submitBtnTarget.style.cursor = "pointer"
      this.inputTarget.style.borderColor = "#16a34a"
    } else {
      this.submitBtnTarget.disabled = true
      this.submitBtnTarget.style.opacity = "0.4"
      this.submitBtnTarget.style.cursor = "not-allowed"
      this.inputTarget.style.borderColor = "var(--btn-bg, #eaddcf)"
    }
  }

  confirmDelete(event) {
    const val = this.inputTarget.value.trim().toLowerCase()
    if (val !== "delete") {
      event.preventDefault()
    }
  }
}
