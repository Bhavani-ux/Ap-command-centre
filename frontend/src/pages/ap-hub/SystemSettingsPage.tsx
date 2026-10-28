import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api.client';

interface Setting {
  id?: string;
  category: string;
  key: string;
  value: string;
  isEncrypted?: boolean;
}

interface SettingsGroup {
  azureAd: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    enabled: boolean;
  };
  emailIntake: {
    email: string;
    imapHost: string;
    imapPort: string;
    imapUser: string;
    imapPassword: string;
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPassword: string;
    enabled: boolean;
  };
}

export const SystemSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const [settings, setSettings] = useState<SettingsGroup>({
    azureAd: {
      tenantId: '',
      clientId: '',
      clientSecret: '',
      enabled: false,
    },
    emailIntake: {
      email: '',
      imapHost: '',
      imapPort: '993',
      imapUser: '',
      imapPassword: '',
      smtpHost: '',
      smtpPort: '587',
      smtpUser: '',
      smtpPassword: '',
      enabled: false,
    },
  });

  const [showSecrets, setShowSecrets] = useState({
    azureClientSecret: false,
    imapPassword: false,
    smtpPassword: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings');
      const settingsData = response.data.data || [];

      const newSettings: SettingsGroup = {
        azureAd: {
          tenantId: '',
          clientId: '',
          clientSecret: '',
          enabled: false,
        },
        emailIntake: {
          email: '',
          imapHost: '',
          imapPort: '993',
          imapUser: '',
          imapPassword: '',
          smtpHost: '',
          smtpPort: '587',
          smtpUser: '',
          smtpPassword: '',
          enabled: false,
        },
      };

      settingsData.forEach((setting: Setting) => {
        if (setting.category === 'azure_ad') {
          if (setting.key === 'tenant_id') newSettings.azureAd.tenantId = setting.value || '';
          if (setting.key === 'client_id') newSettings.azureAd.clientId = setting.value || '';
          if (setting.key === 'client_secret') newSettings.azureAd.clientSecret = setting.value || '';
          if (setting.key === 'enabled') newSettings.azureAd.enabled = setting.value === 'true';
        } else if (setting.category === 'email_intake') {
          if (setting.key === 'email') newSettings.emailIntake.email = setting.value || '';
          if (setting.key === 'imap_host') newSettings.emailIntake.imapHost = setting.value || '';
          if (setting.key === 'imap_port') newSettings.emailIntake.imapPort = setting.value || '993';
          if (setting.key === 'imap_user') newSettings.emailIntake.imapUser = setting.value || '';
          if (setting.key === 'imap_password') newSettings.emailIntake.imapPassword = setting.value || '';
          if (setting.key === 'smtp_host') newSettings.emailIntake.smtpHost = setting.value || '';
          if (setting.key === 'smtp_port') newSettings.emailIntake.smtpPort = setting.value || '587';
          if (setting.key === 'smtp_user') newSettings.emailIntake.smtpUser = setting.value || '';
          if (setting.key === 'smtp_password') newSettings.emailIntake.smtpPassword = setting.value || '';
          if (setting.key === 'enabled') newSettings.emailIntake.enabled = setting.value === 'true';
        }
      });

      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      alert('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAzureAd = async () => {
    try {
      setSaving(true);
      await apiClient.post('/settings/batch', {
        settings: [
          { category: 'azure_ad', key: 'tenant_id', value: settings.azureAd.tenantId },
          { category: 'azure_ad', key: 'client_id', value: settings.azureAd.clientId },
          { category: 'azure_ad', key: 'client_secret', value: settings.azureAd.clientSecret, isEncrypted: true },
          { category: 'azure_ad', key: 'enabled', value: settings.azureAd.enabled.toString() },
        ],
      });
      alert('Azure AD settings saved successfully');
      fetchSettings();
    } catch (error: any) {
      alert(`Failed to save Azure AD settings: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmailIntake = async () => {
    // Validate required fields
    if (!settings.emailIntake.email) {
      alert('Email address is required');
      return;
    }
    if (!settings.emailIntake.imapHost || !settings.emailIntake.imapPort ||
        !settings.emailIntake.imapUser || !settings.emailIntake.imapPassword) {
      alert('All IMAP fields are required (Host, Port, Username, Password)');
      return;
    }

    try {
      setSaving(true);
      await apiClient.post('/settings/batch', {
        settings: [
          { category: 'email_intake', key: 'email', value: settings.emailIntake.email },
          { category: 'email_intake', key: 'imap_host', value: settings.emailIntake.imapHost },
          { category: 'email_intake', key: 'imap_port', value: settings.emailIntake.imapPort },
          { category: 'email_intake', key: 'imap_user', value: settings.emailIntake.imapUser },
          { category: 'email_intake', key: 'imap_password', value: settings.emailIntake.imapPassword, isEncrypted: true },
          { category: 'email_intake', key: 'smtp_host', value: settings.emailIntake.smtpHost },
          { category: 'email_intake', key: 'smtp_port', value: settings.emailIntake.smtpPort },
          { category: 'email_intake', key: 'smtp_user', value: settings.emailIntake.smtpUser },
          { category: 'email_intake', key: 'smtp_password', value: settings.emailIntake.smtpPassword, isEncrypted: true },
          { category: 'email_intake', key: 'enabled', value: settings.emailIntake.enabled.toString() },
        ],
      });
      alert('Email Intake settings saved successfully');
      fetchSettings();
    } catch (error: any) {
      alert(`Failed to save Email Intake settings: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (type: 'azure' | 'email') => {
    try {
      setTestingConnection(type);
      const response = await apiClient.post(`/settings/test-${type}`);
      alert(response.data.message || 'Connection test successful');
    } catch (error: any) {
      alert(`Connection test failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setTestingConnection(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">Configure integrations and services</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">What's Required?</h3>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Email Intake:</strong> Only IMAP credentials are required to receive invoices. SMTP is optional (only needed if you want to send automated acknowledgements to vendors).
            </p>
            <p className="text-sm text-blue-800">
              <strong>Azure AD:</strong> Optional integration for importing users from Microsoft Active Directory.
            </p>
          </div>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-xs text-amber-800">
            All passwords and secrets are encrypted before storage. Only System Admins can access these settings. Changes take effect immediately.
          </p>
        </div>
      </div>

      {/* Azure AD Integration */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Azure AD Integration</h2>
              <p className="text-sm text-gray-600">Microsoft Azure Active Directory credentials</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.azureAd.enabled}
              onChange={(e) => setSettings({
                ...settings,
                azureAd: { ...settings.azureAd, enabled: e.target.checked },
              })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-semibold text-gray-700">Enabled</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tenant ID</label>
            <input
              type="text"
              value={settings.azureAd.tenantId}
              onChange={(e) => setSettings({
                ...settings,
                azureAd: { ...settings.azureAd, tenantId: e.target.value },
              })}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Client ID (Application ID)</label>
            <input
              type="text"
              value={settings.azureAd.clientId}
              onChange={(e) => setSettings({
                ...settings,
                azureAd: { ...settings.azureAd, clientId: e.target.value },
              })}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Client Secret</label>
            <div className="relative">
              <input
                type={showSecrets.azureClientSecret ? 'text' : 'password'}
                value={settings.azureAd.clientSecret}
                onChange={(e) => setSettings({
                  ...settings,
                  azureAd: { ...settings.azureAd, clientSecret: e.target.value },
                })}
                placeholder="Enter client secret"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowSecrets({
                  ...showSecrets,
                  azureClientSecret: !showSecrets.azureClientSecret,
                })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showSecrets.azureClientSecret ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSaveAzureAd}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {saving ? 'Saving...' : 'Save Azure AD Settings'}
          </button>
          <button
            onClick={() => handleTestConnection('azure')}
            disabled={testingConnection === 'azure' || !settings.azureAd.tenantId || !settings.azureAd.clientId}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {testingConnection === 'azure' ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>

      {/* Email Intake Configuration */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Email Intake Configuration</h2>
              <p className="text-sm text-gray-600">Mailbox for receiving invoices (IMAP required, SMTP optional)</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailIntake.enabled}
              onChange={(e) => setSettings({
                ...settings,
                emailIntake: { ...settings.emailIntake, enabled: e.target.checked },
              })}
              className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <span className="text-sm font-semibold text-gray-700">Enabled</span>
          </label>
        </div>

        {/* Email Address */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Intake Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={settings.emailIntake.email}
            onChange={(e) => setSettings({
              ...settings,
              emailIntake: { ...settings.emailIntake, email: e.target.value },
            })}
            placeholder="invoices@cable.kerala.in"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">Vendors will send invoices to this email address</p>
        </div>

        {/* IMAP Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            IMAP (Incoming Mail)
            <span className="text-xs font-normal text-red-600 bg-red-50 px-2 py-1 rounded">Required</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                IMAP Host <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={settings.emailIntake.imapHost}
                onChange={(e) => setSettings({
                  ...settings,
                  emailIntake: { ...settings.emailIntake, imapHost: e.target.value },
                })}
                placeholder="imap.gmail.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                IMAP Port <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={settings.emailIntake.imapPort}
                onChange={(e) => setSettings({
                  ...settings,
                  emailIntake: { ...settings.emailIntake, imapPort: e.target.value },
                })}
                placeholder="993"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                IMAP Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={settings.emailIntake.imapUser}
                onChange={(e) => setSettings({
                  ...settings,
                  emailIntake: { ...settings.emailIntake, imapUser: e.target.value },
                })}
                placeholder="invoices@cable.kerala.in"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                IMAP Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecrets.imapPassword ? 'text' : 'password'}
                  value={settings.emailIntake.imapPassword}
                  onChange={(e) => setSettings({
                    ...settings,
                    emailIntake: { ...settings.emailIntake, imapPassword: e.target.value },
                  })}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets({
                    ...showSecrets,
                    imapPassword: !showSecrets.imapPassword,
                  })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showSecrets.imapPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SMTP Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            SMTP (Outgoing Mail)
            <span className="text-xs font-normal text-gray-600 bg-gray-100 px-2 py-1 rounded">Optional - for vendor acknowledgements</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Host</label>
              <input
                type="text"
                value={settings.emailIntake.smtpHost}
                onChange={(e) => setSettings({
                  ...settings,
                  emailIntake: { ...settings.emailIntake, smtpHost: e.target.value },
                })}
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Port</label>
              <input
                type="text"
                value={settings.emailIntake.smtpPort}
                onChange={(e) => setSettings({
                  ...settings,
                  emailIntake: { ...settings.emailIntake, smtpPort: e.target.value },
                })}
                placeholder="587"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Username</label>
              <input
                type="text"
                value={settings.emailIntake.smtpUser}
                onChange={(e) => setSettings({
                  ...settings,
                  emailIntake: { ...settings.emailIntake, smtpUser: e.target.value },
                })}
                placeholder="invoices@cable.kerala.in"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Password</label>
              <div className="relative">
                <input
                  type={showSecrets.smtpPassword ? 'text' : 'password'}
                  value={settings.emailIntake.smtpPassword}
                  onChange={(e) => setSettings({
                    ...settings,
                    emailIntake: { ...settings.emailIntake, smtpPassword: e.target.value },
                  })}
                  placeholder="Enter password"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets({
                    ...showSecrets,
                    smtpPassword: !showSecrets.smtpPassword,
                  })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showSecrets.smtpPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSaveEmailIntake}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {saving ? 'Saving...' : 'Save Email Settings'}
          </button>
          <button
            onClick={() => handleTestConnection('email')}
            disabled={testingConnection === 'email' || !settings.emailIntake.imapHost}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {testingConnection === 'email' ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>
    </div>
  );
};
