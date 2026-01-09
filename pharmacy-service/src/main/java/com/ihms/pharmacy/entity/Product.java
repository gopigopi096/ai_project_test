package com.ihms.pharmacy.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String sku;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private String category;

    private String subCategory;

    private String brand;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal costPrice;

    @Column(nullable = false)
    private Integer stockQuantity;

    @Column(nullable = false)
    private Integer reorderLevel;

    private Integer maxStockLevel;

    private String unit; // e.g., "pieces", "bottles", "boxes"

    private String barcode;

    private String supplier;

    private String imageUrl;

    @Column(nullable = false)
    private Boolean active;

    @Column(nullable = false)
    private Boolean taxable;

    @Column(precision = 5, scale = 2)
    private BigDecimal taxRate;

    @Column(precision = 5, scale = 2)
    private BigDecimal discountPercent;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String createdBy;

    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (active == null) active = true;
        if (taxable == null) taxable = true;
        if (stockQuantity == null) stockQuantity = 0;
        if (reorderLevel == null) reorderLevel = 10;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

