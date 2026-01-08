package com.ihms.billing.feign;

import com.ihms.common.dto.ApiResponse;
import com.ihms.common.dto.AppointmentDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "appointment-service")
public interface AppointmentClient {

    @GetMapping("/{id}")
    ApiResponse<AppointmentDTO> getAppointmentById(@PathVariable("id") Long id);
}

