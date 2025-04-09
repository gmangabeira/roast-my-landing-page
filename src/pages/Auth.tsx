
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/auth/Header';
import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast({
        title: "Login successful",
        description: "Welcome back to Conversion ROAST!",
      });
    } catch (error: any) {
      toast({
        title: "Authentication error",
        description: error.message || "An error occurred during authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, firstName, lastName);
      if (error) throw error;
      toast({
        title: "Account created",
        description: "Welcome to Conversion ROAST!",
      });
    } catch (error: any) {
      toast({
        title: "Authentication error",
        description: error.message || "An error occurred during authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Google sign in error",
        description: error.message || "An error occurred during Google sign in",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-md mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{isLogin ? "Log In" : "Sign Up"}</CardTitle>
            <CardDescription>
              {isLogin 
                ? "Enter your credentials to access your account" 
                : "Create an account to save your roasts"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLogin ? (
              <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
            ) : (
              <SignUpForm onSubmit={handleSignUp} isLoading={isLoading} />
            )}

            <SocialAuthButtons 
              onGoogleSignIn={handleGoogleSignIn}
              googleLoading={googleLoading}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              variant="link"
              className="text-sm"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
