-- Create subscription tiers table
CREATE TABLE subscription_tiers (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  price_nok integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  
  -- Feature limits per tier
  max_inspiration_photos integer NOT NULL DEFAULT 10,
  max_monthly_video_minutes integer NOT NULL DEFAULT 0,
  max_storage_gb integer NOT NULL DEFAULT 5,
  
  -- Features
  has_advanced_analytics boolean NOT NULL DEFAULT false,
  has_prioritized_search boolean NOT NULL DEFAULT false,
  has_custom_landing_page boolean NOT NULL DEFAULT false,
  has_api_access boolean NOT NULL DEFAULT false,
  has_vipps_payment_link boolean NOT NULL DEFAULT false,
  has_custom_branding boolean NOT NULL DEFAULT false,
  
  -- Pricing adjustments
  commission_percentage integer NOT NULL DEFAULT 3,
  stripe_fee_percentage integer NOT NULL DEFAULT 0,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create vendor subscriptions table
CREATE TABLE vendor_subscriptions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vendor_id varchar NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  tier_id varchar NOT NULL REFERENCES subscription_tiers(id),
  
  -- Stripe subscription info
  stripe_subscription_id text,
  stripe_customer_id text,
  
  -- Status
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamp NOT NULL,
  current_period_end timestamp NOT NULL,
  cancelled_at timestamp,
  paused_until timestamp,
  
  -- Auto-renewal
  auto_renew boolean NOT NULL DEFAULT true,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create vendor usage metrics table
CREATE TABLE vendor_usage_metrics (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vendor_id varchar NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL,
  
  -- Usage counts
  inspiration_photos_uploaded integer NOT NULL DEFAULT 0,
  video_minutes_used integer NOT NULL DEFAULT 0,
  storage_used_gb integer NOT NULL DEFAULT 0,
  profile_views_count integer NOT NULL DEFAULT 0,
  messages_sent integer NOT NULL DEFAULT 0,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  UNIQUE(vendor_id, year, month)
);

-- Create vendor payments table
CREATE TABLE vendor_payments (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vendor_id varchar NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  subscription_id varchar REFERENCES vendor_subscriptions(id),
  
  -- Stripe info
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  
  -- Amount in øre (NOK cents)
  amount_nok integer NOT NULL,
  currency text NOT NULL DEFAULT 'NOK',
  
  -- Status
  status text NOT NULL DEFAULT 'pending',
  description text,
  
  billing_period_start timestamp,
  billing_period_end timestamp,
  
  paid_at timestamp,
  failure_reason text,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_vendor_subscriptions_vendor_id ON vendor_subscriptions(vendor_id);
CREATE INDEX idx_vendor_subscriptions_tier_id ON vendor_subscriptions(tier_id);
CREATE INDEX idx_vendor_subscriptions_stripe_subscription_id ON vendor_subscriptions(stripe_subscription_id);
CREATE INDEX idx_vendor_usage_metrics_vendor_id ON vendor_usage_metrics(vendor_id);
CREATE INDEX idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
CREATE INDEX idx_vendor_payments_stripe_payment_intent_id ON vendor_payments(stripe_payment_intent_id);
CREATE INDEX idx_vendor_payments_status ON vendor_payments(status);
CREATE INDEX idx_subscription_tiers_active ON subscription_tiers(is_active);
