import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compactMoney, dateFr, money, pctLabel, periodLabel } from './format.ts';

const norm = (s: string): string => s.replace(/\s/g, ' ');

test('money : séparateur de milliers et devise', () => {
  assert.equal(norm(money(2450000)), '2 450 000 FCFA');
  assert.equal(norm(money(undefined)), '0 FCFA');
});
test('compactMoney : k et M', () => {
  assert.equal(norm(compactMoney(2450000)), '2,45 M FCFA');
  assert.equal(norm(compactMoney(85000)), '85 k FCFA');
  assert.equal(norm(compactMoney(5000)), '5 000 FCFA');
});
test('pctLabel : signe plus pour les hausses', () => {
  assert.equal(norm(pctLabel(6.24)), '+6,2 %');
  assert.equal(norm(pctLabel(-8)), '-8 %');
});
test('periodLabel et dateFr : valeurs absentes ou invalides', () => {
  assert.equal(periodLabel('2026-03'), 'mars 2026');
  assert.equal(periodLabel(null), '—');
  assert.equal(dateFr('pas une date'), '—');
});
