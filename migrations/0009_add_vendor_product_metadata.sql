-- Add metadata column for category-specific product details
ALTER TABLE vendor_products ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for faster JSONB queries
CREATE INDEX idx_vendor_products_metadata ON vendor_products USING gin(metadata);

-- Add comments for documentation
COMMENT ON COLUMN vendor_products.metadata IS 'Category-specific product details (catering, cake, flower, transport, hairmakeup)';
