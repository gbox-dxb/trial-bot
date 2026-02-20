/**
 * Application Configuration
 * 
 * Centralized settings for easy modification.
 */

export const CORS_PROXY = 'https://app-cors.vercel.app/api/proxy?url=';
export const USE_PROXY = false;

export const BASE_URLS = {
    binance: {
        spot: 'https://api.binance.com',
        futures: 'https://fapi.binance.com',
        testnet: {
            spot: 'https://demo-api.binance.com',
            futures: 'https://demo-fapi.binance.com'
        }
    },

    mexc: {
        spot: 'https://api.mexc.com',
        futures: 'https://contract.mexc.com',
        testnet: {
            spot: 'https://api.mexc.com',
            futures: 'https://contract.mexc.com'
        }
    }
};

export const CONFIG = {
    CORS_PROXY,
    USE_PROXY,
    DEFAULT_USER_ID: 'user-1'
};
