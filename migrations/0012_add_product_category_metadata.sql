-- Add category-specific metadata columns to vendor_products
-- This allows vendors to provide rich, category-specific details that couples need

ALTER TABLE vendor_products ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for better query performance on metadata
CREATE INDEX idx_vendor_products_metadata ON vendor_products USING gin(metadata);

-- Add comment explaining the metadata structure
COMMENT ON COLUMN vendor_products.metadata IS 'Category-specific product details: catering (offersTasteSample, cuisineType, dietary flags), cake (offersTasteSample, cakeStyle, flavors), flowers (itemType, seasonalAvailability), transport (vehicleType, capacity), hairmakeup (serviceType, includesTrialSession)';
