import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Star, Shield, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50">
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
                  <h1 className="text-lg font-bold text-gray-900">
                    Primitive Powersports
                  </h1>
                  <p className="text-xs text-gray-500">Quality. Trust. Experience.</p>
                </div>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
              <Link href="/shop" className="text-gray-700 hover:text-blue-600">Shop</Link>
              <Link href="/about" className="text-blue-600 font-medium">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/contact">
                <Button>Contact Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            About Primitive Powersports
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your trusted source for quality ATVs, snowmobiles, lawn tractors, and utility trailers 
            in the Eastern United States. We pride ourselves on providing carefully inspected 
            equipment backed by expert knowledge and exceptional service.
          </p>
        </div>

        {/* Values Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Guaranteed</h3>
            <p className="text-gray-600">
              Every machine in our inventory undergoes thorough inspection to ensure 
              it meets our high standards for quality and reliability.
            </p>
          </div>

          <div className="text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mx-auto mb-4">
              <Star className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Trusted Expertise</h3>
            <p className="text-gray-600">
              Our team brings years of experience in the powersports industry, 
              providing expert advice and personalized recommendations.
            </p>
          </div>

          <div className="text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 mx-auto mb-4">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Years of Service</h3>
            <p className="text-gray-600">
              Built on a foundation of customer satisfaction and community trust, 
              we're dedicated to helping you find the perfect equipment.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-gray-50 rounded-lg p-8 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4">
                Primitive Powersports was founded with a simple mission: to connect people 
                with quality powersports equipment they can trust. We understand that whether 
                you're looking for a reliable ATV for work, a snowmobile for winter adventures, 
                or a lawn tractor to maintain your property, quality matters.
              </p>
              <p className="text-gray-600 mb-4">
                Our commitment goes beyond just selling equipment. We carefully inspect every 
                machine, provide honest assessments, and ensure our customers have all the 
                information they need to make confident decisions.
              </p>
              <p className="text-gray-600">
                From ATVs and snowmobiles to lawn tractors and utility trailers, we specialize 
                in equipment that works as hard as you do. Every item in our inventory is 
                selected for its quality, reliability, and value.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-green-600">
                <div className="flex h-full w-full items-center justify-center">
                  <div className="text-center text-white">
                    <Image 
                      src="/primitive-logo.png" 
                      alt="Primitive Powersports" 
                      width={120} 
                      height={120}
                      className="rounded-lg mx-auto mb-4 bg-white p-4"
                    />
                    <p className="text-lg font-medium">Since Day One</p>
                    <p className="text-sm opacity-90">Quality You Can Trust</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What We Offer */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What We Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ATVs</h3>
              <p className="text-gray-600">
                Work and recreational ATVs from trusted manufacturers, 
                inspected for performance and reliability.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Snowmobiles</h3>
              <p className="text-gray-600">
                Winter adventure machines ready for trails and powder, 
                thoroughly checked for safety and performance.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lawn Tractors</h3>
              <p className="text-gray-600">
                Dependable lawn and garden equipment to keep your 
                property looking its best year-round.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Utility Trailers</h3>
              <p className="text-gray-600">
                Heavy-duty trailers for hauling and transport, 
                built to handle your toughest jobs.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-blue-900 rounded-lg p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Your Perfect Machine?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Contact us today for personalized recommendations and expert advice.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-blue-300" />
              <span>(555) 123-4567</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-300" />
              <span>info@primitivepowersports.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-300" />
              <span>Serving the Eastern US</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <Button size="lg" variant="secondary">
                Browse Our Inventory
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-900">
                Contact Us Today
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}