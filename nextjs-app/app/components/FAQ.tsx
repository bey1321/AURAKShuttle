import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is the AURAK Shuttle Tracker?",
    answer:
      "The AURAK Shuttle Tracker is a real-time tracking system that allows students to see the live location of campus shuttles, estimated arrival times, routes, and shuttle status directly from their phones or laptops."
  },
  {
    question: "How does the shuttle tracking work?",
    answer:
      "Each shuttle is equipped with a GPS device. The device sends real-time location updates to the server, which are then displayed on the app using a live interactive map."
  },
  {
    question: "Do I need to log in to use the tracker?",
    answer:
      "Students and staff may log in for extra features such as personalized stops, notifications, and shuttle riding history. Basic tracking may be available without logging in depending on configuration."
  },
  {
    question: "How accurate is the shuttle arrival time?",
    answer:
      "Arrival times are estimated based on real-time GPS coordinates, shuttle speed, and route traffic. The ETA updates dynamically and is usually accurate within 10–30 seconds."
  },
  {
    question: "What should I do if a shuttle is delayed?",
    answer:
      "Delays may happen due to traffic or route changes. The app will show a 'Delayed' label when the system detects irregular movement. You can also check announcements for official updates."
  },
  {
    question: "Can drivers or admins use the app?",
    answer:
      "Yes. Drivers have a dedicated interface for starting trips and sending location updates. Admins have a dashboard to monitor all shuttles, routes, drivers, and system status."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-black mb-8">FAQ</h1>

      <div className="space-y-4">
        {faqData.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md cursor-pointer border border-gray-100"
            onClick={() => toggleFAQ(index)}
          >
            <div className="flex justify-between items-center p-4">
              <h2 className="font-semibold text-lg">{item.question}</h2>
              {openIndex === index ? (
                <ChevronUp className="text-red-500" />
              ) : (
                <ChevronDown className="text-red-500" />
              )}
            </div>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="px-4 pb-4 text-gray-600"
                >
                  {item.answer}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
