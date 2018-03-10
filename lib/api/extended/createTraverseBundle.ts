import * as Promise from 'bluebird'
import { asTransactionObject, tailTransactionValidator, validate } from '../../utils'
import { createGetTrytes } from '../core'
import { Bundle, Callback, Provider, Transaction } from '../types'

export const validateTailTransaction = (
    transaction: Transaction,
    bundleHash: string | undefined
): Transaction | never | void => (!bundleHash ? validate(tailTransactionValidator(transaction)) : transaction)

export const createTraverseBundle = (provider: Provider) => {
    const getTrytes = createGetTrytes(provider)

    const traverseToNextTransaction = (
        transaction: Transaction,
        bundleHash: string | undefined,
        bundle: Bundle
    ): Bundle | Promise<Bundle> =>
        bundleHash !== transaction.bundle
            ? bundle
            : transaction.lastIndex === 0 && transaction.currentIndex === 0
              ? [transaction]
              : traverseBundle(transaction.trunkTransaction, transaction.bundle, bundle.concat([transaction]))

    const traverseBundle = (
        trunkTransaction: string,
        bundleHash?: string | undefined,
        bundle: Bundle = [],
        callback?: Callback<Bundle>
    ): Promise<Bundle> =>
        getTrytes([trunkTransaction])
            .then(trytes => asTransactionObject(trytes[0]))
            .then(transaction => {
                validateTailTransaction(transaction, bundleHash)
                return transaction
            })
            .then(transaction => traverseToNextTransaction(transaction, bundleHash, bundle))
            .asCallback(callback)

    return traverseBundle
}