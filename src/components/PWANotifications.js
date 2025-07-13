import React, { useState, useEffect } from 'react';

const PWANotifications = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  useEffect(() => {
    // Проверяем, установлено ли приложение
    const checkInstallation = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        setIsInstalled(true);
      }
    };

    checkInstallation();

    // Слушаем изменения состояния сети
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Слушаем событие установки
    const handleAppInstalled = () => {
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Проверяем обновления Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdateNotification(true);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);



  const handleUpdateClick = () => {
    window.location.reload();
  };

  const styles = {
    container: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '300px',
    },
    notification: {
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      fontWeight: '500',
      animation: 'slideIn 0.3s ease-out',
    },
    online: {
      backgroundColor: '#10b981',
      color: 'white',
    },
    offline: {
      backgroundColor: '#ef4444',
      color: 'white',
    },

    update: {
      backgroundColor: '#f59e0b',
      color: 'white',
    },
    button: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      border: 'none',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    icon: {
      fontSize: '16px',
    },
    closeButton: {
      backgroundColor: 'transparent',
      color: 'white',
      border: 'none',
      fontSize: '16px',
      cursor: 'pointer',
      padding: '0',
      marginLeft: 'auto',
    },
  };

  return (
    <div style={styles.container}>
      {/* Уведомление о статусе сети */}
      {!isOnline && (
        <div style={{...styles.notification, ...styles.offline}}>
          <span style={styles.icon}>📡</span>
          <span>Нет подключения к интернету</span>
        </div>
      )}



      {/* Уведомление об обновлении */}
      {showUpdateNotification && (
        <div style={{...styles.notification, ...styles.update}}>
          <span style={styles.icon}>🔄</span>
          <span>Доступно обновление</span>
          <button 
            style={styles.button}
            onClick={handleUpdateClick}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          >
            Обновить
          </button>
          <button 
            style={styles.closeButton}
            onClick={() => setShowUpdateNotification(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default PWANotifications; 