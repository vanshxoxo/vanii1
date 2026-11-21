import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, ArrowRight, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formatINR } from '../data';
import Breadcrumbs from '../components/ui';
import Button from '../components/Button';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [message, setMessage] = useState('Retrieving order history…');
  const [trackingOrder, setTrackingOrder] = useState('');

  useEffect(() => {
    if (!supabase) {
      setMessage('Connect Supabase to view your verified orders.');
      return;
    }
    let alive = true;
    void supabase
      .from('orders')
      .select(
        'id,order_number,status,total,currency,payment_method,placed_at,order_items(product_name_snapshot,size_snapshot,colour_snapshot,quantity,line_total),shipments(status,awb_code,courier_name,tracking_url,raw_status)'
      )
      .order('placed_at', { ascending: false })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setMessage(error.message);
        else {
          setOrders(data || []);
          setMessage(data?.length ? '' : 'No orders placed yet.');
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  async function refreshTracking(orderId: string) {
    if (!supabase) return;
    setTrackingOrder(orderId);
    setMessage('Refreshing shipment telemetry…');
    const { data, error } = await supabase.functions.invoke('shiprocket', {
      body: { action: 'track', order_id: orderId },
    });
    if (error || data?.error) {
      setMessage(error?.message || data.error);
      setTrackingOrder('');
      return;
    }
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              shipments: (order.shipments || []).map((shipment: any) => ({
                ...shipment,
                status: data.status,
                raw_status: data.raw_status,
                tracking_url: data.tracking_url,
              })),
            }
          : order
      )
    );
    setMessage('Shipment tracking updated.');
    setTrackingOrder('');
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'shipped':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-charcoal/5 text-charcoal border-charcoal/10';
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16 min-h-[75vh]">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Account', href: '/account' }, { label: 'Order History' }]} />

      <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-charcoal/10">
        <div>
          <span className="text-xs uppercase tracking-[0.24em] font-semibold text-clay flex items-center gap-1.5">
            <Sparkles size={13} />
            Client Telemetry
          </span>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-light text-charcoal">Order History</h1>
        </div>
        <p className="text-xs uppercase tracking-wider text-charcoal-light font-medium">
          {orders.length} order{orders.length !== 1 ? 's' : ''} on record
        </p>
      </div>

      {message && message !== 'No orders placed yet.' && (
        <p className="mt-6 rounded-2xl bg-ivory border border-charcoal/10 p-4 text-xs text-charcoal-soft">{message}</p>
      )}

      {!isSupabaseConfigured && (
        <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-5 text-xs text-amber-900">
          Database access offline. <Link to="/account" className="underline font-semibold ml-1">Connect and sign in</Link>
        </div>
      )}

      {orders.length === 0 && !isSupabaseConfigured ? null : orders.length === 0 ? (
        <div className="mt-12 text-center py-20 rounded-3xl bg-white border border-charcoal/10 max-w-lg mx-auto p-8 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-ivory flex items-center justify-center mx-auto mb-4">
            <Package size={26} className="text-charcoal-light" />
          </div>
          <h2 className="font-serif text-2xl text-charcoal mb-2">No Past Orders Found</h2>
          <p className="text-xs text-charcoal-soft mb-6 leading-relaxed">
            When you purchase pieces from VJ Collection, your receipts, items, and live tracking will appear here.
          </p>
          <Link to="/shop">
            <Button variant="primary" size="md">Explore the Flagship <ArrowRight size={14} /></Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => {
            const shipment = order.shipments?.[0];
            return (
              <article
                key={order.id}
                className="rounded-3xl bg-white border border-charcoal/10 p-6 sm:p-7 shadow-xs space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-charcoal/8">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="font-serif text-lg font-medium text-charcoal">Order #{order.order_number}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadge(order.status)}`}>
                        {order.status.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-light mt-0.5">
                      Placed on {new Date(order.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-charcoal-light block">Method: {order.payment_method?.toUpperCase()}</span>
                    <span className="font-serif text-lg font-bold text-charcoal">{formatINR(Number(order.total))}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-light">
                    Items in Order
                  </p>
                  <ul className="divide-y divide-charcoal/5 rounded-2xl bg-ivory/50 border border-charcoal/8 px-4 py-1">
                    {order.order_items.map((item: any, idx: number) => (
                      <li key={idx} className="flex items-center justify-between py-2.5 text-xs">
                        <div>
                          <span className="font-medium text-charcoal">{item.product_name_snapshot}</span>
                          <span className="text-charcoal-soft block mt-0.5 text-[11px]">
                            {item.colour_snapshot} · {item.size_snapshot} × {item.quantity}
                          </span>
                        </div>
                        <span className="font-semibold text-charcoal">{formatINR(Number(item.line_total))}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Shipment Telemetry */}
                {shipment?.awb_code && (
                  <div className="rounded-2xl bg-white border border-charcoal/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Truck size={16} className="text-charcoal shrink-0" />
                      <div>
                        <span className="font-medium text-charcoal">
                          Status: {shipment.raw_status || shipment.status}
                        </span>
                        <span className="text-charcoal-light block text-[11px]">
                          Courier: {shipment.courier_name || 'Insured Courier'} · AWB {shipment.awb_code}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={trackingOrder === order.id}
                        onClick={() => void refreshTracking(order.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-charcoal-soft hover:text-charcoal disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={trackingOrder === order.id ? 'animate-spin' : ''} />
                        {trackingOrder === order.id ? 'Refreshing…' : 'Refresh'}
                      </button>
                      {shipment.tracking_url && (
                        <a
                          href={shipment.tracking_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-clay hover:underline"
                        >
                          Track Package <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
