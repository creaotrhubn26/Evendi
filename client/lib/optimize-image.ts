import * as ImageManipulator from "expo-image-manipulator";

/**
 * Optimizes an image for use as an icon or thumbnail.
 * Resizes to fit within maxSize x maxSize and compresses to JPEG/PNG.
 *
 * @param uri       – source image URI (local file or content://)
 * @param maxSize   – max width/height in px  (default 256 for icons)
 * @param compress  – JPEG quality 0-1        (default 0.7)
 * @param format    – output format            (default PNG for icons)
 * @returns optimised local URI
 */
export async function optimizeImage(
  uri: string,
  {
    maxSize = 256,
    compress = 0.7,
    format = ImageManipulator.SaveFormat.PNG,
  }: {
    maxSize?: number;
    compress?: number;
    format?: ImageManipulator.SaveFormat;
  } = {},
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxSize, height: maxSize } }],
    { compress, format },
  );
  return result.uri;
}

/** Preset for small icons (game icons, event type icons) – 256px PNG, q0.7 */
export const ICON_PRESET = { maxSize: 256, compress: 0.7, format: ImageManipulator.SaveFormat.PNG } as const;

/** Preset for logos / banners – 512px JPEG, q0.8 */
export const LOGO_PRESET = { maxSize: 512, compress: 0.8, format: ImageManipulator.SaveFormat.JPEG } as const;

/** Preset for larger images (photos, chat attachments) – 1024px JPEG, q0.75 */
export const PHOTO_PRESET = { maxSize: 1024, compress: 0.75, format: ImageManipulator.SaveFormat.JPEG } as const;
