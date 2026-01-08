import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, AppointmentRequest, PageResponse } from '../../shared/models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly apiUrl = `${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient) {}

  getAppointments(page: number = 0, size: number = 10): Observable<PageResponse<Appointment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Appointment>>(this.apiUrl, { params });
  }

  getAppointment(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  createAppointment(appointment: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment);
  }

  updateAppointment(id: number, appointment: AppointmentRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, appointment);
  }

  cancelAppointment(id: number): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/cancel`, {});
  }

  confirmAppointment(id: number): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/confirm`, {});
  }

  completeAppointment(id: number): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/complete`, {});
  }

  getAppointmentsByPatient(patientId: number, page: number = 0, size: number = 10): Observable<PageResponse<Appointment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Appointment>>(`${this.apiUrl}/patient/${patientId}`, { params });
  }

  getAppointmentsByDoctor(doctorId: number, page: number = 0, size: number = 10): Observable<PageResponse<Appointment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Appointment>>(`${this.apiUrl}/doctor/${doctorId}`, { params });
  }

  getAppointmentsByDate(date: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/date/${date}`);
  }

  getAvailableSlots(doctorId: number, date: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/available-slots`, {
      params: { doctorId: doctorId.toString(), date }
    });
  }
}

