import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit
} from "firebase/firestore";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import SupportChatDetail from "./SupportChatDetail";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { motion } from "framer-motion";
import { MessageCircle, Search, User } from "lucide-react";

const db = getFirestore();

export default function SupportChats() {
  const [chats, setChats] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  useEffect(() => {
    let unsubscribes = [];
    const tempChats = [];

    const fetchSupportChats = async () => {
      // Получаем все документы из коллекции "agents"
      const agentsSnapshot = await getDocs(collection(db, "agents"));
      console.log("Agents snapshot:", agentsSnapshot.docs.map(doc => doc.id));

      for (const agentDoc of agentsSnapshot.docs) {
        const agentId = agentDoc.id;
        console.log("Обрабатываем агента:", agentId);

        // Получаем карточку пользователя из "users" с таким же ID
        const userDocRef = doc(db, "users", agentId);
        const userDocSnap = await getDoc(userDocRef);
        let userData = {};
        if (userDocSnap.exists()) {
          userData = userDocSnap.data();
          console.log(`User data для ${agentId}:`, userData);
        } else {
          console.log(`Нет данных пользователя для ${agentId}`);
        }

        // Определяем референс документа чата поддержки
        const supportChatRef = doc(db, "agents", agentId, "chats", "support");

        // Слушатель для агрегированных данных чата (например, lastMessage, timestamp, unreadCount)
        const unsubscribeChat = onSnapshot(supportChatRef, (chatSnap) => {
          if (chatSnap.exists()) {
            const chatData = chatSnap.data();
            console.log(`Chat data для ${agentId}:`, chatData);

            const updatedChat = {
              agentId,
              userName: userData.displayName || "Без имени",
              userEmail: userData.email || "Нет email",
              // fallback от поддержки
              lastMessage: chatData.lastMessage || "",
              timestamp: chatData.timestamp?.toDate() || null,
              avatarURL: chatData.avatarURL || null,
              unreadCount: chatData.unreadCount || 0,
              // Эти поля обновятся отдельным слушателем
              userTimestamp: null,
              userLastMessage: "",
            };

            const index = tempChats.findIndex((chat) => chat.agentId === agentId);
            if (index === -1) {
              tempChats.push(updatedChat);
            } else {
              tempChats[index] = { ...tempChats[index], ...updatedChat };
            }
            // Сортировка: если есть userTimestamp, используем его, иначе timestamp
            tempChats.sort((a, b) => {
              const timeA = a.userTimestamp ? a.userTimestamp.getTime() : a.timestamp?.getTime() || 0;
              const timeB = b.userTimestamp ? b.userTimestamp.getTime() : b.timestamp?.getTime() || 0;
              return timeB - timeA;
            });
            setChats([...tempChats]);
          } else {
            console.log(`Чат поддержки не найден для ${agentId}`);
          }
        });
        unsubscribes.push(unsubscribeChat);

        // Слушатель для получения последнего сообщения от агента (sender_role = "agent")
        const userMsgQuery = query(
          collection(db, "agents", agentId, "chats", "support", "messages"),
          where("sender_role", "==", "user"),
          orderBy("timestamp", "desc"),
          limit(1)
        );
        const unsubscribeAgentMsg = onSnapshot(userMsgQuery, (snapshot) => {
          console.log(`AgentMsg snapshot для ${agentId}:`, snapshot.docs.map(doc => doc.data()));
          if (!snapshot.empty) {
            const agentMsgDoc = snapshot.docs[0];
            const lastAgentMsgTimestamp = agentMsgDoc.data().timestamp?.toDate() || null;
            const lastAgentMsgText = agentMsgDoc.data().text || "";
            const index = tempChats.findIndex((chat) => chat.agentId === agentId);
            if (index !== -1) {
              tempChats[index].userTimestamp = lastAgentMsgTimestamp;
              // Если нет сообщения от агента, используем fallback lastMessage
              tempChats[index].userLastMessage = lastAgentMsgText || tempChats[index].lastMessage;
              // Сортировка
              tempChats.sort((a, b) => {
                const timeA = a.userTimestamp ? a.userTimestamp.getTime() : a.timestamp?.getTime() || 0;
                const timeB = b.userTimestamp ? b.userTimestamp.getTime() : b.timestamp?.getTime() || 0;
                return timeB - timeA;
              });
              setChats([...tempChats]);
            }
          } else {
            console.log("Нет сообщений от агента для", agentId);
          }
        });
        unsubscribes.push(unsubscribeAgentMsg);
      }
    };

    fetchSupportChats();

    // Очистка подписок при размонтировании компонента
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  // Фильтруем по displayName и email пользователя
  const filteredChats = chats.filter((chat) =>
    chat.userName.toLowerCase().includes(searchText.toLowerCase()) ||
    chat.userEmail.toLowerCase().includes(searchText.toLowerCase())
  );

  if (selectedAgentId) {
    return (
      <SupportChatDetail
        agentId={selectedAgentId}
        onClose={() => setSelectedAgentId(null)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <div>
              <CardTitle className="text-2xl">Чаты техподдержки</CardTitle>
              <p className="text-gray-600 mt-1">Управление обращениями пользователей</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Поиск по имени или email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Список чатов */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <motion.div
                  key={chat.agentId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    onClick={() => setSelectedAgentId(chat.agentId)}
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all duration-200"
                  >
                    {/* Аватар */}
                    <div className="flex-shrink-0">
                      {chat.avatarURL ? (
                        <img
                          src={chat.avatarURL}
                          alt={chat.userName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-lg">
                          {chat.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Контент чата */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className={`font-medium truncate ${chat.unreadCount > 0 ? 'font-bold' : ''}`}>
                          {chat.userName}
                        </h3>
                        <div className="flex items-center gap-2 ml-2">
                          {chat.unreadCount > 0 && (
                            <Badge variant="default" className="bg-blue-600">
                              {chat.unreadCount}
                            </Badge>
                          )}
                          {(chat.userTimestamp || chat.timestamp) && (
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {format(
                                chat.userTimestamp || chat.timestamp, 
                                "dd.MM.yy, HH:mm", 
                                { locale: ru }
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {chat.userEmail}
                      </p>
                      
                      <p className={`text-sm text-gray-800 truncate ${chat.unreadCount > 0 ? 'font-medium' : ''}`}>
                        {chat.userLastMessage || chat.lastMessage || "Нет сообщений"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchText ? "Чаты не найдены" : "Нет активных чатов"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}