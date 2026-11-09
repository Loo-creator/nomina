import { ref, watch } from 'vue'

export function useDebounce(value, delay = 300) {
  const debounced = ref(value)
  let timeout = null

  watch(value, (newVal) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      debounced.value = newVal
    }, delay)
  })

  return debounced
}