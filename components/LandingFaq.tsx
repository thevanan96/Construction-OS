'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FaqItem = {
    question: string;
    answer: string;
};

export function LandingFaq({ items }: { items: FaqItem[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="landing-faq">
            {items.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                    <div key={item.question} className={`landing-faq-item ${isOpen ? 'open' : ''}`}>
                        <button
                            type="button"
                            className="landing-faq-question"
                            aria-expanded={isOpen}
                            onClick={() => setOpenIndex(isOpen ? null : index)}
                        >
                            <span>{item.question}</span>
                            <ChevronDown size={18} className="landing-faq-chevron" />
                        </button>
                        {isOpen && <p className="landing-faq-answer">{item.answer}</p>}
                    </div>
                );
            })}
        </div>
    );
}
