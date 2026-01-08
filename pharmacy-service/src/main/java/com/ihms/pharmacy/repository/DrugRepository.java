package com.ihms.pharmacy.repository;

import com.ihms.pharmacy.entity.Drug;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DrugRepository extends JpaRepository<Drug, Long> {

    Optional<Drug> findBySku(String sku);

    List<Drug> findByCategory(String category);

    List<Drug> findByManufacturer(String manufacturer);

    @Query("SELECT d FROM Drug d WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :name, '%')) " +
           "OR LOWER(d.genericName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Drug> searchByName(String name);

    @Query("SELECT d FROM Drug d WHERE d.stockQuantity <= d.reorderLevel AND d.active = true")
    List<Drug> findLowStockDrugs();

    @Query("SELECT d FROM Drug d WHERE d.expiryDate <= :date AND d.active = true")
    List<Drug> findExpiringDrugs(LocalDate date);

    List<Drug> findByActiveTrue();
}

