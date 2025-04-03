
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Check, Cloud, LineChart, Upload, Users, Zap } from "lucide-react";

const Hero = () => (
  <section className="w-full py-12 md:py-24 lg:py-32 hero-gradient">
    <div className="container px-4 md:px-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
        <div className="space-y-4">
          <div className="inline-block rounded-lg bg-leaf-100 px-3 py-1 text-sm text-leaf-800">
            Introducing MaizeSense AI
          </div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
            AI-Powered Maize Crop Management
          </h1>
          <p className="max-w-[600px] text-muted-foreground md:text-xl">
            Revolutionize your farming practices with our AI-powered platform. Detect diseases, get weather-based recommendations, and chat with our AI assistant.
          </p>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button asChild size="lg" className="bg-leaf-700 hover:bg-leaf-800 text-white">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <img 
            src="https://images.unsplash.com/photo-1628352081506-83c43123ed6d?q=80&w=2000&auto=format&fit=crop" 
            alt="Healthy maize crop field" 
            className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
            width={500}
            height={310}
          />
        </div>
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
  <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
    <div className="container px-4 md:px-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="space-y-2">
          <div className="inline-block rounded-lg bg-maize-100 px-3 py-1 text-sm text-maize-800">
            Simple Process
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Get started with MaizeSense AI in just a few simple steps
          </p>
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
        <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf-100 text-leaf-900">
            <Upload className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">Upload Photos</h3>
          <p className="text-muted-foreground text-center">
            Take pictures of your maize crops and upload them to our platform
          </p>
        </div>
        <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-maize-100 text-maize-900">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">AI Analysis</h3>
          <p className="text-muted-foreground text-center">
            Our AI analyzes your images and provides disease detection and recommendations
          </p>
        </div>
        <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soil-100 text-soil-900">
            <LineChart className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">Get Results</h3>
          <p className="text-muted-foreground text-center">
            Receive detailed reports and actionable insights to improve your crops
          </p>
        </div>
      </div>
    </div>
  </section>
);

const Features = () => (
  <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
    <div className="container px-4 md:px-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="space-y-2">
          <div className="inline-block rounded-lg bg-leaf-100 px-3 py-1 text-sm text-leaf-800">
            Key Features
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Everything You Need</h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Comprehensive tools designed specifically for maize farmers
          </p>
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 py-12">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>AI Disease Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Upload images of your maize plants for instant disease detection with recommendations for treatment.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Cloud className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Weather Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Get customized farming recommendations based on real-time weather data for your specific location.
            </CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>AI Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Chat with our AI assistant for instant answers to all your maize farming questions in multiple languages.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

const Testimonials = () => (
  <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
    <div className="container px-4 md:px-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="space-y-2">
          <div className="inline-block rounded-lg bg-maize-100 px-3 py-1 text-sm text-maize-800">
            Testimonials
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">What Farmers Say</h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Read about the experiences of farmers using MaizeSense AI
          </p>
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 py-12">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">JA</div>
            <div>
              <h4 className="text-lg font-bold">John Adeyemi</h4>
              <p className="text-sm text-muted-foreground">Farmer, Nigeria</p>
            </div>
          </div>
          <p className="mt-4">
            "I detected a disease in my maize farm early using this app and saved my entire harvest. The recommendations were spot on!"
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">SO</div>
            <div>
              <h4 className="text-lg font-bold">Sarah Okafor</h4>
              <p className="text-sm text-muted-foreground">Farmer, Ghana</p>
            </div>
          </div>
          <p className="mt-4">
            "The weather-based recommendations helped me adjust my irrigation schedule, resulting in better yields and water conservation."
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">DK</div>
            <div>
              <h4 className="text-lg font-bold">David Kwame</h4>
              <p className="text-sm text-muted-foreground">Farmer, Kenya</p>
            </div>
          </div>
          <p className="mt-4">
            "Being able to chat with the AI assistant in my native language has been incredibly helpful for getting quick farming advice."
          </p>
        </div>
      </div>
    </div>
  </section>
);

const CallToAction = () => (
  <section className="w-full py-12 md:py-24 lg:py-32 hero-gradient">
    <div className="container px-4 md:px-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Transform Your Farming?</h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Join thousands of farmers who are already improving their yields with MaizeSense AI
          </p>
        </div>
        <div className="flex flex-col gap-2 min-[400px]:flex-row">
          <Button asChild size="lg" className="bg-leaf-700 hover:bg-leaf-800 text-white">
            <Link to="/signup">Get Started for Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-muted py-6 md:py-12">
    <div className="container px-4 md:px-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <h3 className="text-lg font-bold">MaizeSense AI</h3>
          <p className="text-sm text-muted-foreground">
            AI-powered platform for maize crop management to help farmers improve yields and reduce losses.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Features</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#" className="hover:text-foreground">Disease Detection</a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground">Weather Insights</a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground">AI Assistant</a>
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Resources</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#" className="hover:text-foreground">Blog</a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground">Knowledge Base</a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground">Community</a>
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Company</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#" className="hover:text-foreground">About</a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground">Contact</a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} MaizeSense AI. All rights reserved.
      </div>
    </div>
  </footer>
);

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-background z-40">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/placeholder.svg" alt="MaizeSense AI" className="h-8 w-8" />
            <span className="text-xl font-bold">MaizeSense AI</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link to="/" className="text-sm font-medium hover:text-primary">
              Home
            </Link>
            <Link to="#" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link to="#" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <Link to="#" className="text-sm font-medium hover:text-primary">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-leaf-700 hover:bg-leaf-800 text-white">
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <Testimonials />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
