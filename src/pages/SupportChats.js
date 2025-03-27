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
import {
  Container,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Badge,
  Box,
} from "@mui/material";
import { motion } from "framer-motion";

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
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ borderRadius: 2, overflow: "hidden", boxShadow: 3 }}>
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Чаты техподдержки
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="🔍 Поиск по имени или email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Box>

        <List sx={{ maxHeight: "600px", overflowY: "auto" }}>
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <motion.div
                key={chat.agentId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ListItem
                  button
                  onClick={() => setSelectedAgentId(chat.agentId)}
                  alignItems="flex-start"
                >
                  <ListItemAvatar>
                    {chat.avatarURL ? (
                      <Avatar alt={chat.userName} src={chat.avatarURL} />
                    ) : (
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {chat.userName.charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: chat.unreadCount > 0 ? "bold" : "normal" }}
                          >
                            {chat.userName}
                          </Typography>
                          {chat.userTimestamp ? (
                            <Typography variant="caption" color="text.secondary">
                              {format(chat.userTimestamp, "dd.MM.yy, HH:mm", { locale: ru })}
                            </Typography>
                          ) : (
                            chat.timestamp && (
                              <Typography variant="caption" color="text.secondary">
                                {format(chat.timestamp, "dd.MM.yy, HH:mm", { locale: ru })}
                              </Typography>
                            )
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {chat.userEmail}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ fontWeight: chat.unreadCount > 0 ? "bold" : "normal" }}
                      >
                        {chat.userLastMessage || chat.lastMessage || "Нет сообщений"}
                      </Typography>
                    }
                  />
                  {chat.unreadCount > 0 && (
                    <Badge
                      badgeContent={chat.unreadCount}
                      color="primary"
                      sx={{ mr: 2 }}
                    />
                  )}
                </ListItem>
              </motion.div>
            ))
          ) : (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Чаты не найдены
              </Typography>
            </Box>
          )}
        </List>
      </Paper>
    </Container>
  );
}