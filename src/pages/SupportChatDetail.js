import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getFirestore,
} from "firebase/firestore";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import { Send, ArrowLeft, MessageCircle, Circle } from "lucide-react";

const db = getFirestore();

export default function SupportChatDetail({ agentId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef(null);

  // Подписка на сообщения чата
  useEffect(() => {
    const messagesRef = collection(
      db,
      "agents",
      agentId,
      "chats",
      "support",
      "messages"
    );
    const q = query(messagesRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [agentId]);

  // Прокрутка к последнему сообщению при обновлении сообщений
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Сбрасываем количество непрочитанных сообщений при открытии чата
  useEffect(() => {
    const chatRef = doc(db, "agents", agentId, "chats", "support");
    updateDoc(chatRef, { unreadCount: 0 });
  }, [agentId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const chatRef = doc(db, "agents", agentId, "chats", "support");

    await addDoc(collection(chatRef, "messages"), {
      senderId: "support",
      senderName: "Техподдержка",
      senderRole: "support",
      text: newMessage,
      timestamp: serverTimestamp(),
    });

    await updateDoc(chatRef, {
      lastMessage: newMessage,
      timestamp: serverTimestamp(),
    });

    setNewMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        <Card className="h-[calc(100vh-3rem)] flex flex-col">
          {/* Заголовок */}
          <CardHeader className="flex-shrink-0 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Назад
                </Button>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center font-semibold text-sm">
                    ТП
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Чат с агентом</h2>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Circle className="w-2 h-2 fill-current" />
                      Онлайн
                    </div>
                  </div>
                </div>
              </div>
              
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
          </CardHeader>

          {/* Список сообщений */}
          <CardContent className="flex-1 overflow-hidden p-0">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Начните переписку с агентом</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.senderRole === "support" ? "justify-end" : "justify-start"}`}
                    >
                      <div 
                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                          msg.senderRole === "support" 
                            ? "bg-blue-600 text-white rounded-br-sm" 
                            : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <div className={`text-xs mt-2 ${msg.senderRole === "support" ? "text-blue-100" : "text-gray-500"}`}>
                          {msg.timestamp?.toDate().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={scrollRef} />
              </div>

              {/* Ввод сообщения */}
              <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder="Введите сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="resize-none"
                    />
                  </div>
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                    className="px-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}