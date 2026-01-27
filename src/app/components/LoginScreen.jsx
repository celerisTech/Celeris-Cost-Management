"use client";

import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Loader2,
  Phone,
  Key,
  Sun,
  Battery,
  Zap,
  Shield,
  Sparkles
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Signup from "./user/Signup";
import { useAuthScreenStore } from "../store/useAuthScreenStore";
import Login from "./user/Login";
import toast from "react-hot-toast";

function LoginScreen() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mobileNumber: "",
    confirmPassword: "",
    otp: "",
    otpVerified: false,
    name: ""
  });
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const currentScreen = useAuthScreenStore((state) => state.currentScreen);
  const setCurrentScreen = useAuthScreenStore((state) => state.setCurrentScreen);

  // Handle mouse move for interactive background
  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePosition({ x, y });
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(180deg); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      @keyradient-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes solarGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(255, 204, 0, 0.3); }
        50% { box-shadow: 0 0 40px rgba(255, 204, 0, 0.6); }
      }
      
      @keyframes orbit {
        from { transform: rotate(0deg) translateX(40px) rotate(0deg); }
        to { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
      }
      
      .solar-gradient {
          background-image: url("loginbg.jpg");
          background-size: cover;
          background-position: center;
          animation: image-move 15s ease infinite;
        }

        /* Animation (same timing as your gradient) */
        @keyframes image-move {
          0% {
            background-position: center;
          }
          50% {
            background-position: center 20%;
          }
          100% {
            background-position: center;
          }
        }
      
      .golden-gradient {
        background: linear-gradient(135deg, 
          #FFD700 0%, 
          #FFB347 25%, 
          #FF8C00 50%, 
          #FFA500 75%, 
          #FFD700 100%
        );
        background-size: 200% 200%;
        animation: gradient-gradient 3s ease infinite;
      }
      
      .glass-effect {
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.18);
      }
      
      .solar-card {
        position: relative;
        overflow: hidden;
      }
      
      .solar-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #FFD700, transparent);
        animation: shimmer 2s infinite;
      }
      
      .particle {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 215, 0, 0.2), transparent);
      }
      
      /* Hide scrollbar */
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      
      /* Responsive styles */
      @media (max-width: 640px) {
        .auth-container {
          width: 95% !important;
          padding: 1.5rem !important;
        }
        
        .header-title {
          font-size: 1.75rem !important;
        }
        
        .otp-input {
          width: 50px !important;
          height: 50px !important;
          font-size: 1.5rem !important;
        }
      }
      
      @media (max-height: 700px) {
        .auth-content {
          max-height: 65vh !important;
        }
      }
    `;
    document.head.appendChild(style);

    const initTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 200);

    return () => {
      clearTimeout(initTimer);
      document.head.removeChild(style);
    };
  }, []);

  // Create floating particles
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5
  }));

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }
    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/get-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile: formData.mobileNumber,
          password: formData.password,
          action: "set_password",
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to set password");
      }

      const data = await response.json();
      setFormData({
        password: "",
        confirmPassword: "",
        mobileNumber: "",
        otp: "",
        otpVerified: false
      });
      setCurrentScreen("login");
      toast.success("Password Reset Successfully");
      setIsLoading(false);
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = formData.otp.split('');
      newOtp[index] = value;
      const updatedOtp = newOtp.join('');

      setFormData({
        ...formData,
        otp: updatedOtp
      });

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const sendOtp = async () => {
    if (formData.mobileNumber.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!formData.otp || formData.otp.length < 4) {
      toast.error('Please enter complete OTP');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: formData.mobileNumber, otp: formData.otp }),
      });
      const data = await res.json();
      if (data.success) {
        handleInputChange('otpVerified', true);
        toast.success('OTP verified successfully');
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch {
      toast.error('Network error while verifying OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCustomLogin = () => {
    return (
      <div>
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1rem',
            background: 'radial-gradient(circle, rgba(255, 217, 0, 0.29), transparent)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 217, 0, 1)',
            animation: 'solarGlow 3s ease-in-out infinite'
          }}>
            <User className="h-7 w-7" style={{ color: '#ffdc16ff' }} />
          </div>
          <h2 style={{
            fontSize: '1.7rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
            letterSpacing: '0.5px'
          }}>Login</h2>
        </div>

        <Login customStyles={{
          inputFieldStyle: {
            width: '100%',
            padding: '0.875rem 1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '12px',
            fontSize: '0.95rem',
            color: 'white',
            fontWeight: '500',
            outline: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)'
          },
          inputFocusStyle: {
            borderColor: '#FFD700',
            backgroundColor: 'rgba(255, 215, 0, 0.05)',
            boxShadow: '0 0 0 3px rgba(255, 215, 0, 0.1)',
            transform: 'translateY(-1px)'
          },
          primaryButtonStyle: {
            width: '100%',
            padding: '0.875rem 1rem',
            background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
            color: '#1a3a5f',
            border: 'none',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)'
          },
          primaryButtonHoverStyle: {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px rgba(255, 215, 0, 0.4)',
            background: 'linear-gradient(135deg, #FF8C00 0%, #FFD700 100%)'
          },
          secondaryButtonStyle: {
            width: '100%',
            padding: '0.875rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)'
          },
          secondaryButtonHoverStyle: {
            background: 'rgba(255, 215, 0, 0.1)',
            borderColor: '#FFD700',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)'
          }
        }} />
      </div>
    );
  };

  const renderCustomSignup = () => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          flexShrink: 0
        }}>
          <div style={{
            width: '70px',
            height: '70px',
            margin: '0 auto 0.75rem',
            background: 'radial-gradient(circle, rgba(255,215,0,0.2), transparent)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            animation: 'solarGlow 3s ease-in-out infinite'
          }}>
            <User className="h-8 w-8" style={{ color: '#FFD700' }} />
          </div>
        </div>

        {/* Content area */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: '0.5rem',
              maxHeight: '400px'
            }}
            className="scrollbar-hide"
          >
            <Signup customStyles={{
              inputFieldStyle: {
                width: '100%',
                padding: '0.875rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '12px',
                fontSize: '0.95rem',
                color: 'white',
                fontWeight: '500',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)'
              },
              inputFocusStyle: {
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.05)',
                boxShadow: '0 0 0 3px rgba(255, 215, 0, 0.1)',
                transform: 'translateY(-1px)'
              },
              primaryButtonStyle: {
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
                color: '#1a3a5f',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)'
              },
              primaryButtonHoverStyle: {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(255, 215, 0, 0.4)',
                background: 'linear-gradient(135deg, #FF8C00 0%, #FFD700 100%)'
              },
              secondaryButtonStyle: {
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)'
              },
              secondaryButtonHoverStyle: {
                background: 'rgba(255, 215, 0, 0.1)',
                borderColor: '#FFD700',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)'
              },
              otpInputStyle: {
                width: '60px',
                height: '60px',
                margin: '0 8px',
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: '700',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)'
              },
              otpInputFocusStyle: {
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                boxShadow: '0 0 0 3px rgba(255, 215, 0, 0.2)',
                transform: 'scale(1.05)'
              }
            }} />
          </div>
        </div>

        {/* Bottom link */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '1rem',
          flexShrink: 0
        }}>
          <button
            onClick={() => setCurrentScreen("login")}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, {
                background: 'rgba(255, 215, 0, 0.1)',
                borderColor: '#FFD700',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)'
              });
            }}
            onMouseLeave={(e) => {
              Object.assign(e.target.style, {
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              });
            }}
          >
            <ArrowLeft style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
            Back to Sign In
          </button>
        </div>
      </div>
    );
  };

  const SaranSolarHeader = () => (
    <div className="relative ">
      <div className="flex flex-col">
        {/* Logo + Title with Glass Blur Background */}
        <div
          className="
          flex items-center gap-4
          
          /* Responsive alignment */
          sm:justify-start
          justify-center
          
          /* Responsive adjustments */
          max-sm:gap-2 max-sm:px-4 max-sm:py-3
          max-md:gap-3
          
          /* Container width */
          w-fit
          max-w-full
        "
        >
          <img
            src="/logo.png"
            alt="Celeris Solutions"
            className="
            h-15 w-auto
            drop-shadow-[0_4px_8px_rgba(255,215,0,0.3)]
            max-sm:h-12
            max-md:h-16
          "
          />

          <h1
            className="
            text-4xl font-bold m-0
            bg-[#ffc07c] bg-clip-text text-transparent
            drop-shadow-[0_2px_10px_rgba(255,215,0,0.3)]
            tracking-wide
            
            /* Responsive text sizes */
            max-sm:text-xl
            max-md:text-2xl
            max-lg:text-3xl
            
            /* Prevent text overflow */
            overflow-hidden
            text-ellipsis
            whitespace-nowrap
          "
          >
            Celeris Solutions
          </h1>
        </div>
      </div>
    </div>
  );


  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-full" style={{
        backgroundImage:
          "url('loginbg.jpg')",
      }}>
        <div className="flex justify-center items-center h-64">
          <div className="relative w-20 h-20">

            {/* Core Server */}
            <div className="absolute inset-6 bg-blue-600 rounded-lg animate-pulse shadow-lg"></div>

            {/* Data Lines */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-data-flow"></div>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 h-1 w-full bg-gradient-to-r from-transparent via-blue-300 to-transparent animate-data-flow-reverse"></div>

            {/* Corner Nodes */}
            <span className="absolute top-0 left-0 w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-150"></span>
            <span className="absolute bottom-0 left-0 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-300"></span>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-500"></span>

          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="solar-gradient"
    >
      {/* Interactive Background Elements */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none'
      }}>
        {/* Dynamic gradient based on mouse */}
        <div style={{
          position: 'absolute',
          top: `${mousePosition.y}%`,
          left: `${mousePosition.x}%`,
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          transition: 'all 0.3s ease-out'
        }} />

        {/* Floating particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animation: `float ${particle.duration}s ease-in-out ${particle.delay}s infinite`
            }}
          />
        ))}

        {/* Energy grid lines */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
          linear-gradient(90deg, rgba(255,215,0,0.05) 1px, transparent 1px),
          linear-gradient(0deg, rgba(255,215,0,0.05) 1px, transparent 1px)
        `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black, transparent 70%)'
        }} />
      </div>

      {/* Main Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '0.5rem'
      }}>
        {/* Header positioned at top left */}
        <div className="w-full">
          <div className="container mx-auto px-4 mt-3">
            <SaranSolarHeader />
          </div>
        </div>

        {/* Navigation Buttons - Absolute positioning */}
        <div className="absolute top-6 right-6 flex gap-3 z-20
        max-sm:top-4 max-sm:right-4 max-sm:gap-2">
          {/* Add your navigation buttons here */}
        </div>

        {/* Auth Container - Centered vertically */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          paddingTop: '2rem',
          paddingBottom: '2rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            position: 'relative',
            zIndex: 15
          }}>
            {/* Auth Card */}
            <div className="solar-card glass-effect" style={{
              borderRadius: '24px',
              padding: '2rem',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Shimmer effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
                animation: 'shimmer 3s infinite'
              }} />

              {currentScreen === "login" && renderCustomLogin()}

              {currentScreen === "signup" && renderCustomSignup()}

              {currentScreen === "forgot" && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'hidden'
                }}>
                  {renderForgotPasswordScreen()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  function renderForgotPasswordScreen() {
    const otpDigits = formData.otp ? formData.otp.split('') : ['', '', '', ''];

    return (
      <>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          flexShrink: 0
        }}>
          <div style={{
            width: '70px',
            height: '70px',
            margin: '0 auto 0.75rem',
            background: 'radial-gradient(circle, rgba(255,215,0,0.2), transparent)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            animation: 'solarGlow 3s ease-in-out infinite'
          }}>
            <Key className="h-8 w-8" style={{ color: '#FFD700' }} />
          </div>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.25rem',
            letterSpacing: '0.5px'
          }}>Reset Access</h2>
        </div>

        {/* Content area */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: '0.5rem',
              maxHeight: '400px'
            }}
            className="scrollbar-hide auth-content"
          >
            {/* Mobile Number Input */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <Phone style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                height: '1.2rem',
                width: '1.2rem',
                color: 'rgba(207, 187, 0, 1)',
                zIndex: 2
              }} />
              <input
                type="text"
                placeholder="Mobile Number"
                value={formData.mobileNumber}
                maxLength={10}
                onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  color: 'white',
                  fontWeight: '500',
                  outline: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FFD700';
                  e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.05)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'translateY(0)';
                }}
                required
                autoComplete="off"
              />
            </div>

            {/* Send OTP Button */}
            <button
              type="button"
              onClick={sendOtp}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
                color: '#1a3a5f',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
                marginBottom: '1.5rem'
              }}
              onMouseEnter={(e) => {
                Object.assign(e.target.style, {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 30px rgba(255, 215, 0, 0.4)',
                  background: 'linear-gradient(135deg, #FF8C00 0%, #FFD700 100%)'
                });
              }}
              onMouseLeave={(e) => {
                Object.assign(e.target.style, {
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
                  color: '#1a3a5f',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)',
                  marginBottom: '1.5rem'
                });
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 style={{
                    animation: 'spin 1s linear infinite',
                    height: '1.1rem',
                    width: '1.1rem',
                    marginRight: '0.5rem'
                  }} />
                  Sending OTP...
                </div>
              ) : (
                'Send Verification Code'
              )}
            </button>

            {/* OTP Input */}
            {otpSent && (
              <>
                <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    marginBottom: '1rem',
                    fontWeight: '500'
                  }}>
                    Enter 4-digit verification code
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                    {[0, 1, 2, 3].map((index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={otpDigits[index] || ''}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        style={{
                          width: '55px',
                          height: '55px',
                          textAlign: 'center',
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '2px solid rgba(255, 215, 0, 0.3)',
                          borderRadius: '12px',
                          color: 'white',
                          outline: 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          backdropFilter: 'blur(10px)'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#FFD700';
                          e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.1)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.2)';
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                          e.target.style.boxShadow = 'none';
                          e.target.style.transform = 'scale(1)';
                        }}
                        autoComplete="off"
                        className="otp-input"
                      />
                    ))}
                  </div>
                </div>

                {/* Verify OTP Button */}
                <button
                  type="button"
                  onClick={verifyOtp}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
                    color: '#1a3a5f',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)',
                    marginBottom: '1.5rem'
                  }}
                  onMouseEnter={(e) => {
                    Object.assign(e.target.style, {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 30px rgba(255, 215, 0, 0.4)',
                      background: 'linear-gradient(135deg, #FF8C00 0%, #FFD700 100%)'
                    });
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(e.target.style, {
                      width: '100%',
                      padding: '0.875rem 1rem',
                      background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
                      color: '#1a3a5f',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                      backdropFilter: 'blur(10px)',
                      marginBottom: '1.5rem'
                    });
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader2 style={{
                        animation: 'spin 1s linear infinite',
                        height: '1.1rem',
                        width: '1.1rem',
                        marginRight: '0.5rem'
                      }} />
                      Verifying...
                    </div>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </>
            )}

            {/* Password Fields */}
            {formData.otpVerified && (
              <>
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <Lock style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    height: '1.2rem',
                    width: '1.2rem',
                    color: 'rgba(245, 213, 34, 1)',
                    zIndex: 2
                  }} />

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem 0.875rem 3rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      color: 'white',
                      fontWeight: '500',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: 'blur(10px)',
                      paddingRight: '3rem'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FFD700';
                      e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.05)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.transform = 'translateY(0)';
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 209, 3, 0.6)',
                      cursor: 'pointer',
                      zIndex: 2,
                      padding: '0.25rem',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(255,215,0,0.15)';
                      e.target.style.color = '#FFD700';
                      e.target.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = 'rgba(255, 255, 255, 0.6)';
                      e.target.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <Lock style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    height: '1.2rem',
                    width: '1.2rem',
                    color: 'rgba(255, 208, 0, 1)',
                    zIndex: 2
                  }} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem 0.875rem 3rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      color: 'white',
                      fontWeight: '500',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      backdropFilter: 'blur(10px)',
                      paddingRight: '3rem'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FFD700';
                      e.target.style.backgroundColor = 'rgba(255, 215, 0, 0.05)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.transform = 'translateY(0)';
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      zIndex: 2,
                      padding: '0.25rem',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(255,215,0,0.15)';
                      e.target.style.color = '#FFD700';
                      e.target.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = 'rgba(255, 255, 255, 0.6)';
                      e.target.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleForgotPasswordSubmit}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
                    color: '#1a3a5f',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    Object.assign(e.target.style, {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 30px rgba(255, 215, 0, 0.4)',
                      background: 'linear-gradient(135deg, #FF8C00 0%, #FFD700 100%)'
                    });
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(e.target.style, {
                      width: '100%',
                      padding: '0.875rem 1rem',
                      background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
                      color: '#1a3a5f',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                      backdropFilter: 'blur(10px)'
                    });
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader2 style={{
                        animation: 'spin 1s linear infinite',
                        height: '1.1rem',
                        width: '1.1rem',
                        marginRight: '0.5rem'
                      }} />
                      Updating Password...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom link */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '1rem',
          flexShrink: 0
        }}>
          <button
            onClick={() => setCurrentScreen("login")}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, {
                background: 'rgba(255, 215, 0, 0.1)',
                borderColor: '#FFD700',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)'
              });
            }}
            onMouseLeave={(e) => {
              Object.assign(e.target.style, {
                width: '100%',
                padding: '0.875rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              });
            }}
          >
            <ArrowLeft style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
            Back to Sign In
          </button>
        </div>
      </>
    );
  }
}

export default LoginScreen;