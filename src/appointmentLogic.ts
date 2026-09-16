export type ContractStatus = 'unsigned' | 'signed'

export function consultationTimeLabel(requestedSlot?: string | null) {
  return requestedSlot?.trim() || '咨询时间待确定'
}

export function contractActionLabel(status: ContractStatus) {
  return status === 'signed' ? '查看合同' : '合同签署'
}

export async function signContractAndUpdate(
  orderId: number,
  sign: (orderId: number) => Promise<void>,
  markSigned: (orderId: number) => void,
) {
  await sign(orderId)
  markSigned(orderId)
}
