package com.ihms.auth.controller;

import com.ihms.auth.service.AuthService;
import com.ihms.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication API")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<AuthService.AuthResponse>> register(
            @RequestBody AuthService.RegisterRequest request) {
        String token = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(
                new AuthService.AuthResponse(token, request.username(), request.role())
        ));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and get JWT token")
    public ResponseEntity<ApiResponse<AuthService.AuthResponse>> login(
            @RequestBody AuthService.LoginRequest request) {
        String token = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(
                new AuthService.AuthResponse(token, request.username(), null)
        ));
    }

    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth Service is running");
    }
}

