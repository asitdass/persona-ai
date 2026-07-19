import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl">PersonaAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 sm:py-32">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900">
              Your AI representative,{' '}
              <span className="text-indigo-600">available 24/7</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Create a personalized AI assistant that understands your work, projects, and experience.
              Embed it on your portfolio and let visitors ask questions naturally.
            </p>
            <div className="mt-10 flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="text-base">
                  Create Your AI Assistant
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="text-base">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Upload Your Knowledge',
                  description: 'Add your resume, project docs, blogs, certificates — anything that represents your professional work.',
                },
                {
                  step: '2',
                  title: 'Customize Your Assistant',
                  description: 'Set the personality, greeting, theme, and suggested questions for your AI representative.',
                },
                {
                  step: '3',
                  title: 'Embed & Go Live',
                  description: 'Copy one line of code, paste it into your portfolio. Your AI assistant is now live for visitors.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-indigo-600 font-bold text-lg">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Instead of reading, let them ask.
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Recruiters spend less than a minute reviewing candidates. Your AI assistant answers
              their questions instantly using your verified knowledge.
            </p>
            <div className="bg-white rounded-xl border p-6 max-w-lg mx-auto text-left space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex-shrink-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-indigo-700">AI</span>
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <p className="text-sm text-gray-800">
                    Hi! I&apos;m Alex&apos;s AI assistant. Ask me anything about Alex&apos;s work and experience.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <div className="bg-indigo-600 rounded-lg px-4 py-2">
                  <p className="text-sm text-white">What backend technologies does Alex know?</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex-shrink-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-indigo-700">AI</span>
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <p className="text-sm text-gray-800">
                    Alex is proficient in Node.js, NestJS, PostgreSQL, Redis, Docker, AWS, and Go. He has 4+ years of experience building scalable backend systems.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} PersonaAI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
