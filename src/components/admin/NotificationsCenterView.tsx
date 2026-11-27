import React, { useState, useEffect } from 'react';
import { Bell, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function NotificationsCenterView() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data) {
        setNotifications(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const filtered = notifications.filter((n) => {
    if (filter !== 'all' && n.event_type !== filter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E2D9]">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">Customer Notifications Center</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Real-time audit log of automated order, payment, delivery, and return notifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadNotifications()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold text-ink hover:border-clay transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap gap-2">
        {['all', 'order_placed', 'payment_confirmed', 'shipment_created', 'delivered', 'return_requested', 'cancellation_requested'].map((ev) => (
          <button
            key={ev}
            onClick={() => setFilter(ev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === ev ? 'bg-clay text-white shadow-xs' : 'bg-white border border-[#E8E2D9] text-ink-muted hover:text-ink'
            }`}
          >
            {ev.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* NOTIFICATIONS TABLE */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
          <h3 className="font-serif text-lg font-bold text-ink">Dispatched Events</h3>
          <span className="text-xs text-ink-muted">{filtered.length} Recorded</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-ink-muted">
            <Bell className="w-8 h-8 text-ink-muted mx-auto mb-2" />
            No customer notifications recorded yet for this filter.
          </div>
        ) : (
          <div className="divide-y divide-[#E8E2D9]">
            {filtered.map((item) => (
              <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F0] border border-[#E8E2D9] flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-clay" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink text-xs">{item.title}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {item.channel} · {item.delivery_status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">{item.message}</p>
                  </div>
                </div>

                <div className="text-right sm:shrink-0 text-[11px] text-ink-muted">
                  <span>{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
