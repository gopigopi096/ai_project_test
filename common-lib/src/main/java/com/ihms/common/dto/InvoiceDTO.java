package com.ihms.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDTO {
    private Long id;
    private Long patientId;
    private String patientName;
    private Long appointmentId;
    private List<InvoiceItemDTO> items;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}

