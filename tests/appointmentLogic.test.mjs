import test from 'node:test'
import assert from 'node:assert/strict'
import { consultationTimeLabel, contractActionLabel, signContractAndUpdate } from '../src/appointmentLogic.ts'

test('consultation time uses the supplied slot and has an explicit empty state', () => {
  assert.equal(consultationTimeLabel('01-30 15:30–16:10'), '01-30 15:30–16:10')
  assert.equal(consultationTimeLabel(undefined), '咨询时间待确定')
  assert.equal(consultationTimeLabel('  '), '咨询时间待确定')
})

test('contract entry follows the confirmed contract status', () => {
  assert.equal(contractActionLabel('unsigned'), '合同签署')
  assert.equal(contractActionLabel('signed'), '查看合同')
})

test('successful signing marks only the confirmed order as signed', async () => {
  const signed = []
  await signContractAndUpdate(2, async id => assert.equal(id, 2), id => signed.push(id))
  assert.deepEqual(signed, [2])
})

test('failed signing preserves the unsigned state for retry', async () => {
  const signed = []
  await assert.rejects(signContractAndUpdate(2, async () => { throw new Error('网络中断') }, id => signed.push(id)), /网络中断/)
  assert.deepEqual(signed, [])
})
