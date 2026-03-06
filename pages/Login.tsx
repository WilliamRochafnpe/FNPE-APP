
import React, { useState, useEffect } from 'react';
import { supabaseAuth } from '../services/auth/supabaseAuth';
import LoginIdentifier from '../components/auth/LoginIdentifier';
import LoginOtp from '../components/auth/LoginOtp';
import LoginPassword from '../components/auth/LoginPassword';
import SetPassword from '../components/auth/SetPassword';
import ForgotPassword from '../components/auth/ForgotPassword';
import FnpeLogo from '../components/FnpeLogo';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';

type AuthStep = 'IDENTIFIER' | 'OTP' | 'PASSWORD_LOGIN' | 'SET_PASSWORD' | 'FORGOT_PASSWORD';

const Login: React.FC = () => {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('IDENTIFIER');
  const [email, setEmail] = useState('');

  // Handling redirection rules
  useEffect(() => {
    if (user) {
      // If user is logged in but has NO password set, FORCE SetPassword
      // Note: we need to allow access if they just set it (handled in SetPassword)
      if (user.password_defined === false && step !== 'SET_PASSWORD') {
        setStep('SET_PASSWORD');
      } else if (user.password_defined !== false) {
        navigate('/app');
      }
    }
  }, [user, navigate, step]);

  return (
    <div className="min-h-screen bg-[#0A0C10] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      <div className="absolute top-0 left-0 w-full h-96 bg-emerald-500/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-full h-96 bg-indigo-500/5 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="mb-6 relative group animate-in zoom-in-50 duration-700">
            <div className="absolute inset-0 bg-emerald-500/40 blur-[60px] rounded-full opacity-50"></div>
            <FnpeLogo className="w-60 h-60 relative z-10 drop-shadow-2xl" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1 text-center">
            FNPE
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center">
            Federação Norte de Pesca Esportiva
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-[40px] border border-slate-800 shadow-2xl">
          {step === 'IDENTIFIER' && (
            <LoginIdentifier
              onSuccess={(e) => { setEmail(e); setStep('OTP'); }}
              onGoToPassword={() => setStep('PASSWORD_LOGIN')}
            />
          )}

          {step === 'OTP' && (
            <LoginOtp
              email={email}
              onSuccess={() => {
                // Logic handled in useEffect (if password not set -> SET_PASSWORD)
                // If supabase.auth.user() is updated, the effect triggers
              }}
              onBack={() => setStep('IDENTIFIER')}
            />
          )}

          {step === 'PASSWORD_LOGIN' && (
            <LoginPassword
              onSuccess={() => { /* Navigate handled by useEffect */ }}
              onBack={() => setStep('IDENTIFIER')}
              onForgotPassword={() => setStep('FORGOT_PASSWORD')}
            />
          )}

          {step === 'FORGOT_PASSWORD' && (
            <ForgotPassword
              onBack={() => setStep('PASSWORD_LOGIN')}
              onCodeSent={(e) => { setEmail(e); setStep('OTP'); }}
            />
          )}

          {step === 'SET_PASSWORD' && (
            <SetPassword onSuccess={() => navigate('/app')} />
          )}
        </div>

        <p className="text-center text-slate-500 text-[10px] font-black mt-12 uppercase tracking-[0.2em] opacity-50 hover:opacity-100 transition-opacity">
          &copy; 2024 FNPE - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default Login;
