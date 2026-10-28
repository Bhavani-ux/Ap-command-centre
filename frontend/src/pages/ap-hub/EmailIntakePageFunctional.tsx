import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api.client';

interface EmailItem {
  id: string;
  messageId: string;
  from: string;
  to: string;
  subject: string;
  body?: string;
  attachmentCount: number;
  status: string;
  isSuspicious: boolean;
  suspicionReasons?: string[];
  receivedAt: string;
}

export const EmailIntakePageFunctional: React.FC = () => {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>(['Awaiting run... Pipeline: Triage → OCR/IDP → Ref # → Tracker → Vendor ACK']);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/email-intake');
      console.log('Email intake response:', response.data);
      setEmails(response.data.emails || []);
    } catch (error: any) {
      console.error('Failed to fetch emails:', error);
      console.error('Error details:', error.response?.data);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const processEmail = async (emailId: string) => {
    try {
      setProcessing(true);
      setSelectedEmail(emailId);
      setPipelineLogs(['[PIPELINE] Starting processing...']);

      const response = await apiClient.post(`/email-intake/${emailId}/process`);

      if (response.data.logs) {
        setPipelineLogs(response.data.logs);
      }

      if (response.data.success) {
        setPipelineLogs(prev => [...prev, `✓ SUCCESS: Invoice ${response.data.referenceNumber} created`]);
        // Refresh email list
        await fetchEmails();
      } else {
        setPipelineLogs(prev => [...prev, `✗ FAILED: ${response.data.error}`]);
      }

    } catch (error: any) {
      console.error('Failed to process email:', error);
      setPipelineLogs(prev => [...prev, `✗ ERROR: ${error.message}`]);
    } finally {
      setProcessing(false);
    }
  };

  const processAllEmails = async () => {
    try {
      setProcessing(true);
      setPipelineLogs(['[BULK] Processing all emails...']);

      const response = await apiClient.post('/email-intake/process-all');

      if (response.data.results) {
        const logs: string[] = [];
        response.data.results.forEach((result: any) => {
          logs.push(`[${result.subject}]: ${result.success ? '✓' : '✗'}`);
          if (result.logs) {
            logs.push(...result.logs.map((log: string) => `  ${log}`));
          }
        });
        setPipelineLogs(logs);
      }

      setPipelineLogs(prev => [
        ...prev,
        ``,
        `✓ Processed: ${response.data.processed}`,
        `✓ Successful: ${response.data.successful}`,
        `✗ Failed: ${response.data.failed}`,
      ]);

      // Refresh email list
      await fetchEmails();

    } catch (error: any) {
      console.error('Failed to process all emails:', error);
      setPipelineLogs(prev => [...prev, `✗ ERROR: ${error.message}`]);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (email: EmailItem) => {
    if (email.isSuspicious) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Suspicious</span>;
    }
    if (email.status === 'processed') {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Processed</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">PDF OK</span>;
  };

  const getPDFName = (subject: string) => {
    const match = subject.match(/[A-Z0-9_-]+\.pdf/i);
    return match ? match[0] : 'attachment.pdf';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email Intake</h1>
        <p className="text-gray-600 mt-1">Single AP mailbox · ingestion pipeline</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Queue */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">ap.invoices@asianet.co.in — Unprocessed ({emails.length})</h2>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                    email.isSuspicious ? 'bg-red-50' : ''
                  } ${selectedEmail === email.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                  onClick={() => setSelectedEmail(email.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                        {email.isSuspicious ? (
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{email.subject}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {email.from} · {getPDFName(email.subject)}
                        </p>
                        {email.isSuspicious && email.suspicionReasons && (
                          <p className="text-xs text-red-600 mt-1">⚠ {email.suspicionReasons[0]}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(email)}
                      {!email.isSuspicious && email.status === 'received' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            processEmail(email.id);
                          }}
                          disabled={processing}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                        >
                          Process Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <div className="p-6 border-t">
            <button
              onClick={processAllEmails}
              disabled={processing || emails.length === 0}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {processing ? 'Processing...' : 'Ingest Mailbox — Run Pipeline'}
            </button>
          </div>
        </div>

        {/* Pipeline Log */}
        <div className="bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded flex items-center justify-center ${processing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Pipeline Log</h2>
          </div>
          <div className="bg-gray-800 rounded p-4 font-mono text-xs text-green-400 min-h-[400px] max-h-[500px] overflow-y-auto">
            {pipelineLogs.map((log, idx) => (
              <div key={idx} className={`mb-1 ${log.includes('✗') || log.includes('ERROR') ? 'text-red-400' : log.includes('✓') || log.includes('SUCCESS') ? 'text-green-400' : 'text-gray-300'}`}>
                {log}
              </div>
            ))}
            {processing && (
              <div className="mt-2 flex items-center gap-2 text-yellow-400">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400"></div>
                Processing...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
