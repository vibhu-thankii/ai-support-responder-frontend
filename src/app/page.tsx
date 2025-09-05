"use client"
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Bot, BookOpen, Users, Mail, BarChart, Zap, ArrowRight, Check, Menu, X, Globe, Shield, Star, MessageSquare } from 'lucide-react';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast AI",
      description: "Generate intelligent responses in milliseconds with cutting-edge AI models.",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Bot className="h-6 w-6" />,
      title: "Multi-Provider Support",
      description: "Connect OpenAI, Google, Anthropic, and more for ultimate flexibility.",
      gradient: "from-purple-400 to-pink-500"
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Smart Knowledge Base",
      description: "AI learns from your docs to provide accurate, contextual answers.",
      gradient: "from-blue-400 to-cyan-500"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Collaboration",
      description: "Work seamlessly together with role-based access and shared inbox.",
      gradient: "from-green-400 to-teal-500"
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email Integration",
      description: "Auto-sync with your support inbox, no forwarding needed.",
      gradient: "from-red-400 to-pink-500"
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: "Advanced Analytics",
      description: "Track metrics and optimize your support performance.",
      gradient: "from-indigo-400 to-purple-500"
    }
  ];

  const stats = [
    { value: "10x", label: "Faster Response Time" },
    { value: "95%", label: "Customer Satisfaction" },
    { value: "60%", label: "Cost Reduction" },
    { value: "24/7", label: "Always Available" }
  ];

  const testimonials = [
    {
      quote: "Responder AI transformed our support operations. We're handling 3x more queries with half the team.",
      author: "Sarah Chen",
      role: "Head of Support, TechCorp",
      rating: 5
    },
    {
      quote: "The AI drafts are incredibly accurate. It's like having a senior agent available 24/7.",
      author: "Mike Rodriguez",
      role: "Customer Success Manager, StartupXYZ",
      rating: 5
    },
    {
      quote: "Setup was a breeze, and the ROI was immediate. Best investment we've made this year.",
      author: "Emily Watson",
      role: "Operations Director, ScaleUp Inc",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$49",
      description: "Perfect for small teams",
      features: ["Up to 500 queries/month", "3 team members", "Email integration", "Basic analytics", "Community support"],
      highlighted: false
    },
    {
      name: "Professional",
      price: "$199",
      description: "For growing businesses",
      features: ["Up to 5,000 queries/month", "10 team members", "All integrations", "Advanced analytics", "Priority support", "Custom AI training"],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: ["Unlimited queries", "Unlimited team members", "White-label options", "Dedicated account manager", "SLA guarantee", "Custom integrations"],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'backdrop-blur-xl bg-slate-900/80 border-b border-slate-800' : ''}`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <Sparkles className="h-8 w-8 text-cyan-400" />
                <div className="absolute inset-0 h-8 w-8 bg-cyan-400 blur-xl opacity-50"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Responder AI
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
              <a href="#testimonials" className="text-slate-300 hover:text-white transition-colors">Testimonials</a>
              <Button asChild className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105">
                <Link href="/login">Get Started Free</Link>
              </Button>
            </nav>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-white p-2">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-20 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
              <a href="#features" onClick={()=>setIsMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" onClick={()=>setIsMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" onClick={()=>setIsMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors">Pricing</a>
              <a href="#testimonials" onClick={()=>setIsMenuOpen(false)} className="text-slate-300 hover:text-white transition-colors">Testimonials</a>
              <Button asChild className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-semibold">
                <Link href="/login">Get Started Free</Link>
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-purple-300">Trusted by 10,000+ support teams worldwide</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Transform Support with
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                Next-Gen AI
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Deliver exceptional customer experiences at scale. Our AI drafts perfect responses in seconds, powered by your knowledge base.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                <Link href="/login">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300">
                Watch Demo
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Everything you need to deliver world-class customer support
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-cyan-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Get up and running in minutes, not months
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 relative">
            {/* Connection Lines */}
            <div className="hidden lg:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 -translate-y-1/2"></div>
            
            {[
              { step: "01", title: "Connect & Import", description: "Link your support channels and import your knowledge base in seconds", icon: <Globe className="h-8 w-8" /> },
              { step: "02", title: "Train Your AI", description: "Our AI learns from your content to understand your unique business context", icon: <Bot className="h-8 w-8" /> },
              { step: "03", title: "Start Responding", description: "Generate perfect responses instantly and watch your efficiency soar", icon: <MessageSquare className="h-8 w-8" /> }
            ].map((item, index) => (
              <div key={index} className="relative z-10">
                <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300 text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400/20 to-purple-400/20 bg-clip-text text-transparent mb-4">
                    {item.step}
                  </div>
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Loved by Support Teams
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Join thousands of teams already transforming their support
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative h-64 lg:h-48">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-500 ${
                    index === activeTestimonial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                  }`}
                >
                  <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-8 h-full flex flex-col justify-center">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-lg lg:text-xl text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"></div>
                      <div>
                        <div className="font-semibold">{testimonial.author}</div>
                        <div className="text-sm text-slate-400">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === activeTestimonial ? 'w-8 bg-gradient-to-r from-cyan-400 to-purple-400' : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Start free, scale as you grow
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border-2 border-purple-400'
                    : 'bg-gradient-to-br from-white/5 to-white/0 border border-white/10'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-slate-400 mb-6">{plan.description}</p>
                <div className="text-4xl font-bold mb-6">
                  {plan.price}
                  {plan.price !== "Custom" && <span className="text-lg text-slate-400">/month</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className={`w-full py-3 rounded-full font-semibold transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:shadow-lg hover:shadow-purple-500/25'
                    : 'bg-white/10 hover:bg-white/20'
                }`}>
                   <Link href="/login">{plan.price === "Custom" ? "Contact Sales" : "Get Started"}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl"></div>
            <div className="relative p-12 lg:p-16 text-center">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Ready to 10x Your Support?
              </h2>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Join thousands of teams delivering exceptional support with AI. Start your free trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <Button size="lg" asChild className="group px-8 py-4 bg-white text-slate-900 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                    <Link href="/login">
                      Start Free Trial
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </Button>
                <Button size="lg" variant="outline" className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300">
                    Book a Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 lg:px-8 border-t border-white/10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-6 w-6 text-cyan-400" />
                <span className="text-xl font-bold">Responder AI</span>
              </div>
              <p className="text-slate-400 text-sm">
                Transforming customer support with next-generation AI technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © 2024 Responder AI. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Shield className="h-5 w-5 text-slate-400" />
              <Globe className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

