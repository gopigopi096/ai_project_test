package com.ihms.appointment.repository;

import com.ihms.appointment.entity.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {
    List<DoctorSchedule> findByDoctorId(Long doctorId);
    List<DoctorSchedule> findByDoctorIdAndDayOfWeek(Long doctorId, Integer dayOfWeek);
    List<DoctorSchedule> findBySpecialization(String specialization);
    List<DoctorSchedule> findByAvailableTrue();
}

