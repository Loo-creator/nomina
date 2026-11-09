import { describe, it, expect } from 'vitest'
import {
  analyzeLoadFile,
  createBatch,
  getBatch,
  getBatches,
  retryBatchErrors,
} from '@/services/batches.service'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

describe('mock payrollBatches', () => {
  it('rejects unsupported formats and oversized files', async () => {
    const badExt = await analyzeLoadFile({ tenantId: 1, fileName: 'virus.exe', fileSize: 1000 })
    expect(badExt.ok).toBe(false)
    expect(badExt.error).toBe('INVALID_FORMAT')

    const big = await analyzeLoadFile({ tenantId: 1, fileName: 'grande.xlsx', fileSize: 20 * 1024 * 1024 })
    expect(big.ok).toBe(false)
    expect(big.error).toBe('FILE_TOO_LARGE')

    const empty = await analyzeLoadFile({ tenantId: 1, fileName: 'vacio.csv', fileSize: 0 })
    expect(empty.ok).toBe(false)
    expect(empty.error).toBe('EMPTY_FILE')
  })

  it('analyzes a valid multi-RFC file against the account', async () => {
    const res = await analyzeLoadFile({ tenantId: 1, fileName: 'cobertura_test_nomina.xlsx', fileSize: 250_000 })
    expect(res.ok).toBe(true)
    expect(res.data.totalRecords).toBeGreaterThan(0)
    expect(res.data.rfcs.some(r => r.known)).toBe(true)
    expect(res.data.rfcs.some(r => !r.known)).toBe(true)
    expect(res.data.canProcess).toBe(true)
    expect(res.data.issues.length).toBeGreaterThan(0)
  })

  it('refuses to process when the account is suspended', async () => {
    const created = await createBatch({ tenantId: 3, fileName: 'suspended.xlsx', fileSize: 100_000, createdBy: 'Test' })
    expect(created.ok).toBe(false)
    expect(created.error).toBe('TENANT_SUSPENDED')
  })

  it('creates a batch, processes it to completion and reports per-record results', async () => {
    const created = await createBatch({ tenantId: 1, fileName: 'cobertura_test_nomina.xlsx', fileSize: 250_000, skipErrors: true, createdBy: 'Test' })
    expect(created.ok).toBe(true)
    expect(created.data.status).toBe('procesando')
    expect(created.data.totalRecords).toBeGreaterThan(0)

    let batch = created.data
    for (let i = 0; i < 60 && batch.status === 'procesando'; i++) {
      await sleep(250)
      const poll = await getBatch(batch.id)
      expect(poll.ok).toBe(true)
      batch = poll.data
    }

    expect(['completada', 'completada_con_errores']).toContain(batch.status)
    expect(batch.processedCount).toBe(batch.totalRecords)
    expect(batch.successCount + batch.errorCount).toBe(batch.totalRecords)
    expect(batch.rfcs.length).toBeGreaterThan(0)
    expect(batch.rfcs.every(r => r.total > 0)).toBe(true)
  }, 30_000)

  it('retryBatchErrors reprocesses only retryable capture errors', async () => {
    const list = await getBatches(1)
    const target = list.data.find(b => b.fileName === 'cobertura_test_nomina.xlsx')
    expect(target).toBeTruthy()

    const detail = await getBatch(target.id)
    const retryable = detail.data.records.filter(r => r.status === 'error' && r.retryable).length

    const res = await retryBatchErrors(target.id)
    if (retryable === 0) {
      expect(res.ok).toBe(false)
      expect(res.error).toBe('NOTHING_RETRYABLE')
    } else {
      expect(res.ok).toBe(true)
      const after = await getBatch(target.id)
      const stillRetryable = after.data.records.filter(r => r.status === 'error' && r.retryable).length
      expect(stillRetryable).toBe(0)
    }
  }, 15_000)

  it('lists batches for the account, newest first', async () => {
    const res = await getBatches(1)
    expect(res.ok).toBe(true)
    expect(res.data.length).toBeGreaterThan(0)
    for (let i = 1; i < res.data.length; i++) {
      expect(new Date(res.data[i - 1].startedAt) >= new Date(res.data[i].startedAt)).toBe(true)
    }
  })
})
