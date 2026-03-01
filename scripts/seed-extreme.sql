BEGIN;

-- Remove previous seed data (safe cleanup scoped to seed emails)
DELETE FROM vendors WHERE email LIKE 'seed.%@evendi.local';
DELETE FROM couple_profiles WHERE email LIKE 'seed.%@evendi.local';

-- Ensure core categories exist
INSERT INTO vendor_categories (id, name, icon, description)
SELECT gen_random_uuid()::text, 'Fotograf', 'camera', 'Bryllupsfotografer'
WHERE NOT EXISTS (SELECT 1 FROM vendor_categories WHERE name = 'Fotograf');

INSERT INTO vendor_categories (id, name, icon, description)
SELECT gen_random_uuid()::text, 'Videograf', 'video', 'Bryllupsvideo og film'
WHERE NOT EXISTS (SELECT 1 FROM vendor_categories WHERE name = 'Videograf');

INSERT INTO vendor_categories (id, name, icon, description)
SELECT gen_random_uuid()::text, 'Blomster', 'flower', 'Blomster og dekor'
WHERE NOT EXISTS (SELECT 1 FROM vendor_categories WHERE name = 'Blomster');

INSERT INTO vendor_categories (id, name, icon, description)
SELECT gen_random_uuid()::text, 'Lokale', 'home', 'Lokaler og venues'
WHERE NOT EXISTS (SELECT 1 FROM vendor_categories WHERE name = 'Lokale');

INSERT INTO vendor_categories (id, name, icon, description)
SELECT gen_random_uuid()::text, 'Catering', 'utensils', 'Mat og catering'
WHERE NOT EXISTS (SELECT 1 FROM vendor_categories WHERE name = 'Catering');

INSERT INTO vendor_categories (id, name, icon, description)
SELECT gen_random_uuid()::text, 'Musikk', 'music', 'DJ og live musikk'
WHERE NOT EXISTS (SELECT 1 FROM vendor_categories WHERE name = 'Musikk');

INSERT INTO inspiration_categories (id, name, icon, sort_order)
SELECT gen_random_uuid()::text, 'Bryllup', 'heart', 1
WHERE NOT EXISTS (SELECT 1 FROM inspiration_categories WHERE name = 'Bryllup');

INSERT INTO inspiration_categories (id, name, icon, sort_order)
SELECT gen_random_uuid()::text, 'Detaljer', 'star', 2
WHERE NOT EXISTS (SELECT 1 FROM inspiration_categories WHERE name = 'Detaljer');

-- Seed IDs
CREATE TEMP TABLE seed_ids (key text primary key, id text);
INSERT INTO seed_ids (key, id) VALUES
  ('couple', gen_random_uuid()::text),
  ('vendor_photo', gen_random_uuid()::text),
  ('vendor_video', gen_random_uuid()::text),
  ('vendor_flower', gen_random_uuid()::text),
  ('conversation_photo', gen_random_uuid()::text),
  ('message_photo_1', gen_random_uuid()::text),
  ('message_photo_2', gen_random_uuid()::text),
  ('offer_photo', gen_random_uuid()::text),
  ('contract_photo', gen_random_uuid()::text),
  ('delivery_photo', gen_random_uuid()::text),
  ('guest_1', gen_random_uuid()::text),
  ('guest_2', gen_random_uuid()::text),
  ('guest_3', gen_random_uuid()::text),
  ('guest_4', gen_random_uuid()::text),
  ('table_main', gen_random_uuid()::text),
  ('table_family', gen_random_uuid()::text),
  ('table_friends', gen_random_uuid()::text),
  ('invitation_1', gen_random_uuid()::text),
  ('invitation_2', gen_random_uuid()::text),
  ('speech_1', gen_random_uuid()::text),
  ('speech_2', gen_random_uuid()::text),
  ('schedule_1', gen_random_uuid()::text),
  ('schedule_2', gen_random_uuid()::text),
  ('schedule_3', gen_random_uuid()::text);

