export default function handler(req, res) {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ResumeBoost API',
    environment: 'production',
    version: '1.0.0'
  });
}
// Force redeploy Mon Mar  9 23:19:09 EET 2026
