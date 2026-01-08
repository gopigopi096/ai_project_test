-- V1__Create_appointments_tables.sql
CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_date_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    reason VARCHAR(500),
    notes VARCHAR(1000),
    duration_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctor_schedules (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    doctor_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER DEFAULT 30,
    available BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_date_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_doctor_schedules_doctor ON doctor_schedules(doctor_id);

-- Sample doctor schedules
INSERT INTO doctor_schedules (doctor_id, doctor_name, specialization, day_of_week, start_time, end_time, slot_duration_minutes, available)
VALUES
    (1, 'Dr. John Smith', 'General Medicine', 1, '09:00', '17:00', 30, true),
    (1, 'Dr. John Smith', 'General Medicine', 2, '09:00', '17:00', 30, true),
    (1, 'Dr. John Smith', 'General Medicine', 3, '09:00', '17:00', 30, true),
    (2, 'Dr. Sarah Johnson', 'Cardiology', 1, '10:00', '18:00', 45, true),
    (2, 'Dr. Sarah Johnson', 'Cardiology', 3, '10:00', '18:00', 45, true),
    (2, 'Dr. Sarah Johnson', 'Cardiology', 5, '10:00', '18:00', 45, true);