-- Seed couple
INSERT INTO couple_profiles (
  id, email, display_name, password, partner_email, wedding_date, event_type, event_category, created_at, updated_at
) VALUES (
  (SELECT id FROM seed_ids WHERE key = 'couple'),
  'seed.couple@evendi.local',
  'Lina & Markus',
  '$2a$10$YsR5VyTSF3gBZjHiO.KeMuGEwEA24eCaD2H2maNs0YZI7V3DzNi..',
  'seed.partner@evendi.local',
  '2026-08-15',
  'wedding',
  'personal',
  now(),
  now()
);

-- Seed vendors
INSERT INTO vendors (
  id, email, password, business_name, organization_number, category_id, description, location, phone, website, price_range, status
) VALUES
  (
    (SELECT id FROM seed_ids WHERE key = 'vendor_photo'),
    'seed.vendor.photo@evendi.local',
    '$2a$10$YsR5VyTSF3gBZjHiO.KeMuGEwEA24eCaD2H2maNs0YZI7V3DzNi..',
    'Fjord Frames Foto',
    '999111222',
    (SELECT id FROM vendor_categories WHERE name = 'Fotograf' ORDER BY name LIMIT 1),
    'Bryllupsfoto med naturlig lys og dokumentarisk stil.',
    'Oslo',
    '+47 900 11 222',
    'https://example.com/fjordframes',
    '20000-45000',
    'approved'
  ),
  (
    (SELECT id FROM seed_ids WHERE key = 'vendor_video'),
    'seed.vendor.video@evendi.local',
    '$2a$10$YsR5VyTSF3gBZjHiO.KeMuGEwEA24eCaD2H2maNs0YZI7V3DzNi..',
    'Nordlys Films',
    '999333444',
    (SELECT id FROM vendor_categories WHERE name = 'Videograf' ORDER BY name LIMIT 1),
    'Kinematisk bryllupsfilm med drone og lydopptak.',
    'Trondheim',
    '+47 900 33 444',
    'https://example.com/nordlysfilms',
    '25000-60000',
    'approved'
  ),
  (
    (SELECT id FROM seed_ids WHERE key = 'vendor_flower'),
    'seed.vendor.flower@evendi.local',
    '$2a$10$YsR5VyTSF3gBZjHiO.KeMuGEwEA24eCaD2H2maNs0YZI7V3DzNi..',
    'Oslo Bloom Florist',
    '999555666',
    (SELECT id FROM vendor_categories WHERE name = 'Blomster' ORDER BY name LIMIT 1),
    'Sesongbaserte buketter og borddekor i skandinavisk stil.',
    'Oslo',
    '+47 900 55 666',
    'https://example.com/oslobloom',
    '8000-25000',
    'approved'
  );

-- Vendor availability
INSERT INTO vendor_availability (vendor_id, date, status, max_bookings, notes)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'vendor_photo'), '2026-08-15', 'available', 2, 'Bryllupshelg i Oslo-omradet'),
  ((SELECT id FROM seed_ids WHERE key = 'vendor_video'), '2026-08-15', 'available', 1, 'Ledig for filmoppdrag'),
  ((SELECT id FROM seed_ids WHERE key = 'vendor_flower'), '2026-08-15', 'available', 3, 'Leverer i Oslo og Akershus');

-- Vendor products
INSERT INTO vendor_products (vendor_id, title, description, unit_price, unit_type, lead_time_days, min_quantity, category_tag, track_inventory, available_quantity, booking_buffer)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'vendor_photo'), 'Heldags fotografering', '10 timer, to fotografer, leveranse innen 4 uker', 320000, 'pakke', 30, 1, 'photo', false, null, 0),
  ((SELECT id FROM seed_ids WHERE key = 'vendor_photo'), 'Forlovelsesfoto', '2 timer fotografering, 40 redigerte bilder', 80000, 'pakke', 14, 1, 'photo', false, null, 0),
  ((SELECT id FROM seed_ids WHERE key = 'vendor_video'), 'Bryllupsfilm', 'Highlight + 3-5 minutters film', 380000, 'pakke', 30, 1, 'video', false, null, 0);

