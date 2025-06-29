import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import toast from 'react-hot-toast';

const FixationChat = ({ chatId, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chatData, setChatData] = useState(null);
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && chatId) {
      // Получаем данные чата
      const fetchChatData = async () => {
        try {
          const chatRef = doc(db, 'agents', currentUser.uid, 'chats', chatId);
          const chatDoc = await getDoc(chatRef);
          if (chatDoc.exists()) {
            setChatData(chatDoc.data());
          }
        } catch (error) {
          console.error('Ошибка при получении данных чата:', error);
          toast.error('Не удалось загрузить данные чата');
        }
      };

      fetchChatData();

      // Подписываемся на обновления сообщений
      const messagesRef = collection(db, 'agents', currentUser.uid, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(newMessages);
        setIsLoading(false);
        setTimeout(scrollToBottom, 100);
      }, (error) => {
        console.error('Ошибка при получении сообщений:', error);
        toast.error('Не удалось загрузить сообщения');
        setIsLoading(false);
      });

      return () => {
        unsubscribe();
        setChatData(null);
        setMessages([]);
      };
    }
  }, [chatId, isOpen, currentUser.uid]);

  // Отправка нового сообщения
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messagesRef = collection(db, 'agents', currentUser.uid, 'chats', chatId, 'messages');
      const chatRef = doc(db, 'agents', currentUser.uid, 'chats', chatId);

      // Добавляем новое сообщение
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.email,
        timestamp: Timestamp.now(),
        isFromCurrentUser: true
      });

      // Обновляем последнее сообщение в чате
      await updateDoc(chatRef, {
        lastMessage: newMessage,
        timestamp: Timestamp.now()
      });

      setNewMessage('');
      toast.success('Сообщение отправлено');
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      toast.error('Не удалось отправить сообщение');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {chatData?.chatName || 'Чат фиксации'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
              >
                <Card 
                  className={`max-w-[70%] p-3 ${
                    message.senderId === 'system' 
                      ? 'bg-gray-100' 
                      : message.isFromCurrentUser 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100'
                  }`}
                >
                  {message.senderId === 'system' ? (
                    <div className="text-gray-600 italic">{message.text}</div>
                  ) : (
                    <>
                      <div className="text-sm opacity-75 mb-1">{message.senderName}</div>
                      <div>{message.text}</div>
                      <div className="text-xs opacity-50 mt-1">
                        {new Date(message.timestamp.seconds * 1000).toLocaleString()}
                      </div>
                    </>
                  )}
                </Card>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Введите сообщение..."
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              Отправить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FixationChat; 