// Pre-chat structured questions per appliance category.
// Answers feed into the AI as context for the first reply so it can skip
// generic questions and jump to a relevant diagnosis quickly.

export const INTAKE_QUESTIONS = {
  water_heater: [
    {
      id: 'type',
      question: 'What type of water heater is it?',
      options: ['Gas', 'Electric', 'Tankless', 'Not sure'],
    },
    {
      id: 'age',
      question: 'How old is it?',
      options: ['Under 5 years', '5–10 years', '10–15 years', '15+ years', 'Not sure'],
    },
    {
      id: 'symptom',
      question: "What's the main issue?",
      options: [
        'No hot water at all',
        'Not enough hot water',
        'Water is too hot',
        'Leaking',
        'Strange noises',
        'Rusty / dirty water',
        'Other',
      ],
    },
  ],

  hvac: [
    {
      id: 'type',
      question: 'What kind of system is it?',
      options: ['Central AC', 'Heat pump', 'Mini-split', 'Window unit', 'Furnace', 'Not sure'],
    },
    {
      id: 'symptom',
      question: "What's happening?",
      options: [
        'Not cooling enough',
        'Not heating',
        'Weak airflow',
        'Strange noise',
        'Strange smell',
        'Outdoor / indoor coil frozen',
        'High energy bills',
        'Other',
      ],
    },
    {
      id: 'filter',
      question: 'When did you last change the air filter?',
      options: ['<1 month ago', '1–3 months ago', '3–6 months ago', '6+ months ago', "Don't know"],
    },
  ],

  dishwasher: [
    {
      id: 'symptom',
      question: "What's the issue?",
      options: [
        'Not draining',
        'Not cleaning well',
        'Leaking',
        "Won't start",
        'Strange noise',
        'Error code on display',
        'Other',
      ],
    },
    {
      id: 'brand',
      question: "What's the brand?",
      options: ['Whirlpool', 'Bosch', 'KitchenAid', 'GE', 'Samsung', 'LG', 'Other', 'Not sure'],
    },
    {
      id: 'age',
      question: 'How old is it?',
      options: ['Under 5 years', '5–10 years', '10+ years', 'Not sure'],
    },
  ],

  refrigerator: [
    {
      id: 'type',
      question: 'What type of fridge?',
      options: ['French door', 'Top freezer', 'Bottom freezer', 'Side-by-side', 'Mini fridge', 'Other'],
    },
    {
      id: 'symptom',
      question: "What's going on?",
      options: [
        'Not cooling enough',
        'Too cold / freezing food',
        'Leaking water',
        'Ice maker not working',
        'Strange noise',
        'Running constantly',
        'Other',
      ],
    },
    {
      id: 'age',
      question: 'How old is it?',
      options: ['Under 5 years', '5–10 years', '10–15 years', '15+ years', 'Not sure'],
    },
  ],

  washer_dryer: [
    {
      id: 'unit',
      question: 'Which unit is having issues?',
      options: ['Washer', 'Dryer', 'Both'],
    },
    {
      id: 'type',
      question: 'Top load or front load?',
      options: ['Top load', 'Front load', 'Not sure'],
    },
    {
      id: 'symptom',
      question: "What's the issue?",
      options: [
        'Not draining (washer)',
        "Won't spin (washer)",
        'Leaking',
        'Vibrating / shaking',
        'Not heating (dryer)',
        'Not tumbling (dryer)',
        'Taking forever to dry',
        'Strange noise / smell',
        'Other',
      ],
    },
  ],

  oven: [
    {
      id: 'type',
      question: 'Gas or electric?',
      options: ['Gas', 'Electric', 'Dual fuel', 'Not sure'],
    },
    {
      id: 'symptom',
      question: "What's wrong?",
      options: [
        'Not heating at all',
        'Heats unevenly',
        'Wrong temperature',
        "Won't ignite (gas)",
        'Self-clean failed',
        'Burner not working',
        'Error code on display',
        'Other',
      ],
    },
    {
      id: 'age',
      question: 'How old is it?',
      options: ['Under 5 years', '5–10 years', '10+ years', 'Not sure'],
    },
  ],
};

// Build a clean human-readable summary like "Gas · 5–10 years · No hot water"
export function buildIntakeSummary(answers) {
  if (!answers) return null;
  const parts = Object.values(answers).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(' · ');
}

// Build the structured context message to send to the AI
export function buildContextMessage(categoryName, answers) {
  const summary = buildIntakeSummary(answers);
  if (!summary) return null;
  return `Here's my situation: ${categoryName} — ${summary}. Help me figure out what's wrong.`;
}
