# 🚄 Railway Deployment Guide (5 Minutes)

Railway is the fastest way to deploy your API with automatic HTTPS, monitoring, and GitHub integration.

## Step 1: Railway Account Setup (2 minutes)

1. **Visit**: https://railway.app/
2. **Sign Up**: Click "Login" → "GitHub" → Authorize Railway
3. **Dashboard**: You'll see the Railway dashboard

## Step 2: Deploy Your API (2 minutes)

1. **New Project**: Click "New Project"
2. **Deploy from GitHub repo**: Select this option
3. **Choose Repository**: Find and select `Flexipie/CryptoAPI`
4. **Auto-Deploy**: Railway detects your Dockerfile automatically
5. **Environment**: Railway uses your existing configuration

## Step 3: Configure Environment Variables (1 minute)

1. **Click your project** → **Variables tab**
2. **Add these variables**:
```
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
ENABLE_REDIS=false
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=3600000
```

3. **Optional Redis**: Add Redis service from Railway marketplace
   - If you add Redis, set `ENABLE_REDIS=true`
   - Railway will auto-provide `REDIS_URL`

## Step 4: Get Your API URL

1. **Deployments Tab**: Wait for build to complete (2-3 minutes)
2. **Generate Domain**: Click "Generate Domain"
3. **Your API URL**: Something like `https://cryptoapi-production-xyz.up.railway.app`

## Step 5: Test Your Deployed API

```bash
# Test health endpoint
curl https://your-railway-url.up.railway.app/api/v1/health

# Test crypto endpoint
curl https://your-railway-url.up.railway.app/api/v1/crypto/popular

# View documentation
open https://your-railway-url.up.railway.app/docs
```

## Railway Benefits for RapidAPI

✅ **Free Tier**: $5 credit monthly (enough for testing)
✅ **Auto HTTPS**: SSL certificates included
✅ **Auto Scaling**: Handles traffic spikes
✅ **GitHub Integration**: Auto-deploys on commits
✅ **Built-in Monitoring**: Logs, metrics, uptime
✅ **Redis Add-on**: One-click Redis setup
✅ **Custom Domains**: Easy domain mapping
✅ **99.9% Uptime**: Production-grade reliability

## Cost Estimate

- **Development**: FREE ($5 monthly credit)
- **Light Production**: ~$5-10/month
- **High Traffic**: $20-50/month (scales automatically)

## Alternative: Custom Domain (Optional)

1. **Buy Domain**: e.g., `cryptofx-api.com`
2. **Railway Settings**: Add custom domain
3. **DNS Setup**: Point CNAME to Railway
4. **Auto SSL**: Railway handles certificates

## Next Steps

Once deployed, you'll have:
- ✅ **Public HTTPS URL**: Ready for RapidAPI
- ✅ **Auto Scaling**: Handles traffic
- ✅ **Monitoring**: Built-in logs/metrics
- ✅ **SSL Certificate**: Required for RapidAPI

Your API will be live and ready for RapidAPI Hub listing!

## Troubleshooting

**Build Fails?**
- Check environment variables
- Verify Dockerfile is in root directory
- Check Railway build logs

**Slow Response?**
- Enable Redis for caching
- Check external API timeouts
- Monitor Railway metrics

**Need Help?**
- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app/