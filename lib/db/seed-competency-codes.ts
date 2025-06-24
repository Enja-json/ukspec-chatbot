import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { competencyCode } from './schema';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

const competencyCodes = [
  // Category A: Knowledge and understanding
  {
    id: 'A1',
    category: 'A' as const,
    title: 'Have maintained and extended a sound theoretical approach to enable them to develop their particular role',
    description: 'Formal training related to your role, learning and developing new engineering knowledge, understanding current and emerging technology and technical best practice, developing broader and deeper knowledge base through research and experimentation, learning new engineering theories and techniques in the workplace.'
  },
  {
    id: 'A2',
    category: 'A' as const,
    title: 'Are developing technological solutions to unusual or challenging problems, using their knowledge and understanding and/or dealing with complex technical issues or situations with significant levels of risk',
    description: 'Carrying out technical research and development, developing new designs/processes/systems based on new or evolving technology, carrying out complex and/or non-standard technical analyses, developing solutions involving complex or multi-disciplinary technology, developing and evaluating continuous improvement systems, developing solutions in safety-critical industries or applications.'
  },

  // Category B: Design, development and solving engineering problems
  {
    id: 'B1',
    category: 'B' as const,
    title: 'Take an active role in the identification and definition of project requirements, problems and opportunities',
    description: 'Identifying projects or technical improvements to products/processes/systems, preparing specifications taking account of functional and other requirements, establishing user requirements, reviewing specifications and tenders to identify technical issues and potential improvements, carrying out technical risk analysis and identifying mitigation measures, considering and implementing new and emerging technologies.'
  },
  {
    id: 'B2',
    category: 'B' as const,
    title: 'Can identify the appropriate investigations and research needed to undertake the design, development and analysis required to complete an engineering task and conduct these activities effectively',
    description: 'Identifying and agreeing appropriate research methodologies, investigating technical issues and identifying potential solutions, identifying and carrying out physical tests or trials and analysing results, carrying out technical simulations or analysis, preparing, presenting and agreeing design recommendations with appropriate analysis of risk.'
  },
  {
    id: 'B3',
    category: 'B' as const,
    title: 'Can implement engineering tasks and evaluate the effectiveness of engineering solutions',
    description: 'Ensuring that the application of the design results in the appropriate practical outcome, implementing design solutions taking account of critical constraints, identifying and implementing lessons learned, evaluating existing designs or processes and identifying improvements, actively learning from feedback on results.'
  },

  // Category C: Responsibility, management and leadership
  {
    id: 'C1',
    category: 'C' as const,
    title: 'Plan the work and resources needed to enable effective implementation of a significant engineering task or project',
    description: 'Preparing budgets and associated work programmes, systematically reviewing the factors affecting project implementation, carrying out project risk assessments, leading on preparing and agreeing implementation plans, negotiating and agreeing arrangements with stakeholders.'
  },
  {
    id: 'C2',
    category: 'C' as const,
    title: 'Manage (organise, direct and control), programme or schedule, budget and resource elements of a significant engineering task or project',
    description: 'Operating or defining appropriate management systems, managing the balance between quality, cost and time, monitoring progress and associated costs, establishing and maintaining quality standards, interfacing effectively with stakeholders.'
  },
  {
    id: 'C3',
    category: 'C' as const,
    title: 'Lead teams or technical specialisms and assist others to meet changing technical and managerial needs',
    description: 'Agreeing objectives and work plans with teams, reinforcing team commitment to professional standards, leading and supporting team development, assessing team and individual performance, providing specialist knowledge and guidance.'
  },
  {
    id: 'C4',
    category: 'C' as const,
    title: 'Bring about continuous quality improvement and promote best practice',
    description: 'Promoting quality throughout the organisation, developing and maintaining quality standards, supporting project evaluation, implementing and sharing lessons learned.'
  },

  // Category D: Communication and interpersonal skills
  {
    id: 'D1',
    category: 'D' as const,
    title: 'Communicate effectively with others, at all levels, in English',
    description: 'Preparing reports and documentation, leading and chairing meetings, exchanging information and providing advice, engaging with professional networks.'
  },
  {
    id: 'D2',
    category: 'D' as const,
    title: 'Clearly present and discuss proposals, justifications and conclusions',
    description: 'Contributing to scientific papers, preparing and delivering presentations, preparing bids and proposals, leading work towards collective goals.'
  },
  {
    id: 'D3',
    category: 'D' as const,
    title: 'Demonstrate personal and social skills and awareness of diversity and inclusion issues',
    description: 'Managing own emotions and awareness, being confident in changing situations, creating productive working relationships, supporting diversity and inclusion.'
  },

  // Category E: Personal and professional commitment
  {
    id: 'E1',
    category: 'E' as const,
    title: 'Understand and comply with relevant codes of conduct',
    description: 'Demonstrating compliance with professional codes, understanding legislative frameworks, leading work within relevant legislation.'
  },
  {
    id: 'E2',
    category: 'E' as const,
    title: 'Understand the safety implications of their role and manage, apply and improve safe systems of work',
    description: 'Taking responsibility for health and safety, developing risk management systems, applying health and safety legislation.'
  },
  {
    id: 'E3',
    category: 'E' as const,
    title: 'Understand the principles of sustainable development and apply them in their work',
    description: 'Operating responsibly for environmental, social and economic outcomes, enhancing environmental quality, using resources efficiently, minimising environmental impact.'
  },
  {
    id: 'E4',
    category: 'E' as const,
    title: 'Carry out and record CPD necessary to maintain and enhance competence',
    description: 'Undertaking development reviews, planning and carrying out CPD activities, maintaining evidence of development, assisting others with CPD.'
  },
  {
    id: 'E5',
    category: 'E' as const,
    title: 'Understand the ethical issues that may arise in their role and carry out their responsibilities in an ethical manner',
    description: 'Understanding potential ethical issues, applying ethical principles, upholding organisational ethical standards.'
  }
];

export async function seedCompetencyCodes() {
  console.log('Seeding competency codes...');
  
  try {
    // Get all existing competency codes
    const existingCodes = await db.select().from(competencyCode);
    const existingIds = existingCodes.map(code => code.id);
    
    // Define the correct UK-SPEC competency IDs
    const correctCompetencyIds = competencyCodes.map(code => code.id);
    
    console.log('Current competency codes in database:', existingIds);
    console.log('Expected competency codes:', correctCompetencyIds);
    
    // First, update or insert all the correct codes
    for (const code of competencyCodes) {
      await db.insert(competencyCode)
        .values(code)
        .onConflictDoUpdate({
          target: competencyCode.id,
          set: {
            title: code.title,
            description: code.description,
            category: code.category,
          }
        });
    }
    console.log('Updated/inserted all correct competency codes');
    
    // Find codes that shouldn't exist (old codes)
    const invalidCodes = existingIds.filter(id => !correctCompetencyIds.includes(id));
    
    if (invalidCodes.length > 0) {
      console.log('Found invalid competency codes that need to be handled:', invalidCodes);
      
      // For now, just log them - in production you might want to:
      // 1. Migrate existing tasks that reference these codes to valid ones
      // 2. Then delete the invalid codes
      // But for development, we'll leave them to avoid breaking existing data
      console.log('Note: Invalid codes are left in database to preserve existing task references');
      console.log('You may want to manually clean these up after migrating any existing tasks');
    }
    
    console.log(`Successfully seeded ${competencyCodes.length} competency codes`);
  } catch (error) {
    console.error('Error seeding competency codes:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedCompetencyCodes()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
} 