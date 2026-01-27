'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader2, TabletSmartphone, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuthScreenStore } from '../../store/useAuthScreenStore';

const Signup = () => {
  const setCurrentScreen = useAuthScreenStore((state) => state.setCurrentScreen);
  const [formData, setFormData] = useState({
    mobileNumber: '',
    otp: '',
    otpVerified: false,
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [mobileStatus, setMobileStatus] = useState(null); // null | "not_registered" | "has_password" | "no_password"
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Handle input
  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  // ✅ When user types 10 digits, check DB
  useEffect(() => {
    if (formData.mobileNumber.length === 10) {
      checkMobile();
    } else {
      setMobileStatus(null);
    }
  }, [formData.mobileNumber]);

  const checkMobile = async () => {
    try {
      const res = await fetch('/api/get-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: formData.mobileNumber, action: 'check_mobile' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMobileStatus('not_registered');
        toast.error(data.error || 'Your Number is Not Registered.');
        return;
      }

      if (data?.user?.CM_Password && data.user.CM_Password.length > 0) {
        setMobileStatus('has_password');
        toast('This number already has an account. Redirecting to Forgot Password...', {
          icon: '⚠️',
          duration: 4000,
        });
        setTimeout(() => setCurrentScreen('forgot'), 3000);
      } else {
        setMobileStatus('no_password');
        toast.success('Number found. Please verify OTP to set password.');
      }
    } catch {
      toast.error('Error checking number');
    }
  };

  // ✅ Send OTP
  const sendOtp = async () => {
    if (mobileStatus !== 'no_password') {
      toast.error('This number cannot receive OTP for signup.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: formData.mobileNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        toast.success('OTP sent successfully');
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch {
      toast.error('Network error while sending OTP');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verify OTP
  const verifyOtp = async () => {
    if (!formData.otp) {
      toast.error('Enter OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: formData.mobileNumber, otp: formData.otp }),
      });
      const data = await res.json();
      if (data.success) {
        handleChange('otpVerified', true);
        toast.success('OTP verified successfully');
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch {
      toast.error('Network error while verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Final submit (set password)
  const handleSignup = async () => {
    if (!formData.otpVerified) {
      toast.error('Please verify OTP first');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/get-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: formData.mobileNumber,
          password: formData.password,
          action: 'set_password',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Password Set Successfully. Please login.');
        setCurrentScreen('login');
      } else {
        toast.error(data.error || 'Signup failed');
      }
    } catch {
      toast.error('Error setting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-200">Create Account</h2>
        <p className="text-gray-400">Enter your number to verify and set password</p>
      </div>

      {/* Mobile Input */}
      <div className="relative">
        <TabletSmartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-500" />
        <input
          type="text"
          placeholder="Mobile Number"
          maxLength={10}
          value={formData.mobileNumber}
          onChange={(e) => handleChange('mobileNumber', e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-yellow-200 rounded-lg text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {/* Send OTP */}
      {mobileStatus === 'no_password' && (
        <button
          type="button"
          onClick={sendOtp}
          disabled={loading || otpSent}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" /> Sending...
            </>
          ) : otpSent ? (
            'OTP Sent'
          ) : (
            'Send OTP'
          )}
        </button>
      )}

      {/* OTP Field */}
      {otpSent && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={formData.otp}
            onChange={(e) => handleChange('otp', e.target.value)}
            className="w-full p-3 bg-white/80 border border-green-300 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-500"
          />
          {!formData.otpVerified ? (
            <button
              type="button"
              onClick={verifyOtp}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
            >
              Verify OTP
            </button>
          ) : (
            <div className="flex items-center justify-center text-green-500 gap-2">
              <CheckCircle className="h-5 w-5" /> OTP Verified
            </div>
          )}
        </>
      )}

      {/* Password */}
      {formData.otpVerified && (
        <>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-yellow-200 rounded-lg text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-500"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-500" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-yellow-200 rounded-lg text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-500"
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSignup}
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-60 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" /> Creating Account...
              </>
            ) : (
              'Set Password'
            )}
          </button>
        </>
      )}

      <p className="text-center text-gray-300">
        Already have an account?{' '}
        <button
          onClick={() => setCurrentScreen('login')}
          className="text-blue-400 font-medium hover:text-blue-300 transition-all"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};

export default Signup;