-- Inspiration content
INSERT INTO inspirations (
  vendor_id, category_id, title, description, cover_image_url, price_summary, price_min, price_max, currency, website_url, inquiry_email, inquiry_phone, cta_label, cta_url, allow_inquiry_form, status
) VALUES (
  (SELECT id FROM seed_ids WHERE key = 'vendor_photo'),
  (SELECT id FROM inspiration_categories WHERE name = 'Bryllup' ORDER BY sort_order LIMIT 1),
  'Sommerbryllup ved fjorden',
  'Naturlige og varme bilder med fokus pa ekte oyeblikk.',
  'https://example.com/images/fjord-wedding.jpg',
  'Pakker fra 20 000 NOK',
  20000,
  45000,
  'NOK',
  'https://example.com/fjordframes',
  'kontakt@fjordframes.example',
  '+47 900 11 222',
  'Be om tilbud',
  'https://example.com/fjordframes/contact',
  true,
  'approved'
);

INSERT INTO inspiration_media (inspiration_id, type, url, caption, sort_order)
SELECT i.id, 'image', 'https://example.com/images/fjord-wedding-2.jpg', 'Fjell og fjord', 1
FROM inspirations i
WHERE i.title = 'Sommerbryllup ved fjorden'
ORDER BY i.created_at DESC
LIMIT 1;

-- Couple budget
INSERT INTO couple_budget_settings (couple_id, total_budget, currency)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), 450000, 'NOK');

INSERT INTO couple_budget_items (couple_id, category, label, estimated_cost, actual_cost, is_paid, notes, sort_order)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'couple'), 'venue', 'Lokale', 180000, null, false, 'Inkl. middag', 1),
  ((SELECT id FROM seed_ids WHERE key = 'couple'), 'photo', 'Fotograf', 320000, null, false, 'Heldagspakke', 2),
  ((SELECT id FROM seed_ids WHERE key = 'couple'), 'flowers', 'Blomster', 15000, null, false, 'Buketter + dekor', 3);

-- Checklist tasks
INSERT INTO checklist_tasks (couple_id, title, months_before, category, completed, notes, is_default, sort_order)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'couple'), 'Velg lokale', 12, 'planning', true, 'Besokt to lokaler', false, 1),
  ((SELECT id FROM seed_ids WHERE key = 'couple'), 'Signer fotograf-kontrakt', 10, 'vendors', false, 'Avventer tilbud', false, 2);

-- Important people
INSERT INTO couple_important_people (couple_id, name, role, phone, email, notes, sort_order)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'couple'), 'Sofie Hansen', 'maidofhonor', '+47 900 77 111', 'sofie@example.com', 'Koordinerer antrekk', 1),
  ((SELECT id FROM seed_ids WHERE key = 'couple'), 'Jonas Berg', 'bestman', '+47 900 77 222', 'jonas@example.com', 'Toastmaster backup', 2);

-- Photo shots
INSERT INTO couple_photo_shots (couple_id, title, description, category, completed, sort_order)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'couple'), 'First look ved fjorden', 'Rolig omrade med naturlig lys', 'portraits', false, 1),
  ((SELECT id FROM seed_ids WHERE key = 'couple'), 'Familiebilde', 'Begge familier samlet', 'group', false, 2);

-- Hair & makeup
INSERT INTO couple_hair_makeup_appointments (couple_id, stylist_name, service_type, appointment_type, date, time, location, notes, completed)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), 'Studio Lume', 'Hair + Makeup', 'Trial', '2026-06-20', '10:00', 'Oslo sentrum', 'Ta med inspirasjonsbilder', false);

INSERT INTO couple_hair_makeup_timeline (couple_id, consultation_booked, trial_booked, look_selected, wedding_day_booked, budget)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), true, true, false, true, 12000);

-- Transport
INSERT INTO couple_transport_bookings (couple_id, vehicle_type, provider_name, pickup_time, pickup_location, dropoff_time, dropoff_location, price, notes, confirmed)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), 'Vintage bil', 'Retro Ride', '12:30', 'Brudens hotell', '13:00', 'Vielsessted', 8500, 'Hvitt bielys', false);

INSERT INTO couple_transport_timeline (couple_id, bride_car_booked, groom_car_booked, guest_shuttle_booked, getaway_car_booked, budget)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), true, false, false, false, 12000);

