import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useGlobalSupport() {
  const [globalThreadId, setGlobalThreadId] = useState<number | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isUsernamePromptOpen, setIsUsernamePromptOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');

  useEffect(() => {
    const savedThreadId = localStorage.getItem('site_support_thread_id');
    if (savedThreadId) {
      setGlobalThreadId(parseInt(savedThreadId, 10));
    }
  }, []);

  const openSupport = async () => {
    const savedUsername = localStorage.getItem('site_user_tg');
    if (!savedUsername) {
      setIsUsernamePromptOpen(true);
      return;
    }

    await openChatInternal(savedUsername);
  };

  const submitUsername = async () => {
    const formatted = usernameInput.trim().startsWith('@') ? usernameInput.trim() : `@${usernameInput.trim()}`;
    if (formatted.length < 2) return;
    
    localStorage.setItem('site_user_tg', formatted);
    setIsUsernamePromptOpen(false);
    await openChatInternal(formatted);
  };

  const openChatInternal = async (username: string) => {
    setIsSupportOpen(true);
    
    // If we don't have a thread yet, create one
    if (!globalThreadId) {
      try {
        const { data: threadData, error: threadError } = await supabase
          .from('escort_support_threads')
          .insert({
            topic: 'Сайт: Вопрос от посетителя',
            status: 'open'
          })
          .select()
          .single();

        if (threadError) throw threadError;

        if (threadData) {
          const newThreadId = threadData.id;
          setGlobalThreadId(newThreadId);
          localStorage.setItem('site_support_thread_id', newThreadId.toString());

          // Notify the bot that a new support thread was created
          await supabase.from('escort_bot_events').insert({
            event_type: 'support_thread_created',
            status: 'pending',
            payload: {
              thread_id: newThreadId,
              topic: 'Сайт: Вопрос от посетителя',
              username: username
            }
          });
        }
      } catch (err) {
        console.error('Failed to create support thread:', err);
      }
    }
  };

  const closeSupport = () => {
    setIsSupportOpen(false);
  };

  return {
    globalThreadId,
    isSupportOpen,
    isUsernamePromptOpen,
    usernameInput,
    setUsernameInput,
    submitUsername,
    setIsUsernamePromptOpen,
    openSupport,
    closeSupport
  };
}
