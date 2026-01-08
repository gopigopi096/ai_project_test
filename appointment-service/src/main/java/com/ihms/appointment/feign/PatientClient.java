package com.ihms.appointment.feign;

import com.ihms.common.dto.ApiResponse;
import com.ihms.common.dto.PatientDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "patient-service", fallback = PatientClientFallback.class)
public interface PatientClient {

    @GetMapping("/{id}")
    ApiResponse<PatientDTO> getPatientById(@PathVariable("id") Long id);
}

