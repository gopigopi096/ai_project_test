package com.ihms.billing.controller;

import com.ihms.billing.service.BillingService;
import com.ihms.common.dto.ApiResponse;
import com.ihms.common.dto.InvoiceDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/")
@RequiredArgsConstructor
@Tag(name = "Billing Management", description = "APIs for managing invoices and payments")
public class BillingController {

    private final BillingService billingService;

    @GetMapping("/invoices")
    @Operation(summary = "Get all invoices")
    public ResponseEntity<ApiResponse<List<InvoiceDTO>>> getAllInvoices() {
        return ResponseEntity.ok(ApiResponse.success(billingService.getAllInvoices()));
    }

    @GetMapping("/invoices/{id}")
    @Operation(summary = "Get invoice by ID")
    public ResponseEntity<ApiResponse<InvoiceDTO>> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getInvoiceById(id)));
    }

    @GetMapping("/invoices/patient/{patientId}")
    @Operation(summary = "Get invoices by patient ID")
    public ResponseEntity<ApiResponse<List<InvoiceDTO>>> getInvoicesByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getInvoicesByPatientId(patientId)));
    }

    @GetMapping("/invoices/status/{status}")
    @Operation(summary = "Get invoices by status")
    public ResponseEntity<ApiResponse<List<InvoiceDTO>>> getInvoicesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getInvoicesByStatus(status)));
    }

    @PostMapping("/invoices")
    @Operation(summary = "Create a new invoice")
    public ResponseEntity<ApiResponse<InvoiceDTO>> createInvoice(@RequestBody InvoiceDTO invoiceDTO) {
        InvoiceDTO created = billingService.createInvoice(invoiceDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Invoice created", created));
    }

    @PostMapping("/invoices/{id}/pay")
    @Operation(summary = "Process payment for an invoice")
    public ResponseEntity<ApiResponse<InvoiceDTO>> processPayment(
            @PathVariable Long id,
            @RequestParam BigDecimal amount,
            @RequestParam String paymentMethod) {
        return ResponseEntity.ok(ApiResponse.success("Payment processed",
                billingService.processPayment(id, amount, paymentMethod)));
    }

    @DeleteMapping("/invoices/{id}")
    @Operation(summary = "Cancel an invoice")
    public ResponseEntity<ApiResponse<Void>> cancelInvoice(@PathVariable Long id) {
        billingService.cancelInvoice(id);
        return ResponseEntity.ok(ApiResponse.success("Invoice cancelled", null));
    }

    @GetMapping("/patients/{patientId}/summary")
    @Operation(summary = "Get patient billing summary")
    public ResponseEntity<ApiResponse<BillingService.PatientBillingSummary>> getPatientSummary(
            @PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getPatientBillingSummary(patientId)));
    }

    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Billing Service is running");
    }
}

