import React, { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
} from 'lucide-react';
import { formatINR } from '../../data';
import { supabase } from '../../lib/supabase';

interface FinanceStudioViewProps {
  orders: any[];
  onRefresh: () => Promise<void> | void;
}

export default function FinanceStudioView({ orders, onRefresh }: FinanceStudioViewProps) {
  const [activeTab, setActiveTab] = useState<'payments' | 'refunds' | 'transactions' | 'reports'>('payments');
  const [refundOrderId, setRefundOrderId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Financial aggregates
  const paidOrders = orders.filter((o) => o.status === 'paid' || o.status === 'delivered' || o.status === 'shipped');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const codOrders = orders.filter((o) => o.payment_method === 'cod');
  const prepaidOrders = orders.filter((o) => o.payment_method === 'razorpay');
  const codRevenue = codOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const prepaidRevenue = prepaidOrders.filter((o) => o.status !== 'pending_payment').reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingRevenue = orders.filter((o) => o.status === 'pending_payment').reduce((sum, o) => sum + Number(o.total || 0), 0);

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !refundOrderId || !refundAmount) return;
    setIsSubmittingRefund(true);
    setFeedback(null);
    try {
      const amountPaise = Math.round(Number(refundAmount) * 100);
      const idempotencyKey = `ref-${refundOrderId.slice(0, 8)}-${Date.now()}`;
      const { data, error } = await supabase.functions.invoke('refund-payment', {
        body: {
          order_id: refundOrderId,
          amount_paise: amountPaise,
          reason: refundReason || 'Customer requested refund',
          idempotency_key: idempotencyKey,
        },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      setFeedback({
        message: `Refund of ${formatINR(Number(refundAmount))} issued successfully! Provider Refund ID: ${data.provider_refund_id || 'Processed'}.`,
        type: 'success',
      });
      setRefundOrderId('');
      setRefundAmount('');
      setRefundReason('');
      await onRefresh();
    } catch (err: any) {
      setFeedback({ message: err.message, type: 'error' });
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* HEADER & TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E2D9]">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">Finance & Payment Studio</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Verified online payments, Razorpay transactions, refunds ledger, and revenue analytics
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#E8E2D9]">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'payments' ? 'bg-clay text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'refunds' ? 'bg-clay text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Refunds
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'transactions' ? 'bg-clay text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Ledger
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'reports' ? 'bg-clay text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Sales Reports
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

      {/* METRIC OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Net Verified Revenue
          </span>
          <span className="text-2xl font-serif font-bold text-ink">{formatINR(totalRevenue)}</span>
          <span className="text-[10px] text-ink-muted block mt-1">{paidOrders.length} Completed Orders</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
            Prepaid (Razorpay)
          </span>
          <span className="text-2xl font-serif font-bold text-ink">{formatINR(prepaidRevenue)}</span>
          <span className="text-[10px] text-ink-muted block mt-1">{prepaidOrders.length} Prepaid Transactions</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Cash on Delivery
          </span>
          <span className="text-2xl font-serif font-bold text-ink">{formatINR(codRevenue)}</span>
          <span className="text-[10px] text-ink-muted block mt-1">{codOrders.length} COD Deliveries</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E8E2D9] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
            Pending / In-Flight
          </span>
          <span className="text-2xl font-serif font-bold text-ink">{formatINR(pendingRevenue)}</span>
          <span className="text-[10px] text-ink-muted block mt-1">Awaiting Capture or Settlement</span>
        </div>
      </div>

      {/* 1. PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
            <h3 className="font-serif text-lg font-bold text-ink">Verified Customer Payments</h3>
            <span className="text-xs text-ink-muted">{orders.length} Payment Events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  <th className="pb-3">Order #</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF7F0] transition">
                    <td className="py-3 font-semibold text-ink">#{o.order_number}</td>
                    <td className="py-3 text-ink-muted">{o.customer_email_snapshot || 'Guest Customer'}</td>
                    <td className="py-3 font-medium uppercase text-[11px] text-ink">
                      {o.payment_method === 'razorpay' ? 'Razorpay (Prepaid)' : 'Cash on Delivery'}
                    </td>
                    <td className="py-3 font-serif font-bold text-ink">{formatINR(Number(o.total))}</td>
                    <td className="py-3 text-ink-muted">{new Date(o.placed_at).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          o.status === 'paid' || o.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : o.status === 'pending_payment'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-gray-50 text-gray-800 border-gray-200'
                        }`}
                      >
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. REFUNDS TAB */}
      {activeTab === 'refunds' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink">Issued Refunds History</h3>
            <p className="text-xs text-ink-muted">
              Authoritative record of all full and partial refunds sent through Razorpay
            </p>
            <div className="py-12 text-center text-xs text-ink-muted">
              <RefreshCw className="w-8 h-8 text-ink-muted mx-auto mb-2" />
              All processed refunds will display here with gateway reference IDs and audit timestamps.
            </div>
          </div>

          {/* INITIATE REFUND CARD */}
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-ink">Issue Customer Refund</h3>
            <p className="text-xs text-ink-muted">
              Sends an authorized refund request to Razorpay. Only captured payments can be refunded.
            </p>

            <form onSubmit={handleIssueRefund} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Select Order
                </label>
                <select
                  value={refundOrderId}
                  onChange={(e) => {
                    setRefundOrderId(e.target.value);
                    const selected = orders.find((o) => o.id === e.target.value);
                    if (selected) setRefundAmount(String(selected.total));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] bg-white text-ink text-xs focus:outline-hidden focus:border-clay"
                  required
                >
                  <option value="">Choose an eligible order...</option>
                  {orders
                    .filter((o) => o.payment_method === 'razorpay' && o.status !== 'cancelled')
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        Order #{o.order_number} ({formatINR(Number(o.total))})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1999"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-clay"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Reason for Refund
                </label>
                <input
                  type="text"
                  placeholder="e.g. Returned fabric material / Cancellation"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-clay"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRefund}
                className="w-full py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition disabled:opacity-50 shadow-xs"
              >
                {isSubmittingRefund ? 'Processing with Gateway...' : 'Process Refund via Gateway'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. TRANSACTIONS LEDGER */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-ink">Comprehensive Transactions Ledger</h3>
          <p className="text-xs text-ink-muted">
            Audited financial movements including captured payments, COD collections, and refunds
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF7F0] transition">
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] uppercase">
                        <ArrowDownRight className="w-3 h-3" /> Sale
                      </span>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-ink-muted">TXN-{o.id.slice(0, 8)}</td>
                    <td className="py-3 font-medium text-ink">Order #{o.order_number}</td>
                    <td className="py-3 font-serif font-bold text-ink">{formatINR(Number(o.total))}</td>
                    <td className="py-3 text-ink-muted">{new Date(o.placed_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SALES REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Store Sales Performance Report</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Summary of orders, average order values, and gross revenue by department
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] space-y-1">
              <span className="text-[10px] font-bold uppercase text-ink-muted block">Average Order Value (AOV)</span>
              <span className="text-xl font-serif font-bold text-ink">
                {orders.length ? formatINR(Math.round(totalRevenue / (paidOrders.length || 1))) : '₹0'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] space-y-1">
              <span className="text-[10px] font-bold uppercase text-ink-muted block">Conversion Rate</span>
              <span className="text-xl font-serif font-bold text-ink">
                {orders.length ? `${Math.round((paidOrders.length / orders.length) * 100)}%` : '0%'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] space-y-1">
              <span className="text-[10px] font-bold uppercase text-ink-muted block">Total Pieces Ordered</span>
              <span className="text-xl font-serif font-bold text-ink">
                {orders.reduce((sum, o) => sum + (o.order_items?.length || 0), 0)} Pieces
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
