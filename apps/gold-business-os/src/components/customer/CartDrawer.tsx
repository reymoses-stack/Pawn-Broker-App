import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Trash2, ShoppingBag, Truck, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CartDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { cart, updateCartQuantity, removeFromCart, rates, placeOrder, currentCustomer } = useApp();

  const [address, setAddress] = useState(currentCustomer.address);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CREDIT_CARD' | 'NET_BANKING'>('UPI');
  const [confirmedOrderNum, setConfirmedOrderNum] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotalGold = cart.reduce((sum, item) => {
    return sum + item.product.weightGrams * rates.rate24kPerGram * item.quantity;
  }, 0);

  const makingChargesTotal = cart.reduce((sum, item) => sum + item.product.makingCharges * item.quantity, 0);
  const taxGst = Math.round((subtotalGold + makingChargesTotal) * (rates.taxGstPercent / 100));
  const grandTotal = subtotalGold + makingChargesTotal + taxGst;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const order = placeOrder(address, paymentMethod);
    setConfirmedOrderNum(order.orderNumber);
    confetti({ particleCount: 70, spread: 80 });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-md w-full liquid-glass border-l border-white shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/80 bg-white/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl p-2 liquid-glass-gold text-amber-700 flex items-center justify-center border border-amber-300 shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif-gold">Bullion Cart & Checkout</h3>
              <p className="text-[11px] text-slate-500">Insured Tamper-Proof Delivery</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 p-2 rounded-full liquid-glass-sub cursor-pointer transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrderNum ? (
          <div className="p-8 flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full liquid-glass-sub border border-emerald-300 text-emerald-600 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 font-serif-gold">Order Confirmed!</h4>
            <p className="text-xs text-slate-600">
              Your bullion order <strong className="text-amber-800 font-mono">{confirmedOrderNum}</strong> has been placed with 100% transit insurance.
            </p>
            <div className="w-full liquid-glass-sub p-5 rounded-3xl text-left text-xs space-y-2 border border-slate-200/80">
              <div className="flex justify-between text-slate-600">
                <span>Shipping to:</span>
                <span className="text-slate-900 font-medium max-w-[200px] truncate">{address}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Paid:</span>
                <span className="font-mono text-emerald-700 font-bold">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Dispatch:</span>
                <span className="text-amber-800 font-semibold">Within 24 Hours</span>
              </div>
            </div>
            <button
              onClick={() => {
                setConfirmedOrderNum(null);
                onClose();
              }}
              className="w-full py-3 liquid-glass-btn-primary text-white font-bold text-xs rounded-full cursor-pointer transition shadow-xl"
            >
              Continue Browsing
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-12 h-12 stroke-1 opacity-50" />
                  <p className="text-xs font-semibold text-slate-600">Your bullion cart is empty.</p>
                  <p className="text-[11px] text-slate-400">Explore investment-grade 24K coins and bullion bars.</p>
                </div>
              ) : (
                cart.map((item) => {
                  const unitGoldPrice = item.product.weightGrams * rates.rate24kPerGram;
                  const itemTotal = (unitGoldPrice + item.product.makingCharges) * item.quantity;
                  return (
                    <div
                      key={item.product.id}
                      className="liquid-glass-sub rounded-2xl p-3.5 flex gap-3 items-center text-xs border border-slate-200/80 shadow-sm"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-900 truncate">{item.product.name}</h5>
                        <p className="text-[11px] text-amber-700 font-semibold">{item.product.purity}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.product.weightGrams}g @ ₹{rates.rate24kPerGram}/g
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-slate-200 rounded-full liquid-glass-sub px-1 bg-white/80">
                            <button
                              onClick={() => updateCartQuantity(item.product.id, -1)}
                              className="px-2 py-0.5 text-slate-600 hover:text-slate-900 font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono text-slate-900 font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.product.id, 1)}
                              className="px-2 py-0.5 text-slate-600 hover:text-slate-900 font-bold"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900">
                        ₹{itemTotal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Price Breakdown & Checkout Form */}
            {cart.length > 0 && (
              <form onSubmit={handleCheckout} className="p-6 border-t border-slate-200/80 liquid-glass-sub space-y-3">
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Gold Bullion Value:</span>
                    <span className="text-slate-900 font-mono font-medium">₹{subtotalGold.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minting & Making Charges:</span>
                    <span className="text-slate-900 font-mono font-medium">₹{makingChargesTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (3% Bullion Tax):</span>
                    <span className="text-slate-900 font-mono font-medium">₹{taxGst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800">
                    <span className="flex items-center gap-1 font-medium">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" /> Armored Courier Shipping:
                    </span>
                    <span className="font-bold text-emerald-700">FREE</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                    <span className="text-amber-800">Total Payable:</span>
                    <span className="text-lg font-mono text-emerald-800">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full liquid-glass rounded-xl px-3 py-2 text-xs text-slate-900 border border-slate-200/80 outline-none focus:border-amber-500 bg-white/80"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Payment Gateway
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {(['UPI', 'CREDIT_CARD', 'NET_BANKING'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                          paymentMethod === m
                            ? 'liquid-glass-gold border-amber-400 text-amber-900 ring-2 ring-amber-400/30'
                            : 'liquid-glass-sub text-slate-600 border-slate-200/80 hover:bg-white'
                        }`}
                      >
                        {m === 'UPI' ? 'Instant UPI' : m === 'CREDIT_CARD' ? 'Card' : 'NetBank'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 liquid-glass-btn-primary text-white font-bold text-xs rounded-full shadow-xl cursor-pointer"
                >
                  Pay ₹{grandTotal.toLocaleString('en-IN')} & Confirm Order
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
