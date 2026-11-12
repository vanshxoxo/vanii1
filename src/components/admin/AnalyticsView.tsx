import { TrendingUp, ShoppingBag, DollarSign, Users } from 'lucide-react';
import { formatINR } from '../../data';

interface AnalyticsViewProps {
  orders: any[];
  products?: any[];
  customers: any[];
}

export default function AnalyticsView({ orders, customers }: AnalyticsViewProps) {
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalOrders = orders.length;
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="pb-2">
        <h2 className="font-serif text-2xl font-bold text-ink">Business Analytics</h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Sales performance, customer acquisition, and merchandising performance
        </p>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-ink mt-2">
            {formatINR(totalRevenue)}
          </div>
          <p className="text-xs text-ink-muted mt-1">From all completed checkouts</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EAF2F8] text-[#2B6CB0] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-ink mt-2">
            {totalOrders}
          </div>
          <p className="text-xs text-ink-muted mt-1">{deliveredOrders} orders fulfilled</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Average Order Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-cream text-clay flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-ink mt-2">
            {formatINR(aov)}
          </div>
          <p className="text-xs text-ink-muted mt-1">Average cart ticket size</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Total Customers
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F3E5F5] text-[#7B1FA2] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-ink mt-2">
            {customers.length}
          </div>
          <p className="text-xs text-ink-muted mt-1">Registered customer accounts</p>
        </div>
      </div>

      {/* RECENT SALES TELEMETRY */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-2xs space-y-4">
        <h3 className="font-serif font-bold text-base text-ink">Order Volume Breakdown</h3>
        {orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-muted">
            <ShoppingBag className="w-8 h-8 mx-auto text-ink-muted/40 mb-2" />
            <p className="font-medium text-ink">No sales activity recorded yet.</p>
            <p className="mt-0.5">As customers complete purchases, conversion patterns will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8E2D9]">
            {orders.slice(0, 10).map((o) => (
              <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-ink">#{o.order_number}</span>
                  <span className="text-ink-muted ml-2">
                    {new Date(o.placed_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="capitalize text-ink-soft">{o.payment_method || 'Online'}</span>
                  <span className="font-semibold text-ink">{formatINR(Number(o.total) || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
