package com.ihms.appointment.repository;

import com.ihms.appointment.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByDoctorId(Long doctorId);

    List<Appointment> findByStatus(Appointment.Status status);

    @Query("SELECT a FROM Appointment a WHERE a.doctorId = :doctorId " +
           "AND a.appointmentDateTime BETWEEN :start AND :end")
    List<Appointment> findByDoctorIdAndDateRange(Long doctorId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT a FROM Appointment a WHERE a.appointmentDateTime BETWEEN :start AND :end")
    List<Appointment> findByDateRange(LocalDateTime start, LocalDateTime end);

    @Query("SELECT a FROM Appointment a WHERE a.patientId = :patientId AND a.status = 'SCHEDULED'")
    List<Appointment> findUpcomingByPatientId(Long patientId);
}

