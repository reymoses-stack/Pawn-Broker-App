export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const isProd = payload.environment === 'production';
    const baseUrl = isProd 
      ? 'https://api.cashfree.com/verification' 
      : 'https://sandbox.cashfree.com/verification';
    const clientId = payload.clientId || process.env.VITE_CASHFREE_CLIENT_ID || '';
    const clientSecret = payload.clientSecret || payload.apiKey || process.env.VITE_CASHFREE_CLIENT_SECRET || '';

    if (!clientId || !clientSecret) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cashfree Client ID and Client Secret are required' 
      });
    }

    const url = req.url || '';

    // 1. Test Connection
    if (url.includes('test-connection')) {
      const cfRes = await fetch(`${baseUrl}/offline-aadhaar/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-client-secret': clientSecret,
        },
        body: JSON.stringify({ aadhaar_number: '000000000000' })
      });
      const cfData = await cfRes.json().catch(() => ({}));
      
      if (cfData.code === 'authentication_failed' || cfRes.status === 401) {
        return res.status(401).json({ 
          success: false, 
          message: cfData.message || 'Invalid Cashfree Client ID or Client Secret' 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: `Successfully connected to Cashfree (${isProd ? 'Production' : 'Sandbox'})! Account credentials verified.`,
        environment: isProd ? 'production' : 'sandbox',
        cashfreeResponse: cfData
      });
    }

    // 2. Generate OTP
    if (url.includes('generate-otp')) {
      const cleanAadhaar = String(payload.aadhaarNumber || '').replace(/\D/g, '');
      if (cleanAadhaar.length !== 12) {
        return res.status(400).json({ success: false, message: 'Invalid 12-digit Aadhaar number' });
      }

      let cfRes = await fetch(`${baseUrl}/offline-aadhaar/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-client-secret': clientSecret,
        },
        body: JSON.stringify({ aadhaar_number: cleanAadhaar })
      });
      let cfData = await cfRes.json().catch(() => ({}));

      if (cfRes.status === 404) {
        cfRes = await fetch(`${baseUrl}/aadhaar/otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': clientId,
            'x-client-secret': clientSecret,
          },
          body: JSON.stringify({ aadhaar_number: cleanAadhaar })
        });
        cfData = await cfRes.json().catch(() => ({}));
      }

      if (!cfRes.ok || cfData.code === 'authentication_failed' || cfData.status === 'FAILED') {
        return res.status(cfRes.status || 400).json({ 
          success: false, 
          message: cfData.message || 'Cashfree OTP dispatch failed',
          raw: cfData 
        });
      }

      return res.status(200).json({ 
        success: true, 
        ref_id: cfData.ref_id || cfData.reference_id || cfData.data?.ref_id,
        message: cfData.message || 'OTP sent successfully to Aadhaar-registered mobile',
        raw: cfData 
      });
    }

    // 3. Verify OTP
    if (url.includes('verify-otp')) {
      const otp = String(payload.otp || '').trim();
      const refId = String(payload.refId || payload.transactionId || '').trim();

      if (!otp || !refId) {
        return res.status(400).json({ success: false, message: 'Missing OTP or Reference ID' });
      }

      let cfRes = await fetch(`${baseUrl}/offline-aadhaar/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-client-secret': clientSecret,
        },
        body: JSON.stringify({ otp, ref_id: refId })
      });
      let cfData = await cfRes.json().catch(() => ({}));

      if (cfRes.status === 404) {
        cfRes = await fetch(`${baseUrl}/aadhaar/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': clientId,
            'x-client-secret': clientSecret,
          },
          body: JSON.stringify({ otp, ref_id: refId })
        });
        cfData = await cfRes.json().catch(() => ({}));
      }

      if (!cfRes.ok || cfData.code === 'authentication_failed' || cfData.status === 'FAILED' || cfData.status === 'INVALID') {
        return res.status(cfRes.status || 400).json({ 
          success: false, 
          message: cfData.message || 'OTP verification failed',
          raw: cfData 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data: cfData,
        message: 'Aadhaar e-KYC verified successfully via Cashfree'
      });
    }

    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
}