-- Flowers
INSERT INTO couple_flower_appointments (couple_id, florist_name, appointment_type, date, time, location, notes, completed)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), 'Oslo Bloom Florist', 'Consultation', '2026-05-10', '14:00', 'Oslo Bloom Studio', 'Pastellfarger', true);

INSERT INTO couple_flower_timeline (couple_id, florist_selected, consultation_done, mockup_approved, delivery_confirmed, budget)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), true, true, false, false, 18000);

-- Photographer sessions
INSERT INTO couple_photographer_sessions (couple_id, title, date, time, location, duration, photographer_name, notes, completed)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), 'Forlovelsesfoto', '2026-04-12', '18:00', 'Sognsvann', '2t', 'Fjord Frames Foto', 'Kveldssol', true);

INSERT INTO couple_photographer_timeline (couple_id, photographer_selected, session_booked, contract_signed, deposit_paid, budget)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), true, true, false, false, 320000);

-- Videographer sessions
INSERT INTO couple_videographer_sessions (couple_id, title, date, time, location, duration, videographer_name, notes, completed)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), 'Story intervju', '2026-05-02', '16:00', 'Trondheim', '1t', 'Nordlys Films', 'Kort intervju for film', false);

INSERT INTO couple_videographer_timeline (couple_id, videographer_selected, session_booked, contract_signed, deposit_paid, budget)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), true, false, false, false, 380000);

-- Catering
INSERT INTO couple_catering_timeline (couple_id, caterer_selected, tasting_completed, menu_finalized, guest_count_confirmed, guest_count, budget)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), true, true, false, false, 120, 120000);

-- Planner
INSERT INTO couple_planner_meetings (couple_id, planner_name, date, time, location, topic, notes, completed)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), 'Evendi Planlegging', '2026-03-18', '17:30', 'Oslo', 'Oppstartsmote', 'Gikk gjennom prioriteringer', true);

INSERT INTO couple_planner_timeline (couple_id, planner_selected, initial_meeting, contract_signed, deposit_paid, timeline_created, budget)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), true, true, false, false, false, 25000);

-- Venue
INSERT INTO couple_venue_bookings (couple_id, vendor_id, venue_name, date, time, location, capacity, status, is_primary, venue_type, address, max_guests, invited_guests, catering_included, accommodation_available)
VALUES (
  (SELECT id FROM seed_ids WHERE key = 'couple'),
  null,
  'Fjord Lys Selskap',
  '2026-08-15',
  '15:00',
  'Oslofjorden',
  140,
  'confirmed',
  true,
  'Fjord venue',
  'Havneveien 12, Oslo',
  140,
  120,
  true,
  true
);

INSERT INTO couple_venue_timelines (couple_id, venue_selected, venue_visited, contract_signed, deposit_paid, capacity, budget)
VALUES ((SELECT id FROM seed_ids WHERE key = 'couple'), true, true, false, false, 140, 180000);

-- Schedule events
INSERT INTO schedule_events (id, couple_id, time, title, icon, notes, sort_order)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'schedule_1'), (SELECT id FROM seed_ids WHERE key = 'couple'), '12:00', 'Vielse', 'heart', 'Start i kirken', 1),
  ((SELECT id FROM seed_ids WHERE key = 'schedule_2'), (SELECT id FROM seed_ids WHERE key = 'couple'), '15:30', 'Middag', 'coffee', 'Tre retter', 2),
  ((SELECT id FROM seed_ids WHERE key = 'schedule_3'), (SELECT id FROM seed_ids WHERE key = 'couple'), '19:00', 'Første dans', 'music', 'Band spiller', 3);

-- Speeches
INSERT INTO speeches (id, couple_id, speaker_name, role, duration_minutes, sort_order, notes, scheduled_time)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'speech_1'), (SELECT id FROM seed_ids WHERE key = 'couple'), 'Sofie Hansen', 'maidofhonor', 7, 1, 'Rorende tale', '17:00'),
  ((SELECT id FROM seed_ids WHERE key = 'speech_2'), (SELECT id FROM seed_ids WHERE key = 'couple'), 'Jonas Berg', 'bestman', 6, 2, 'Humor og minner', '17:15');

