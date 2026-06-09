import React, { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function parseFullIsoDate(isoDate) {
  if (!isoDate) return { day: "", month: "", year: "" };
  const parts = isoDate.split("-");
  if (parts.length < 3) return { day: "", month: "", year: "" };
  const [year, month, day] = parts;
  return {
    day: day?.padStart(2, "0") || "",
    month: month?.padStart(2, "0") || "",
    year: year || "",
  };
}

export function isoFromParts(day, month, year) {
  if (!day || !month || !year) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getDaysInMonth(month, year) {
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  if (Number.isNaN(monthNum) || Number.isNaN(yearNum)) return 31;
  return new Date(yearNum, monthNum, 0).getDate();
}

export function calculateAgeFromDob(isoDate) {
  if (!isoDate) return "";
  const { day, month, year } = parseFullIsoDate(isoDate);
  if (!day || !month || !year) return "";

  const birth = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  if (Number.isNaN(birth.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  if (age < 0) return "";
  return String(age);
}

export function formatDobDisplay(isoDate) {
  if (!isoDate) return "";
  const { day, month, year } = parseFullIsoDate(isoDate);
  if (!day || !month || !year) return "";
  return `${day}/${month}/${year}`;
}

function getDecadeStart(year) {
  return Math.floor(year / 10) * 10;
}

function getDecadeYears(decadeStart) {
  return Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i);
}

function buildDayGrid(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(d);
  }

  return cells;
}

export function DateOfBirthPicker({ value, onChange, error = false, placeholder = "DD/MM/YYYY" }) {
  const containerRef = useRef(null);
  const today = new Date();
  const parsed = parseFullIsoDate(value);

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("day");
  const [viewYear, setViewYear] = useState(
    parsed.year ? parseInt(parsed.year, 10) : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    parsed.month ? parseInt(parsed.month, 10) - 1 : today.getMonth()
  );
  const [decadeStart, setDecadeStart] = useState(getDecadeStart(viewYear));

  useEffect(() => {
    const next = parseFullIsoDate(value);
    if (next.year) {
      const y = parseInt(next.year, 10);
      setViewYear(y);
      setDecadeStart(getDecadeStart(y));
    }
    if (next.month) {
      setViewMonth(parseInt(next.month, 10) - 1);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setView("day");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const openPicker = () => {
    const next = parseFullIsoDate(value);
    const y = next.year ? parseInt(next.year, 10) : today.getFullYear();
    const m = next.month ? parseInt(next.month, 10) - 1 : today.getMonth();
    setViewYear(y);
    setViewMonth(m);
    setDecadeStart(getDecadeStart(y));
    setView("day");
    setIsOpen(true);
  };

  const handleDaySelect = (day) => {
    const month = String(viewMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    onChange(isoFromParts(dayStr, month, String(viewYear)));
    setIsOpen(false);
    setView("day");
  };

  const handleMonthSelect = (monthIndex) => {
    setViewMonth(monthIndex);
    setView("day");
  };

  const handleYearSelect = (year) => {
    setViewYear(year);
    setView("month");
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
    setView("day");
  };

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectedDay = parsed.year === String(viewYear)
    && parsed.month === String(viewMonth + 1).padStart(2, "0")
    ? parseInt(parsed.day, 10)
    : null;

  const borderClass = error ? "border-red-500" : "border-[#0D4A7A]";

  return (
    <div ref={containerRef} className="relative w-full">
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 z-[100001] mb-2">
          <div className="bg-white border border-[#E3E1E1] rounded-[12px] shadow-lg p-4 w-full max-w-[320px] sm:min-w-[280px]">
            {view === "day" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={goPrevMonth}
                    className="w-8 h-8 rounded-full bg-[#F3F3F3] flex items-center justify-center text-[#0D4A7A] hover:bg-[#E8E8E8] transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setView("month")}
                      className="px-3 py-1.5 rounded-full bg-[#F3F3F3] text-[#0D4A7A] text-[14px] font-semibold hover:bg-[#E8E8E8] transition-colors"
                    >
                      {MONTHS[viewMonth]}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDecadeStart(getDecadeStart(viewYear));
                        setView("year");
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#F3F3F3] text-[#0D4A7A] text-[14px] font-semibold hover:bg-[#E8E8E8] transition-colors"
                    >
                      {viewYear}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={goNextMonth}
                    className="w-8 h-8 rounded-full bg-[#F3F3F3] flex items-center justify-center text-[#0D4A7A] hover:bg-[#E8E8E8] transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {WEEKDAYS.map((label) => (
                    <div key={label} className="text-center text-[12px] font-medium text-[#999] py-1">
                      {label}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 mb-4">
                  {buildDayGrid(viewYear, viewMonth).map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="h-9" />;
                    }
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDaySelect(day)}
                        className={`h-9 text-[14px] font-medium rounded-full transition-colors ${
                          isSelected
                            ? "border border-[#0D4A7A] text-[#0D4A7A] bg-white"
                            : "border border-transparent text-[#3A3A3A] hover:text-[#0D4A7A] hover:bg-[#F3F3F3]"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {view === "month" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setViewYear((y) => y - 1)}
                    className="w-8 h-8 rounded-full bg-[#F3F3F3] flex items-center justify-center text-[#0D4A7A] hover:bg-[#E8E8E8] transition-colors"
                    aria-label="Previous year"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDecadeStart(getDecadeStart(viewYear));
                      setView("year");
                    }}
                    className="px-4 py-1.5 rounded-full bg-[#F3F3F3] text-[#0D4A7A] text-[15px] font-semibold hover:bg-[#E8E8E8] transition-colors"
                  >
                    {viewYear}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewYear((y) => y + 1)}
                    className="w-8 h-8 rounded-full bg-[#F3F3F3] flex items-center justify-center text-[#0D4A7A] hover:bg-[#E8E8E8] transition-colors"
                    aria-label="Next year"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-y-2 gap-x-1 mb-4">
                  {MONTHS.map((label, index) => {
                    const isSelected = viewMonth === index;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleMonthSelect(index)}
                        className={`py-2 px-1 text-[14px] font-medium rounded-full transition-colors ${
                          isSelected
                            ? "border border-[#0D4A7A] text-[#0D4A7A] bg-white"
                            : "border border-transparent text-[#3A3A3A] hover:text-[#0D4A7A]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {view === "year" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setDecadeStart((d) => d - 10)}
                    className="w-8 h-8 rounded-full bg-[#F3F3F3] flex items-center justify-center text-[#0D4A7A] hover:bg-[#E8E8E8] transition-colors"
                    aria-label="Previous decade"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="px-4 py-1.5 rounded-full bg-[#F3F3F3] text-[#0D4A7A] text-[15px] font-semibold">
                    {decadeStart}-{decadeStart + 9}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDecadeStart((d) => d + 10)}
                    className="w-8 h-8 rounded-full bg-[#F3F3F3] flex items-center justify-center text-[#0D4A7A] hover:bg-[#E8E8E8] transition-colors"
                    aria-label="Next decade"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-y-2 gap-x-1 mb-4">
                  {getDecadeYears(decadeStart).map((year) => {
                    const isSelected = viewYear === year;
                    const inDecade = year >= decadeStart && year <= decadeStart + 9;
                    const isFuture = year > today.getFullYear();
                    return (
                      <button
                        key={year}
                        type="button"
                        disabled={isFuture}
                        onClick={() => handleYearSelect(year)}
                        className={`py-2 px-1 text-[14px] font-medium rounded-full transition-colors ${
                          isFuture
                            ? "border border-transparent text-[#CCC] cursor-not-allowed"
                            : isSelected
                            ? "border border-[#0D4A7A] text-[#0D4A7A] bg-white"
                            : inDecade
                            ? "border border-transparent text-[#0D4A7A] hover:bg-[#F3F3F3]"
                            : "border border-transparent text-[#3A3A3A] hover:text-[#0D4A7A]"
                        }`}
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-2 text-[#0D4A7A] text-[14px] font-medium hover:opacity-80 transition-opacity"
            >
              Clear Selection
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={openPicker}
        className={`w-full px-5 py-4 border rounded-[10px] text-[16px] bg-[#FAF8F4] outline-none transition-all flex items-center justify-between text-left focus:border-[#0D4A7A] ${borderClass}`}
      >
        <span className={value ? "text-[#3A3A3A]" : "text-[#999]"}>
          {value ? formatDobDisplay(value) : placeholder}
        </span>
        <Calendar size={18} className="text-[#0D4A7A] shrink-0 ml-2" />
      </button>
    </div>
  );
}
