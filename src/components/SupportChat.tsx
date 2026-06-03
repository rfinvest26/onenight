import React, { useState, useEffect, useRef } from 'react';
import { Send, ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SupportChatProps {
  threadId: number;
  orderId?: number;
  modelName?: string;
  totalPrice?: number;
}

interface Message {
  id: number;
  author: 'user' | 'agent';
  text: string;
  image_url?: string;
  created_at: string;
}

export default function SupportChat({ threadId, orderId, modelName, totalPrice }: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingImg, setUploadingImg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`support_thread_${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'escort_support_messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('escort_support_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setMessages(data as Message[] || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render formatted text with copyable code blocks
  const renderMessageText = (text: string) => {
    // Basic regex to find <code>...</code> blocks
    const parts = text.split(/(<code>.*?<\/code>)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('<code>') && part.endsWith('</code>')) {
        const codeContent = part.replace(/<\/?code>/g, '');
        return (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            backgroundColor: 'var(--card-bg)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
            border: '1px solid var(--border-color)',
            fontFamily: 'monospace',
            fontSize: '1.1rem',
            letterSpacing: '1px'
          }}>
            <span style={{ fontWeight: 'bold' }}>{codeContent}</span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(codeContent);
                alert('Реквизиты скопированы!');
              }}
              style={{
                background: 'var(--text-primary)',
                color: 'var(--bg-color)',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}
            >
              Копировать
            </button>
          </div>
        );
      }
      
      // Simple bold rendering
      const boldParts = part.split(/(<b>.*?<\/b>)/g);
      return (
        <span key={index}>
          {boldParts.map((bp, i) => {
            if (bp.startsWith('<b>') && bp.endsWith('</b>')) {
              return <strong key={i}>{bp.replace(/<\/?b>/g, '')}</strong>;
            }
            return <span key={i}>{bp}</span>;
          })}
        </span>
      );
    });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const currentText = inputText;
    setInputText('');

    try {
      // 1. Save to DB
      await supabase.from('escort_support_messages').insert({
        thread_id: threadId,
        author: 'user',
        text: currentText
      });
      await supabase.from('escort_support_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);

      // 2. Dispatch event to bot
      await supabase.from('escort_bot_events').insert({
        event_type: 'support_message_created',
        status: 'pending',
        payload: {
          thread_id: threadId,
          text: currentText,
          username: localStorage.getItem('site_user_tg') || 'Сайт-Гость'
        }
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImg(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${threadId}_${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('support_media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('support_media')
        .getPublicUrl(filePath);

      // 1. Send message with image
      await supabase.from('escort_support_messages').insert({
        thread_id: threadId,
        author: 'user',
        text: '📷 Скриншот об оплате',
        image_url: publicUrl
      });
      await supabase.from('escort_support_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);

      // 2. Dispatch event to bot
      if (orderId) {
        await supabase.from('escort_bot_events').insert({
          event_type: 'payment_screenshot_uploaded',
          status: 'pending',
          payload: {
            order_id: orderId,
            model_name: modelName,
            total_price: totalPrice,
            screenshot_url: publicUrl,
            support_thread_id: threadId
          }
        });
      } else {
        await supabase.from('escort_bot_events').insert({
          event_type: 'support_message_created',
          status: 'pending',
          payload: {
            thread_id: threadId,
            text: '📷 Изображение',
            image_url: publicUrl,
            username: localStorage.getItem('site_user_tg') || 'Сайт-Гость'
          }
        });
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Ошибка при загрузке изображения. Обратитесь в ТП текстом.');
    } finally {
      setUploadingImg(false);
      e.target.value = '';
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка чата...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '70vh', backgroundColor: 'transparent' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
            Напишите ваш вопрос, и мы ответим в ближайшее время.
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              style={{ 
                maxWidth: '85%', 
                padding: '0.75rem 1rem', 
                borderRadius: '16px', 
                alignSelf: msg.author === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.author === 'user' ? 'var(--accent-color)' : 'var(--bg-color)',
                color: msg.author === 'user' ? 'var(--bg-color)' : 'var(--text-primary)',
                border: msg.author === 'user' ? 'none' : '1px solid var(--border-color)',
                borderBottomRightRadius: msg.author === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.author === 'agent' ? '4px' : '16px',
              }}
            >
              {msg.image_url && (
                <img 
                  src={msg.image_url} 
                  alt="attachment" 
                  style={{ width: '100%', borderRadius: '8px', marginBottom: '0.5rem', cursor: 'pointer' }} 
                  onClick={() => window.open(msg.image_url, '_blank')}
                />
              )}
              {msg.text && <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{renderMessageText(msg.text)}</div>}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem', padding: '1rem', backgroundColor: 'transparent', borderTop: '1px solid var(--border-color)', alignItems: 'center' }}>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
          style={{ display: 'none' }} 
          id={`chat-file-upload-${threadId}`} 
          disabled={uploadingImg}
        />
        <label 
          htmlFor={`chat-file-upload-${threadId}`} 
          style={{ cursor: uploadingImg ? 'wait' : 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}
        >
          {uploadingImg ? <Loader2 size={24} className="spin" /> : <ImageIcon size={24} />}
        </label>
        
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Сообщение..."
          className="input"
          style={{ flex: 1, borderRadius: '20px', backgroundColor: 'var(--bg-color)' }}
        />
        <button type="submit" className="btn" style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