-- Guests
INSERT INTO wedding_guests (id, couple_id, name, email, phone, category, status, dietary_requirements, notes, plus_one, plus_one_name)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'guest_1'), (SELECT id FROM seed_ids WHERE key = 'couple'), 'Kari Nilsen', 'kari@example.com', '+47 900 00 111', 'family', 'confirmed', 'Vegetarian', 'Kusine', false, null),
  ((SELECT id FROM seed_ids WHERE key = 'guest_2'), (SELECT id FROM seed_ids WHERE key = 'couple'), 'Ola Nilsen', 'ola@example.com', '+47 900 00 222', 'family', 'confirmed', null, 'Onkel', false, null),
  ((SELECT id FROM seed_ids WHERE key = 'guest_3'), (SELECT id FROM seed_ids WHERE key = 'couple'), 'Maja Berg', 'maja@example.com', '+47 900 00 333', 'friends', 'pending', null, null, true, 'Jonas Berg'),
  ((SELECT id FROM seed_ids WHERE key = 'guest_4'), (SELECT id FROM seed_ids WHERE key = 'couple'), 'Erik Larsen', 'erik@example.com', '+47 900 00 444', 'colleagues', 'declined', null, 'Kollega', false, null);

-- Tables
INSERT INTO wedding_tables (id, couple_id, table_number, name, category, label, seats, is_reserved, notes, vendor_notes, sort_order)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'table_main'), (SELECT id FROM seed_ids WHERE key = 'couple'), 1, 'Hovedbord', 'main', 'Hovedbord', 8, false, 'Narmest scenen', 'Dekor: hvite roser', 1),
  ((SELECT id FROM seed_ids WHERE key = 'table_family'), (SELECT id FROM seed_ids WHERE key = 'couple'), 2, 'Familiebord', 'family', 'Familie', 8, false, null, null, 2),
  ((SELECT id FROM seed_ids WHERE key = 'table_friends'), (SELECT id FROM seed_ids WHERE key = 'couple'), 3, 'Vennebord', 'friends', 'Venner', 8, false, null, null, 3);

INSERT INTO table_guest_assignments (couple_id, table_id, guest_id, seat_number)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'couple'), (SELECT id FROM seed_ids WHERE key = 'table_family'), (SELECT id FROM seed_ids WHERE key = 'guest_1'), 1),
  ((SELECT id FROM seed_ids WHERE key = 'couple'), (SELECT id FROM seed_ids WHERE key = 'table_family'), (SELECT id FROM seed_ids WHERE key = 'guest_2'), 2),
  ((SELECT id FROM seed_ids WHERE key = 'couple'), (SELECT id FROM seed_ids WHERE key = 'table_friends'), (SELECT id FROM seed_ids WHERE key = 'guest_3'), 1);

-- Guest invitations
INSERT INTO guest_invitations (id, couple_id, name, email, phone, template, message, invite_token, status)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'invitation_1'), (SELECT id FROM seed_ids WHERE key = 'couple'), 'Kari Nilsen', 'kari@example.com', '+47 900 00 111', 'classic', 'Gleder oss til a feire med deg!', 'INVITEKARI123', 'sent'),
  ((SELECT id FROM seed_ids WHERE key = 'invitation_2'), (SELECT id FROM seed_ids WHERE key = 'couple'), 'Maja Berg', 'maja@example.com', '+47 900 00 333', 'floral', 'Ta med dansesko', 'INVITEMAJA456', 'pending');

-- Coordinator invitation
INSERT INTO coordinator_invitations (couple_id, email, name, role_label, access_token, access_code, can_view_speeches, can_view_schedule, status)
VALUES (
  (SELECT id FROM seed_ids WHERE key = 'couple'),
  'toastmaster@example.com',
  'Toastmaster Ole',
  'Toastmaster',
  'COORDTOKEN123',
  '123456',
  true,
  true,
  'active'
);

-- Conversation + messages
INSERT INTO conversations (id, couple_id, vendor_id, status, last_message_at, couple_unread_count, vendor_unread_count)
VALUES (
  (SELECT id FROM seed_ids WHERE key = 'conversation_photo'),
  (SELECT id FROM seed_ids WHERE key = 'couple'),
  (SELECT id FROM seed_ids WHERE key = 'vendor_photo'),
  'active',
  now(),
  0,
  0
);

