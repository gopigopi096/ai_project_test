package com.ihms.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionItemDTO {
    private Long id;
    private Long drugId;
    private String drugName;
    private Integer quantity;
    private String dosage;
    private String frequency;
    private Integer durationDays;
    private String instructions;
}

