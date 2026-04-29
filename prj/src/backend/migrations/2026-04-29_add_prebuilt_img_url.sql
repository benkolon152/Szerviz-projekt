BEGIN;

ALTER TABLE prebuilt_pc_bundles
ADD COLUMN IF NOT EXISTS img_url TEXT;

-- Backfill the new image column from the Supabase public bucket path.
-- If your uploaded files use .jpg instead of .png, change the suffix below once.
UPDATE prebuilt_pc_bundles
SET img_url = format(
  'https://uavftnxveesjyonfmhak.supabase.co/storage/v1/object/public/partpictures/prebuilts/%s.jpg',
  id
);

-- Keep the existing API working without touching the JS/CJS runtime.
UPDATE prebuilt_pc_bundles
SET image_url = format(
  'https://uavftnxveesjyonfmhak.supabase.co/storage/v1/object/public/partpictures/prebuilts/%s.jpg',
  id
);

CREATE OR REPLACE FUNCTION sync_prebuilt_bundle_image_urls()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.img_url IS NOT NULL AND NEW.img_url <> '' THEN
    NEW.image_url := NEW.img_url;
  ELSIF NEW.image_url IS NOT NULL AND NEW.image_url <> '' THEN
    NEW.img_url := NEW.image_url;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_prebuilt_bundle_image_urls ON prebuilt_pc_bundles;

CREATE TRIGGER trg_sync_prebuilt_bundle_image_urls
BEFORE INSERT OR UPDATE ON prebuilt_pc_bundles
FOR EACH ROW
EXECUTE FUNCTION sync_prebuilt_bundle_image_urls();

COMMIT;
