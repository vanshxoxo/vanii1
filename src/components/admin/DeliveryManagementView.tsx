import React, { useState } from 'react';
import {
  Truck,
  Navigation,
  Compass,
  ExternalLink,
  Printer,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatINR } from '../../data';

interface DeliveryManagementViewProps {
  orders: any[];
  onRefresh: () => Promise<void> | void;
}

export default function DeliveryManagementView({ orders, onRefresh }: DeliveryManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'shipments' | 'tracking'>('dashboard');
  const [trackingAwb, setTrackingAwb] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filter orders with shipments
  const ordersWithShipments = orders.filter((o) => o.shipments && o.shipments.length > 0);
  const ordersNeedingShipment = orders.filter(
    (o) => (o.status === 'paid' || o.payment_method === 'cod') && (!o.shipments || o.shipments.length === 0)
  );

  // Metrics
  const metrics = {
    awaiting_dispatch: ordersNeedingShipment.length,
    in_transit: ordersWithShipments.filter((o) => o.shipments[0]?.status === 'in_transit').length,
    out_for_delivery: ordersWithShipments.filter((o) => o.shipments[0]?.status === 'out_for_delivery').length,
    delivered: ordersWithShipments.filter((o) => o.shipments[0]?.status === 'delivered').length,
    pickup_scheduled: ordersWithShipments.filter((o) => o.shipments[0]?.status === 'pickup_scheduled').length,
    returned_rto: ordersWithShipments.filter((o) => ['returned', 'rto', 'cancelled'].includes(o.shipments[0]?.status)).length,
  };

  const handleCreateShipment = async (orderId: string) => {
    if (!supabase) return;
    setIsActionBusy(true);
    setFeedback(null);
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket', {
        body: { action: 'create', order_id: orderId },
      });
      if (error || data?.error) {
        throw new Error(error?.message || data?.error || 'Failed to create shipment.');
      }
      setFeedback({
        message: `Shipment created successfully! AWB: ${data.awb_code || 'Pending carrier assignment'}.`,
        type: 'success',
      });
      await onRefresh();
    } catch (err: any) {
      setFeedback({ message: err.message, type: 'error' });
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleGenerateLabel = async (orderId: string) => {
    if (!supabase) return;
    setIsActionBusy(true);
    setFeedback(null);
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket', {
        body: { action: 'generate_label', order_id: orderId },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      if (data.label_url) {
        window.open(data.label_url, '_blank');
        setFeedback({ message: 'Shipping label opened in a new tab.', type: 'success' });
      } else {
        throw new Error('Label URL was not returned by Shiprocket.');
      }
    } catch (err: any) {
      setFeedback({ message: err.message, type: 'error' });
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleSchedulePickup = async (orderId: string) => {
    if (!supabase) return;
    setIsActionBusy(true);
    setFeedback(null);
    try {
      const { data, error } = await supabase.functions.invoke('shiprocket', {
        body: { action: 'schedule_pickup', order_id: orderId },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      setFeedback({ message: 'Pickup requested successfully with carrier partner.', type: 'success' });
      await onRefresh();
    } catch (err: any) {
      setFeedback({ message: err.message, type: 'error' });
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleLookupTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingAwb.trim() || !supabase) return;
    setIsActionBusy(true);
    setTrackingResult(null);
    setFeedback(null);
    try {
      // Find matching order
      const matchingOrder = orders.find(
        (o) => o.shipments?.[0]?.awb_code === trackingAwb.trim() || String(o.order_number) === trackingAwb.trim()
      );
      if (!matchingOrder) {
        throw new Error(`No order found matching AWB or order #${trackingAwb.trim()}.`);
      }
      const { data, error } = await supabase.functions.invoke('shiprocket', {
        body: { action: 'track', order_id: matchingOrder.id },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      setTrackingResult({ ...data, order: matchingOrder });
    } catch (err: any) {
      setFeedback({ message: err.message, type: 'error' });
    } finally {
      setIsActionBusy(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'out_for_delivery':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'in_transit':
      case 'pickup_scheduled':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'created':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'returned':
      case 'cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* TOP TABS & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E2D9]">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">Shipping & Delivery Studio</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Manage carrier assignments, AWB generation, pickup schedules, and live tracking with Shiprocket
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-[#E8E2D9]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'dashboard' ? 'bg-clay text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('shipments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'shipments' ? 'bg-clay text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            All Shipments ({ordersWithShipments.length})
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'tracking' ? 'bg-clay text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Live Tracking
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-2 border animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold p-1">
            ✕
          </button>
        </div>
      )}

      {/* 1. DASHBOARD VIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* STATS METRIC TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                Awaiting Dispatch
              </span>
              <span className="text-2xl font-serif font-bold text-ink">{metrics.awaiting_dispatch}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
                Pickup Scheduled
              </span>
              <span className="text-2xl font-serif font-bold text-ink">{metrics.pickup_scheduled}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                In Transit
              </span>
              <span className="text-2xl font-serif font-bold text-ink">{metrics.in_transit}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                Out for Delivery
              </span>
              <span className="text-2xl font-serif font-bold text-ink">{metrics.out_for_delivery}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Delivered
              </span>
              <span className="text-2xl font-serif font-bold text-ink">{metrics.delivered}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                RTO / Returned
              </span>
              <span className="text-2xl font-serif font-bold text-ink">{metrics.returned_rto}</span>
            </div>
          </div>

          {/* ORDERS AWAITING SHIPMENT DISPATCH */}
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div>
                <h3 className="font-serif text-lg font-bold text-ink">Orders Awaiting Dispatch</h3>
                <p className="text-xs text-ink-muted">Confirmed orders ready to be packaged and sent to carrier</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                {ordersNeedingShipment.length} Orders
              </span>
            </div>

            {ordersNeedingShipment.length === 0 ? (
              <div className="text-center py-10 text-xs text-ink-muted">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                All confirmed orders have been dispatched or assigned courier shipments!
              </div>
            ) : (
              <div className="divide-y divide-[#E8E2D9]">
                {ordersNeedingShipment.map((order) => {
                  const addr = Array.isArray(order.shipping_addresses)
                    ? order.shipping_addresses[0]
                    : order.shipping_addresses;
                  return (
                    <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-base font-bold text-ink">Order #{order.order_number}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-amber-50 text-amber-900 border-amber-200">
                            {order.payment_method?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {addr?.recipient_name} · {addr?.city}, {addr?.state} ({addr?.postal_code})
                        </p>
                        <p className="text-xs font-medium text-ink mt-1">
                          Total: {formatINR(Number(order.total))} ({order.order_items?.length || 0} items)
                        </p>
                      </div>

                      <button
                        onClick={() => handleCreateShipment(order.id)}
                        disabled={isActionBusy}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition disabled:opacity-50 shadow-xs shrink-0"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Create Shipment</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ALL SHIPMENTS TABLE */}
      {activeTab === 'shipments' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
            <h3 className="font-serif text-lg font-bold text-ink">Active & Historical Shipments</h3>
            <span className="text-xs text-ink-muted">{ordersWithShipments.length} on record</span>
          </div>

          {ordersWithShipments.length === 0 ? (
            <div className="text-center py-12 text-xs text-ink-muted">
              <Navigation className="w-8 h-8 text-ink-muted mx-auto mb-2" />
              No shipments created yet. Dispatched orders will appear here with live AWB tracking.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8E2D9] text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    <th className="pb-3">Order</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Carrier / AWB</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {ordersWithShipments.map((order) => {
                    const shipment = order.shipments[0];
                    const addr = Array.isArray(order.shipping_addresses)
                      ? order.shipping_addresses[0]
                      : order.shipping_addresses;
                    return (
                      <tr key={order.id} className="hover:bg-[#FAF7F0] transition">
                        <td className="py-3.5 font-medium text-ink">
                          #{order.order_number}
                          <span className="block text-[10px] text-ink-muted">
                            {new Date(order.placed_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className="font-medium text-ink block">{addr?.recipient_name}</span>
                          <span className="text-[10px] text-ink-muted">
                            {addr?.city}, {addr?.postal_code}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className="font-semibold text-ink block">{shipment?.courier_name || 'Express Carrier'}</span>
                          {shipment?.awb_code ? (
                            <span className="font-mono text-[11px] text-clay">{shipment.awb_code}</span>
                          ) : (
                            <span className="text-[10px] text-ink-muted">AWB Pending</span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                              shipment?.status
                            )}`}
                          >
                            {(shipment?.status || 'created').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 text-right space-x-2">
                          {shipment?.awb_code && (
                            <button
                              onClick={() => handleGenerateLabel(order.id)}
                              disabled={isActionBusy}
                              className="p-1.5 rounded-lg border border-[#E8E2D9] text-ink-muted hover:text-ink hover:border-ink transition"
                              title="Download Shipping Label"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleSchedulePickup(order.id)}
                            disabled={isActionBusy}
                            className="p-1.5 rounded-lg border border-[#E8E2D9] text-ink-muted hover:text-ink hover:border-ink transition"
                            title="Schedule Courier Pickup"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                          {shipment?.tracking_url && (
                            <a
                              href={shipment.tracking_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex p-1.5 rounded-lg border border-[#E8E2D9] text-clay hover:border-clay transition"
                              title="View Provider Tracking Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. LIVE TRACKING LOOKUP */}
      {activeTab === 'tracking' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Real-Time Telemetry Lookup</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Enter any Shiprocket AWB number or VJ Collection order number to retrieve instantaneous status
            </p>
          </div>

          <form onSubmit={handleLookupTracking} className="flex gap-3 max-w-lg">
            <input
              type="text"
              placeholder="e.g. 143243294823 or Order Number"
              value={trackingAwb}
              onChange={(e) => setTrackingAwb(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-clay"
            />
            <button
              type="submit"
              disabled={isActionBusy}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition disabled:opacity-50"
            >
              <Compass className={`w-3.5 h-3.5 ${isActionBusy ? 'animate-spin' : ''}`} />
              <span>Track</span>
            </button>
          </form>

          {trackingResult && (
            <div className="rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] p-5 space-y-4 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E2D9]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-ink-muted tracking-wider block">
                    Order #{trackingResult.order?.order_number}
                  </span>
                  <span className="font-serif text-base font-bold text-ink">
                    AWB: {trackingResult.awb_code || 'N/A'}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadge(
                    trackingResult.status
                  )}`}
                >
                  {trackingResult.status}
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-muted block">Courier</span>
                  <span className="font-semibold text-ink">{trackingResult.courier_name || 'Express Carrier'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-muted block">Raw Status</span>
                  <span className="font-semibold text-ink">{trackingResult.raw_status || 'In Transit'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-muted block">Estimated Delivery</span>
                  <span className="font-semibold text-ink">{trackingResult.etd || '3-5 Business Days'}</span>
                </div>
              </div>

              {trackingResult.tracking_url && (
                <div className="pt-2 border-t border-[#E8E2D9]">
                  <a
                    href={trackingResult.tracking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-clay hover:underline"
                  >
                    <span>Open Live Shiprocket Tracking Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
