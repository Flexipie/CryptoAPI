# Deployment Guide

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access API documentation
open http://localhost:3000/docs
```

### Production Deployment

#### Option 1: Docker Compose (Recommended)
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f api

# Scale API instances
docker-compose up -d --scale api=3
```

#### Option 2: Node.js Direct
```bash
# Build
npm run build

# Set environment variables
export NODE_ENV=production
export REDIS_URL=redis://your-redis-server:6379

# Start
npm start
```

## Environment Variables

### Required
- `NODE_ENV`: `development | production | test`
- `PORT`: Server port (default: 3000)

### Optional
- `REDIS_URL`: Redis connection URL (default: redis://localhost:6379)
- `ENABLE_REDIS`: Enable Redis caching (default: true)
- `CACHE_TTL_SECONDS`: Cache expiration time (default: 300)
- `RATE_LIMIT_MAX`: Max requests per window (default: 100)
- `LOG_LEVEL`: Logging level (default: info)

## API Endpoints

### Root
- `GET /` - API information

### Health
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed system status
- `GET /api/v1/ready` - Kubernetes readiness probe
- `GET /api/v1/live` - Kubernetes liveness probe

### Cryptocurrency
- `GET /api/v1/crypto/popular` - Popular cryptocurrencies
- `GET /api/v1/crypto/prices?ids=bitcoin,ethereum&vs_currencies=usd,eur` - Specific prices
- `GET /api/v1/crypto/chart/bitcoin?vs_currency=usd&days=7` - Historical chart data
- `GET /api/v1/crypto/info/bitcoin` - Detailed coin information
- `GET /api/v1/crypto/list` - All supported cryptocurrencies

### Foreign Exchange
- `GET /api/v1/forex/rates` - Current ECB exchange rates
- `GET /api/v1/forex/convert?from=USD&to=EUR&amount=100` - Currency conversion
- `GET /api/v1/forex/historical?days=30` - Historical rates
- `GET /api/v1/forex/currencies` - Supported currencies

### Documentation
- `GET /docs` - Interactive Swagger UI

## Performance & Monitoring

### Expected Performance
- **Response Times**: < 100ms cached, < 500ms uncached
- **Throughput**: 1000+ requests/minute per instance
- **Memory Usage**: ~50MB per instance
- **Cache Hit Rate**: 95%+ in production

### Monitoring Endpoints
Use `/api/v1/health/detailed` for comprehensive monitoring including:
- Memory usage
- Cache statistics
- External service availability
- Overall health status

### Scaling
- Horizontal scaling: Use Docker Compose or Kubernetes
- Redis caching: Shared across all instances
- Rate limiting: Per-IP across all instances

## Troubleshooting

### Common Issues

**External API Timeouts**
- Services gracefully degrade to cached data
- Check `/api/v1/health/detailed` for service status

**Redis Connection Issues**
- API automatically falls back to in-memory caching
- No impact on functionality, only cache distribution

**High Memory Usage**
- Reduce `MEMORY_CACHE_SIZE` environment variable
- Enable Redis to offload memory cache

### Logs
```bash
# View production logs
docker-compose logs -f api

# Debug logging
LOG_LEVEL=debug npm run dev
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Redis server available (optional but recommended)
- [ ] Health checks configured (`/api/v1/ready`, `/api/v1/live`)
- [ ] Monitoring alerts set up
- [ ] Rate limiting configured for your use case
- [ ] Load balancer configured (if multi-instance)
- [ ] SSL/TLS termination configured
- [ ] Log aggregation configured

## Security Notes

- No API keys required for data sources
- Rate limiting enabled by default
- CORS configured for production domains
- Security headers applied via Helmet
- Input validation on all endpoints
- Non-root Docker user
- No sensitive data in logs