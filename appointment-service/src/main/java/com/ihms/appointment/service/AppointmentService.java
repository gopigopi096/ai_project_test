package com.ihms.appointment.service;

import com.ihms.appointment.entity.Appointment;
import com.ihms.appointment.entity.DoctorSchedule;
import com.ihms.appointment.feign.PatientClient;
import com.ihms.appointment.repository.AppointmentRepository;
import com.ihms.appointment.repository.DoctorScheduleRepository;
import com.ihms.common.dto.AppointmentDTO;
import com.ihms.common.dto.PatientDTO;
import com.ihms.common.exception.BadRequestException;
import com.ihms.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final PatientClient patientClient;

    public List<AppointmentDTO> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public AppointmentDTO getAppointmentById(Long id) {
        return appointmentRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
    }

    public List<AppointmentDTO> getAppointmentsByPatientId(Long patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getAppointmentsByDoctorId(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getAppointmentsByDate(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(23, 59, 59);
        return appointmentRepository.findByDateRange(start, end).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentDTO createAppointment(AppointmentDTO dto) {
        // Validate patient exists
        try {
            patientClient.getPatientById(dto.getPatientId());
        } catch (Exception e) {
            throw new BadRequestException("Patient not found with id: " + dto.getPatientId());
        }

        // Check for scheduling conflicts
        List<Appointment> conflicts = appointmentRepository.findByDoctorIdAndDateRange(
                dto.getDoctorId(),
                dto.getAppointmentDateTime().minusMinutes(30),
                dto.getAppointmentDateTime().plusMinutes(30)
        );

        if (!conflicts.isEmpty()) {
            throw new BadRequestException("Doctor has another appointment at this time");
        }

        Appointment appointment = Appointment.builder()
                .patientId(dto.getPatientId())
                .doctorId(dto.getDoctorId())
                .appointmentDateTime(dto.getAppointmentDateTime())
                .status(Appointment.Status.SCHEDULED)
                .reason(dto.getReason())
                .notes(dto.getNotes())
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        return toDTO(saved);
    }

    @Transactional
    public AppointmentDTO updateAppointmentStatus(Long id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));

        appointment.setStatus(Appointment.Status.valueOf(status.toUpperCase()));
        Appointment updated = appointmentRepository.save(appointment);
        return toDTO(updated);
    }

    @Transactional
    public void cancelAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));

        appointment.setStatus(Appointment.Status.CANCELLED);
        appointmentRepository.save(appointment);
    }

    public List<DoctorSchedule> getDoctorSchedules(Long doctorId) {
        return doctorScheduleRepository.findByDoctorId(doctorId);
    }

    public List<DoctorSchedule> getAvailableDoctors() {
        return doctorScheduleRepository.findByAvailableTrue();
    }

    private AppointmentDTO toDTO(Appointment appointment) {
        String patientName = "Unknown";
        try {
            PatientDTO patient = patientClient.getPatientById(appointment.getPatientId()).getData();
            if (patient != null) {
                patientName = patient.getFirstName() + " " + patient.getLastName();
            }
        } catch (Exception e) {
            // Use fallback name
        }

        return AppointmentDTO.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatientId())
                .patientName(patientName)
                .doctorId(appointment.getDoctorId())
                .appointmentDateTime(appointment.getAppointmentDateTime())
                .status(appointment.getStatus().name())
                .reason(appointment.getReason())
                .notes(appointment.getNotes())
                .build();
    }
}

