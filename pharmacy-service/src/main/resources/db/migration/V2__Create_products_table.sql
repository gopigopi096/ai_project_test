-- V2__Create_products_table.sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(1000),
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    brand VARCHAR(100),
    unit_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    max_stock_level INTEGER,
    unit VARCHAR(50),
    barcode VARCHAR(100),
    supplier VARCHAR(255),
    image_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    taxable BOOLEAN NOT NULL DEFAULT TRUE,
    tax_rate DECIMAL(5, 2),
    discount_percent DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Indexes for better query performance
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_supplier ON products(supplier);
CREATE INDEX idx_products_active ON products(active);

-- Sample products
INSERT INTO products (name, sku, description, category, sub_category, brand, unit_price, cost_price, stock_quantity, reorder_level, unit, taxable)
VALUES
    ('Surgical Mask (50 pcs)', 'PRD-001', 'Disposable 3-ply surgical masks', 'Medical Supplies', 'PPE', 'MediSafe', 12.99, 8.50, 500, 100, 'box', true),
    ('Hand Sanitizer 500ml', 'PRD-002', 'Alcohol-based hand sanitizer', 'Medical Supplies', 'Hygiene', 'CleanHands', 8.99, 5.00, 300, 50, 'bottle', true),
    ('Digital Thermometer', 'PRD-003', 'Fast and accurate digital thermometer', 'Medical Devices', 'Diagnostics', 'TempCheck', 15.99, 9.00, 150, 30, 'pieces', true),
    ('Blood Pressure Monitor', 'PRD-004', 'Automatic digital blood pressure monitor', 'Medical Devices', 'Diagnostics', 'HealthPlus', 45.99, 30.00, 50, 10, 'pieces', true),
    ('First Aid Kit', 'PRD-005', 'Complete first aid kit with essentials', 'Medical Supplies', 'Emergency', 'SafetyFirst', 25.99, 15.00, 100, 20, 'kit', true),
    ('Latex Gloves (100 pcs)', 'PRD-006', 'Powder-free latex examination gloves', 'Medical Supplies', 'PPE', 'MediSafe', 18.99, 12.00, 400, 80, 'box', true),
    ('Antiseptic Wipes (100 pcs)', 'PRD-007', 'Alcohol-based antiseptic wipes', 'Medical Supplies', 'Hygiene', 'CleanHands', 9.99, 6.00, 250, 50, 'pack', true),
    ('Pulse Oximeter', 'PRD-008', 'Fingertip pulse oximeter with display', 'Medical Devices', 'Diagnostics', 'HealthPlus', 29.99, 18.00, 80, 15, 'pieces', true),
    ('Bandage Roll (10 pcs)', 'PRD-009', 'Elastic bandage rolls for wound care', 'Medical Supplies', 'Wound Care', 'CarePlus', 6.99, 3.50, 350, 70, 'pack', true),
    ('Glucose Test Strips (50 pcs)', 'PRD-010', 'Blood glucose test strips', 'Medical Supplies', 'Diabetes Care', 'DiabeCare', 22.99, 14.00, 200, 40, 'box', true);

