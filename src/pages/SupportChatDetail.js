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
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  AppBar,
  Toolbar,
  Container,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { motion } from "framer-motion";

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
    // Прокрутка произойдёт за счёт эффекта, зависящего от messages
  };

  return (
    <Box
      sx={{
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Paper
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "80vh",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {/* Заголовок */}
          <AppBar position="static" color="primary">
            <Toolbar>
              <Avatar
                sx={{ mr: 2 }}
                src="/path/to/your/avatar.png" // замените на ваш путь
              >
                ТП
              </Avatar>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Чат с агентом
              </Typography>
              <Typography variant="body2" sx={{ mr: 2 }}>
                Онлайн
              </Typography>
              <IconButton color="inherit" onClick={onClose}>
                X
              </IconButton>
            </Toolbar>
          </AppBar>

          {/* Список сообщений */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              backgroundColor: "#f9f9f9",
            }}
          >
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent:
                      msg.senderRole === "support" ? "flex-end" : "flex-start",
                    mb: 1,
                  }}
                >
                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: "70%",
                      bgcolor:
                        msg.senderRole === "support" ? "#1976d2" : "#e0e0e0",
                      color: msg.senderRole === "support" ? "#fff" : "#000",
                    }}
                  >
                    <Typography variant="body1">{msg.text}</Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", textAlign: "right" }}
                    >
                      {msg.timestamp?.toDate().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Paper>
                </Box>
              </motion.div>
            ))}
            <div ref={scrollRef} />
          </Box>

          {/* Ввод сообщения */}
          <Box
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              borderTop: "1px solid #ddd",
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Введите сообщение..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <IconButton color="primary" onClick={sendMessage}>
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}