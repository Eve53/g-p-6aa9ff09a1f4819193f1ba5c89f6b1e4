/** 演示配置；当前仓库没有业务端规则或小程序服务接口。上线前须替换。 */
export const businessConfig = {
  source: '演示规则，业务未确认',
  deviceCheckBeforeMinutes: 30,
  roomOpenBeforeMinutes: 15,
  reviewSlaHours: 24,
  notificationChannel: null as string | null,
  roomEndpoint: null as string | null,
  reviewEndpoint: null as string | null,
  roomReady: false,
  contractSign: null as ((orderId: number) => Promise<void>) | null,
}
