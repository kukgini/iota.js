import * as Promise from 'bluebird'
import * as errors from '../../errors'
import {
    asArray,
    getOptionsWithDefaults,
    securityLevelValidator,
    seedValidator,
    startEndOptionsValidator,
    startOptionValidator,
    thresholdValidator,
    validate,
} from '../../utils'
import { createGetBalances } from '../core'
import { Address, Balance, Callback, Hash, Inputs, makeAddress, Provider } from '../types'
import { createGetNewAddress, getNewAddressOptions, GetNewAddressOptions } from './createGetNewAddress'

export interface GetInputsOptions {
    start: number
    end: number
    threshold: number
    security: number
}

const defaults: GetInputsOptions = {
    start: 0,
    end: 0,
    threshold: 0,
    security: 2,
}

export const inputsToAddressOptions = ({ start, end, security }: GetInputsOptions) =>
    Number.isInteger(end)
        ? getNewAddressOptions({ index: start, total: end - start, security })
        : getNewAddressOptions({ index: start, security, returnAll: true })

export const validateGetInputs = (seed: string, options: GetInputsOptions) => {
    const { start, end, threshold, security } = options
}

export const makeInputsObject = (addresses: Hash[], balances: string[], start: number, security: number): Inputs => {
    const inputs = addresses.map((address, i) => makeAddress(address, balances[i], start + i, security))
    const totalBalance = inputs.reduce((acc, addr) => (acc += parseInt(addr.balance, 10)), 0)

    return { inputs, totalBalance }
}

export const checkSufficientBalance = ({ totalBalance }: Inputs, threshold: number) => {
    if (totalBalance < threshold) {
        throw new Error(errors.INSUFFICIENT_BALANCE)
    }
}

export const getInputsOptions = getOptionsWithDefaults(defaults)

export const createGetInputs = (provider: Provider) => {
    const getNewAddress = createGetNewAddress(provider)
    const getBalances = createGetBalances(provider)

    return (
        seed: string,
        options: Partial<GetInputsOptions> = {},
        callback?: Callback<Inputs>
    ): Promise<Inputs> => {
        const { security, start, end, threshold } = getInputsOptions(options)

        return Promise.resolve(
            validate(
                seedValidator(seed),
                securityLevelValidator(security),
                startOptionValidator(start),
                startEndOptionsValidator({ start, end }),
                thresholdValidator(threshold)
            )
        )
            .then(() => inputsToAddressOptions({ start, end, security, threshold }))
            .then(newAddressOptions => getNewAddress(seed, newAddressOptions))
            .then(allAddresses => asArray(allAddresses))
            .then(allAddresses => getBalances(allAddresses, 100)
                .then(res => makeInputsObject(allAddresses, res.balances, start, security))
                .tap(inputs => checkSufficientBalance(inputs, threshold))
            )
    } 
}
