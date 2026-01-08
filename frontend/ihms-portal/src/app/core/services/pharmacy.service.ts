import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Medication, Prescription, InventoryItem, PageResponse } from '../../shared/models/pharmacy.model';

@Injectable({
  providedIn: 'root'
})
export class PharmacyService {
  private readonly apiUrl = `${environment.apiUrl}/pharmacy`;

  constructor(private http: HttpClient) {}

  // Medications
  getMedications(page: number = 0, size: number = 10): Observable<PageResponse<Medication>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Medication>>(`${this.apiUrl}/medications`, { params });
  }

  getMedication(id: number): Observable<Medication> {
    return this.http.get<Medication>(`${this.apiUrl}/medications/${id}`);
  }

  createMedication(medication: Partial<Medication>): Observable<Medication> {
    return this.http.post<Medication>(`${this.apiUrl}/medications`, medication);
  }

  updateMedication(id: number, medication: Partial<Medication>): Observable<Medication> {
    return this.http.put<Medication>(`${this.apiUrl}/medications/${id}`, medication);
  }

  searchMedications(query: string): Observable<Medication[]> {
    return this.http.get<Medication[]>(`${this.apiUrl}/medications/search`, {
      params: { query }
    });
  }

  // Prescriptions
  getPrescriptions(page: number = 0, size: number = 10): Observable<PageResponse<Prescription>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Prescription>>(`${this.apiUrl}/prescriptions`, { params });
  }

  getPrescription(id: number): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.apiUrl}/prescriptions/${id}`);
  }

  createPrescription(prescription: Partial<Prescription>): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.apiUrl}/prescriptions`, prescription);
  }

  dispensePrescription(id: number): Observable<Prescription> {
    return this.http.patch<Prescription>(`${this.apiUrl}/prescriptions/${id}/dispense`, {});
  }

  getPrescriptionsByPatient(patientId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiUrl}/prescriptions/patient/${patientId}`);
  }

  // Inventory
  getInventory(page: number = 0, size: number = 10): Observable<PageResponse<InventoryItem>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<InventoryItem>>(`${this.apiUrl}/inventory`, { params });
  }

  updateInventory(id: number, quantity: number): Observable<InventoryItem> {
    return this.http.patch<InventoryItem>(`${this.apiUrl}/inventory/${id}`, { quantity });
  }

  getLowStockItems(): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.apiUrl}/inventory/low-stock`);
  }

  addStock(medicationId: number, quantity: number, batchNumber: string, expiryDate: string): Observable<InventoryItem> {
    return this.http.post<InventoryItem>(`${this.apiUrl}/inventory/add-stock`, {
      medicationId, quantity, batchNumber, expiryDate
    });
  }
}

