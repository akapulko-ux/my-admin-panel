import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography
} from '@mui/material';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';

function ResetPasswordModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('Ошибка сброса пароля:', err);
      if (err.code === 'auth/invalid-email') {
        setError('Неверный формат email адреса');
      } else if (err.code === 'auth/user-not-found') {
        setError('Пользователь с таким email не найден');
      } else {
        setError('Ошибка при отправке email для сброса пароля: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Восстановление пароля</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {success ? (
            <Typography color="success.main" sx={{ mb: 2 }}>
              Инструкции по сбросу пароля отправлены на ваш email
            </Typography>
          ) : (
            <>
              <Typography sx={{ mb: 2 }}>
                Введите ваш email, и мы отправим вам инструкции по сбросу пароля
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!error}
                helperText={error}
                disabled={loading}
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {success ? 'Закрыть' : 'Отмена'}
        </Button>
        {!success && (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !email}
          >
            {loading ? 'Отправка...' : 'Отправить'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ResetPasswordModal; 