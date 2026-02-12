ALTER TABLE reminders
  ADD COLUMN couple_id varchar;

UPDATE reminders AS r
SET couple_id = ct.couple_id
FROM checklist_tasks AS ct
WHERE ct.linked_reminder_id = r.id;

UPDATE reminders AS r
SET couple_id = n.recipient_id
FROM notifications AS n
WHERE r.couple_id IS NULL
  AND r.notification_id = n.id
  AND n.recipient_type = 'couple';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM reminders WHERE couple_id IS NULL) THEN
    RAISE EXCEPTION 'reminders.couple_id backfill incomplete after fallback mapping';
  END IF;
END $$;

ALTER TABLE reminders
  ALTER COLUMN couple_id SET NOT NULL;

ALTER TABLE reminders
  ADD CONSTRAINT reminders_couple_id_fkey
  FOREIGN KEY (couple_id) REFERENCES couple_profiles(id)
  ON DELETE CASCADE;
