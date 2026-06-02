import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, FileText, BookMarked, Brain, Award, 
  Flame, CheckCircle, Upload, Eye, EyeOff, MessageSquare
} from 'lucide-react';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  
  // Grade reveals state
  const [revealedGrades, setRevealedGrades] = useState({}); // resultId -> boolean

  // Homework & Assignments
  const [assignments, setAssignments] = useState([]);
  const [fileToSubmit, setFileToSubmit] = useState(null);
  const [submitLoadingId, setSubmitLoadingId] = useState(null);

  // E-Library materials
  const [libraryMaterials, setLibraryMaterials] = useState([]);

  // AI Doubt Solver
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiSubject, setAiSubject] = useState('Mathematics');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConversation, setAiConversation] = useState([
    { role: 'ai', content: 'Hello! I am your AI Doubt Solver. Ask me any question about your curriculum!' }
  ]);

  // Timetable
  const [timetable, setTimetable] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const res = await client.get('/student/dashboard');
      setDashboardData(res.data);
      
      const timetableRes = await client.get(`/admin/timetable/${res.data.studentInfo.class._id}`);
      setTimetable(timetableRes.data);

      const assRes = await client.get('/student/assignments');
      setAssignments(assRes.data);

      const libRes = await client.get('/student/library');
      setLibraryMaterials(libRes.data);
    } catch (err) {
      console.error('Error fetching student dashboard:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const toggleGradeReveal = (id) => {
    setRevealedGrades({ ...revealedGrades, [id]: !revealedGrades[id] });
  };

  const handleAssignmentSubmit = async (assignmentId) => {
    if (!fileToSubmit) {
      alert('Please select a file to submit!');
      return;
    }
    setSubmitLoadingId(assignmentId);
    try {
      const formPayload = new FormData();
      formPayload.append('file', fileToSubmit);
      
      await client.post(`/student/submit-assignment/${assignmentId}`, formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Assignment submitted successfully!');
      setFileToSubmit(null);
      await fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting homework');
    } finally {
      setSubmitLoadingId(null);
    }
  };

  const handleAskAI = async (e) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    const userMsg = { role: 'user', content: aiQuestion };
    setAiConversation(prev => [...prev, userMsg]);
    setAiLoading(true);
    const questionText = aiQuestion;
    setAiQuestion('');

    try {
      const res = await client.post('/student/ask-ai', {
        question: questionText,
        subject: aiSubject
      });
      setAiConversation(prev => [...prev, { role: 'ai', content: res.data.answer }]);
    } catch (err) {
      setAiConversation(prev => [...prev, { role: 'ai', content: 'Sorry, I am facing connectivity issues resolving this doubt.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Setup timetable calendar slots
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4];

  // Organize slots
  const timetableGrid = {};
  daysOfWeek.forEach(d => {
    timetableGrid[d] = {};
    periods.forEach(p => {
      timetableGrid[d][p] = null;
    });
  });

  if (timetable && timetable.slots) {
    timetable.slots.forEach(slot => {
      if (timetableGrid[slot.day] && timetableGrid[slot.day][slot.period] !== undefined) {
        timetableGrid[slot.day][slot.period] = slot;
      }
    });
  }

  return (
    <DashboardLayout>
      {/* Tab Select Header */}
      <div className="flex border-b border-gold/15 mb-6 overflow-x-auto">
        {['dashboard', 'timetable', 'assignments', 'e-library', 'ai doubt solver'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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
          {/* Dashboard stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Attendance Rate" value={`${dashboardData?.attendanceRate?.toFixed(1) || 100}%`} icon={CheckCircle} color="navy" />
            <StatCard title="Homework Pending" value={dashboardData?.assignmentsDueCount || 0} icon={FileText} color="gold" />
            <StatCard title="Study Badges Unlocked" value={dashboardData?.badges?.length || 0} icon={Award} color="navy" />
            
            {/* Gamified Streak Card */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-gradient-to-br from-gold/10 to-amber-500/10 border border-gold/25 p-6 rounded-xl flex items-center justify-between shadow-sm"
            >
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-navy/60">Study Streak</p>
                <h3 className="text-3xl font-bold font-serif text-navy mt-1 flex items-center">
                  {dashboardData?.attendanceStreak || 0} Days
                  <Flame className="text-orange-500 ml-2 animate-pulse fill-orange-500" size={24} />
                </h3>
                <p className="text-[10px] text-navy/50 mt-1">Keep checking in to grow your streak!</p>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Badges showcase panel */}
            <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm">
              <h4 className="font-bold font-serif text-navy text-lg mb-4">My Badges & Rewards</h4>
              <div className="grid grid-cols-2 gap-4">
                {dashboardData?.badges && dashboardData.badges.length > 0 ? (
                  dashboardData.badges.map((badge, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ rotate: [0, -5, 5, 0] }}
                      className="p-3 bg-cream/40 rounded-xl border border-gold/15 flex flex-col items-center text-center justify-center space-y-2"
                    >
                      <div className="p-2.5 bg-gold/15 text-gold rounded-full">
                        <Award size={22} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-navy truncate max-w-[110px]">{badge.title}</p>
                        <p className="text-[9px] text-navy/60 leading-tight mt-0.5">{badge.description}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-xs text-navy/40 text-center col-span-2 py-8">Earn badges by completing tasks!</p>
                )}
              </div>
            </div>

            {/* Premium Animated Grade Reveal panel */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gold/20 shadow-sm">
              <h4 className="font-bold font-serif text-navy text-lg mb-4">Exam Evaluation Grades (Click to Reveal)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dashboardData?.recentResults && dashboardData.recentResults.length > 0 ? (
                  dashboardData.recentResults.map((res) => {
                    const revealed = revealedGrades[res._id];
                    return (
                      <div
                        key={res._id}
                        onClick={() => toggleGradeReveal(res._id)}
                        className="cursor-pointer relative h-24 rounded-xl border border-gold/20 shadow-sm overflow-hidden flex items-center justify-between p-4 bg-cream/35 hover:bg-gold/5 transition-all"
                      >
                        <div>
                          <p className="text-xs font-bold text-navy">{res.exam?.subject?.subName}</p>
                          <p className="text-[10px] text-navy/55 mt-0.5">{res.exam?.name}</p>
                        </div>
                        
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <AnimatePresence mode="wait">
                            {revealed ? (
                              <motion.div
                                key="revealed"
                                initial={{ rotateY: 90, opacity: 0 }}
                                animate={{ rotateY: 0, opacity: 1 }}
                                exit={{ rotateY: -90, opacity: 0 }}
                                className="absolute w-full h-full bg-navy text-gold font-bold text-2xl font-serif rounded-full flex items-center justify-center shadow shadow-gold/25"
                              >
                                {res.grade}
                              </motion.div>
                            ) : (
                              <motion.div
                                key="hidden"
                                initial={{ rotateY: -90, opacity: 0 }}
                                animate={{ rotateY: 0, opacity: 1 }}
                                exit={{ rotateY: 90, opacity: 0 }}
                                className="absolute w-full h-full bg-gold text-navy font-bold text-xs rounded-full flex flex-col items-center justify-center border border-navy/20"
                              >
                                <Eye size={18} />
                                <span className="text-[8px] uppercase tracking-wider font-bold mt-1">Reveal</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-navy/40 text-center col-span-2 py-8">No exam results released.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TIMETABLE VIEW */}
      {activeTab === 'timetable' && (
        <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm space-y-6">
          <h4 className="font-bold font-serif text-navy text-lg border-b border-gold/10 pb-3">My Class Weekly Timetable</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-navy text-cream uppercase text-xs">
                  <th className="px-4 py-3">Day / Period</th>
                  <th className="px-4 py-3">Period 1</th>
                  <th className="px-4 py-3">Period 2</th>
                  <th className="px-4 py-3">Period 3</th>
                  <th className="px-4 py-3">Period 4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {daysOfWeek.map((day) => (
                  <tr key={day} className="hover:bg-cream/15">
                    <td className="px-4 py-4 text-sm font-bold bg-cream/10 border-r border-gold/10 text-navy">{day}</td>
                    {periods.map((p) => {
                      const slot = timetableGrid[day][p];
                      return (
                        <td key={p} className="px-4 py-4 border-r border-gold/10 last:border-0">
                          {slot ? (
                            <div>
                              <p className="text-sm font-bold text-navy">{slot.subject?.subName}</p>
                              <p className="text-[10px] text-navy/50">{slot.teacher?.name}</p>
                              <span className="text-[9px] bg-gold/10 text-gold-dark px-1.5 py-0.5 rounded mt-1 inline-block font-mono">
                                {slot.timeSlot}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-navy/30 italic">No slot configured</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASSIGNMENTS VIEW */}
      {activeTab === 'assignments' && (
        <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm space-y-6">
          <h4 className="font-bold font-serif text-navy text-lg border-b border-gold/10 pb-3">Active Assignments & Submission Panel</h4>
          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map((ass) => {
                const mySubmission = ass.submissions?.find(s => s.student === dashboardData?.studentInfo?.user);
                return (
                  <div key={ass._id} className="p-5 bg-cream/35 border border-gold/15 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div>
                      <h5 className="font-bold text-sm text-navy">{ass.title}</h5>
                      <p className="text-xs text-navy/70 mt-1">{ass.description}</p>
                      <p className="text-[10px] text-navy/40 mt-2 font-semibold">
                        Deadline: {new Date(ass.deadline).toLocaleDateString()} | Class Subject: {ass.subject?.subName}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold mb-1 uppercase text-navy/60">Instructions doc</p>
                      {ass.fileUrl ? (
                        <a
                          href={ass.fileUrl}
                          download
                          className="inline-flex items-center space-x-2 text-xs font-bold text-gold hover:text-gold-dark transition"
                        >
                          <BookMarked size={14} />
                          <span>Download Attachment</span>
                        </a>
                      ) : (
                        <span className="text-xs text-navy/40 italic">No document attached</span>
                      )}
                    </div>

                    <div className="bg-white p-4 border border-gold/10 rounded-xl flex flex-col space-y-2">
                      <p className="text-xs font-bold text-navy flex items-center justify-between">
                        <span>Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          mySubmission 
                            ? 'bg-emerald-500/10 text-emerald-700 font-bold' 
                            : 'bg-amber-500/10 text-amber-700 font-bold'
                        }`}>
                          {mySubmission ? mySubmission.status : 'Pending'}
                        </span>
                      </p>

                      {!mySubmission ? (
                        <div className="space-y-2 pt-2 border-t border-gold/5">
                          <input
                            type="file"
                            onChange={(e) => setFileToSubmit(e.target.files[0])}
                            className="w-full text-[10px]"
                          />
                          <button
                            onClick={() => handleAssignmentSubmit(ass._id)}
                            disabled={submitLoadingId === ass._id}
                            className="w-full py-1.5 bg-gold hover:bg-gold-dark text-navy font-bold rounded text-xs transition flex items-center justify-center space-x-2"
                          >
                            <Upload size={12} />
                            <span>{submitLoadingId === ass._id ? 'Submitting...' : 'Upload Submission'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-navy/55 pt-2 border-t border-gold/5">
                          Submitted on {new Date(mySubmission.submittedAt).toLocaleDateString()}
                          {mySubmission.grade && (
                            <p className="font-bold text-gold mt-1">Grade Earned: {mySubmission.grade}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-navy/40 text-center py-8">No homework assigned yet.</p>
            )}
          </div>
        </div>
      )}

      {/* DIGITAL LIBRARY */}
      {activeTab === 'e-library' && (
        <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm space-y-6">
          <h4 className="font-bold font-serif text-navy text-lg border-b border-gold/10 pb-3">Digital Reference Library</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {libraryMaterials.length > 0 ? (
              libraryMaterials.map((mat) => (
                <div key={mat._id} className="p-4 bg-cream/35 border border-gold/15 rounded-xl flex flex-col justify-between h-40">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gold-dark bg-gold/15 px-2 py-0.5 rounded">
                      {mat.subject?.subName}
                    </span>
                    <h5 className="font-bold text-sm text-navy mt-2.5 truncate">{mat.title}</h5>
                    <p className="text-xs text-navy/65 mt-1 leading-normal line-clamp-2">{mat.description}</p>
                  </div>
                  <a
                    href={mat.fileUrl}
                    download
                    className="w-full text-center py-2 bg-navy hover:bg-navy-light text-cream font-bold rounded-lg text-xs mt-3 block transition shadow-sm"
                  >
                    Download Resource ({mat.fileType.toUpperCase()})
                  </a>
                </div>
              ))
            ) : (
              <p className="text-xs text-navy/40 text-center col-span-3 py-8">No reference materials available.</p>
            )}
          </div>
        </div>
      )}

      {/* AI DOUBT SOLVER */}
      {activeTab === 'ai doubt solver' && (
        <div className="bg-white rounded-xl border border-gold/20 shadow-sm overflow-hidden flex flex-col h-[75vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-navy text-cream flex items-center justify-between border-b border-gold/15">
            <div>
              <h4 className="font-bold font-serif text-base text-gold">EduNexus AI Doubt Solver</h4>
              <p className="text-[10px] text-cream/60">Immediate conceptual answers powered by AI</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cream/70">Subject:</span>
              <select
                value={aiSubject}
                onChange={(e) => setAiSubject(e.target.value)}
                className="p-1 border border-gold/25 rounded text-xs bg-navy text-cream focus:outline-none"
              >
                {['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-cream/5 text-navy">
            {aiConversation.map((msg, index) => {
              const isAi = msg.role === 'ai';
              return (
                <div key={index} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-xs leading-relaxed whitespace-pre-line ${
                      isAi 
                        ? 'bg-white border border-gold/15 text-navy rounded-tl-none font-sans' 
                        : 'bg-navy text-cream rounded-tr-none font-medium'
                    }`}
                  >
                    <p>{msg.content}</p>
                  </div>
                </div>
              );
            })}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gold/15 p-4 rounded-2xl rounded-tl-none shadow-sm text-xs text-navy/40 italic flex items-center space-x-2">
                  <span className="w-2 h-2 bg-gold rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gold rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-gold rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span>AI Solver is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Form input */}
          <form onSubmit={handleAskAI} className="p-4 bg-white border-t border-gold/15 flex items-center space-x-3">
            <input
              type="text"
              placeholder="Ask me a doubt, e.g. What is photosynthesis? How to solve quadratic formula?"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              className="flex-1 p-3 border border-gold/20 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiQuestion.trim()}
              className="p-3 bg-navy hover:bg-navy-light text-cream rounded-lg shadow disabled:opacity-40 transition"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
