export function delay(min = 200, max = 800) {
  const ms = Math.random() * (max - min) + min
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function ok(data, meta = {}, message = '') {
  return { ok: true, data, meta, message }
}

export function error(message, errorCode = 'ERROR') {
  return { ok: false, error: errorCode, message }
}

export function paginate(array, page = 1, pageSize = 10) {
  const start = (page - 1) * pageSize
  return {
    data: array.slice(start, start + pageSize),
    meta: {
      total: array.length,
      page,
      pageSize,
      totalPages: Math.ceil(array.length / pageSize),
    },
  }
}