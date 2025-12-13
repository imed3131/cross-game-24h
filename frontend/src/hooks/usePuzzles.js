import { useState, useEffect } from 'react';
import { playerAPI } from '../services/api';
import { toast } from 'react-hot-toast';

export const usePuzzles = () => {
  const [todaysPuzzles, setTodaysPuzzles] = useState([]);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [puzzleDates, setPuzzleDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch today's puzzles
  const fetchTodaysPuzzles = async () => {
    try {
      setLoading(true);
      const response = await playerAPI.getTodaysPuzzles();
      setTodaysPuzzles(response.data);
      if (response.data.length > 0 && !selectedPuzzle) {
        setSelectedPuzzle(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch today\'s puzzles:', error);
      setError('Failed to load today\'s puzzles');
      toast.error('Failed to load today\'s puzzles');
    } finally {
      setLoading(false);
    }
  };

  // Fetch puzzles by date
  const fetchPuzzlesByDate = async (date) => {
    try {
      setLoading(true);
      const response = await playerAPI.getPuzzlesByDate(date);
      setTodaysPuzzles(response.data);
      if (response.data.length > 0) {
        setSelectedPuzzle(response.data[0]);
      } else {
        setSelectedPuzzle(null);
      }
    } catch (error) {
      console.error('Failed to fetch puzzles by date:', error);
      setError('Failed to load puzzles for selected date');
      toast.error('Failed to load puzzles for selected date');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all puzzle dates for calendar
  const fetchPuzzleDates = async () => {
    try {
      const response = await playerAPI.getAllPuzzleDates();
      setPuzzleDates(response.data);
    } catch (error) {
      console.error('Failed to fetch puzzle dates:', error);
      toast.error('Failed to load puzzle calendar');
    }
  };

  // Submit solution
  const submitSolution = async (puzzleId, solution, language, timeSpent) => {
    try {
      const response = await playerAPI.submitSolution(puzzleId, {
        solution,
        language,
        timeSpent,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to submit solution:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to submit solution');
    }
  };

  // Initialize data
  useEffect(() => {
    fetchTodaysPuzzles();
    fetchPuzzleDates();
  }, []);

  return {
    todaysPuzzles,
    selectedPuzzle,
    setSelectedPuzzle,
    puzzleDates,
    loading,
    error,
    fetchTodaysPuzzles,
    fetchPuzzlesByDate,
    fetchPuzzleDates,
    submitSolution,
  };
};
