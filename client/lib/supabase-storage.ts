import * as FileSystem from "expo-file-system";
import { supabase } from "./supabase-auth";

const BUCKET_NAME = "chat-attachments";

export const uploadChatImage = async (
  imageUri: string,
  conversationId: string,
  senderType: "couple" | "vendor"
): Promise<string> => {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: "base64",
    });

    // Create file name with timestamp and random number
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);

    const fileName = `${senderType}/${conversationId}/${timestamp}-${randomId}.jpg`;

    // Upload to Supabase
    const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, Buffer.from(base64, "base64"), {
      contentType: "image/jpeg",
      upsert: false,
    });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // For private buckets: Get signed URL (valid for 1 hour)
    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(data.path, 3600); // 1 hour expiry

    if (signError) {
      console.error("Error creating signed URL:", signError);
      // Fallback: store the file path and let frontend handle signed URL generation
      return `supabase://${BUCKET_NAME}/${data.path}`;
    }

    return signedData.signedUrl;
  } catch (error) {
    console.error("Error uploading image to Supabase:", error);
    throw error;
  }
};

export const deleteChatImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const filePath = imageUrl.split("/storage/v1/object/public/chat-attachments/")[1];
    if (!filePath) {
      console.warn("Could not extract file path from image URL");
      return;
    }

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  } catch (error) {
    console.error("Error deleting image from Supabase:", error);
  }
};

export const isSupabaseConfigured = (): boolean => {
  return !!supabase && !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
};

export default supabase;
