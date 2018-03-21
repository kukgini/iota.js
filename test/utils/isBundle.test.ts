import test from 'ava'
import { asTransactionObject, asTransactionTrytes, isBundle } from '../../lib/utils/'
import {
    bundle,
    bundleWithInvalidBundleHash,
    bundleWithInvalidLastIndex,
    bundleWithInvalidSignature,
    bundleWithInvalidTransactionOrder,
    bundleWithInvalidValueSum,
    bundleWithZeroValue,
} from '../samples/bundle'

test('isBundle() returns true for valid bundle.', t => {
    t.is(
        isBundle(bundle),
        true,
        'isBundle() should return true for valid bundle.'
    )
})

test('isBundlel() returns true for valid zero-value bundle', t => {
    t.is(
        isBundle(bundle),
        true,
        'isBundle() should return true for valid zero-value bundle'
    )
})

test('isBundle() returns false for bundle with invalid lastIndex.', t => {
    t.is(
        isBundle(bundleWithInvalidLastIndex),
        false,
        'isBundle() should return false for last transaction in bundle: currentIndex !== lastIndex.'
    ) 
})

test('isBundle() returns false for bundle with invalid bundle hash.', t => {
    t.is(
        isBundle(bundleWithInvalidBundleHash),
        false,
        'isBundle() should return false for bundle with invalid bundle hash.'
    )
})

test('isBundle() returns false for bundle with invalid signature.', t => {
    t.is(
        isBundle(bundleWithInvalidSignature),
        false,
        'isBundle() should return false for bundle with invalid signature.'
    )
})

test('isBundle() returns false for bundle with invalid transaction order.', t => {
    t.is(
        isBundle(bundleWithInvalidTransactionOrder),
        false,
        'isBundle() should return false for bundle with invalid transaction order.'
    )
})

test('isBundle() returns false for bundle with non-zero value sum.', t => {
    t.is(
        isBundle(bundleWithInvalidValueSum),
        false,
        'isBundle() should return false for bundle with non-zero value sum.'
    )
})
