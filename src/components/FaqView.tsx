import React, { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';

interface FaqPageProps {
  onNavigateHome: () => void;
  onNavigateShop: () => void;
}

export const FaqView: React.FC<FaqPageProps> = ({ onNavigateHome, onNavigateShop }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What materials and finishes are used in DRAYEN pieces?',
      a: 'All DRAYEN jewelry is constructed from 316L marine-grade surgical stainless steel and heavy solid casts with hand-applied antique oxidation patinas. Our premium runs utilize genuine .925 sterling silver hallmarked components. They are 100% nickel-free, lead-free, and hypoallergenic.',
    },
    {
      q: 'Will these chains turn my skin green or tarnish over time?',
      a: 'Never. Our 316L surgical stainless steel and treated sterling silver do not oxidize, rust, or leave green discoloration on skin, even with direct exposure to sweat, salt water, or daily showers. The antiqued dark highlights are permanently sealed.',
    },
    {
      q: 'What chain lengths are provided with pendants?',
      a: 'Most of our statement pendants come paired with an adjustable 20-inch to 24-inch (50cm – 60cm) heavy wheat or curb chain, designed to sit naturally on the chest over crewnecks and oversized hoodies. Exact millimetre specs and chain thickness are specified on each piece\'s detail view.',
    },
    {
      q: 'How should I care for and clean my gothic jewelry?',
      a: 'Simply rinse with lukewarm water and mild soap, then wipe dry with a microfiber cloth. Avoid harsh chemical dips or ultrasonic jewelry cleaners, as these can strip the intended vintage patina in the recessed engravings.',
    },
    {
      q: 'What are the delivery timelines across India?',
      a: 'Metro orders are dispatched within 24 hours and typically arrive within 2 to 4 business days via priority BlueDart air cargo. Regional destinations take 4 to 6 business days. Full tracking details are emailed and WhatsApp messaged instantly upon dispatch.',
    },
    {
      q: 'What is your exchange and return policy?',
      a: 'We offer a hassle-free 7-day replacement guarantee if your piece arrives damaged or does not match your expectations. Items must remain unworn in original matte obsidian drawer box packaging.',
    },
    {
      q: 'What payment methods do you support?',
      a: 'We support instant direct UPI transfer (Google Pay, PhonePe, Paytm, CRED, BHIM), RuPay, debit/credit cards, and Cash on Delivery (COD) with verification across all major Indian pin codes.',
    },
    {
      q: 'Can I track my consignment after placing an order?',
      a: 'Yes. Every order is issued an authoritative Order Reference Number (e.g. DRY-2026-XXXX). You can enter this into our "Track Order" portal anytime to view live courier tracking and delivery milestones.',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-[#F0ECE5] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-[#202020] pb-6">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#888888] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sanctuary</span>
          </button>
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#8B0000] font-bold">
            Atelier Curatorial Guide
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="font-serif text-3xl sm:text-5xl text-white tracking-[0.2em] uppercase font-bold blood-glow-text">
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <div className="subtle-blood-divider">
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] text-[#888888]">
              METALS • SIZING • LOGISTICS • CARE
            </span>
          </div>
          <p className="font-mono text-xs text-[#777777] max-w-lg mx-auto pt-2 leading-relaxed">
            Essential protocols governing DRAYEN jewelry craftsmanship, skin tolerance guarantees, and pan-India dispatches.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3 pt-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-[#0a0a0a] border border-[#1e1e1e] hover:border-[#333333] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-6 flex items-center justify-between text-left focus:outline-none cursor-pointer"
                >
                  <span className="font-serif text-base sm:text-lg text-[#F0ECE5] tracking-wide pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#888888] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-[#8B0000]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-2 text-[#a3a3a3] font-mono text-xs sm:text-sm leading-relaxed border-t border-[#1a1a1a]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Contact Banner */}
        <div className="p-8 bg-[#0a0a0a] border border-[#222222] text-center space-y-4">
          <h3 className="font-serif text-xl text-white uppercase tracking-wider">
            Have a Bespoke Inquiry?
          </h3>
          <p className="font-mono text-xs text-[#777777] max-w-md mx-auto">
            Our atelier curators are available via email at <span className="text-white">concierge@drayen.in</span> or WhatsApp Concierge.
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigateShop}
              className="px-8 py-3.5 bg-white hover:bg-[#8B0000] text-black hover:text-white font-mono text-xs uppercase tracking-[0.25em] font-bold transition-all shadow-lg hover:shadow-[0_0_20px_rgba(139,0,0,0.6)] cursor-pointer"
            >
              EXPLORE ARCHIVE
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

