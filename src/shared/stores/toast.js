import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  let idCounter = 0

  function generateId() {
    return ++idCounter
  }

  function show(message, type = 'info', options = {}) {
    const id = generateId()
    const toast = {
      id,
      message,
      type,
      duration: options.duration ?? 4000,
      action: options.action || null,
      persistent: options.persistent ?? false,
    }
    toasts.value.push(toast)

    if (!toast.persistent && toast.duration > 0) {
      setTimeout(() => {
        remove(id)
      }, toast.duration)
    }

    return id
  }

  function success(message, options) {
    return show(message, 'success', options)
  }

  function error(message, options) {
    return show(message, 'danger', { ...options, duration: 6000 })
  }

  function warning(message, options) {
    return show(message, 'warning', options)
  }

  function info(message, options) {
    return show(message, 'info', options)
  }

  function remove(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  function clear() {
    toasts.value = []
  }

  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    remove,
    clear,
  }
})