import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, TextField, Typography, Button, Link } from "@mui/material";
import ResetPasswordModal from "../components/ResetPasswordModal";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/complex/list");
    } catch (err) {
      alert("Ошибка входа: " + err.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, margin: "auto", p: 2 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Вход
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField label="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button variant="contained" type="submit">
              Войти
            </Button>
            <Link
              component="button"
              variant="body2"
              onClick={() => setResetModalOpen(true)}
              sx={{ textAlign: "center", mt: 1 }}
            >
              Забыли пароль?
            </Link>
          </Box>
        </CardContent>
      </Card>

      <ResetPasswordModal 
        open={resetModalOpen} 
        onClose={() => setResetModalOpen(false)} 
      />
    </Box>
  );
}

export default LoginPage;