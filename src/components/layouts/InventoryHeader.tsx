'use client';

import { SignOutButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';

export default function InventoryHeader() {
  const { user } = useUser();

  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <Image 
                src="/primitive-logo.png" 
                alt="Primitive Powersports" 
                width={40} 
                height={40}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Primitive Powersports</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              View Storefront
            </Link>
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