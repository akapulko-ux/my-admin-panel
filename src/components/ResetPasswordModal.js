import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { landingTranslations } from '../lib/landingTranslations';

function ResetPasswordModal({ open, onClose, language = 'ru' }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = landingTranslations[language];

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
        setError(t.invalidEmail);
      } else if (err.code === 'auth/user-not-found') {
        setError(t.userNotFound);
      } else {
        setError(t.resetError + err.message);
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.resetPasswordTitle}</DialogTitle>
          {success ? (
            <DialogDescription className="text-green-600">
              {t.resetPasswordSuccess}
            </DialogDescription>
          ) : (
            <DialogDescription>
              {t.resetPasswordDescription}
            </DialogDescription>
          )}
        </DialogHeader>

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                disabled={loading}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </form>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {success ? t.close : t.cancel}
          </Button>
          {!success && (
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !email}
            >
              {loading ? t.sending : t.send}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ResetPasswordModal; 