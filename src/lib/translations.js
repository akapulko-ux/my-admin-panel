export const translations = {
  en: {
    // Page 1: Summary
    title: 'Investor ROI Presentation',
    logo: '',
    investmentSummary: 'Investment Summary',
    totalInvestment: 'Total Investment',
    paybackPeriod: 'Payback Period (Years)',
    annualFinancials: 'Annual Financials',
    grossRentalIncome: 'Gross Rental Income',
    operatingExpenses: 'Operating Expenses',
    noi: 'Net Operating Income (NOI)',
    kpis: 'Key Performance Indicators (KPIs)',
    roi: 'Return on Investment (ROI)',
    footer: '',
    
    // Page 2: Detailed Inputs
    detailedInputsTitle: 'Detailed Input Data',
    investmentCosts: 'Investment Costs',
    rentalIncomeData: 'Rental Income Data',
    annualExpenses: 'Annual Expenses',
    page2Footer: 'Page 2 - Detailed data',
    
    // Input Data Keys
    purchasePrice: 'Purchase Price',
    renovationCosts: 'Renovation Costs',
    legalFees: 'Legal Fees',
    additionalExpenses: 'Additional Expenses',
    investmentPeriod: 'Investment Period',
    dailyRate: 'Daily Rate',
    occupancyRate: 'Occupancy Rate',
    daysPerYear: 'Days Per Year',
    otaCommission: 'OTA Commission',
    maintenanceFees: 'Maintenance Fees',
    utilityBills: 'Utility Bills',
    annualTax: 'Annual Tax',

    // Page 3: Profitability
    profitabilityTitle: 'Profitability Forecast by Year',
    year: 'Year',
    annualNetProfit: 'Annual Net Profit',
    accumulatedProfit: 'Accumulated Profit',
    page3Footer: 'Page 3 - Profitability Forecast',

    // Public ROI Page
    investorHighlights: 'Investor Highlights',
    unitPrice: 'Unit Price',
    averageROI: 'Average ROI',
    annualRentExpenseGrowth: 'Projected Rental Growth',
    propertyManagementFee: 'Operating Expenses',
    totalReturns: 'Total Returns',
    cashFlow: 'Cash Flow',
    appreciation: 'Appreciation',
    projectedCumulativeReturn: 'Projected Cumulative Return for {years} years',
    approximateUnitCost: 'Projected Property Value',
    income: 'Income',
    cumulativeIncome: 'Cumulative Income',
    totalSpend: 'Total Spend',
    cumulativeSpend: 'Cumulative Spend',
    cumulativeCashflow: 'Cumulative Cashflow',
    appreciationYoY: 'Property Appreciation',
    pessimistic: 'Pessimistic',
    realistic: 'Realistic',
    optimistic: 'Optimistic',
    tooltipTotalReturns: 'Sum of cash flow and property appreciation',
    tooltipCashFlow: 'Accumulated rental income minus expenses',
    tooltipAppreciation: 'Property value growth during construction period',
    tooltipApproximateUnitCost: 'Projected property value after appreciation',
    yearNumber: 'Year',
    yearCalendar: 'Calendar Year',
    expenses: 'Expenses',
    cumulativeExpenses: 'Cumulative Expenses',
    cumulativeCashFlow: 'Cumulative Cash Flow',
    // Tooltips for Investor Highlights
    tooltipUnitPrice: 'Current property price including all initial costs',
    tooltipAverageROI: 'Average annual return on investment over the selected period',
    tooltipAnnualGrowth: 'Annual growth rate for property rental price',
    tooltipManagementFee: 'Property management, maintenance, utilities and tax expenses',
    
    // Financial Summary Section
    annualRentalIncome: 'Annual Rental Income',
    totalRoiForPeriod: 'Total ROI for Period',
    yearsText: 'years',
    roiShort: 'ROI',
    paybackPeriodShort: 'Payback Period',
    
    // Error messages
    dataNotFound: 'Data Not Found',
    publicRoiNotAvailable: 'Public ROI page is not available',
    
    // Common words
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',

    // Navigation
    navigation: {
      adminPanel: 'Admin Panel',
      propertyGallery: 'Properties Gallery',
      complexGallery: 'Complexes Gallery',
      properties: 'Properties',
      complexes: 'Complexes',
      developers: 'Developers',
      landmarks: 'Landmarks',
      chessboards: 'Chessboards',
      support: 'Support',
      roiCalculator: 'ROI Calculator',
      clientFixations: 'Client Fixations',
      userManagement: 'User Management',
      registrationRequests: 'Registration Requests',
      referralMap: 'Referral Map',
      settings: 'Settings'
    },

    // Client Fixations
    clientFixations: {
      title: 'Client Fixations',
      refresh: 'Refresh',
      loading: 'Loading fixations...',
      noFixations: 'No fixations available',
      searchPlaceholder: 'Search by name, phone, agent, complex...',
      searchResults: 'Found: {count} of {total} fixations',
      clearSearch: 'Clear search',
      noSearchResults: 'Nothing found for your query',
      
      // Status names
      statuses: {
        pending: 'Pending Approval',
        approved: 'Fixed',
        expired: 'Expired',
        rejected: 'Rejected',
        approved_plural: 'Fixed',
        expired_plural: 'Expired',
        rejected_plural: 'Rejected',
        pending_plural: 'Pending Approval'
      },
      
      // Filter section
      statusFilters: 'Status filters:',
      searchFilter: 'search "{query}"',
      statusFilter: 'status "{status}"',
      total: 'Total',
      
      // Card fields
      phone: 'Phone',
      agent: 'Agent',
      complex: 'Complex',
      developer: 'Developer',
      propertyType: 'Property Type',
      rejectReason: 'Rejection reason',
      rejectedBy: 'Rejected',
      validUntil: 'Valid until',
      
      // Actions
      accept: 'Accept',
      reject: 'Reject',
      chatWithAgent: 'Chat with agent',
      delete: 'Delete',
      
      // Dialog titles
      confirmFixation: 'Confirm Fixation',
      rejectFixation: 'Reject Fixation',
      deleteFixation: 'Delete Fixation',
      
      // Dialog content
      validUntilLabel: 'Valid until',
      commentLabel: 'Comment',
      commentRequired: 'required',
      commentPlaceholder: 'Please specify the reason for rejecting the fixation (minimum 10 characters)',
      commentMinLength: 'Comment must contain at least 10 characters (remaining {count})',
      
      deleteConfirmation: 'Are you sure you want to delete the fixation for client {clientName}?',
      deleteWarning: 'This action cannot be undone. The fixation and all related chat messages will be deleted.',
      
      // Toast messages
      statusUpdated: 'Fixation status successfully updated to "{status}"',
      statusUpdateError: 'Error updating fixation status',
      fixationDeleted: 'Fixation deleted successfully',
      deleteError: 'Error deleting fixation',
      fetchError: 'Error loading fixations',
      commentTooShort: 'Comment must contain at least 10 characters',
      validDateRequired: 'Please select a valid date',
      cancel: 'Cancel'
    },

    // Fixation Chat
    fixationChat: {
      title: 'Fixation Chat',
      messagePlaceholder: 'Enter message...',
      send: 'Send',
      messageSent: 'Message sent',
      messageError: 'Failed to send message',
      chatDataError: 'Failed to load chat data',
      messagesError: 'Failed to load messages'
    },

    // Settings Page
    settings: {
      title: 'Settings',
      profile: {
        title: 'Profile',
        description: 'Manage your profile settings',
        name: 'Name',
        email: 'Email',
        password: 'Password',
        updateProfile: 'Update Profile',
        updatePassword: 'Update Password',
        updateData: 'Update Data',
        newName: 'New Name',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        currentPassword: 'Current Password',
        updating: 'Updating...',
        profileUpdated: 'Profile updated successfully',
        passwordsNotMatch: 'Passwords do not match',
        passwordUpdated: 'Password updated successfully'
      },
      telegram: {
        title: 'Telegram Integration',
        description: 'Connect your Telegram account for notifications',
        connected: 'Connected',
        notConnected: 'Not Connected',
        connect: 'Connect Telegram',
        disconnect: 'Disconnect',
        connecting: 'Connecting...',
        chatId: 'Chat ID',
        verificationCode: 'Verification Code',
        generateCode: 'Generate Code',
        checkConnection: 'Check Connection',
        disconnectConfirm: 'Are you sure you want to disconnect Telegram?',
        connectedSuccess: 'Telegram connected successfully',
        disconnectedSuccess: 'Telegram disconnected successfully',
        connectionError: 'Error connecting to Telegram',
        instructions: 'To connect Telegram, click the button below and follow the instructions',
        step1: '1. Click "Generate Code" to get a verification code',
        step2: '2. Start a chat with the bot @{botUsername}',
        step3: '3. Send the verification code to the bot',
        step4: '4. Click "Check Connection" to verify',
        openBot: 'Open Bot',
        dialogTitle: 'Telegram Bot Connection',
        autoConnectInstructions: 'Click the button below for automatic bot connection. You will be redirected to Telegram where you need to press "Start".',
        codeLabel: 'Verification code:',
        codeInstructions: 'This code will be automatically passed to the bot',
        connectViaTelegram: 'Connect via Telegram',
        waitingConnection: 'Waiting for connection...'
      },
      contract: {
        title: 'Agent Contract',
        description: 'Agent service contract status',
        signed: 'Signed',
        notSigned: 'Not Signed',
        signContract: 'Sign Contract',
        viewContract: 'View Contract',
        signDate: 'Signed on',
        allContracts: 'All Contracts',
        loading: 'Loading contracts...',
        developer: 'Developer',
        signedBy: 'Signed by',
        signing: 'Signing...',
        contractSigned: 'Contract signed successfully',
        contractTitle: 'ASSIGNMENT AGREEMENT\nfor providing information and technical services',
        agree: 'I agree to the terms and conditions',
        agreeRequired: 'You must agree to the terms',
        warningTitle: 'Attention',
        warningText: 'Please read the contract carefully before signing. After signing, the contract becomes a legally binding document.',
        userContractTitle: 'User Contract:',
        // Full contract text
        contractText: `ASSIGNMENT AGREEMENT
for providing information and technical services

"IT Agent", hereinafter referred to as "Contractor", on the one hand, and Developer, hereinafter referred to as "Client", on the other hand, have concluded this Agreement on the following:

1. SUBJECT OF THE AGREEMENT

1.1. The Contractor undertakes to provide the Client with an IT platform for posting information about real estate objects and organizing interaction with real estate agents.

1.2. The Client undertakes to pay for the Contractor's services in the amount and manner established by this Agreement.

2. RIGHTS AND OBLIGATIONS OF THE PARTIES

2.1. The Contractor undertakes to:
2.1.1. Provide access to the IT platform for posting real estate objects;
2.1.2. Ensure technical functioning of the platform;
2.1.3. Organize receiving and processing of applications from agents;
2.1.4. Provide tools for interaction with real estate agents.

2.2. The Client undertakes to:
2.2.1. Timely provide current and reliable information about real estate objects;
2.2.2. Keep information about objects up to date;
2.2.3. Timely pay for services according to the terms of this Agreement;
2.2.4. Notify the Contractor about the sale of real estate objects through the platform.

3. PAYMENT PROCEDURE

3.1. The cost of the Contractor's services is 0.5% (zero point five percent) of the price of each real estate object sold through the IT platform.

3.2. The commission specified in clause 3.1 is paid by the Client in addition to the standard commission to real estate agents (5%).

3.3. Payment is made within 10 (ten) banking days from the moment of concluding a real estate purchase and sale agreement between the Client and the buyer attracted through the IT platform.

3.4. The basis for payment is the signed purchase and sale agreement and notification from the Client about the completed transaction.

4. LIABILITY OF THE PARTIES

4.1. For non-performance or improper performance of obligations under this Agreement, the parties bear responsibility in accordance with applicable law.

4.2. In case of payment delay, the Client pays a penalty of 0.1% of the overdue payment amount for each day of delay.

5. TERM OF THE AGREEMENT

5.1. This Agreement comes into force from the moment of its signing and is valid for one year.

5.2. The Agreement is automatically extended for the same period if neither party notifies the other of termination 30 days before the expiration date.

6. DISPUTE RESOLUTION PROCEDURE

6.1. All disputes and disagreements are resolved through negotiations.

6.2. If it is impossible to reach an agreement, disputes are resolved in court at the location of the Contractor.

7. FINAL PROVISIONS

7.1. This Agreement is made in two copies, having equal legal force, one for each party.

7.2. Changes and additions to the Agreement are valid only when executed in writing and signed by both parties.

8. SIGNATURES OF THE PARTIES

CONTRACTOR:                     CLIENT:
     IT Agent                                         Developer


_________________               _________________
  (signature)                            (signature)`,
        executor: 'CONTRACTOR',
        customer: 'CLIENT',
        signature: '(signature)'
      },
      language: {
        title: 'Language',
        description: 'Select your preferred language',
        english: 'English',
        russian: 'Russian',
        indonesian: 'Indonesian'
      }
    }
  },
  ru: {
    // Page 1: Summary
    title: 'Инвестиционная презентация ROI',
    logo: '',
    investmentSummary: 'Сводка по инвестициям',
    totalInvestment: 'Общие инвестиции',
    paybackPeriod: 'Срок окупаемости (лет)',
    annualFinancials: 'Годовые финансовые показатели',
    grossRentalIncome: 'Валовый доход от аренды',
    operatingExpenses: 'Операционные расходы',
    noi: 'Чистый операционный доход (NOI)',
    kpis: 'Ключевые показатели эффективности (KPI)',
    roi: 'Рентабельность инвестиций (ROI)',
    footer: '',

    // Page 2: Detailed Inputs
    detailedInputsTitle: 'Подробные исходные данные',
    investmentCosts: 'Инвестиционные затраты',
    rentalIncomeData: 'Данные о доходах от аренды',
    annualExpenses: 'Годовые расходы',
    page2Footer: 'Стр. 2 - Подробные данные',
    
    // Input Data Keys
    purchasePrice: 'Стоимость покупки',
    renovationCosts: 'Затраты на ремонт',
    legalFees: 'Юридические расходы',
    additionalExpenses: 'Дополнительные расходы',
    investmentPeriod: 'Инвестиционный период',
    dailyRate: 'Дневная ставка',
    occupancyRate: 'Коэффициент загрузки (%)',
    daysPerYear: 'Дней в году',
    otaCommission: 'Комиссия OTA (%)',
    maintenanceFees: 'Расходы на обслуживание',
    utilityBills: 'Коммунальные платежи',
    annualTax: 'Годовой налог',

    // Page 3: Profitability
    profitabilityTitle: 'Прогноз доходности по годам',
    year: 'Год',
    annualNetProfit: 'Годовая чистая прибыль',
    accumulatedProfit: 'Накопленная прибыль',
    page3Footer: 'Стр. 3 - Прогноз доходности',

    // Public ROI Page
    investorHighlights: 'Основные показатели для инвесторов',
    unitPrice: 'Стоимость единицы',
    averageROI: 'Средний ROI',
    annualRentExpenseGrowth: 'Прогнозируемый рост арендной платы',
    propertyManagementFee: 'Операционные расходы',
    totalReturns: 'Общая доходность',
    cashFlow: 'Денежный поток',
    appreciation: 'Удорожание',
    projectedCumulativeReturn: 'Прогнозируемая накопленная доходность за {years} лет',
    approximateUnitCost: 'Прогнозируемая стоимость недвижимости',
    income: 'Доход',
    cumulativeIncome: 'Накопленный доход',
    totalSpend: 'Общие расходы',
    cumulativeSpend: 'Накопленные расходы',
    cumulativeCashflow: 'Накопленный денежный поток',
    appreciationYoY: 'Удорожание недвижимости',
    pessimistic: 'Пессимистичный',
    realistic: 'Реалистичный',
    optimistic: 'Оптимистичный',
    tooltipTotalReturns: 'Сумма денежного потока и удорожания недвижимости',
    tooltipCashFlow: 'Накопленный доход от аренды минус расходы',
    tooltipAppreciation: 'Рост стоимости недвижимости в период строительства',
    tooltipApproximateUnitCost: 'Прогнозируемая стоимость недвижимости после удорожания',
    yearNumber: 'Год',
    yearCalendar: 'Календарный год',
    expenses: 'Расходы',
    cumulativeExpenses: 'Накопленные расходы',
    cumulativeCashFlow: 'Накопленный денежный поток',
    // Tooltips for Investor Highlights
    tooltipUnitPrice: 'Текущая цена недвижимости включая все первоначальные затраты',
    tooltipAverageROI: 'Средняя годовая доходность инвестиций за выбранный период',
    tooltipAnnualGrowth: 'Годовой темп роста арендной платы недвижимости',
    tooltipManagementFee: 'Расходы на управление недвижимостью, обслуживание, коммунальные услуги и налоги',
    
    // Financial Summary Section
    annualRentalIncome: 'Годовой доход от аренды',
    totalRoiForPeriod: 'Общий ROI за период',
    yearsText: 'лет',
    roiShort: 'ROI',
    paybackPeriodShort: 'Срок окупаемости',
    
    // Error messages
    dataNotFound: 'Данные не найдены',
    publicRoiNotAvailable: 'Публичная страница ROI недоступна',
    
    // Common words
    close: 'Закрыть',
    cancel: 'Отмена',
    save: 'Сохранить',

    // Navigation
    navigation: {
      adminPanel: 'Админ панель',
      propertyGallery: 'Галерея объектов',
      complexGallery: 'Галерея комплексов',
      properties: 'Объекты',
      complexes: 'Комплексы',
      developers: 'Застройщики',
      landmarks: 'Достопримечательности',
      chessboards: 'Шахматки',
      support: 'Поддержка',
      roiCalculator: 'Калькулятор ROI',
      clientFixations: 'Фиксации клиентов',
      userManagement: 'Управление пользователями',
      registrationRequests: 'Заявки на регистрацию',
      referralMap: 'Карта рефералов',
      settings: 'Настройки'
    },

    // Client Fixations
    clientFixations: {
      title: 'Фиксации клиентов',
      refresh: 'Обновить',
      loading: 'Загрузка фиксаций...',
      noFixations: 'Фиксации отсутствуют',
      searchPlaceholder: 'Поиск по имени, телефону, агенту, комплексу...',
      searchResults: 'Найдено: {count} из {total} фиксаций',
      clearSearch: 'Очистить поиск',
      noSearchResults: 'По вашему запросу ничего не найдено',
      
      // Status names
      statuses: {
        pending: 'На согласовании',
        approved: 'Зафиксирован',
        expired: 'Срок истек',
        rejected: 'Отклонен',
        approved_plural: 'Зафиксированы',
        expired_plural: 'Срок истек',
        rejected_plural: 'Отклонены',
        pending_plural: 'На согласовании'
      },
      
      // Filter section
      statusFilters: 'Применены фильтры:',
      searchFilter: 'поиск "{query}"',
      statusFilter: 'статус "{status}"',
      total: 'Всего',
      
      // Card fields
      phone: 'Телефон',
      agent: 'Агент',
      complex: 'Комплекс',
      developer: 'Застройщик',
      propertyType: 'Тип недвижимости',
      rejectReason: 'Причина отклонения',
      rejectedBy: 'Отклонено',
      validUntil: 'Действует до',
      
      // Actions
      accept: 'Принять',
      reject: 'Отклонить',
      chatWithAgent: 'Чат с агентом',
      delete: 'Удалить',
      
      // Dialog titles
      confirmFixation: 'Подтверждение фиксации',
      rejectFixation: 'Отклонение фиксации',
      deleteFixation: 'Удаление фиксации',
      
      // Dialog content
      validUntilLabel: 'Действует до',
      commentLabel: 'Комментарий',
      commentRequired: 'обязательно',
      commentPlaceholder: 'Укажите причину отклонения фиксации (минимум 10 символов)',
      commentMinLength: 'Комментарий должен содержать не менее 10 символов (осталось {count})',
      
      deleteConfirmation: 'Вы уверены, что хотите удалить фиксацию клиента {clientName}?',
      deleteWarning: 'Это действие нельзя отменить. Будут удалены фиксация и все связанные с ней сообщения в чате.',
      
      // Toast messages
      statusUpdated: 'Статус фиксации успешно обновлен на "{status}"',
      statusUpdateError: 'Ошибка при обновлении статуса фиксации',
      fixationDeleted: 'Фиксация успешно удалена',
      deleteError: 'Ошибка при удалении фиксации',
      fetchError: 'Ошибка при загрузке фиксаций',
      commentTooShort: 'Комментарий должен содержать не менее 10 символов',
      validDateRequired: 'Пожалуйста, выберите действительную дату',
      cancel: 'Отмена'
    },

    // Fixation Chat
    fixationChat: {
      title: 'Чат фиксации',
      messagePlaceholder: 'Введите сообщение...',
      send: 'Отправить',
      messageSent: 'Сообщение отправлено',
      messageError: 'Не удалось отправить сообщение',
      chatDataError: 'Не удалось загрузить данные чата',
      messagesError: 'Не удалось загрузить сообщения'
    },

    // Settings Page
    settings: {
      title: 'Настройки',
      profile: {
        title: 'Профиль',
        description: 'Управление настройками профиля',
        name: 'Имя',
        email: 'Email',
        password: 'Пароль',
        updateProfile: 'Обновить профиль',
        updatePassword: 'Изменить пароль',
        updateData: 'Обновить данные',
        newName: 'Новое имя',
        newPassword: 'Новый пароль',
        confirmPassword: 'Подтвердить пароль',
        currentPassword: 'Текущий пароль',
        updating: 'Обновление...',
        profileUpdated: 'Профиль успешно обновлен',
        passwordsNotMatch: 'Пароли не совпадают',
        passwordUpdated: 'Пароль успешно обновлен'
      },
      telegram: {
        title: 'Интеграция с Telegram',
        description: 'Подключите аккаунт Telegram для получения уведомлений',
        connected: 'Подключен',
        notConnected: 'Не подключен',
        connect: 'Подключить Telegram',
        disconnect: 'Отключить',
        connecting: 'Подключение...',
        chatId: 'ID чата',
        verificationCode: 'Код подтверждения',
        generateCode: 'Сгенерировать код',
        checkConnection: 'Проверить подключение',
        disconnectConfirm: 'Вы уверены, что хотите отключить Telegram?',
        connectedSuccess: 'Telegram успешно подключен',
        disconnectedSuccess: 'Telegram успешно отключен',
        connectionError: 'Ошибка подключения к Telegram',
        instructions: 'Для подключения Telegram нажмите кнопку ниже и следуйте инструкциям',
        step1: '1. Нажмите "Сгенерировать код" для получения кода подтверждения',
        step2: '2. Начните чат с ботом @{botUsername}',
        step3: '3. Отправьте код подтверждения боту',
        step4: '4. Нажмите "Проверить подключение" для проверки',
        openBot: 'Открыть бота',
        dialogTitle: 'Подключение телеграм бота',
        autoConnectInstructions: 'Нажмите кнопку ниже для автоматического подключения к боту. Вы будете перенаправлены в Telegram, где нужно будет нажать "Start".',
        codeLabel: 'Код верификации:',
        codeInstructions: 'Этот код будет автоматически передан боту',
        connectViaTelegram: 'Подключить через Telegram',
        waitingConnection: 'Ожидание подключения...'
      },
      contract: {
        title: 'Агентский договор',
        description: 'Статус договора на агентские услуги',
        signed: 'Подписан',
        notSigned: 'Не подписан',
        signContract: 'Подписать договор',
        viewContract: 'Просмотр договора',
        signDate: 'Подписан',
        allContracts: 'Все договоры',
        loading: 'Загрузка договоров...',
        developer: 'Застройщик',
        signedBy: 'Подписан',
        signing: 'Подписание...',
        contractSigned: 'Договор успешно подписан',
        contractTitle: 'ДОГОВОР ЦЕССИИ\nоб оказании информационно-технических услуг',
        agree: 'Я согласен с условиями договора',
        agreeRequired: 'Необходимо согласиться с условиями',
        warningTitle: 'Внимание',
        warningText: 'Пожалуйста, внимательно прочитайте договор перед подписанием. После подписания договор становится юридически обязательным документом.',
        userContractTitle: 'Договор пользователя:',
        // Full contract text
        contractText: `ДОГОВОР ЦЕССИИ
об оказании информационно-технических услуг

"IT Agent", именуемое в дальнейшем "Исполнитель", с одной стороны, и Застройщик, именуемый в дальнейшем "Заказчик", с другой стороны, заключили настоящий Договор о нижеследующем:

1. ПРЕДМЕТ ДОГОВОРА

1.1. Исполнитель обязуется предоставить Заказчику IT-платформу для размещения информации об объектах недвижимости и организации взаимодействия с агентами по недвижимости.

1.2. Заказчик обязуется оплачивать услуги Исполнителя в размере и порядке, установленном настоящим Договором.

2. ПРАВА И ОБЯЗАННОСТИ СТОРОН

2.1. Исполнитель обязуется:
2.1.1. Предоставить доступ к IT-платформе для размещения объектов недвижимости;
2.1.2. Обеспечивать техническое функционирование платформы;
2.1.3. Организовывать получение и обработку заявок от агентов;
2.1.4. Menyediakan alat untuk interaksi dengan agen real estat.

2.2. Klien berkomitmen untuk:
2.2.1. Tepat waktu menyediakan informasi terkini dan terpercaya tentang objek real estat;
2.2.2. Menjaga informasi tentang objek tetap terkini;
2.2.3. Tepat waktu membayar layanan sesuai dengan syarat Perjanjian ini;
2.2.4. Memberitahu Kontraktor tentang penjualan objek real estat melalui platform.

3. PROSEDUR PEMBAYARAN

3.1. Biaya layanan Kontraktor adalah 0,5% (nol koma lima persen) dari harga setiap objek real estat yang dijual melalui platform IT.

3.2. Komisi yang ditentukan dalam pasal 3.1 dibayar oleh Klien sebagai tambahan dari komisi standar kepada agen real estat (5%).

3.3. Pembayaran dilakukan dalam waktu 10 (sepuluh) hari perbankan sejak saat penandatanganan perjanjian jual beli real estat antara Klien dan pembeli yang didapat melalui platform IT.

3.4. Dasar untuk pembayaran adalah perjanjian jual beli yang ditandatangani dan pemberitahuan dari Klien tentang transaksi yang diselesaikan.

4. TANGGUNG JAWAB PARA PIHAK

4.1. Untuk tidak melaksanakan atau melaksanakan dengan tidak benar kewajiban berdasarkan Perjanjian ini, para pihak memikul tanggung jawab sesuai dengan hukum yang berlaku.

4.2. Dalam hal keterlambatan pembayaran, Klien membayar denda sebesar 0,1% dari jumlah pembayaran yang tertunggak untuk setiap hari keterlambatan.

5. JANGKA WAKTU PERJANJIAN

5.1. Perjanjian ini mulai berlaku sejak saat penandatanganan dan berlaku selama satu tahun.

5.2. Perjanjian diperpanjang secara otomatis untuk periode yang sama jika salah satu pihak tidak memberitahu pihak lain tentang penghentian 30 hari sebelum tanggal kedaluwarsa.

6. PROSEDUR PENYELESAIAN SENGKETA

6.1. Semua sengketa dan perselisihan diselesaikan melalui negosiasi.

6.2. Jika tidak mungkin mencapai kesepakatan, sengketa diselesaikan di pengadilan di lokasi Kontraktor.

7. KETENTUAN AKHIR

7.1. Perjanjian ini dibuat dalam dua salinan, memiliki kekuatan hukum yang sama, satu untuk setiap pihak.

7.2. Perubahan dan penambahan pada Perjanjian hanya berlaku jika dilakukan secara tertulis dan ditandatangani oleh kedua belah pihak.

8. TANDA TANGAN PARA PIHAK

KONTRAKTOR:                     KLIEN:
     IT Agent                                         Pengembang


_________________               _________________
  (подпись)                            (подпись)`,
        executor: 'ИСПОЛНИТЕЛЬ',
        customer: 'ЗАКАЗЧИК',
        signature: '(подпись)'
      },
      language: {
        title: 'Язык',
        description: 'Выберите предпочитаемый язык',
        english: 'Английский',
        russian: 'Русский',
        indonesian: 'Индонезийский'
      }
    }
  },
  id: {
    // Page 1: Summary
    title: 'Presentasi ROI Investor',
    logo: '',
    investmentSummary: 'Ringkasan Investasi',
    totalInvestment: 'Total Investasi',
    paybackPeriod: 'Periode Pengembalian (Tahun)',
    annualFinancials: 'Keuangan Tahunan',
    grossRentalIncome: 'Pendapatan Sewa Kotor',
    operatingExpenses: 'Biaya Operasional',
    noi: 'Pendapatan Operasional Bersih (NOI)',
    kpis: 'Indikator Kinerja Utama (KPI)',
    roi: 'Pengembalian Investasi (ROI)',
    footer: '',
    
    // Page 2: Detailed Inputs
    detailedInputsTitle: 'Data Input Terperinci',
    investmentCosts: 'Biaya Investasi',
    rentalIncomeData: 'Data Pendapatan Sewa',
    annualExpenses: 'Biaya Tahunan',
    page2Footer: 'Halaman 2 - Data terperinci',
    
    // Input Data Keys
    purchasePrice: 'Harga Pembelian',
    renovationCosts: 'Biaya Renovasi',
    legalFees: 'Biaya Hukum',
    additionalExpenses: 'Biaya Tambahan',
    investmentPeriod: 'Periode Investasi',
    dailyRate: 'Tarif Harian',
    occupancyRate: 'Tingkat Hunian (%)',
    daysPerYear: 'Hari per Tahun',
    otaCommission: 'Komisi OTA (%)',
    maintenanceFees: 'Biaya Pemeliharaan',
    utilityBills: 'Tagihan Utilitas',
    annualTax: 'Pajak Tahunan',

    // Page 3: Profitability
    profitabilityTitle: 'Prakiraan Profitabilitas per Tahun',
    year: 'Tahun',
    annualNetProfit: 'Laba Bersih Tahunan',
    accumulatedProfit: 'Akumulasi Laba',
    page3Footer: 'Halaman 3 - Prakiraan Profitabilitas',

    // Public ROI Page
    investorHighlights: 'Sorotan Investor',
    unitPrice: 'Harga Unit',
    averageROI: 'ROI Rata-rata',
    annualRentExpenseGrowth: 'Pertumbuhan Sewa yang Diproyeksikan',
    propertyManagementFee: 'Biaya Operasional',
    totalReturns: 'Total Pengembalian',
    cashFlow: 'Arus Kas',
    appreciation: 'Apresiasi',
    projectedCumulativeReturn: 'Proyeksi Pengembalian Kumulatif untuk {years} tahun',
    approximateUnitCost: 'Proyeksi Nilai Properti',
    income: 'Pendapatan',
    cumulativeIncome: 'Pendapatan Kumulatif',
    totalSpend: 'Total Pengeluaran',
    cumulativeSpend: 'Pengeluaran Kumulatif',
    cumulativeCashflow: 'Arus Kas Kumulatif',
    appreciationYoY: 'Apresiasi Properti',
    pessimistic: 'Pesimis',
    realistic: 'Realistis',
    optimistic: 'Optimis',
    tooltipTotalReturns: 'Jumlah arus kas dan apresiasi properti',
    tooltipCashFlow: 'Pendapatan sewa akumulatif dikurangi biaya',
    tooltipAppreciation: 'Pertumbuhan nilai properti selama periode konstruksi',
    tooltipApproximateUnitCost: 'Nilai properti yang diproyeksikan setelah apresiasi',
    yearNumber: 'Tahun',
    yearCalendar: 'Tahun Kalender',
    expenses: 'Pengeluaran',
    cumulativeExpenses: 'Pengeluaran Kumulatif',
    cumulativeCashFlow: 'Arus Kas Kumulatif',
    // Tooltips for Investor Highlights
    tooltipUnitPrice: 'Harga properti saat ini termasuk semua biaya awal',
    tooltipAverageROI: 'Pengembalian investasi tahunan rata-rata selama periode yang dipilih',
    tooltipAnnualGrowth: 'Tingkat pertumbuhan tahunan untuk harga sewa properti',
    tooltipManagementFee: 'Biaya pengelolaan properti, pemeliharaan, utilitas dan pajak',
    
    // Financial Summary Section
    annualRentalIncome: 'Pendapatan Sewa Tahunan',
    totalRoiForPeriod: 'Total ROI untuk Periode',
    yearsText: 'tahun',
    roiShort: 'ROI',
    paybackPeriodShort: 'Periode Pengembalian',
    
    // Error messages
    dataNotFound: 'Data Tidak Ditemukan',
    publicRoiNotAvailable: 'Halaman ROI publik tidak tersedia',
    
    // Common words
    close: 'Tutup',
    cancel: 'Batal',
    save: 'Simpan',

    // Navigation
    navigation: {
      adminPanel: 'Panel Admin',
      propertyGallery: 'Galeri Properti',
      complexGallery: 'Galeri Kompleks',
      properties: 'Properti',
      complexes: 'Kompleks',
      developers: 'Pengembang',
      landmarks: 'Landmark',
      chessboards: 'Papan Catur',
      support: 'Dukungan',
      roiCalculator: 'Kalkulator ROI',
      clientFixations: 'Fiksasi Klien',
      userManagement: 'Manajemen Pengguna',
      registrationRequests: 'Permintaan Registrasi',
      referralMap: 'Peta Referral',
      settings: 'Pengaturan'
    },

    // Client Fixations
    clientFixations: {
      title: 'Fiksasi Klien',
      refresh: 'Perbarui',
      loading: 'Memuat fiksasi...',
      noFixations: 'Tidak ada fiksasi',
      searchPlaceholder: 'Cari berdasarkan nama, telepon, agen, kompleks...',
      searchResults: 'Ditemukan: {count} dari {total} fiksasi',
      clearSearch: 'Hapus pencarian',
      noSearchResults: 'Tidak ditemukan hasil untuk pencarian Anda',
      
      // Status names
      statuses: {
        pending: 'Menunggu Persetujuan',
        approved: 'Diperbaiki',
        expired: 'Kedaluwarsa',
        rejected: 'Ditolak',
        approved_plural: 'Diperbaiki',
        expired_plural: 'Kedaluwarsa',
        rejected_plural: 'Ditolak',
        pending_plural: 'Menunggu Persetujuan'
      },
      
      // Filter section
      statusFilters: 'Filter diterapkan:',
      searchFilter: 'pencarian "{query}"',
      statusFilter: 'status "{status}"',
      total: 'Total',
      
      // Card fields
      phone: 'Telepon',
      agent: 'Agen',
      complex: 'Kompleks',
      developer: 'Pengembang',
      propertyType: 'Jenis Properti',
      rejectReason: 'Alasan penolakan',
      rejectedBy: 'Ditolak',
      validUntil: 'Berlaku hingga',
      
      // Actions
      accept: 'Terima',
      reject: 'Tolak',
      chatWithAgent: 'Chat dengan agen',
      delete: 'Hapus',
      
      // Dialog titles
      confirmFixation: 'Konfirmasi Fiksasi',
      rejectFixation: 'Tolak Fiksasi',
      deleteFixation: 'Hapus Fiksasi',
      
      // Dialog content
      validUntilLabel: 'Berlaku hingga',
      commentLabel: 'Komentar',
      commentRequired: 'wajib',
      commentPlaceholder: 'Harap sebutkan alasan penolakan fiksasi (minimal 10 karakter)',
      commentMinLength: 'Komentar harus mengandung minimal 10 karakter (tersisa {count})',
      
      deleteConfirmation: 'Apakah Anda yakin ingin menghapus fiksasi klien {clientName}?',
      deleteWarning: 'Tindakan ini tidak dapat dibatalkan. Fiksasi dan semua pesan chat terkait akan dihapus.',
      
      // Toast messages
      statusUpdated: 'Status fiksasi berhasil diperbarui menjadi "{status}"',
      statusUpdateError: 'Kesalahan saat memperbarui status fiksasi',
      fixationDeleted: 'Fiksasi berhasil dihapus',
      deleteError: 'Kesalahan saat menghapus fiksasi',
      fetchError: 'Kesalahan saat memuat fiksasi',
      commentTooShort: 'Komentar harus mengandung minimal 10 karakter',
      validDateRequired: 'Harap pilih tanggal yang valid',
      cancel: 'Batal'
    },

    // Fixation Chat
    fixationChat: {
      title: 'Chat Fiksasi',
      messagePlaceholder: 'Masukkan pesan...',
      send: 'Kirim',
      messageSent: 'Pesan berhasil dikirim',
      messageError: 'Gagal mengirim pesan',
      chatDataError: 'Gagal memuat data chat',
      messagesError: 'Gagal memuat pesan'
    },

    // Settings Page
    settings: {
      title: 'Pengaturan',
      profile: {
        title: 'Profil',
        description: 'Kelola pengaturan profil Anda',
        name: 'Nama',
        email: 'Email',
        password: 'Kata Sandi',
        updateProfile: 'Perbarui Profil',
        updatePassword: 'Ubah Kata Sandi',
        updateData: 'Perbarui Data',
        newName: 'Nama Baru',
        newPassword: 'Kata Sandi Baru',
        confirmPassword: 'Konfirmasi Kata Sandi',
        currentPassword: 'Kata Sandi Saat Ini',
        updating: 'Memperbarui...',
        profileUpdated: 'Profil berhasil diperbarui',
        passwordsNotMatch: 'Kata sandi tidak cocok',
        passwordUpdated: 'Kata sandi berhasil diperbarui'
      },
      telegram: {
        title: 'Integrasi Telegram',
        description: 'Hubungkan akun Telegram Anda untuk notifikasi',
        connected: 'Terhubung',
        notConnected: 'Tidak Terhubung',
        connect: 'Hubungkan Telegram',
        disconnect: 'Putuskan Koneksi',
        connecting: 'Menghubungkan...',
        chatId: 'ID Chat',
        verificationCode: 'Kode Verifikasi',
        generateCode: 'Buat Kode',
        checkConnection: 'Periksa Koneksi',
        disconnectConfirm: 'Apakah Anda yakin ingin memutuskan koneksi Telegram?',
        connectedSuccess: 'Telegram berhasil terhubung',
        disconnectedSuccess: 'Telegram berhasil diputuskan',
        connectionError: 'Kesalahan menghubungkan ke Telegram',
        instructions: 'Untuk menghubungkan Telegram, klik tombol di bawah dan ikuti instruksi',
        step1: '1. Klik "Buat Kode" untuk mendapatkan kode verifikasi',
        step2: '2. Mulai chat dengan bot @{botUsername}',
        step3: '3. Kirim kode verifikasi ke bot',
        step4: '4. Klik "Periksa Koneksi" untuk memverifikasi',
        openBot: 'Buka Bot',
        dialogTitle: 'Koneksi Bot Telegram',
        autoConnectInstructions: 'Klik tombol di bawah untuk koneksi bot otomatis. Anda akan dialihkan ke Telegram di mana Anda perlu menekan "Start".',
        codeLabel: 'Kode verifikasi:',
        codeInstructions: 'Kode ini akan secara otomatis diteruskan ke bot',
        connectViaTelegram: 'Hubungkan melalui Telegram',
        waitingConnection: 'Menunggu koneksi...'
      },
      contract: {
        title: 'Kontrak Agen',
        description: 'Status kontrak layanan agen',
        signed: 'Ditandatangani',
        notSigned: 'Belum Ditandatangani',
        signContract: 'Tandatangani Kontrak',
        viewContract: 'Lihat Kontrak',
        signDate: 'Ditandatangani pada',
        allContracts: 'Semua Kontrak',
        loading: 'Memuat kontrak...',
        developer: 'Pengembang',
        signedBy: 'Ditandatangani oleh',
        signing: 'Menandatangani...',
        contractSigned: 'Kontrak berhasil ditandatangani',
        contractTitle: 'PERJANJIAN PENGALIHAN\nuntuk menyediakan layanan informasi dan teknis',
        agree: 'Saya setuju dengan syarat dan ketentuan',
        agreeRequired: 'Anda harus menyetujui syarat dan ketentuan',
        warningTitle: 'Peringatan',
        warningText: 'Silakan baca kontrak dengan cermat sebelum menandatangani. Setelah menandatangani, kontrak menjadi dokumen yang sah secara hukum.',
        userContractTitle: 'Kontrak Pengguna:',
        // Full contract text
        contractText: `PERJANJIAN PENGALIHAN
untuk menyediakan layanan informasi dan teknis

"IT Agent", selanjutnya disebut "Kontraktor", di satu pihak, dan Pengembang, selanjutnya disebut "Klien", di pihak lain, telah menyepakati Perjanjian ini mengenai hal-hal berikut:

1. SUBJEK PERJANJIAN

1.1. Kontraktor berkomitmen untuk menyediakan platform IT kepada Klien untuk memposting informasi tentang objek real estat dan mengorganisir interaksi dengan agen real estat.

1.2. Klien berkomitmen untuk membayar layanan Kontraktor dalam jumlah dan cara yang ditetapkan oleh Perjanjian ini.

2. HAK DAN KEWAJIBAN PARA PIHAK

2.1. Kontraktor berkomitmen untuk:
2.1.1. Menyediakan akses ke platform IT untuk memposting objek real estat;
2.1.2. Memastikan fungsi teknis platform;
2.1.3. Mengorganisir penerimaan dan pemrosesan aplikasi dari agen;
2.1.4. Menyediakan alat untuk interaksi dengan agen real estat.

2.2. Klien berkomitmen untuk:
2.2.1. Tepat waktu menyediakan informasi terkini dan terpercaya tentang objek real estat;
2.2.2. Menjaga informasi tentang objek tetap terkini;
2.2.3. Tepat waktu membayar layanan sesuai dengan syarat Perjanjian ini;
2.2.4. Memberitahu Kontraktor tentang penjualan objek real estat melalui platform.

3. PROSEDUR PEMBAYARAN

3.1. Biaya layanan Kontraktor adalah 0,5% (nol koma lima persen) dari harga setiap objek real estat yang dijual melalui platform IT.

3.2. Komisi yang ditentukan dalam pasal 3.1 dibayar oleh Klien sebagai tambahan dari komisi standar kepada agen real estat (5%).

3.3. Pembayaran dilakukan dalam waktu 10 (sepuluh) hari perbankan sejak saat penandatanganan perjanjian jual beli real estat antara Klien dan pembeli yang didapat melalui platform IT.

3.4. Dasar untuk pembayaran adalah perjanjian jual beli yang ditandatangani dan pemberitahuan dari Klien tentang transaksi yang diselesaikan.

4. TANGGUNG JAWAB PARA PIHAK

4.1. Untuk tidak melaksanakan atau melaksanakan dengan tidak benar kewajiban berdasarkan Perjanjian ini, para pihak memikul tanggung jawab sesuai dengan hukum yang berlaku.

4.2. Dalam hal keterlambatan pembayaran, Klien membayar denda sebesar 0,1% dari jumlah pembayaran yang tertunggak untuk setiap hari keterlambatan.

5. JANGKA WAKTU PERJANJIAN

5.1. Perjanjian ini mulai berlaku sejak saat penandatanganan dan berlaku selama satu tahun.

5.2. Perjanjian diperpanjang secara otomatis untuk periode yang sama jika salah satu pihak tidak memberitahu pihak lain tentang penghentian 30 hari sebelum tanggal kedaluwarsa.

6. PROSEDUR PENYELESAIAN SENGKETA

6.1. Semua sengketa dan perselisihan diselesaikan melalui negosiasi.

6.2. Jika tidak mungkin mencapai kesepakatan, sengketa diselesaikan di pengadilan di lokasi Kontraktor.

7. KETENTUAN AKHIR

7.1. Perjanjian ini dibuat dalam dua salinan, memiliki kekuatan hukum yang sama, satu untuk setiap pihak.

7.2. Perubahan dan penambahan pada Perjanjian hanya berlaku jika dilakukan secara tertulis dan ditandatangani oleh kedua belah pihak.

8. TANDA TANGAN PARA PIHAK

KONTRAKTOR:                     KLIEN:
     IT Agent                                         Pengembang


_________________               _________________
  (tanda tangan)                       (tanda tangan)`,
        executor: 'KONTRAKTOR',
        customer: 'KLIEN',
        signature: '(tanda tangan)'
      },
      language: {
        title: 'Bahasa',
        description: 'Pilih bahasa yang Anda inginkan',
        english: 'Bahasa Inggris',
        russian: 'Bahasa Rusia',
        indonesian: 'Bahasa Indonesia'
      }
    }
  }
}; 