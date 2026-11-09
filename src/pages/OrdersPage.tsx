import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formatINR } from '../data';
import Breadcrumbs from '../components/ui';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [message, setMessage] = useState('Loading orders…');
  const [trackingOrder, setTrackingOrder] = useState('');
  useEffect(() => {
    if (!supabase) { setMessage('Connect Supabase to view your orders.'); return; }
    let alive = true;
    void supabase.from('orders').select('id,order_number,status,total,currency,payment_method,placed_at,order_items(product_name_snapshot,size_snapshot,colour_snapshot,quantity,line_total),shipments(status,awb_code,courier_name,tracking_url,raw_status)')
      .order('placed_at', { ascending: false }).then(({ data, error }) => {
        if (!alive) return;
        if (error) setMessage(error.message);
        else { setOrders(data || []); setMessage(data?.length ? '' : 'No orders yet.'); }
      });
    return () => { alive = false; };
  }, []);
  async function refreshTracking(orderId: string) {
    if (!supabase) return;
    setTrackingOrder(orderId); setMessage('Refreshing shipment tracking…');
    const { data, error } = await supabase.functions.invoke('shiprocket', { body: { action: 'track', order_id: orderId } });
    if (error || data?.error) { setMessage(error?.message || data.error); setTrackingOrder(''); return; }
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, shipments: (order.shipments || []).map((shipment: any) => ({ ...shipment, status: data.status, raw_status: data.raw_status, tracking_url: data.tracking_url })) } : order));
    setMessage('Shipment tracking is up to date.'); setTrackingOrder('');
  }
  return <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10"><Breadcrumbs items={[{ label: 'Account', href: '/account' }, { label: 'Orders' }]} /><h1 className="mt-5 font-serif text-3xl">Order history</h1>{message && <p className="mt-5 text-sm text-ink-soft">{message}</p>}{!isSupabaseConfigured && <Link to="/account" className="mt-4 inline-block underline">Connect and sign in</Link>}<div className="mt-6 space-y-4">{orders.map((order) => { const shipment = order.shipments?.[0]; return <article key={order.id} className="border border-ink/10 p-5"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-medium">Order #{order.order_number}</h2><span className="text-sm capitalize">{order.status.replaceAll('_', ' ')} · {order.payment_method}</span></div><p className="mt-1 text-xs text-ink-light">{new Date(order.placed_at).toLocaleDateString()}</p><ul className="mt-4 divide-y divide-ink/10">{order.order_items.map((item: any) => <li key={`${item.product_name_snapshot}-${item.sku_snapshot || item.size_snapshot}`} className="flex justify-between py-2 text-sm"><span>{item.product_name_snapshot} · {item.colour_snapshot} · {item.size_snapshot} × {item.quantity}</span><span>{formatINR(Number(item.line_total))}</span></li>)}</ul><p className="mt-3 text-right font-semibold">Total {formatINR(Number(order.total))}</p>{shipment?.awb_code && <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3 text-sm"><span>Shipment: {shipment.raw_status || shipment.status}{shipment.courier_name ? ` · ${shipment.courier_name}` : ''} · AWB {shipment.awb_code}</span><div className="flex gap-3"><button type="button" disabled={trackingOrder === order.id} onClick={() => void refreshTracking(order.id)} className="underline disabled:opacity-50">{trackingOrder === order.id ? 'Refreshing…' : 'Refresh tracking'}</button>{shipment.tracking_url && <a href={shipment.tracking_url} target="_blank" rel="noreferrer" className="underline">Track package</a>}</div></div>}</article>; })}</div></main>;
}
