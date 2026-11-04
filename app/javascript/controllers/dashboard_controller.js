import { Controller } from "@hotwired/stimulus"
import Sortable from "sortablejs"

export default class extends Controller {
  static targets = [ "beanList", "basketList", "recipeGrid", "dropdownMenu", "contextActions", "backdrop", "menuToggle" ]

  connect() {
    document.body.classList.remove("mode-sort", "mode-delete", "is-dragging")

    // 1. Bean sorting (Recipes & Beans pages)
    if (this.hasBeanListTarget) {
      this.beanSortable = Sortable.create(this.beanListTarget, {
        handle: ".drag-handle",
        animation: 150,
        disabled: true,
        ghostClass: "sortable-ghost",
        dragClass: "sortable-drag",
        onStart: () => document.body.classList.add("is-dragging"),
        onEnd: () => document.body.classList.remove("is-dragging")
      })
    }

    // 2. Basket sorting (Baskets page)
    if (this.hasBasketListTarget) {
      this.basketSortable = Sortable.create(this.basketListTarget, {
        handle: ".drag-handle",
        animation: 150,
        disabled: true,
        ghostClass: "sortable-ghost",
        dragClass: "sortable-drag",
        onStart: () => document.body.classList.add("is-dragging"),
        onEnd: () => document.body.classList.remove("is-dragging")
      })
    }

    // 3. Recipe sorting per bean (Recipes page)
    this.recipeSortables = this.recipeGridTargets.map(grid => {
      return Sortable.create(grid, {
        handle: ".recipe-sort-overlay",
        animation: 150,
        disabled: true,
        ghostClass: "sortable-ghost",
        dragClass: "sortable-drag",
        onStart: () => document.body.classList.add("is-dragging"),
        onEnd: () => document.body.classList.remove("is-dragging")
      })
    })

    this.initialBeanOrder = []
    this.initialBasketOrder = []
    this.initialRecipeOrders = new Map()

    // 4. Highlight and scroll to targeted bean
    if (window.location.hash) {
      const targetBean = document.querySelector(window.location.hash)
      if (targetBean && targetBean.classList.contains("bean-card")) {
        targetBean.scrollIntoView({ behavior: "smooth", block: "center" })
        void targetBean.offsetWidth
        targetBean.classList.add("highlight-target")
      }
    }
  }

  disconnect() {
    document.body.classList.remove("mode-sort", "mode-delete", "is-dragging")
    if (this.beanSortable) this.beanSortable.destroy()
    if (this.basketSortable) this.basketSortable.destroy()
    if (this.recipeSortables) this.recipeSortables.forEach(s => s.destroy())
  }

  enableSortMode() {
    document.body.classList.remove("mode-delete")
    document.body.classList.add("mode-sort")

    if (this.beanSortable) this.beanSortable.option("disabled", false)
    if (this.basketSortable) this.basketSortable.option("disabled", false)
    this.recipeSortables.forEach(s => s.option("disabled", false))

    // Snapshot DOM order for Cancel action
    if (this.hasBeanListTarget) {
      this.initialBeanOrder = Array.from(this.beanListTarget.children)
    }
    if (this.hasBasketListTarget) {
      this.initialBasketOrder = Array.from(this.basketListTarget.children)
    }

    this.initialRecipeOrders.clear()
    this.recipeGridTargets.forEach(grid => {
      this.initialRecipeOrders.set(grid, Array.from(grid.children))
    })

    this.showContextActions()
    this.closeDropdown()
  }

  enableDeleteMode() {
    document.body.classList.remove("mode-sort")
    document.body.classList.add("mode-delete")

    if (this.beanSortable) this.beanSortable.option("disabled", true)
    if (this.basketSortable) this.basketSortable.option("disabled", true)
    this.recipeSortables.forEach(s => s.option("disabled", true))

    this.showContextActions()
    this.closeDropdown()
  }

  cancelMode() {
    if (document.body.classList.contains("mode-sort")) {
      if (this.hasBeanListTarget) {
        this.initialBeanOrder.forEach(el => this.beanListTarget.appendChild(el))
      }
      if (this.hasBasketListTarget) {
        this.initialBasketOrder.forEach(el => this.basketListTarget.appendChild(el))
      }
      this.initialRecipeOrders.forEach((children, grid) => {
        children.forEach(el => grid.appendChild(el))
      })
    }
    this.resetMode()
  }

  doneMode() {
    if (document.body.classList.contains("mode-sort")) {
      if (this.hasBeanListTarget) this.saveBeanSort()
      if (this.hasBasketListTarget) this.saveBasketSort()
      if (this.recipeGridTargets.length > 0) this.saveRecipeSort()
    }
    this.resetMode()
  }

  resetMode() {
    document.body.classList.remove("mode-sort", "mode-delete")
    if (this.beanSortable) this.beanSortable.option("disabled", true)
    if (this.basketSortable) this.basketSortable.option("disabled", true)
    this.recipeSortables.forEach(s => s.option("disabled", true))

    this.hideContextActions()
    this.closeDropdown()
  }

