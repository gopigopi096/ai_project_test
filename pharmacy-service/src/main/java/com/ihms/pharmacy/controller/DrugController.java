package com.ihms.pharmacy.controller;

import com.ihms.common.dto.ApiResponse;
import com.ihms.common.dto.DrugDTO;
import com.ihms.pharmacy.service.DrugService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/drugs")
@RequiredArgsConstructor
@Tag(name = "Drug Inventory", description = "APIs for managing drug inventory")
public class DrugController {

    private final DrugService drugService;

    @GetMapping
    @Operation(summary = "Get all drugs")
    public ResponseEntity<ApiResponse<List<DrugDTO>>> getAllDrugs() {
        return ResponseEntity.ok(ApiResponse.success(drugService.getAllDrugs()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get drug by ID")
    public ResponseEntity<ApiResponse<DrugDTO>> getDrugById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(drugService.getDrugById(id)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search drugs by name")
    public ResponseEntity<ApiResponse<List<DrugDTO>>> searchDrugs(@RequestParam String name) {
        return ResponseEntity.ok(ApiResponse.success(drugService.searchDrugs(name)));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get drugs with low stock")
    public ResponseEntity<ApiResponse<List<DrugDTO>>> getLowStockDrugs() {
        return ResponseEntity.ok(ApiResponse.success(drugService.getLowStockDrugs()));
    }

    @GetMapping("/expiring")
    @Operation(summary = "Get drugs expiring soon")
    public ResponseEntity<ApiResponse<List<DrugDTO>>> getExpiringDrugs(
            @RequestParam(defaultValue = "30") int daysAhead) {
        return ResponseEntity.ok(ApiResponse.success(drugService.getExpiringDrugs(daysAhead)));
    }

    @PostMapping
    @Operation(summary = "Add a new drug")
    public ResponseEntity<ApiResponse<DrugDTO>> createDrug(@RequestBody DrugDTO drugDTO) {
        DrugDTO created = drugService.createDrug(drugDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Drug added", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a drug")
    public ResponseEntity<ApiResponse<DrugDTO>> updateDrug(@PathVariable Long id, @RequestBody DrugDTO drugDTO) {
        return ResponseEntity.ok(ApiResponse.success("Drug updated", drugService.updateDrug(id, drugDTO)));
    }

    @PatchMapping("/{id}/stock")
    @Operation(summary = "Update drug stock")
    public ResponseEntity<ApiResponse<DrugDTO>> updateStock(
            @PathVariable Long id,
            @RequestParam int quantity,
            @RequestParam(defaultValue = "true") boolean isAddition) {
        return ResponseEntity.ok(ApiResponse.success("Stock updated", drugService.updateStock(id, quantity, isAddition)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a drug")
    public ResponseEntity<ApiResponse<Void>> deleteDrug(@PathVariable Long id) {
        drugService.deleteDrug(id);
        return ResponseEntity.ok(ApiResponse.success("Drug deleted", null));
    }
}

