package com.ihms.appointment.feign;

import com.ihms.common.dto.ApiResponse;
import com.ihms.common.dto.PatientDTO;
import org.springframework.stereotype.Component;

@Component
public class PatientClientFallback implements PatientClient {

    @Override
    public ApiResponse<PatientDTO> getPatientById(Long id) {
        PatientDTO fallback = PatientDTO.builder()
                .id(id)
                .firstName("Unknown")
                .lastName("Patient")
                .build();
        return ApiResponse.success(fallback);
    }
}

