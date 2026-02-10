import { supabase } from '../lib/supabase';
import type { RegisterData, AuthResponse } from '../types/auth';

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        p_username: username,
        p_password: password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data === null || data === undefined) {
        return { success: false, error: 'No se recibió respuesta del servidor' };
      }

      return data as AuthResponse;
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Error de conexión' };
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('=== INICIANDO REGISTRO ===');
      console.log('Username:', data.username);
      console.log('Email:', data.email || '(vacío)');

      const { data: result, error } = await supabase.rpc('register_user', {
        p_username: data.username,
        p_password: data.password,
        p_email: data.email || null,
      });

      console.log('Supabase result:', result);
      console.log('Supabase error:', error);

      if (error) {
        console.log('Error de Supabase:', error.message);
        return { success: false, error: error.message };
      }

      if (result === null || result === undefined) {
        console.log('Resultado nulo o indefinido');
        return { success: false, error: 'No se recibió respuesta del servidor' };
      }

      console.log('Resultado completo:', JSON.stringify(result, null, 2));

      if (typeof result === 'object' && 'success' in result) {
        return result as AuthResponse;
      }

      console.log('Formato de resultado inesperado');
      return { success: false, error: 'Formato de respuesta inválido' };
    } catch (err) {
      console.error('Error en registro:', err);
      return { success: false, error: 'Error de conexión' };
    }
  },
};
