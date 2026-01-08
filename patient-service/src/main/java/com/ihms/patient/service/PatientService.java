package com.ihms.patient.service;

import com.ihms.common.dto.PatientDTO;
import com.ihms.common.exception.BadRequestException;
import com.ihms.common.exception.ResourceNotFoundException;
import com.ihms.patient.entity.Patient;
import com.ihms.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;

    public List<PatientDTO> getAllPatients() {
        return patientRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PatientDTO getPatientById(Long id) {
        return patientRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
    }

    public List<PatientDTO> searchPatients(String name) {
        return patientRepository.searchByName(name).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PatientDTO createPatient(PatientDTO dto) {
        if (patientRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Patient with this email already exists");
        }

        Patient patient = toEntity(dto);
        Patient saved = patientRepository.save(patient);
        return toDTO(saved);
    }

    @Transactional
    public PatientDTO updatePatient(Long id, PatientDTO dto) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));

        patient.setFirstName(dto.getFirstName());
        patient.setLastName(dto.getLastName());
        patient.setPhone(dto.getPhone());
        patient.setAddress(dto.getAddress());
        patient.setBloodGroup(dto.getBloodGroup());
        patient.setEmergencyContact(dto.getEmergencyContact());
        patient.setMedicalHistory(dto.getMedicalHistory());

        if (dto.getDateOfBirth() != null) {
            patient.setDateOfBirth(LocalDate.parse(dto.getDateOfBirth()));
        }
        if (dto.getGender() != null) {
            patient.setGender(Patient.Gender.valueOf(dto.getGender().toUpperCase()));
        }

        Patient updated = patientRepository.save(patient);
        return toDTO(updated);
    }

    @Transactional
    public void deletePatient(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patient", id);
        }
        patientRepository.deleteById(id);
    }

    private PatientDTO toDTO(Patient patient) {
        return PatientDTO.builder()
                .id(patient.getId())
                .firstName(patient.getFirstName())
                .lastName(patient.getLastName())
                .email(patient.getEmail())
                .phone(patient.getPhone())
                .dateOfBirth(patient.getDateOfBirth() != null ? patient.getDateOfBirth().toString() : null)
                .gender(patient.getGender() != null ? patient.getGender().name() : null)
                .address(patient.getAddress())
                .bloodGroup(patient.getBloodGroup())
                .emergencyContact(patient.getEmergencyContact())
                .medicalHistory(patient.getMedicalHistory())
                .build();
    }

    private Patient toEntity(PatientDTO dto) {
        Patient patient = new Patient();
        patient.setFirstName(dto.getFirstName());
        patient.setLastName(dto.getLastName());
        patient.setEmail(dto.getEmail());
        patient.setPhone(dto.getPhone());
        patient.setAddress(dto.getAddress());
        patient.setBloodGroup(dto.getBloodGroup());
        patient.setEmergencyContact(dto.getEmergencyContact());
        patient.setMedicalHistory(dto.getMedicalHistory());

        if (dto.getDateOfBirth() != null) {
            patient.setDateOfBirth(LocalDate.parse(dto.getDateOfBirth()));
        }
        if (dto.getGender() != null) {
            patient.setGender(Patient.Gender.valueOf(dto.getGender().toUpperCase()));
        }

        return patient;
    }
}

