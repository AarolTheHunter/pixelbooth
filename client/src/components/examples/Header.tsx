import Header from '../Header';
import { useState } from 'react';

export default function HeaderExample() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const handleNavigate = (page: string) => {
    console.log(`Navigating to: ${page}`);
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    console.log('User logged out');
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentPage="home"
        onNavigate={handleNavigate}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Example header with gradient background and prettyclick branding</p>
        <button 
          onClick={() => setIsAuthenticated(!isAuthenticated)}
          className="mt-4 text-primary underline hover:no-underline"
        >
          Toggle Authentication State
        </button>
      </div>
    </div>
  );
}