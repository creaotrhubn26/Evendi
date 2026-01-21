# Wedflow Production Deployment Guide

## Status
- ✅ Frontend: Deployed to Vercel (`https://client-wedflow.vercel.app`)
- ✅ Backend: Deployed to Render (`https://wedflow-api.onrender.com`)
- 🔄 Custom Domains: DNS setup in progress

## DNS Configuration (cPanel)

### What needs to be done:

#### 1. **app.wedflow.no** (Vercel Frontend)
- Go to cPanel DNS Zone Editor
- Find or create `app.wedflow.no` record
- Change from `A` record to `CNAME` record
- **CNAME Value**: `cname.vercel-dns.com`

#### 2. **api.wedflow.no** (Render Backend)
- Go to cPanel DNS Zone Editor
- Find or create `api.wedflow.no` record
- Change from `A` record to `CNAME` record
- **CNAME Value**: `wedflow-api.onrender.com`

#### 3. Delete conflicting records
- Remove these if they exist:
  - `www.app.wedflow.no` (A record)
  - `www.api.wedflow.no` (A record)
  - `wedflow-api.onrender.com.wedflow.no` (CNAME) - This is wrong, delete it

### DNS Propagation
- Wait 10-30 minutes for DNS changes to propagate globally
- Test with: `nslookup app.wedflow.no` or `nslookup api.wedflow.no`

## Vercel Custom Domain Setup

Already attempted to add `app.wedflow.no`. If needed:

```bash
vercel domains add app.wedflow.no
```

Verify in Vercel Dashboard:
- Project: `client`
- Settings → Domains
- Should show `app.wedflow.no` with CNAME target `cname.vercel-dns.com`

## Render Custom Domain Setup

Need to do manually in Render dashboard:

1. Go to https://render.com/dashboard
2. Select `wedflow-api` service
3. Settings → Custom Domain
4. Add `api.wedflow.no`
5. Render will show CNAME target (should be `wedflow-api.onrender.com`)
6. Configure DNS as above

## Environment Variables

### Render Backend (.env)
```
DATABASE_URL=postgresql://...
ADMIN_SECRET=your_secret
NODE_ENV=production
VIPPS_CLIENT_ID=f01169d3-ee34-442b-bd37-2d155ab30df1
VIPPS_CLIENT_SECRET=lQy8Q~uEge6OKDxPFxf8VMT0nNjqwDyeVUR9WaSg
VIPPS_MERCHANT_SERIAL_NUMBER=123456
VIPPS_AUTH_TOKEN=your_auth_token
VIPPS_CALLBACK_URL=https://api.wedflow.no/api/vipps/callback
VIPPS_REDIRECT_URL=https://app.wedflow.no/subscription/return
```

### Vercel Frontend (EXPO_PUBLIC_*)
```
EXPO_PUBLIC_API_BASE=https://api.wedflow.no
EXPO_PUBLIC_DOMAIN=api.wedflow.no
```

Set these in Vercel Dashboard:
- Project Settings → Environment Variables
- Add for `Production` environment

## Testing

After DNS propagation:

```bash
# Test frontend
curl https://app.wedflow.no

# Test backend
curl https://api.wedflow.no/api/app-settings

# Test API with vendor auth
curl -H "Authorization: Bearer your_vendor_token" https://api.wedflow.no/api/vendor/subscription/tiers
```

## Troubleshooting

### CNAME not resolving?
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Check DNS propagation: https://www.whatsmydns.net/

### Render service not responding?
- Check Render dashboard for deployment status
- View logs: Dashboard → `wedflow-api` → Logs
- Verify environment variables are set in Render

### Vercel not responding?
- Check Vercel dashboard for deployment status
- Verify custom domain is added correctly
- Check if SSL certificate is issued (should be automatic)

## Next Steps

1. Configure DNS records in cPanel
2. Wait for DNS propagation
3. Verify domains work
4. Test API endpoints
5. Update mobile app to use production API URLs
