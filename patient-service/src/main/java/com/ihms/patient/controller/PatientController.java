package com.ihms.patient.controller;

import com.ihms.common.dto.ApiResponse;
import com.ihms.common.dto.PatientDTO;
import com.ihms.patient.service.PatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/")
@RequiredArgsConstructor
@Tag(name = "Patient Management", description = "APIs for managing patients")
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    @Operation(summary = "Get all patients")
    public ResponseEntity<ApiResponse<List<PatientDTO>>> getAllPatients() {
        return ResponseEntity.ok(ApiResponse.success(patientService.getAllPatients()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get patient by ID")
    public ResponseEntity<ApiResponse<PatientDTO>> getPatientById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(patientService.getPatientById(id)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search patients by name")
    public ResponseEntity<ApiResponse<List<PatientDTO>>> searchPatients(@RequestParam String name) {
        return ResponseEntity.ok(ApiResponse.success(patientService.searchPatients(name)));
    }

    @PostMapping
    @Operation(summary = "Create a new patient")
    public ResponseEntity<ApiResponse<PatientDTO>> createPatient(@RequestBody PatientDTO patientDTO) {
        PatientDTO created = patientService.createPatient(patientDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Patient created", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing patient")
    public ResponseEntity<ApiResponse<PatientDTO>> updatePatient(@PathVariable Long id, @RequestBody PatientDTO patientDTO) {
        return ResponseEntity.ok(ApiResponse.success("Patient updated", patientService.updatePatient(id, patientDTO)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a patient")
    public ResponseEntity<ApiResponse<Void>> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return ResponseEntity.ok(ApiResponse.success("Patient deleted", null));
    }

    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Patient Service is running");
    }
}

