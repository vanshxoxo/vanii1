import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatINR } from '../../data';

interface ReturnsManagerViewProps {
  orders?: any[];
  onRefresh: () => Promise<void> | void;
}

export default function ReturnsManagerView({ onRefresh }: ReturnsManagerViewProps) {
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [awbInput, setAwbInput] = useState('');
  const [courierInput, setCourierInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadReturns = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('return_requests')
      .select('*, orders(order_number,total,status,payment_method,customer_email_snapshot,shipping_addresses(recipient_name,phone,city,state))')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setReturnRequests(data);
    }
  };

  useEffect(() => {
    void loadReturns();
  }, []);

  const handleProcessReturn = async (action: 'approve' | 'reject' | 'schedule_pickup' | 'mark_received' | 'complete') => {
    if (!supabase || !selectedRequest) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      const { error } = await supabase.rpc('admin_process_return', {
        p_return_id: selectedRequest.id,
        p_action: action,
        p_admin_notes: adminNoteInput || null,
        p_return_awb: awbInput || null,
        p_return_courier: courierInput || null,
      });

      if (error) throw error;
      setFeedback({ message: `Return request updated to action: ${action.replace('_', ' ')}.`, type: 'success' });
      setSelectedRequest(null);
      setAdminNoteInput('');
      setAwbInput('');
      setCourierInput('');
      await loadReturns();
      await onRefresh();
    } catch (err: any) {
      setFeedback({ message: err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = returnRequests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'rejected':
      case 'cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'requested':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'pickup_scheduled':
      case 'received':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E2D9]">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">Returns, Exchanges & Cancellations</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Review customer claims, schedule return pickups, inspect returned goods, and authorize refunds
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#E8E2D9]">
          {['all', 'requested', 'approved', 'pickup_scheduled', 'received', 'completed', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                statusFilter === st ? 'bg-clay text-white shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
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

      {/* MAIN LIST & ACTION PANEL */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* LIST */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
            <h3 className="font-serif text-lg font-bold text-ink">Customer Requests</h3>
            <span className="text-xs text-ink-muted">{filtered.length} Requests</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-ink-muted">
              <RotateCcw className="w-8 h-8 text-ink-muted mx-auto mb-2" />
              No customer returns or cancellation requests match the active filter.
            </div>
          ) : (
            <div className="divide-y divide-[#E8E2D9]">
              {filtered.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`py-4 cursor-pointer p-3 rounded-2xl transition ${
                    selectedRequest?.id === req.id ? 'bg-[#FAF7F0] border border-clay/30' : 'hover:bg-[#FAF7F0]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-serif font-bold text-sm text-ink">
                      Order #{req.orders?.order_number || 'N/A'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                        req.status
                      )}`}
                    >
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-ink font-medium">
                    <span className="capitalize text-clay font-bold">{req.request_type}:</span> {req.reason}
                  </p>

                  {req.customer_notes && (
                    <p className="text-xs text-ink-muted italic mt-1 line-clamp-2">"{req.customer_notes}"</p>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E8E2D9]/60 text-[11px] text-ink-muted">
                    <span>{req.orders?.customer_email_snapshot}</span>
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DETAILS & ACTION MODAL/CARD */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4 h-fit">
          <h3 className="font-serif text-base font-bold text-ink">Request Operations</h3>
          {selectedRequest ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-ink-muted block">Request Overview</span>
                <p className="font-semibold text-ink">
                  Type: <span className="capitalize text-clay">{selectedRequest.request_type}</span>
                </p>
                <p>Order: #{selectedRequest.orders?.order_number}</p>
                <p>Reason: {selectedRequest.reason}</p>
                {selectedRequest.refund_amount > 0 && (
                  <p className="font-bold text-ink">Refund Value: {formatINR(Number(selectedRequest.refund_amount))}</p>
                )}
                {selectedRequest.return_awb && (
                  <p className="font-mono text-clay">Return AWB: {selectedRequest.return_awb} ({selectedRequest.return_courier})</p>
                )}
              </div>

              {/* ACTION INPUTS */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">
                    Staff Notes / Message to Customer
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter approval conditions or rejection reasons..."
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-clay"
                  />
                </div>

                {selectedRequest.status === 'approved' && selectedRequest.request_type !== 'cancellation' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">Return AWB</label>
                      <input
                        type="text"
                        placeholder="Carrier AWB"
                        value={awbInput}
                        onChange={(e) => setAwbInput(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">Courier Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Shiprocket/Delhivery"
                        value={courierInput}
                        onChange={(e) => setCourierInput(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E8E2D9]">
                {selectedRequest.status === 'requested' && (
                  <>
                    <button
                      onClick={() => handleProcessReturn('approve')}
                      disabled={isProcessing}
                      className="py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 transition disabled:opacity-50"
                    >
                      Approve Request
                    </button>
                    <button
                      onClick={() => handleProcessReturn('reject')}
                      disabled={isProcessing}
                      className="py-2.5 rounded-xl bg-rose-700 text-white font-semibold text-xs hover:bg-rose-800 transition disabled:opacity-50"
                    >
                      Reject Request
                    </button>
                  </>
                )}

                {selectedRequest.status === 'approved' && selectedRequest.request_type !== 'cancellation' && (
                  <button
                    onClick={() => handleProcessReturn('schedule_pickup')}
                    disabled={isProcessing}
                    className="col-span-2 py-2.5 rounded-xl bg-clay text-white font-semibold text-xs hover:bg-[#b56e57] transition disabled:opacity-50"
                  >
                    Schedule Return Pickup
                  </button>
                )}

                {selectedRequest.status === 'pickup_scheduled' && (
                  <button
                    onClick={() => handleProcessReturn('mark_received')}
                    disabled={isProcessing}
                    className="col-span-2 py-2.5 rounded-xl bg-sky-700 text-white font-semibold text-xs hover:bg-sky-800 transition disabled:opacity-50"
                  >
                    Confirm Goods Received & Inspected
                  </button>
                )}

                {selectedRequest.status === 'received' && (
                  <button
                    onClick={() => handleProcessReturn('complete')}
                    disabled={isProcessing}
                    className="col-span-2 py-2.5 rounded-xl bg-clay text-white font-semibold text-xs hover:bg-[#b56e57] transition disabled:opacity-50"
                  >
                    Complete & Close Return
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-ink-muted">
              Select any request from the list to review details and perform operations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
