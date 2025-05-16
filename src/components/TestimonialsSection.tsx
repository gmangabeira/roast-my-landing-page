
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Users } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  company: string;
  rating: number;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

const TestimonialsSection = ({ testimonials }: TestimonialsSectionProps) => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">What Marketers Are Saying</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join hundreds of marketers who've improved their conversion rates with our AI-powered insights
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border bg-white shadow-md">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={18} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="bg-brand-green/20 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                    <Users size={18} className="text-brand-green" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.author}</h4>
                    <p className="text-sm text-gray-500">{testimonial.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
