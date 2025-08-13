import React from 'react';
import PropertyDetail from "./PropertyDetail";

// Обертка, прячущая редактирование и бейджи на инвесторской странице
export default function InvestorPropertyDetail() {
  // Подставляем глобальные флаги в window, чтобы внутренние проверки могли их учитывать
  // (компонент PropertyDetail читает canEdit() и выводит кнопки/бейджи на основе условий)
  // Здесь мы жёстко отключаем все возможности редактирования и скрываем бейдж проверки.
  const flags = {
    __INVESTOR_VIEW__: true,
  };
  // Передадим флаг через глобал
  Object.assign(window, flags);
  // Также добавим класс на body для CSS-сокрытия элементов
  document.body.classList.add('investor-view');
  return <PropertyDetail />;
}


