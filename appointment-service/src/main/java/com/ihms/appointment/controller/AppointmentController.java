package com.ihms.appointment.controller;

import com.ihms.appointment.entity.DoctorSchedule;
import com.ihms.appointment.service.AppointmentService;
import com.ihms.common.dto.ApiResponse;
import com.ihms.common.dto.AppointmentDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/")
@RequiredArgsConstructor
@Tag(name = "Appointment Management", description = "APIs for managing appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    @Operation(summary = "Get all appointments")
    public ResponseEntity<ApiResponse<List<AppointmentDTO>>> getAllAppointments() {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAllAppointments()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get appointment by ID")
    public ResponseEntity<ApiResponse<AppointmentDTO>> getAppointmentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointmentById(id)));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get appointments by patient ID")
    public ResponseEntity<ApiResponse<List<AppointmentDTO>>> getAppointmentsByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointmentsByPatientId(patientId)));
    }

    @GetMapping("/doctor/{doctorId}")
    @Operation(summary = "Get appointments by doctor ID")
    public ResponseEntity<ApiResponse<List<AppointmentDTO>>> getAppointmentsByDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointmentsByDoctorId(doctorId)));
    }

    @GetMapping("/date/{date}")
    @Operation(summary = "Get appointments by date")
    public ResponseEntity<ApiResponse<List<AppointmentDTO>>> getAppointmentsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAppointmentsByDate(date)));
    }

    @PostMapping
    @Operation(summary = "Create a new appointment")
    public ResponseEntity<ApiResponse<AppointmentDTO>> createAppointment(@RequestBody AppointmentDTO appointmentDTO) {
        AppointmentDTO created = appointmentService.createAppointment(appointmentDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Appointment created", created));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update appointment status")
    public ResponseEntity<ApiResponse<AppointmentDTO>> updateStatus(
            @PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.updateAppointmentStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancel an appointment")
    public ResponseEntity<ApiResponse<Void>> cancelAppointment(@PathVariable Long id) {
        appointmentService.cancelAppointment(id);
        return ResponseEntity.ok(ApiResponse.success("Appointment cancelled", null));
    }

    @GetMapping("/doctors/{doctorId}/schedule")
    @Operation(summary = "Get doctor's schedule")
    public ResponseEntity<ApiResponse<List<DoctorSchedule>>> getDoctorSchedule(@PathVariable Long doctorId) {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getDoctorSchedules(doctorId)));
    }

    @GetMapping("/doctors/available")
    @Operation(summary = "Get available doctors")
    public ResponseEntity<ApiResponse<List<DoctorSchedule>>> getAvailableDoctors() {
        return ResponseEntity.ok(ApiResponse.success(appointmentService.getAvailableDoctors()));
    }

    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Appointment Service is running");
    }
}

