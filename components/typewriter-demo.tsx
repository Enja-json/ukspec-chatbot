'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// Simple markdown renderer for basic formatting
function renderMarkdown(text: string) {
  const parts = [];
  let currentIndex = 0;
  let key = 0;
  
  // Find **bold** patterns
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the bold part
    if (match.index > currentIndex) {
      parts.push(
        <span key={key++}>
          {text.slice(currentIndex, match.index)}
        </span>
      );
    }
    
    // Add the bold part
    parts.push(
      <strong key={key++} className="font-semibold">
        {match[1]}
      </strong>
    );
    
    currentIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (currentIndex < text.length) {
    parts.push(
      <span key={key++}>
        {text.slice(currentIndex)}
      </span>
    );
  }
  
  return parts.length > 0 ? parts : text;
}

interface Message {
  type: 'user' | 'ai';
  text: string;
}

interface Conversation {
  id: string;
  messages: Message[];
}

const conversations: Conversation[] = [
  {
    id: 'competency1',
    messages: [
      { type: 'user', text: 'I led a team to redesign our offshore wind turbine foundation system, improving installation efficiency by 25%. Which UKSPEC competencies does this demonstrate?' },
      { type: 'ai', text: 'Brilliant work! This demonstrates several key competencies:\n\n• **C1 & C2** (95% confidence) - Planning and managing a significant engineering project\n• **C3** (90% confidence) - Leading teams to meet technical objectives\n• **B2** (85% confidence) - Implementing engineering solutions with measurable improvements\n• **E3** (80% confidence) - Applying sustainable development principles in renewable energy\n\nThe 25% efficiency improvement shows excellent evidence of technical leadership and project management for your chartership application.' },
    ],
  },
  {
    id: 'career-guidance',
    messages: [
      { type: 'user', text: 'I\'m a graduate engineer with 2 years experience. What should I focus on next to strengthen my chartership application?' },
      { type: 'ai', text: 'Great question! At 2 years in, here\'s your strategic roadmap:\n\n**Immediate priorities:**\n• Seek leadership opportunities - even small project roles count\n• Document everything you do with measurable outcomes\n• Find a chartered mentor in your field\n• Start identifying gaps in the 5 competency areas\n\n**Focus areas for year 3-4:**\n• Target management responsibilities (C competencies)\n• Engage in professional development activities\n• Contribute to technical improvements with quantifiable results\n• Build your communication and presentation skills\n\nI can help you map your current work to UKSPEC competencies and create a personalised development plan. What area would you like to strengthen first?' },
    ],
  },
  {
    id: 'mentoring-support',
    messages: [
      { type: 'user', text: 'I\'m struggling with imposter syndrome as I approach my chartership review. How do I build confidence in my achievements?' },
      { type: 'ai', text: 'This is completely normal - many excellent engineers feel this way! Let\'s reframe your mindset:\n\n**Remember:**\n• You wouldn\'t have reached this stage without genuine competence\n• Chartered status recognises your *existing* abilities, not perfection\n• Your experiences matter more than you think\n\n**Confidence-building steps:**\n• List 3 problems you\'ve solved that others couldn\'t\n• Quantify your impact - even small improvements add up\n• Practice articulating your value clearly and concisely\n• Connect with other chartered engineers - you\'ll see you belong\n\n**Before your review:**\n• Mock interviews with colleagues help enormously\n• Prepare specific examples showing competency development\n• Remember: the reviewers want you to succeed\n\nYou\'ve got this! Your journey to this point proves your engineering capability. Need help practicing your presentation or reviewing specific examples?' },
    ],
  },
  {
    id: 'competency4',
    messages: [
      { type: 'user', text: 'I conducted risk assessments for a new bridge design and presented findings to stakeholders. What UKSPEC evidence is this?' },
      { type: 'ai', text: 'Strong technical and communication evidence:\n\n• **B1** (95% confidence) - Identifying project requirements and conducting risk analysis\n• **D2** (90% confidence) - Presenting proposals and justifications clearly\n• **C1** (85% confidence) - Planning work and assessing project risks\n• **E1** (85% confidence) - Complying with relevant codes and safety standards\n• **A2** (80% confidence) - Dealing with complex technical issues with significant risk levels\n\nYour risk assessment and stakeholder presentation work provides excellent evidence across multiple competency areas.' },
    ],
  },
];

export function TypewriterDemo() {
  const [currentConversationIndex, setCurrentConversationIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');

  const currentConversation = conversations[currentConversationIndex];
  const currentMessage = currentConversation?.messages[currentMessageIndex];

  useEffect(() => {
    if (!currentMessage) return;

    // Typing animation
    if (currentText.length < currentMessage.text.length) {
      const timer = setTimeout(() => {
        const nextChar = currentMessage.text[currentText.length];
        
        // If we're starting a markdown pattern, type the whole pattern quickly
        if (nextChar === '*' && currentMessage.text[currentText.length + 1] === '*') {
          // Find the end of this bold pattern
          const remainingText = currentMessage.text.slice(currentText.length);
          const boldMatch = remainingText.match(/^\*\*(.*?)\*\*/);
          
          if (boldMatch) {
            // Type the complete bold pattern at once
            setCurrentText(currentMessage.text.slice(0, currentText.length + boldMatch[0].length));
          } else {
            // If no closing **, just type the character normally
            setCurrentText(currentMessage.text.slice(0, currentText.length + 1));
          }
        } else {
          // Normal character typing
          setCurrentText(currentMessage.text.slice(0, currentText.length + 1));
        }
      }, 15 + Math.random() * 10);
      return () => clearTimeout(timer);
    } 
    
    // Finished typing current message
    if (currentText.length === currentMessage.text.length) {
      const pauseTime = currentMessage.type === 'user' ? 600 : 1200;
      const timer = setTimeout(() => {
        if (currentMessageIndex < currentConversation.messages.length - 1) {
          // Move to next message in same conversation
          setCurrentMessageIndex(prev => prev + 1);
          setCurrentText('');
        } else {
          // Move to next conversation
          setCurrentConversationIndex(prev => (prev + 1) % conversations.length);
          setCurrentMessageIndex(0);
          setCurrentText('');
        }
      }, pauseTime);
      return () => clearTimeout(timer);
    }
  }, [currentText, currentMessage, currentMessageIndex, currentConversationIndex, currentConversation]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Fixed height container to prevent content jumping */}
      <div className="min-h-[400px] space-y-4">
        {/* Previous messages in conversation */}
        {currentConversation.messages.slice(0, currentMessageIndex).map((message, index) => (
          <div key={index} className={`flex items-start gap-3 ${message.type === 'ai' ? 'justify-end' : 'justify-start'}`}>
            {message.type === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
            <div className="max-w-[80%] text-left">
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {renderMarkdown(message.text)}
              </div>
            </div>
            {message.type === 'ai' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-white">
                <Image
                  src="/images/logoweb.png"
                  alt="Mini Mentor AI"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
            )}
          </div>
        ))}

        {/* Current typing message */}
        <div className={`flex items-start gap-3 ${currentMessage.type === 'ai' ? 'justify-end' : 'justify-start'}`}>
          {currentMessage.type === 'user' && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          )}
          <div className="max-w-[80%] text-left">
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {renderMarkdown(currentText)}
              {currentText.length < currentMessage.text.length && (
                <span className="inline-block w-2 h-5 bg-[#2B9CA8] ml-1 animate-pulse" />
              )}
            </div>
          </div>
          {currentMessage.type === 'ai' && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-white">
              <Image
                src="/images/logoweb.png"
                alt="Mini Mentor AI"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 