// Predefined answers database for demonstrating key concepts
const KNOWLEDGE_BASE = [
  {
    keywords: ['photosynthesis', 'photo', 'synthesis', 'sunlight'],
    answer: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water. Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a byproduct.\n\n**Chemical Formula:**\n6CO₂ + 6H₂O + light energy ➔ C₆H₁₂O₆ + 6O₂"
  },
  {
    keywords: ['gravity', 'newton', 'gravitation', 'attract'],
    answer: "Gravity is a fundamental force of attraction that exists between all matter in the universe. It is the force that pulls objects toward Earth's center and keeps planets orbiting the sun.\n\nAccording to Isaac Newton's law of universal gravitation, the force of gravity between two objects is directly proportional to the product of their masses and inversely proportional to the square of the distance between their centers: **F = G * (m1 * m2) / d²**."
  },
  {
    keywords: ['quadratic', 'formula', 'equation', 'solve'],
    answer: "A quadratic equation is of the form **ax² + bx + c = 0**.\n\nTo find the roots (solutions) for x, you use the quadratic formula:\n**x = [-b ± √(b² - 4ac)] / 2a**\n\nThe term inside the square root (**b² - 4ac**) is called the *discriminant*:\n- If > 0, there are 2 real roots.\n- If = 0, there is 1 real root.\n- If < 0, there are 2 complex (imaginary) roots."
  },
  {
    keywords: ['water', 'cycle', 'rain', 'condensation', 'evaporation'],
    answer: "The water cycle (hydrologic cycle) is the continuous movement of water on, above, and below the surface of the Earth.\n\n**Main Stages:**\n1. **Evaporation:** Sunlight heats water in oceans/lakes, turning it into vapor.\n2. **Transpiration:** Plants release water vapor into the air.\n3. **Condensation:** Vapor cools and aggregates into clouds.\n4. **Precipitation:** Clouds release rain, snow, or sleet.\n5. **Collection/Runoff:** Water returns to water bodies or absorbs into soil."
  },
  {
    keywords: ['atom', 'molecule', 'nucleus', 'proton', 'neutron', 'electron'],
    answer: "An atom is the basic building block of chemistry. It is the smallest unit of matter that retains all of the chemical properties of an element.\n\n**Structure of an Atom:**\n- **Nucleus:** The dense center containing **Protons** (positive charge) and **Neutrons** (neutral charge).\n- **Electron Cloud:** The outer orbits containing **Electrons** (negative charge) circulating the nucleus.\n\nWhen atoms bind together, they form **molecules**."
  },
  {
    keywords: ['cell', 'mitochondria', 'nucleus', 'dna', 'organelle'],
    answer: "Cells are the basic structural, functional, and biological units of all known living organisms. A cell is the smallest unit of life.\n\n**Key Organelles:**\n- **Nucleus:** The control center containing genetic material (DNA).\n- **Mitochondria:** The powerhouse of the cell, converting glucose into energy (ATP).\n- **Ribosomes:** Sites of protein synthesis.\n- **Cell Membrane:** Semi-permeable boundary controlling entry and exit."
  }
];

export const getAIAnswer = async (question, subject) => {
  const query = question.toLowerCase();
  
  // Look for a matched keyword in knowledge base
  const match = KNOWLEDGE_BASE.find(item => 
    item.keywords.some(kw => query.includes(kw))
  );

  if (match) {
    return match.answer;
  }

  // Smart educational response template if no direct matches
  return `Thank you for asking about **"${question}"** in the subject of **${subject}**!\n\nHere is a conceptual breakdown to help you understand:\n\n1. **Core Concept:** Researching this topic involves analyzing how its individual components interact. For ${subject}, this usually concerns fundamental theories, formulas, or structures.\n2. **Key Insight:** Always begin by identifying the inputs, actions, and outputs in the problem. Breaking it down into steps will help clarify the solution.\n3. **Next Steps for Study:**\n   - Check your Class textbook chapter on this topic.\n   - Try solving a sample problem or drawing a diagram.\n   - Schedule a quick sync with your ${subject} teacher via the chat portal for detailed support.`;
};
