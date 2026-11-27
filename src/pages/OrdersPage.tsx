import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  RotateCcw,
  X,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formatINR } from '../data';
import Breadcrumbs from '../components/ui';
import Button from '../components/Button';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [message, setMessage] = useState('Retrieving order history…');
  const [trackingOrder, setTrackingOrder] = useState('');

  // Return / Cancellation modal state
  const [modalOrder, setModalOrder] = useState<any | null>(null);
  const [requestType, setRequestType] = useState<'return' | 'exchange' | 'cancellation'>('return');
  const [reason, setReason] = useState('Fabric / material differs from expectation');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  const loadData = async () => {
    if (!supabase) {
      setMessage('Connect Supabase to view your verified orders.');
      return;
    }
    try {
      const [ordersRes, returnsRes] = await Promise.all([
        supabase
          .from('orders')
          .select(
            'id,order_number,status,total,currency,payment_method,placed_at,order_items(product_name_snapshot,size_snapshot,colour_snapshot,quantity,line_total),shipments(status,awb_code,courier_name,tracking_url,raw_status,provider_payload)'
          )
          .order('placed_at', { ascending: false }),
        supabase
          .from('return_requests')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (ordersRes.error) setMessage(ordersRes.error.message);
      else {
        setOrders(ordersRes.data || []);
        setMessage(ordersRes.data?.length ? '' : 'No orders placed yet.');
      }

      if (!returnsRes.error && returnsRes.data) {
        setReturnRequests(returnsRes.data);
      }
    } catch (err: any) {
      setMessage(err.message || 'Could not load order history.');
    }
  };

  useEffect(() => {
    void loadData();
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
                provider_payload: { ...shipment.provider_payload, etd: data.etd },
              })),
            }
          : order
      )
    );
    setMessage('Shipment tracking updated.');
    setTrackingOrder('');
  }

  const handleOpenRequestModal = (order: any, type: 'return' | 'exchange' | 'cancellation') => {
    setModalOrder(order);
    setRequestType(type);
    setReason(
      type === 'cancellation'
        ? 'Order placed by mistake'
        : 'Fabric / material differs from expectation'
    );
    setCustomerNotes('');
    setModalFeedback(null);
  };

  const handleSubmitReturnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !modalOrder) return;
    setIsSubmitting(true);
    setModalFeedback(null);
    try {
      const { error } = await supabase.rpc('request_order_return', {
        p_order_id: modalOrder.id,
        p_request_type: requestType,
        p_reason: reason,
        p_customer_notes: customerNotes || null,
      });

      if (error) throw error;
      setModalFeedback({
        text: `Your ${requestType} request has been recorded. Our client care team will review and contact you shortly.`,
      });
      await loadData();
      setTimeout(() => {
        setModalOrder(null);
      }, 2500);
    } catch (err: any) {
      setModalFeedback({ text: err.message, error: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'pending':
      case 'pending_payment':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'shipped':
      case 'in_transit':
      case 'processing':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-charcoal/5 text-charcoal border-charcoal/10';
    }
  };

  const getTimelineSteps = (shipmentStatus?: string) => {
    const s = shipmentStatus?.toLowerCase() || '';
    return [
      { label: 'Confirmed', done: true },
      { label: 'Processing', done: ['pickup_scheduled', 'in_transit', 'out_for_delivery', 'delivered'].includes(s) },
      { label: 'Dispatched', done: ['in_transit', 'out_for_delivery', 'delivered'].includes(s) },
      { label: 'Out for Delivery', done: ['out_for_delivery', 'delivered'].includes(s) },
      { label: 'Delivered', done: s === 'delivered' },
    ];
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
            When you purchase pieces from VJ Collection across Jewellery, Suits & Fabrics, Living, and Little Loom, your receipts, items, and live tracking will appear here.
          </p>
          <Link to="/shop">
            <Button variant="primary" size="md">Explore the Flagship <ArrowRight size={14} /></Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => {
            const shipment = order.shipments?.[0];
            const activeReturn = returnRequests.find((r) => r.order_id === order.id);
            const isDelivered = order.status === 'delivered';
            const isCancellable = ['pending_payment', 'paid', 'processing'].includes(order.status) && !activeReturn;

            return (
              <article
                key={order.id}
                className="rounded-3xl bg-white border border-charcoal/10 p-6 sm:p-7 shadow-xs space-y-5"
              >
                {/* Header Row */}
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

                {/* Tracking & Timeline Card */}
                {shipment?.awb_code && (
                  <div className="rounded-2xl bg-white border border-charcoal/10 p-5 space-y-4 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Truck size={18} className="text-charcoal shrink-0" />
                        <div>
                          <span className="font-medium text-charcoal block">
                            Carrier: {shipment.courier_name || 'Insured Courier Partner'}
                          </span>
                          <span className="text-charcoal-light text-[11px]">
                            AWB: <strong className="font-mono text-clay">{shipment.awb_code}</strong>
                            {shipment.provider_payload?.etd ? ` · Est. Delivery: ${shipment.provider_payload.etd}` : ''}
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
                            Live Tracking <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Timeline Progression Bar */}
                    <div className="pt-2 border-t border-charcoal/8">
                      <div className="grid grid-cols-5 gap-1 text-center">
                        {getTimelineSteps(shipment.status).map((st, i) => (
                          <div key={i} className="space-y-1">
                            <div className={`h-1.5 rounded-full ${st.done ? 'bg-clay' : 'bg-charcoal/10'}`} />
                            <span className={`text-[9px] block uppercase font-bold ${st.done ? 'text-charcoal' : 'text-charcoal-light'}`}>
                              {st.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Return / Cancellation Status Banner */}
                {activeReturn && (
                  <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <RotateCcw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold capitalize">{activeReturn.request_type} Request:</span>{' '}
                        <span className="font-semibold uppercase text-[10px] px-2 py-0.5 rounded-full bg-white border border-amber-300 ml-1">
                          {activeReturn.status.replace('_', ' ')}
                        </span>
                        <p className="text-amber-800 text-[11px] mt-0.5">
                          Reason: {activeReturn.reason}
                          {activeReturn.admin_notes ? ` · Note from concierge: "${activeReturn.admin_notes}"` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Footer */}
                <div className="pt-3 border-t border-charcoal/8 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-charcoal-light">
                    Questions? Reach our concierge at <a href="mailto:care@vjcollection.com" className="underline text-charcoal font-medium">care@vjcollection.com</a>
                  </span>

                  <div className="flex items-center gap-2">
                    {isCancellable && (
                      <button
                        type="button"
                        onClick={() => handleOpenRequestModal(order, 'cancellation')}
                        className="px-3.5 py-1.5 rounded-xl border border-charcoal/15 text-xs font-semibold text-charcoal hover:border-rose-400 hover:text-rose-700 transition"
                      >
                        Cancel Order
                      </button>
                    )}

                    {isDelivered && !activeReturn && (
                      <button
                        type="button"
                        onClick={() => handleOpenRequestModal(order, 'return')}
                        className="px-3.5 py-1.5 rounded-xl border border-charcoal/15 text-xs font-semibold text-charcoal hover:border-clay hover:text-clay transition"
                      >
                        Request Return / Exchange
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* RETURN & CANCELLATION REQUEST MODAL */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-charcoal/10 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-clay block">
                  Client Request
                </span>
                <h2 className="font-serif text-xl font-bold text-charcoal">
                  {requestType === 'cancellation' ? 'Request Order Cancellation' : 'Request Return or Exchange'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOrder(null)}
                className="p-1.5 rounded-xl border border-charcoal/10 text-charcoal-light hover:text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-charcoal-soft">
              Order #{modalOrder.order_number} · Total: {formatINR(Number(modalOrder.total))}
            </p>

            {modalFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs border ${
                  modalFeedback.error
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                {modalFeedback.text}
              </div>
            )}

            <form onSubmit={handleSubmitReturnRequest} className="space-y-4 text-xs">
              {requestType !== 'cancellation' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-light mb-1">
                    Request Option
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRequestType('return')}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                        requestType === 'return' ? 'bg-charcoal text-white border-charcoal' : 'border-charcoal/15 text-charcoal'
                      }`}
                    >
                      Return for Refund
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestType('exchange')}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border ${
                        requestType === 'exchange' ? 'bg-charcoal text-white border-charcoal' : 'border-charcoal/15 text-charcoal'
                      }`}
                    >
                      Exchange for Size/Fabric
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-light mb-1">
                  Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-charcoal/15 bg-white text-xs text-charcoal"
                  required
                >
                  {requestType === 'cancellation' ? (
                    <>
                      <option value="Order placed by mistake">Order placed by mistake</option>
                      <option value="Need to change delivery address">Need to change delivery address</option>
                      <option value="Selected wrong size or fabric variant">Selected wrong size or fabric variant</option>
                      <option value="Delivery timeline longer than expected">Delivery timeline longer than expected</option>
                      <option value="Other reason">Other reason</option>
                    </>
                  ) : (
                    <>
                      <option value="Fabric / material differs from expectation">Fabric / material differs from expectation</option>
                      <option value="Sizing or dimension mismatch">Sizing or dimension mismatch</option>
                      <option value="Colour shade different from screen">Colour shade different from screen</option>
                      <option value="Defective or damaged pieces">Defective or damaged pieces</option>
                      <option value="Incorrect item dispatched">Incorrect item dispatched</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-light mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Provide any details to help our team assist you promptly..."
                  className="w-full px-3 py-2 rounded-xl border border-charcoal/15 text-xs text-charcoal"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-charcoal/10">
                <button
                  type="button"
                  onClick={() => setModalOrder(null)}
                  className="px-4 py-2 rounded-xl border border-charcoal/15 text-xs font-semibold text-charcoal hover:bg-ivory"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
