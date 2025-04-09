
import React from 'react';
import { Flame } from 'lucide-react';

const Header = () => (
  <header className="w-full py-4 px-4 md:px-6 flex items-center justify-center border-b">
    <div className="flex items-center gap-2">
      <Flame size={24} className="text-brand-green" />
      <span className="text-xl font-bold">Conversion ROAST</span>
    </div>
  </header>
);

export default Header;
