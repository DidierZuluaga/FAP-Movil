import { useState, useEffect } from 'react';
import { savingsService } from '../services/firestore/savingsService';
import { Saving } from '../types';
import { useAuth } from './useAuth';

export const useSavings = () => {
  const { user } = useAuth();
  const [savings, setSavings] = useState<Saving[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [interests, setInterests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSavings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const userSavings = await savingsService.getUserSavings(user.id);
      setSavings(userSavings);
      
      const balance = await savingsService.getTotalBalance(user.id);
      setTotalBalance(balance);
      
      const calculatedInterests = await savingsService.calculateInterests(user.id);
      setInterests(calculatedInterests);
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading savings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createSaving = async (amount: number, description: string) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      setIsLoading(true);
      setError(null);
      
      await savingsService.createSaving(user.id, amount, description);
      await loadSavings(); // Recargar datos
      
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavings();
  }, [user]);

  return {
    savings,
    totalBalance,
    interests,
    isLoading,
    error,
    createSaving,
    refresh: loadSavings,
  };
};