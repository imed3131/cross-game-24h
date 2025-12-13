import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = ({ 
  puzzleDates = [], 
  selectedDate, 
  onDateSelect, 
  className = '' 
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;

  // Check if a date has puzzles
  const hassPuzzle = (date) => {
    return puzzleDates.some(puzzleDate => 
      isSameDay(new Date(puzzleDate.date), date)
    );
  };

  // Navigate months
  const nextMonth = () => {
    setCurrentMonth(addDays(monthStart, 32));
  };

  const prevMonth = () => {
    setCurrentMonth(addDays(monthStart, -1));
  };

  // Create calendar grid
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const isPuzzleDay = hassPuzzle(day);
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isSelected = selectedDate && isSameDay(day, selectedDate);
      const isTodayDate = isToday(day);

      days.push(
        <motion.div
          key={day.toString()}
          className={`
            relative h-12 w-12 flex items-center justify-center cursor-pointer rounded-lg text-sm font-medium transition-all duration-200
            ${!isCurrentMonth ? 'text-gray-400' : ''}
            ${isTodayDate ? 'bg-primary-100 text-primary-900 font-bold' : ''}
            ${isSelected ? 'bg-primary-600 text-white shadow-lg' : ''}
            ${isPuzzleDay && !isSelected ? 'bg-success-100 text-success-900 hover:bg-success-200' : ''}
            ${!isPuzzleDay && !isTodayDate && !isSelected ? 'hover:bg-gray-100' : ''}
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDateSelect(cloneDay)}
          disabled={!isPuzzleDay}
        >
          {format(day, dateFormat)}
          
          {/* Puzzle indicator dot */}
          {isPuzzleDay && !isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success-500"
            />
          )}
          
          {/* Today indicator */}
          {isTodayDate && !isSelected && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full" />
          )}
        </motion.div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="flex justify-center space-x-1">
        {days}
      </div>
    );
    days = [];
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </motion.button>
        
        <h2 className="text-xl font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </motion.button>
      </div>

      {/* Days of Week */}
      <div className="flex justify-center space-x-1 mb-4">
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
          <div key={day} className="h-12 w-12 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-500">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        {rows}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-success-500"></div>
            <span className="text-gray-600">Puzzles disponibles</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-primary-600"></div>
            <span className="text-gray-600">Aujourd'hui</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Calendar;
