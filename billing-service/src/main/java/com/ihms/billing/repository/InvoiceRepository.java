package com.ihms.billing.repository;

import com.ihms.billing.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByPatientId(Long patientId);

    List<Invoice> findByStatus(Invoice.Status status);

    List<Invoice> findByAppointmentId(Long appointmentId);

    @Query("SELECT i FROM Invoice i WHERE i.dueDate < :now AND i.status = 'PENDING'")
    List<Invoice> findOverdueInvoices(LocalDateTime now);

    @Query("SELECT SUM(i.totalAmount) FROM Invoice i WHERE i.patientId = :patientId AND i.status != 'CANCELLED'")
    java.math.BigDecimal getTotalBilledAmount(Long patientId);

    @Query("SELECT SUM(i.paidAmount) FROM Invoice i WHERE i.patientId = :patientId")
    java.math.BigDecimal getTotalPaidAmount(Long patientId);
}

