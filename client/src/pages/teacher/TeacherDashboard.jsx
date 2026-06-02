import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { useChatStore } from '../../store/chatStore';
import { useNotificationStore } from '../../store/notificationStore';
import { 
  ClipboardCheck, FileSpreadsheet, FileText, BookMarked, MessageSquare, 
  Plus, Upload, Send, CheckCircle2, AlertCircle
} from 'lucide-react';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [roster, setRoster] = useState([]);
  
  // Tab control helpers
  const [selectedClassId, setSelectedClassId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceChecklist, setAttendanceChecklist] = useState({}); // studentId -> status ('Present'|'Absent'|'Late')

  // Grading states
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [gradingScores, setGradingScores] = useState({}); // studentId -> marksObtained
  const [remarks, setRemarks] = useState({}); // studentId -> remarksText
  
  // Assignment & Library upload states
  const [file, setFile] = useState(null);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', classId: '', subjectId: '', deadline: '' });
  const [newLibrary, setNewLibrary] = useState({ title: '', description: '', classId: '', subjectId: '' });

  // Chat states
  const { contacts, messages, activeContact, fetchContacts, setActiveContact, sendMessage, receiveMessage, peerTyping } = useChatStore();
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await client.get('/teacher/profile');
      setTeacherProfile(res.data);
      if (res.data.classes?.length > 0) {
        setSelectedClassId(res.data.classes[0]._id);
        setNewAssignment(prev => ({ ...prev, classId: res.data.classes[0]._id }));
        setNewLibrary(prev => ({ ...prev, classId: res.data.classes[0]._id }));
      }
      if (res.data.subjects?.length > 0) {
        setNewAssignment(prev => ({ ...prev, subjectId: res.data.subjects[0]._id }));
        setNewLibrary(prev => ({ ...prev, subjectId: res.data.subjects[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoster = async () => {
    if (!selectedClassId) return;
    try {
      const res = await client.get(`/teacher/class-students/${selectedClassId}`);
      setRoster(res.data);
      // Initialize attendance checklist with 'Present'
      const initCheck = {};
      const initScores = {};
      const initRemarks = {};
      res.data.forEach((s) => {
        initCheck[s.user._id] = 'Present';
        initScores[s.user._id] = '';
        initRemarks[s.user._id] = '';
      });
      setAttendanceChecklist(initCheck);
      setGradingScores(initScores);
      setRemarks(initRemarks);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await client.get('/teacher/exams');
      setExams(res.data);
      if (res.data.length > 0) {
        setSelectedExamId(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchExams();
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [selectedClassId]);

  // Handle socket messaging listeners
  useEffect(() => {
    const socket = useNotificationStore.getState().socket;
    if (socket) {
      socket.on('receive_message', (msg) => {
        receiveMessage(msg);
      });
    }
  }, [receiveMessage]);

  // Auto-scroll chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceChecklist({ ...attendanceChecklist, [studentId]: status });
  };

  const handleScoreChange = (studentId, value) => {
    setGradingScores({ ...gradingScores, [studentId]: value });
  };

  const handleRemarkChange = (studentId, value) => {
    setRemarks({ ...remarks, [studentId]: value });
  };

  const submitAttendance = async () => {
    setLoading(true);
    setMessage('');
    try {
      const records = Object.keys(attendanceChecklist).map((studentId) => ({
        studentId,
        status: attendanceChecklist[studentId]
      }));
      await client.post('/teacher/attendance', {
        classId: selectedClassId,
        date: attendanceDate,
        attendanceRecords: records
      });
      setMessage('Attendance updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating attendance');
    } finally {
      setLoading(false);
    }
  };

  const submitGrading = async () => {
    setLoading(true);
    setMessage('');
    try {
      const examObj = exams.find(e => e._id === selectedExamId);
      const results = Object.keys(gradingScores)
        .filter(studentId => gradingScores[studentId] !== '')
        .map((studentId) => ({
          studentId,
          marksObtained: Number(gradingScores[studentId]),
          remarks: remarks[studentId]
        }));

      if (results.length === 0) {
        alert('Please enter scores for at least one student!');
        setLoading(false);
        return;
      }

      await client.post('/teacher/results', {
        examId: selectedExamId,
        results
      });
      setMessage('Grades published successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error publishing grades');
    } finally {
      setLoading(false);
    }
  };

  const createNewAssignment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formPayload = new FormData();
      formPayload.append('title', newAssignment.title);
      formPayload.append('description', newAssignment.description);
      formPayload.append('classId', newAssignment.classId);
      formPayload.append('subjectId', newAssignment.subjectId);
      formPayload.append('deadline', newAssignment.deadline);
      if (file) {
        formPayload.append('file', file);
      }

      await client.post('/teacher/assignments', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Assignment uploaded successfully!');
      setNewAssignment({ ...newAssignment, title: '', description: '', deadline: '' });
      setFile(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error uploading homework');
    } finally {
      setLoading(false);
    }
  };

  const uploadLibraryItem = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload!');
      return;
    }
    setLoading(true);
    try {
      const formPayload = new FormData();
      formPayload.append('title', newLibrary.title);
      formPayload.append('description', newLibrary.description);
      formPayload.append('classId', newLibrary.classId);
      formPayload.append('subjectId', newLibrary.subjectId);
      formPayload.append('file', file);

      await client.post('/library/upload', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Digital material saved to library!');
      setNewLibrary({ ...newLibrary, title: '', description: '' });
      setFile(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error uploading material');
    } finally {
      setLoading(false);
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

  return (
    <DashboardLayout>
      {/* Tab Select Header */}
      <div className="flex border-b border-gold/15 mb-6 overflow-x-auto">
        {['dashboard', 'attendance', 'grading', 'assignments', 'library', 'chat'].map((tab) => (
          <button
            key={tab}
            onClick={tab === 'chat' ? handleChatTabOpen : () => setActiveTab(tab)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Assigned Classes" value={teacherProfile?.classes?.length || 0} icon={ClipboardCheck} color="navy" />
            <StatCard title="Assigned Course Subjects" value={teacherProfile?.subjects?.length || 0} icon={FileSpreadsheet} color="gold" />
            <StatCard title="Active Exams Configured" value={exams.length} icon={FileText} color="navy" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm">
              <h4 className="font-bold font-serif text-navy text-lg mb-4">My Schedule Class Standards</h4>
              <div className="divide-y divide-gold/10">
                {teacherProfile?.classes?.map((c) => (
                  <div key={c._id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-navy">{c.sclassName}</p>
                      <p className="text-xs text-navy/55">Student Limit: {c.maxStudents}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedClassId(c._id); setActiveTab('attendance'); }}
                      className="px-3 py-1 bg-gold text-navy font-bold rounded text-xs hover:bg-gold-dark transition"
                    >
                      Verify Attendance
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm">
              <h4 className="font-bold font-serif text-navy text-lg mb-4">My Active Subjects</h4>
              <div className="divide-y divide-gold/10">
                {teacherProfile?.subjects?.map((s) => (
                  <div key={s._id} className="py-3">
                    <p className="font-bold text-sm text-navy">{s.subName}</p>
                    <p className="text-xs text-gold font-mono">{s.subCode}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE SECTION */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/10 pb-4">
            <h4 className="font-bold font-serif text-navy text-lg">Mark Class Attendance</h4>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="p-2 border rounded-lg text-sm bg-cream/15"
              >
                {teacherProfile?.classes?.map(c => <option key={c._id} value={c._id}>{c.sclassName}</option>)}
              </select>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="p-2 border rounded-lg text-sm bg-cream/15"
              />
            </div>
          </div>

          {message && <div className="p-3 bg-emerald-500/10 text-emerald-700 rounded-lg text-xs font-semibold text-center">{message}</div>}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy text-cream uppercase text-xs">
                  <th className="px-6 py-3.5">Roll No</th>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5 text-center">Status Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {roster.map((student) => (
                  <tr key={student._id} className="hover:bg-cream/20">
                    <td className="px-6 py-4 text-sm font-bold">{student.rollNum}</td>
                    <td className="px-6 py-4 text-sm font-medium">{student.user?.name}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex rounded-lg overflow-hidden border border-gold/25 text-xs">
                        {['Present', 'Late', 'Absent'].map((st) => {
                          const active = attendanceChecklist[student.user._id] === st;
                          const activeColor = st === 'Present' ? 'bg-emerald-500 text-white' : st === 'Late' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white';
                          return (
                            <button
                              key={st}
                              onClick={() => handleAttendanceChange(student.user._id, st)}
                              className={`px-4 py-1.5 font-bold transition-all ${
                                active ? activeColor : 'bg-cream hover:bg-gold/10 text-navy'
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={submitAttendance}
            disabled={loading || roster.length === 0}
            className="px-6 py-2.5 bg-navy hover:bg-navy-light text-cream font-bold rounded-lg transition disabled:opacity-40"
          >
            {loading ? 'Saving Checklist...' : 'Commit Daily Attendance'}
          </button>
        </div>
      )}

      {/* GRADING TAB */}
      {activeTab === 'grading' && (
        <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/10 pb-4">
            <h4 className="font-bold font-serif text-navy text-lg">Input Exam Grading Results</h4>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="p-2 border rounded-lg text-sm bg-cream/15 w-48"
              >
                <option value="">Choose evaluation exam...</option>
                {exams.map(e => <option key={e._id} value={e._id}>{e.name} - {e.class?.sclassName}</option>)}
              </select>
            </div>
          </div>

          {message && <div className="p-3 bg-emerald-500/10 text-emerald-700 rounded-lg text-xs font-semibold text-center">{message}</div>}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy text-cream uppercase text-xs">
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Score (Out of 100)</th>
                  <th className="px-6 py-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {roster.map((student) => (
                  <tr key={student._id}>
                    <td className="px-6 py-4 text-sm font-bold">{student.user?.name}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        max="100"
                        min="0"
                        placeholder="e.g. 85"
                        value={gradingScores[student.user._id] || ''}
                        onChange={(e) => handleScoreChange(student.user._id, e.target.value)}
                        className="p-1.5 border border-gold/20 rounded-lg text-sm w-24 focus:outline-none focus:ring-1 focus:ring-gold"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="Good progress..."
                        value={remarks[student.user._id] || ''}
                        onChange={(e) => handleRemarkChange(student.user._id, e.target.value)}
                        className="p-1.5 border border-gold/20 rounded-lg text-sm w-full focus:outline-none focus:ring-1 focus:ring-gold"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={submitGrading}
            disabled={loading || roster.length === 0}
            className="px-6 py-2.5 bg-navy hover:bg-navy-light text-cream font-bold rounded-lg transition disabled:opacity-40"
          >
            {loading ? 'Uploading Scores...' : 'Publish Term Marks'}
          </button>
        </div>
      )}

      {/* ASSIGNMENTS MANAGEMENT */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={createNewAssignment} className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm space-y-4 h-fit">
            <h4 className="font-bold font-serif text-navy text-lg border-b border-gold/10 pb-3">New Homework Assignment</h4>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Homework Title</label>
              <input type="text" required value={newAssignment.title} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm border-gold/20" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Class</label>
              <select value={newAssignment.classId} onChange={(e) => setNewAssignment({ ...newAssignment, classId: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm">
                {teacherProfile?.classes?.map(c => <option key={c._id} value={c._id}>{c.sclassName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Subject</label>
              <select value={newAssignment.subjectId} onChange={(e) => setNewAssignment({ ...newAssignment, subjectId: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm">
                {teacherProfile?.subjects?.map(s => <option key={s._id} value={s._id}>{s.subName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Deadline Date</label>
              <input type="date" required value={newAssignment.deadline} onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm border-gold/20" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Upload Instruction Document</label>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full text-xs text-navy/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gold/15 file:text-navy hover:file:bg-gold/20" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Homework Details</label>
              <textarea rows="3" required value={newAssignment.description} onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm border-gold/20"></textarea>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-navy hover:bg-navy-light text-cream font-bold rounded-lg transition">
              {loading ? 'Uploading...' : 'Publish Assignment'}
            </button>
          </form>
        </div>
      )}

      {/* DIGITAL LIBRARY MATERIAL */}
      {activeTab === 'library' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={uploadLibraryItem} className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm space-y-4 h-fit">
            <h4 className="font-bold font-serif text-navy text-lg border-b border-gold/10 pb-3">Upload Study Materials</h4>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Material Name</label>
              <input type="text" required value={newLibrary.title} onChange={(e) => setNewLibrary({ ...newLibrary, title: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm border-gold/20" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Target Class</label>
              <select value={newLibrary.classId} onChange={(e) => setNewLibrary({ ...newLibrary, classId: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm">
                {teacherProfile?.classes?.map(c => <option key={c._id} value={c._id}>{c.sclassName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Subject Area</label>
              <select value={newLibrary.subjectId} onChange={(e) => setNewLibrary({ ...newLibrary, subjectId: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm">
                {teacherProfile?.subjects?.map(s => <option key={s._id} value={s._id}>{s.subName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Upload File (PDF/Image)</label>
              <input type="file" required onChange={(e) => setFile(e.target.files[0])} className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gold/15 file:text-navy hover:file:bg-gold/20" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Summary Description</label>
              <textarea rows="3" value={newLibrary.description} onChange={(e) => setNewLibrary({ ...newLibrary, description: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm border-gold/20"></textarea>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-navy hover:bg-navy-light text-cream font-bold rounded-lg transition">
              {loading ? 'Uploading...' : 'Save study material'}
            </button>
          </form>
        </div>
      )}

      {/* CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-xl border border-gold/20 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[75vh]">
          {/* Contacts Sidebar */}
          <div className="border-r border-gold/15 bg-cream/10 flex flex-col">
            <div className="p-4 bg-navy text-cream font-bold font-serif border-b border-gold/15">
              Parent Messaging Threads
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
                      {activeContact.role} Contact
                    </p>
                  </div>
                  {peerTyping && <span className="text-[10px] text-gold font-semibold italic animate-pulse">Typing...</span>}
                </div>

                {/* Messages Roster */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {messages.map((msg, index) => {
                    const isMe = msg.sender === teacherProfile?.user;
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
                <p className="text-sm">Select a contact parent thread to start messaging.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherDashboard;
