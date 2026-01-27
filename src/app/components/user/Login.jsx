'use client';

import { Eye, EyeOff, Lock, Loader2, TabletSmartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore, useAuthScreenStore } from '../../store/useAuthScreenStore';
import { useRouter } from 'next/navigation';
import { getValidToken } from '../../store/token';

const Login = () => {
  const setCurrentScreen = useAuthScreenStore((state) => state.setCurrentScreen);

  // Fix: Access store values individually to avoid infinite loops
  const setUser = useAuthStore((state) => state.setUser);
  const setNavLinks = useAuthStore((state) => state.setNavLinks);
  const user = useAuthStore((state) => state.user);

  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    mobileNumber: '',
  });

  // Check if user is already logged in and redirect if needed
  useEffect(() => {
    const checkAuthentication = async () => {
      const token = getValidToken();

      if (token && user) {
        try {
          // Validate token on server
          const response = await fetch('/api/validate-token', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          const data = await response.json();

          if (response.ok && data.valid) {
            // User is already authenticated, redirect to dashboard
            router.replace('/dashboard');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          // If validation fails, we stay on login page
        }
      }
    };

    checkAuthentication();
  }, [router, user]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/get-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: formData.mobileNumber,
          password: formData.password,
          action: 'login',
        }),
        credentials: 'include', // Ensure cookies (token) are handled
      });

      const data = await response.json();
      console.log('Login API Response:', data);

      if (!response.ok) {
        toast(data.error || 'Invalid login credentials.', {
          duration: 5000,
          position: 'top-center',
          icon: '❌',
          style: { background: '#333', color: '#fff' },
        });
        setIsLoading(false);
        return;
      }

      // ✅ Save user in auth store
      setUser(data.user);

      // 🔥 Fetch allowed nav-links for this user
      try {
        const navRes = await fetch(`/api/nav-links?userId=${data.user.CM_User_ID}`, {
          method: 'GET',
          credentials: 'include',
        });
        const navData = await navRes.json();

        if (navData.success) {
          setNavLinks(navData.data);

          // Redirect to first allowed page or dashboard
          const firstSection = Object.keys(navData.data)[0];
          const firstLink = navData.data[firstSection]?.[0]?.href || '/dashboard';

          // Success notification
          toast('Login successful', {
            duration: 3000,
            position: 'top-center',
            icon: '✅',
            style: { background: '#333', color: '#fff' },
          });

          // Reset form
          setFormData({ password: '', mobileNumber: '' });

          // Redirect after notification shows
          setTimeout(() => {
            router.push(firstLink);
          }, 500);
        } else {
          // Fallback to dashboard if nav links couldn't be loaded
          toast('Login successful', {
            duration: 3000,
            position: 'top-center',
            icon: '✅',
            style: { background: '#333', color: '#fff' },
          });

          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
        }
      } catch (err) {
        console.error('Failed to load nav links:', err);

        toast('Login successful', {
          duration: 3000,
          position: 'top-center',
          icon: '✅',
          style: { background: '#333', color: '#fff' },
        });

        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast(error.message || 'Login failed', {
        duration: 5000,
        position: 'top-center',
        icon: '❌',
        style: { background: '#333', color: '#fff' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {/* Mobile Number */}
          <div className="relative">
            <TabletSmartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-500" />
            <input
              type="text"
              placeholder="Mobile Number"
              value={formData.mobileNumber}
              onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-yellow-200 rounded-lg text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-yellow-200 rounded-lg text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-500 hover:text-yellow-600 transition-colors duration-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCurrentScreen('forgot')}
          className="text-m text-white/80 hover:text-white transition-colors duration-200 hover:underline"
        >
          Forgot your password?
        </button>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white text-purple-600 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <p className="text-center text-gray-200">
        Don't have an account?{' '}
        <button
          onClick={() => setCurrentScreen('signup')}
          className="text-white font-medium hover:text-green-300 transition-all duration-200"
          type="button"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

export default Login;
