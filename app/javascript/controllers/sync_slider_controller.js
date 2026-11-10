import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "doseSlider", "doseNumber",
    "basketSelect", "basketField",
    "waterField", "waterSlider", "waterNumber",
    "pourOverRadio"
  ]

  connect() {
    this.toggleStyle()
  }

  toggleStyle() {
    const isPourOver = this.hasPourOverRadioTarget && this.pourOverRadioTarget.checked

    if (isPourOver) {
      if (this.hasBasketFieldTarget) this.basketFieldTarget.classList.add("hidden")
      if (this.hasBasketSelectTarget) this.basketSelectTarget.disabled = true

      if (this.hasWaterFieldTarget) this.waterFieldTarget.classList.remove("hidden")
      if (this.hasWaterSliderTarget) this.waterSliderTarget.disabled = false
      if (this.hasWaterNumberTarget) this.waterNumberTarget.disabled = false

      if (this.hasDoseSliderTarget && this.hasDoseNumberTarget) {
        const wasDisabled = this.doseSliderTarget.disabled
        const current = parseFloat(this.doseNumberTarget.value)
        this.doseSliderTarget.min = 10
        this.doseSliderTarget.max = 60
        if (wasDisabled || isNaN(current) || current < 10 || current > 60) {
          this.doseSliderTarget.value = 18.0
          this.doseNumberTarget.value = 18.0
        }
        this.doseSliderTarget.disabled = false
        this.doseNumberTarget.disabled = false
      }
    } else {
      if (this.hasBasketFieldTarget) this.basketFieldTarget.classList.remove("hidden")
      if (this.hasBasketSelectTarget) this.basketSelectTarget.disabled = false

      if (this.hasWaterFieldTarget) this.waterFieldTarget.classList.add("hidden")
      if (this.hasWaterSliderTarget) this.waterSliderTarget.disabled = true
      if (this.hasWaterNumberTarget) this.waterNumberTarget.disabled = true

      this.updateBounds()
    }
  }

  updateNumber() {
    this.doseNumberTarget.value = this.doseSliderTarget.value
  }

  updateSlider() {
    this.doseSliderTarget.value = this.doseNumberTarget.value
  }

  updateWaterNumber() {
    if (this.hasWaterNumberTarget && this.hasWaterSliderTarget) {
      this.waterNumberTarget.value = this.waterSliderTarget.value
    }
  }

  updateWaterSlider() {
    if (this.hasWaterSliderTarget && this.hasWaterNumberTarget) {
      this.waterSliderTarget.value = this.waterNumberTarget.value
    }
  }

  updateBounds() {
    if (!this.hasBasketSelectTarget) return
    if (this.hasPourOverRadioTarget && this.pourOverRadioTarget.checked) return

    const selectedOption = this.basketSelectTarget.options[this.basketSelectTarget.selectedIndex]
    const min = selectedOption?.dataset?.min
    const max = selectedOption?.dataset?.max

    if (min && max) {
      const minNum = parseFloat(min)
      const maxNum = parseFloat(max)
      const center = parseFloat(((minNum + maxNum) / 2).toFixed(1))

      // Update the physical limits of the slider
      this.doseSliderTarget.min = min
      this.doseSliderTarget.max = max
      
      // Default to center of basket range
      this.doseSliderTarget.value = center
      this.doseNumberTarget.value = center
      
      // Unlock the inputs
      this.doseSliderTarget.disabled = false
      this.doseNumberTarget.disabled = false
    } else {
      // Lock them if they revert to "Select a Basket"
      this.doseSliderTarget.disabled = true
      this.doseNumberTarget.disabled = true
    }
  }
}