import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "minSlider", "maxSlider", "minInput", "maxInput", "highlight", "trackWrap", "rangeBadge", "submitBtn" ]
  static values = {
    minLimit: { type: Number, default: 5 },
    maxLimit: { type: Number, default: 25 },
    step: { type: Number, default: 0.1 }
  }

  connect() {
    this.updateFromInputs()
    this.updateSubmitState()
  }

  validateForm(event) {
    if (this.isInvalid()) {
      event.preventDefault()
      event.stopImmediatePropagation()
      return false
    }
  }

  isInvalid() {
    const minStr = this.minInputTarget?.value?.trim() || ""
    const maxStr = this.maxInputTarget?.value?.trim() || ""

    if (!minStr || !maxStr) return true

    const minVal = parseFloat(minStr)
    const maxVal = parseFloat(maxStr)

    if (isNaN(minVal) || isNaN(maxVal)) return true
    if (minVal <= 0 || maxVal <= 0) return true
    if (minVal > maxVal) return true

    return false
  }

  updateSubmitState() {
    if (!this.hasSubmitBtnTarget) return
    const invalid = this.isInvalid()
    this.submitBtnTarget.disabled = invalid
    this.submitBtnTarget.style.opacity = invalid ? "0.45" : "1"
    this.submitBtnTarget.style.cursor = invalid ? "not-allowed" : "pointer"
  }

  // Called when min slider is dragged
  onMinSliderChange() {
    let minVal = parseFloat(this.minSliderTarget.value)
    let maxVal = parseFloat(this.maxSliderTarget.value)

    if (minVal > maxVal) {
      this.maxSliderTarget.value = minVal
      this.maxInputTarget.value = minVal.toFixed(1)
      maxVal = minVal
    }

    this.minInputTarget.value = minVal.toFixed(1)
    this.bringToFront({ target: this.minSliderTarget })
    this.updateHighlight()
    this.updateBadge()
    this.updateSubmitState()
  }

  // Called when max slider is dragged
  onMaxSliderChange() {
    let minVal = parseFloat(this.minSliderTarget.value)
    let maxVal = parseFloat(this.maxSliderTarget.value)

    if (maxVal < minVal) {
      this.minSliderTarget.value = maxVal
      this.minInputTarget.value = maxVal.toFixed(1)
      minVal = maxVal
    }

    this.maxInputTarget.value = maxVal.toFixed(1)
    this.bringToFront({ target: this.maxSliderTarget })
    this.updateHighlight()
    this.updateBadge()
    this.updateSubmitState()
  }

  // Called when user types into min number input
  onMinInputChange() {
    const rawMin = parseFloat(this.minInputTarget.value)
    const rawMax = parseFloat(this.maxInputTarget.value)

    if (!isNaN(rawMin) && !isNaN(rawMax)) {
      if (rawMin > rawMax) {
        this.maxInputTarget.value = this.minInputTarget.value
      }
    }

    this.updateFromInputs()
  }

  onMinInputCommit() {
    const rawMin = parseFloat(this.minInputTarget.value)
    const rawMax = parseFloat(this.maxInputTarget.value)

    if (!isNaN(rawMin) && !isNaN(rawMax)) {
      if (rawMin > rawMax) {
        this.maxInputTarget.value = this.minInputTarget.value
      }
    }

    this.updateFromInputs()
  }

  // Called when user types into max number input
  onMaxInputChange() {
    const valStr = this.maxInputTarget.value.trim()
    const rawMin = parseFloat(this.minInputTarget.value)
    const rawMax = parseFloat(valStr)

    // If input is a completed value (2+ digits or has decimal) and lower than min:
    if (!isNaN(rawMin) && !isNaN(rawMax) && (valStr.length >= 2 || valStr.includes("."))) {
      if (rawMax < rawMin) {
        this.minInputTarget.value = this.maxInputTarget.value
      }
    }

    this.updateFromInputs()
  }

  onMaxInputCommit() {
    const rawMin = parseFloat(this.minInputTarget.value)
    const rawMax = parseFloat(this.maxInputTarget.value)

    if (!isNaN(rawMin) && !isNaN(rawMax)) {
      if (rawMax < rawMin) {
        this.minInputTarget.value = this.maxInputTarget.value
      }
    }

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
    this.updateSubmitState()
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
    const rect = this.trackWrapTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, clickX / rect.width))
    const clickVal = parseFloat((this.minLimitValue + ratio * (this.maxLimitValue - this.minLimitValue)).toFixed(1))

    const curMin = parseFloat(this.minSliderTarget.value)
    const curMax = parseFloat(this.maxSliderTarget.value)

    let chosen = null

    if (clickVal > curMax) {
      // To the right of both: register as right move
      chosen = "max"
    } else if (clickVal < curMin) {
      // To the left of both: register as left move
      chosen = "min"
    } else {
      // Clicked between both (or tie): use the closer one (or left when tie)
      const distToMin = clickVal - curMin
      const distToMax = curMax - clickVal
      if (distToMin <= distToMax) {
        chosen = "min"
      } else {
        chosen = "max"
      }
    }

    this.activeSlider = chosen

    if (chosen === "min") {
      const newMin = Math.min(clickVal, curMax)
      this.minSliderTarget.value = newMin
      this.minInputTarget.value = newMin.toFixed(1)
      this.bringToFront({ target: this.minSliderTarget })
    } else {
      const newMax = Math.max(clickVal, curMin)
      this.maxSliderTarget.value = newMax
      this.maxInputTarget.value = newMax.toFixed(1)
      this.bringToFront({ target: this.maxSliderTarget })
    }

    this.updateHighlight()
    this.updateBadge()
    this.updateSubmitState()

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
      if (val > maxVal) {
        // Dragged past max: smoothly switch active drag to max slider
        this.minSliderTarget.value = maxVal
        this.minInputTarget.value = maxVal.toFixed(1)
        this.activeSlider = "max"
        this.bringToFront({ target: this.maxSliderTarget })
        const clamped = Math.min(this.maxLimitValue, val)
        this.maxSliderTarget.value = clamped
        this.maxInputTarget.value = clamped.toFixed(1)
      } else {
        const clamped = Math.max(this.minLimitValue, val)
        this.minSliderTarget.value = clamped
        this.minInputTarget.value = clamped.toFixed(1)
      }
    } else if (this.activeSlider === "max") {
      const minVal = parseFloat(this.minSliderTarget.value)
      if (val < minVal) {
        // Dragged past min: smoothly switch active drag to min slider
        this.maxSliderTarget.value = minVal
        this.maxInputTarget.value = minVal.toFixed(1)
        this.activeSlider = "min"
        this.bringToFront({ target: this.minSliderTarget })
        const clamped = Math.max(this.minLimitValue, val)
        this.minSliderTarget.value = clamped
        this.minInputTarget.value = clamped.toFixed(1)
      } else {
        const clamped = Math.min(this.maxLimitValue, val)
        this.maxSliderTarget.value = clamped
        this.maxInputTarget.value = clamped.toFixed(1)
      }
    }

    this.updateHighlight()
    this.updateBadge()
    this.updateSubmitState()
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
