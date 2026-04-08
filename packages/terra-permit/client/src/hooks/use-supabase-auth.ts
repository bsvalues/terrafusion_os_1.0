import { useContext } from 'react';
import { useSupabaseAuth as useContextSupabaseAuth } from '@/contexts/SupabaseAuthContext';

// Re-export the hook from the context
export const useSupabaseAuth = useContextSupabaseAuth;