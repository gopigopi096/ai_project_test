package com.ihms.auth.service;

import com.ihms.auth.entity.User;
import com.ihms.auth.repository.UserRepository;
import com.ihms.common.exception.BadRequestException;
import com.ihms.common.exception.ResourceNotFoundException;
import com.ihms.common.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public String register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BadRequestException("Username already exists");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already exists");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .role(User.Role.valueOf(request.role().toUpperCase()))
                .active(true)
                .build();

        userRepository.save(user);

        return jwtUtil.generateToken(user.getUsername(), user.getRole().name());
    }

    public String login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Invalid password");
        }

        if (!user.getActive()) {
            throw new BadRequestException("User account is disabled");
        }

        return jwtUtil.generateToken(user.getUsername(), user.getRole().name());
    }

    public record RegisterRequest(
            String username,
            String email,
            String password,
            String firstName,
            String lastName,
            String role
    ) {}

    public record LoginRequest(
            String username,
            String password
    ) {}

    public record AuthResponse(
            String token,
            String username,
            String role
    ) {}
}

