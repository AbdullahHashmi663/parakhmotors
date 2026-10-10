'use client';

import React, { useState } from 'react';
import styles from './ApiExplorer.module.css';

interface ApiEndpointDef {
  name: string;
  method: 'GET' | 'POST' | 'PATCH';
  path: string;
  defaultBody?: string;
  description: string;
}

const ENDPOINTS: ApiEndpointDef[] = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/api/health',
    description: 'System operational status and runtime metadata',
  },
  {
    name: 'List Vehicles',
    method: 'GET',
    path: '/api/vehicles?limit=3',
    description: 'Retrieve filtered and paginated vehicle inventory',
  },
  {
    name: 'List Inspections',
    method: 'GET',
    path: '/api/inspections',
    description: 'Retrieve all booked inspection orders',
  },
  {
    name: 'Book Inspection',
    method: 'POST',
    path: '/api/inspections',
    description: 'Submit a new customer inspection booking',
    defaultBody: JSON.stringify(
      {
        customerName: 'Ahmad Khan',
        email: 'ahmad.khan@example.com',
        phone: '+92 300 7654321',
        city: 'Lahore',
        carMake: 'Toyota',
        carModel: 'Land Cruiser LC300',
        carYear: 2023,
        packageType: 'premium',
        preferredDate: '2026-10-18',
        notes: 'Pre-purchase inspection requested before transfer.',
      },
      null,
      2
    ),
  },
  {
    name: 'Sell Car Valuation',
    method: 'POST',
    path: '/api/sell-requests',
    description: 'Submit vehicle for market valuation estimation',
    defaultBody: JSON.stringify(
      {
        sellerName: 'Kamran Siddiqui',
        phone: '+92 321 4433221',
        email: 'kamran.s@example.com',
        city: 'Islamabad',
        brand: 'BMW',
        model: '530e M Sport',
        year: 2022,
        mileage: 26000,
        expectedPrice: 28500000,
      },
      null,
      2
    ),
  },
  {
    name: 'Car Finder Concierge',
    method: 'GET',
    path: '/api/car-finder',
    description: 'Fetch vehicle concierge finder requests',
  },
];

export const ApiExplorer: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeEndpoint = ENDPOINTS[selectedIdx];
  const [requestBody, setRequestBody] = useState<string>(ENDPOINTS[0].defaultBody || '');
  const [responseJson, setResponseJson] = useState<string>('// Click "Send Request" to test endpoint');
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    setIsLoading(true);
    setResponseJson('Executing Next.js Route Handler...');
    setStatusCode(null);
    setLatencyMs(null);

    const startTime = performance.now();
    try {
      const options: RequestInit = {
        method: activeEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (activeEndpoint.method === 'POST' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(activeEndpoint.path, options);
      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);
      setStatusCode(res.status);

      const json = await res.json();
      setResponseJson(JSON.stringify(json, null, 2));
    } catch (err) {
      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);
      setStatusCode(500);
      setResponseJson(
        JSON.stringify(
          {
            error: err instanceof Error ? err.message : 'Network/execution error',
          },
          null,
          2
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="api-status" className={styles.container}>
      <div className="container">
        <div className={styles.headingWrapper}>
          <div className={styles.badge}>
            <span>⚡</span> Full-Stack Next.js 16 Architecture
          </div>
          <h2 className={styles.title}>Live Backend Route Handlers</h2>
          <p className={styles.desc}>
            Interactive testing console for the Next.js App Router API endpoints (`src/app/api/*`).
            Both frontend and backend are running together seamlessly in Next.js.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.tabBar}>
            {ENDPOINTS.map((ep, idx) => (
              <button
                key={ep.name}
                type="button"
                className={`${styles.tab} ${selectedIdx === idx ? styles.tabActive : ''}`}
                onClick={() => {
                  setSelectedIdx(idx);
                  setRequestBody(ep.defaultBody || '');
                }}
              >
                <span
                  className={`${styles.methodBadge} ${
                    ep.method === 'GET'
                      ? styles.methodGet
                      : ep.method === 'POST'
                      ? styles.methodPost
                      : styles.methodPatch
                  }`}
                >
                  {ep.method}
                </span>
                <span>{ep.name}</span>
              </button>
            ))}
          </div>

          <div className={styles.consoleBody}>
            <div className={styles.configCol}>
              <div className={styles.urlBar}>
                <span
                  className={`${styles.methodBadge} ${
                    activeEndpoint.method === 'GET' ? styles.methodGet : styles.methodPost
                  }`}
                >
                  {activeEndpoint.method}
                </span>
                <span className={styles.urlText}>{activeEndpoint.path}</span>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {activeEndpoint.description}
              </div>

              {activeEndpoint.method === 'POST' && (
                <div className={styles.paramRow}>
                  <label className={styles.paramLabel}>JSON Request Payload</label>
                  <textarea
                    className={styles.bodyInput}
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                  />
                </div>
              )}

              <button
                type="button"
                disabled={isLoading}
                onClick={handleSend}
                className={`btn-primary ${styles.sendBtn}`}
              >
                {isLoading ? 'Calling API...' : '▶ Send Request'}
              </button>
            </div>

            <div className={styles.responseCol}>
              <div className={styles.responseMeta}>
                <span>Response</span>
                {statusCode !== null && (
                  <div>
                    <span
                      className={`${styles.statusTag} ${
                        statusCode >= 200 && statusCode < 300
                          ? styles.status200
                          : styles.statusError
                      }`}
                    >
                      {statusCode} OK
                    </span>
                    {latencyMs !== null && (
                      <span style={{ marginLeft: '8px' }}>{latencyMs}ms</span>
                    )}
                  </div>
                )}
              </div>

              <pre className={styles.jsonBox}>{responseJson}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
