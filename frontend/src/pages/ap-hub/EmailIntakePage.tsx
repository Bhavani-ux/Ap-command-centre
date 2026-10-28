import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api.client';

interface EmailItem {
  id: string;
  subject: string;
  from: string;
  attachment?: string;
  status: string;
  isSuspicious?: boolean;
  attachmentCount?: number;
}

export const EmailIntakePage: React.FC = () => {
  const [emails, setEmails] = useState<EmailItem[]>([
    {
      id: '1',
      subject: 'JioStar_E-96761_Oct Carriage Fee',
      from: 'billing@jiostar.com',
      attachment: 'INV_E96761.pdf',
      status: 'PDF OK',
    },
    {
      id: '2',
      subject: 'Sterlite_NW-7567_OFC Supply Batch 12',
      from: 'accounts@sterlite.com',
      attachment: 'Sterlite_7567.pdf',
      status: 'PDF OK',
    },
    {
      id: '3',
      subject: 'KSEB Pole Rental — Kochi Division Q3',
      from: 'noreply@kseb.in',
      attachment: 'KSEB_Q3.pdf',
      status: 'PDF OK',
    },
    {
      id: '4',
      subject: 'You WON 10 Crore!! Claim now',
      from: 'win-lottery@freemoney.biz',
      attachment: 'claim.exe',
      status: 'Suspicious',
      suspicious: true,
    },
    {
      id: '5',
      subject: 'Thrissur Alliance — Sept Commission Settlement',
      from: 'lco.thrissur@gmail.com',
      attachment: 'LCO_Sept.pdf',
      status: 'PDF OK',
    },
  ]);

  const [pipelineLog] = useState([
    'Awaiting run... Pipeline: Triage → OCR/IDP → Ref # → Tracker → Vendor ACK',
  ]);

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
                <h2 className="text-lg font-semibold">ap.invoices@asianet.co.in — Unprocessed (5)</h2>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  email.suspicious ? 'bg-red-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                      {email.suspicious ? (
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
                        {email.from} · {email.attachment}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        email.suspicious
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {email.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="p-6 border-t">
            <button className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Ingest Mailbox — Run Pipeline
            </button>
          </div>
        </div>

        {/* Pipeline Log */}
        <div className="bg-gray-900 rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Pipeline Log</h2>
          </div>
          <div className="bg-gray-800 rounded p-4 font-mono text-sm text-green-400 min-h-[300px]">
            {pipelineLog.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
