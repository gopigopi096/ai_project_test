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
public class ProductDTO {
    private Long id;
    private String name;
    private String sku;
    private String description;
    private String category;
    private String subCategory;
    private String brand;
    private BigDecimal unitPrice;
    private BigDecimal costPrice;
    private Integer stockQuantity;
    private Integer reorderLevel;
    private Integer maxStockLevel;
    private String unit;
    private String barcode;
    private String supplier;
    private String imageUrl;
    private Boolean active;
    private Boolean taxable;
    private BigDecimal taxRate;
    private BigDecimal discountPercent;
    private String createdAt;
    private String updatedAt;
}

