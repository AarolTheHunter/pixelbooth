import LoginForm from '../LoginForm';

export default function LoginFormExample() {
  const handleLogin = (username: string, password: string) => {
    console.log('Login successful:', username);
    alert(`Welcome back, ${username}!`);
  };
  
  const handleSwitchToSignup = () => {
    console.log('Switching to signup');
  };
  
  return (
    <LoginForm 
      onLogin={handleLogin}
      onSwitchToSignup={handleSwitchToSignup}
    />
  );
}