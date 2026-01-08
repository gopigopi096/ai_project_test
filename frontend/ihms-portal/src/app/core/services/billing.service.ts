import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Invoice, InvoiceRequest, Payment, PageResponse } from '../../shared/models/billing.model';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private readonly apiUrl = `${environment.apiUrl}/billing`;

  constructor(private http: HttpClient) {}

  getInvoices(page: number = 0, size: number = 10): Observable<PageResponse<Invoice>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Invoice>>(`${this.apiUrl}/invoices`, { params });
  }

  getInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`);
  }

  createInvoice(invoice: InvoiceRequest): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/invoices`, invoice);
  }

  updateInvoice(id: number, invoice: InvoiceRequest): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.apiUrl}/invoices/${id}`, invoice);
  }

  getInvoicesByPatient(patientId: number, page: number = 0, size: number = 10): Observable<PageResponse<Invoice>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Invoice>>(`${this.apiUrl}/invoices/patient/${patientId}`, { params });
  }

  processPayment(invoiceId: number, payment: Payment): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/invoices/${invoiceId}/payments`, payment);
  }

  getPaymentHistory(invoiceId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/invoices/${invoiceId}/payments`);
  }

  generateInvoicePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/invoices/${id}/pdf`, { responseType: 'blob' });
  }

  getRevenueReport(startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get(`${this.apiUrl}/reports/revenue`, { params });
  }
}

