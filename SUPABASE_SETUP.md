# Supabase Storage Setup Guide

This guide shows how to set up Supabase Storage for image uploads in Wedflow.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **New Project**
3. Enter your project details:
   - **Name**: wedflow-storage (or your choice)
   - **Database Password**: Save this securely
   - **Region**: Choose one closest to you
4. Wait for the project to be created (~2 minutes)

## Step 2: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy:
   - `Project URL` → This is your `SUPABASE_URL`
   - `anon public` key → This is your `SUPABASE_ANON_KEY`

## Step 3: Create Storage Bucket

1. Go to **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Name it: `chat-attachments`
4. Make it **Public** (allow list access without authentication)
5. Click **Create bucket**

## Step 4: Update Environment Variables

Add to your `.env.local` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Example:
```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 5: Set Storage Policies (Optional)

To allow authenticated users only:

1. Go to **Storage** → **chat-attachments** → **Policies**
2. Click **New Policy**
3. Select **For authenticated users**
4. Choose **SELECT** and **INSERT** operations
5. Click **Save**

(For now, you can keep it public for easier testing)

## How It Works

When users send images:

1. **Image selected** → Compressed to base64
2. **Upload starts** → Sent to Supabase Storage
3. **File stored** → In `chat-attachments/{couple|vendor}/{conversationId}/{timestamp-random}.jpg`
4. **Public URL returned** → Saved in database
5. **Display image** → From Supabase URL in messages

## Fallback Mode

If Supabase is not configured:
- Images are encoded as base64 data URLs
- Still works for development/testing
- Switch to Supabase URLs once configured

## Pricing

**Free Tier:**
- 1 GB storage
- 5 GB bandwidth/month
- More than enough for a wedding app!

**Upgrade when you need:**
- Pro: $25/month (100 GB storage, 50 GB bandwidth)
- Pay as you go: $0.50/GB for storage overage

## Troubleshooting

**"Supabase is not configured" error:**
- Check `.env.local` has both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart the development server
- The app will work with base64 as fallback

**Images not uploading:**
- Check bucket exists and is public
- Verify credentials are correct
- Check network connection
- Look for error in console

**Images not displaying:**
- Check image URL is valid in browser
- Check bucket policy allows public access
- Verify image was uploaded to correct bucket

## Testing

To test image uploads:

1. Start app with `npm run expo:dev`
2. Open chat
3. Tap image icon
4. Select an image
5. Send message
6. Image should display in chat

Check Supabase dashboard → **Storage** → **chat-attachments** to see uploaded files.

## Next Steps

- Set up proper security policies for production
- Add image size limits
- Implement image cleanup for deleted messages
- Add image compression before upload