  saveBeanSort() {
    if (!this.hasBeanListTarget) return
    const beanIds = Array.from(this.beanListTarget.children).map(el => el.dataset.id).filter(Boolean)
    if (beanIds.length === 0) return

    const sandbox = this.application.getControllerForElementAndIdentifier(document.body, "sandbox")
    if (sandbox && !sandbox.adminValue) {
      const state = sandbox.getState()
      state.beanOrder = beanIds
      sandbox.saveState(state)
      sandbox.showToast("Bean order saved (Sandbox)!")
      return
    }

    fetch("/beans/sort", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector("[name='csrf-token']")?.content
      },
      body: JSON.stringify({ bean_ids: beanIds })
    })
  }

  saveBasketSort() {
    if (!this.hasBasketListTarget) return
    const basketIds = Array.from(this.basketListTarget.children).map(el => el.dataset.id).filter(Boolean)
    if (basketIds.length === 0) return

    const sandbox = this.application.getControllerForElementAndIdentifier(document.body, "sandbox")
    if (sandbox && !sandbox.adminValue) {
      const state = sandbox.getState()
      state.basketOrder = basketIds
      sandbox.saveState(state)
      sandbox.showToast("Basket order saved (Sandbox)!")
      return
    }

    fetch("/baskets/sort", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector("[name='csrf-token']")?.content
      },
      body: JSON.stringify({ basket_ids: basketIds })
    })
  }

  saveRecipeSort() {
    const sandbox = this.application.getControllerForElementAndIdentifier(document.body, "sandbox")
    if (sandbox && !sandbox.adminValue) {
      const state = sandbox.getState()
      if (!state.recipeOrders) state.recipeOrders = {}
      this.recipeGridTargets.forEach(grid => {
        const beanId = grid.dataset.beanId
        const recipeIds = Array.from(grid.children).map(el => el.dataset.id).filter(Boolean)
        if (beanId && recipeIds.length > 0) {
          state.recipeOrders[beanId] = recipeIds
        }
      })
      sandbox.saveState(state)
      sandbox.showToast("Recipe order saved (Sandbox)!")
      return
    }

    this.recipeGridTargets.forEach(grid => {
      const recipeIds = Array.from(grid.children).map(el => el.dataset.id).filter(Boolean)
      if (recipeIds.length === 0) return

      fetch("/recipes/sort", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector("[name='csrf-token']")?.content
        },
        body: JSON.stringify({ recipe_ids: recipeIds })
      })
    })
  }

  // --- Dropdown Helpers ---

  toggleDropdown() {
    this.dropdownMenuTarget.classList.contains("hidden") ? this.openDropdown() : this.closeDropdown()
  }

  openDropdown() {
    document.querySelectorAll(".freeze-menu").forEach(m => m.classList.add("hidden"))
    this.dropdownMenuTarget.classList.remove("hidden")
    if (this.hasBackdropTarget) this.backdropTarget.classList.remove("hidden")
  }

  closeDropdown() {
    if (this.hasDropdownMenuTarget) this.dropdownMenuTarget.classList.add("hidden")
    if (this.hasBackdropTarget) this.backdropTarget.classList.add("hidden")
    document.querySelectorAll(".freeze-menu").forEach(m => m.classList.add("hidden"))
  }

  // --- Freeze Date Menus ---

  toggleFreezeMenu(event) {
    const menu = event.currentTarget.nextElementSibling
    const isHidden = menu.classList.contains("hidden")

    if (this.hasDropdownMenuTarget) this.dropdownMenuTarget.classList.add("hidden")
    document.querySelectorAll(".freeze-menu").forEach(m => m.classList.add("hidden"))

    if (isHidden) {
      menu.classList.remove("hidden")
      if (this.hasBackdropTarget) this.backdropTarget.classList.remove("hidden")
    } else {
      menu.classList.add("hidden")
      if (this.hasBackdropTarget) this.backdropTarget.classList.add("hidden")
    }
  }

  confirmFreezeChange(event) {
    const form = event.currentTarget
    const isFrozen = form.dataset.frozen === "true"
    const originalDate = form.dataset.original
    const roastDate = form.dataset.roast
    const input = form.querySelector('input[type="date"]')
    const newDate = input.value

    if (newDate !== "" && roastDate && newDate < roastDate) {
      alert("The freeze date cannot be earlier than the roast date.")
      event.preventDefault()
      input.value = originalDate || ""
      return
    }

    if (isFrozen && newDate !== originalDate) {
      const msg = newDate === ""
        ? "Are you sure you want to clear the freeze date?"
        : "Are you sure you want to change the freeze date?"

      if (!window.confirm(msg)) {
        event.preventDefault()
        input.value = originalDate || ""
        return
      }
    }

    const sandbox = this.application.getControllerForElementAndIdentifier(document.body, "sandbox")
    if (sandbox && !sandbox.adminValue) {
      event.preventDefault()
      const beanCard = form.closest(".bean-card")
      const beanId = beanCard?.dataset.id
      if (beanId) {
        const state = sandbox.getState()
        state.beanFreezeDates[beanId] = newDate
        sandbox.saveState(state)

        form.dataset.frozen = (newDate !== "").toString()
        form.dataset.original = newDate
        const menu = form.closest(".freeze-menu")
        if (menu) menu.classList.add("hidden")
        if (this.hasBackdropTarget) this.backdropTarget.classList.add("hidden")
        sandbox.showToast("Date saved")
      }
    }
  }

  // --- UI Action Helpers ---

  showContextActions() {
    if (this.hasContextActionsTarget) {
      this.contextActionsTarget.classList.remove("hidden")
    }
  }

  hideContextActions() {
    if (this.hasContextActionsTarget) {
      this.contextActionsTarget.classList.add("hidden")
    }
  }
}
