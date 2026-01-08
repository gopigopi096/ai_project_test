-- V1__Create_pharmacy_tables.sql
CREATE TABLE drugs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    generic_name VARCHAR(100),
    sku VARCHAR(50) UNIQUE,
    manufacturer VARCHAR(100),
    category VARCHAR(50),
    description VARCHAR(1000),
    unit_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    expiry_date DATE,
    batch_number VARCHAR(50),
    storage_conditions VARCHAR(255),
    requires_prescription BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescriptions (
    id BIGSERIAL PRIMARY KEY,
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    doctor_name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    prescribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dispensed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescription_items (
    id BIGSERIAL PRIMARY KEY,
    prescription_id BIGINT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    drug_id BIGINT NOT NULL REFERENCES drugs(id),
    quantity INTEGER NOT NULL,
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    duration_days INTEGER,
    instructions VARCHAR(500),
    dispensed_quantity INTEGER DEFAULT 0,
    dispensed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_drugs_name ON drugs(name);
CREATE INDEX idx_drugs_sku ON drugs(sku);
CREATE INDEX idx_drugs_category ON drugs(category);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);

-- Sample drugs
INSERT INTO drugs (name, generic_name, manufacturer, category, unit_price, stock_quantity, reorder_level, requires_prescription)
VALUES
    ('Paracetamol 500mg', 'Acetaminophen', 'PharmaCorp', 'Pain Relief', 5.99, 1000, 100, false),
    ('Amoxicillin 500mg', 'Amoxicillin', 'MediPharm', 'Antibiotics', 12.99, 500, 50, true),
    ('Ibuprofen 400mg', 'Ibuprofen', 'PharmaCorp', 'Anti-inflammatory', 7.99, 800, 80, false),
    ('Omeprazole 20mg', 'Omeprazole', 'GastroMed', 'Gastric', 15.99, 300, 30, true),
    ('Metformin 500mg', 'Metformin', 'DiabeCare', 'Diabetes', 8.99, 600, 60, true);

