import test from 'ava'
import {
    checkSufficientBalance,
    createGetInputs,
    createInputsObject,
    inputsToAddressOptions
} from '../../lib/api/extended'
import { Inputs } from '../../lib/api/types'
import { INSUFFICIENT_BALANCE, INVALID_SEED, INVALID_START_END_OPTIONS } from '../../lib/errors'
import { provider } from '../../lib/utils'
import { getBalancesCommand, getBalancesResponse } from '../nocks/getBalances'

import '../nocks/findTransactions'
import '../nocks/wereAddressesSpentFrom'

const getInputs = createGetInputs(provider())
const seed = 'SEED' 

const inputs: Inputs = {
    inputs: [
        {
            address: getBalancesCommand.addresses[0],
            balance: getBalancesResponse.balances[0],
            keyIndex: 0,
            security: 2
        }, {
            address: getBalancesCommand.addresses[1],
            balance: getBalancesResponse.balances[1],
            keyIndex: 1,
            security: 2
        }
    ],
    totalBalance: parseInt(getBalancesResponse.balances[0], 10) + parseInt(getBalancesResponse.balances[1], 10)
}

const allInputs: Inputs = {
    inputs: [...inputs.inputs].concat({
        address: getBalancesCommand.addresses[2],
        balance: getBalancesResponse.balances[2],
        keyIndex: 2,
        security: 2
    }),
    totalBalance: inputs.totalBalance + parseInt(getBalancesResponse.balances[2], 10)
} 

test('inputsToAddressOptions() translates getInputs() options to compatible getNewAddress() options', t => {
    t.deepEqual(
        inputsToAddressOptions({
            start: 3,
            end: 9,
            security: 2,
            threshold: 100
        }),
        {
            index: 3,
            total: 7,
            security: 2,
            returnAll: true,
            checksum: false
        },
        'inputsToAddressOptions() should translate getInputs() options with `end`, to getNewAddress() compatible options'
    )

    t.deepEqual(
        inputsToAddressOptions({
            start: 3,
            end: undefined,
            security: 2,
            threshold: 100
        }),
        {
            index: 3,
            total: 0,
            security: 2,
            returnAll: true,
            checksum: false
        },
        'inputsToAddressOptions() should translate getInputs() options without `end`, to getNewAddress() compatible options'
    )
})

test('createInputsObject() aggregates addresses and balances', t => { 
    t.deepEqual(
        createInputsObject(getBalancesCommand.addresses, getBalancesResponse.balances, 0, 2),
        allInputs,
        'createInputsObject() should aggregate addresses and balances correctly'
    )
})

test('checkSufficientBalance() throws error for insufficient balance', t => {
    t.is(
        t.throws(() => checkSufficientBalance(inputs, 110), Error).message,
        `${ INSUFFICIENT_BALANCE }`,
        'checkSufficientBalance() should throw error for insufficient balance'
    )
})

test('getInputs() resolves to correct inputs', async t => { 
    t.deepEqual(
        await getInputs(seed, { start: 0, threshold: 100 }),
        inputs,
        'getInputs() should resolve to correct balances'    
    )
})

test('getInputs() rejects with correct errors for invalid input', t => {
    const invalidSeed = 'asdasDSFDAFD'
    const invalidStartEndOptions = {
        start: 10,
        end: 9
    }

    t.is(
        t.throws(() => getInputs(invalidSeed), Error).message,
        `${ INVALID_SEED }: ${ invalidSeed }`,
        'getInputs() should throw correct error for invalid seed' 
    )

    t.is(
        t.throws(() => getInputs(seed, invalidStartEndOptions), Error).message,
        `${ INVALID_START_END_OPTIONS }: ${ invalidStartEndOptions }`,
        'getInputs() should throw correct error for invalid start & end options'
    )
})

/*
test('getInputs() with threshold rejects with correct error if balance is insufficient', t => {
    t.is(
        t.throws(() => getInputs(seed, { start: 0, threshold: 110 }), Error).message,
        `${ INSUFFICIENT_BALANCE }: 110`,
        'getInputs() with threshold should reject with correct error if balance is insufficient'
    )
}) */

test.cb('getInputs() invokes callback', t => {
    getInputs(seed, { start: 0 }, t.end)
})

test.cb('getInputs() passes correct arguments to callback', t => {
    getInputs(seed, { start: 0, threshold: 100 }, (err, res) => {
        t.is(
            err,
            null,
            'getInputs() should pass null as first argument in callback for successuful requests'
        )
      
        t.deepEqual(
            res,
            inputs,
            'getInputs() should pass the correct response as second argument in callback'
        )
      
        t.end()  
    })
})
