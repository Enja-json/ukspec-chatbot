import { motion } from 'framer-motion';
import type { Session } from 'next-auth';

interface GreetingProps {
  selectedChatModel: string;
  session?: Session;
}

export const Greeting = ({ selectedChatModel, session }: GreetingProps) => {
  // Extract first name from user's full name
  const firstName = session?.user?.name?.split(' ')[0] || '';
  
  // Define greetings for each model
  const greetings = {
    'mini-mentor-model': {
      title: firstName ? `Hello ${firstName}!` : 'Hello there!',
      subtitle: 'Ready to advance your engineering career?'
    },
    'uk-spec-competency-model': {
      title: firstName ? `Welcome ${firstName}!` : 'Welcome!',
      subtitle: 'Let\'s analyse your work against UK-SPEC competencies.'
    },
    // Fallback for any other models
    default: {
      title: firstName ? `Hello ${firstName}!` : 'Hello there!',
      subtitle: 'How can I help you today?'
    }
  };

  const currentGreeting = greetings[selectedChatModel as keyof typeof greetings] || greetings.default;

  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        {currentGreeting.title}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-zinc-500"
      >
        {currentGreeting.subtitle}
      </motion.div>
    </div>
  );
};
