import test from 'ava'
import { createGetInclusionStates } from '../../lib/api/core'
import { INVALID_HASH_ARRAY } from '../../lib/errors'
import { provider } from '../../lib/utils'
import { getInclusionStatesCommand, getInclusionStatesResponse } from '../nocks/getInclusionStates'

const getInclusionStates = createGetInclusionStates(provider())

test('getInclusionStates() resolves to correct inclusion states', async t => {
    t.deepEqual(
        await getInclusionStates(getInclusionStatesCommand.transactions, getInclusionStatesCommand.tips),
        getInclusionStatesResponse.states,
        'getInclusionStates() should resolve to correct inclusion states'    
    )

    const invalidHashes = ['asdasDSFDAFD'] 

    t.is(
        t.throws(() => getInclusionStates(invalidHashes, getInclusionStatesCommand.tips), Error).message,
        `${ INVALID_HASH_ARRAY }: ${ invalidHashes[0] }`,
        'getInclusionStates() throws error for invalid hashes' 
    )

    t.is(
        t.throws(() => getInclusionStates(getInclusionStatesCommand.transactions, invalidHashes), Error).message,
        `${ INVALID_HASH_ARRAY }: ${ invalidHashes[0] }`,
        'getInclusionStates() throws error for invalid tips' 
    )
})

test.cb('getInclusionStates() invokes callback', t => {
    getInclusionStates(getInclusionStatesCommand.transactions, getInclusionStatesCommand.tips, t.end)
})

test.cb('getInclusionStates() passes correct arguments to callback', t => {
    getInclusionStates(getInclusionStatesCommand.transactions, getInclusionStatesCommand.tips, (err, res) => {
        t.is(
            err,
            null,
            'getInclusionStates() should pass null as first argument in callback for successuful requests'
        )
      
        t.deepEqual(
            res,
            getInclusionStatesResponse.states,
            'getInclusionStates() should pass the correct response as second argument in callback'
        )
      
        t.end()  
    })
})
