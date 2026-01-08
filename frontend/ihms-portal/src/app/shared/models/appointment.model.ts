export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  departmentId: number;
  departmentName: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: AppointmentStatus;
  type: AppointmentType;
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export type AppointmentType = 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'ROUTINE_CHECKUP' | 'SPECIALIST';

export interface AppointmentRequest {
  patientId: number;
  doctorId: number;
  departmentId: number;
  appointmentDate: string;
  appointmentTime: string;
  duration?: number;
  type: AppointmentType;
  reason: string;
  notes?: string;
}

export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  specialization: string;
  departmentId: number;
  departmentName: string;
  email: string;
  phone: string;
}

export interface Department {
  id: number;
  name: string;
  description: string;
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

