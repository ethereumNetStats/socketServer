import { basicNetStats, netStats, numberOfAddress } from '../types/types'
import { currentTimeReadable } from '@ethereum_net_stats/readable_time'
import { Socket } from 'socket.io'

class ensureLatestNetStats {
  private basicNetStatsDate: number | undefined
  private basicNetStatsData: basicNetStats | undefined
  private numberOfAddressDate: number | undefined
  private numberOfAddress: numberOfAddress | undefined

  constructor() {
    this.basicNetStatsDate = undefined
    this.basicNetStatsData = undefined
    this.numberOfAddressDate = undefined
    this.numberOfAddress = undefined
  }

  onBasicNetStatsRecorded(
    client: Socket,
    basicNetStats: basicNetStats,
    attribute: string,
    dataPublisherId: string,
  ) {
    console.log(
      `${currentTimeReadable()} | Receive : 'new${attribute}BasicNetStatsRecorded' | From : ${attribute}BasicNetStatsRecorder`,
    )

    this.basicNetStatsData = basicNetStats
    this.basicNetStatsDate = basicNetStats.startTimeUnix

    if (this.basicNetStatsData && this.numberOfAddress) {
      if (this.basicNetStatsDate === this.numberOfAddressDate) {
        let newNetStats: netStats = {
          ...basicNetStats,
          numberOfAddress: this.numberOfAddress.numberOfAddress,
        }
        client.to(dataPublisherId).emit(`new${attribute}NetStats`, newNetStats)
        console.log(
          `${currentTimeReadable()} | Emit : new${attribute}NetStats | To : dataPoolServer | Trigger event : 'new${attribute}BasicNetStatsRecorded'`,
        )
        this.basicNetStatsData = undefined
        this.numberOfAddress = undefined
      }
    }
  }

  onAddressCountRecorded(
    client: Socket,
    numberOfAddress: numberOfAddress,
    attribute: string,
    dataPublisherId: string,
  ) {
    console.log(
      `${currentTimeReadable()} | Receive : 'new${attribute}AddressCountRecorded' | From : ${attribute}AddressCounter`,
    )

    this.numberOfAddress = numberOfAddress
    this.numberOfAddressDate = numberOfAddress.startTimeUnix

    if (this.numberOfAddress && this.basicNetStatsData) {
      if (this.basicNetStatsDate === this.numberOfAddressDate) {
        let newNetStats: netStats = {
          ...this.basicNetStatsData,
          numberOfAddress: numberOfAddress.numberOfAddress,
        }
        client.timeout(5000).to(dataPublisherId).emit(`new${attribute}NetStats`, newNetStats)
        console.log(
          `${currentTimeReadable()} | Emit : 'new${attribute}NetStats' | To : dataPoolServer | Trigger event : 'new${attribute}AddressCountRecorded'`,
        )
        this.basicNetStatsData = undefined
        this.numberOfAddress = undefined
      }
    }
  }
}

export default ensureLatestNetStats
