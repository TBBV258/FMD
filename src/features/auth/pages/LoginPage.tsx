import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/lib/hooks/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signInWithGoogle, isAuthenticated, isLoading } = useAuth();

  console.log('🔍 LoginPage: Component rendered');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('🚀 LoginPage: User already authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 LoginPage: Form submitted');
    console.log('📧 Email:', email);
    console.log('🔐 Password:', password ? '***hidden***' : 'empty');
    
    if (!email || !password) {
      console.log('❌ LoginPage: Missing credentials');
      alert('Por favor, preencha email e senha');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('🔍 LoginPage: Starting real authentication...');
      await signIn(email, password);
      console.log('✅ LoginPage: Authentication successful');
      // Navigation will happen automatically via useEffect when isAuthenticated changes
    } catch (error: any) {
      console.error('❌ LoginPage: Authentication error:', error);
      
      // Handle specific error messages
      let errorMessage = 'Erro ao fazer login';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Por favor, confirme seu email antes de fazer login';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
      console.log('🔍 LoginPage: Login attempt finished');
    }
  };

  const handleGoogleLogin = async () => {
    console.log('🔍 LoginPage: Google login clicked');
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('❌ LoginPage: Google login error:', error);
      alert('Erro no login com Google: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleSignupClick = () => {
    console.log('🔍 LoginPage: Signup button clicked');
    alert('Funcionalidade de criar conta será implementada em breve!');
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-soft">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="20" cy="20" r="8"/>
                <circle cx="50" cy="20" r="8"/>
                <circle cx="80" cy="20" r="8"/>
                <path d="M10 40h80v50H10z" rx="5"/>
                <path d="M20 50h60v8H20z" fill="#FFD700"/>
                <path d="M20 65h40v4H20z" fill="#666"/>
                <path d="M20 75h50v4H20z" fill="#666"/>
              </svg>
            </div>
            <CardTitle className="text-responsive-xl">FindMyDocs</CardTitle>
            <p className="text-responsive-base text-gray-600 dark:text-gray-400">
              Sistema de gestão de documentos perdidos e encontrados
            </p>
          </CardHeader>
          
          <CardContent className="space-responsive-md">
            <form onSubmit={handleSubmit} className="space-responsive-md">
              <Input
                label="Email"
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  console.log('📧 Email changed:', e.target.value);
                }}
                fullWidth
                required
              />
              
              <Input
                label="Senha"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  console.log('🔐 Password changed:', e.target.value ? '***provided***' : 'empty');
                }}
                fullWidth
                required
              />
              
              <Button 
                type="submit" 
                fullWidth 
                className="w-full"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            
            <div className="text-center space-responsive-sm">
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">ou</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                fullWidth
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                leftIcon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                }
              >
                Continuar com Google
              </Button>
              
              <p className="text-responsive-sm text-gray-600 dark:text-gray-400 mt-4">
                Não tem uma conta?
              </p>
              <Button 
                variant="ghost" 
                fullWidth
                onClick={handleSignupClick}
                disabled={isSubmitting}
                className="mt-2"
              >
                Criar Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
