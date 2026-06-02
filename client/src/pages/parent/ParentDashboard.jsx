import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import AttendanceCalendar from '../../components/ui/AttendanceCalendar';
import GradeChart from '../../components/ui/GradeChart';
import { useChatStore } from '../../store/chatStore';
import { useNotificationStore } from '../../store/notificationStore';
import { 
  CreditCard, ClipboardCheck, Award, MessageSquare, 
  User, Calendar, Download, Send, CreditCard as CardIcon
} from 'lucide-react';

const ParentDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedChildData, setSelectedChildData] = useState(null);

  // Fee payment simulator states
  const [paymentLoadingId, setPaymentLoadingId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Card');

  // Chat states
  const { contacts, messages, activeContact, fetchContacts, setActiveContact, sendMessage, receiveMessage, peerTyping } = useChatStore();
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);

  const fetchParentData = async () => {
    try {
      const res = await client.get('/parent/dashboard');
      setChildren(res.data.children || []);
      if (res.data.children?.length > 0) {
        setSelectedChildId(res.data.children[0].childUser._id);
      }
    } catch (err) {
      console.error('Error fetching parent details:', err);
    }
  };

  const fetchChildAcademicReport = async () => {
    if (!selectedChildId) return;
    try {
      const res = await client.get(`/parent/child-report/${selectedChildId}`);
      setSelectedChildData(res.data);
    } catch (err) {
      console.error('Error fetching child progress details:', err);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, []);

  useEffect(() => {
    fetchChildAcademicReport();
  }, [selectedChildId]);

  // Socket listeners for messaging
  useEffect(() => {
    const socket = useNotificationStore.getState().socket;
    if (socket) {
      socket.on('receive_message', (msg) => {
        receiveMessage(msg);
      });
    }
  }, [receiveMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handlePayFee = async (billId) => {
    setPaymentLoadingId(billId);
    try {
      const res = await client.post(`/parent/pay-fee/${billId}`, { paymentMethod });
      alert('Payment processed successfully! Simulated invoice receipt has been compiled.');
      if (res.data.receiptUrl) {
        window.open(`http://localhost:5000${res.data.receiptUrl}`);
      }
      await fetchChildAcademicReport();
      await fetchParentData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error executing simulator payment');
    } finally {
      setPaymentLoadingId(null);
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleChatTabOpen = () => {
    setActiveTab('chat');
    fetchContacts();
  };

  // Get active child metadata
  const activeChildMeta = children.find(c => c.childUser._id === selectedChildId);

  return (
    <DashboardLayout>
      {/* Child selector header (only visible if tab is academic details/calendar) */}
      {activeTab !== 'chat' && children.length > 0 && (
        <div className="bg-white border border-gold/15 p-4 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gold/10 text-gold rounded-full">
              <User size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-navy">Linked Student Profile</h4>
              <p className="text-xs text-navy/55">Select which child to view reports for</p>
            </div>
          </div>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="p-2 border rounded-lg text-sm bg-cream/15 text-navy font-bold w-full sm:w-64 focus:ring-1 focus:ring-gold focus:outline-none"
          >
            {children.map(c => (
              <option key={c.childUser._id} value={c.childUser._id}>
                {c.childUser.name} ({c.studentInfo?.class?.sclassName || 'No Class'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tab Select Header */}
      <div className="flex border-b border-gold/15 mb-6 overflow-x-auto">
        {['dashboard', 'attendance', 'academic progress', 'billing & fees', 'teacher chat'].map((tab) => (
          <button
            key={tab}
            onClick={tab === 'teacher chat' ? handleChatTabOpen : () => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-gold text-navy font-bold' 
                : 'border-transparent text-navy/55 hover:text-navy/90'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Quick Stats overview of the selected child */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Child Attendance Rate" value={`${activeChildMeta?.attendanceRate?.toFixed(1) || 100}%`} icon={ClipboardCheck} color="navy" />
            <StatCard title="Term Grades Calculated" value={selectedChildData?.results?.length || 0} icon={Award} color="gold" />
            <StatCard title="Pending Invoices" value={activeChildMeta?.pendingFeesCount || 0} icon={CreditCard} color="navy" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Child Profile summary */}
            <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm">
              <h4 className="font-bold font-serif text-navy text-lg mb-4">Child Student Profile</h4>
              <div className="space-y-4 text-xs font-semibold text-navy/70">
                <div className="flex justify-between py-2 border-b border-gold/5">
                  <span>Name:</span>
                  <span className="font-bold text-navy">{activeChildMeta?.childUser.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gold/5">
                  <span>Roll Number:</span>
                  <span className="font-bold text-navy">{activeChildMeta?.studentInfo?.rollNum}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gold/5">
                  <span>Class level:</span>
                  <span className="font-bold text-navy">{activeChildMeta?.studentInfo?.class?.sclassName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gold/5">
                  <span>Email ID:</span>
                  <span className="font-bold text-navy">{activeChildMeta?.childUser.email}</span>
                </div>
              </div>
            </div>

            {/* Timetable view wrapper for child */}
            <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold font-serif text-navy text-lg mb-2">Academic Timetable</h4>
                <p className="text-xs text-navy/55 mb-4">Review daily subjects scheduling</p>
              </div>
              <button
                onClick={() => setActiveTab('attendance')}
                className="w-full text-center py-2.5 bg-navy hover:bg-navy-light text-cream font-bold rounded-lg text-xs transition"
              >
                Inspect Calendar Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE SECTION */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AttendanceCalendar records={selectedChildData?.attendance} />
          </div>
          <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm h-fit space-y-4">
            <h4 className="font-bold font-serif text-navy text-lg border-b border-gold/10 pb-3">Monthly Analytics</h4>
            <div className="text-xs font-semibold space-y-3">
              <p className="flex justify-between">
                <span>Overall Attendance rate:</span>
                <span className="font-bold text-navy">{activeChildMeta?.attendanceRate?.toFixed(1)}%</span>
              </p>
              <p className="flex justify-between">
                <span>Total evaluated days:</span>
                <span className="font-bold text-navy">{selectedChildData?.attendance?.length || 0} Days</span>
              </p>
              <p className="flex justify-between">
                <span>Total present sessions:</span>
                <span className="font-bold text-emerald-600">
                  {selectedChildData?.attendance?.filter(a => a.status === 'Present').length || 0}
                </span>
              </p>
              <p className="flex justify-between">
                <span>Total absent sessions:</span>
                <span className="font-bold text-red-600">
                  {selectedChildData?.attendance?.filter(a => a.status === 'Absent').length || 0}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ACADEMIC PROGRESS */}
      {activeTab === 'academic progress' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Visual chart */}
            <div className="lg:col-span-2">
              <h4 className="font-bold font-serif text-navy text-lg mb-4">Subject-wise Evaluation Scores</h4>
              <GradeChart data={selectedChildData?.results} type="bar" />
            </div>
            
            {/* Grades grid */}
            <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm">
              <h4 className="font-bold font-serif text-navy text-lg mb-4">Exam Grade Sheet</h4>
              <div className="divide-y divide-gold/10 max-h-60 overflow-y-auto pr-1">
                {selectedChildData?.results && selectedChildData.results.length > 0 ? (
                  selectedChildData.results.map((res) => (
                    <div key={res._id} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-navy">{res.exam?.subject?.subName}</p>
                        <p className="text-navy/55 mt-0.5">{res.exam?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gold text-sm block">{res.grade}</span>
                        <span className="text-[10px] text-navy/40">{res.marksObtained}/100</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-navy/40 text-center py-6">No evaluation reports generated.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BILLING & FEES SECTION */}
      {activeTab === 'billing & fees' && (
        <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gold/10 pb-4">
            <div>
              <h4 className="font-bold font-serif text-navy text-lg">Billing & School Invoices</h4>
              <p className="text-xs text-navy/55 mt-0.5">Pay term fee bills via the simulator</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-navy/60">Simulate Method:</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="p-1 border border-gold/20 rounded text-xs"
              >
                <option value="Card">Visa / MasterCard</option>
                <option value="Simulator">Bank Transfer (Simulator)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {selectedChildData?.feeRecords && selectedChildData.feeRecords.length > 0 ? (
              selectedChildData.feeRecords.map((fee) => (
                <div key={fee._id} className="p-5 bg-cream/35 border border-gold/15 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h5 className="font-bold text-sm text-navy">Term Fees Invoice</h5>
                    <p className="text-xs text-navy/65 mt-0.5">Class level: {fee.class?.sclassName}</p>
                    {fee.paymentDate && (
                      <p className="text-[10px] text-navy/40 mt-1">Paid on {new Date(fee.paymentDate).toLocaleDateString()}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-8">
                    <div className="text-right">
                      <p className="text-xs text-navy/55">Amount due</p>
                      <p className="text-lg font-bold text-navy">${fee.status === 'Paid' ? 0 : fee.amountDue}</p>
                    </div>

                    <div>
                      {fee.status === 'Paid' ? (
                        <a
                          href={`http://localhost:5000${fee.receiptUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-navy hover:bg-navy-light text-cream font-bold rounded-lg text-xs transition shadow-sm"
                        >
                          <Download size={14} />
                          <span>View Receipt</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => handlePayFee(fee._id)}
                          disabled={paymentLoadingId === fee._id}
                          className="px-5 py-2 bg-gold hover:bg-gold-dark text-navy font-bold rounded-lg text-xs transition shadow-sm flex items-center space-x-2"
                        >
                          <CardIcon size={14} />
                          <span>{paymentLoadingId === fee._id ? 'Processing...' : 'Pay Bill'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-navy/40 text-center py-8">No fee bills issued.</p>
            )}
          </div>
        </div>
      )}

      {/* TEACHER CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-xl border border-gold/20 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[75vh]">
          {/* Contacts Sidebar */}
          <div className="border-r border-gold/15 bg-cream/10 flex flex-col">
            <div className="p-4 bg-navy text-cream font-bold font-serif border-b border-gold/15">
              Class Teachers Directory
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gold/5">
              {contacts.map((contact) => (
                <button
                  key={contact._id}
                  onClick={() => setActiveContact(contact)}
                  className={`w-full text-left p-4 flex items-center space-x-3 transition-colors ${
                    activeContact?._id === contact._id ? 'bg-gold/15' : 'hover:bg-cream/45'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-navy/15 flex items-center justify-center font-bold text-navy text-sm">
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy">{contact.name}</p>
                    <p className="text-[10px] text-navy/55 capitalize">{contact.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="col-span-2 flex flex-col h-full bg-cream/5">
            {activeContact ? (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gold/15 bg-white flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-navy">{activeContact.name}</h5>
                    <p className="text-[10px] text-navy/50 uppercase tracking-widest font-semibold mt-0.5">
                      Teacher Contact
                    </p>
                  </div>
                  {peerTyping && <span className="text-[10px] text-gold font-semibold italic animate-pulse">Typing...</span>}
                </div>

                {/* Messages Roster */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {messages.map((msg, index) => {
                    const isMe = msg.sender === activeChildMeta?.studentInfo?.parent;
                    return (
                      <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[70%] p-3.5 rounded-2xl shadow-sm text-xs ${
                            isMe 
                              ? 'bg-navy text-cream rounded-tr-none' 
                              : 'bg-white border border-gold/15 text-navy rounded-tl-none'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <span className="text-[8px] opacity-60 mt-1.5 block text-right">
                            {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Send Bar */}
                <form onSubmit={handleSendChat} className="p-4 bg-white border-t border-gold/15 flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Type message details here..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 p-2.5 border border-gold/20 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-navy hover:bg-navy-light text-cream rounded-lg shadow transition"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-navy/40">
                <MessageSquare size={48} className="stroke-1 mb-2" />
                <p className="text-sm">Select the Class Teacher to start messaging.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ParentDashboard;
