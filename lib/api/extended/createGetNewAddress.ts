import * as Promise from 'bluebird'
import { generateAddress } from '../../crypto'
import * as errors from '../../errors'
import {
    addChecksum,
    asArray,
    getOptionsWithDefaults,
    indexValidator,
    integerValidator,
    securityLevelValidator,
    seedValidator,
    startEndOptionsValidator,
    validate,
} from '../../utils'
import { createFindTransactions, createWereAddressesSpentFrom } from '../core'
import { Callback, Hash, Provider, Trytes } from '../types'

export interface GetNewAddressOptions {
    index: number
    security: number
    checksum: boolean
    total: number
    returnAll: boolean
}

export type GetNewAddressResult = Hash | Hash[]

export const isAddressUsed = (provider: Provider, address: Hash) => {
    const addresses = asArray(address)

    return createWereAddressesSpentFrom(provider)(addresses).then(spent => {
        if (spent[0]) {
            return true
        }

        return createFindTransactions(provider)({ addresses }).then(transactions => transactions.length > 0)
    })
}

export const getUntilFirstUnusedAddress = (
    provider: Provider,
    seed: Trytes,
    index: number,
    security: number,
    returnAll: boolean
) => {
    const addressList: Trytes[] = []

    const iterate = (): Promise<Trytes[]> => {
        const nextAddress = generateAddress(seed, index++, security)

        if (returnAll) {
            addressList.push(nextAddress)
        }

        return isAddressUsed(provider, nextAddress).then(used => {
            if (used) {
                return iterate()
            }

            // It may have already been added
            if (!returnAll) {
                addressList.push(nextAddress)
            }

            return addressList
        })
    }

    return iterate
}

export const generateAddresses = (seed: Trytes, index: number, security: number, total: number) => {
    const addressList: Trytes[] = new Array(total)

    return addressList
        .reduce((p, _) => {
            return p.then(() => {
                addressList.push(generateAddress(seed, index++, security))
            })
        }, Promise.resolve())
        .then(() => addressList)
}

export const validateGetNewAddress = (seed: Trytes, options: GetNewAddressOptions) =>
    validate(
        seedValidator(seed),
        indexValidator(options.index),
        securityLevelValidator(options.security),
        integerValidator(options.total)
    )

export const applyChecksumOption = (checksum: boolean) => (addresses: Trytes[]): Trytes[] =>
    checksum ? addresses.map(a => addChecksum(a)) : addresses

export const applyReturnAllOption = (returnAll: boolean) => (addresses: Trytes[]): Trytes | Trytes[] =>
    returnAll ? addresses : addresses[addresses.length - 1]

export const getNewAddressOptions = getOptionsWithDefaults<GetNewAddressOptions>({
    index: 0,
    security: 2,
    checksum: false,
    total: 0,
    returnAll: false,
})

export const createGetNewAddress = (provider: Provider) => (
    seed: Trytes,
    options: Partial<GetNewAddressOptions> = {},
    callback?: Callback<GetNewAddressResult>
): Promise<Trytes | Trytes[]> => {
    const { index, security, total, returnAll, checksum } = getNewAddressOptions(options)

    validateGetNewAddress(seed, { index, security, total, returnAll, checksum })

    const promise: Promise<Trytes[]> =
        total! > 0
            ? generateAddresses(seed, index, security, total)
            : Promise.try(getUntilFirstUnusedAddress(provider, seed, index, security, returnAll))

    return promise
        .then(applyChecksumOption(checksum!))
        .then(applyReturnAllOption(returnAll!))
        .asCallback(callback)
}
