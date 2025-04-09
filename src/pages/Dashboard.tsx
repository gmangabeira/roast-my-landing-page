
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl font-bold mb-6">My Roasts</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>No Roasts Yet</CardTitle>
              <CardDescription>
                You haven't created any roasts yet. Get started by analyzing your first landing page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/')} 
                className="bg-brand-green hover:bg-brand-green/90"
              >
                <Flame className="mr-2 h-4 w-4" />
                Create New Roast
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
