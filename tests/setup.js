import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/vue'

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})
