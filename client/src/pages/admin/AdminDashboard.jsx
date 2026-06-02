import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { 
  Users, BookOpen, Calendar, DollarSign, Plus, Trash2, Award, 
  Settings, UserPlus, ShieldAlert, Send
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ students: 0, teachers: 0, parents: 0, classes: 0 });
  const [announcements, setAnnouncements] = useState([]);
  
  // Data lists
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [feeRecords, setFeeRecords] = useState([]);
  
  // Modals & form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'register', 'class', 'subject', 'announcement', 'fee'
  const [formData, setFormData] = useState({
    name: '', email: '', password: 'password123', role: 'teacher', phone: '',
    rollNum: '', className: '1st Standard', section: 'A', parentEmail: '',
    maxStudents: 40, classTeacherId: '',
    subName: 'Mathematics', subCode: '', classId: '', teacherId: '',
    annTitle: '', annContent: '', targetAudience: 'all',
    tuitionFee: 12000, examFee: 1500, otherFee: 500, feeClassId: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errMessage, setErrMessage] = useState('');

  const fetchDashboardData = async () => {
    try {
      const classRes = await client.get('/admin/classes');
      setClasses(classRes.data);

      const teachRes = await client.get('/admin/users/teacher');
      setTeachers(teachRes.data);

      const studRes = await client.get('/admin/users/student');
      setStudents(studRes.data);

      const parentRes = await client.get('/admin/users/parent');
      
      const annRes = await client.get('/announcements');
      setAnnouncements(annRes.data);

      const feesRes = await client.get('/admin/fee-records');
      setFeeRecords(feesRes.data);

      setStats({
        students: studRes.data.length,
        teachers: teachRes.data.length,
        parents: parentRes.data.length,
        classes: classRes.data.length
      });
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openFormModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
    setMessage('');
    setErrMessage('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrMessage('');
    try {
      if (modalType === 'register') {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
          rollNum: formData.rollNum,
          className: formData.className,
          section: formData.section,
          parentEmail: formData.parentEmail
        };
        await client.post('/admin/register', payload);
        setMessage('User registered successfully!');
      } 
      else if (modalType === 'class') {
        const payload = {
          className: formData.className,
          section: formData.section,
          maxStudents: formData.maxStudents,
          classTeacherId: formData.classTeacherId
        };
        await client.post('/admin/classes', payload);
        setMessage('Class created successfully!');
      }
      else if (modalType === 'subject') {
        const payload = {
          subName: formData.subName,
          subCode: formData.subCode,
          classId: formData.classId,
          teacherId: formData.teacherId
        };
        await client.post('/admin/subjects', payload);
        setMessage('Subject created & assigned successfully!');
      }
      else if (modalType === 'announcement') {
        const payload = {
          title: formData.annTitle,
          content: formData.annContent,
          targetAudience: [formData.targetAudience]
        };
        await client.post('/announcements', payload);
        setMessage('Announcement posted successfully!');
      }
      else if (modalType === 'fee') {
        const payload = {
          classId: formData.feeClassId,
          tuitionFee: Number(formData.tuitionFee),
          examFee: Number(formData.examFee),
          otherFee: Number(formData.otherFee)
        };
        await client.post('/admin/fee-structure', payload);
        setMessage('Fee structure saved successfully!');
      }

      // Refresh list data
      await fetchDashboardData();
      
      // Clear forms
      setFormData({
        ...formData,
        name: '', email: '', password: 'password123', phone: '',
        rollNum: '', parentEmail: '', subCode: '', annTitle: '', annContent: ''
      });
      setTimeout(() => setIsModalOpen(false), 1500);
    } catch (err) {
      setErrMessage(err.response?.data?.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user profile?')) {
      try {
        await client.delete(`/admin/users/${userId}`);
        await fetchDashboardData();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting user');
      }
    }
  };

  const handleGenerateBills = async (classId) => {
    try {
      const res = await client.post('/admin/fee-bills', { classId });
      alert(res.data.message);
      await fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating invoices');
    }
  };

  // Setup headers for standard datatables
  const teacherHeaders = [
    { label: 'Name', key: 'name' },
    { label: 'Email', key: 'email' },
    { label: 'Phone', key: 'phone' },
    { label: 'Assigned Classes', render: (row) => row.profile?.classes?.map(c => c.sclassName).join(', ') || 'None' },
    { label: 'Action', render: (row) => (
      <button onClick={() => handleDeleteUser(row._id)} className="text-red-500 hover:text-red-700">
        <Trash2 size={16} />
      </button>
    )}
  ];

  const studentHeaders = [
    { label: 'Roll No', render: (row) => row.profile?.rollNum },
    { label: 'Name', key: 'name' },
    { label: 'Email', key: 'email' },
    { label: 'Class/Sec', render: (row) => row.profile?.class?.sclassName || 'N/A' },
    { label: 'Parent Link', render: (row) => row.profile?.parent?.name || 'N/A' },
    { label: 'Action', render: (row) => (
      <button onClick={() => handleDeleteUser(row._id)} className="text-red-500 hover:text-red-700">
        <Trash2 size={16} />
      </button>
    )}
  ];

  const classHeaders = [
    { label: 'Standard', key: 'sclassName' },
    { label: 'Class Teacher', render: (row) => row.classTeacher?.name || 'None' },
    { label: 'Limit', key: 'maxStudents' },
    { label: 'Subjects', render: (row) => row.subjects?.map(s => s.subName).join(', ') || 'None' },
    { label: 'Action', render: (row) => (
      <button
        onClick={() => handleGenerateBills(row._id)}
        className="px-2.5 py-1 bg-gold hover:bg-gold-dark text-navy font-bold rounded text-xs transition"
      >
        Issue Fee Invoice
      </button>
    )}
  ];

  const feeHeaders = [
    { label: 'Student', render: (row) => row.student?.name || 'N/A' },
    { label: 'Class', render: (row) => row.class?.sclassName || 'N/A' },
    { label: 'Amount Due', key: 'amountDue', render: (row) => `$${row.amountDue}` },
    { label: 'Amount Paid', key: 'amountPaid', render: (row) => `$${row.amountPaid}` },
    { label: 'Status', render: (row) => (
      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
        row.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
      }`}>
        {row.status}
      </span>
    )}
  ];

  return (
    <DashboardLayout>
      {/* Tab Select Header */}
      <div className="flex border-b border-gold/15 mb-6 overflow-x-auto">
        {['dashboard', 'teachers', 'students', 'classes', 'fees'].map((tab) => (
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
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Students" value={stats.students} icon={Users} color="navy" />
            <StatCard title="Total Teachers" value={stats.teachers} icon={Award} color="gold" />
            <StatCard title="Parents Registered" value={stats.parents} icon={Users} color="navy" />
            <StatCard title="Active Classes" value={stats.classes} icon={BookOpen} color="gold" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions Column */}
            <div className="bg-white p-6 rounded-xl border border-gold/20 shadow-sm flex flex-col justify-between">
              <h4 className="font-bold font-serif text-navy text-lg mb-4">Management Actions</h4>
              <div className="space-y-3 flex-1">
                <button
                  onClick={() => openFormModal('register')}
                  className="w-full flex items-center justify-between p-3.5 bg-cream/35 hover:bg-gold/10 text-navy font-bold rounded-lg border border-gold/10 transition"
                >
                  <span className="flex items-center space-x-3">
                    <UserPlus size={18} className="text-gold" />
                    <span>Register New Account</span>
                  </span>
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => openFormModal('class')}
                  className="w-full flex items-center justify-between p-3.5 bg-cream/35 hover:bg-gold/10 text-navy font-bold rounded-lg border border-gold/10 transition"
                >
                  <span className="flex items-center space-x-3">
                    <BookOpen size={18} className="text-gold" />
                    <span>Create Class Standard</span>
                  </span>
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => openFormModal('subject')}
                  className="w-full flex items-center justify-between p-3.5 bg-cream/35 hover:bg-gold/10 text-navy font-bold rounded-lg border border-gold/10 transition"
                >
                  <span className="flex items-center space-x-3">
                    <Settings size={18} className="text-gold" />
                    <span>Assign Subjects & Teachers</span>
                  </span>
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => openFormModal('fee')}
                  className="w-full flex items-center justify-between p-3.5 bg-cream/35 hover:bg-gold/10 text-navy font-bold rounded-lg border border-gold/10 transition"
                >
                  <span className="flex items-center space-x-3">
                    <DollarSign size={18} className="text-gold" />
                    <span>Configure Fee Structure</span>
                  </span>
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => openFormModal('announcement')}
                  className="w-full flex items-center justify-between p-3.5 bg-cream/35 hover:bg-gold/10 text-navy font-bold rounded-lg border border-gold/10 transition"
                >
                  <span className="flex items-center space-x-3">
                    <ShieldAlert size={18} className="text-gold" />
                    <span>Broadcast School Announcement</span>
                  </span>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Recent Announcements Board */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gold/20 shadow-sm">
              <h4 className="font-bold font-serif text-navy text-lg mb-4">Recent Announcements</h4>
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {announcements.length > 0 ? (
                  announcements.map((ann) => (
                    <div key={ann._id} className="p-4 bg-cream/35 rounded-lg border border-gold/10">
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-sm text-navy">{ann.title}</h5>
                        <span className="text-[10px] uppercase font-bold text-gold bg-navy px-2 py-0.5 rounded">
                          {ann.targetAudience?.join(', ')}
                        </span>
                      </div>
                      <p className="text-xs text-navy/70 mt-1">{ann.content}</p>
                      <span className="text-[10px] text-navy/40 mt-2 block">
                        Posted on {new Date(ann.createdAt).toLocaleDateString()} by {ann.createdBy?.name}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-navy/40 text-center py-8">No announcements posted.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard Tab Lists */}
      {activeTab === 'teachers' && (
        <DataTable headers={teacherHeaders} data={teachers} searchPlaceholder="Search teachers..." searchKey="name" />
      )}

      {activeTab === 'students' && (
        <DataTable headers={studentHeaders} data={students} searchPlaceholder="Search students..." searchKey="name" />
      )}

      {activeTab === 'classes' && (
        <DataTable headers={classHeaders} data={classes} searchPlaceholder="Search standard levels..." searchKey="sclassName" />
      )}

      {activeTab === 'fees' && (
        <DataTable headers={feeHeaders} data={feeRecords} searchPlaceholder="Search bills by student name..." searchKey="studentName" />
      )}

      {/* POPUP FORMS MODALS */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} Setup`}>
        {message && <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-lg text-xs font-semibold text-center">{message}</div>}
        {errMessage && <div className="mb-4 p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-semibold text-center">{errMessage}</div>}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* USER REGISTRATION FORM */}
          {modalType === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Full Name</label>
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm bg-cream/10 border-gold/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Email</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm bg-cream/10 border-gold/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Phone</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm bg-cream/10 border-gold/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm bg-cream/10 border-gold/20">
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Default Password</label>
                  <input type="password" name="password" required value={formData.password} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm bg-cream/10 border-gold/20" />
                </div>
              </div>

              {formData.role === 'student' && (
                <div className="border-t border-gold/15 pt-3 mt-2 space-y-3">
                  <h5 className="font-bold text-xs uppercase text-gold">Student Details</h5>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold">Roll Number</label>
                      <input type="text" name="rollNum" required={formData.role === 'student'} value={formData.rollNum} onChange={handleInputChange} className="w-full p-2 border rounded-lg text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold">Standard</label>
                      <select name="className" value={formData.className} onChange={handleInputChange} className="w-full p-2 border rounded-lg text-xs">
                        {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold">Section</label>
                      <select name="section" value={formData.section} onChange={handleInputChange} className="w-full p-2 border rounded-lg text-xs">
                        <option value="A">A</option>
                        <option value="B">B</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold">Linked Parent Email</label>
                    <input type="email" name="parentEmail" placeholder="Parent user must already exist" value={formData.parentEmail} onChange={handleInputChange} className="w-full p-2 border rounded-lg text-xs" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* CREATE CLASS FORM */}
          {modalType === 'class' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Standard Level</label>
                  <select name="className" value={formData.className} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm">
                    {classesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Section</label>
                  <select name="section" value={formData.section} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm">
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Max Student Cap</label>
                  <input type="number" name="maxStudents" value={formData.maxStudents} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Class Teacher</label>
                  <select name="classTeacherId" value={formData.classTeacherId} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm">
                    <option value="">Select Class Teacher...</option>
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* CREATE SUBJECT FORM */}
          {modalType === 'subject' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Subject Topic</label>
                  <select name="subName" value={formData.subName} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm">
                    {['English', 'Mathematics', 'Science', 'Social Studies', 'Computer Science', 'General Knowledge', 'Hindi', 'Kannada', 'Telugu', 'Sanskrit', 'Physical Education', 'Art & Craft'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Unique Code</label>
                  <input type="text" name="subCode" placeholder="e.g. MAT-10A" value={formData.subCode} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Assign Class Level</label>
                  <select name="classId" value={formData.classId} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm">
                    <option value="">Select standard...</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.sclassName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Assign Course Teacher</label>
                  <select name="teacherId" value={formData.teacherId} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm">
                    <option value="">Select teacher...</option>
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* BROADCAST ANNOUNCEMENT */}
          {modalType === 'announcement' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Title</label>
                <input type="text" name="annTitle" required value={formData.annTitle} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Target Audience</label>
                <select name="targetAudience" value={formData.targetAudience} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm">
                  <option value="all">Everyone</option>
                  <option value="teacher">Teachers Only</option>
                  <option value="student">Students Only</option>
                  <option value="parent">Parents Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Content Details</label>
                <textarea rows="4" name="annContent" required value={formData.annContent} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm"></textarea>
              </div>
            </>
          )}

          {/* FEE STRUCTURE */}
          {modalType === 'fee' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Select Class Standard</label>
                <select name="feeClassId" required value={formData.feeClassId} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg text-sm">
                  <option value="">Select class level...</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.sclassName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold">Tuition Fee ($)</label>
                  <input type="number" name="tuitionFee" value={formData.tuitionFee} onChange={handleInputChange} className="w-full p-2 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold">Exam Fee ($)</label>
                  <input type="number" name="examFee" value={formData.examFee} onChange={handleInputChange} className="w-full p-2 border rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold">Other Fee ($)</label>
                  <input type="number" name="otherFee" value={formData.otherFee} onChange={handleInputChange} className="w-full p-2 border rounded-lg text-xs" />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-navy hover:bg-navy-light text-cream font-bold rounded-lg transition"
          >
            {loading ? 'Processing...' : 'Submit Configuration'}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

const classesList = [
  '1st Standard', '2nd Standard', '3rd Standard', '4th Standard', '5th Standard',
  '6th Standard', '7th Standard', '8th Standard', '9th Standard', '10th Standard'
];

export default AdminDashboard;
