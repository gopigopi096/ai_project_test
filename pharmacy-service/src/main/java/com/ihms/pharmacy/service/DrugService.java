package com.ihms.pharmacy.service;

import com.ihms.common.dto.DrugDTO;
import com.ihms.common.exception.BadRequestException;
import com.ihms.common.exception.ResourceNotFoundException;
import com.ihms.pharmacy.entity.Drug;
import com.ihms.pharmacy.repository.DrugRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DrugService {

    private final DrugRepository drugRepository;

    public List<DrugDTO> getAllDrugs() {
        return drugRepository.findByActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public DrugDTO getDrugById(Long id) {
        return drugRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Drug", id));
    }

    public List<DrugDTO> searchDrugs(String name) {
        return drugRepository.searchByName(name).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<DrugDTO> getLowStockDrugs() {
        return drugRepository.findLowStockDrugs().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<DrugDTO> getExpiringDrugs(int daysAhead) {
        LocalDate targetDate = LocalDate.now().plusDays(daysAhead);
        return drugRepository.findExpiringDrugs(targetDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public DrugDTO createDrug(DrugDTO dto) {
        Drug drug = Drug.builder()
                .name(dto.getName())
                .genericName(dto.getGenericName())
                .sku("SKU-" + System.currentTimeMillis())
                .manufacturer(dto.getManufacturer())
                .category(dto.getCategory())
                .unitPrice(dto.getUnitPrice())
                .stockQuantity(dto.getStockQuantity())
                .reorderLevel(dto.getReorderLevel())
                .expiryDate(dto.getExpiryDate() != null ? LocalDate.parse(dto.getExpiryDate()) : null)
                .batchNumber(dto.getBatchNumber())
                .requiresPrescription(false)
                .active(true)
                .build();

        Drug saved = drugRepository.save(drug);
        return toDTO(saved);
    }

    @Transactional
    public DrugDTO updateDrug(Long id, DrugDTO dto) {
        Drug drug = drugRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drug", id));

        drug.setName(dto.getName());
        drug.setGenericName(dto.getGenericName());
        drug.setManufacturer(dto.getManufacturer());
        drug.setCategory(dto.getCategory());
        drug.setUnitPrice(dto.getUnitPrice());
        drug.setReorderLevel(dto.getReorderLevel());
        drug.setBatchNumber(dto.getBatchNumber());

        if (dto.getExpiryDate() != null) {
            drug.setExpiryDate(LocalDate.parse(dto.getExpiryDate()));
        }

        Drug updated = drugRepository.save(drug);
        return toDTO(updated);
    }

    @Transactional
    public DrugDTO updateStock(Long id, int quantity, boolean isAddition) {
        Drug drug = drugRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drug", id));

        int newStock = isAddition ?
                drug.getStockQuantity() + quantity :
                drug.getStockQuantity() - quantity;

        if (newStock < 0) {
            throw new BadRequestException("Insufficient stock. Available: " + drug.getStockQuantity());
        }

        drug.setStockQuantity(newStock);
        Drug updated = drugRepository.save(drug);
        return toDTO(updated);
    }

    @Transactional
    public void deleteDrug(Long id) {
        Drug drug = drugRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Drug", id));
        drug.setActive(false);
        drugRepository.save(drug);
    }

    private DrugDTO toDTO(Drug drug) {
        return DrugDTO.builder()
                .id(drug.getId())
                .name(drug.getName())
                .genericName(drug.getGenericName())
                .manufacturer(drug.getManufacturer())
                .category(drug.getCategory())
                .unitPrice(drug.getUnitPrice())
                .stockQuantity(drug.getStockQuantity())
                .reorderLevel(drug.getReorderLevel())
                .expiryDate(drug.getExpiryDate() != null ? drug.getExpiryDate().toString() : null)
                .batchNumber(drug.getBatchNumber())
                .build();
    }
}

