package com.ihms.pharmacy.service;

import com.ihms.common.dto.ProductDTO;
import com.ihms.common.exception.BadRequestException;
import com.ihms.common.exception.ResourceNotFoundException;
import com.ihms.pharmacy.entity.Product;
import com.ihms.pharmacy.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public List<ProductDTO> getAllProducts() {
        return productRepository.findByActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ProductDTO getProductById(Long id) {
        return productRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    public ProductDTO getProductBySku(String sku) {
        return productRepository.findBySku(sku)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Product with SKU: " + sku));
    }

    public ProductDTO getProductByBarcode(String barcode) {
        return productRepository.findByBarcode(barcode)
                .map(this::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Product with barcode: " + barcode));
    }

    public List<ProductDTO> getProductsByCategory(String category) {
        return productRepository.findByCategoryAndActiveTrue(category).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ProductDTO> searchProducts(String keyword) {
        return productRepository.searchByKeyword(keyword).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ProductDTO> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ProductDTO> getOutOfStockProducts() {
        return productRepository.findOutOfStockProducts().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<String> getAllCategories() {
        return productRepository.findAllCategories();
    }

    public List<String> getAllBrands() {
        return productRepository.findAllBrands();
    }

    @Transactional
    public ProductDTO createProduct(ProductDTO dto) {
        if (dto.getSku() != null && productRepository.findBySku(dto.getSku()).isPresent()) {
            throw new BadRequestException("Product with SKU already exists: " + dto.getSku());
        }

        Product product = Product.builder()
                .name(dto.getName())
                .sku(dto.getSku() != null ? dto.getSku() : "PRD-" + System.currentTimeMillis())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .subCategory(dto.getSubCategory())
                .brand(dto.getBrand())
                .unitPrice(dto.getUnitPrice())
                .costPrice(dto.getCostPrice())
                .stockQuantity(dto.getStockQuantity() != null ? dto.getStockQuantity() : 0)
                .reorderLevel(dto.getReorderLevel() != null ? dto.getReorderLevel() : 10)
                .maxStockLevel(dto.getMaxStockLevel())
                .unit(dto.getUnit())
                .barcode(dto.getBarcode())
                .supplier(dto.getSupplier())
                .imageUrl(dto.getImageUrl())
                .active(true)
                .taxable(dto.getTaxable() != null ? dto.getTaxable() : true)
                .taxRate(dto.getTaxRate())
                .discountPercent(dto.getDiscountPercent())
                .build();

        Product saved = productRepository.save(product);
        return toDTO(saved);
    }

    @Transactional
    public ProductDTO updateProduct(Long id, ProductDTO dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setCategory(dto.getCategory());
        product.setSubCategory(dto.getSubCategory());
        product.setBrand(dto.getBrand());
        product.setUnitPrice(dto.getUnitPrice());
        product.setCostPrice(dto.getCostPrice());
        product.setReorderLevel(dto.getReorderLevel());
        product.setMaxStockLevel(dto.getMaxStockLevel());
        product.setUnit(dto.getUnit());
        product.setBarcode(dto.getBarcode());
        product.setSupplier(dto.getSupplier());
        product.setImageUrl(dto.getImageUrl());
        product.setTaxable(dto.getTaxable());
        product.setTaxRate(dto.getTaxRate());
        product.setDiscountPercent(dto.getDiscountPercent());

        Product updated = productRepository.save(product);
        return toDTO(updated);
    }

    @Transactional
    public ProductDTO updateStock(Long id, int quantity, boolean isAddition) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        int newStock = isAddition ?
                product.getStockQuantity() + quantity :
                product.getStockQuantity() - quantity;

        if (newStock < 0) {
            throw new BadRequestException("Insufficient stock. Available: " + product.getStockQuantity());
        }

        product.setStockQuantity(newStock);
        Product updated = productRepository.save(product);
        return toDTO(updated);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setActive(false);
        productRepository.save(product);
    }

    private ProductDTO toDTO(Product product) {
        return ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .description(product.getDescription())
                .category(product.getCategory())
                .subCategory(product.getSubCategory())
                .brand(product.getBrand())
                .unitPrice(product.getUnitPrice())
                .costPrice(product.getCostPrice())
                .stockQuantity(product.getStockQuantity())
                .reorderLevel(product.getReorderLevel())
                .maxStockLevel(product.getMaxStockLevel())
                .unit(product.getUnit())
                .barcode(product.getBarcode())
                .supplier(product.getSupplier())
                .imageUrl(product.getImageUrl())
                .active(product.getActive())
                .taxable(product.getTaxable())
                .taxRate(product.getTaxRate())
                .discountPercent(product.getDiscountPercent())
                .createdAt(product.getCreatedAt() != null ? product.getCreatedAt().format(FORMATTER) : null)
                .updatedAt(product.getUpdatedAt() != null ? product.getUpdatedAt().format(FORMATTER) : null)
                .build();
    }
}

