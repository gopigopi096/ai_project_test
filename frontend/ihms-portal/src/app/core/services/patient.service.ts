import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Patient, PatientSearchCriteria, PageResponse } from '../../shared/models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly apiUrl = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) {}

  getPatients(page: number = 0, size: number = 10): Observable<PageResponse<Patient>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Patient>>(this.apiUrl, { params });
  }

  getPatient(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`);
  }

  createPatient(patient: Partial<Patient>): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, patient);
  }

  updatePatient(id: number, patient: Partial<Patient>): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, patient);
  }

  deletePatient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  searchPatients(criteria: PatientSearchCriteria): Observable<PageResponse<Patient>> {
    let params = new HttpParams();
    if (criteria.firstName) params = params.set('firstName', criteria.firstName);
    if (criteria.lastName) params = params.set('lastName', criteria.lastName);
    if (criteria.email) params = params.set('email', criteria.email);
    if (criteria.phone) params = params.set('phone', criteria.phone);
    if (criteria.page !== undefined) params = params.set('page', criteria.page.toString());
    if (criteria.size !== undefined) params = params.set('size', criteria.size.toString());

    return this.http.get<PageResponse<Patient>>(`${this.apiUrl}/search`, { params });
  }

  getPatientMedicalHistory(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/medical-history`);
  }
}

