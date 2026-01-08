package com.ihms.pharmacy.controller;

import com.ihms.common.dto.ApiResponse;
import com.ihms.common.dto.PrescriptionDTO;
import com.ihms.pharmacy.service.PrescriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/prescriptions")
@RequiredArgsConstructor
@Tag(name = "Prescriptions", description = "APIs for managing prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @GetMapping
    @Operation(summary = "Get all prescriptions")
    public ResponseEntity<ApiResponse<List<PrescriptionDTO>>> getAllPrescriptions() {
        return ResponseEntity.ok(ApiResponse.success(prescriptionService.getAllPrescriptions()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get prescription by ID")
    public ResponseEntity<ApiResponse<PrescriptionDTO>> getPrescriptionById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(prescriptionService.getPrescriptionById(id)));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get prescriptions by patient ID")
    public ResponseEntity<ApiResponse<List<PrescriptionDTO>>> getPrescriptionsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success(prescriptionService.getPrescriptionsByPatientId(patientId)));
    }

    @GetMapping("/pending")
    @Operation(summary = "Get pending prescriptions")
    public ResponseEntity<ApiResponse<List<PrescriptionDTO>>> getPendingPrescriptions() {
        return ResponseEntity.ok(ApiResponse.success(prescriptionService.getPendingPrescriptions()));
    }

    @PostMapping
    @Operation(summary = "Create a new prescription")
    public ResponseEntity<ApiResponse<PrescriptionDTO>> createPrescription(@RequestBody PrescriptionDTO prescriptionDTO) {
        PrescriptionDTO created = prescriptionService.createPrescription(prescriptionDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Prescription created", created));
    }

    @PostMapping("/{id}/dispense")
    @Operation(summary = "Dispense a prescription")
    public ResponseEntity<ApiResponse<PrescriptionDTO>> dispensePrescription(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Prescription dispensed",
                prescriptionService.dispensePrescription(id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancel a prescription")
    public ResponseEntity<ApiResponse<Void>> cancelPrescription(@PathVariable Long id) {
        prescriptionService.cancelPrescription(id);
        return ResponseEntity.ok(ApiResponse.success("Prescription cancelled", null));
    }

    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Pharmacy Service is running");
    }
}

