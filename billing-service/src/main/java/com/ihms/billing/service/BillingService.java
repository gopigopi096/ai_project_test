package com.ihms.billing.service;

import com.ihms.billing.entity.Invoice;
import com.ihms.billing.entity.InvoiceItem;
import com.ihms.billing.entity.Payment;
import com.ihms.billing.feign.PatientClient;
import com.ihms.billing.repository.InvoiceRepository;
import com.ihms.billing.repository.PaymentRepository;
import com.ihms.common.dto.InvoiceDTO;
import com.ihms.common.dto.InvoiceItemDTO;
import com.ihms.common.dto.PatientDTO;
import com.ihms.common.exception.BadRequestException;
import com.ihms.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final PatientClient patientClient;

    public List<InvoiceDTO> getAllInvoices() {
        return invoiceRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public InvoiceDTO getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
    }

    public List<InvoiceDTO> getInvoicesByPatientId(Long patientId) {
        return invoiceRepository.findByPatientId(patientId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<InvoiceDTO> getInvoicesByStatus(String status) {
        return invoiceRepository.findByStatus(Invoice.Status.valueOf(status.toUpperCase())).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public InvoiceDTO createInvoice(InvoiceDTO dto) {
        Invoice invoice = Invoice.builder()
                .patientId(dto.getPatientId())
                .appointmentId(dto.getAppointmentId())
                .status(Invoice.Status.PENDING)
                .dueDate(LocalDateTime.now().plusDays(30))
                .build();

        BigDecimal total = BigDecimal.ZERO;

        if (dto.getItems() != null) {
            for (InvoiceItemDTO itemDTO : dto.getItems()) {
                InvoiceItem item = InvoiceItem.builder()
                        .description(itemDTO.getDescription())
                        .quantity(itemDTO.getQuantity())
                        .unitPrice(itemDTO.getUnitPrice())
                        .totalPrice(itemDTO.getUnitPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity())))
                        .build();
                invoice.addItem(item);
                total = total.add(item.getTotalPrice());
            }
        }

        invoice.setSubtotal(total);
        invoice.setTaxAmount(BigDecimal.ZERO);
        invoice.setDiscountAmount(BigDecimal.ZERO);
        invoice.setTotalAmount(total);

        Invoice saved = invoiceRepository.save(invoice);
        return toDTO(saved);
    }

    @Transactional
    public InvoiceDTO processPayment(Long invoiceId, BigDecimal amount, String paymentMethod) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        if (invoice.getStatus() == Invoice.Status.PAID) {
            throw new BadRequestException("Invoice is already paid");
        }

        Payment payment = Payment.builder()
                .invoice(invoice)
                .amount(amount)
                .paymentMethod(Payment.PaymentMethod.valueOf(paymentMethod.toUpperCase()))
                .status(Payment.Status.COMPLETED)
                .build();

        paymentRepository.save(payment);

        BigDecimal newPaidAmount = invoice.getPaidAmount().add(amount);
        invoice.setPaidAmount(newPaidAmount);

        if (newPaidAmount.compareTo(invoice.getTotalAmount()) >= 0) {
            invoice.setStatus(Invoice.Status.PAID);
            invoice.setPaidAt(LocalDateTime.now());
        } else {
            invoice.setStatus(Invoice.Status.PARTIAL);
        }

        Invoice updated = invoiceRepository.save(invoice);
        return toDTO(updated);
    }

    @Transactional
    public void cancelInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));

        if (invoice.getStatus() == Invoice.Status.PAID) {
            throw new BadRequestException("Cannot cancel a paid invoice");
        }

        invoice.setStatus(Invoice.Status.CANCELLED);
        invoiceRepository.save(invoice);
    }

    public record PatientBillingSummary(
            Long patientId,
            String patientName,
            BigDecimal totalBilled,
            BigDecimal totalPaid,
            BigDecimal outstanding
    ) {}

    public PatientBillingSummary getPatientBillingSummary(Long patientId) {
        BigDecimal totalBilled = invoiceRepository.getTotalBilledAmount(patientId);
        BigDecimal totalPaid = invoiceRepository.getTotalPaidAmount(patientId);

        if (totalBilled == null) totalBilled = BigDecimal.ZERO;
        if (totalPaid == null) totalPaid = BigDecimal.ZERO;

        String patientName = "Unknown";
        try {
            PatientDTO patient = patientClient.getPatientById(patientId).getData();
            if (patient != null) {
                patientName = patient.getFirstName() + " " + patient.getLastName();
            }
        } catch (Exception e) {
            // Use fallback
        }

        return new PatientBillingSummary(
                patientId,
                patientName,
                totalBilled,
                totalPaid,
                totalBilled.subtract(totalPaid)
        );
    }

    private InvoiceDTO toDTO(Invoice invoice) {
        String patientName = "Unknown";
        try {
            PatientDTO patient = patientClient.getPatientById(invoice.getPatientId()).getData();
            if (patient != null) {
                patientName = patient.getFirstName() + " " + patient.getLastName();
            }
        } catch (Exception e) {
            // Use fallback
        }

        List<InvoiceItemDTO> items = invoice.getItems().stream()
                .map(item -> InvoiceItemDTO.builder()
                        .id(item.getId())
                        .description(item.getDescription())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        return InvoiceDTO.builder()
                .id(invoice.getId())
                .patientId(invoice.getPatientId())
                .patientName(patientName)
                .appointmentId(invoice.getAppointmentId())
                .items(items)
                .totalAmount(invoice.getTotalAmount())
                .paidAmount(invoice.getPaidAmount())
                .status(invoice.getStatus().name())
                .createdAt(invoice.getCreatedAt())
                .paidAt(invoice.getPaidAt())
                .build();
    }
}

