import { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  if (isLogin) {
    return <LoginForm onSwitchToSignup={() => setIsLogin(false)} />;
  } else {
    return <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />;
  }
}