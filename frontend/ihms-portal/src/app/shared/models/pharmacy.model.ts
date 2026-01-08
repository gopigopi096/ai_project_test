export interface Medication {
  id: number;
  name: string;
  genericName: string;
  manufacturer: string;
  category: MedicationCategory;
  dosageForm: DosageForm;
  strength: string;
  unitPrice: number;
  requiresPrescription: boolean;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
  createdAt: string;
  updatedAt: string;
}

export type MedicationCategory = 'ANTIBIOTIC' | 'ANALGESIC' | 'ANTIHISTAMINE' | 'ANTIHYPERTENSIVE' | 'ANTIDIABETIC' | 'VITAMIN' | 'OTHER';

export type DosageForm = 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'CREAM' | 'OINTMENT' | 'DROPS' | 'INHALER';

export interface Prescription {
  id: number;
  prescriptionNumber: string;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  appointmentId?: number;
  items: PrescriptionItem[];
  status: PrescriptionStatus;
  notes?: string;
  prescribedDate: string;
  dispensedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItem {
  id?: number;
  medicationId: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
}

export type PrescriptionStatus = 'PENDING' | 'DISPENSED' | 'PARTIALLY_DISPENSED' | 'CANCELLED';

export interface InventoryItem {
  id: number;
  medicationId: number;
  medicationName: string;
  batchNumber: string;
  quantity: number;
  reorderLevel: number;
  expiryDate: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

