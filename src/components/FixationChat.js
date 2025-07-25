import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { translations } from '../lib/translations';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import ImageMessageView from './ImageMessageView';
import FullScreenImageView from './FullScreenImageView';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, X } from 'lucide-react';
import { uploadToFirebaseStorageInFolder } from '../utils/firebaseStorage';
import { createImageThumbnail, compressImage, isImageFile, createImagePreview } from '../utils/imageUtils';
import toast from 'react-hot-toast';

const FixationChat = ({ chatId, agentId, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chatData, setChatData] = useState(null);
  const [showFullScreenGallery, setShowFullScreenGallery] = useState(false);
  const [fullScreenCurrentIndex, setFullScreenCurrentIndex] = useState(0);
  const [uploadingImages, setUploadingImages] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  

  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && chatId && agentId) {
      // Получаем данные чата
      const fetchChatData = async () => {
        try {
          const chatRef = doc(db, 'agents', agentId, 'chats', chatId);
          const chatDoc = await getDoc(chatRef);
          if (chatDoc.exists()) {
            setChatData(chatDoc.data());
          }
        } catch (error) {
          console.error('Ошибка при получении данных чата:', error);
          toast.error(t.fixationChat.chatDataError);
        }
      };

      fetchChatData();

      // Подписываемся на обновления сообщений
      const messagesRef = collection(db, 'agents', agentId, 'chats', chatId, 'messages');
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
        toast.error(t.fixationChat.messagesError);
        setIsLoading(false);
      });

      return () => {
        unsubscribe();
        setChatData(null);
        setMessages([]);
      };
    } else {
      // Очищаем состояние если чат закрыт
      setChatData(null);
      setMessages([]);
      // Освобождаем память от preview URL
      uploadingImages.forEach(img => {
        URL.revokeObjectURL(img.preview);
      });
      setUploadingImages([]);
    }
  }, [chatId, agentId, isOpen, t.fixationChat.chatDataError, t.fixationChat.messagesError, uploadingImages]);

  // Очистка памяти при размонтировании компонента
  useEffect(() => {
    return () => {
      uploadingImages.forEach(img => {
        URL.revokeObjectURL(img.preview);
      });
    };
  }, [uploadingImages]);

  // Получаем все изображения из сообщений для галереи
  const imageMessages = messages.filter(message => message.mediaType === 'image');
  
  // Получаем полные URL изображений для галереи
  const fullImageURLs = imageMessages.map(message => {
    if (!message.mediaURL) return null;
    const components = message.mediaURL.split('||');
    return components[1] || components[0] || message.mediaURL;
  }).filter(Boolean);

  // Функция для открытия полноэкранного просмотра изображения
  const handleOpenFullScreen = (message) => {
    const imageIndex = imageMessages.findIndex(msg => msg.id === message.id);
    if (imageIndex !== -1) {
      setFullScreenCurrentIndex(imageIndex);
      setShowFullScreenGallery(true);
    }
  };

  // Функция для удаления сообщения
  const handleDeleteMessage = async (message) => {
    try {
      const messageRef = doc(db, 'agents', agentId, 'chats', chatId, 'messages', message.id);
      await updateDoc(messageRef, {
        deleted: true,
        deletedAt: Timestamp.now(),
        deletedBy: currentUser.uid
      });
      toast.success(t.fixationChat.messageDeleted);
    } catch (error) {
      console.error('Ошибка при удалении сообщения:', error);
      toast.error(t.fixationChat.deleteMessageError);
    }
  };

  // Отправка нового сообщения
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !agentId) return;

    try {
      const messagesRef = collection(db, 'agents', agentId, 'chats', chatId, 'messages');
      const chatRef = doc(db, 'agents', agentId, 'chats', chatId);

      // Добавляем новое сообщение
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.email,
        timestamp: Timestamp.now(),
        isFromCurrentUser: false // Для админа это сообщение от поддержки
      });

      // Обновляем последнее сообщение в чате
      await updateDoc(chatRef, {
        lastMessage: newMessage,
        timestamp: Timestamp.now()
      });

      setNewMessage('');
      toast.success(t.fixationChat.messageSent);
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      toast.error(t.fixationChat.messageError);
    }
  };

  // Обработка выбранных файлов изображений
  const onDropImages = (acceptedFiles) => {
    const imageFiles = acceptedFiles.filter(isImageFile);
    
    if (imageFiles.length === 0) {
      toast.error('Можно загружать только изображения');
      return;
    }

    // Добавляем изображения в состояние загрузки с preview
    const newUploadingImages = imageFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: createImagePreview(file),
      uploading: false
    }));

    setUploadingImages(prev => [...prev, ...newUploadingImages]);
  };

  // Удаление изображения из очереди загрузки
  const removeUploadingImage = (imageId) => {
    setUploadingImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      // Освобождаем память от preview URL
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return updated;
    });
  };

  // Отправка изображения
  const sendImageMessage = async (uploadingImage) => {
    if (!agentId || !chatId) return;

    try {
      setIsUploadingImage(true);
      setUploadingImages(prev => 
        prev.map(img => 
          img.id === uploadingImage.id 
            ? { ...img, uploading: true }
            : img
        )
      );

      // Создаем полное изображение и миниатюру как в iOS
      const fullImageBlob = await compressImage(uploadingImage.file, 0.8);
      const thumbnailBlob = await createImageThumbnail(uploadingImage.file, 400, 0.8);

      // Создаем File объекты для загрузки
      const fullImageFile = new File([fullImageBlob], `image_full_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const thumbnailFile = new File([thumbnailBlob], `image_thumb_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Загружаем оба изображения в Firebase Storage
      const [fullImageURL, thumbnailURL] = await Promise.all([
        uploadToFirebaseStorageInFolder(fullImageFile, 'chat_images'),
        uploadToFirebaseStorageInFolder(thumbnailFile, 'chat_images')
      ]);

      // Формируем mediaURL в формате "thumbURL||fullURL" как в iOS
      const mediaURL = `${thumbnailURL}||${fullImageURL}`;

      // Отправляем сообщение с изображением
      const messagesRef = collection(db, 'agents', agentId, 'chats', chatId, 'messages');
      const chatRef = doc(db, 'agents', agentId, 'chats', chatId);

      await addDoc(messagesRef, {
        text: 'Изображение',
        senderId: currentUser.uid,
        senderName: currentUser.email,
        mediaURL: mediaURL,
        mediaType: 'image',
        timestamp: Timestamp.now(),
        isFromCurrentUser: false // Для админа это сообщение от поддержки
      });

      // Обновляем последнее сообщение в чате
      await updateDoc(chatRef, {
        lastMessage: 'Изображение',
        timestamp: Timestamp.now()
      });

      // Удаляем изображение из очереди загрузки
      removeUploadingImage(uploadingImage.id);
      
      toast.success('Изображение отправлено');
    } catch (error) {
      console.error('Ошибка при отправке изображения:', error);
      toast.error('Ошибка при отправке изображения');
      
      // В случае ошибки сбрасываем состояние uploading
      setUploadingImages(prev => 
        prev.map(img => 
          img.id === uploadingImage.id 
            ? { ...img, uploading: false }
            : img
        )
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Настройка dropzone для изображений
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop: onDropImages,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    noClick: true, // Отключаем клик, будем использовать кнопку
    noKeyboard: true
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {chatData?.chatName || t.fixationChat.title}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div 
            className="flex-1 overflow-y-auto p-4 relative" 
            ref={chatContainerRef}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            
            {/* Drag & Drop индикатор */}
            {isDragActive && (
              <div className={`absolute inset-0 z-10 flex items-center justify-center bg-opacity-90 rounded-lg ${
                isDragAccept ? 'bg-green-100 border-green-300' : 
                isDragReject ? 'bg-red-100 border-red-300' : 
                'bg-blue-100 border-blue-300'
              } border-2 border-dashed`}>
                <div className="text-center">
                  <ImagePlus className={`w-12 h-12 mx-auto mb-2 ${
                    isDragAccept ? 'text-green-600' : 
                    isDragReject ? 'text-red-600' : 
                    'text-blue-600'
                  }`} />
                  <p className={`text-lg font-medium ${
                    isDragAccept ? 'text-green-600' : 
                    isDragReject ? 'text-red-600' : 
                    'text-blue-600'
                  }`}>
                    {isDragAccept ? 'Отпустите для загрузки изображений' : 
                     isDragReject ? 'Можно загружать только изображения' : 
                     'Перетащите изображения сюда'}
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => {
              // Пропускаем удаленные сообщения
              if (message.deleted) return null;

              // Если сообщение содержит изображение
              if (message.mediaType === 'image') {
                return (
                  <ImageMessageView
                    key={message.id}
                    message={message}
                    isFromCurrentUser={message.isFromCurrentUser}
                    onDelete={handleDeleteMessage}
                    onOpenFullScreen={handleOpenFullScreen}
                  />
                );
              }

              // Обычные текстовые сообщения
              return (
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
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Превью загружаемых изображений */}
        {uploadingImages.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <h4 className="text-sm font-medium mb-2">Изображения для отправки:</h4>
            <div className="flex flex-wrap gap-2">
              {uploadingImages.map((image) => (
                <div key={image.id} className="relative">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img 
                      src={image.preview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    {image.uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => removeUploadingImage(image.id)}
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                    disabled={image.uploading}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                                                        <Button
                     onClick={() => sendImageMessage(image)}
                     size="sm"
                     className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs z-10 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
                     disabled={image.uploading || isUploadingImage}
                   >
                     {image.uploading ? 'Загрузка...' : 'Отправить'}
                   </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t.fixationChat.messagePlaceholder}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => document.getElementById('image-input').click()}
              disabled={isUploadingImage}
              title="Выбрать изображения"
            >
              <ImagePlus className="w-4 h-4" />
            </Button>
            <Button type="submit" disabled={!newMessage.trim()}>
              {t.fixationChat.send}
            </Button>
          </div>
          <input
            id="image-input"
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files);
              onDropImages(files);
              e.target.value = ''; // Сброс значения для возможности повторного выбора того же файла
            }}
          />
        </form>
      </DialogContent>

      {/* Полноэкранный просмотр изображений */}
      <FullScreenImageView
        isOpen={showFullScreenGallery}
        onClose={() => setShowFullScreenGallery(false)}
        images={fullImageURLs}
        currentIndex={fullScreenCurrentIndex}
        onIndexChange={setFullScreenCurrentIndex}
      />
    </Dialog>
  );
};

export default FixationChat; 