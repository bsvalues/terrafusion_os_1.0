# 🚀 Terrafusion Quick Start Guide

Get your AI-powered appraisal platform running in minutes!

## ⚡ Immediate Setup (5 minutes)

### 1. Bootstrap Your Environment

```bash
cd terrafusion_rust
./scripts/production_bootstrap.sh
```

### 2. Add Your API Keys

Edit the `.env` file with your credentials:

```bash
# Required for AI functionality
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here

# Optional for enhanced features
GOOGLE_MAPS_API_KEY=your-google-maps-key
MLS_API_KEY=your-mls-key
```

### 3. Start Your Platform

```bash
./scripts/quick_start.sh
```

## 🎯 What You Get Instantly

### **Multi-Agent AI System**

- ✅ **Valuation Agent**: Property assessments with confidence scoring
- ✅ **Compliance Agent**: USPAP and UAD verification
- ✅ **Sketch Agent**: 3D floor plan analysis
- ✅ **RAG Agent**: Knowledge retrieval and Q&A
- ✅ **Data Processing**: Multi-format file handling

### **Legacy Tool Integration**

- ✅ **TOTAL Enhancement**: AI-powered narratives and automation
- ✅ **ClickForms Intelligence**: Auto-population and suggestions
- ✅ **ACI Workflow**: Development tool integration
- ✅ **SFREP Quality Control**: Automated review processes

### **Production APIs**

- ✅ **Property Valuation**: `POST /api/valuation`
- ✅ **Market Analysis**: `POST /api/analysis`
- ✅ **Agent Status**: `GET /api/agents`
- ✅ **Health Monitoring**: `GET /api/health`

## 🧪 Test Your Platform

### Quick API Test

```bash
# Test the valuation endpoint
curl -X POST http://localhost:8080/api/valuation \
  -H "Content-Type: application/json" \
  -d '{
    "address": "123 Main Street",
    "square_feet": 2000,
    "bedrooms": 3,
    "bathrooms": 2.0
  }'
```

### Agent Health Check

```bash
curl http://localhost:8080/api/agents
```

## 🔌 Connect Your Existing Tools

### TOTAL Integration

1. Point TOTAL export folder to: `./uploads/total/`
2. Files automatically enhanced with AI narratives
3. Export enhanced reports back to TOTAL

### ClickForms Integration

1. Configure data sync directory: `./uploads/clickforms/`
2. Forms auto-populated with property intelligence
3. Compliance checking and suggestions enabled

### ACI.dev Integration

```bash
# Run as ACI agent
cargo run -- acidev --mode agent
```

## 📊 Monitor Your Platform

- **API Health**: http://localhost:8080/api/health
- **Agent Status**: http://localhost:8080/api/agents
- **System Metrics**: Available via API endpoints

## 🚀 Next Steps

### Week 1: Beta Testing

1. Invite 5-10 trusted appraisers
2. Test with real property data
3. Collect feedback and iterate

### Week 2: Scale Up

1. Connect MLS data feeds
2. Deploy mobile companion app
3. Add custom business rules

### Month 1: Go to Market

1. Scale to 100+ users
2. Launch marketing campaigns
3. Establish industry partnerships

## 🆘 Need Help?

### Common Issues

- **API Keys**: Make sure OpenAI/Anthropic keys are valid
- **Port Conflicts**: Check if ports 8080/8081 are available
- **Docker Issues**: Ensure Docker and Docker Compose are installed

### Getting Support

- Check the deployment checklist: `DEPLOYMENT_CHECKLIST.md`
- Run diagnostics: `./scripts/test_api.sh`
- Review logs: `docker-compose logs terrafusion-rust`

---

## 🎉 Congratulations!

You now have a production-ready AI appraisal platform that's already ahead of the industry standard. Your Terrafusion system combines cutting-edge AI with seamless legacy integration - exactly what the market needs.

**Ready to revolutionize real estate appraisal? Your platform is live and waiting!**
