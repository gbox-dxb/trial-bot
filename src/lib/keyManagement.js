import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const ENCRYPTION_SALT_KEY = 'gb-trading-salt-v1';

export const keyManagement = {
  /**
   * Generates a unique encryption key for the user
   */
  _getUserKey(userId) {
    return `${userId}-${ENCRYPTION_SALT_KEY}`;
  },

  // --- DEMO ACCOUNTS SPECIFIC METHODS ---

  /**
   * Save a demo account specifically to 'demoAccounts' storage
   */
  saveDemoAccount(accountData) {
    try {
      const demoAccounts = this.getDemoAccounts();
      
      const newAccount = {
        id: accountData.id || `demo-${uuidv4()}`,
        name: accountData.name || `Demo Account ${demoAccounts.length + 1}`,
        exchange: accountData.exchange || 'Binance',
        type: accountData.type || 'Futures',
        mode: 'Demo',
        balance: parseFloat(accountData.balance) || 10000, // Default 10k
        leverage: accountData.leverage || 20,
        status: 'active',
        createdAt: Date.now(),
        isActive: true,
        apiKey: 'DEMO',
        apiSecret: 'DEMO'
      };

      demoAccounts.push(newAccount);
      localStorage.setItem('demoAccounts', JSON.stringify(demoAccounts));
      return newAccount;
    } catch (error) {
      console.error('Failed to save demo account:', error);
      throw error;
    }
  },

  /**
   * Retrieve all saved demo accounts
   */
  getDemoAccounts() {
    try {
      const data = localStorage.getItem('demoAccounts');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get demo accounts:', error);
      return [];
    }
  },

  /**
   * Get a specific demo account by ID
   */
  getDemoAccountById(accountId) {
    const accounts = this.getDemoAccounts();
    return accounts.find(a => a.id === accountId) || null;
  },

  // --- LIVE ACCOUNTS / COMMON METHODS ---

  /**
   * Save exchange API keys securely (Live accounts)
   */
  saveExchangeKeys(userId, exchange, type, mode, apiKey, apiSecret, name) {
    // If it's a demo account request coming through here, route it to saveDemoAccount
    if (mode === 'Demo') {
       return this.saveDemoAccount({
           exchange, type, name, balance: 10000
       });
    }

    try {
      const userKey = this._getUserKey(userId);
      const accounts = this._getRawExchangeAccounts(userId);
      
      const newAccount = {
        id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        exchange, // 'binance' or 'mexc'
        name: name || `${exchange} ${type} ${mode}`,
        type,     // 'Spot' or 'Futures'
        mode,     // 'Live'
        apiKeyEncrypted: CryptoJS.AES.encrypt(apiKey, userKey).toString(),
        apiSecretEncrypted: CryptoJS.AES.encrypt(apiSecret, userKey).toString(),
        createdAt: Date.now(),
        isActive: true,
        balance: 0 // Will be updated by connector
      };

      accounts.push(newAccount);
      this._saveRawExchangeAccounts(userId, accounts);
      return newAccount;
    } catch (error) {
      console.error('Failed to save keys:', error);
      throw new Error('Failed to encrypt and save API keys');
    }
  },

  /**
   * Internal: Get live exchange accounts from storage
   */
  _getRawExchangeAccounts(userId) {
      try {
        const data = localStorage.getItem(`exchangeAccounts_${userId}`);
        return data ? JSON.parse(data) : [];
      } catch (error) {
        return [];
      }
  },

  /**
   * Internal: Save live exchange accounts to storage
   */
  _saveRawExchangeAccounts(userId, accounts) {
      localStorage.setItem(`exchangeAccounts_${userId}`, JSON.stringify(accounts));
  },

  /**
   * Get ALL exchange accounts for a user (Merges Live and Demo)
   */
  getExchangeAccounts(userId) {
    try {
      const liveAccounts = this._getRawExchangeAccounts(userId);
      const demoAccounts = this.getDemoAccounts();
      return [...liveAccounts, ...demoAccounts];
    } catch (error) {
      console.error('Failed to list accounts:', error);
      return [];
    }
  },

  /**
   * Get specific account with DECRYPTED keys
   */
  getDecryptedKeys(userId, exchangeAccountId) {
    try {
      // First check if it's a demo account
      const demoAccount = this.getDemoAccountById(exchangeAccountId);
      if (demoAccount) {
          return { apiKey: 'DEMO', apiSecret: 'DEMO', ...demoAccount };
      }

      // Then check live accounts
      const accounts = this._getRawExchangeAccounts(userId);
      const account = accounts.find(a => a.id === exchangeAccountId);
      
      if (!account) return null;
      
      // Validate encrypted data existence
      if (!account.apiKeyEncrypted || !account.apiSecretEncrypted) {
        console.warn(`Missing encrypted keys for account ${exchangeAccountId}`);
        return null;
      }

      const userKey = this._getUserKey(userId);
      
      // Attempt decryption
      let apiKey, apiSecret;
      try {
        const bytesKey = CryptoJS.AES.decrypt(account.apiKeyEncrypted, userKey);
        apiKey = bytesKey.toString(CryptoJS.enc.Utf8);
        
        const bytesSecret = CryptoJS.AES.decrypt(account.apiSecretEncrypted, userKey);
        apiSecret = bytesSecret.toString(CryptoJS.enc.Utf8);
      } catch (decryptError) {
        console.error('CryptoJS decryption error:', decryptError);
        return null;
      }

      if (!apiKey || !apiSecret) {
        console.error('Decryption resulted in empty keys');
        return null;
      }

      return {
        ...account,
        apiKey,
        apiSecret
      };
    } catch (error) {
      console.error('Failed to decrypt keys:', error);
      return null;
    }
  },

  /**
   * Delete an exchange account
   */
  deleteExchangeAccount(userId, exchangeAccountId) {
    // Try to delete from demo first
    const demoAccounts = this.getDemoAccounts();
    if (demoAccounts.some(a => a.id === exchangeAccountId)) {
        const filtered = demoAccounts.filter(a => a.id !== exchangeAccountId);
        localStorage.setItem('demoAccounts', JSON.stringify(filtered));
        return;
    }

    // Then try live
    const accounts = this._getRawExchangeAccounts(userId);
    const filtered = accounts.filter(a => a.id !== exchangeAccountId);
    this._saveRawExchangeAccounts(userId, filtered);
  },

  /**
   * Update account details (balance, name, etc.)
   */
  updateAccountDetails(userId, exchangeAccountId, updates) {
    // Check demo first
    const demoAccounts = this.getDemoAccounts();
    const demoIndex = demoAccounts.findIndex(a => a.id === exchangeAccountId);
    if (demoIndex !== -1) {
        demoAccounts[demoIndex] = { ...demoAccounts[demoIndex], ...updates };
        localStorage.setItem('demoAccounts', JSON.stringify(demoAccounts));
        return;
    }

    // Check live
    const accounts = this._getRawExchangeAccounts(userId);
    const index = accounts.findIndex(a => a.id === exchangeAccountId);
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...updates };
      this._saveRawExchangeAccounts(userId, accounts);
    }
  }
};