import React, { useState } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AttendanceCalendar = ({ records = [] }) => {
  const [currentDate, setCurrentDate] = useState(dayjs());

  // Parse attendance records to a map of yyyy-mm-dd -> status
  const recordsMap = records.reduce((acc, rec) => {
    const dateStr = dayjs(rec.date).format('YYYY-MM-DD');
    acc[dateStr] = rec.status;
    return acc;
  }, {});

  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const daysInMonth = currentDate.daysInMonth();
  
  // Day of week offset for the start of the month (0 = Sunday, 6 = Saturday)
  const startDayOffset = startOfMonth.day();

  // Create array of days to render
  const days = [];
  
  // Empty blocks for offset
  for (let i = 0; i < startDayOffset; i++) {
    days.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(startOfMonth.date(i));
  }

  const prevMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  };

  const nextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500 text-white';
      case 'Absent':
        return 'bg-red-500 text-white';
      case 'Late':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-cream text-navy/40 hover:bg-gold/10';
    }
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl border border-gold/20 p-5 shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-bold font-serif text-navy text-lg">
          {currentDate.format('MMMM YYYY')}
        </h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-1.5 border border-gold/20 rounded-lg hover:bg-cream"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 border border-gold/20 rounded-lg hover:bg-cream"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekdays Headers */}
      <div className="grid grid-cols-7 text-center gap-2 mb-2">
        {weekdays.map((wd, index) => (
          <span key={index} className="text-xs font-semibold text-navy/55 uppercase tracking-wider">
            {wd}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-10" />;
          
          const dateStr = day.format('YYYY-MM-DD');
          const status = recordsMap[dateStr];
          
          return (
            <div
              key={dateStr}
              className={`h-10 flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all shadow-sm ${getStatusColor(
                status
              )}`}
            >
              <span>{day.date()}</span>
              {status && (
                <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5 scale-75">
                  {status[0]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-6 border-t border-gold/10 pt-4 text-xs font-semibold text-navy/70">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-emerald-500 rounded" />
          <span>Present</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-amber-500 rounded" />
          <span>Late</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-red-500 rounded" />
          <span>Absent</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
