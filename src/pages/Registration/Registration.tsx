import React, { useState } from 'react';
import { ForwardArrowSVG } from '../../assets/icons/icons';
import logo from '../../assets/logo_kdm.png';
import onb from '../../assets/onb.png';
import corp from '../../assets/corp.png';
import kids from '../../assets/kids.png';
import Modal from './Modal';
import { useAuth } from '../../context/AuthContext/AuthContext';
import AlertMessage from '../../components/AlertMessage';
import { Eye, EyeOff } from 'lucide-react';

interface Props {}

const Registration: React.FC<Props> = () => {
  const { login, initiateRegistration, register, resetToken, resetPassword, isAuthenticated } = useAuth();
  const [flow, setFlow] = useState<'login' | 'register' | null>(null);
  const [isCorper, setIsCorper] = useState<boolean>(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<any>({});
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [errors, setErrors] = useState<{ [key:string]: string }>({});

  const openFlow = (type: 'login' | 'register', corper: boolean = false) => {
    setFlow(type);
    setIsCorper(corper);
    setStep(0);
    setForm({});
  };

  const closeModal = () => {
    setFlow(null);
    setForm({}); // Clear form on modal close to avoid persistence across flows
  };

  const next = () => setStep((s) => s + 1);
  const goToLogin = () => {
    setFlow('login');
    setStep(0);
    setForm({});
  };

  const handleAsync = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
    } catch (error: any) {
      setAlertMsg(error.message || 'An error occurred');
      setAlertOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const validateLogin = () => {
    const errs: any = {};
    if (!form.email) errs.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateInitiate = () => {
    const errs: any = {};
    if (!form.email) errs.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone) errs.phone = 'Phone required';
    else if (!/^\d+$/.test(form.phone)) errs.phone = 'Phone must be numeric';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateVerify = () => {
    const errs: any = {};
    if (!form.token) errs.token = 'Token required';
    if (isCorper && !form.access_code) errs.access_code = 'Code required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateRegister = () => {
    const errs: any = {};
    if (!form.fullName) errs.fullName = 'Name required';
    if (!form.country) errs.country = 'Country required';
    if (!form.gender) errs.gender = 'Gender required';
    if (!form.password) errs.password = 'Password required';
    else if (form.password.length < 6) errs.password = 'Min 6 chars';
    if (!form.agreed) errs.agreed = 'Must agree';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateReset = () => {
    const errs: any = {};
    if (!form.email) errs.email = 'Email required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateResetPassword = () => {
    const errs: any = {};
    if (!form.password) errs.password = 'Password required';
    if (!form.confirm_password) errs.confirm_password = 'Confirm required';
    else if (form.password !== form.confirm_password) errs.confirm_password = 'No match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = () => handleAsync(async () => {
    if (!validateLogin()) return;
    await login(form.email, form.password);
    setForm({});
  });

  const handleInitiateRegistration = () => handleAsync(async () => {
    if (!validateInitiate()) return;
    await initiateRegistration(form.email, form.phone);
    setForm({});
    next();
  });

  const handleVerify = () => {
    if (!validateVerify()) return;
    next();
  };

  const handleRegister = () => handleAsync(async () => {
    if (!validateRegister()) return;
    const registrationData = {
      type: isCorper ? 2 : 1,
      email: form.email,
      phone: form.phone,
      token: form.token,
      firstname: form.fullName?.split(' ')[0] || '',
      lastname: form.fullName?.split(' ').slice(1).join(' ') || '-',
      country: form.country,
      gender: form.gender,
      password: form.password,
      referral_code: form.referral || '-',
      ...(isCorper && {
        state_of_origin: form.state_of_origin,
        state_code: form.state_code,
        sector: form.sector,
        nin: form.nin,
        callup_number: form.callup_number || null,
        access_code: form.access_code,
      }),
    };
    await register(registrationData);
    setForm({});
  });

  const handleSendReset = () => handleAsync(async () => {
    if (!validateReset()) return;
    await resetToken(form.email);
    next();
    setForm({});
  });

  const handleResetPassword = () => handleAsync(async () => {
    if (!validateResetPassword()) return;
    await resetPassword(form.token, form.password);
    next();
    setForm({});
  });

  const renderModalContent = () => {
    if (!flow) return null;

    if (flow === 'login') {
      if (step === 0) return (
        <>
          <h2 className="text-lg font-bold mb-2">Login</h2>
          <label className="text-xs mb-1 block">Email</label>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
            value={form.email || ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
          <label className="text-xs mb-1 block">Password</label>
          <div className="relative mb-2">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Password"
              className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              className="absolute right-2 top-2"
              onClick={() => setShowPwd(!showPwd)}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
          <div className="flex w-full gap-2 flex-col justify-end items-end mb-4">
            <button
              className="text-xs"
              onClick={() => setStep(1)}
            >
              Forgot password?
            </button>
            <button
              onClick={handleLogin}
              className="flex items-center mt-10 justify-center gap-2 w-full px-4 py-2 bg-[#FFD30F] rounded font-bold disabled:opacity-50"
              disabled={loading}
            >
              {loading ? <div className="loader"></div> : 'Login'}
            </button>
            <div className="flex w-full mt-2 items-center justify-center gap-1">
              <p className="text-xs">No Account Yet?</p>
              <p
                className="text-xs text-[#68049B] cursor-pointer"
                onClick={() => openFlow('register')}
              >
                Sign Up
              </p>
            </div>
          </div>
        </>
      );

      if (step === 1) return (
        <>
          <h2 className="text-lg font-bold mb-2">Reset Password</h2>
          <p className="text-xs text-gray-500 mb-4">
            Enter your email to receive a reset token
          </p>
          <label className="text-xs mb-1 block">Email</label>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-4 text-sm"
            value={form.email || ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
          <button
            onClick={handleSendReset}
            className="w-full py-2 bg-[#FFD30F] flex items-center justify-center mb-2 rounded font-bold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <div className="loader"></div> : 'Send Token'}
          </button>
        </>
      );

      if (step === 2) return (
        <>
          <h2 className="text-lg font-bold mb-2">Verification</h2>
          <p className="text-xs text-gray-500 mb-4">
            Enter the reset token sent to your email
          </p>
          <label className="text-xs mb-1 block">Token</label>
          <input
            type="text"
            placeholder="Reset token"
            className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-4 text-sm"
            value={form.token || ''}
            onChange={(e) => setForm({ ...form, token: e.target.value })}
          />
          {errors.token && <span className="text-xs text-red-500">{errors.token}</span>}
          <button
            onClick={next}
            className="w-full py-2 bg-[#FFD30F] flex items-center justify-center mb-2 rounded font-bold disabled:opacity-50"
            disabled={loading || !form.token}
          >
            {loading ? <div className="loader"></div> : 'Continue'}
          </button>
        </>
      );

      if (step === 3) return (
        <>
          <h2 className="text-lg font-bold mb-2">Set New Password</h2>
          <label className="text-xs mb-1 block">New Password</label>
          <div className="relative mb-2">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="New Password"
              className="w-full p-2 outline-none border-none bg-gray-200 rounded text-sm"
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              className="absolute right-2 top-2"
              onClick={() => setShowPwd(!showPwd)}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
          <label className="text-xs mb-1 block">Confirm New Password</label>
          <div className="relative mb-4">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Confirm New Password"
              className="w-full p-2 outline-none border-none bg-gray-200 rounded text-sm"
              value={form.confirm_password || ''}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            />
            <button
              className="absolute right-2 top-2"
              onClick={() => setShowPwd(!showPwd)}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirm_password && <span className="text-xs text-red-500">{errors.confirm_password}</span>}
          <button
            onClick={handleResetPassword}
            className="w-full py-2 bg-[#FFD30F] flex items-center justify-center mb-2 rounded font-bold disabled:opacity-50"
            disabled={loading || !form.password || !form.confirm_password}
          >
            {loading ? <div className="loader"></div> : 'Reset Password'}
          </button>
        </>
      );

      if (step === 4) return (
        <>
          <h2 className="text-lg font-bold mb-2">Password Reset Successful</h2>
          <p className="text-xs mb-2 text-gray-500">
            Your password has been reset successfully. Please log in with your new password.
          </p>
          <button
            onClick={goToLogin}
            className="w-full py-2 bg-[#FFD30F] flex items-center justify-center mb-2 rounded font-bold"
          >
            Go to Login
          </button>
        </>
      );
    }

    if (flow === 'register') {
      if (step === 0) return (
        <>
          <h2 className="text-lg font-bold mb-2">Request Verification Token</h2>
          <label className="text-xs mb-1 block">Email</label>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
            value={form.email || ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
          <label className="text-xs mb-1 block">Phone Number</label>
          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-4 text-sm"
            value={form.phone || ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
          <button
            onClick={handleInitiateRegistration}
            className="w-full py-2 flex items-center justify-center bg-[#FFD30F] mb-5 rounded font-bold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <div className="loader"></div> : 'Send Token'}
          </button>
        </>
      );

      if (step === 1) return (
        <>
          <h2 className="text-lg font-bold mb-2">Enter Verification Token</h2>
          <p className="text-xs text-gray-500 mb-4">
            Check your email for the verification token
          </p>
          <label className="text-xs mb-1 block">Verification Token</label>
          <input
            type="text"
            id="token"
            value={form.token || ''}
            placeholder="Token from email"
            className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
            onChange={(e) => setForm({ ...form, token: e.target.value })}
          />
          {errors.token && <span className="text-xs text-red-500">{errors.token}</span>}
          {isCorper && (
            <>
              <label className="text-xs mb-1 block">Community Code</label>
              <input
                type="text"
                value={form.access_code || ''}
                placeholder="Community Code"
                className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
                onChange={(e) => setForm({ ...form, access_code: e.target.value })}
              />
              {errors.access_code && <span className="text-xs text-red-500">{errors.access_code}</span>}
            </>
          )}
          <button
            onClick={handleVerify}
            className="w-full py-2 bg-[#FFD30F] flex items-center justify-center rounded font-bold disabled:opacity-50"
            disabled={loading || !form.token}
          >
            {loading ? <div className="loader"></div> : 'Continue'}
          </button>
        </>
      );

      if (step === 2) return (
        <>
          <h2 className="text-lg font-bold mb-2">Complete Sign Up</h2>
          <label className="text-xs mb-1 block">Full Name</label>
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
            value={form.fullName || ''}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          {errors.fullName && <span className="text-xs text-red-500">{errors.fullName}</span>}
          <label className="text-xs mb-1 block">Country</label>
          <select
            value={form.country || ''}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
          >
            <option value="">Select Country</option>
            <option value="NG">Nigeria</option>
            <option value="US">United States</option>
            <option value="PG">Papua New Guinea</option>
            <option value="GW">Guinea-Bissau</option>
          </select>
          {errors.country && <span className="text-xs text-red-500">{errors.country}</span>}
          <label className="text-xs mb-1 block">Gender</label>
          <select
            value={form.gender || ''}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors.gender && <span className="text-xs text-red-500">{errors.gender}</span>}
          {isCorper && (
            <>
              <label className="text-xs mb-1 block">State of Origin</label>
              <input
                type="text"
                placeholder="State of Origin"
                className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
                value={form.state_of_origin || ''}
                onChange={(e) => setForm({ ...form, state_of_origin: e.target.value })}
              />
              <label className="text-xs mb-1 block">State Code</label>
              <input
                type="text"
                placeholder="State Code (e.g., KN/90/90)"
                className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
                value={form.state_code || ''}
                onChange={(e) => setForm({ ...form, state_code: e.target.value })}
              />
              <label className="text-xs mb-1 block">Sector</label>
              <input
                type="text"
                placeholder="Sector (e.g., Agency Banking)"
                className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
                value={form.sector || ''}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              />
              <label className="text-xs mb-1 block">NIN</label>
              <input
                type="text"
                placeholder="National Identification Number"
                className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
                value={form.nin || ''}
                onChange={(e) => setForm({ ...form, nin: e.target.value })}
              />
              <label className="text-xs mb-1 block">Callup Number (Optional)</label>
              <input
                type="text"
                placeholder="Callup Number"
                className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
                value={form.callup_number || ''}
                onChange={(e) => setForm({ ...form, callup_number: e.target.value })}
              />
            </>
          )}
          <label className="text-xs mb-1 block">Password</label>
          <div className="relative mb-2">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Password"
              className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-2 text-sm"
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              className="absolute right-2 top-2"
              onClick={() => setShowPwd(!showPwd)}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
          <label className="text-xs mb-1 block">Referral Code (Optional)</label>
          <input
            type="text"
            placeholder="Referral Code"
            className="w-full p-2 outline-none border-none bg-gray-200 rounded mb-4 text-sm"
            value={form.referral || ''}
            onChange={(e) => setForm({ ...form, referral: e.target.value })}
          />
          <div className="flex items-start mb-4">
            <input
              type="checkbox"
              id="agree"
              className="h-4 w-4 text-[#68049B] outline-none border-none bg-gray-200 rounded"
              checked={form.agreed || false}
              onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
            />
            <label htmlFor="agree" className="ml-2 text-[10px]">
              By continuing you agree to Kudimata's{' '}
              <span className="text-[#68049B] cursor-pointer">Privacy Policy</span>{' '}
              and{' '}
              <span className="text-[#68049B] cursor-pointer">User Agreement</span>.
            </label>
            {errors.agreed && <span className="text-xs text-red-500">{errors.agreed}</span>}
          </div>
          <button
            onClick={handleRegister}
            className="w-full py-2 bg-[#FFD30F] cursor-pointer flex items-center justify-center rounded font-bold disabled:opacity-50"
            disabled={loading || !form.agreed}
          >
            {loading ? <div className="loader"></div> : 'Sign Up'}
          </button>
        </>
      );
    }

    return null;
  };

  return (
    <div className="flex w-full h-full overflow-y-scroll z-20 bg-white flex-col max-sm:p-5 p-20 items-center max-sm:items-start justify-center">
      <div className="w-50 max-sm:absolute max-sm:left-0 max-sm:top-0 bg-gray">
        <img src={logo} alt="logo" className="object-cover" />
      </div>
      <div className="w-[60%] max-sm:w-full max-sm:mt-17 max-sm:border-none max-sm:p-0 mt-6 rounded-4xl bg-[#FEFBFF] p-10 h-auto border border-[#68049B]">
        <div className="flex items-center max-sm:flex-col max-sm:items-start max-sm:gap-2 justify-between">
          <h1 className="text-2xl font-bold">Join Kudimata</h1>
          <div className="flex items-center gap-1">
            {isAuthenticated ? (
              <p className="text-xs font-bold">Welcome back!</p>
            ) : (
              <>
                <p className="text-xs font-bold">Already Using Kudimata?</p>
                <p
                  className="text-xs text-[#68049B] cursor-pointer font-bold"
                  onClick={() => openFlow('login')}
                >
                  Login
                </p>
              </>
            )}
          </div>
        </div>
        <div className="mt-15 max-sm:mt-5 max-sm:flex-col-reverse w-full flex items-center justify-center h-[400px] rounded-2xl bg-[#F6E8FF]">
          <div className="left h-full w-[50%] max-sm:w-full max-sm:h-[55%]">
            <img
              src={onb}
              className="w-full h-full object-cover"
              alt="Onboarding Image"
            />
          </div>
          <div className="right h-full w-[50%] max-sm:w-full max-sm:h-[45%] max-sm:p-4 gap-3 p-10 justify-center flex flex-col">
            <h1 className="font-bold text-2xl">Join The Community</h1>
            <p className="text-xs max-sm:text-sm">
              Take literacy quiz and engage in financial conversations
            </p>
            {isAuthenticated ? (
              <p className="text-sm">You are already signed up!</p>
            ) : (
              <button
                className="cursor-pointer gap-2 flex items-center justify-center w-full p-3 font-bold bg-[#ffd30f] rounded-lg"
                onClick={() => openFlow('register')}
              >
                <p>Sign Up</p>
                <ForwardArrowSVG size={13} />
              </button>
            )}
          </div>
        </div>
        <div className="w-full mt-5 max-sm:flex-col flex items-center gap-2">
          <div className="w-[50%] max-sm:w-full max-sm:h-[50%] relative px-6 overflow-hidden rounded-2xl gap-3 bg-gray-200 flex items-center">
            <img src={corp} alt="corper image" />
            <div className="flex py-4 flex-col gap-1">
              <h1 className="font-bold text-sm">Join As A Corper</h1>
              <p className="text-xs">Register With NYSC Details</p>
            </div>
            <div
              className="w-10 cursor-pointer absolute h-10 bottom-1 right-1 rounded-full bg-white flex items-center justify-center"
              onClick={() => openFlow('register', true)}
            >
              <ForwardArrowSVG size={13} />
            </div>
          </div>
          <div className="w-[50%] max-sm:w-full max-sm:h-[50%] relative px-6 overflow-hidden rounded-2xl gap-3 bg-gray-100 flex items-center">
            <img src={kids} alt="coming soon" />
            <div className="flex py-4 flex-col opacity-50 gap-1">
              <h1 className="font-bold text-sm">Kids Corner</h1>
              <p className="text-xs">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={!!flow} onClose={closeModal}>
        {renderModalContent()}
      </Modal>

      <AlertMessage open={alertOpen} onClose={() => setAlertOpen(false)} message={alertMsg} severity="purple" />
    </div>
  );
};

export default Registration;