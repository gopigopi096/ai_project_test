package com.ihms.pharmacy.service;

import com.ihms.common.dto.PatientDTO;
import com.ihms.common.dto.PrescriptionDTO;
import com.ihms.common.dto.PrescriptionItemDTO;
import com.ihms.common.exception.BadRequestException;
import com.ihms.common.exception.ResourceNotFoundException;
import com.ihms.pharmacy.entity.Drug;
import com.ihms.pharmacy.entity.Prescription;
import com.ihms.pharmacy.entity.PrescriptionItem;
import com.ihms.pharmacy.feign.PatientClient;
import com.ihms.pharmacy.repository.DrugRepository;
import com.ihms.pharmacy.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final DrugRepository drugRepository;
    private final PatientClient patientClient;

    public List<PrescriptionDTO> getAllPrescriptions() {
        return prescriptionRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PrescriptionDTO getPrescriptionById(Long id) {
        return prescriptionRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", id));
    }

    public List<PrescriptionDTO> getPrescriptionsByPatientId(Long patientId) {
        return prescriptionRepository.findByPatientId(patientId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<PrescriptionDTO> getPendingPrescriptions() {
        return prescriptionRepository.findByStatus(Prescription.Status.PENDING).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PrescriptionDTO createPrescription(PrescriptionDTO dto) {
        Prescription prescription = Prescription.builder()
                .patientId(dto.getPatientId())
                .doctorId(dto.getDoctorId())
                .doctorName(dto.getDoctorName())
                .notes(dto.getNotes())
                .status(Prescription.Status.PENDING)
                .build();

        if (dto.getItems() != null) {
            for (PrescriptionItemDTO itemDTO : dto.getItems()) {
                Drug drug = drugRepository.findById(itemDTO.getDrugId())
                        .orElseThrow(() -> new ResourceNotFoundException("Drug", itemDTO.getDrugId()));

                PrescriptionItem item = PrescriptionItem.builder()
                        .drug(drug)
                        .quantity(itemDTO.getQuantity())
                        .dosage(itemDTO.getDosage())
                        .frequency(itemDTO.getFrequency())
                        .durationDays(itemDTO.getDurationDays())
                        .instructions(itemDTO.getInstructions())
                        .build();
                prescription.addItem(item);
            }
        }

        Prescription saved = prescriptionRepository.save(prescription);
        return toDTO(saved);
    }

    @Transactional
    public PrescriptionDTO dispensePrescription(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", id));

        if (prescription.getStatus() == Prescription.Status.DISPENSED) {
            throw new BadRequestException("Prescription already dispensed");
        }

        // Check and update stock for each item
        for (PrescriptionItem item : prescription.getItems()) {
            Drug drug = item.getDrug();
            if (drug.getStockQuantity() < item.getQuantity()) {
                throw new BadRequestException("Insufficient stock for drug: " + drug.getName());
            }
            drug.setStockQuantity(drug.getStockQuantity() - item.getQuantity());
            drugRepository.save(drug);

            item.setDispensed(true);
            item.setDispensedQuantity(item.getQuantity());
        }

        prescription.setStatus(Prescription.Status.DISPENSED);
        prescription.setDispensedAt(LocalDateTime.now());

        Prescription updated = prescriptionRepository.save(prescription);
        return toDTO(updated);
    }

    @Transactional
    public void cancelPrescription(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", id));

        if (prescription.getStatus() == Prescription.Status.DISPENSED) {
            throw new BadRequestException("Cannot cancel a dispensed prescription");
        }

        prescription.setStatus(Prescription.Status.CANCELLED);
        prescriptionRepository.save(prescription);
    }

    private PrescriptionDTO toDTO(Prescription prescription) {
        String patientName = "Unknown";
        try {
            PatientDTO patient = patientClient.getPatientById(prescription.getPatientId()).getData();
            if (patient != null) {
                patientName = patient.getFirstName() + " " + patient.getLastName();
            }
        } catch (Exception e) {
            // Use fallback
        }

        List<PrescriptionItemDTO> items = prescription.getItems().stream()
                .map(item -> PrescriptionItemDTO.builder()
                        .id(item.getId())
                        .drugId(item.getDrug().getId())
                        .drugName(item.getDrug().getName())
                        .quantity(item.getQuantity())
                        .dosage(item.getDosage())
                        .frequency(item.getFrequency())
                        .durationDays(item.getDurationDays())
                        .instructions(item.getInstructions())
                        .build())
                .collect(Collectors.toList());

        return PrescriptionDTO.builder()
                .id(prescription.getId())
                .patientId(prescription.getPatientId())
                .patientName(patientName)
                .doctorId(prescription.getDoctorId())
                .doctorName(prescription.getDoctorName())
                .items(items)
                .prescribedAt(prescription.getPrescribedAt())
                .status(prescription.getStatus().name())
                .notes(prescription.getNotes())
                .build();
    }
}

