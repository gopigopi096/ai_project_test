package com.ihms.pharmacy.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "prescription_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drug_id", nullable = false)
    private Drug drug;

    @Column(nullable = false)
    private Integer quantity;

    private String dosage;

    private String frequency;

    private Integer durationDays;

    @Column(length = 500)
    private String instructions;

    private Integer dispensedQuantity;

    private Boolean dispensed;

    @PrePersist
    protected void onCreate() {
        if (dispensed == null) dispensed = false;
        if (dispensedQuantity == null) dispensedQuantity = 0;
    }
}

