package com.ihms.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DrugDTO {
    private Long id;
    private String name;
    private String genericName;
    private String manufacturer;
    private String category;
    private BigDecimal unitPrice;
    private Integer stockQuantity;
    private Integer reorderLevel;
    private String expiryDate;
    private String batchNumber;
}

