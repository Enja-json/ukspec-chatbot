import { motion } from 'framer-motion';

interface GreetingProps {
  selectedChatModel: string;
}

export const Greeting = ({ selectedChatModel }: GreetingProps) => {
  // Define greetings for each model
  const greetings = {
    'mini-mentor-model': {
      title: 'Hello there!',
      subtitle: 'Ready to advance your engineering career?'
    },
    'uk-spec-competency-model': {
      title: 'Welcome!',
      subtitle: 'Let\'s analyse your work against UK-SPEC competencies.'
    },
    // Fallback for any other models
    default: {
      title: 'Hello there!',
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
