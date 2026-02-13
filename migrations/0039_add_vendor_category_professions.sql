ALTER TABLE vendor_categories ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE vendor_categories ADD COLUMN IF NOT EXISTS dashboard_key text;
ALTER TABLE vendor_categories ADD COLUMN IF NOT EXISTS sort_order integer;
ALTER TABLE vendor_categories ALTER COLUMN sort_order SET DEFAULT 0;

UPDATE vendor_categories
SET
  slug = CASE name
    WHEN 'Fotograf' THEN 'photographer'
    WHEN 'Videograf' THEN 'videographer'
    WHEN 'Blomster' THEN 'florist'
    WHEN 'Catering' THEN 'catering'
    WHEN 'Musikk' THEN 'music'
    WHEN 'Venue' THEN 'venue'
    WHEN 'Kake' THEN 'cake'
    WHEN 'Planlegger' THEN 'planner'
    WHEN 'Hår & Makeup' THEN 'beauty'
    WHEN 'Transport' THEN 'transport'
    WHEN 'Invitasjoner' THEN 'invitations'
    WHEN 'Underholdning' THEN 'entertainment'
    WHEN 'Dekorasjon' THEN 'decoration'
    WHEN 'Konfektyrer' THEN 'confectionery'
    WHEN 'Bar & Drikke' THEN 'bar'
    WHEN 'Fotoboks' THEN 'photobooth'
    WHEN 'Ringer' THEN 'rings'
    WHEN 'Drakt & Dress' THEN 'dress'
    WHEN 'Overnatting' THEN 'accommodation'
    WHEN 'Husdyr' THEN 'pets'
    ELSE slug
  END,
  dashboard_key = CASE name
    WHEN 'Fotograf' THEN 'photographer'
    WHEN 'Videograf' THEN 'videographer'
    WHEN 'Blomster' THEN 'florist'
    WHEN 'Catering' THEN 'caterer'
    WHEN 'Musikk' THEN 'musician'
    WHEN 'Venue' THEN 'venue'
    WHEN 'Kake' THEN 'cake'
    WHEN 'Planlegger' THEN 'coordinator'
    WHEN 'Hår & Makeup' THEN 'hair-makeup'
    WHEN 'Transport' THEN 'transport'
    ELSE dashboard_key
  END,
  sort_order = CASE name
    WHEN 'Fotograf' THEN 10
    WHEN 'Videograf' THEN 20
    WHEN 'Blomster' THEN 30
    WHEN 'Catering' THEN 40
    WHEN 'Musikk' THEN 50
    WHEN 'Venue' THEN 60
    WHEN 'Kake' THEN 70
    WHEN 'Planlegger' THEN 80
    WHEN 'Hår & Makeup' THEN 90
    WHEN 'Transport' THEN 100
    WHEN 'Invitasjoner' THEN 110
    WHEN 'Underholdning' THEN 120
    WHEN 'Dekorasjon' THEN 130
    WHEN 'Konfektyrer' THEN 140
    WHEN 'Bar & Drikke' THEN 150
    WHEN 'Fotoboks' THEN 160
    WHEN 'Ringer' THEN 170
    WHEN 'Drakt & Dress' THEN 180
    WHEN 'Overnatting' THEN 190
    WHEN 'Husdyr' THEN 200
    ELSE sort_order
  END
WHERE slug IS NULL OR dashboard_key IS NULL OR sort_order IS NULL;

UPDATE vendor_categories
SET
  slug = COALESCE(slug, regexp_replace(lower(translate(name, 'æøå', 'aeo')), '[^a-z0-9]+', '-', 'g')),
  dashboard_key = COALESCE(dashboard_key, regexp_replace(lower(translate(name, 'æøå', 'aeo')), '[^a-z0-9]+', '-', 'g')),
  sort_order = COALESCE(sort_order, 0);
