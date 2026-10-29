// Tests de caractérisation : ils figent le comportement ACTUEL des règles de loyer.
// Lancer : npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { amountPaid, buildSchedule, dueStatus, lateDays, receiptNumber, relanceMessage, remaining } from './rent.ts';
import type { Lease } from '@/types/entities';

const iso = (offsetDays: number): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('dueStatus : payée quand le montant payé couvre le dû', () => {
  assert.equal(dueStatus({ due_date: iso(-30), amount_due: 100000, amount_paid: 100000 }), 'paid');
});
test('dueStatus : une échéance à 0 FCFA n’est jamais payée', () => {
  assert.equal(dueStatus({ due_date: iso(5), amount_due: 0, amount_paid: 0 }), 'pending');
});
test('dueStatus : partielle avant la date limite', () => {
  assert.equal(dueStatus({ due_date: iso(5), amount_due: 100000, amount_paid: 40000 }), 'partial');
});
test('dueStatus : partielle mais dépassée = en retard', () => {
  assert.equal(dueStatus({ due_date: iso(-3), amount_due: 100000, amount_paid: 40000 }), 'late');
});
test('dueStatus : en attente avant la date, en retard après', () => {
  assert.equal(dueStatus({ due_date: iso(2), amount_due: 100000 }), 'pending');
  assert.equal(dueStatus({ due_date: iso(-1), amount_due: 100000 }), 'late');
});
test('dueStatus : le délai de grâce repousse le retard', () => {
  assert.equal(dueStatus({ due_date: iso(-3), amount_due: 100000 }, 5), 'pending');
  assert.equal(dueStatus({ due_date: iso(-3), amount_due: 100000 }, '2'), 'late');
});
test('lateDays : jours de retard après délai de grâce, jamais négatif', () => {
  assert.equal(lateDays({ due_date: iso(-10) }), 10);
  assert.equal(lateDays({ due_date: iso(-10) }, 4), 6);
  assert.equal(lateDays({ due_date: iso(3) }), 0);
});
test('remaining / amountPaid : tolèrent les valeurs absentes', () => {
  assert.equal(remaining({ amount_due: 100000, amount_paid: 30000 }), 70000);
  assert.equal(remaining({ amount_due: 100000, amount_paid: 150000 }), 0);
  assert.equal(amountPaid(null), 0);
});

const lease = (over: Partial<Lease>): Lease =>
  ({
    id: 'L1', tenant_id: 'T1', tenant_name: 'Kofi', unit_id: 'U1', unit_label: 'Appt 2',
    property_id: 'P1', property_name: 'Villa', start_date: '2026-01-15', due_day: 31,
    rent_amount: 100000, charges_amount: 5000, ...over,
  }) as Lease;

test('buildSchedule : sans date de fin = 24 échéances', () => {
  assert.equal(buildSchedule(lease({})).length, 24);
});
test('buildSchedule : s’arrête au mois de fin du bail', () => {
  const dues = buildSchedule(lease({ end_date: '2026-03-10' }));
  assert.deepEqual(dues.map((d) => d.period), ['2026-01', '2026-02', '2026-03']);
});
test('buildSchedule : montant = loyer + charges, jour plafonné à 28 (comportement actuel)', () => {
  const [first] = buildSchedule(lease({}));
  assert.equal(first.amount_due, 105000);
  assert.equal(first.due_date, '2026-01-28');
  assert.equal(first.status, 'Attente');
});
test('buildSchedule : jour d’échéance minimum = 1', () => {
  assert.equal(buildSchedule(lease({ due_day: 0 }))[0].due_date, '2026-01-01');
});
test('receiptNumber : format Q-AAAAMM-NNN (suffixe aléatoire, cf. écart n°2 de l’audit)', () => {
  assert.match(receiptNumber('2026-03'), /^Q-202603-\d{3}$/);
});
test('relanceMessage : contient le solde restant, l’unité et les jours de retard', () => {
  const msg = relanceMessage({ tenant_name: 'Kofi', unit_label: 'Appt 2', period: '2026-03', amount_due: 100000, amount_paid: 30000 }, 12);
  assert.match(msg, /Bonjour Kofi/);
  assert.match(msg, /70\s000 FCFA/);
  assert.match(msg, /12 jour\(s\)/);
});
