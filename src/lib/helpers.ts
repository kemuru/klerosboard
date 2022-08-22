import fromUnixTime from 'date-fns/fromUnixTime'
import format from 'date-fns/format'
import { intervalToDuration } from 'date-fns'
import formatDuration from 'date-fns/formatDuration'
import compareAsc from 'date-fns/compareAsc'
import { es, enGB } from 'date-fns/locale';
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { DecimalBigNumber } from "./DecimalBigNumber";

import { I18nContextProps } from "./types";

const dateLocales = {
  es,
  en: enGB
}

const chains = {
  mainnet: '1',
  gnosis: '100'
}

export function getChainId(searchParams: URLSearchParams): string {
  const chain = searchParams.get('chainId')
  if (chain === '100') return '100'
  return '1'
}

export function formatDate(timestamp: number) {
  const date = fromUnixTime(timestamp);
  return format(date, 'MMMM d yyyy, HH:mm')
}

export function getTimeLeft(endDate: Date | string | number, withSeconds = false, locale: I18nContextProps['locale']): string | false {
  const startDate = new Date()

  if (typeof endDate === 'number' || typeof endDate === 'string') {
    endDate = fromUnixTime(Number(endDate))
  }

  if (compareAsc(startDate, endDate) === 1) {
    return false;
  }

  const duration = intervalToDuration({ start: startDate, end: endDate })

  const format = ['years', 'months', 'weeks', 'days', 'hours']

  if (withSeconds) {
    format.push('minutes', 'seconds');
  } else if (Number(duration.days) < 1) {
    format.push('minutes');
  }

  return formatDuration(duration, { format, locale: dateLocales[locale] });
}

export function getCurrency(chainId: string): string {
  if (chainId === '100') return 'xDAI';
  return 'ETH'
}

export function formatAmount(amount: BigNumberish, chainId: string = '1') {
  const number = new DecimalBigNumber(BigNumber.from(amount), 18)
  return `${number.toString()} ` + getCurrency(chainId)
}

export function showWalletError(error: any) {
  if (error?.message) {
    if (error?.message.startsWith('{')) {
      try {
        const _error = JSON.parse(error?.message);

        return _error?.message;
      } catch (e: any) {

      }
    } else {
      return error?.message;
    }
  }
}
