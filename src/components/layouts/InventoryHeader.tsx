'use client';

import { SignOutButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';

export default function InventoryHeader() {
  const { user } = useUser();

  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-900">PowerTrader</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
            </span>
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {(user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || 'U').toUpperCase()}
              </span>
            </div>
            <SignOutButton>
              <button className="text-sm text-gray-500 hover:text-gray-700 underline">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </header>
  );
}