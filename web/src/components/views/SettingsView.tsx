import React, { useState } from 'react';

interface SettingsViewProps {
  onShowToast: (title: string, description?: string, variant?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast }) => {
  const [raftElectionTimeout, setRaftElectionTimeout] = useState('300ms');
  const [heartbeatInterval, setHeartbeatInterval] = useState('50ms');
  const [walSyncMode, setWalSyncMode] = useState('fsync-direct');
  const [snapshotInterval, setSnapshotInterval] = useState('10000');
  const [encryptionAtRest, setEncryptionAtRest] = useState(true);
  const [tlsMutualAuth, setTlsMutualAuth] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/X00');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast('Settings Saved', 'Cluster consensus and WAL engine config committed.', 'success');
  };

  return (
    <div className="flex flex-col w-full pb-16 font-mono">
      {/* Header */}
      <div className="px-8 py-6 bg-[#0a0e17] border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1c1f29] border border-[#1e293b] flex items-center justify-center text-[#38bdf8]">
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </div>
          <div>
            <h1 className="font-['Geist'] text-[24px] font-bold text-[#dfe2ef]">
              Settings &amp; Cluster Configuration
            </h1>
            <p className="text-[12px] text-[#87929a]">
              Manage Raft consensus algorithms, write-ahead log (WAL) sync, and security fencing
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-4xl flex flex-col gap-6">
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Section 1: Consensus Engine */}
          <div className="p-6 rounded-xl bg-[#181b25] border border-[#1e293b] shadow-md flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <span className="material-symbols-outlined text-[#38bdf8] text-[20px]">
                device_hub
              </span>
              <h2 className="font-['Geist'] text-[16px] font-bold text-[#dfe2ef]">
                Raft Consensus &amp; Epoch Fencing
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
              <div>
                <label className="block text-[#87929a] mb-1 font-semibold">
                  Election Timeout
                </label>
                <select
                  value={raftElectionTimeout}
                  onChange={(e) => setRaftElectionTimeout(e.target.value)}
                  className="w-full bg-[#070a10] border border-[#334155] rounded-lg p-2.5 text-[#dfe2ef] outline-none focus:border-[#38bdf8]"
                >
                  <option value="150ms">150ms (Aggressive)</option>
                  <option value="300ms">300ms (Recommended)</option>
                  <option value="500ms">500ms (Conservative)</option>
                </select>
                <span className="text-[10px] text-[#87929a] mt-1 block">
                  Heartbeat lost interval before leader reelection is triggered.
                </span>
              </div>

              <div>
                <label className="block text-[#87929a] mb-1 font-semibold">
                  Heartbeat Dispatch Interval
                </label>
                <select
                  value={heartbeatInterval}
                  onChange={(e) => setHeartbeatInterval(e.target.value)}
                  className="w-full bg-[#070a10] border border-[#334155] rounded-lg p-2.5 text-[#dfe2ef] outline-none focus:border-[#38bdf8]"
                >
                  <option value="25ms">25ms</option>
                  <option value="50ms">50ms (Default)</option>
                  <option value="100ms">100ms</option>
                </select>
                <span className="text-[10px] text-[#87929a] mt-1 block">
                  Broadcast frequency of monotonic term tokens across cluster.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Storage & WAL Engine */}
          <div className="p-6 rounded-xl bg-[#181b25] border border-[#1e293b] shadow-md flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <span className="material-symbols-outlined text-[#c0c1ff] text-[20px]">
                storage
              </span>
              <h2 className="font-['Geist'] text-[16px] font-bold text-[#dfe2ef]">
                Write-Ahead Log (WAL) &amp; Storage Engine
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
              <div>
                <label className="block text-[#87929a] mb-1 font-semibold">
                  WAL Disk Sync Strategy
                </label>
                <select
                  value={walSyncMode}
                  onChange={(e) => setWalSyncMode(e.target.value)}
                  className="w-full bg-[#070a10] border border-[#334155] rounded-lg p-2.5 text-[#dfe2ef] outline-none focus:border-[#38bdf8]"
                >
                  <option value="fsync-direct">Fsync-Direct (Strict Durability)</option>
                  <option value="group-commit">Group-Commit (High Throughput)</option>
                  <option value="memory-ring">In-Memory Ring (Transient Bench)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#87929a] mb-1 font-semibold">
                  Snapshot LSN Retention Interval (Records)
                </label>
                <input
                  type="number"
                  value={snapshotInterval}
                  onChange={(e) => setSnapshotInterval(e.target.value)}
                  className="w-full bg-[#070a10] border border-[#334155] rounded-lg p-2.5 text-[#dfe2ef] outline-none focus:border-[#38bdf8]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Security & Encryption */}
          <div className="p-6 rounded-xl bg-[#181b25] border border-[#1e293b] shadow-md flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <span className="material-symbols-outlined text-[#10b981] text-[20px]">
                security
              </span>
              <h2 className="font-['Geist'] text-[16px] font-bold text-[#dfe2ef]">
                Security, Fencing &amp; Mutual TLS
              </h2>
            </div>

            <div className="flex flex-col gap-3 text-[12px]">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={encryptionAtRest}
                  onChange={(e) => setEncryptionAtRest(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#38bdf8] cursor-pointer"
                />
                <div>
                  <span className="text-[#dfe2ef] font-semibold">
                    AES-256-GCM State Tree Encryption at Rest
                  </span>
                  <span className="text-[10px] text-[#87929a] block">
                    All durable step payload variables and checkpoint logs are encrypted before storage.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tlsMutualAuth}
                  onChange={(e) => setTlsMutualAuth(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#38bdf8] cursor-pointer"
                />
                <div>
                  <span className="text-[#dfe2ef] font-semibold">
                    Enforce mTLS Authentication for Inter-Node Mesh
                  </span>
                  <span className="text-[10px] text-[#87929a] block">
                    Cryptographic X.509 client certificate handshake required for worker node registration.
                  </span>
                </div>
              </label>

              <div className="pt-2">
                <label className="block text-[#87929a] mb-1 font-semibold">
                  SLO &amp; Incident Alerting Webhook
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-[#070a10] border border-[#334155] rounded-lg p-2.5 text-[#dfe2ef] outline-none focus:border-[#38bdf8]"
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onShowToast('Settings Reset', 'Restored cluster defaults', 'info')}
              className="px-4 py-2 rounded-lg bg-[#262a34] text-[#bdc8d1] hover:text-[#dfe2ef] text-[12px] cursor-pointer"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#38bdf8] text-[#001e2c] font-['Geist'] text-[13px] font-bold hover:bg-[#7bd0ff] transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Save Cluster Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
