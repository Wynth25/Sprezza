import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "doseSlider", "doseNumber", "basketSelect" ]

  updateNumber() {
    this.doseNumberTarget.value = this.doseSliderTarget.value
  }

  updateSlider() {
    this.doseSliderTarget.value = this.doseNumberTarget.value
  }

  updateBounds() {
    const selectedOption = this.basketSelectTarget.options[this.basketSelectTarget.selectedIndex]
    const min = selectedOption.dataset.min
    const max = selectedOption.dataset.max

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