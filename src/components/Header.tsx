
import React from 'react';
import { Button } from '@/components/ui/button';
import { Flame, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="w-full py-4 px-4 md:px-6 flex items-center justify-between border-b">
      <Link to="/" className="flex items-center gap-2">
        <Flame size={24} className="text-brand-green" />
        <span className="text-xl font-bold">Conversion ROAST</span>
      </Link>
      <div className="flex items-center gap-3">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-default">
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Link to="/dashboard">
                <DropdownMenuItem className="cursor-pointer">
                  My Roasts
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="cursor-pointer" onClick={signOut}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Link to="/auth">
              <Button variant="ghost" className="text-brand-gray">
                Sign Up
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-brand-green hover:bg-brand-green/90">
                Login
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
