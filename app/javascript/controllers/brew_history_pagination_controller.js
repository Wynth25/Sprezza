import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["item", "showMoreBtn", "collapseBtn", "paginationContainer"]
  static values = {
    pageSize: { type: Number, default: 5 },
    visibleCount: { type: Number, default: 5 }
  }

  connect() {
    this.visibleCountValue = this.pageSizeValue
    this.updateVisibility()
  }

  showMore(event) {
    if (event) event.preventDefault()
    this.visibleCountValue += this.pageSizeValue
    this.updateVisibility()
  }

  collapse(event) {
    if (event) event.preventDefault()
    this.visibleCountValue = this.pageSizeValue
    this.updateVisibility()
  }

  updateVisibility() {
    const total = this.itemTargets.length

    this.itemTargets.forEach((item, index) => {
      if (index < this.visibleCountValue) {
        item.classList.remove("hidden")
      } else {
        item.classList.add("hidden")
      }
    })

    // Show more button is visible if there are more items beyond visibleCountValue
    const hasMore = this.visibleCountValue < total
    if (this.hasShowMoreBtnTarget) {
      if (hasMore) {
        this.showMoreBtnTarget.classList.remove("hidden")
      } else {
        this.showMoreBtnTarget.classList.add("hidden")
      }
    }

    // Collapse button is visible when expanded at least once (visibleCountValue > pageSizeValue)
    const isExpanded = this.visibleCountValue > this.pageSizeValue
    if (this.hasCollapseBtnTarget) {
      if (isExpanded) {
        this.collapseBtnTarget.classList.remove("hidden")
      } else {
        this.collapseBtnTarget.classList.add("hidden")
      }
    }

    // If total items <= pageSizeValue, hide the entire pagination controls container
    if (this.hasPaginationContainerTarget) {
      if (total <= this.pageSizeValue) {
        this.paginationContainerTarget.classList.add("hidden")
      } else {
        this.paginationContainerTarget.classList.remove("hidden")
      }
    }
  }
}
