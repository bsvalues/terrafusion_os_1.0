import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, DollarSign, Lock, CheckCircle, AlertCircle,
  Info, Shield, Smartphone, Building, FileText, Calendar,
  TrendingUp, Clock, ChevronRight, X, Zap, Award
 } from '@mui/icons-material';

interface PaymentProcessorProps {
  amount: number;
  description: string;
  applicationId?: string;
  onSuccess: (payment: any) => void;
  onCancel: () => void;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'ach' | 'ewallet';
  last4?: string;
  brand?: string;
  name?: string;
  isDefault?: boolean;
}

export const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  amount,
  description,
  applicationId,
  onSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<'method' | 'details' | 'processing' | 'complete'>('method');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Calculate fees
  const processingFee = amount * 0.029; // 2.9% processing fee
  const convenienceFee = 2.50; // Fixed convenience fee
  const totalAmount = amount + processingFee + convenienceFee;

  useEffect(() => {
    // Load saved payment methods
    const saved = localStorage.getItem('tfpr_payment_methods');
    if (saved) {
      setSavedMethods(JSON.parse(saved));
    }
  }, []);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + (v.length > 2 ? '/' + v.slice(2, 4) : '');
    }
    return v;
  };

  const detectCardBrand = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (cleaned.startsWith('5')) return 'Mastercard';
    if (cleaned.startsWith('3')) return 'Amex';
    if (cleaned.startsWith('6')) return 'Discover';
    return 'Card';
  };

  const processPayment = async () => {
    setProcessing(true);
    setStep('processing');

    // Simulate payment processing
    setTimeout(() => {
      const payment = {
        id: `PAY-${Date.now()}`,
        amount: totalAmount,
        method: selectedMethod,
        card: saveCard ? {
          last4: cardNumber.slice(-4),
          brand: detectCardBrand(cardNumber),
          name: cardName
        } : null,
        applicationId,
        description,
        timestamp: new Date(),
        status: 'completed',
        confirmationNumber: `BEN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };

      // Save payment method if requested
      if (saveCard && cardNumber) {
        const newMethod: PaymentMethod = {
          id: Date.now().toString(),
          type: 'card',
          last4: cardNumber.slice(-4),
          brand: detectCardBrand(cardNumber),
          name: cardName,
          isDefault: savedMethods.length === 0
        };
        const updated = [...savedMethods, newMethod];
        setSavedMethods(updated);
        localStorage.setItem('tfpr_payment_methods', JSON.stringify(updated));
      }

      // Save transaction to history
      const history = JSON.parse(localStorage.getItem('tfpr_payments') || '[]');
      history.push(payment);
      localStorage.setItem('tfpr_payments', JSON.stringify(history));

      setPaymentResult(payment);
      setProcessing(false);
      setStep('complete');
      
      // Call success callback after delay
      setTimeout(() => {
        onSuccess(payment);
      }, 3000);
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div><>

              <h2 className="text-2xl font-bold">Secure Payment</h2>
              <p
</> className="text-white/90 mt-1">{description}</p>
            </div>
            {step !== 'processing' && (
              <button
                onClick={onCancel}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Amount Display */}
          <div className="mt-6 bg-white/10 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><>

                <span>Subtotal</span>
                <span
</>>${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm"><>

                <span>Processing Fee (2.9%)</span>
                <span
</>>${processingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm"><>

                <span>Convenience Fee</span>
                <span
</>>${convenienceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/20"><>

                <span>Total</span>
                <span
</>>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Payment Method */}
            {step === 'method' && (
              <motion.div
                key="method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Payment Method
                </h3>

                {/* Saved Methods */}
                {savedMethods.length > 0 && (
                  <div className="mb-6"><>

                    <p className="text-sm text-gray-600 mb-3">Saved Payment Methods</p>
                    <div
</> className="space-y-2">
                      {savedMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => {
                            setSelectedMethod(method.id);
                            setStep('details');
                          }}
                          className="w-full p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CreditCard className="w-5 h-5 text-gray-400" />
                              <div><>

                                <p className="font-medium text-gray-900">
                                  {method.brand} •••• {method.last4}
                                </p>
                                <p
</> className="text-sm text-gray-500">{method.name}</p>
                              </div>
                            </div>
                            {method.isDefault && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Payment Methods */}<>

                <p className="text-sm text-gray-600 mb-3">New Payment Method</p>
                <div
</> className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      setSelectedMethod('card');
                      setStep('details');
                    }}
                    className="p-6 border-2 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <CreditCard className="w-8 h-8 text-purple-600 mb-2" /><>

                    <p className="font-medium text-gray-900">Credit/Debit Card</p>
                    <p
</> className="text-xs text-gray-500 mt-1">Instant processing</p>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMethod('ach');
                      setStep('details');
                    }}
                    className="p-6 border-2 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <Building className="w-8 h-8 text-blue-600 mb-2" /><>

                    <p className="font-medium text-gray-900">Bank Transfer</p>
                    <p
</> className="text-xs text-gray-500 mt-1">Lower fees</p>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedMethod('ewallet');
                      setStep('details');
                    }}
                    className="p-6 border-2 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <Smartphone className="w-8 h-8 text-green-600 mb-2" /><>

                    <p className="font-medium text-gray-900">Digital Wallet</p>
                    <p
</> className="text-xs text-gray-500 mt-1">Apple/Google Pay</p>
                  </button>
                </div>

                {/* Security Badge */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div className="text-sm"><>

                      <p className="font-medium text-green-900">Bank-Level Security</p>
                      <p
</> className="text-green-700">
                        Your payment information is encrypted and secure. We never store your full card details.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Payment Details */}
            {step === 'details' && selectedMethod === 'card' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              ><>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Card Information
                </h3>

                <div
</> className="space-y-4">
                  <div><>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number
                    </label>
                    <div
</> className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {cardNumber && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-600">
                          {detectCardBrand(cardNumber)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div><>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name
                    </label>
                    <input
</>
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1"><>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
</>
                        type="text"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-1"><>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input
</>
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-1"><>

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
</>
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        placeholder="99336"
                        maxLength={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-gray-700">
                      Save this card for future payments
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-between"><>

                  <button
                    onClick={() => setStep('method')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    ← Back
                  </button>
                  <button
</>
                    onClick={processPayment}
                    disabled={!cardNumber || !cardName || !expiryDate || !cvv}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    Pay ${totalAmount.toFixed(2)}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Processing */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-6"
                /><>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Processing Payment
                </h3>
                <p
</> className="text-gray-600">
                  Please wait while we securely process your payment...
                </p>
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">
                    Secured by 256-bit SSL encryption
                  </span>
                </div>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && paymentResult && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </motion.div><>


                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Successful!
                </h3>
                <p
</> className="text-gray-600 mb-6">
                  Your payment of ${totalAmount.toFixed(2)} has been processed
                </p>

                <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto"><>

                  <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
                  <div
</> className="space-y-2 text-sm">
                    <div className="flex justify-between"><>

                      <span className="text-gray-600">Confirmation #</span>
                      <span
</> className="font-mono font-medium">{paymentResult.confirmationNumber}</span>
                    </div>
                    <div className="flex justify-between"><>

                      <span className="text-gray-600">Date</span>
                      <span
</>>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between"><>

                      <span className="text-gray-600">Amount Paid</span>
                      <span
</> className="font-medium">${totalAmount.toFixed(2)}</span>
                    </div>
                    {applicationId && (
                      <div className="flex justify-between"><>

                        <span className="text-gray-600">Application ID</span>
                        <span
</> className="font-mono">{applicationId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-700"><>

                    <FileText className="w-4 h-4" />
                    Download Receipt
                  </button>
                  <button
</> className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-700">
                    <DollarSign className="w-4 h-4" />
                    View Transaction
                  </button>
                </div>

                <p className="text-sm text-gray-500 mt-8">
                  Closing automatically in 3 seconds...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer - Trust Badges */}
        {step !== 'processing' && step !== 'complete' && (
          <div className="border-t px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>SSL Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>PCI Compliant</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                <span>Verified Merchant</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Instant Processing</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};