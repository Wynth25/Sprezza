import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "minSlider", "maxSlider", "minInput", "maxInput", "highlight", "trackWrap", "rangeBadge" ]
  static values = {
    minLimit: { type: Number, default: 5 },
    maxLimit: { type: Number, default: 25 },
    step: { type: Number, default: 0.1 }
  }

  connect() {
    this.updateFromInputs()
  }

  // Called when min slider is dragged
  onMinSliderChange() {
    let minVal = parseFloat(this.minSliderTarget.value)
    let maxVal = parseFloat(this.maxSliderTarget.value)

    if (minVal > maxVal) {
      minVal = maxVal
      this.minSliderTarget.value = minVal
    }

    this.minInputTarget.value = minVal.toFixed(1)
    this.updateHighlight()
    this.updateBadge()
  }

  // Called when max slider is dragged
  onMaxSliderChange() {
    let minVal = parseFloat(this.minSliderTarget.value)
    let maxVal = parseFloat(this.maxSliderTarget.value)

    if (maxVal < minVal) {
      maxVal = minVal
      this.maxSliderTarget.value = maxVal
    }

    this.maxInputTarget.value = maxVal.toFixed(1)
    this.updateHighlight()
    this.updateBadge()
  }

  // Called when user types into min or max number input
  onInputChange(event) {
    this.updateFromInputs()
  }

  updateFromInputs() {
    const rawMin = parseFloat(this.minInputTarget.value)
    const rawMax = parseFloat(this.maxInputTarget.value)

    if (!isNaN(rawMin) && this.hasMinSliderTarget) {
      // Clamp slider visually within bounds [minLimit, maxLimit]
      const clampedMin = Math.max(this.minLimitValue, Math.min(this.maxLimitValue, rawMin))
      this.minSliderTarget.value = clampedMin
    }

    if (!isNaN(rawMax) && this.hasMaxSliderTarget) {
      // Clamp slider visually within bounds [minLimit, maxLimit]
      const clampedMax = Math.max(this.minLimitValue, Math.min(this.maxLimitValue, rawMax))
      this.maxSliderTarget.value = clampedMax
    }

    this.updateHighlight()
    this.updateBadge()
  }

  bringToFront(event) {
    const target = event.currentTarget || event.target
    if (target === this.minSliderTarget) {
      this.minSliderTarget.style.zIndex = "4"
      this.maxSliderTarget.style.zIndex = "2"
    } else if (target === this.maxSliderTarget) {
      this.maxSliderTarget.style.zIndex = "4"
      this.minSliderTarget.style.zIndex = "2"
    }
  }

  onTrackPointerDown(event) {
    if (event.target === this.minSliderTarget || event.target === this.maxSliderTarget) {
      this.bringToFront(event)
      return
    }

    const rect = this.trackWrapTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, clickX / rect.width))
    const clickVal = parseFloat((this.minLimitValue + ratio * (this.maxLimitValue - this.minLimitValue)).toFixed(1))

    const curMin = parseFloat(this.minSliderTarget.value)
    const curMax = parseFloat(this.maxSliderTarget.value)

    if (Math.abs(clickVal - curMin) <= Math.abs(clickVal - curMax)) {
      const newMin = Math.min(clickVal, curMax)
      this.minSliderTarget.value = newMin
      this.minInputTarget.value = newMin.toFixed(1)
      this.bringToFront({ target: this.minSliderTarget })
      this.activeSlider = "min"
    } else {
      const newMax = Math.max(clickVal, curMin)
      this.maxSliderTarget.value = newMax
      this.maxInputTarget.value = newMax.toFixed(1)
      this.bringToFront({ target: this.maxSliderTarget })
      this.activeSlider = "max"
    }

    this.updateHighlight()
    this.updateBadge()

    if (this.trackWrapTarget.setPointerCapture) {
      try {
        this.trackWrapTarget.setPointerCapture(event.pointerId)
      } catch (e) {}
    }
  }

  onTrackPointerMove(event) {
    if (!this.activeSlider) return

    const rect = this.trackWrapTarget.getBoundingClientRect()
    const moveX = event.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, moveX / rect.width))
    const rawVal = this.minLimitValue + ratio * (this.maxLimitValue - this.minLimitValue)
    const val = parseFloat(rawVal.toFixed(1))

    if (this.activeSlider === "min") {
      const maxVal = parseFloat(this.maxSliderTarget.value)
      const clamped = Math.max(this.minLimitValue, Math.min(maxVal, val))
      this.minSliderTarget.value = clamped
      this.minInputTarget.value = clamped.toFixed(1)
    } else if (this.activeSlider === "max") {
      const minVal = parseFloat(this.minSliderTarget.value)
      const clamped = Math.max(minVal, Math.min(this.maxLimitValue, val))
      this.maxSliderTarget.value = clamped
      this.maxInputTarget.value = clamped.toFixed(1)
    }

    this.updateHighlight()
    this.updateBadge()
  }

  onTrackPointerUp(event) {
    this.activeSlider = null
    if (this.trackWrapTarget.releasePointerCapture && event.pointerId) {
      try {
        this.trackWrapTarget.releasePointerCapture(event.pointerId)
      } catch (e) {}
    }
  }

  updateHighlight() {
    if (!this.hasHighlightTarget || !this.hasMinSliderTarget || !this.hasMaxSliderTarget) return

    const minVal = parseFloat(this.minSliderTarget.value) || this.minLimitValue
    const maxVal = parseFloat(this.maxSliderTarget.value) || this.maxLimitValue
    const range = this.maxLimitValue - this.minLimitValue

    let minRatio = Math.max(0, Math.min(1, (minVal - this.minLimitValue) / range))
    let maxRatio = Math.max(0, Math.min(1, (maxVal - this.minLimitValue) / range))

    if (minRatio > maxRatio) {
      const tmp = minRatio
      minRatio = maxRatio
      maxRatio = tmp
    }

    // 24px thumb width means thumb center is at 12px from edge
    this.highlightTarget.style.left = `calc(12px + (100% - 24px) * ${minRatio})`
    this.highlightTarget.style.right = `calc(12px + (100% - 24px) * ${1 - maxRatio})`
  }

  updateBadge() {
    if (!this.hasRangeBadgeTarget) return
    const min = this.minInputTarget?.value?.trim() || "-"
    const max = this.maxInputTarget?.value?.trim() || "-"
    this.rangeBadgeTarget.textContent = `${min}g – ${max}g`
  }
}