INSERT INTO messages (id, conversation_id, sender_type, sender_id, body, created_at)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'message_photo_1'), (SELECT id FROM seed_ids WHERE key = 'conversation_photo'), 'couple', (SELECT id FROM seed_ids WHERE key = 'couple'), 'Hei! Vi vil gjerne booke heldagspakke.', now() - interval '2 days'),
  ((SELECT id FROM seed_ids WHERE key = 'message_photo_2'), (SELECT id FROM seed_ids WHERE key = 'conversation_photo'), 'vendor', (SELECT id FROM seed_ids WHERE key = 'vendor_photo'), 'Takk! Jeg kan tilby 32 000 NOK inkludert forlovelsesfoto.', now() - interval '1 day');

-- Offers + contract
INSERT INTO vendor_offers (id, vendor_id, couple_id, conversation_id, title, message, status, total_amount, currency, valid_until, accepted_at, created_at, updated_at)
VALUES (
  (SELECT id FROM seed_ids WHERE key = 'offer_photo'),
  (SELECT id FROM seed_ids WHERE key = 'vendor_photo'),
  (SELECT id FROM seed_ids WHERE key = 'couple'),
  (SELECT id FROM seed_ids WHERE key = 'conversation_photo'),
  'Heldagspakke + forlovelsesfoto',
  'Inkluderer 10 timer + forlovelsesfoto.',
  'accepted',
  320000,
  'NOK',
  now() + interval '10 days',
  now() - interval '1 day',
  now() - interval '2 days',
  now() - interval '1 day'
);

INSERT INTO vendor_offer_items (offer_id, title, description, quantity, unit_price, line_total, sort_order)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'offer_photo'), 'Heldag fotografering', '10 timer + redigering', 1, 320000, 320000, 1);

INSERT INTO couple_vendor_contracts (id, couple_id, vendor_id, offer_id, status, vendor_role, notify_on_schedule_changes, notify_on_speech_changes, can_view_schedule, can_view_speeches, can_view_table_seating, notify_on_table_changes)
VALUES (
  (SELECT id FROM seed_ids WHERE key = 'contract_photo'),
  (SELECT id FROM seed_ids WHERE key = 'couple'),
  (SELECT id FROM seed_ids WHERE key = 'vendor_photo'),
  (SELECT id FROM seed_ids WHERE key = 'offer_photo'),
  'active',
  'photographer',
  true,
  true,
  true,
  true,
  true,
  true
);

-- Vendor review
INSERT INTO vendor_reviews (contract_id, couple_id, vendor_id, rating, title, body, is_anonymous, is_approved, approved_at)
VALUES (
  (SELECT id FROM seed_ids WHERE key = 'contract_photo'),
  (SELECT id FROM seed_ids WHERE key = 'couple'),
  (SELECT id FROM seed_ids WHERE key = 'vendor_photo'),
  5,
  'Fantastisk samarbeid',
  'Veldig profesjonell og rolig pa dagen. Bildene ble nydelige.',
  false,
  true,
  now()
);

-- Delivery
INSERT INTO deliveries (id, vendor_id, couple_name, couple_email, access_code, title, description, wedding_date, status)
VALUES (
  (SELECT id FROM seed_ids WHERE key = 'delivery_photo'),
  (SELECT id FROM seed_ids WHERE key = 'vendor_photo'),
  'Lina & Markus',
  'seed.couple@evendi.local',
  'EVND8X1A',
  'Bryllupsleveranse',
  'Galleri og filmfiler',
  '2026-08-15',
  'active'
);

INSERT INTO delivery_items (delivery_id, type, label, url, description, sort_order)
VALUES
  ((SELECT id FROM seed_ids WHERE key = 'delivery_photo'), 'gallery', 'Hovedgalleri', 'https://example.com/gallery/main', 'Utvalg av bilder', 1),
  ((SELECT id FROM seed_ids WHERE key = 'delivery_photo'), 'download', 'Full pakke', 'https://example.com/downloads/full.zip', 'Alle bilder i full opplosning', 2);

COMMIT;
