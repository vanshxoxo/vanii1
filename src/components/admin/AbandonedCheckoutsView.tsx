import React from 'react';
import { Clock, Mail } from 'lucide-react';
import { formatINR } from '../../data';

interface AbandonedCheckoutsViewProps {
  orders: any[];
}

export default function AbandonedCheckoutsView({ orders }: AbandonedCheckoutsViewProps) {
  // Abandoned checkouts: orders with status pending_payment
  const abandoned = orders.filter((o) => o.status === 'pending_payment');
  const abandonedTotal = abandoned.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E2D9]">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">Abandoned Checkouts</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Identify shoppers who initiated checkout sessions but did not finalize payment
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-ink-muted block">Recoverable Value</span>
          <span className="font-serif text-2xl font-bold text-clay">{formatINR(abandonedTotal)}</span>
        </div>
      </div>

      {/* METRIC NOTICE */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] space-y-1">
          <span className="text-[10px] font-bold uppercase text-ink-muted block">Total Abandoned</span>
          <span className="text-2xl font-serif font-bold text-ink">{abandoned.length} Checkouts</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] space-y-1">
          <span className="text-[10px] font-bold uppercase text-ink-muted block">Average Cart Size</span>
          <span className="text-2xl font-serif font-bold text-ink">
            {abandoned.length ? formatINR(Math.round(abandonedTotal / abandoned.length)) : '₹0'}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] space-y-1">
          <span className="text-[10px] font-bold uppercase text-ink-muted block">Recovery Opportunity</span>
          <span className="text-2xl font-serif font-bold text-emerald-700">100% Retargetable</span>
        </div>
      </div>

      {/* LIST OF ABANDONED CHECKOUTS */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
          <h3 className="font-serif text-lg font-bold text-ink">Recent Incomplete Checkouts</h3>
          <span className="text-xs text-ink-muted">{abandoned.length} On Record</span>
        </div>

        {abandoned.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-muted">
            <Clock className="w-8 h-8 text-ink-muted mx-auto mb-2" />
            No abandoned checkouts currently detected!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  <th className="pb-3">Checkout ID</th>
                  <th className="pb-3">Customer Email</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total Value</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3 text-right">Recovery Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {abandoned.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#FAF7F0] transition">
                    <td className="py-3.5 font-medium text-ink font-mono text-[11px]">#{ord.order_number}</td>
                    <td className="py-3.5 text-ink font-medium">{ord.customer_email_snapshot || 'Guest Customer'}</td>
                    <td className="py-3.5 text-ink-muted">
                      {(ord.order_items || []).map((i: any) => i.product_name_snapshot).join(', ') || 'Cart items'}
                    </td>
                    <td className="py-3.5 font-serif font-bold text-ink">{formatINR(Number(ord.total))}</td>
                    <td className="py-3.5 text-ink-muted">{new Date(ord.placed_at).toLocaleDateString()}</td>
                    <td className="py-3.5 text-right">
                      {ord.customer_email_snapshot ? (
                        <a
                          href={`mailto:${ord.customer_email_snapshot}?subject=Complete%20your%20purchase%20at%20VJ%20Collection&body=Hello,%20we%20noticed%20you%20started%20order%20#${ord.order_number}.%20Your%20selected%20items%20are%20held%20in%20your%20bag.%20Visit%20https://vjcollection.com%20to%20complete%20your%20order.`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E8E2D9] bg-white text-xs font-semibold text-clay hover:border-clay transition"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Send Recovery Email</span>
                        </a>
                      ) : (
                        <span className="text-ink-muted text-[11px]">No Email Captured</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
