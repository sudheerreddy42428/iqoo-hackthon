import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Coffee, 
  CreditCard, 
  ArrowRight, 
  Plus, 
  Minus, 
  CheckCircle2, 
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { SimulatedScreen, CartItem, SimulatedProduct } from '../types/reprox';
import { COFFEE_PRODUCTS } from '../data/products';
import { actionTracker } from '../services/actionTracker';
import { crashSimulator } from '../services/crashSimulator';

interface SimulatedAppProps {
  onTriggerCrash: (templateKey?: string, screen?: string) => void;
  activeScreen?: SimulatedScreen;
  onScreenChange?: (screen: SimulatedScreen) => void;
  isAutoFixed?: boolean;
  selectedScenario?: string;
  autoPlay?: boolean;
}

export const SimulatedApp: React.FC<SimulatedAppProps> = ({
  onTriggerCrash,
  activeScreen = 'Home',
  onScreenChange,
  isAutoFixed = false,
  selectedScenario = 'NULL_POINTER_CHECKOUT',
  autoPlay = false,
}) => {
  const [screen, setScreen] = useState<SimulatedScreen>(activeScreen);
  const [isPlayingCrash, setIsPlayingCrash] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([
    { product: COFFEE_PRODUCTS[0], quantity: 1 } // Start with Cold Coffee
  ]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const customerName = 'Alex Morgan';
  const tableNumber = 'Table 04';
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const navigateTo = (newScreen: SimulatedScreen) => {
    setScreen(newScreen);
    onScreenChange?.(newScreen);
    actionTracker.recordAction(
      'NAVIGATION',
      newScreen,
      `Navigated to ${newScreen}`,
      { from: screen, to: newScreen },
      'Navigate',
      newScreen
    );
  };

  const addToCart = (product: SimulatedProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    actionTracker.recordAction(
      'CLICK',
      screen,
      `Added "${product.name}" to cart ($${product.price.toFixed(2)})`,
      { productId: product.id, price: product.price },
      'Tap',
      `Add ${product.name}`
    );
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });

    actionTracker.recordAction(
      'STATE_CHANGE',
      screen,
      `Updated cart quantity for product ${productId} by ${delta > 0 ? '+1' : '-1'}`,
      { productId, delta },
      'Tap',
      delta > 0 ? 'Increase Quantity' : 'Decrease Quantity'
    );
  };

  const selectPayment = (method: string) => {
    setSelectedPaymentMethod(method);
    actionTracker.recordAction(
      'CLICK',
      'Checkout',
      `Selected payment method: ${method}`,
      { method },
      'Select',
      method
    );
  };

  const handlePayClick = () => {
    actionTracker.recordAction(
      'CLICK',
      screen,
      `Pressed "Pay Now" ($${totalAmount.toFixed(2)})`,
      { paymentMethod: selectedPaymentMethod, total: totalAmount },
      'Tap',
      'Pay Now'
    );

    // If paymentMethod is null or empty, trigger the NullPointerException!
    if (!selectedPaymentMethod) {
      if (isAutoFixed) {
        actionTracker.recordAction(
          'STATE_CHANGE',
          screen,
          'Auto-Fix prevented crash: Showed validation error',
          { error: 'No payment method selected' },
          'System',
          'Validation Error'
        );
        // We simulate showing a validation error instead of crashing
        alert('Please select a payment method before proceeding.');
        return;
      }
      onTriggerCrash('NULL_POINTER_CHECKOUT', screen);
      return;
    }

    // Normal happy path
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaymentProcessing(false);
      setOrderComplete(true);
      actionTracker.recordAction(
        'STATE_CHANGE',
        screen,
        'Payment successful! Order #7429 generated',
        { orderId: 'ORD-7429', status: 'SUCCESS' },
        'System',
        'Order Complete'
      );
    }, 1200);
  };

  const resetSimulatedApp = () => {
    setCart([{ product: COFFEE_PRODUCTS[0], quantity: 1 }]);
    setSelectedPaymentMethod(null);
    setOrderComplete(false);
    setPaymentProcessing(false);
    navigateTo('Home');
    actionTracker.recordAction('STATE_CHANGE', 'Home', 'Reset application state to initial', undefined, 'Tap', 'Reset App');
  };

  const playCrashSequence = async () => {
    if (isPlayingCrash) return;
    setIsPlayingCrash(true);
    resetSimulatedApp();
    await new Promise(r => setTimeout(r, 600));

    if (selectedScenario === 'NULL_POINTER_CHECKOUT') {
      navigateTo('Products');
      await new Promise(r => setTimeout(r, 800));
      addToCart(COFFEE_PRODUCTS[1]);
      await new Promise(r => setTimeout(r, 800));
      navigateTo('Cart');
      await new Promise(r => setTimeout(r, 800));
      navigateTo('Checkout');
      await new Promise(r => setTimeout(r, 1200));
      onTriggerCrash(selectedScenario, 'Checkout');
    } else if (selectedScenario === 'INDEX_OUT_OF_BOUNDS_CART') {
      navigateTo('Products');
      await new Promise(r => setTimeout(r, 800));
      addToCart(COFFEE_PRODUCTS[0]);
      await new Promise(r => setTimeout(r, 600));
      addToCart(COFFEE_PRODUCTS[1]);
      await new Promise(r => setTimeout(r, 800));
      navigateTo('Cart');
      await new Promise(r => setTimeout(r, 1200));
      onTriggerCrash(selectedScenario, 'Cart');
    } else if (selectedScenario === 'NETWORK_TIMEOUT_API') {
      navigateTo('Products');
      await new Promise(r => setTimeout(r, 800));
      addToCart(COFFEE_PRODUCTS[2]);
      await new Promise(r => setTimeout(r, 800));
      navigateTo('Cart');
      await new Promise(r => setTimeout(r, 800));
      navigateTo('Checkout');
      await new Promise(r => setTimeout(r, 800));
      selectPayment('UPI');
      await new Promise(r => setTimeout(r, 1200));
      onTriggerCrash(selectedScenario, 'Checkout');
    } else if (selectedScenario === 'HAPPY_PATH') {
      navigateTo('Products');
      await new Promise(r => setTimeout(r, 800));
      addToCart(COFFEE_PRODUCTS[0]);
      await new Promise(r => setTimeout(r, 800));
      navigateTo('Cart');
      await new Promise(r => setTimeout(r, 800));
      navigateTo('Checkout');
      await new Promise(r => setTimeout(r, 800));
      selectPayment('CREDIT_CARD');
      await new Promise(r => setTimeout(r, 800));
      handlePayClick(); // This will trigger happy path logic in SimulatedApp (setTimeout 1200ms -> setOrderComplete(true))
      await new Promise(r => setTimeout(r, 1500));
      onTriggerCrash('HAPPY_PATH', 'Checkout'); // Use onTriggerCrash to pass back success state to parent
    }

    setIsPlayingCrash(false);
  };

  React.useEffect(() => {
    if (autoPlay) {
      playCrashSequence();
    }
  }, [autoPlay, selectedScenario]);



  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const totalAmount = subtotal + tax;

  return (
    <div className="flex flex-col h-full bg-dark-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Device Chrome / Header */}
      <div className="px-4 py-2.5 bg-dark-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80 hidden sm:block" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 hidden sm:block" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 hidden sm:block" />
            <span className="font-mono text-[11px] text-slate-300 font-semibold ml-1 sm:ml-0">
              {crashSimulator.getMockDeviceContext().deviceModel}
            </span>
          </div>
          <span className="hidden sm:inline text-slate-600 font-mono">|</span>
          <span className="font-mono text-[10px] text-slate-400">
            {crashSimulator.getMockDeviceContext().os} • {crashSimulator.getMockDeviceContext().batteryLevelPercent}% Battery
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            State: Healthy
          </span>
          <button
            onClick={resetSimulatedApp}
            title="Reset Simulated App State"
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Crash Trigger Bar */}
      <div className="px-4 py-2.5 bg-rose-950/20 border-b border-rose-900/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-medium hidden sm:inline">Deliberate Crash Trigger:</span>
          <span className="text-[11px] text-rose-400/80">Plays out the steps for {selectedScenario}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={playCrashSequence}
            disabled={isPlayingCrash}
            className={`px-3 py-1 text-xs font-semibold rounded-md shadow-lg shadow-rose-900/40 flex items-center gap-1.5 transition-all ${
              isPlayingCrash 
                ? 'bg-rose-900 text-rose-300 opacity-50 cursor-not-allowed' 
                : 'bg-rose-600 hover:bg-rose-500 text-white hover:scale-105'
            }`}
          >
            {isPlayingCrash ? (
              <>
                <span className="animate-spin w-3 h-3 border-2 border-white/20 border-t-white rounded-full" />
                <span>Simulating Action Flow...</span>
              </>
            ) : (
              <>
                <span>💥</span>
                <span>Play Crash Sequence</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* App Navigation Bar */}
      <div className="px-4 py-2 bg-dark-850 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(['Home', 'Products', 'Cart', 'Checkout'] as SimulatedScreen[]).map((s) => {
            const isActive = screen === s;
            return (
              <button
                key={s}
                onClick={() => navigateTo(s)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {s}
                {s === 'Cart' && totalItems > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-500 text-dark-950 font-mono text-[10px] font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-xs font-mono text-slate-400">
          Screen: <span className="text-slate-200 font-semibold">{screen}</span>
        </div>
      </div>

      {/* Screen Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-dark-900">
        {/* SCREEN 1: HOME */}
        {screen === 'Home' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Hero banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-indigo-600/20 border border-amber-500/20 flex items-center justify-between">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 font-semibold">
                  ☕ Artisanal Brews
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  ReproX Coffee Roasters
                </h2>
                <p className="text-xs text-slate-300">
                  Tap items to order. Every action is buffered for crash telemetry!
                </p>
              </div>
              <div className="text-3xl">☕</div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigateTo('Products')}
                className="p-3 rounded-lg bg-dark-800 border border-slate-700/60 hover:border-cyan-500/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <Coffee className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                </div>
                <div className="font-semibold text-xs text-slate-200">Browse Menu</div>
                <div className="text-[11px] text-slate-400">6 handcrafted drinks</div>
              </button>

              <button
                onClick={() => navigateTo('Cart')}
                className="p-3 rounded-lg bg-dark-800 border border-slate-700/60 hover:border-cyan-500/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <ShoppingBag className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                </div>
                <div className="font-semibold text-xs text-slate-200">View Cart</div>
                <div className="text-[11px] text-slate-400">{totalItems} items in bag</div>
              </button>
            </div>

            {/* Featured Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Featured Today
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {COFFEE_PRODUCTS.slice(0, 2).map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-lg bg-dark-850 border border-slate-800 hover:border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{prod.image}</span>
                      <div>
                        <div className="font-medium text-xs text-slate-200">{prod.name}</div>
                        <div className="font-mono text-xs text-cyan-400">${prod.price.toFixed(2)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(prod)}
                      className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: PRODUCTS */}
        {screen === 'Products' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">Full Menu Catalog</h3>
              <span className="text-xs text-slate-400">{COFFEE_PRODUCTS.length} drinks</span>
            </div>

            <div className="space-y-2">
              {COFFEE_PRODUCTS.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-xl bg-dark-850 border border-slate-800 hover:border-slate-700/80 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl p-1 bg-dark-950 rounded-lg border border-slate-800">
                      {prod.image}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-200">{prod.name}</span>
                        {prod.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300">
                            {prod.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {prod.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1 font-mono text-xs">
                        <span className="text-cyan-400 font-semibold">${prod.price.toFixed(2)}</span>
                        <span className="text-slate-500 text-[10px]">★ {prod.rating}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(prod)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-dark-950 border border-cyan-500/40 transition-all flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 3: CART */}
        {screen === 'Cart' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Your Order Basket</h3>
              <span className="text-xs text-slate-400">{totalItems} items</span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-500 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">Your basket is empty</p>
                <button
                  onClick={() => navigateTo('Products')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Return to Menu
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-lg bg-dark-850 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{item.product.image}</span>
                        <div>
                          <div className="font-semibold text-xs text-slate-200">
                            {item.product.name}
                          </div>
                          <div className="font-mono text-[11px] text-cyan-400">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-dark-950 px-2 py-1 rounded border border-slate-800">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs w-4 text-center font-bold text-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal summary */}
                <div className="p-3 rounded-lg bg-dark-950 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax (8%)</span>
                    <span className="font-mono">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-semibold pt-1 border-t border-slate-800">
                    <span>Total</span>
                    <span className="font-mono text-cyan-400">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigateTo('Checkout')}
                  className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* SCREEN 4: CHECKOUT */}
        {screen === 'Checkout' && !orderComplete && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-sm font-semibold text-white">Checkout & Payment</h3>

            {/* Customer & Location Details */}
            <div className="p-3 rounded-lg bg-dark-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Customer</span>
                <span className="font-medium text-slate-200">{customerName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Table / Order Type</span>
                <span className="font-medium text-slate-200">{tableNumber} (Dine-in)</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Select Payment Method:
                </label>
                <span className="text-[10px] text-rose-400">
                  {selectedPaymentMethod ? '✓ Selected' : '⚠️ Null / Unselected'}
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'UPI', label: 'Instant UPI (Google Pay / PhonePe)', icon: '📱' },
                  { id: 'CREDIT_CARD', label: 'Credit / Debit Card', icon: '💳' },
                  { id: 'CASH', label: 'Cash at Counter', icon: '💵' },
                ].map((pm) => {
                  const isSelected = selectedPaymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => selectPayment(pm.id)}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                        isSelected
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300'
                          : 'bg-dark-850 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{pm.icon}</span>
                        <span className="font-medium">{pm.label}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-dark-950" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Payment Details */}
              {selectedPaymentMethod === 'UPI' && (
                <div className="p-4 bg-dark-900 border border-slate-800 rounded-lg text-center flex flex-col items-center gap-3">
                  <div className="w-32 h-32 bg-white rounded-xl border-4 border-white p-2">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=demo@upi&pn=Demo&cu=INR" alt="QR Code" className="w-full h-full" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">Scan QR to pay with any UPI App</span>
                </div>
              )}
              {selectedPaymentMethod === 'CREDIT_CARD' && (
                <div className="p-3 bg-dark-900 border border-slate-800 rounded-lg space-y-3">
                  <input type="text" placeholder="Card Number" className="w-full text-xs p-2.5 bg-dark-950 border border-slate-700 rounded-lg focus:border-cyan-500 focus:outline-none" />
                  <div className="flex gap-3">
                    <input type="text" placeholder="MM/YY" className="w-1/2 text-xs p-2.5 bg-dark-950 border border-slate-700 rounded-lg focus:border-cyan-500 focus:outline-none" />
                    <input type="text" placeholder="CVV" className="w-1/2 text-xs p-2.5 bg-dark-950 border border-slate-700 rounded-lg focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>
              )}
              {selectedPaymentMethod === 'CASH' && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-lg text-center">
                  <span className="text-xs font-semibold text-emerald-400">Please pay cash at the counter upon pickup.</span>
                </div>
              )}


              {/* Bug Trigger Educational Callout */}
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">💡</span>
                <p>
                  <strong>Bug Simulation Hint:</strong> If you leave the payment method unselected and click{' '}
                  <span className="text-cyan-300 font-mono">"Pay Now"</span>, ReproX will simulate a real{' '}
                  <code className="text-rose-400 font-mono">NullPointerException</code> in CheckoutScreen.kt:142!
                </p>
              </div>
            </div>

            {/* Total and Pay Button */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span>Amount to Pay:</span>
                <span className="font-mono text-cyan-400 text-sm">${totalAmount.toFixed(2)}</span>
              </div>

              <button
                onClick={handlePayClick}
                disabled={paymentProcessing}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-dark-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                <span>{paymentProcessing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)} Now`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Order success confirmation */}
        {orderComplete && (
          <div className="p-6 text-center space-y-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl my-4 animate-fadeIn">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Order Confirmed!</h4>
            <p className="text-xs text-slate-300">
              Your barista is preparing order #ORD-7429 for Table 04.
            </p>
            <button
              onClick={() => {
                setOrderComplete(false);
                navigateTo('Home');
              }}
              className="px-4 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              Start New Order
            </button>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 bg-dark-950 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
        <span>ReproX Android SDK Context Monitor</span>
        <span className="font-mono text-emerald-400">● LIVE</span>
      </div>
    </div>
  );
};
