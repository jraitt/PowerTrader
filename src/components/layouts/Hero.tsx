'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[600px] items-center">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
            {/* Text Content */}
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  <span className="block">PowerTrader</span>
                  <span className="block text-blue-600">Buy / Sell the East</span>
                </h1>
                <p className="text-xl text-gray-600 sm:text-2xl">
                  The smart way to manage your small engine machinery inventory. 
                  Track ATVs, snowmobiles, trailers, and more with AI-powered automation.
                </p>
              </div>

              <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Link href="/sign-up">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Features List */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center space-x-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">AI Photo Analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">URL Import</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Smart Analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Mobile Ready</span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="relative">
                {/* Main Hero Image Container */}
                <div className="relative h-[400px] w-[500px] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl">
                  {/* Placeholder for hero image - replace with actual machinery image */}
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center text-white">
                      <svg className="mx-auto h-24 w-24 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m0 0h9.75a1.125 1.125 0 001.125 1.125v3.375zM9.75 12.75H21m-11.25 0a1.125 1.125 0 00-1.125 1.125v3.375m1.125-4.5a1.125 1.125 0 011.125-1.125h7.5m-7.5 4.5v3.375a1.125 1.125 0 001.125 1.125h7.5a1.125 1.125 0 001.125-1.125V12.75m-7.5 0a1.125 1.125 0 00-1.125 1.125v3.375" />
                      </svg>
                      <p className="mt-4 text-lg font-medium">Inventory Management</p>
                      <p className="mt-2 text-sm opacity-90">Powered by AI</p>
                    </div>
                  </div>
                  
                  {/* Floating cards for visual appeal */}
                  <div className="absolute -top-4 -right-4 rounded-lg bg-white p-3 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-4 -left-4 rounded-lg bg-white p-3 shadow-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">$125K</div>
                      <div className="text-xs text-gray-500">Total Value</div>
                    </div>
                  </div>
                </div>

                {/* Background decoration */}
                <div className="absolute -z-10 -top-8 -right-8 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-blue-200 to-purple-200 opacity-30"></div>
                <div className="absolute -z-20 -bottom-8 -left-8 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-green-200 to-blue-200 opacity-20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}