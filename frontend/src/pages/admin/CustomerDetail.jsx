import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../services/api';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

const CustomerDetail = () => {
  const { id } = useParams();
  const { accessToken } = useAuth();

  const [customer, setCustomer] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomerDetail = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`${API_BASE_URL}/admin/customers/${id}/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          if (res.status === 404) throw new Error('Customer profile not found.');
          throw new Error('Failed to load customer details.');
        }

        const data = await res.json();
        setCustomer(data.customer);
        setStatistics(data.statistics || {
          total_orders: data.customer?.total_orders || 0,
          total_purchase: data.customer?.total_spent || 0,
          average_order_value: data.customer?.total_orders ? (data.customer.total_spent / data.customer.total_orders) : 0
        });
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Error fetching customer details:', err);
        setError(err.message || 'Error connecting to backend server.');
      }
      setLoading(false);
    };

    if (accessToken && id) {
      fetchCustomerDetail();
    }
  }, [accessToken, id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading customer profile & order history...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h1 className="text-2xl font-bold text-slate-900">{error || 'Customer Not Found'}</h1>
        <p className="text-slate-500 text-xs">The requested customer profile may have been removed or does not exist.</p>
        <Link
          to="/admin/customers"
          className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-700 text-white font-bold rounded-xl text-xs hover:bg-indigo-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Bar */}
      <div>
        <Link to="/admin/customers" className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center space-x-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Customer Directory</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-white font-black text-lg flex items-center justify-center">
              {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{customer.name}</h1>
              <p className="text-xs text-slate-500 font-medium">Customer Account ID: #{customer.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Purchase Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Total Orders */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Valid Orders</span>
            <span className="text-2xl font-black text-slate-900">{statistics.total_orders}</span>
          </div>
        </div>

        {/* Total Purchase */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Purchase (Sales)</span>
            <span className="text-2xl font-black text-emerald-800">
              ₹{parseFloat(statistics.total_purchase || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Average Order Value</span>
            <span className="text-2xl font-black text-slate-900">
              ₹{parseFloat(statistics.average_order_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

      </div>

      {/* Customer Information Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Customer Information</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Full Name</span>
            </span>
            <span className="font-bold text-slate-900 text-sm block">{customer.name}</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              <span>Mobile Number</span>
            </span>
            <span className="font-bold text-slate-900 text-sm block">{customer.mobile_number}</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Registration Date</span>
            </span>
            <span className="font-bold text-slate-900 text-sm block">{customer.date_joined}</span>
          </div>

          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <span className="text-slate-400 font-semibold block flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Delivery Address</span>
            </span>
            <span className="font-bold text-slate-900 text-xs block">{customer.address || 'Not provided'}</span>
          </div>

        </div>
      </div>

      {/* Customer Recent Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Order History ({orders.length})</h2>
            <p className="text-xs text-slate-500">All historical purchase orders placed by this customer account</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Orders Placed Yet</p>
            <p className="text-xs text-slate-400">This customer has not submitted any purchase orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-4 px-4">Order Number</th>
                  <th className="py-4 px-4">Order Date</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-right">Total Amount</th>
                  <th className="py-4 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">#{ord.order_number}</td>
                    <td className="py-4 px-4 text-slate-600">{ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getStatusBadge(ord.status)}`}>
                        {ord.status_display || ord.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-slate-900 text-sm">
                      ₹{parseFloat(ord.total_amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Link
                        to={`/admin/orders/${ord.id}`}
                        className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Order</span>
                      </Link>
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
};

export const AdminCustomerDetailPage = CustomerDetail;
export default CustomerDetail;
