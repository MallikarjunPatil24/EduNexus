import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import client from '../../api/client';
import { Lock, Mail, GraduationCap, User, Phone, BookOpen } from 'lucide-react';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('admin');
  const [regClassName, setRegClassName] = useState('1st Standard');
  const [regSection, setRegSection] = useState('A');
  const [regRollNum, setRegRollNum] = useState('');

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');
    try {
      const user = await login(email, password);
      navigate(`/${user.role}`);
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setMessage('');
    setSubmitting(true);
    try {
      const payload = {
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        phone: regPhone,
        rollNum: regRollNum,
        className: regClassName,
        section: regSection
      };

      const { data } = await client.post('/auth/register', payload);
      
      // Save session in auth store
      localStorage.setItem('user', JSON.stringify(data));
      useAuthStore.setState({ user: data });
      
      setMessage('Account registered successfully! Redirecting...');
      
      // Load user profile details
      await useAuthStore.getState().fetchProfile();
      
      setTimeout(() => {
        navigate(`/${data.role}`);
      }, 1500);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen text-cream flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/edunex.jpg')" }}
    >
      {/* Dark overlay to make the login card stand out and text readable */}
      <div className="absolute inset-0 bg-navy-dark/75 backdrop-blur-[3px] pointer-events-none" />

      {/* Decorative background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-navy-light/40 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-navy-dark/60 backdrop-blur-md border border-gold/15 p-8 rounded-2xl shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gold/10 rounded-full text-gold mb-3">
            <GraduationCap size={32} />
          </div>
          <h2 className="text-3xl font-bold font-serif tracking-tight text-cream">
            EduNexus
          </h2>
          <p className="text-xs text-gold/80 mt-1 uppercase tracking-widest font-semibold font-sans">
            School Management Platform
          </p>
        </div>

        {message && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg text-center font-medium">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center font-medium">
            {errorMessage}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isRegister ? (
            /* LOGIN FORM */
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleLoginSubmit}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gold/90">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gold/45">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@edunexus.edu"
                    className="w-full pl-10 pr-4 py-3 bg-navy-light/20 border border-gold/15 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold text-cream text-sm placeholder-cream/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gold/90">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gold/45">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-navy-light/20 border border-gold/15 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold text-cream text-sm placeholder-cream/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gold hover:bg-gold-dark text-navy font-bold rounded-lg transition-colors duration-200 mt-6 shadow-lg shadow-gold/10 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setErrorMessage(''); setMessage(''); }}
                  className="text-xs text-gold hover:underline font-semibold"
                >
                  Create an account (Sign Up)
                </button>
              </div>
            </motion.form>
          ) : (
            /* SIGN UP FORM */
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleRegisterSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gold/90">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gold/45">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-navy-light/20 border border-gold/15 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold text-cream text-sm placeholder-cream/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gold/90">
                    Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gold/45">
                      <Mail size={15} />
                    </span>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="mail@gmail.com"
                      className="w-full pl-9 pr-3 py-2 bg-navy-light/20 border border-gold/15 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold text-cream text-xs placeholder-cream/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gold/90">
                    Phone
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gold/45">
                      <Phone size={15} />
                    </span>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="99999999"
                      className="w-full pl-9 pr-3 py-2 bg-navy-light/20 border border-gold/15 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold text-cream text-xs placeholder-cream/30"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gold/90">
                    Portal Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2 bg-navy-light border border-gold/15 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold text-cream text-xs"
                  >
                    <option value="admin">School Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-gold/90">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gold/45">
                      <Lock size={15} />
                    </span>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-navy-light/20 border border-gold/15 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold text-cream text-xs placeholder-cream/30"
                    />
                  </div>
                </div>
              </div>

              {regRole === 'student' && (
                <div className="border-t border-gold/10 pt-3 space-y-2 mt-2">
                  <p className="text-[10px] uppercase font-bold text-gold flex items-center space-x-1">
                    <BookOpen size={12} />
                    <span>Student Profile Link Details</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider mb-0.5 text-cream/70">Roll No</label>
                      <input
                        type="text"
                        placeholder="1001"
                        value={regRollNum}
                        onChange={(e) => setRegRollNum(e.target.value)}
                        className="w-full p-1.5 bg-navy-light/25 border border-gold/15 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider mb-0.5 text-cream/70">Class</label>
                      <select
                        value={regClassName}
                        onChange={(e) => setRegClassName(e.target.value)}
                        className="w-full p-1.5 bg-navy-light border border-gold/15 rounded text-[10px]"
                      >
                        {['1st Standard', '2nd Standard', '3rd Standard', '4th Standard', '5th Standard', '6th Standard', '7th Standard', '8th Standard', '9th Standard', '10th Standard'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider mb-0.5 text-cream/70">Section</label>
                      <select
                        value={regSection}
                        onChange={(e) => setRegSection(e.target.value)}
                        className="w-full p-1.5 bg-navy-light border border-gold/15 rounded text-[10px]"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-gold hover:bg-gold-dark text-navy font-bold rounded-lg transition-colors duration-200 mt-4 shadow-lg shadow-gold/10"
              >
                {submitting ? 'Registering Account...' : 'Complete Sign Up'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setErrorMessage(''); setMessage(''); }}
                  className="text-xs text-gold hover:underline font-semibold"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-6 border-t border-gold/10 text-center">
          <p className="text-[11px] text-cream/50 uppercase tracking-widest font-semibold mb-3">
            Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-gold/80 font-mono text-left max-w-xs mx-auto">
            <div>Admin:</div>
            <div>admin@edunexus.edu</div>
            <div>Teacher:</div>
            <div>teacher1@edunexus.edu</div>
            <div>Parent:</div>
            <div>parent1@edunexus.edu</div>
            <div>Student:</div>
            <div>student1@edunexus.edu</div>
            <div className="col-span-2 text-center text-cream/40 mt-2">Password: password123</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
