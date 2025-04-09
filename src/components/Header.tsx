
import React from 'react';
import { Button } from '@/components/ui/button';
import { Flame } from 'lucide-react';

const Header = () => {
  return (
    <header className="w-full py-4 px-4 md:px-6 flex items-center justify-between border-b">
      <div className="flex items-center gap-2">
        <Flame size={24} className="text-brand-green" />
        <span className="text-xl font-bold">Conversion ROAST</span>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="text-brand-gray">
          Sign Up
        </Button>
        <Button className="bg-brand-green hover:bg-brand-green/90">
          Login
        </Button>
      </div>
    </header>
  );
};

export default Header;
