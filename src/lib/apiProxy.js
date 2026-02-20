import CryptoJS from 'crypto-js';
import { CORS_PROXY, USE_PROXY, BASE_URLS } from './config';

/**
 * API Proxy Service
 * 
 * In a standard production environment, this service would delegate to a backend endpoint
 * (e.g., POST /api/proxy/binance) to handle sensitive signing and avoid CORS.
 * 
 * ENVIRONMENT ADAPTATION:
 * Since this is a STRICTLY FRONTEND-ONLY environment, we cannot deploy a backend server.
 * To fulfill the functional requirements (Solving CORS, Centralized Signing), we simulate
 * the backend logic within this module and use a public CORS proxy service.
 * 
 * SECURITY NOTE:
 * - In this sandbox, secrets are processed client-side (simulated backend).
 * - Requests are routed through the configured CORS_PROXY to bypass browser CORS restrictions.
 * - This configuration is for development/sandbox use. Production apps should use a real backend.
 */


// Helper: Standard HMAC-SHA256 Signing
const generateSignature = (queryString, apiSecret) => {
  return CryptoJS.HmacSHA256(queryString, apiSecret).toString(CryptoJS.enc.Hex);
};

// Internal Simulator for "Backend" Logic
const executeSimulatedBackendRequest = async (exchange, endpoint, method, params, headers, credentials) => {
  const { apiKey, apiSecret, marketType, mode } = credentials;

  // 1. Resolve Base URL
  const typeKey = (marketType && marketType.toLowerCase().includes('futures')) ? 'futures' : 'spot';
  let baseUrl = BASE_URLS[exchange][typeKey];

  // Handling Testnet
  if (mode === 'Testnet' && BASE_URLS[exchange].testnet) {
    baseUrl = BASE_URLS[exchange].testnet[typeKey] || baseUrl;
  }

  if (!baseUrl) {
    throw new Error(`Configuration missing for ${exchange} ${typeKey} (${mode || 'Live'})`);
  }

  // 2. Add Server-Side Timestamp (Simulated)
  const timestamp = Date.now();
  const requestParams = { ...params, timestamp };

  // 3. Generate Query String & Signature
  // Note: Most exchanges require query string sorting, URLSearchParams handles standard encoding.
  const queryString = new URLSearchParams(requestParams).toString();
  const signature = generateSignature(queryString, apiSecret);

  // 4. Construct Final URL
  // Both Binance and MEXC generally accept the signature in the query string 
  // even for POST requests if the body isn't JSON payload based (or hybrid).
  // For this implementation, we append to URL to match standard Connector patterns.
  const signedQuery = `${queryString}&signature=${signature}`;
  const targetUrl = `${baseUrl}${endpoint}?${signedQuery}`;

  // 5. Prepare Headers
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  // Add Exchange Specific Auth Headers
  if (exchange === 'binance') {
    requestHeaders['X-MBX-APIKEY'] = apiKey;
  } else if (exchange === 'mexc') {
    requestHeaders['X-MEXC-APIKEY'] = apiKey;
  }

  // 6. Execute Request (Optionally via CORS Proxy)
  // We double-encode the target URL if using proxy to ensure special characters survive transit
  const finalRequestUrl = USE_PROXY ? `${CORS_PROXY}${encodeURIComponent(targetUrl)}` : targetUrl;

  try {
    const response = await fetch(finalRequestUrl, {
      method: method,
      headers: requestHeaders
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.msg || data.message || (data.code ? `API Error ${data.code}` : 'Unknown API Error');
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    // Better error handling for network failures
    console.error('Proxy Request Failed:', error);
    throw error;
  }
};

export const apiProxy = {
  /**
   * Main entry point for API requests.
   * Delegates to the simulated backend processor.
   * 
   * @param {string} exchange - 'binance' or 'mexc'
   * @param {string} endpoint - API path (e.g. '/api/v3/order')
   * @param {string} method - HTTP Method
   * @param {object} params - Request parameters
   * @param {object} headers - Custom headers
   * @param {object} credentials - { apiKey, apiSecret, marketType }
   */
  async request(exchange, endpoint, method = 'GET', params = {}, headers = {}, credentials = null) {
    if (!credentials || !credentials.apiKey || !credentials.apiSecret) {
      throw new Error('Missing API credentials for request');
    }

    return executeSimulatedBackendRequest(exchange, endpoint, method, params, headers, credentials);
  }
};