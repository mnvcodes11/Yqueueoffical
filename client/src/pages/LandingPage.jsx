import React from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiShield, FiSmartphone, FiBarChart2, FiArrowRight, FiStar, FiChevronRight, FiCheckCircle, FiZap, FiLayers, FiTrendingUp } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import AnimatedSection from '../components/AnimatedSection';

const features = [
  { icon: FiClock, title: 'Queue-Free Ordering', desc: 'Pre-order from anywhere and collect when your meal is ready.' },
  { icon: FiShield, title: 'Secure Verification', desc: 'Every pickup is validated on the backend before a meal is released.' },
  { icon: FiSmartphone, title: 'Instant QR Pickup', desc: 'A modern, single-use QR flow that feels premium at the counter.' },
  { icon: FiBarChart2, title: 'Live Staff Ops', desc: 'Workers and admins see every handoff in real time.' },
];

const stats = [
  { value: '24/7', label: 'Campus-ready access' },
  { value: '99.9%', label: 'Operational confidence' },
  { value: '3x', label: 'Faster pickup flow' },
];

const testimonials = [
  { quote: 'It feels like a real food-tech product, not a school project.', name: 'Aadit, Student Lead' },
  { quote: 'The queue flow is so smooth that the whole counter feels calmer.', name: 'Riya, Canteen Manager' },
];

const faqItems = [
  { question: 'Does it work for both students and staff?', answer: 'Yes. Students order and pickup, while workers manage the queue from the same live system.' },
  { question: 'Is the payment flow secure?', answer: 'Payments are verified on the backend before a pickup QR is released.' },
  { question: 'Can it scale to busy campus rush hours?', answer: 'The architecture is built around real-time updates and queue snapshots for live operations.' },
];

const spotlightPoints = [
  { icon: FiZap, title: 'Pulse-fast ordering', desc: 'Launch orders in seconds with a premium, almost frictionless UX.' },
  { icon: FiLayers, title: 'Command-center ops', desc: 'Workers and admins keep every handoff under control in real time.' },
  { icon: FiTrendingUp, title: 'Built to scale', desc: 'A system tuned for busy rushes and high-volume campus days.' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent text-slate-100">
      <Navbar />

      <main>
        <section className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center gap-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="particle-field absolute inset-0" />
            <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
            <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="hero-lens absolute inset-x-0 top-10 mx-auto h-[28rem] w-[28rem] rounded-full border border-primary-400/20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_35%)]" />
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <AnimatedSection className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-400/30 bg-primary-500/10 px-3 py-1 text-sm font-medium text-primary-200"
              >
                <FiStar size={14} /> Premium campus pickup experience
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                The fastest way to turn campus hunger into a premium experience.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="mt-5 text-lg leading-8 text-slate-300"
              >
                YQueue brings the speed of modern food tech to university canteens with live queue updates, secure payment verification, and a pickup flow that feels built for scale.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link to="/signup" className="btn-primary px-6 py-3 text-base">Get Started as Student</Link>
                <Link to="/worker/login" className="btn-secondary px-6 py-3 text-base">Worker Portal</Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-400"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2"><FiCheckCircle size={14} /> Zero-friction ordering</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2"><FiCheckCircle size={14} /> Live queue intelligence</span>
              </motion.div>
            </AnimatedSection>

            <AnimatedSection delay={0.1} className="card p-6 sm:p-8">
              <motion.div
                initial={{ opacity: 0, y: 22, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="hero-sheen rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary-600/20 via-slate-900/80 to-cyan-500/20 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-300">Live order flow</p>
                    <p className="mt-2 text-2xl font-semibold text-white">Payment Verified</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-300">Ready</div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[{ label: 'Queue number', value: 'A12' }, { label: 'Estimated wait', value: '8 min' }, { label: 'Pickup status', value: 'QR verified' }, { label: 'Crowd load', value: 'High' }].map((item) => (
                    <div key={item.label} className="hero-card-float rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm">
                      <span className="block text-slate-300">{item.label}</span>
                      <span className="mt-1 block font-semibold text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                  <span>Pickup confidence</span>
                  <span className="font-semibold text-primary-200">98% instant handoff</span>
                </div>
              </motion.div>
            </AnimatedSection>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-panel p-5">
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <AnimatedSection className="border-t border-white/10 bg-slate-900/60">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Why teams love YQueue</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Built for modern, high-volume campus canteens.</h2>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-300">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-primary-950/70 via-slate-900 to-cyan-950/70 p-8 lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_38%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Why it feels next-gen</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Built for the speed, pressure, and polish of a real food-tech launch.</h2>
                <p className="mt-4 text-slate-400">Every interaction is tuned to feel fast, calm, and premium — even during the busiest campus rush.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {spotlightPoints.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-[1.4rem] border border-white/10 bg-slate-950/60 p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-200">
                      <Icon size={18} />
                    </div>
                    <h3 className="mt-3 font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-primary-950/70 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">How it works</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">From cart to pickup in a few elegant steps.</h2>
              <p className="mt-4 text-slate-400">Students browse, pay, and walk in with confidence. Workers prepare orders and verify pickup securely using one touch-friendly QR experience.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {['Pick your meal', 'Pay securely', 'Scan and collect'].map((step, index) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/10 p-4 transition hover:-translate-y-1 hover:border-primary-400/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/15 text-sm font-semibold text-primary-200">0{index + 1}</div>
                  <p className="mt-4 font-medium text-white">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="card p-8">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Loved by teams</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">A product experience that feels premium from first click.</h3>
              <div className="mt-6 space-y-4">
                {testimonials.map((item) => (
                  <div key={item.name} className="rounded-[1.25rem] border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-slate-300">“{item.quote}”</p>
                    <p className="mt-2 text-sm font-medium text-primary-200">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-8">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">FAQ</p>
              <div className="mt-4 space-y-3">
                {faqItems.map((item) => (
                  <div key={item.question} className="rounded-[1.25rem] border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{item.question}</p>
                      <FiChevronRight className="text-slate-400" size={16} />
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </main>

      <AnimatedSection className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-primary-400/20 bg-gradient-to-r from-primary-600/25 via-slate-900/90 to-cyan-500/25 p-8 lg:p-10">
          <div className="absolute -right-8 top-0 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Ready for launch</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Make every pickup feel like a flagship experience.</h2>
              <p className="mt-4 text-slate-400">Bring the speed, trust, and polish of modern food-tech to your campus in one place.</p>
            </div>
            <Link to="/signup" className="btn-primary px-6 py-3 text-base">Launch YQueue</Link>
          </div>
        </div>
      </AnimatedSection>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} YQueue. Designed for premium campus experiences.
      </footer>
    </div>
  );
};

export default LandingPage;
