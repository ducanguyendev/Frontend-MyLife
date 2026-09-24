import React, { useState } from 'react';
import { Solar } from 'lunar-javascript';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface LunarDatePickerProps {
  value: string; // Định dạng 'YYYY-MM-DD'
  onChange: (solarDateStr: string, lunarDateStr: string) => void;
}

export const LunarDatePicker: React.FC<LunarDatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse chuỗi YYYY-MM-DD an toàn theo giờ local để tránh lệch múi giờ
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const initialDate = parseLocalDate(value);
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  const getDaysInMonth = (year: number, month: number) => {
    const days = [];
    const date = new Date(year, month, 1);
    
    let startDayOfWeek = date.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    while (date.getMonth() === month) {
      days.push(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const days = getDaysInMonth(currentYear, currentMonth);
  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Dùng fromYmd thay cho fromDate để ép chuẩn xác tuyệt đối theo giờ local, không bị lệch
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();
    
    const solarStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const lunarStr = `${lunar.getDay()}/${lunar.getMonth()} Âm lịch`;

    onChange(solarStr, lunarStr);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text flex items-center justify-between cursor-pointer hover:border-accent transition"
      >
        <span>{value ? `${value}` : 'Chọn ngày...'}</span>
        <CalendarIcon className="w-4 h-4 text-accent" />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-secondary-bg border border-white/15 rounded-3xl p-4 shadow-2xl w-80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-1.5 hover:bg-white/10 rounded-xl text-gray-300 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-primary-text">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-1.5 hover:bg-white/10 rounded-xl text-gray-300 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-gray-400 uppercase mb-2">
            <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} />;

              const y = date.getFullYear();
              const m = date.getMonth() + 1;
              const d = date.getDate();

              const solar = Solar.fromYmd(y, m, d);
              const lunar = solar.getLunar();
              
              const dateString = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isSelected = value === dateString;

              return (
                <button
                  type="button"
                  key={dateString}
                  onClick={() => handleSelectDate(date)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition cursor-pointer h-12 ${
                    isSelected 
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/30' 
                      : 'bg-primary-bg/50 border-white/5 hover:border-accent/50 text-primary-text'
                  }`}
                >
                  <span className="text-xs font-bold">{d}</span>
                  <span className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-accent'}`}>
                    {lunar.getDay()}/{lunar.getMonth()}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-400 hover:text-white px-3 py-1 bg-white/5 rounded-lg transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};