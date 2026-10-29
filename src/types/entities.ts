// Types des entités Base44, dérivés de base44/entities/*.jsonc.
// À mettre à jour dès qu'une entité Base44 change (champs en snake_case, comme côté Base44).

export interface BaseRecord {
  id: string;
  created_date: string;
  updated_date: string;
  created_by_id: string;
  created_by?: string;
}

/** Données d'un nouvel enregistrement (sans les champs gérés par Base44). */
export type NewRecord<T extends BaseRecord> = Omit<T, keyof BaseRecord>;

export type ExpenseCategory = 'Plomberie' | 'Peinture' | 'Électricité' | 'Taxes' | 'Assurance' | 'Gardiennage' | 'Réparation' | 'Autre';
export interface Expense extends BaseRecord {
  /** Bien */
  property_id?: string;
  /** Bien (nom) */
  property_name?: string;
  /** Libellé */
  label: string;
  /** Catégorie */
  category?: ExpenseCategory;
  /** Prestataire */
  vendor?: string;
  /** Montant (FCFA) */
  amount: number;
  /** Date */
  expense_date: string;
  /** Payée */
  paid?: boolean;
  /** Refacturée au locataire */
  refacture?: boolean;
  /** Montant récupéré (FCFA) */
  recovered_amount?: number;
  /** Justificatif */
  receipt_uri?: string;
  /** Note */
  note?: string;
  /** Motif d'annulation */
  cancellation_reason?: string;
}

export type LeaseStatus = 'Actif' | 'Terminé';
export interface Lease extends BaseRecord {
  /** Unité */
  unit_id: string;
  /** Unité (libellé) */
  unit_label?: string;
  /** Bien */
  property_id?: string;
  /** Bien (nom) */
  property_name?: string;
  /** Locataire */
  tenant_id: string;
  /** Locataire (nom) */
  tenant_name?: string;
  /** Téléphone du locataire */
  tenant_phone?: string;
  /** Date de début */
  start_date: string;
  /** Date de fin */
  end_date?: string;
  /** Loyer mensuel (FCFA) */
  rent_amount?: number;
  /** Charges mensuelles (FCFA) */
  charges_amount?: number;
  /** Caution (FCFA) */
  deposit_amount?: number;
  /** Jour d'échéance */
  due_day?: number;
  /** Délai de grâce (jours) */
  grace_days?: number;
  /** Pénalités de retard activées */
  penalty_enabled?: boolean;
  /** Statut */
  status?: LeaseStatus;
  /** Notes */
  notes?: string;
}

export type PaymentMethod = 'Espèces' | 'Mobile money' | 'Virement' | 'Chèque';
export interface Payment extends BaseRecord {
  /** Échéance */
  due_id: string;
  /** Bail */
  lease_id?: string;
  /** Locataire */
  tenant_id?: string;
  /** Locataire (nom) */
  tenant_name?: string;
  /** Unité (libellé) */
  unit_label?: string;
  /** Bien (nom) */
  property_name?: string;
  /** Période (AAAA-MM) */
  period?: string;
  /** Montant (FCFA) */
  amount: number;
  /** Date du paiement */
  payment_date: string;
  /** Moyen de paiement */
  method?: PaymentMethod;
  /** Référence */
  reference?: string;
  /** Numéro de quittance */
  receipt_number?: string;
  /** Note */
  note?: string;
}

export type PropertyType = 'Immeuble' | 'Maison' | 'Résidence' | 'Boutique' | 'Terrain';
export interface Property extends BaseRecord {
  /** Nom du bien */
  name: string;
  /** Type de bien */
  type?: PropertyType;
  /** Adresse */
  address?: string;
  /** Ville */
  city?: string;
  /** Notes */
  notes?: string;
}

export type RentDueStatus = 'Attente' | 'Partiel' | 'Payé' | 'Retard';
export interface RentDue extends BaseRecord {
  /** Bail */
  lease_id: string;
  /** Locataire */
  tenant_id?: string;
  /** Locataire (nom) */
  tenant_name?: string;
  /** Téléphone */
  tenant_phone?: string;
  /** Unité */
  unit_id?: string;
  /** Unité (libellé) */
  unit_label?: string;
  /** Bien */
  property_id?: string;
  /** Bien (nom) */
  property_name?: string;
  /** Période (AAAA-MM) */
  period: string;
  /** Date limite */
  due_date: string;
  /** Montant dû (FCFA) */
  amount_due: number;
  /** Montant payé (FCFA) */
  amount_paid?: number;
  /** Statut */
  status?: RentDueStatus;
}

export interface Tenant extends BaseRecord {
  /** Nom complet */
  full_name: string;
  /** Téléphone */
  phone?: string;
  /** Email */
  email?: string;
  /** Pièce d'identité */
  id_number?: string;
  /** Ville */
  city?: string;
  /** Loyer mensuel (FCFA) */
  rent_amount?: number;
  /** Avance versée (FCFA) */
  advance_amount?: number;
  /** Mois d'avance */
  advance_months?: number;
  /** Notes */
  notes?: string;
}

export type UnitType = 'Appartement' | 'Studio' | 'Chambre' | 'Boutique' | 'Autre';
export type UnitStatus = 'Libre' | 'Occupé';
export interface Unit extends BaseRecord {
  /** Bien */
  property_id: string;
  /** Nom de l'unité */
  label: string;
  /** Type */
  type?: UnitType;
  /** Surface (m²) */
  surface?: number;
  /** Loyer mensuel (FCFA) */
  rent_amount?: number;
  /** Charges mensuelles (FCFA) */
  charges_amount?: number;
  /** Statut */
  status?: UnitStatus;
}

export type UserRole = 'admin' | 'user';
export interface User extends BaseRecord {
  /** The role of the user in the app */
  role: UserRole;
}

export type ReminderMethod = 'whatsapp' | 'sms' | 'email' | 'autre';
export interface Reminder extends BaseRecord {
  /** Échéance */
  due_id: string;
  /** Palier (1 = J+1, 7 = J+7, 15 = J+15) */
  tier: number;
  /** Méthode de relance */
  method: ReminderMethod;
  /** Message envoyé */
  message?: string;
}

export interface EntityMap {
  Expense: Expense;
  Lease: Lease;
  Payment: Payment;
  Property: Property;
  RentDue: RentDue;
  Tenant: Tenant;
  Unit: Unit;
  User: User;
  Reminder: Reminder;
}

export type EntityName = keyof EntityMap;
