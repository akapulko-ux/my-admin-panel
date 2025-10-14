export const translations = {
  en: {
    leadForm: {
                    writeToAgent: 'Leave a request',
      writeInWhatsapp: 'Write in WhatsApp',
      leaveRequestToAgent: 'Leave a request to the agent',
      agentContactInfo: 'The agent will contact you in a convenient messenger to provide all details about the property',
      messengerLabel: 'Preferred messenger',
      whatsapp: 'Contact via WhatsApp',
      telegram: 'Contact via Telegram',
      manageProperty: 'Manage property',
      name: 'Name',
      phone: 'Phone',
      cancel: 'Cancel',
      send: 'Send',
      sentSuccess: 'Your request has been sent',
      sentError: 'Failed to send the request',
      accessError: 'Access error. Please try again.',
      serviceUnavailable: 'Service temporarily unavailable. Please try later.',
      errorPrefix: 'Error: ',
      addedByAgent: 'Added by agent',
      agentInfo: 'Agent Information',
      agentName: 'Agent Name',
      agentPhone: 'Agent Phone',
      agentEmail: 'Agent Email',
      clientLeadsTitle: 'Client Requests',
      clientLeadsSubtitle: 'Requests from clients for this property',
      noClientLeads: 'No client requests for this property yet',
      clientName: 'Client Name',
      clientPhone: 'Client Phone',
      clientMessenger: 'Preferred Messenger',
      requestDate: 'Request Date',
      phoneCopied: 'Phone number copied',
      copyPhoneTooltip: 'Copy phone number'
    },
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
    publicDocs: {
      title: 'View detailed information and documents',
      openAccess: 'Open access',
      modal: {
        title: 'Unlock full access',
        colOneTitle: 'Unlock this property',
        colOneDesc: 'One-time payment to view full details of this property, its complex, and documents.',
        colOnePrice: '$29',
        colOneButton: 'One-time purchase',
        colTwoTitle: 'Get full access to all listings',
        colTwoDesc: 'Subscription unlocks full information for all current and future properties for the duration of your plan.',
        colTwoPrice: '$99 / month',
        colTwoButton: 'Subscribe',
        close: 'Close'
      }
    },
    publicRoiNotAvailable: 'Public ROI page is not available',
    
    // Pricing modal
    pricing: {
      title: 'Choose Your Plan',
      subtitle: 'Select the plan that best fits your needs',
      oneTime: {
        badge: 'Popular',
        title: 'One-Time Access',
        description: 'Get complete information about a specific property with a one-time payment.',
        price: '$25',
        priceNote: 'One-time payment, lifetime access',
        featuresTitle: 'What\'s included:',
        features: {
          fullAccess: 'Full access to property details and documentation',
          documents: 'All legal documents and technical specifications',
          roiCalculator: 'ROI calculator and investment analysis',
          support: 'Email support for 30 days',
          lifetime: 'Lifetime access to purchased property'
        },
        note: 'Perfect for investors who want detailed information about a specific property.'
      },
      subscription: {
        badge: 'Best Value',
        title: 'Full Platform Access',
        description: 'Unlock all properties and premium features with our monthly subscription.',
        price: '$83',
        priceNote: 'Per month, cancel anytime',
        featuresTitle: 'What\'s included:',
        features: {
            allProperties: 'Full access to all properties in the listing',
            newListings: 'Early access to new properties before public release',
            prioritySupport: 'Professional customer support and assistance in chat',
            marketUpdates: 'Providing a unique listing link - your own website for receiving inquiries'
        },
        note: 'Ideal for real estate professionals and active investors.'
      },
      additionalInfo: {
        title: 'Additional Information',
        payment: {
          title: 'Payment Methods',
          description: 'We accept all major credit cards and bank transfers. All payments are processed securely.'
        },
        support: {
          title: 'Customer Support',
          description: 'Our support team is available 24/7 to help you with any questions or issues.'
        }
        },
        closeButton: 'Close',
        termsLink: 'Payment and Refund Terms',
        termsTitle: 'Payment and Refund Terms',
        terms: {
          payment: {
            title: 'Payment Terms',
            point1: 'All payments are processed securely through our payment partner.',
            point2: 'Payment is required before access to premium features is granted.',
            point3: 'Subscription payments are automatically renewed unless cancelled.',
            point4: 'We accept major credit cards and bank transfers.'
          },
          refund: {
            title: 'Refund Policy',
            point1: 'Refunds for one-time purchases are available within 14 days of purchase.',
            point2: 'Subscription cancellations take effect at the end of the current billing period.',
            point3: 'No refunds are provided for partial usage of subscription services.',
            point4: 'Refund requests must be submitted through our support system.'
          },
          access: {
            title: 'Access Terms',
            point1: 'Access to purchased content is granted immediately upon successful payment.',
            point2: 'Account access may be suspended for violations of our terms of service.'
          },
          liability: {
            title: 'Liability',
            point1: 'We are not responsible for any financial decisions made based on our content.',
            point2: 'Users are responsible for ensuring compliance with local laws and regulations.'
          }
        }
      },
    
    // Common words
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    logout: 'Logout',

    // Districts/Regions translations
    districts: {
      'Амед': 'Amed',
      'Берава': 'Berawa', 
      'Будук': 'Buduk',
      'Джимбаран': 'Jimbaran',
      'Кинтамани': 'Kintamani',
      'Кута': 'Kuta',
      'Кутух': 'Kutuh',
      'Ловина': 'Lovina',
      'Нуану': 'Nuanu',
      'Нуса Дуа': 'Nusa Dua',
      'Пандава': 'Pandawa',
      'Переренан': 'Pererenan',
      'Санур': 'Sanur',
      'Семиньяк': 'Seminyak',
      'Убуд': 'Ubud',
      'Улувату': 'Uluwatu',
      'Умалас': 'Umalas',
      'Унгасан': 'Ungasan',
      'Чандидаса': 'Candidasa',
      'Чангу': 'Canggu',
      'Чемаги': 'Cemagi',
      'Гили Траванган': 'Gili Trawangan',
      'Ломбок': 'Lombok',
      'Kab. Jembrana': 'Jembrana Regency',
      'Kab. Tabanan': 'Tabanan Regency',
      'Kab. Badung': 'Badung Regency',
      'Kab. Gianyar': 'Gianyar Regency',
      'Kab. Klungkung': 'Klungkung Regency',
      'Kab. Bangli': 'Bangli Regency',
      'Kab. Karangasem': 'Karangasem Regency',
      'Kab. Buleleng': 'Buleleng Regency',
      'Kota Denpasar': 'Denpasar City'
    },

    // Land Status translations
    landStatus: {
      'Туристическая зона (W)': 'Tourist Zone (W)',
      'Торговая зона (K)': 'Commercial Zone (K)',
      'Смешанная зона (C)': 'Mixed Zone (C)',
      'Жилая зона (R)': 'Residential Zone (R)',
      'Сельхоз зона (P)': 'Agricultural Zone (P)',
      'Заповедная зона (RTH)': 'Protected Zone (RTH)'
    },

    // Navigation
    navigation: {
      adminPanel: 'Admin Panel',
      propertyGallery: 'Properties Gallery',
      publicGallery: 'Public Gallery',
      publicInvestorTitle: 'IT AGENT BALI',
      clientLeads: 'Client Leads',
      complexGallery: 'Complexes Gallery',
      properties: 'Properties',
      complexes: 'Complexes',
      developers: 'Developers',
      landmarks: 'Landmarks',
      chessboards: 'Chessboards',
      support: 'Support',
      roiCalculator: 'ROI Calculator',
      clientFixations: 'Client Fixations',
      userManagement: 'Users',
      generalOverview: 'General Overview',
              registrationRequests: 'Developer Requests',
      referralMap: 'Referral Map',
      settings: 'Settings',
      education: 'Education',
      premiumFeatures: 'Premium Subscription',
      notifications: 'Notifications',
      publicPage: 'Public Page',
      agentProperties: 'Agent Properties',
      premiumSubscriptionTooltip: 'Available in premium subscription',
      // CRM System
      crmSystem: 'CRM System',
      deals: 'Deals',
      tasks: 'Tasks',
      lists: 'Lists',
      agentRegistrationRequests: 'Agent Requests',
      technicalSupervision: 'Technical Supervision',
      // Dashboard
      dashboard: 'Dashboard',
      appStatistics: 'App Statistics'
    },
    

    

    // Public menu
    publicMenu: {
      favorites: 'Favorites',
      services: 'Services',
      loginRegister: 'Login / Register',
      account: 'My Account',
      subscription: 'Subscription',
      servicesList: {
        legalDueDiligence: 'Detailed legal due diligence',
        constructionSupervision: 'Construction technical supervision',
        constructionAcceptance: 'Construction acceptance',
        constructionManagement: 'Custom house construction',
        architecturalDesign: 'Architectural design'
      }
    },
    favorites: {
      createPDF: 'Create PDF',
      selectLanguagePDF: 'Select language for PDF',
      generatingPDF: 'Generating PDF...',
      withTitle: 'with title',
      pdfCreated: 'PDF created'
    },
    publicFavorites: {
      generateLink: 'Generate public link'
    },
    subscriptionModal: {
      title: 'Premium subscription',
      description: 'Get full access to all current and future listings with verified documents and professional tools.',
      features: [
        'Full information for all properties',
        'Documents and legal details',
        'Priority updates and new listings',
        'Personal link for collecting client leads'
      ],
      price: '$99 / month',
      subscribeButton: 'Subscribe'
    },
    paymentModal: {
      supportText: 'If you have difficulties with payment or activating the Premium subscription, message our support and we will provide full assistance',
      supportButton: 'Message support'
    },
    accountPage: {
      title: 'My Account',
      premiumBadge: 'Premium',
      premiumDeveloperBadge: 'Premium Developer',
      logout: 'Logout',
      myProperties: 'My Properties',
      myLeads: 'My Leads',
      noProperties: 'You have not added any properties yet',
      noLeads: 'You have no leads yet',
      goToProperty: 'Go to property',
      premiumLinkTitle: 'Your personal public gallery link',
      premiumLinkDescription: 'Share this link with your clients. They will see the entire catalog of properties and can contact you directly from any property they like.',
      premiumLinkLabel: 'Personal link',
      copyButton: 'Copy',
      copiedMessage: 'Link copied',
      premiumOnlyMessage: 'The link is available only for premium subscribers',
      subscribeButton: 'Subscribe',
      profileTitle: 'Profile',
      profile: {
        name: 'Name',
        email: 'Email',
        language: 'Language',
        telegram: 'Telegram',
        phone: 'Phone',
        save: 'Save changes',
        saved: 'Profile saved',
        saveError: 'Failed to save profile'
      }
    },

    // Public Page
    publicPage: {
      uploadCover: 'Upload cover',
      expand: 'Expand',
      collapse: 'Collapse',
      complexesListTitle: 'Complexes list',
      rentingLabel: 'Renting',
      propertiesListTitle: 'Properties list',
      agentLink: 'Public link'
    },

    // Shared Gallery Page for Premium Agent
    sharedGalleryPage: {
      premiumRequiredTitle: 'Premium required',
      premiumRequiredMessage: 'To use this page, please upgrade to a Premium subscription.',
      goToMain: 'Go to public page'
    },

    // Agent info panel
    agentInfo: {
      title: 'Agent',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      language: 'Language',
      telegram: 'Telegram',
      userId: 'User ID',
      createdAt: 'Created at',
      notFound: 'Agent info not found'
    },

    // Registration Requests Page
    registrationRequestsPage: {
      title: 'Developer Requests',
      noRequests: 'No registration requests',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      position: 'Position',
      applicationDate: 'Application Date',
      takeInWork: 'Take in Work',
      approve: 'Approve',
      reject: 'Reject',
      statusUpdated: 'Request status updated',
      statusUpdateError: 'Failed to update request status',
      positions: {
        owner: 'Owner',
        manager: 'Manager',
        marketer: 'Marketer',
        agent: 'Agent'
      }
    },

    // Deals (CRM)
    deals: {
      title: 'DEALS',
      searchPlaceholder: 'Search and filter',
      settings: 'SETTINGS',
      newDeal: 'NEW DEAL',
      
      // Statistics
      todayTasks: 'Today\'s tasks',
      noTasks: 'Without tasks',
      overdue: 'Overdue',
      newTodayYesterday: 'New today / yesterday',
      salesForecast: 'Sales forecast',
      noData: 'No data',
      
      // Pipeline stages
      firstContact: 'FIRST CONTACT',
      negotiations: 'NEGOTIATIONS', 
      decisionMaking: 'MAKING DECISION',
      booking: 'BOOKING',
      
      // Deal card
      noTask: 'No task',
      today: 'Today',
      
      // Deal form
      quickAdd: 'Quick add',
      dealName: 'Deal name',
      contact: 'Contact',
      contactName: 'Contact: Name',
      contactPhone: 'Contact: Phone',
      contactEmail: 'Contact: Email',
      company: 'Company',
      companyName: 'Company: Name',
      companyAddress: 'Company: Address',
      add: 'Add',
      cancel: 'Cancel',
      
      // Settings modal
      dealNamePlaceholder: 'Deal name'
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
      cancel: 'Cancel',
      
      // System messages for fixation status changes
      systemMessages: {
        approved: 'Your client {clientName} {clientPhone} has been fixed with developer {developerName} until {validUntil}',
        rejected: 'Your fixation request for client {clientName} {clientPhone} with developer {developerName} has been rejected. Reason: {reason}',
        expired: 'Your fixation for client {clientName} {clientPhone} with developer {developerName} has expired on {expiredDate}'
      }
    },

    // Fixation Chat
    fixationChat: {
      title: 'Fixation Chat',
      messagePlaceholder: 'Enter message...',
      send: 'Send',
      messageSent: 'Message sent',
      messageError: 'Failed to send message',
      chatDataError: 'Failed to load chat data',
      messagesError: 'Failed to load messages',
      // Image viewing
      imageError: 'Image loading error',
      imageLoadError: 'Try again',
      downloadImage: 'Download',
      shareImage: 'Share',
      deleteImage: 'Delete',
      closeImage: 'Close',
      imageShareTitle: 'Image from chat',
      imageShareText: 'Check out this image',
      messageDeleted: 'Message deleted',
      deleteMessageError: 'Failed to delete message'
    },

    // Settings Page
    settings: {
      title: 'Settings',
      profile: {
        title: 'Profile',
        description: 'Manage your profile settings',
        name: 'Name',
        email: 'Email',
        role: 'Role',
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
        passwordUpdated: 'Password updated successfully',
        editProfileTitle: 'Edit Profile',
        userName: 'Username',
        userNamePlaceholder: 'Enter username',
        emailCannotBeChanged: 'Email cannot be changed',
        changePassword: 'Change Password',
        changePasswordDescription: 'Leave fields empty if you don\'t want to change password',
        newPasswordPlaceholder: 'Enter new password',
        confirmPasswordPlaceholder: 'Confirm new password',
        saving: 'Saving...',
        notSpecified: 'Not specified',
        notSpecifiedEmail: 'Not specified',
        roleNotDefined: 'Not defined',
        noSignedContracts: 'No signed contracts yet',
        user: 'User',
        signDate: 'Sign Date',
        developer: 'Developer'
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

3.1. The cost of the Contractor's services is 0.5% (zero point five percent) of the price of each real estate object sold through the IT platform. For the first 2 completed deals, the platform commission is not charged.

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
        signature: '(signature)',
        createdAt: 'Created',
        updatedAt: 'Updated'
      },
      language: {
        title: 'Language',
        description: 'Select your preferred language',
        english: 'English',
        russian: 'Russian',
        indonesian: 'Indonesian'
      }
    },

    // Complexes Gallery
    complexesGallery: {
      title: 'Complexes Gallery',
      loadingText: 'Loading complexes...',
      searchPlaceholder: 'Search by name, developer, district...',
      filtersTitle: 'Filters',
      resetAllFilters: 'Reset all',
      priceLabel: 'Price (USD)',
      pricePlaceholderFrom: 'From',
      pricePlaceholderTo: 'To',
      developerLabel: 'Developer',
      allDevelopers: 'All developers',
      districtLabel: 'District', 
      allDistricts: 'All districts',
      provinceLabel: 'Province',
      allProvinces: 'All provinces',
      landStatusLabel: 'Land Status',
      allStatuses: 'All statuses',
      ownershipFormLabel: 'Ownership Form',
      allForms: 'All forms',
      resultsText: 'Found: {found} of {total} complexes',
      emptyStateNoDeveloperComplexes: 'You don\'t have any complexes in the system yet',
      emptyStateNoComplexes: 'No complexes found',
      emptyStateNoMatches: 'No complexes match the specified criteria',
      complexAltText: 'Complex',
      noNameText: 'Unnamed',
      complexNumberPrefix: 'Complex #',
      priceFromPrefix: 'from',
      developerPrefix: 'Developer:',
      districtPrefix: 'District:',
      completionPrefix: 'Completion:',
      createdAt: 'Created',
      updatedAt: 'Updated'
    },

    // Complex Detail
    complexDetail: {
      loadingText: 'Loading complex...',
      accessDenied: 'Access Denied',
      accessDeniedMessage: 'You do not have permission to view this complex',
      complexNotFound: 'Complex Not Found',
      complexNotFoundMessage: 'Complex with the specified ID does not exist',
      backButton: 'Back',
      cancelButton: 'Cancel',
      saveButton: 'Save',
      editButton: 'Edit',
      removeFromListing: 'Remove from listing',
      returnToListing: 'Return to listing',
      removedFromListing: 'Removed from listing',
      addPhotoButton: 'Add Photo',
      uploadingText: 'Uploading...',
      watchVideoButton: 'Complex Video',
      view3DTourButton: 'View 3D Tour',
      buildingProgressButton: 'Building Progress',
      openChessboardButton: 'Objects Chessboard',
      linksAndDocuments: 'Links and Documents',
      description: 'Description',
      translating: 'Translating...',
      priceFromLabel: 'Price from',
      priceMinFromObjects: '(minimum from objects)',
      priceFromComplex: '(complex price)',
      commissionLabel: 'Commission',
      developerLabel: 'Developer',
      districtLabel: 'District',
      completionDateLabel: 'Completion Date',
      coordinatesLabel: 'Coordinates',
      videoLabel: 'Video',
      tourLabel: '3D Tour',
      masterPlanLabel: 'Master Plan',
      pricePlaceholder: 'Price in USD',
      descriptionPlaceholder: 'Complex description',
      videoLinkPlaceholder: 'Video link',
      tourLinkPlaceholder: '3D tour link',
      masterPlanLinkPlaceholder: 'Master plan link',
      viewMasterPlanButton: 'View Master Plan',
      photoAltText: 'Photo',
      autoCalculatedPriceText: 'Automatically calculated as minimum price among complex objects',
      changesSaved: 'Changes saved',
      saveError: 'Error saving changes',
      editPermissionError: 'You do not have permission to edit this complex',
      photosUploadSuccess: 'Photos uploaded successfully',
      photosUploadError: 'Error uploading photos',
      photoNotFound: 'Photo not found',
      photoDeleteSuccess: 'Photo deleted successfully',
      photoLinkDeleted: 'Photo link removed from database',
      photoDeleteError: 'Error deleting photo',
      databaseUpdateError: 'Failed to update database information',
      dataLoadError: 'Error loading complex data',
      developerLoadError: 'Error loading developer',
      complexNameLoadError: 'Error loading complex name',
      createdAt: 'Created',
      updatedAt: 'Updated',
      
      // Additional Options
      additionalOptions: 'Additional Options',
      onComplexTerritory: 'On Complex Territory',
      
      // Option badges
      spaSalon: 'SPA Salon',
      restaurant: 'Restaurant',
      fitnessGym: 'Fitness Gym',
      playground: 'Playground',
      shop: 'Shop',
      cinema: 'Cinema',
      coworking: 'Coworking',
      concertHall: 'Concert Hall',
      parking: 'Parking',
      artificialWave: 'Artificial Wave',
      conferenceHall: 'Conference hall'
    },

    // Properties Gallery
    propertiesGallery: {
      title: 'Properties Gallery',
      developerPropertiesTitle: 'Developer Properties',
      searchPlaceholder: 'Search by name, district or type...',
      statusLabel: 'Status',
      filtersTitle: 'Filters',
      priceLabel: 'Price (USD)',
      pricePlaceholderFrom: 'From',
      pricePlaceholderTo: 'To',
      areaLabel: 'Area (m²)',
      bedroomsLabel: 'Bedrooms',
      allBedrooms: 'All',
      studio: 'Studio',
      bedroomsText: 'Bedrooms',
      unitsCountText: 'Units Count',
      districtLabel: 'District',
      allDistricts: 'All districts',
      typeLabel: 'Type',
      allTypes: 'All types',
      resetFiltersButton: 'Reset filters',
      searchResultsText: 'Properties found: {count}',
      emptyStateNoDeveloperProperties: 'You don\'t have any properties in the system yet',
      emptyStateNoProperties: 'No properties found',
      emptyStateNoMatches: 'No properties match the specified criteria',
      propertyAltText: 'Property',
      missingFieldsTitle: 'Missing fields',
      newPricePlaceholder: 'New price',
      areaText: 'm²',
      developerText: 'Developer:',
      editPermissionError: 'You do not have permission to edit price',
      priceValidationError: 'Please enter a valid price',
      priceUpdateSuccess: 'Price updated successfully',
      priceUpdateError: 'Failed to update price',
      complexLoadError: 'Error loading complex name',
      developerLoadError: 'Error loading developer',
      createdAt: 'Created',
      updatedAt: 'Updated',
      addedByMe: 'Added by me',
      allStatuses: 'All Statuses',
      statusProject: 'Project',
      statusUnderConstruction: 'Under Construction',
      statusReady: 'Ready',
      statusFromOwner: 'From Owner',
      // Selection mode texts
      selectionTitle: 'Property Selection',
      selectionSubtitle: 'Curated by AI assistant specifically for you',
      selectionResultsText: 'Found {count} property(ies) in selection'
    },

    // Property Detail
    propertyDetail: {
      // Loading states
      loading: 'Loading...',
      uploading: 'Uploading...',
      
      // Navigation
      backButton: 'Back',
      backToGallery: 'Back to Gallery',
      onMap: 'on map',
      
      // Buttons
      editButton: 'Edit',
      saveButton: 'Save',
      cancelButton: 'Cancel',
      addPhotoButton: 'Add Photo',
      addPhotoButtonSimple: 'Add Photo',
      createObjectButton: 'Create Object',
      creatingText: 'Creating...',
      viewButton: 'View',
      updateButton: 'Update',
      uploadButton: 'Upload',
      fileTooLarge: 'File exceeds 20 MB. Reduce file size below 20 MB and try again.',
      roiCalculatorButton: 'ROI Calculator',
      // Agent chats
      agentChatsTitle: 'Chats for this property',
      openChat: 'Open chat',
      chatDialogTitle: 'Conversation',
      loadingMessages: 'Loading messages…',
      propertyCardMessage: 'Property card',
      noChats: 'No chats for this property yet',
      applicationFromAgent: 'Application from agent',
      messagePlaceholder: 'Enter message...',
      sendButton: 'Send',
      
      // Field labels
      bedrooms: 'Bedrooms',
      pricePerSqm: 'Price per m²',
      studio: 'Studio',
      unitsCount: 'Units Count',
      reliabilityRating: 'Reliability Rating',
      reliabilityRatingTooltip: 'Reliability rating of the property.\nCompiled based on the provided documents, the developer\'s experience, and delivered projects.',
      area: 'Living Area',
      areaTooltip: 'Only living area of the property (kitchen, living room, bedrooms, bathrooms)',
      totalArea: 'Total Area',
      totalAreaTooltip: 'Total area of the property - living area + common areas (terrace, balcony, rooftop, barbecue, jacuzzi, etc.)',
      developer: 'Developer',
      complex: 'Complex',
      propertyName: 'Name',
      managementCompany: 'Management Company',
      bathrooms: 'Bathrooms',
      floors: 'Floors',
      district: 'District',
      buildingType: 'Building Type',
      constructionStatus: 'Construction Status',
      distanceToBeach: 'Distance to beach',
      distanceToCenter: 'Distance to center',
      kmUnit: 'km',
      manualRoi: 'ROI (%)',
      manualRoiPlaceholder: 'Enter ROI percentage',
      expectedRoi: 'Expected ROI (%)',
      expectedRoiPlaceholder: 'Enter expected ROI percentage',
      expectedRoiTooltip: 'Expected annual rental yield of the property, calculated by the developer',
      landArea: 'Land Area',
      landAreaPlaceholder: 'Enter land area in m²',
      landAreaTooltip: 'Area of the land plot on which this property is located',
      expectedCost: 'Expected Cost',
      expectedCostPlaceholder: 'Enter expected cost in USD',
      expectedCostTooltip: 'Estimated cost of the property at the time of construction completion and commissioning',
      landStatus: 'Land Status',
      pool: 'Pool',
      ownership: 'Ownership',
      completionDate: 'Completion Date',
      years: 'years',
      description: 'Description',
      
      // Agent Property Create specific fields
      pricePlaceholder: 'Price *',
      areaPlaceholder: 'Living Area *',
      bedroomsLabel: 'Bedrooms',
      statusLabel: 'Status',
      ownershipFormLabel: 'Ownership Form',
      descriptionPlaceholder: 'Property Description',
      
      // Photo counter
      photoCounter: 'Photos: {current} / {total}',
      swipeHint: 'Swipe left/right to switch photos',
      
      // Document labels
      documentsSection: 'Documents',
      characteristicsSection: 'Characteristics',
      legalCompanyName: 'Legal Company Name:',
      taxNumber: 'Tax Number (NPWP):',
      landUsePermit: 'Land Use Permit (PKKPR):',
      landRightsCertificate: 'Land Rights Certificate (SHGB):',
      landLeaseEndDate: 'Land Lease End Date:',
      buildingPermit: 'Building Permit (PBG):',
      buildingPermitIMB: 'Building Permit (IMB):',
      buildingReadinessCertificate: 'Building Readiness Certificate (SLF):',
      layout: 'Unit Layout:',
      dueDiligence: 'Due Diligence:',
      unbrandedPresentation: 'Complex Presentation:',
      pkkprFile: 'PKKPR File:',
      
      // Options
      typeOptions: {
        villa: 'Villa',
        apartment: 'Apartment',
        house: 'House',
        duplex: 'Duplex',
        commercial: 'Commercial Property',
        apartVilla: 'Apart-Villa',
        townhouse: 'Townhouse',
        penthouse: 'Penthouse',
        land: 'Land Plot'
      },

      // Translation Manager
      translationManager: {
        title: 'Translation Manager',
        originalDescription: 'Original Description',
        noDescription: 'No description',
        availableTranslations: 'Available Translations',
        delete: 'Delete',
        deleteAll: 'Delete All',
        noTranslations: 'No translations available',
        noTranslationsHint: 'Translations will appear here when users view the property in different languages',
        stats: 'Translation Statistics',
        totalTranslations: 'Total translations',
        languages: 'Languages'
      },
      
      buildingTypeOptions: {
        newComplex: 'New Complex',
        renovation: 'Renovation',
        individual: 'Individual',
        hotel: 'Hotel',
        resort: 'Resort'
      },
      
      statusOptions: {
        project: 'Project',
        underConstruction: 'Under Construction',
        ready: 'Ready',
        fromOwner: 'From Owner'
      },
      
      poolOptions: {
        no: 'No',
        private: 'Private',
        shared: 'Shared'
      },
      
      ownershipOptions: {
        leasehold: 'Leashold',
        freehold: 'Freehold'
      },
      
      // Messages
      notSelected: '(not selected)',
      notFound: 'Property not found',
      accessDenied: 'Access denied',
      fileNotUploaded: 'File not uploaded',
      floorText: 'floor',
      floorsText: 'floors',
      
      // Success messages
      changesSaved: 'Changes saved successfully',
      photoUploaded: 'Photos uploaded successfully',
      photoDeleted: 'Photo deleted successfully',
      photoLinkDeleted: 'Photo link removed from database',
      
      // Service verification badge
      serviceVerified: 'Service Verified',
      serviceVerifiedTooltip: 'This mark means the developer and their properties have passed an initial document check in the following categories:\n• Legal company name\n• Company tax number\n• Presence of a land use permit\n• Presence of land rights certificates\n• Presence of a building/operation permit (or a registered application number)\n• Compliance with land designation and zoning color',
      premiumOnlyTooltip: 'Only available for premium developers',
      removedFromListing: 'Removed from listing',
      removeFromListing: 'Remove from listing',
      returnToListing: 'Return to listing',
      
      // Error messages
      editPermissionError: 'You do not have permission to edit this property',
      saveError: 'An error occurred while saving changes',
      photoUploadError: 'An error occurred while uploading photos',
      photoDeleteError: 'An error occurred while deleting photo',
      fileUploadError: 'An error occurred while uploading file',
      databaseUpdateError: 'Could not update database information',
      developerLoadError: 'Error loading developer',
      complexLoadError: 'Error loading complex',
      documentValidationError: 'Only numbers, commas, dots, and dashes are allowed',
      documentValidationPlaceholder: 'Only numbers, commas, dots, dashes',
      
      // Lightbox
      photo: 'Photo',
      createdAt: 'Created',
      updatedAt: 'Updated',
      
      // Additional Options
      additionalOptions: 'Additional Options',
      onComplexTerritory: 'On Complex Territory',
      
      // Option badges
      smartHome: 'Smart Home',
      jacuzzi: 'Jacuzzi',
      terrace: 'Terrace',
      rooftop: 'Rooftop',
      balcony: 'Balcony',
      bbq: 'BBQ',
      furniture: 'Full Furnishing',
      washingMachine: 'Washing Machine',
      spaSalon: 'SPA Salon',
      restaurant: 'Restaurant',
      fitnessGym: 'Fitness Gym',
      playground: 'Playground',
      shop: 'Shop',
      cinema: 'Cinema',
      coworking: 'Coworking',
      concertHall: 'Concert Hall',
      parking: 'Parking',
      agentCommission: 'Agent Commission'
    },

    // Chessboards
    chessboards: {
      title: 'Chessboards',
      createChessboard: 'Create Chessboard',
      createFirstChessboard: 'Create First Chessboard',
      noChessboards: 'No created chessboards',
      noChessboardsDescription: 'Create the first chessboard to manage object layout',
      deleteConfirmTitle: 'Confirm Deletion',
      deleteConfirmText: 'Are you sure you want to delete chessboard "{name}"?',
      chessboardDeleted: 'Chessboard deleted!',
      deleteError: 'Error deleting chessboard',
      publicLinkCopied: 'Public link copied!',
      
      // Table headers and labels
      complex: 'Complex:',
      totalUnits: 'Total units:',
      sections: 'Sections:',
      floors: 'Floors:',
      rows: 'Rows:',
      publicLinkAvailable: 'Public link available',
      created: 'Created:',
      loading: 'Loading...',
      untitled: 'Untitled',
      open: 'Open',
      delete: 'Delete',
      copyLink: 'Copy link',
      openInNewTab: 'Open in new tab',
      
      // Status badges
      free: 'Free: {count}',
      booked: 'Booked: {count}',
      sold: 'Sold: {count}',
      
      // Chessboard page
      chessboardName: 'Chessboard Name',
      selectComplex: 'Select Complex',
      noComplexSelected: 'No complex selected',
      nameRequired: 'Chessboard name is required',
      save: 'Save',
      deleteChessboard: 'Delete',
      addSection: 'Add Section',
      exchangeRate: 'Exchange Rate (USD to IDR)',
      
      // Sections and floors
      sectionName: 'Section Name',
      addFloor: 'Add Floor',
      floor: 'Floor',
      addUnit: 'Add Unit',
      
      // Units
      unitId: 'Unit ID',
      rooms: 'Rooms',
      bathrooms: 'Bathrooms',
      area: 'Area (m²)',
      priceUSD: 'Price (USD)',
      priceIDR: 'Price (IDR)',
      showIDRPrice: 'Show IDR price',
      propertyType: 'Property Type',
      view: 'View',
      status: 'Status',
      
      // Options
      roomOptions: {
        studio: 'Studio',
        one: '1',
        two: '2',
        three: '3',
        four: '4',
        five: '5',
        six: '6'
      },
      
      bathroomOptions: {
        one: '1',
        two: '2',
        three: '3',
        four: '4',
        five: '5',
        six: '6'
      },
      
      propertyTypes: {
        apartments: 'Apartments',
        villa: 'Villa',
        apartVilla: 'Apart-Villa',
        townhouse: 'Townhouse',
        penthouse: 'Penthouse'
      },
      
      views: {
        notSelected: 'Not specified',
        ocean: 'Ocean',
        jungle: 'Jungle',
        pool: 'Pool',
        river: 'River',
        yard: 'Yard',
        volcano: 'Volcano',
        riceTerraces: 'Rice Terraces'
      },
      
      statuses: {
        free: 'Free',
        booked: 'Booked',
        sold: 'Sold'
      },
      
      // Actions
      copy: 'Copy',
      remove: 'Remove',
      moveUp: 'Move Up',
      moveDown: 'Move Down',
      
      // Messages
      chessboardSaved: 'Chessboard saved successfully',
      chessboardDeletedSuccess: 'Chessboard deleted successfully',
      saveError: 'Error saving chessboard',
      loadError: 'Error loading chessboard',
      complexLoadError: 'Error loading complexes',
      chessboardNotFound: 'Chessboard not found',
      accessDenied: 'Access denied',
      validationError: 'Please fix validation errors before saving',
      
      // Validation messages
      nameRequiredError: 'Chessboard name is required',
      sectionNameRequired: 'Section name is required',
      duplicateFloor: 'Duplicate floor number',
      unitIdRequired: 'Unit ID is required',
      invalidArea: 'Invalid area value',
      invalidPrice: 'Invalid price value',
      complexRequired: 'Please select a complex',
      
      // Additional editing texts
      editingChessboard: 'Editing Chessboard',
      backToList: 'Back to List',
      noAvailableComplexes: 'No available complexes without chessboard',
      floorButton: 'Floor',
      noComplexesForDeveloper: 'No available complexes for developer "{name}" without chessboard',
      
      // Unit form labels
      chessboardFloors: 'Floors',
      chessboardArea: 'Area (m²)',
      chessboardRooms: 'Bedrooms',
      chessboardBathrooms: 'Bathrooms',
      chessboardView: 'View',
      side: 'Side',
      priceWithRate: 'Price (USD → IDR)',
      enterPrice: 'Enter price',
      showPriceOnPublic: 'Show price on public page',
      showPrice: 'Show price',
      
      // Floor form labels
      noNumber: 'No number',
      floorType: 'floor',
      rowType: 'row',
      unitButton: 'Unit',
      
      // Side options
      sideOptions: {
        notSpecified: 'Not specified',
        sunrise: 'Sunrise',
        sunset: 'Sunset'
      },
      
      // Status options with prefixes
      statusOptions: {
        free: '✓ Free',
        booked: '⏳ Booked',
        sold: '✖ Sold'
      },
      
      // Additional features
      features: {
        rooftop: 'Rooftop',
        terrace: 'Terrace'
      },
      createdAt: 'Created',
      updatedAt: 'Updated'
    },

    // ROI Calculator
    roiCalculator: {
      title: 'ROI Calculation',
      close: '✕',
      
      // Sections
      costsInvestmentsTitle: 'Costs and Investments',
      calculationOptionsTitle: 'Calculation Options',
      rentalIncomeTitle: 'Rental Income',
      operationalMetricsTitle: 'Operating Expenses',
      calculationResults: 'Calculation Results',
      
      // Cost and Investment Fields
      propertyPrice: 'Property Price ($)',
      renovationCosts: 'Renovation and Furnishing ($)',
      legalFees: 'Legal Expenses ($)',
      additionalExpenses: 'Additional Expenses ($)',
      investmentPeriod: 'Investment Period (years)',
      selectPeriod: 'Select period',
      years3: '3 years',
      years5: '5 years',
      years10: '10 years',
      years20: '20 years',
      years30: '30 years',
      
      // Rental Income Fields
      dailyRate: 'Daily Rate ($)',
      occupancyRate: 'Occupancy Rate (%)',
      rentGrowthRate: 'Rent Growth Rate per Year (%)',
      operationStartYear: 'Operation Start After (year)',
      
      // Operational Metrics Fields
      maintenanceFees: 'Maintenance per Year (%)',
      utilityBills: 'Utility Bills per Year (%)',
      annualTax: 'Annual Tax (%)',
      propertyManagement: 'Property Management (%)',
      appreciationYear1: 'Property Appreciation Year 1 (%)',
      appreciationYear2: 'Property Appreciation Year 2 (%)',
      appreciationYear3: 'Property Appreciation Year 3 (%)',
      examplePlaceholder: 'Example: 5',
      examplePlaceholder2: 'Example: 3',
      examplePlaceholder3: 'Example: 2',
      
      // Scenario Selection
      calculationScenario: 'Calculation Scenario',
      selectScenario: 'Select scenario',
      pessimistic: 'Pessimistic (70%)',
      realistic: 'Realistic (100%)',
      optimistic: 'Optimistic (130%)',
      
      // Information Messages
      requiredFieldsTitle: 'To perform calculation, fill in the following required fields:',
      requiredFields: [
        '• Property price',
        '• Daily rental rate',
        '• Occupancy percentage'
      ],
      optionalFieldsNote: 'Other fields are optional for more accurate calculation.',
      
      // Buttons
      updateCalculation: 'Update Calculation',
      saveCalculation: 'Save Calculation',
      createPublicPage: 'Create Public Page',
      copyLink: '📋 Copy Link',
      
      // Result Cards
      totalInvestments: 'Total Investments',
      annualRentalIncome: 'Annual Rental Income',
      annualExpenses: 'Annual Expenses',
      netProfitPerYear: 'Net Profit per Year',
      roi: 'ROI',
      paybackPeriod: 'Payback Period',
      years: 'years',
      totalRoiPeriod: 'Total ROI for Period',
      propertyAppreciation: 'Property Appreciation',
      finalPropertyValue: 'Final Property Value',
      
      // Chart
      period: 'Period',
      year: 'Year',
      profitPerYear: 'Profit per Year',
      accumulatedProfit: 'Accumulated Profit',
      propertyValue: 'Property Value',
      noChartData: 'No data to display chart',
      
      // Success/Error Messages
      calculationSaved: 'Calculation saved successfully!',
      calculationSaveError: 'Error saving calculation',
      linkCopied: 'Link copied to clipboard!',
      linkCopyError: 'Failed to copy link',
      publicPageCreated: 'Public page created and opened in new tab',
      publicPageError: 'Error creating public page',
      calculateFirstError: 'Please perform ROI calculation first',
      
      // PDF Export
      language: 'Language',
      english: 'English',
      russian: 'Russian',
      indonesian: 'Indonesian',
      pdf: 'PDF',
      loading: '...',
      createdAt: 'Created',
      updatedAt: 'Updated',
      
      // Additional translations
      savedCalculations: 'Saved Calculations',
      loginToSave: 'Sign in to save and view calculations',
      noSavedCalculations: 'No saved calculations',
      otaCommission: 'OTA Commission (%)',
      calculationName: 'Calculation Name',
      exportToCSV: 'Export to CSV',
      basedOnDataAndScenario: 'Based on entered data and scenario',
      
      // Field tooltips
      formulaLabel: 'How it works in calculations',
      tooltips: {
        propertyPrice: {
          title: 'Property Purchase Price',
          description: 'The total cost of purchasing the property. This is the base amount for all ROI calculations.',
          formula: 'This value is added to renovation costs, legal fees, and additional expenses to calculate your total initial investment. The total investment is used as the denominator in ROI calculations.'
        },
        renovationCosts: {
          title: 'Renovation and Furnishing Costs',
          description: 'All costs associated with preparing the property for rental, including furniture, appliances, and renovations.',
          formula: 'This value is added to the purchase price, legal fees, and additional expenses to calculate your total initial investment. Higher renovation costs increase your total investment, which affects ROI calculations.'
        },
        legalFees: {
          title: 'Legal and Administrative Expenses',
          description: 'Costs for legal services, property registration, permits, and other administrative expenses.',
          formula: 'This value is added to the purchase price, renovation costs, and additional expenses to calculate your total initial investment. These costs are part of your upfront investment and affect the total ROI calculation.'
        },
        additionalExpenses: {
          title: 'Additional Initial Expenses',
          description: 'Any other one-time costs not covered by other categories (e.g., insurance, initial marketing).',
          formula: 'This value is added to the purchase price, renovation costs, and legal fees to calculate your total initial investment. These additional costs increase your total investment amount.'
        },
        investmentPeriod: {
          title: 'Investment Period',
          description: 'The number of years for which you want to calculate the return on investment.',
          formula: 'This determines how many years the calculator will project your rental income, expenses, and property appreciation. The final ROI is calculated as: (Total Return Over Period / Total Investment) × 100%.'
        },
        dailyRate: {
          title: 'Daily Rental Rate',
          description: 'The amount you plan to charge per day for renting the property.',
          formula: 'This value is multiplied by 365 days and your occupancy rate to calculate annual rental income. For example: $100/day × 365 × 70% = $25,550 annual income. This income is then used to calculate profits and ROI.'
        },
        occupancyRate: {
          title: 'Occupancy Rate',
          description: 'The percentage of time the property is expected to be rented out (e.g., 70% means rented 255 days per year).',
          formula: 'This percentage is used to calculate your actual annual rental income. For example: if your daily rate is $100 and occupancy is 70%, your annual income = $100 × 365 × 70% = $25,550. This affects all profit calculations.'
        },
        rentGrowthRate: {
          title: 'Annual Rent Growth Rate',
          description: 'Expected annual increase in rental rates due to market growth and inflation.',
          formula: 'This percentage is used to increase your rental income each year. For example: if your initial annual income is $25,550 and growth rate is 5%, year 2 income = $25,550 × (1 + 5%) = $26,828. This compounds over the investment period.'
        },
        operationStartYear: {
          title: 'Operation Start Year',
          description: 'The year when rental operations begin (0 = immediate start, 1 = start after 1 year, etc.).',
          formula: 'This determines when you start earning rental income. If set to 0, you earn income from year 1. If set to 1, you earn no income in year 1, but start earning in year 2. This affects the total profit calculation over your investment period.'
        },
        maintenanceFees: {
          title: 'Annual Maintenance Costs',
          description: 'Percentage of rental income spent on property maintenance, repairs, and regular upkeep.',
          formula: 'This percentage is applied to your annual rental income to calculate maintenance costs. For example: if your annual income is $25,550 and maintenance is 10%, costs = $25,550 × 10% = $2,555. These costs reduce your annual profit.'
        },
        utilityBills: {
          title: 'Utility Bills',
          description: 'Percentage of rental income spent on utilities (electricity, water, internet, etc.).',
          formula: 'This percentage is applied to your annual rental income to calculate utility costs. For example: if your annual income is $25,550 and utilities are 8%, costs = $25,550 × 8% = $2,044. These costs reduce your annual profit.'
        },
        annualTax: {
          title: 'Annual Tax Rate',
          description: 'Tax rate applied to rental income (income tax, property tax, etc.).',
          formula: 'This percentage is applied to your profit AFTER operational expenses (maintenance + utilities + management). For example: if your rental income is $25,550, operational expenses are $5,000, and tax rate is 20%, taxes = ($25,550 - $5,000) × 20% = $4,110.'
        },
        propertyManagement: {
          title: 'Property Management Fee',
          description: 'Percentage of rental income paid to property management services.',
          formula: 'This percentage is applied to your annual rental income to calculate management fees. For example: if your annual income is $25,550 and management fee is 5%, costs = $25,550 × 5% = $1,278. These costs reduce your annual profit.'
        },
        appreciationYear1: {
          title: 'Property Appreciation Year 1',
          description: 'Expected increase in property value during the first year of ownership.',
          formula: 'This percentage increases your property value in year 1. For example: if your total investment is $200,000 and appreciation is 5%, year 1 value = $200,000 × (1 + 5%) = $210,000. This appreciation is added to your total return calculation.'
        },
        appreciationYear2: {
          title: 'Property Appreciation Year 2',
          description: 'Expected increase in property value during the second year of ownership.',
          formula: 'This percentage increases your property value in year 2, based on the year 1 value. For example: if year 1 value is $210,000 and appreciation is 3%, year 2 value = $210,000 × (1 + 3%) = $216,300. This appreciation is added to your total return calculation.'
        },
        appreciationYear3: {
          title: 'Property Appreciation Year 3',
          description: 'Expected increase in property value during the third year of ownership.',
          formula: 'This percentage increases your property value in year 3, based on the year 2 value. For example: if year 2 value is $216,300 and appreciation is 2%, year 3 value = $216,300 × (1 + 2%) = $220,626. After year 3, property value remains constant until the end of the investment period.'
        }
      }
    },
    // Building Progress
    buildingProgress: {
      title: 'Building Progress',
      loading: 'Loading...',
      errorLoading: 'Error loading data',
      errorUpload: 'Error uploading files',
      errorDelete: 'Error deleting file',
      successUpload: 'Files uploaded successfully',
      successDelete: 'File deleted',
      successLinkCopied: 'Public link copied to clipboard',
      noAccessUpload: 'You do not have permission to upload files',
      noAccessDelete: 'You do not have permission to delete files',
      
      // Buttons
      view: 'View',
      add: 'Add',
      addMore: 'Add More',
      copyPublicLink: 'Copy Public Link',
      addPeriod: 'Add Period',
      backToProgress: 'Back to building progress',
      
      // Upload modal
      uploadFiles: 'Upload Files',
      uploadingFiles: 'Uploading files...',
      supportedFormats: 'Images and video files are supported',
      
      // Media counts
      photos: 'photos',
      videos: 'videos',
      photo: 'photo',
      video: 'video',
      
      // Album description
      albumDescription: 'Album Description',
      addDescription: 'Add Description',
      editDescription: 'Edit Description',
      saveDescription: 'Save Description',
      cancelEdit: 'Cancel Edit',
      descriptionPlaceholder: 'Enter description for this album...',
      descriptionSaved: 'Description saved',
      descriptionError: 'Error saving description',
      
      // Confirm dialog
      confirmDelete: 'Are you sure you want to delete this file?',
      
      // Error messages
      dataNotFound: 'Data not found',
      noData: 'No data available for this month',
      
      // Months
      months: {
        january: 'January',
        february: 'February',
        march: 'March',
        april: 'April',
        may: 'May',
        june: 'June',
        july: 'July',
        august: 'August',
        september: 'September',
        october: 'October',
        november: 'November',
        december: 'December'
      },
      createdAt: 'Created',
      updatedAt: 'Updated'
    },

    // Education
    education: {
      title: 'Education',
      description: 'Training materials and courses',
      sections: 'Sections',
      topics: 'Topics',
      lessons: 'Lessons',
      createSection: 'Create Section',
      editSection: 'Edit Section',
      deleteSection: 'Delete Section',
      createTopic: 'Create Topic',
      editTopic: 'Edit Topic',
      deleteTopic: 'Delete Topic',
      createLesson: 'Create Lesson',
      editLesson: 'Edit Lesson',
      deleteLesson: 'Delete Lesson',
      sectionName: 'Section Name',
      sectionNameEn: 'Section Name (English)',
      sectionNameRu: 'Section Name (Russian)',
      sectionNameId: 'Section Name (Indonesian)',
      sectionDescription: 'Section Description',
      sectionDescriptionEn: 'Section Description (English)',
      sectionDescriptionRu: 'Section Description (Russian)',
      sectionDescriptionId: 'Section Description (Indonesian)',
      topicName: 'Topic Name',
      topicNameEn: 'Topic Name (English)',
      topicNameRu: 'Topic Name (Russian)',
      topicNameId: 'Topic Name (Indonesian)',
      topicDescription: 'Topic Description',
      topicDescriptionEn: 'Topic Description (English)',
      topicDescriptionRu: 'Topic Description (Russian)',
      topicDescriptionId: 'Topic Description (Indonesian)',
      lessonName: 'Lesson Name',
      lessonNameEn: 'Lesson Name (English)',
      lessonNameRu: 'Lesson Name (Russian)',
      lessonNameId: 'Lesson Name (Indonesian)',
      lessonDescription: 'Lesson Description',
      lessonDescriptionEn: 'Lesson Description (English)',
      lessonDescriptionRu: 'Lesson Description (Russian)',
      lessonDescriptionId: 'Lesson Description (Indonesian)',
      videoUrlEn: 'Video Link (English)',
      videoUrlRu: 'Video Link (Russian)',
      videoUrlId: 'Video Link (Indonesian)',
      order: 'Order',
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading...',
      noSections: 'Sections не найдены',
      noTopics: 'Topics не найдены',
      noLessons: 'No lessons in this topic',
      sectionCreated: 'Section created successfully',
      sectionUpdated: 'Section updated successfully',
      sectionDeleted: 'Section deleted successfully',
      topicCreated: 'Topic created successfully',
      topicUpdated: 'Topic updated successfully',
      topicDeleted: 'Topic deleted successfully',
      lessonCreated: 'Lesson created successfully',
      lessonUpdated: 'Lesson updated successfully',
      lessonDeleted: 'Lesson deleted successfully',
      confirmDeleteSection: 'Вы уверены, что хотите удалить этот раздел? Все темы и уроки также будут удалены.',
      confirmDeleteTopic: 'Вы уверены, что хотите удалить эту тему? Все уроки также будут удалены.',
      confirmDeleteLesson: 'Вы уверены, что хотите удалить этот урок?',
      errorLoading: 'Error loading data',
      errorSaving: 'Error saving data',
      errorDeleting: 'Error deleting data',
      noPermission: 'You do not have permission to perform this action',
      topicNotFound: 'Topic not found',
      lessonNotFound: 'Lesson not found',
      enterLessonName: 'Enter lesson name in at least one language',
      addVideoUrl: 'Add at least one video link',
      watchVideo: 'Watch Video',
      backToSections: 'Back to Sections',
      backToTopics: 'Back to Topics',
      backToLessons: 'Back to Lessons',
      viewLessons: 'View Lessons',
      goToEducation: 'Go to Education',
      backToSection: 'Back to Section',
      videoNotAvailable: 'Video not available in your language',
      selectLanguage: 'Select Language',
      english: 'English',
      russian: 'Russian',
      indonesian: 'Indonesian',
      infoSection: 'Information',
      navigationSection: 'Navigation',
      lessonDescriptionSection: 'Lesson Description',
      moveTopic: 'Move Topic',
      moveTopicToSection: 'Move topic to another section',
      availableRoles: 'Available Roles',
      createdAt: 'Created',
      updatedAt: 'Updated'
    },

    // Developers List
    developersList: {
      title: 'Developers List',
      titleForDeveloper: 'About Developer',
      addDeveloper: 'Add Developer',
      noDevelopers: 'No developers',
      developersFound: 'Developers found: {count}',
      editDeveloper: 'Edit',
      loading: 'Loading...',
      errorLoading: 'Error loading developers',
      createdAt: 'Created',
      updatedAt: 'Updated'
    },

    // Premium Features
    premiumFeatures: {
      title: 'Premium Subscription for Developers',
      subtitle: 'Maximum visibility of your properties among real estate agents and increased sales through the IT Agent platform',
      
      // Features
      features: {
        iosAppPlacement: {
          title: 'Placement on app homepage and website',
          description: 'Your properties and complexes will be displayed on the IT Agent app homepage for all real estate agents, significantly increasing the visibility of your offerings.',
          benefit: 'Increased visibility among agents and investors'
        },
        pushNotifications: {
          title: 'Push notifications to all agents',
          description: 'Send notifications about new properties, promotions and important events directly to all real estate agents in the IT Agent app.',
          benefit: 'Direct communication with agents'
        },
        verifiedBadge: {
          title: '"Service Verified" badge',
          description: 'Special badge on your property and complex pages that increases trust and conversion among agents and clients.',
          benefit: 'Increased trust and conversion'
        },
        publicWebPage: {
          title: 'Public web page',
          description: 'Full web page with information about your properties that can be used outside the app and shared with clients and partners.',
          benefit: 'Expanded sales channels'
        },
        ratingBoost: {
          title: 'Higher ranking in catalogs',
          description: 'Your properties get priority placement and highlighted star ratings like in the public gallery, helping buyers notice you faster.',
          benefit: 'More impressions and clicks'
        },
        aiTelegramBot: {
          title: 'Your AI Telegram bot',
          description: 'Launch a branded AI assistant that answers client questions 24/7 and guides them to your properties, booking viewings and collecting requests.',
          benefit: 'Automated lead generation 24/7'
        },
        crmSystem: {
          title: 'Built‑in CRM for leads',
          description: 'Collect and process leads from your public page and AI bot in one place, with integrations for external traffic sources.',
          benefit: 'Faster response and higher conversion'
        },
        contentFactory: {
          title: 'AI content creation',
          description: 'Automate creation of posts for your social networks.',
          benefit: 'Consistent content without extra effort'
        }
      },

      // Additional benefits
      additionalBenefits: 'Additional Benefits',
      benefits: [
        'Increased number of views of your properties',
        'Direct access to real estate agent database',
        'Increased brand trust and authority',
        'Automation of property promotion process',
        'Analytics and statistics on views',
        'Priority support from IT Agent team'
      ],

      // Statistics
      statistics: {
        agents: 'Real estate agents',
        viewsIncrease: 'Increase in views',
        availability: 'Availability'
      },

      // CTA section
      cta: {
        title: 'Ready to increase sales?',
        subtitle: 'Join premium developers and get maximum visibility of your properties among real estate agents',
        subscribeButton: 'Subscribe to premium',
        footer: 'No hidden fees • Cancel anytime • Priority support'
      }
    },

    // Notifications Page
    notificationsPage: {
      title: 'Notification Management',
      subtitle: 'Manage push notifications for your properties',
      
      // Statistics
      statistics: {
        sentToday: 'Sent Today',
        totalSent: 'Total Sent',
        lastSent: 'Last Sent',
        remaining: 'Remaining',
        of: 'of',
        total: 'Total',
        never: 'Never'
      },

      // Tabs
      tabs: {
        send: 'Send',
        history: 'History'
      },

      // Send Form
      sendForm: {
        title: 'Create Notification',
        description: 'Send notification to iOS app users',
        titleLabel: 'Title',
        titlePlaceholder: 'Enter notification title',
        bodyLabel: 'Message Text',
        bodyPlaceholder: 'Enter notification text',
        characters: 'characters',
        targetAudience: 'Notification will be sent to all iOS app users',
        targetAudienceLabel: 'Target Audience',
        targetAudienceAll: 'All users',
        targetAudienceRole: 'Users with specific role',
        roleSelectLabel: 'Select role',
        roleSelectPlaceholder: 'Choose user role',
        sendButton: 'Send Notification',
        sending: 'Sending...',
        validation: {
          titleRequired: 'Title is required',
          bodyRequired: 'Message text is required',
          titleTooLong: 'Title is too long',
          bodyTooLong: 'Message text is too long',
          roleRequired: 'Please select a role'
        }
      },

      // History
      history: {
        title: 'Notification History',
        description: 'View sent notifications',
        noNotifications: 'No notifications sent yet',
        sentToAllUsers: 'Sent to all users',
        delivered: 'Delivered',
        errors: 'Errors',
        status: {
          sent: 'Sent',
          delivered: 'Delivered',
          failed: 'Failed',
          pending: 'Pending'
        }
      },

      // Notifications
      notifications: {
        success: {
          title: 'Notification sent successfully!',
          message: 'Delivered: {successCount}, Errors: {failureCount}'
        },
        error: {
          title: 'Sending Error',
          message: 'Unknown error occurred'
        },
        authError: {
          title: 'Authentication Error',
          message: 'User not authenticated. Please refresh the page.'
        }
      },

      // Access Control
      accessControl: {
        forbidden: 'Access Forbidden',
        noPermission: 'You do not have permission to access this section.'
      },

      // User Roles
      roles: {
        admin: 'Administrator',
        moderator: 'Moderator',
        agent: 'Agent',
        premiumAgent: 'Premium Agent',
        developer: 'Developer',
        premiumDeveloper: 'Premium Developer',
        user: 'User'
      }
    },

    // Edit Developer
    editDeveloper: {
      addTitle: 'Add Developer',
      editTitle: 'Edit Developer',
      nameLabel: 'Developer Name',
      namePlaceholder: 'Enter developer name',
      descriptionLabel: 'Description',
      descriptionPlaceholder: 'Enter developer description',
      approvedLabel: 'Service Verified',
      logoLabel: 'Logo',
      uploadLogo: 'Upload Logo',
      currentLogo: 'Current Logo',
      save: 'Save',
      add: 'Add',
      saving: 'Saving...',
      saveSuccess: 'Saved!',
      saveError: 'Error saving!',
      loadError: 'Error loading data!'
    },

    // Technical Supervision
    technicalSupervision: {
      title: 'Technical Supervision',
      subtitle: 'Management of technical supervision reports for construction projects',
      accessDenied: 'Access Denied',
      adminOnlyAccess: 'Technical Supervision section is available only to administrators',
      
      // Projects
      addProject: 'Add Project',
      createProject: 'Create Project',
      editProject: 'Edit Project',
      projectName: 'Project Name',
      projectNamePlaceholder: 'e.g.: Sunny Complex, House on Pushkin St.',
      projectDescriptionPlaceholder: 'Brief project description',
      noProjects: 'No Projects',
      noProjectsDescription: 'Create the first project to start working with technical supervision',
      createFirstProject: 'Create First Project',
      projectHasSections: 'Cannot delete project that contains sections',
      totalSections: 'Total Sections',
      currentProject: 'Current Project',
      backToProjects: 'Back to Projects',
      address: 'Address',
      addressPlaceholder: 'Full object address',

      // Sections
      addSection: 'Add Section',
      createSection: 'Create Section',
      editSection: 'Edit Section',
      sectionName: 'Section Name',
      sectionNamePlaceholder: 'e.g.: Foundation, Walls, Electrical',
      sectionDescriptionPlaceholder: 'Brief section description',
      noSections: 'No Sections',
      noSectionsDescription: 'Create the first section to start working with technical supervision',
      createFirstSection: 'Create First Section',
      sectionHasInspections: 'Cannot delete section that contains inspections',
      totalInspections: 'Total Inspections',
      
      // Inspections
      addInspection: 'Add Inspection',
      createInspection: 'Create Inspection',
      editInspection: 'Edit Inspection',
      inspectionTitle: 'Inspection Title',
      inspectionTitlePlaceholder: 'e.g.: Plastering, Wiring',
      inspectionsIn: 'Inspections in section',
      
      // Fields
      location: 'Location',
      locationPlaceholder: 'Floor, room, area',
      orderNumber: 'Order Number',
      description: 'Description',
      descriptionPlaceholder: 'General description of the inspection performed',
      defects: 'Defects and Issues',
      defectsPlaceholder: 'Description of found defects and violations',
      risks: 'Risks and Hazards',
      risksPlaceholder: 'What are the dangers of the found defects',
      recommendations: 'Recommendations for Elimination',
      recommendationsPlaceholder: 'How to fix the found problems',
      
      // Status
      status: 'Status',
      statusPending: 'Pending',
      statusInProgress: 'In Progress',
      statusCompleted: 'Completed',
      statusCritical: 'Critical',
      completed: 'Completed',
      inProgress: 'In Progress',
      critical: 'Critical',
      
      // Photos
      photos: 'Photos',
      uploadPhotos: 'Upload Photos',
      uploading: 'Uploading...',
      photosUploadSuccess: 'Photos uploaded successfully',
      photosUploadError: 'Error uploading photos',
      
      // Common
      created: 'Created',
      
      // Public page
      publicPageSubtitle: 'Technical Supervision Report',
      projectNotFound: 'Project not found',
      loadError: 'Error loading data',
      copyPublicLink: 'Copy public page link',
      publicLinkCopied: 'Public page link copied',
      publicLinkCopyError: 'Error copying link',
      projectInfo: 'Report Information',
      projectCreated: 'Report created',
      lastUpdated: 'Last updated',
      noInspectionsInSection: 'No inspections in this section yet',
      noSectionsInProject: 'This project has no technical supervision sections yet'
    }
  },
  ru: {
    leadForm: {
              writeToAgent: 'Оставить заявку',
      writeInWhatsapp: 'Написать в WhatsApp',
        leaveRequestToAgent: 'Оставьте заявку агенту',
        agentContactInfo: 'Агент свяжется с вами в удобном для вас мессенджере для предоставления всех деталей по объекту',
        messengerLabel: 'Предпочитаемый мессенджер',
        whatsapp: 'Связаться в WhatsApp',
        telegram: 'Связаться в Telegram',
        manageProperty: 'Управлять объектом',
      name: 'Имя',
      phone: 'Телефон',
      cancel: 'Отменить',
      send: 'Отправить',
      sentSuccess: 'Ваша заявка отправлена',
      sentError: 'Не удалось отправить заявку',
      accessError: 'Ошибка доступа. Попробуйте еще раз.',
      serviceUnavailable: 'Сервис временно недоступен. Попробуйте позже.',
      errorPrefix: 'Ошибка: ',
      addedByAgent: 'Добавлено агентом',
      agentInfo: 'Информация об агенте',
      agentName: 'Имя агента',
      agentPhone: 'Телефон агента',
      agentEmail: 'Email агента',
      clientLeadsTitle: 'Заявки клиентов',
      clientLeadsSubtitle: 'Заявки от клиентов по этому объекту',
      noClientLeads: 'Заявок от клиентов по этому объекту пока нет',
      clientName: 'Имя клиента',
      clientPhone: 'Телефон клиента',
      clientMessenger: 'Предпочитаемый мессенджер',
      requestDate: 'Дата заявки',
      phoneCopied: 'Номер телефона скопирован',
      copyPhoneTooltip: 'Копировать номер телефона'
    },
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
    purchasePrice: 'Цена покупки',
    renovationCosts: 'Расходы на ремонт',
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
    unitPrice: 'Цена за единицу',
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
    publicDocs: {
      title: 'Просмотр детальной информации и документов',
      openAccess: 'Открыть доступ',
      modal: {
        title: 'Откройте полный доступ',
        colOneTitle: 'Открыть доступ к этому объекту',
        colOneDesc: 'Единоразовый платеж — и вы получите полную информацию об объекте, комплексе и его документах.',
        colOnePrice: '$29',
        colOneButton: 'Единоразовая покупка',
        colTwoTitle: 'Полный доступ ко всем объектам',
        colTwoDesc: 'Подписка дает полный доступ ко всей информации по всем текущим и будущим объектам на срок действия подписки.',
        colTwoPrice: '$99 / мес.',
        colTwoButton: 'Подписаться',
        close: 'Закрыть'
      }
    },
    publicRoiNotAvailable: 'Публичная страница ROI недоступна',
    
    // Pricing modal
    pricing: {
      title: 'Выберите свой план',
      subtitle: 'Выберите план, который лучше всего подходит вашим потребностям',
      oneTime: {
        badge: 'Популярный',
        title: 'Единоразовый доступ',
        description: 'Получите полную информацию об объекте недвижимости за единоразовый платеж.',
        price: '₽2,400',
        priceNote: 'Единоразовый платеж, доступ навсегда',
        featuresTitle: 'Что включено:',
        features: {
          fullAccess: 'Полный доступ к деталям объекта и документации',
          documents: 'Все юридические документы и технические характеристики',
          roiCalculator: 'Калькулятор ROI и анализ инвестиций',
          support: 'Поддержка по email в течение 30 дней',
          lifetime: 'Пожизненный доступ к купленному объекту'
        },
        note: 'Идеально для инвесторов, которые хотят детальную информацию об определенном объекте.'
      },
      subscription: {
        badge: 'Лучшее предложение',
        title: 'Полный доступ к платформе',
        description: 'Откройте доступ ко всем объектам и премиум-функциям с нашей ежемесячной подпиской.',
        price: '₽8,000',
        priceNote: 'В месяц, можно отменить в любое время',
        featuresTitle: 'Что включено:',
        features: {
            allProperties: 'Полный доступ ко всем объектам недвижимости в листинге',
            newListings: 'Ранний доступ к новым объектам до публичного релиза',
            prioritySupport: 'Профессиональная поддержка и сопровождение клиентов в чате',
            marketUpdates: 'Предоставление уникальной ссылки на листинг - собственный сайт для получения заявок'
        },
        note: 'Идеально для профессионалов недвижимости и активных инвесторов.'
      },
      additionalInfo: {
        title: 'Дополнительная информация',
        payment: {
          title: 'Способы оплаты',
          description: 'Мы принимаем все основные кредитные карты и банковские переводы. Все платежи обрабатываются безопасно.'
        },
        support: {
          title: 'Поддержка клиентов',
          description: 'Наша команда поддержки доступна 24/7, чтобы помочь вам с любыми вопросами или проблемами.'
        }
        },
        closeButton: 'Закрыть',
        termsLink: 'Условия оплаты и возврата денежных средств',
        termsTitle: 'Условия оплаты и возврата денежных средств',
        terms: {
          payment: {
            title: 'Условия оплаты',
            point1: 'Все платежи обрабатываются безопасно через нашего партнера по платежам.',
            point2: 'Оплата требуется до предоставления доступа к премиум-функциям.',
            point3: 'Платежи по подписке автоматически продлеваются, если не отменены.',
            point4: 'Мы принимаем основные кредитные карты и банковские переводы.'
          },
          refund: {
            title: 'Политика возврата',
            point1: 'Возврат средств за единоразовые покупки доступен в течение 14 дней с момента покупки.',
            point2: 'Отмена подписки вступает в силу в конце текущего расчетного периода.',
            point3: 'Возврат средств не предоставляется за частичное использование услуг подписки.',
            point4: 'Запросы на возврат средств должны подаваться через нашу систему поддержки.'
          },
          access: {
            title: 'Условия доступа',
            point1: 'Доступ к купленному контенту предоставляется немедленно после успешной оплаты.',
            point2: 'Доступ к аккаунту может быть приостановлен за нарушение наших условий использования.'
          },
          liability: {
            title: 'Ответственность',
            point1: 'Мы не несем ответственности за финансовые решения, принятые на основе нашего контента.',
            point2: 'Пользователи несут ответственность за соблюдение местных законов и правил.'
          }
        }
      },
    
    // Common words
    close: 'Закрыть',
    cancel: 'Отмена',
    save: 'Сохранить',
    logout: 'Выйти',

    // Districts/Regions translations (keep original Russian names)
    districts: {
      'Амед': 'Амед',
      'Берава': 'Берава', 
      'Будук': 'Будук',
      'Джимбаран': 'Джимбаран',
      'Кинтамани': 'Кинтамани',
      'Кута': 'Кута',
      'Кутух': 'Кутух',
      'Ловина': 'Ловина',
      'Нуану': 'Нуану',
      'Нуса Дуа': 'Нуса Дуа',
      'Пандава': 'Пандава',
      'Переренан': 'Переренан',
      'Санур': 'Санур',
      'Семиньяк': 'Семиньяк',
      'Убуд': 'Убуд',
      'Улувату': 'Улувату',
      'Умалас': 'Умалас',
      'Унгасан': 'Унгасан',
      'Чандидаса': 'Чандидаса',
      'Чангу': 'Чангу',
      'Чемаги': 'Чемаги',
      'Гили Траванган': 'Гили Траванган',
      'Ломбок': 'Ломбок',
      'Kab. Jembrana': 'Регентство Джембрана',
      'Kab. Tabanan': 'Регентство Табанан',
      'Kab. Badung': 'Регентство Бадунг',
      'Kab. Gianyar': 'Регентство Гианьяр',
      'Kab. Klungkung': 'Регентство Клунгкунг',
      'Kab. Bangli': 'Регентство Бангли',
      'Kab. Karangasem': 'Регентство Карангасем',
      'Kab. Buleleng': 'Регентство Буллеленг',
      'Kota Denpasar': 'Город Денпасар',
      createdAt: 'Создан',
      updatedAt: 'Обновлен'
    },

    // Land Status translations
    landStatus: {
      'Туристическая зона (W)': 'Туристическая зона (W)',
      'Торговая зона (K)': 'Торговая зона (K)',
      'Смешанная зона (C)': 'Смешанная зона (C)',
      'Жилая зона (R)': 'Жилая зона (R)',
      'Сельхоз зона (P)': 'Сельхоз зона (P)',
      'Заповедная зона (RTH)': 'Заповедная зона (RTH)'
    },

    // Navigation
    navigation: {
      adminPanel: 'Админ панель',
      propertyGallery: 'Галерея объектов',
      publicGallery: 'Публичная галерея',
      publicInvestorTitle: 'IT AGENT BALI',
      clientLeads: 'Заявки клиентов',
      complexGallery: 'Галерея комплексов',
      properties: 'Объекты',
      complexes: 'Комплексы',
      developers: 'Застройщики',
      landmarks: 'Достопримечательности',
      chessboards: 'Шахматки',
      support: 'Поддержка',
      roiCalculator: 'Калькулятор ROI',
      clientFixations: 'Фиксации клиентов',
      userManagement: 'Пользователи',
      generalOverview: 'Общий обзор',
              registrationRequests: 'Заявки застройщиков',
      
      // Registration Requests Page
      registrationRequestsPage: {
        title: 'Заявки застройщиков',
        noRequests: 'Нет заявок на регистрацию',
        name: 'Имя',
        email: 'Email',
        phone: 'Телефон',
        position: 'Должность',
        applicationDate: 'Дата заявки',
        takeInWork: 'Взять в работу',
        approve: 'Одобрить',
        reject: 'Отклонить',
        statusUpdated: 'Статус заявки обновлен',
        statusUpdateError: 'Не удалось обновить статус заявки',
        positions: {
          owner: 'Собственник',
          manager: 'Менеджер',
          marketer: 'Маркетолог',
          agent: 'Агент'
        }
      },
      referralMap: 'Карта рефералов',
      settings: 'Настройки',
      education: 'Обучение',
      premiumFeatures: 'Премиум подписка',
      notifications: 'Рассылка уведомлений',
      publicPage: 'Публичная страница',
      agentProperties: 'Объекты агентов',
      premiumSubscriptionTooltip: 'Доступно в премиум подписке',
      // CRM System
      crmSystem: 'CRM система',
      deals: 'Сделки',
      tasks: 'Задачи',
      lists: 'Списки',
      createdAt: 'Создан',
      updatedAt: 'Обновлен',
      agentRegistrationRequests: 'Заявки агентов',
      technicalSupervision: 'Технадзор',
      // Dashboard
      dashboard: 'Дашборд',
      appStatistics: 'Статистика приложения'
    },
    // Public menu
    publicMenu: {
      favorites: 'Избранное',
      services: 'Услуги',
      loginRegister: 'Вход / Регистрация',
      account: 'Личный кабинет',
      subscription: 'Подписка',
      servicesList: {
        legalDueDiligence: 'Детальная юридическая проверка объекта',
        constructionSupervision: 'Технадзор за строительством объекта',
        constructionAcceptance: 'Строительная приемка объекта',
        constructionManagement: 'Индивидуальное строительство',
        architecturalDesign: 'Разработка архитектурного проекта'
      }
    },
    favorites: {
      createPDF: 'Создать PDF',
      selectLanguagePDF: 'Выберите язык для PDF',
      generatingPDF: 'Создание PDF...',
      withTitle: 'с названием',
      pdfCreated: 'PDF создан'
    },
    publicFavorites: {
      generateLink: 'Генерация публичной ссылки'
    },
    subscriptionModal: {
      title: 'Премиум‑подписка',
      description: 'Получите полный доступ ко всем текущим и будущим объектам с проверенными документами и профессиональными инструментами.',
      features: [
        'Полная информация по всем объектам',
        'Документы и юридические детали',
        'Приоритетные обновления и новые листинги',
        'Индивидуальная ссылка для получения заявок от клиентов'
      ],
      price: '$99 / мес.',
      subscribeButton: 'Подписаться'
    },
    paymentModal: {
      supportText: 'Если у вас возникли сложности с оплатой или подключением премиум подписки, напишите в нашу поддержку и мы окажем вам полное сопровождение',
      supportButton: 'Написать в техподдержку'
    },
    accountPage: {
      title: 'Личный кабинет',
      premiumBadge: 'Премиум',
      premiumDeveloperBadge: 'Премиум застройщик',
      logout: 'Выйти',
      myProperties: 'Мои объекты',
      myLeads: 'Мои заявки',
      noProperties: 'Вы ещё не добавили ни одного объекта',
      noLeads: 'У вас пока нет заявок',
      goToProperty: 'Перейти к объекту',
      premiumLinkTitle: 'Ваша персональная именная ссылка',
      premiumLinkDescription: 'Поделитесь этой ссылкой с клиентами. Они увидят весь каталог объектов и смогут сразу написать вам напрямую из любой понравившейся карточки.',
      premiumLinkLabel: 'Персональная ссылка',
      copyButton: 'Скопировать',
      copiedMessage: 'Ссылка скопирована',
      premiumOnlyMessage: 'Ссылка доступна только для премиум подписчиков',
      subscribeButton: 'Подписаться',
      profileTitle: 'Профиль',
      profile: {
        name: 'Имя',
        email: 'Email',
        language: 'Язык',
        telegram: 'Telegram',
        phone: 'Телефон',
        save: 'Сохранить изменения',
        saved: 'Профиль сохранён',
        saveError: 'Не удалось сохранить профиль'
      }
    },

    // Public Page
    publicPage: {
      uploadCover: 'Загрузить обложку',
      expand: 'Развернуть',
      collapse: 'Свернуть',
      complexesListTitle: 'Список комплексов',
      rentingLabel: 'Сдается',
      propertiesListTitle: 'Список объектов',
      agentLink: 'Публичная ссылка'
    },

    // Shared Gallery Page for Premium Agent
    sharedGalleryPage: {
      premiumRequiredTitle: 'Требуется премиум‑подписка',
      premiumRequiredMessage: 'Для использования этой страницы необходимо оформить премиум‑подписку.',
      goToMain: 'Перейти на публичную страницу'
    },

    // Agent info panel
    agentInfo: {
      title: 'Агент',
      name: 'Имя',
      email: 'Email',
      role: 'Роль',
      language: 'Язык',
      telegram: 'Telegram',
      userId: 'ID пользователя',
      createdAt: 'Создан',
      notFound: 'Информация об агенте не найдена'
    },

    // Registration Requests Page
    registrationRequestsPage: {
      title: 'Заявки застройщиков',
      noRequests: 'Нет заявок на регистрацию',
      name: 'Имя',
      email: 'Email',
      phone: 'Телефон',
      position: 'Должность',
      applicationDate: 'Дата заявки',
      takeInWork: 'Взять в работу',
      approve: 'Одобрить',
      reject: 'Отклонить',
      statusUpdated: 'Статус заявки обновлен',
      statusUpdateError: 'Не удалось обновить статус заявки',
      positions: {
        owner: 'Собственник',
        manager: 'Менеджер',
        marketer: 'Маркетолог',
        agent: 'Агент'
      }
    },

    // Deals (CRM)
    deals: {
      title: 'СДЕЛКИ',
      searchPlaceholder: 'Поиск и фильтр',
      settings: 'НАСТРОИТЬ',
      newDeal: 'НОВАЯ СДЕЛКА',
      
      // Statistics
      todayTasks: 'Задач на сегодня',
      noTasks: 'Без задач',
      overdue: 'Просроченных',
      newTodayYesterday: 'Новых сегодня / вчера',
      salesForecast: 'Прогноз продаж',
      noData: 'Нет данных',
      
      // Pipeline stages
      firstContact: 'ПЕРВИЧНЫЙ КОНТАКТ',
      negotiations: 'ПЕРЕГОВОРЫ',
      decisionMaking: 'ПРИНИМАЮТ РЕШЕНИЕ',
      booking: 'БРОНЬ',
      
      // Deal card
      noTask: 'Нет задач',
      today: 'Сегодня',
      
      // Deal form
      quickAdd: 'Быстрое добавление',
      dealName: 'Название сделки',
      contact: 'Контакт',
      contactName: 'Контакт: Имя',
      contactPhone: 'Контакт: Телефон',
      contactEmail: 'Контакт: Email',
      company: 'Компания',
      companyName: 'Компания: Название',
      companyAddress: 'Компания: Адрес',
      add: 'Добавить',
      cancel: 'Отменить',
      
      // Settings modal
      dealNamePlaceholder: 'Название сделки'
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
      cancel: 'Отмена',
      createdAt: 'Создан',
      updatedAt: 'Обновлен',
      
      // System messages for fixation status changes
      systemMessages: {
        approved: 'Ваш клиент {clientName} {clientPhone} зафиксирован за вами у застройщика {developerName} до {validUntil}',
        rejected: 'Ваша заявка на фиксацию клиента {clientName} {clientPhone} у застройщика {developerName} отклонена. Причина отклонения: {reason}',
        expired: 'Ваша фиксация клиента {clientName} {clientPhone} у застройщика {developerName} истекла {expiredDate}'
      }
    },

    // Fixation Chat
    fixationChat: {
      title: 'Чат фиксации',
      messagePlaceholder: 'Введите сообщение...',
      send: 'Отправить',
      messageSent: 'Сообщение успешно отправлено',
      messageError: 'Не удалось отправить сообщение',
      chatDataError: 'Не удалось загрузить данные чата',
      createdAt: 'Создано',
    },

    // Settings Page
    settings: {
      title: 'Настройки',
      profile: {
        title: 'Профиль',
        description: 'Управление настройками профиля',
        name: 'Имя',
        email: 'Email',
        role: 'Роль',
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
        passwordUpdated: 'Пароль успешно обновлен',
        createdAt: 'Создан',
        updatedAt: 'Обновлен',
        editProfileTitle: 'Редактирование профиля',
        userName: 'Имя пользователя',
        userNamePlaceholder: 'Введите имя пользователя',
        emailCannotBeChanged: 'Email нельзя изменить',
        changePassword: 'Смена пароля',
        changePasswordDescription: 'Оставьте поля пустыми, если не хотите менять пароль',
        newPasswordPlaceholder: 'Введите новый пароль',
        confirmPasswordPlaceholder: 'Подтвердите новый пароль',
        saving: 'Сохранение...',
        notSpecified: 'Не указано',
        notSpecifiedEmail: 'Не указан',
        roleNotDefined: 'Не определена',
        noSignedContracts: 'Пока нет подписанных договоров',
        user: 'Пользователь',
        signDate: 'Дата подписания',
        developer: 'Застройщик'
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
        waitingConnection: 'Ожидание подключения...',
        createdAt: 'Создан',
        updatedAt: 'Обновлен'
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

"IT Agent", именуемое в дальнейшем "Исполнитель", с одной стороны, и Developer, именуемый в дальнейшем "Клиент", с другой стороны, заключили настоящий Договор о нижеследующем:

1. ПРЕДМЕТ ДОГОВОРА

1.1. Исполнитель обязуется предоставить Клиенту IT-платформу для размещения информации об объектах недвижимости и организации взаимодействия с агентами по недвижимости.

1.2. Клиент обязуется оплачивать услуги Исполнителя в размере и порядке, установленными настоящим Договором.

2. ПРАВА И ОБЯЗАННОСТИ СТОРОН

2.1. Исполнитель обязуется:
2.1.1. Предоставить доступ к IT-платформе для размещения объектов недвижимости;
2.1.2. Обеспечить техническое функционирование платформы;
2.1.3. Организовать получение и обработку заявок от агентов;
2.1.4. Предоставить инструменты для взаимодействия с агентами по недвижимости.

2.2. Клиент обязуется:
2.2.1. Своевременно предоставлять актуальную и достоверную информацию об объектах недвижимости;
2.2.2. Поддерживать информацию об объектах в актуальном состоянии;
2.2.3. Своевременно оплачивать услуги согласно условиям настоящего Договора;
2.2.4. Уведомлять Исполнителя о продаже объектов недвижимости через платформу.

3. ПОРЯДОК ОПЛАТЫ

3.1. Стоимость услуг Исполнителя составляет 0,5% (ноль целых пять десятых процента) от цены каждого объекта недвижимости, проданного через IT-платформу. За первые 2 проведенные сделки комиссия платформой не взимается.

3.2. Комиссия, указанная в пункте 3.1, оплачивается Клиентом дополнительно к стандартной комиссии агентам по недвижимости (5%).

3.3. Оплата производится в течение 10 (десяти) банковских дней с момента заключения договора купли-продажи недвижимости между Клиентом и покупателем, привлеченным через IT-платформу.

3.4. Основанием для оплаты является подписанный договор купли-продажи и уведомление Клиента о совершенной сделке.

4. ОТВЕТСТВЕННОСТЬ СТОРОН

4.1. За неисполнение или ненадлежащее исполнение обязательств по настоящему Договору стороны несут ответственность в соответствии с действующим законодательством.

4.2. В случае просрочки платежа Клиент выплачивает пени в размере 0,1% от суммы просроченного платежа за каждый день просрочки.

5. СРОК ДЕЙСТВИЯ ДОГОВОРА

5.1. Настоящий Договор вступает в силу с момента его подписания и действует в течение одного года.

5.2. Договор автоматически продлевается на тот же срок, если ни одна из сторон не уведомит другую о расторжении за 30 дней до истечения срока действия.

6. ПОРЯДОК РАЗРЕШЕНИЯ СПОРОВ

6.1. Все споры и разногласия разрешаются путем переговоров.

6.2. В случае невозможности достижения соглашения споры разрешаются в суде по месту нахождения Исполнителя.

7. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ

7.1. Настоящий Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу, по одному для каждой стороны.

7.2. Изменения и дополнения к Договору действительны только при оформлении в письменном виде и подписании обеими сторонами.

8. ПОДПИСИ СТОРОН

ИСПОЛНИТЕЛЬ:                    КЛИЕНТ:
     IT Agent                                         Developer
_________________               _________________
  (подпись)                            (подпись)`,
        executor: 'ИСПОЛНИТЕЛЬ',
        customer: 'ЗАКАЗЧИК',
        signature: '(подпись)',
        createdAt: 'Создан',
        updatedAt: 'Обновлен'
      },
      language: {
        title: 'Язык',
        description: 'Выберите предпочитаемый язык',
        english: 'Английский',
        russian: 'Русский',
        indonesian: 'Индонезийский'
      }
    },

    // Complexes Gallery
    complexesGallery: {
      title: 'Галерея комплексов',
      loadingText: 'Загрузка комплексов...',
      searchPlaceholder: 'Поиск по названию, застройщику, району...',
      filtersTitle: 'Фильтры',
      resetAllFilters: 'Сбросить все',
      priceLabel: 'Цена (USD)',
      pricePlaceholderFrom: 'От',
      pricePlaceholderTo: 'До',
      developerLabel: 'Застройщик',
      allDevelopers: 'Все застройщики',
      districtLabel: 'Район', 
      allDistricts: 'Все районы',
      provinceLabel: 'Провинция',
      allProvinces: 'Все провинции',
      landStatusLabel: 'Статус земли',
      allStatuses: 'Все статусы',
      ownershipFormLabel: 'Форма собственности',
      allForms: 'Все формы',
      resultsText: 'Найдено: {found} из {total} комплексов',
      emptyStateNoDeveloperComplexes: 'У вас пока нет комплексов в системе',
      emptyStateNoComplexes: 'Комплексы не найдены',
      emptyStateNoMatches: 'Нет комплексов, соответствующих заданным критериям',
      complexAltText: 'Комплекс',
      noNameText: 'Без названия',
      complexNumberPrefix: 'Комплекс №',
      priceFromPrefix: 'от',
      developerPrefix: 'Застройщик:',
      districtPrefix: 'Район:',
      completionPrefix: 'Сдача:',
      createdAt: 'Создан',
      updatedAt: 'Обновлен'
    },

    // Complex Detail
    complexDetail: {
      loadingText: 'Загрузка комплекса...',
      accessDenied: 'Доступ запрещен',
      accessDeniedMessage: 'У вас нет прав для просмотра этого комплекса',
      complexNotFound: 'Комплекс не найден',
      complexNotFoundMessage: 'Комплекс с указанным ID не существует',
      backButton: 'Назад',
      cancelButton: 'Отменить',
      saveButton: 'Сохранить',
      editButton: 'Редактировать',
      removeFromListing: 'Убрать из листинга',
      returnToListing: 'Вернуть в листинг',
      removedFromListing: 'Убран из листинга',
      addPhotoButton: 'Добавить фото',
      uploadingText: 'Загрузка...',
      watchVideoButton: 'Видео о комплексе',
      view3DTourButton: 'Посмотреть 3D тур',
      buildingProgressButton: 'Прогресс строительства',
      openChessboardButton: 'Шахматка объектов',
      linksAndDocuments: 'Ссылки и документы',
      description: 'Описание',
      translating: 'Переводится...',
      priceFromLabel: 'Цена от',
      priceMinFromObjects: '(минимальная из объектов)',
      priceFromComplex: '(цена комплекса)',
      commissionLabel: 'Вознаграждение',
      developerLabel: 'Застройщик',
      districtLabel: 'Район',
      completionDateLabel: 'Дата сдачи',
      coordinatesLabel: 'Координаты',
      videoLabel: 'Видео',
      tourLabel: '3D Тур',
      masterPlanLabel: 'Генплан',
      pricePlaceholder: 'Цена в USD',
      descriptionPlaceholder: 'Описание комплекса',
      videoLinkPlaceholder: 'Ссылка на видео',
      tourLinkPlaceholder: '3D тур ссылка',
      masterPlanLinkPlaceholder: 'Ссылка на генплан',
      viewMasterPlanButton: 'Посмотреть генплан',
      photoAltText: 'Фото',
      autoCalculatedPriceText: 'Автоматически рассчитана как минимальная цена среди объектов комплекса',
      changesSaved: 'Изменения сохранены',
      saveError: 'Произошла ошибка при сохранении изменений',
      editPermissionError: 'У вас нет прав для редактирования комплекса',
      photosUploadSuccess: 'Фотографии успешно загружены',
      photosUploadError: 'Произошла ошибка при загрузке фотографий',
      photoNotFound: 'Фотография не найдена',
      photoDeleteSuccess: 'Фотография успешно удалена',
      photoLinkDeleted: 'Ссылка на фотографию удалена из базы данных',
      photoDeleteError: 'Error deleting photo',
      databaseUpdateError: 'Failed to update database information',
      dataLoadError: 'Error loading complex data',
      developerLoadError: 'Error loading developer',
      complexNameLoadError: 'Error loading complex name',
      createdAt: 'Создан',
      updatedAt: 'Обновлен',
      
      // Additional Options
      additionalOptions: 'Дополнительные опции',
      onComplexTerritory: 'На территории комплекса',
      
      // Option badges
      spaSalon: 'СПА салон',
      restaurant: 'Ресторан',
      fitnessGym: 'Фитнес зал',
      playground: 'Детская площадка',
      shop: 'Магазин',
      cinema: 'Кинотеатр',
      coworking: 'Коворкинг',
      concertHall: 'Концертный зал',
      parking: 'Парковка',
      artificialWave: 'Искусственная волна',
      conferenceHall: 'Конференц зал'
    },

    // Properties Gallery
    propertiesGallery: {
      title: 'Галерея объектов',
      developerPropertiesTitle: 'Объекты застройщика',
      searchPlaceholder: 'Поиск по названию, району или типу...',
      statusLabel: 'Статус',
      filtersTitle: 'Фильтры',
      priceLabel: 'Цена (USD)',
      pricePlaceholderFrom: 'От',
      pricePlaceholderTo: 'До',
      areaLabel: 'Жилая площадь (м²)',
      bedroomsLabel: 'Спальни',
      allBedrooms: 'Все',
      studio: 'Студия',
      bedroomsText: 'Спален',
      unitsCountText: 'Количество юнитов',
      districtLabel: 'Район',
      allDistricts: 'Все районы',
      typeLabel: 'Тип',
      allTypes: 'Все типы',
      resetFiltersButton: 'Сбросить фильтры',
      searchResultsText: 'Найдено объектов: {count}',
      emptyStateNoDeveloperProperties: 'У вас пока нет объектов в системе',
      emptyStateNoProperties: 'Объекты не найдены',
      emptyStateNoMatches: 'Нет объектов, соответствующих заданным критериям',
      propertyAltText: 'Объект',
      missingFieldsTitle: 'Незаполненные поля',
      newPricePlaceholder: 'Новая цена',
      areaText: 'м²',
      developerText: 'Застройщик:',
      editPermissionError: 'У вас нет прав на редактирование цены',
      priceValidationError: 'Пожалуйста, введите корректную цену',
      priceUpdateSuccess: 'Цена успешно обновлена',
      priceUpdateError: 'Не удалось обновить цену',
      complexLoadError: 'Ошибка при загрузке названия комплекса',
      developerLoadError: 'Ошибка загрузки застройщика',
      createdAt: 'Создан',
      updatedAt: 'Обновлен',
      addedByMe: 'Добавлено мной',
      allStatuses: 'Все статусы',
      statusProject: 'Проект',
      statusUnderConstruction: 'Строится',
      statusReady: 'Готовый',
      statusFromOwner: 'От собственника',
      // Selection mode texts
      selectionTitle: 'Подборка объектов',
      selectionSubtitle: 'Отобрано ИИ-ассистентом специально для вас',
      selectionResultsText: 'Найдено {count} объект(ов) в подборке'
    },

    // Property Detail
    propertyDetail: {
      // Loading states
      loading: 'Загрузка...',
      uploading: 'Загрузка...',
      
      // Navigation
      backButton: 'Назад',
      backToGallery: 'Вернуться в галерею',
      onMap: 'на карте',
      
      // Buttons
      editButton: 'Редактировать',
      saveButton: 'Сохранить',
      cancelButton: 'Отменить',
      addPhotoButton: 'Добавить фото',
      addPhotoButtonSimple: 'Добавить фото',
      createObjectButton: 'Создать объект',
      creatingText: 'Создание...',
      viewButton: 'Просмотр',
      updateButton: 'Обновить',
      uploadButton: 'Загрузить',
      fileTooLarge: 'Файл превышает 20 МБ. Уменьшите размер файла до менее 20 МБ и попробуйте снова.',
      roiCalculatorButton: 'Калькулятор ROI',
      // Agent chats
      agentChatsTitle: 'Чаты по объекту',
      openChat: 'Открыть чат',
      chatDialogTitle: 'Переписка',
      loadingMessages: 'Загрузка сообщений…',
      propertyCardMessage: 'Карточка объекта',
      noChats: 'Чатов по объекту пока нет',
      applicationFromAgent: 'Заявка от агента',
      messagePlaceholder: 'Введите сообщение...',
      sendButton: 'Отправить',
      
      // Field labels
      bedrooms: 'Спален',
      pricePerSqm: 'Цена за м²',
      studio: 'Студия',
      unitsCount: 'Количество юнитов',
      reliabilityRating: 'Рейтинг надежности',
      reliabilityRatingTooltip: 'Рейтинг надежности объекта.\nСоставлен на основе предоставленных документов, опыта и готовых объектов застройщика.',
      area: 'Жилая площадь',
      areaTooltip: 'Только жилая площадь объекта (кухня, гостиная, спальни, ванные)',
      totalArea: 'Общая площадь',
      totalAreaTooltip: 'Общая площадь объекта - жилая площадь + общие зоны (терраса, балкон, руфтоп, барбекю, джакузи и т.д.)',
      developer: 'Застройщик',
      complex: 'Комплекс',
      propertyName: 'Название',
      managementCompany: 'Управляющая компания',
      bathrooms: 'Ванные комнаты',
      floors: 'Этажи',
      district: 'Район',
      buildingType: 'Тип здания',
      constructionStatus: 'Статус строительства',
      distanceToBeach: 'До пляжа',
      distanceToCenter: 'До центра',
      kmUnit: 'км',
      manualRoi: 'ROI (%)',
      manualRoiPlaceholder: 'Введите процент ROI',
      expectedRoi: 'Ожидаемый ROI (%)',
      expectedRoiPlaceholder: 'Введите ожидаемый процент ROI',
      expectedRoiTooltip: 'Ожидаемая годовая доходность с аренды объекта, рассчитанная застройщиком',
      landArea: 'Площадь земли',
      landAreaPlaceholder: 'Введите площадь земли в м²',
      landAreaTooltip: 'Площадь участка земли на котором находится данный объект',
      expectedCost: 'Ожидаемая стоимость',
      expectedCostPlaceholder: 'Введите ожидаемую стоимость в USD',
      expectedCostTooltip: 'Расчетная стоимость объекта, к моменту завершения строительства и сдачи в эксплуатацию',
      landStatus: 'Статус земли',
      pool: 'Бассейн',
      ownership: 'Собственность',
      completionDate: 'Дата завершения',
      years: 'лет',
      description: 'Описание',
      
      // Agent Property Create specific fields
      pricePlaceholder: 'Цена *',
      areaPlaceholder: 'Жилая площадь *',
      bedroomsLabel: 'Спальни',
      statusLabel: 'Статус',
      ownershipFormLabel: 'Форма собственности',
      descriptionPlaceholder: 'Описание объекта',
      
      // Photo counter
      photoCounter: 'Фото: {current} / {total}',
      swipeHint: 'Свайп влево/вправо для переключения фото',
      reorderPhotosHint: 'Перетащите фото, чтобы изменить порядок',
      reorderPhotosSaveHint: 'Не забудьте нажать Сохранить, чтобы применить порядок.',
      
      // Document labels
      documentsSection: 'Документы',
      characteristicsSection: 'Характеристики',
      legalCompanyName: 'Название компании:',
      taxNumber: 'Налоговый номер (NPWP):',
      landUsePermit: 'Разрешение на использование земли (PKKPR):',
      landRightsCertificate: 'Сертификат права на землю (SHGB):',
      landLeaseEndDate: 'Дата окончания аренды земли:',
      buildingPermit: 'Разрешение на строительство (PBG):',
      buildingPermitIMB: 'Разрешение на строительство (IMB):',
      buildingReadinessCertificate: 'Сертификат готовности здания (SLF):',
      layout: 'Планировка объекта:',
      dueDiligence: 'Due Diligence:',
      unbrandedPresentation: 'Презентация комплекса:',
      pkkprFile: 'Файл PKKPR:',
      
      // Options
      typeOptions: {
        villa: 'Вилла',
        apartment: 'Апартаменты',
        house: 'Дом',
        duplex: 'Дюплекс',
        commercial: 'Коммерческая недвижимость',
        apartVilla: 'Апарт-вилла',
        townhouse: 'Таунхаус',
        penthouse: 'Пентхаус',
        land: 'Земельный участок'
      },

      // Translation Manager
      translationManager: {
        title: 'Менеджер переводов',
        originalDescription: 'Оригинальное описание',
        noDescription: 'Описание отсутствует',
        availableTranslations: 'Доступные переводы',
        delete: 'Удалить',
        deleteAll: 'Удалить все',
        noTranslations: 'Переводы отсутствуют',
        noTranslationsHint: 'Переводы появятся здесь, когда пользователи будут просматривать объект на разных языках',
        stats: 'Статистика переводов',
        totalTranslations: 'Всего переводов',
        languages: 'Языки'
      },
      
      buildingTypeOptions: {
        newComplex: 'Новый комплекс',
        renovation: 'Реновация',
        individual: 'Индивидуальный',
        hotel: 'Отель',
        resort: 'Резорт'
      },
      
      statusOptions: {
        project: 'Проект',
        underConstruction: 'Строится',
        ready: 'Готово',
        fromOwner: 'От собственника'
      },
      
      poolOptions: {
        no: 'Нет',
        private: 'Частный',
        shared: 'Общий'
      },
      
      ownershipOptions: {
        leasehold: 'Лизхолд',
        freehold: 'Фрихолд'
      },
      
      // Messages
      notSelected: '(не выбрано)',
      notFound: 'Объект не найден',
      accessDenied: 'Доступ запрещен',
      fileNotUploaded: 'Файл не загружен',
      floorText: 'этаж',
      floorsText: 'этажа',
      
      // Success messages
      changesSaved: 'Изменения успешно сохранены',
      photoUploaded: 'Фотографии успешно загружены',
      photoDeleted: 'Фотография успешно удалена',
      photoLinkDeleted: 'Ссылка на фотографию удалена из базы данных',
      
      // Service verification badge
      serviceVerified: 'Проверено сервисом',
      serviceVerifiedTooltip: 'Данный знак означает, что застройщик и его объекты прошли первичную проверку документов по следующим категориям:\n• Юридическое наименование компании\n• Налоговый номер компании\n• Наличие разрешения на использование земли\n• Наличие сертификатов права на землю\n• Наличие разрешения на строительство/эксплуатацию (или зарегистрированный номер заявки)\n• Соответствие назначению и цвету земли',
      premiumOnlyTooltip: 'Данная опция доступна только для премиум аккаунтов',
      removedFromListing: 'Убран из листинга',
      removeFromListing: 'Убрать из листинга',
      returnToListing: 'Вернуть в листинг',
      
      // Error messages
      editPermissionError: 'У вас нет прав для редактирования этого объекта',
      saveError: 'Произошла ошибка при сохранении изменений',
      photoUploadError: 'Произошла ошибка при загрузке фотографий',
      photoDeleteError: 'Произошла ошибка при удалении фотографии',
      fileUploadError: 'Произошла ошибка при загрузке файла',
      databaseUpdateError: 'Не удалось обновить информацию в базе данных',
      developerLoadError: 'Ошибка загрузки застройщика',
      complexLoadError: 'Ошибка загрузки комплекса',
      documentValidationError: 'Разрешены только цифры, запятые, точки и тире',
      documentValidationPlaceholder: 'Только цифры, запятые, точки, тире',
      
      // Lightbox
      photo: 'Фото',
      createdAt: 'Создан',
      updatedAt: 'Обновлен',
      
      // Additional Options
      additionalOptions: 'Дополнительные опции',
      onComplexTerritory: 'На территории комплекса',
      
      // Option badges
      smartHome: 'Умный дом',
      jacuzzi: 'Джакузи',
      terrace: 'Терраса',
      rooftop: 'Руфтоп',
      balcony: 'Балкон',
      bbq: 'Барбекю',
      furniture: 'Полная мебелировка',
      washingMachine: 'Стиральная машина',
      spaSalon: 'СПА салон',
      restaurant: 'Ресторан',
      fitnessGym: 'Фитнес зал',
      playground: 'Детская площадка',
      shop: 'Магазин',
      cinema: 'Кинотеатр',
      coworking: 'Коворкинг',
      concertHall: 'Концертный зал',
      parking: 'Парковка',
      agentCommission: 'Комиссия агента'
    },

    // Chessboards
    chessboards: {
      title: 'Шахматки',
      createChessboard: 'Создать шахматку',
      createFirstChessboard: 'Создать первую шахматку',
      noChessboards: 'Нет созданных шахматок',
      noChessboardsDescription: 'Создайте первую шахматку для управления планировкой объекта',
      deleteConfirmTitle: 'Подтверждение удаления',
      deleteConfirmText: 'Вы уверены, что хотите удалить шахматку "{name}"?',
      chessboardDeleted: 'Шахматка удалена!',
      deleteError: 'Ошибка удаления шахматки',
      publicLinkCopied: 'Публичная ссылка скопирована!',
      
      // Table headers and labels
      complex: 'Комплекс:',
      totalUnits: 'Всего юнитов:',
      sections: 'Секций:',
      floors: 'Этажей:',
      rows: 'Рядов:',
      publicLinkAvailable: 'Публичная ссылка доступна',
      created: 'Создано:',
      loading: 'Загрузка...',
      untitled: 'Без названия',
      open: 'Открыть',
      delete: 'Удалить',
      copyLink: 'Копировать ссылку',
      openInNewTab: 'Открыть в новой вкладке',
      
      // Status badges
      free: 'Свободно: {count}',
      booked: 'Забронировано: {count}',
      sold: 'Продано: {count}',
      
      // Chessboard page
      chessboardName: 'Название шахматки',
      selectComplex: 'Выберите комплекс',
      noComplexSelected: 'Комплекс не выбран',
      nameRequired: 'Название шахматки обязательно',
      save: 'Сохранить',
      deleteChessboard: 'Удалить',
      addSection: 'Добавить секцию',
      exchangeRate: 'Курс обмена (USD в IDR)',
      
      // Sections and floors
      sectionName: 'Название секции',
      addFloor: 'Добавить этаж',
      floor: 'Этаж',
      addUnit: 'Добавить юнит',
      
      // Units
      unitId: 'ID юнита',
      rooms: 'Комнаты',
      bathrooms: 'Санузлы',
      area: 'Площадь (м²)',
      priceUSD: 'Цена (USD)',
      priceIDR: 'Цена (IDR)',
      showIDRPrice: 'Показать цену в IDR',
      propertyType: 'Тип недвижимости',
      view: 'Вид',
      status: 'Статус',
      
      // Options
      roomOptions: {
        studio: 'Студия',
        one: '1',
        two: '2',
        three: '3',
        four: '4',
        five: '5',
        six: '6'
      },
      
      bathroomOptions: {
        one: '1',
        two: '2',
        three: '3',
        four: '4',
        five: '5',
        six: '6'
      },
      
      propertyTypes: {
        apartments: 'Апартаменты',
        villa: 'Вилла',
        apartVilla: 'Апарт-вилла',
        townhouse: 'Таунхаус',
        penthouse: 'Пентхаус'
      },
      
      views: {
        notSelected: 'Не указано',
        ocean: 'Океан',
        jungle: 'Джунгли',
        pool: 'Бассейн',
        river: 'Река',
        yard: 'Двор',
        volcano: 'Вулкан',
        riceTerraces: 'Рисовые террасы'
      },
      
      statuses: {
        free: 'Свободно',
        booked: 'Забронировано',
        sold: 'Продано'
      },
      
      // Actions
      copy: 'Копировать',
      remove: 'Удалить',
      moveUp: 'Переместить вверх',
      moveDown: 'Переместить вниз',
      
      // Messages
      chessboardSaved: 'Шахматка успешно сохранена',
      chessboardDeletedSuccess: 'Шахматка успешно удалена',
      saveError: 'Ошибка сохранения шахматки',
      loadError: 'Ошибка загрузки шахматки',
      complexLoadError: 'Ошибка загрузки комплексов',
      chessboardNotFound: 'Шахматка не найдена',
      accessDenied: 'Доступ запрещен',
      validationError: 'Исправьте ошибки валидации перед сохранением',
      
      // Validation messages
      nameRequiredError: 'Название шахматки обязательно',
      sectionNameRequired: 'Название секции обязательно',
      duplicateFloor: 'Дублирующийся номер этажа',
      unitIdRequired: 'ID юнита обязателен',
      invalidArea: 'Неверное значение площади',
      invalidPrice: 'Неверное значение цены',
      complexRequired: 'Пожалуйста, выберите комплекс',
      
      // Additional editing texts
      editingChessboard: 'Редактирование шахматки',
      backToList: 'Назад к списку',
      noAvailableComplexes: 'Нет доступных комплексов без шахматки',
      floorButton: 'Этаж',
      noComplexesForDeveloper: 'Нет доступных комплексов для застройщика "{name}" без шахматки',
      
      // Unit form labels
      chessboardFloors: 'Этажи',
      chessboardArea: 'Площадь (м²)',
      chessboardRooms: 'Спальни',
      chessboardBathrooms: 'Санузлы',
      chessboardView: 'Вид',
      side: 'Сторона',
      priceWithRate: 'Цена (USD → IDR)',
      enterPrice: 'Введите цену',
      showPriceOnPublic: 'Показать цену на публичной странице',
      showPrice: 'Показать цену',
      
      // Floor form labels
      noNumber: 'Без номера',
      floorType: 'этаж',
      rowType: 'ряд',
      unitButton: 'Юнит',
      
      // Side options
      sideOptions: {
        notSpecified: 'Не указано',
        sunrise: 'Рассветная',
        sunset: 'Закатная'
      },
      
      // Status options with prefixes
      statusOptions: {
        free: '✓ Свободно',
        booked: '⏳ Забронировано',
        sold: '✖ Продано'
      },
      
      // Additional features
      features: {
        rooftop: 'Руфтоп',
        terrace: 'Терраса'
      },
      createdAt: 'Создано',
      updatedAt: 'Обновлено'
    },

    // ROI Calculator
    roiCalculator: {
      title: 'Расчет ROI',
      close: '✕',
      
      // Sections
      costsInvestmentsTitle: 'Затраты и инвестиции',
      calculationOptionsTitle: 'Опции расчета',
      rentalIncomeTitle: 'Арендный доход',
      operationalMetricsTitle: 'Операционные расходы',
      calculationResults: 'Результаты расчета',
      
      // Cost and Investment Fields
      propertyPrice: 'Стоимость недвижимости ($)',
      renovationCosts: 'Ремонт и обустройство ($)',
      legalFees: 'Юридические расходы ($)',
      additionalExpenses: 'Дополнительные расходы ($)',
      investmentPeriod: 'Период инвестирования (лет)',
      selectPeriod: 'Выберите период',
      years3: '3 года',
      years5: '5 лет',
      years10: '10 лет',
      years20: '20 лет',
      years30: '30 лет',
      
      // Rental Income Fields
      dailyRate: 'Стоимость за сутки ($)',
      occupancyRate: 'Заполняемость (%)',
      rentGrowthRate: 'Рост арендной платы в год (%)',
      operationStartYear: 'Начало эксплуатации через (год)',
      
      // Operational Metrics Fields
      maintenanceFees: 'Обслуживание в год (%)',
      utilityBills: 'Коммунальные платежи в год (%)',
      annualTax: 'Налоги в год (%)',
      propertyManagement: 'Управление недвижимостью (%)',
      appreciationYear1: 'Удорожание объекта в первый год (%)',
      appreciationYear2: 'Удорожание объекта во второй год (%)',
      appreciationYear3: 'Удорожание объекта в третий год (%)',
      examplePlaceholder: 'Например: 5',
      examplePlaceholder2: 'Например: 3',
      examplePlaceholder3: 'Например: 2',
      
      // Scenario Selection
      calculationScenario: 'Сценарий расчета',
      selectScenario: 'Выберите сценарий',
      pessimistic: 'Пессимистичный (70%)',
      realistic: 'Реалистичный (100%)',
      optimistic: 'Оптимистичный (130%)',
      
      // Information Messages
      requiredFieldsTitle: 'Для выполнения расчета заполните следующие обязательные поля:',
      requiredFields: [
        '• Стоимость недвижимости',
        '• Дневная ставка аренды',
        '• Процент заполняемости'
      ],
      optionalFieldsNote: 'Остальные поля заполняются по желанию для более точного расчета.',
      
      // Buttons
      updateCalculation: 'Обновить расчет',
      saveCalculation: 'Сохранить расчет',
      createPublicPage: 'Создать публичную страницу',
      copyLink: '📋 Копировать ссылку',
      
      // Result Cards
      totalInvestments: 'Общие инвестиции',
      annualRentalIncome: 'Годовой доход от аренды',
      annualExpenses: 'Годовые расходы',
      netProfitPerYear: 'Чистая прибыль в год',
      roi: 'ROI',
      paybackPeriod: 'Срок окупаемости',
      years: 'лет',
      totalRoiPeriod: 'Общий ROI за период',
      propertyAppreciation: 'Удорожание недвижимости',
      finalPropertyValue: 'Финальная стоимость недвижимости',
      
      // Chart
      period: 'Период',
      year: 'Год',
      profitPerYear: 'Прибыль за год',
      accumulatedProfit: 'Накопленная прибыль',
      propertyValue: 'Стоимость недвижимости',
      noChartData: 'Нет данных для отображения графика',
      
      // Success/Error Messages
      calculationSaved: 'Расчет успешно сохранен!',
      calculationSaveError: 'Ошибка при сохранении расчета',
      linkCopied: 'Ссылка скопирована в буфер обмена!',
      linkCopyError: 'Не удалось скопировать ссылку',
      publicPageCreated: 'Публичная страница создана и открыта в новой вкладке',
      publicPageError: 'Ошибка при создании публичной страницы',
      calculateFirstError: 'Сначала выполните расчет ROI',
      
      // PDF Export
      language: 'Язык',
      english: 'English',
      russian: 'Русский',
      indonesian: 'Indonesian',
      pdf: 'PDF',
      loading: '...',
      createdAt: 'Создан',
      updatedAt: 'Обновлен',
      
      // Additional translations
      savedCalculations: 'Сохраненные расчеты',
      loginToSave: 'Войдите в систему для сохранения и просмотра расчетов',
      noSavedCalculations: 'Нет сохраненных расчетов',
      otaCommission: 'Комиссия площадок (%)',
      calculationName: 'Название расчета',
      exportToCSV: 'Экспорт в CSV',
      basedOnDataAndScenario: 'На основе введенных данных и сценария',
      
      // Field tooltips
      formulaLabel: 'Как участвует в расчетах',
      tooltips: {
        propertyPrice: {
          title: 'Стоимость покупки недвижимости',
          description: 'Общая стоимость приобретения недвижимости. Это базовая сумма для всех расчетов ROI.',
          formula: 'Это значение добавляется к затратам на ремонт, юридическим расходам и дополнительным расходам для расчета общих первоначальных инвестиций. Общие инвестиции используются как знаменатель в расчетах ROI.'
        },
        renovationCosts: {
          title: 'Затраты на ремонт и обустройство',
          description: 'Все затраты, связанные с подготовкой недвижимости к сдаче в аренду, включая мебель, бытовую технику и ремонт.',
          formula: 'Это значение добавляется к цене покупки, юридическим расходам и дополнительным расходам для расчета общих первоначальных инвестиций. Более высокие затраты на ремонт увеличивают общие инвестиции, что влияет на расчеты ROI.'
        },
        legalFees: {
          title: 'Юридические и административные расходы',
          description: 'Затраты на юридические услуги, регистрацию недвижимости, разрешения и другие административные расходы.',
          formula: 'Это значение добавляется к цене покупки, затратам на ремонт и дополнительным расходам для расчета общих первоначальных инвестиций. Эти расходы являются частью ваших первоначальных инвестиций и влияют на общий расчет ROI.'
        },
        additionalExpenses: {
          title: 'Дополнительные первоначальные расходы',
          description: 'Любые другие единовременные затраты, не покрытые другими категориями (например, страховка, первоначальный маркетинг).',
          formula: 'Это значение добавляется к цене покупки, затратам на ремонт и юридическим расходам для расчета общих первоначальных инвестиций. Эти дополнительные расходы увеличивают общую сумму инвестиций.'
        },
        investmentPeriod: {
          title: 'Период инвестирования',
          description: 'Количество лет, на которые вы хотите рассчитать доходность инвестиций.',
          formula: 'Это определяет, на сколько лет калькулятор будет прогнозировать ваш арендный доход, расходы и удорожание недвижимости. Итоговый ROI рассчитывается как: (Общий доход за период / Общие инвестиции) × 100%.'
        },
        dailyRate: {
          title: 'Дневная ставка аренды',
          description: 'Сумма, которую вы планируете взимать за день аренды недвижимости.',
          formula: 'Это значение умножается на 365 дней и ваш процент заполняемости для расчета годового арендного дохода. Например: $100/день × 365 × 70% = $25,550 годового дохода. Этот доход затем используется для расчета прибыли и ROI.'
        },
        occupancyRate: {
          title: 'Процент заполняемости',
          description: 'Процент времени, в течение которого недвижимость ожидается сданной в аренду (например, 70% означает сдачу 255 дней в год).',
          formula: 'Этот процент используется для расчета вашего фактического годового арендного дохода. Например: если ваша дневная ставка $100 и заполняемость 70%, ваш годовой доход = $100 × 365 × 70% = $25,550. Это влияет на все расчеты прибыли.'
        },
        rentGrowthRate: {
          title: 'Годовой рост арендной платы',
          description: 'Ожидаемое годовое увеличение арендных ставок из-за роста рынка и инфляции.',
          formula: 'Этот процент используется для увеличения вашего арендного дохода каждый год. Например: если ваш начальный годовой доход $25,550 и рост 5%, доход 2-го года = $25,550 × (1 + 5%) = $26,828. Это накапливается за период инвестирования.'
        },
        operationStartYear: {
          title: 'Год начала эксплуатации',
          description: 'Год, когда начинается арендная деятельность (0 = немедленное начало, 1 = начало через 1 год и т.д.).',
          formula: 'Это определяет, когда вы начинаете получать арендный доход. Если установлено 0, вы получаете доход с 1-го года. Если установлено 1, вы не получаете доход в 1-м году, но начинаете получать во 2-м году. Это влияет на общий расчет прибыли за период инвестирования.'
        },
        maintenanceFees: {
          title: 'Годовые затраты на обслуживание',
          description: 'Процент от арендного дохода, расходуемый на обслуживание недвижимости, ремонт и регулярное содержание.',
          formula: 'Этот процент применяется к вашему годовому арендному доходу для расчета затрат на обслуживание. Например: если ваш годовой доход $25,550 и обслуживание 10%, затраты = $25,550 × 10% = $2,555. Эти затраты уменьшают вашу годовую прибыль.'
        },
        utilityBills: {
          title: 'Коммунальные платежи',
          description: 'Процент от арендного дохода, расходуемый на коммунальные услуги (электричество, вода, интернет и т.д.).',
          formula: 'Этот процент применяется к вашему годовому арендному доходу для расчета коммунальных расходов. Например: если ваш годовой доход $25,550 и коммунальные 8%, затраты = $25,550 × 8% = $2,044. Эти затраты уменьшают вашу годовую прибыль.'
        },
        annualTax: {
          title: 'Годовая налоговая ставка',
          description: 'Налоговая ставка, применяемая к арендному доходу (подоходный налог, налог на недвижимость и т.д.).',
          formula: 'Этот процент применяется к вашей прибыли ПОСЛЕ операционных расходов (обслуживание + коммунальные + управление). Например: если ваш арендный доход $25,550, операционные расходы $5,000 и налоговая ставка 20%, налоги = ($25,550 - $5,000) × 20% = $4,110.'
        },
        propertyManagement: {
          title: 'Комиссия управляющей компании',
          description: 'Процент от арендного дохода, выплачиваемый службам управления недвижимостью.',
          formula: 'Этот процент применяется к вашему годовому арендному доходу для расчета комиссии управляющей компании. Например: если ваш годовой доход $25,550 и комиссия 5%, затраты = $25,550 × 5% = $1,278. Эти затраты уменьшают вашу годовую прибыль.'
        },
        appreciationYear1: {
          title: 'Удорожание недвижимости в первый год',
          description: 'Ожидаемое увеличение стоимости недвижимости в течение первого года владения.',
          formula: 'Этот процент увеличивает стоимость вашей недвижимости в 1-м году. Например: если ваши общие инвестиции $200,000 и удорожание 5%, стоимость 1-го года = $200,000 × (1 + 5%) = $210,000. Это удорожание добавляется к расчету общего дохода.'
        },
        appreciationYear2: {
          title: 'Удорожание недвижимости во второй год',
          description: 'Ожидаемое увеличение стоимости недвижимости в течение второго года владения.',
          formula: 'Этот процент увеличивает стоимость вашей недвижимости во 2-м году, основываясь на стоимости 1-го года. Например: если стоимость 1-го года $210,000 и удорожание 3%, стоимость 2-го года = $210,000 × (1 + 3%) = $216,300. Это удорожание добавляется к расчету общего дохода.'
        },
        appreciationYear3: {
          title: 'Удорожание недвижимости в третий год',
          description: 'Ожидаемое увеличение стоимости недвижимости в течение третьего года владения.',
          formula: 'Этот процент увеличивает стоимость вашей недвижимости в 3-м году, основываясь на стоимости 2-го года. Например: если стоимость 2-го года $216,300 и удорожание 2%, стоимость 3-го года = $216,300 × (1 + 2%) = $220,626. После 3-го года стоимость недвижимости остается постоянной до конца периода инвестирования.'
        }
      }
    },
    // Building Progress
    buildingProgress: {
      title: 'Прогресс строительства',
      loading: 'Loading...',
      errorLoading: 'Error loading data',
      errorUpload: 'Error uploading files',
      errorDelete: 'Error deleting file',
      successUpload: 'Files uploaded successfully',
      successDelete: 'File deleted',
      successLinkCopied: 'Public link copied to clipboard',
      noAccessUpload: 'You do not have permission to upload files',
      noAccessDelete: 'You do not have permission to delete files',
      
      // Buttons
      view: 'View',
      add: 'Add',
      addMore: 'Add More',
      copyPublicLink: 'Copy Public Link',
      addPeriod: 'Add Period',
      backToProgress: 'Back to building progress',
      
      // Upload modal
      uploadFiles: 'Upload Files',
      uploadingFiles: 'Uploading files...',
      supportedFormats: 'Images and video files are supported',
      
      // Media counts
      photos: 'photos',
      videos: 'videos',
      photo: 'photo',
      video: 'video',
      
      // Album description
      albumDescription: 'Album Description',
      addDescription: 'Add Description',
      editDescription: 'Edit Description',
      saveDescription: 'Save Description',
      cancelEdit: 'Cancel Edit',
      descriptionPlaceholder: 'Enter description for this album...',
      descriptionSaved: 'Description saved',
      descriptionError: 'Error saving description',
      
      // Confirm dialog
      confirmDelete: 'Are you sure you want to delete this file?',
      
      // Error messages
      dataNotFound: 'Data not found',
      noData: 'No data available for this month',
      
      // Months
      months: {
        january: 'January',
        february: 'February',
        march: 'March',
        april: 'April',
        may: 'May',
        june: 'June',
        july: 'July',
        august: 'August',
        september: 'September',
        october: 'October',
        november: 'November',
        december: 'December'
      },
      createdAt: 'Created',
      updatedAt: 'Updated'
    },

    // Education
    education: {
      title: 'Обучение',
      description: 'Обучающие материалы и курсы',
      sections: 'Разделы',
      topics: 'Темы',
      lessons: 'Уроки',
      createSection: 'Создать раздел',
      editSection: 'Редактировать раздел',
      deleteSection: 'Удалить раздел',
      createTopic: 'Создать тему',
      editTopic: 'Редактировать тему',
      deleteTopic: 'Удалить тему',
      createLesson: 'Создать урок',
      editLesson: 'Редактировать урок',
      deleteLesson: 'Удалить урок',
      sectionName: 'Название раздела',
      sectionNameEn: 'Название раздела (Английский)',
      sectionNameRu: 'Название раздела (Русский)',
      sectionNameId: 'Название раздела (Индонезийский)',
      sectionDescription: 'Описание раздела',
      sectionDescriptionEn: 'Описание раздела (Английский)',
      sectionDescriptionRu: 'Описание раздела (Русский)',
      sectionDescriptionId: 'Описание раздела (Индонезийский)',
      topicName: 'Название темы',
      topicNameEn: 'Название темы (Английский)',
      topicNameRu: 'Название темы (Русский)',
      topicNameId: 'Название темы (Индонезийский)',
      topicDescription: 'Описание темы',
      topicDescriptionEn: 'Описание темы (Английский)',
      topicDescriptionRu: 'Описание темы (Русский)',
      topicDescriptionId: 'Описание темы (Индонезийский)',
      lessonName: 'Название урока',
      lessonNameEn: 'Название урока (Английский)',
      lessonNameRu: 'Название урока (Русский)',
      lessonNameId: 'Название урока (Индонезийский)',
      lessonDescription: 'Описание урока',
      lessonDescriptionEn: 'Описание урока (Английский)',
      lessonDescriptionRu: 'Описание урока (Русский)',
      lessonDescriptionId: 'Описание урока (Индонезийский)',
      videoUrlEn: 'Ссылка на видео (Английский)',
      videoUrlRu: 'Ссылка на видео (Русский)',
      videoUrlId: 'Ссылка на видео (Индонезийский)',
      order: 'Порядок',
      save: 'Сохранить',
      cancel: 'Отмена',
      loading: 'Загрузка...',
      noSections: 'Разделы не найдены',
      noTopics: 'Темы не найдены',
      noLessons: 'В этой теме нет уроков',
      sectionCreated: 'Раздел успешно создан',
      sectionUpdated: 'Раздел успешно обновлен',
      sectionDeleted: 'Раздел успешно удален',
      topicCreated: 'Тема успешно создана',
      topicUpdated: 'Тема успешно обновлена',
      topicDeleted: 'Тема успешно удалена',
      lessonCreated: 'Урок успешно создан',
      lessonUpdated: 'Урок успешно обновлен',
      lessonDeleted: 'Урок успешно удален',
      confirmDeleteSection: 'Вы уверены, что хотите удалить этот раздел? Все темы и уроки также будут удалены.',
      confirmDeleteTopic: 'Вы уверены, что хотите удалить эту тему? Все уроки также будут удалены.',
      confirmDeleteLesson: 'Вы уверены, что хотите удалить этот урок?',
      errorLoading: 'Ошибка загрузки данных',
      errorSaving: 'Ошибка сохранения данных',
      errorDeleting: 'Ошибка удаления данных',
      noPermission: 'У вас нет прав для выполнения этого действия',
      topicNotFound: 'Тема не найдена',
      lessonNotFound: 'Урок не найден',
      enterLessonName: 'Введите название урока хотя бы на одном языке',
      addVideoUrl: 'Добавьте хотя бы одну ссылку на видео',
      watchVideo: 'Смотреть видео',
      backToSections: 'Назад к разделам',
      backToTopics: 'Назад к темам',
      backToLessons: 'Назад к урокам',
      viewLessons: 'Просмотр уроков',
      goToEducation: 'Перейти к обучению',
      backToSection: 'Назад к разделу',
      videoNotAvailable: 'Видео недоступно на вашем языке',
      selectLanguage: 'Выберите язык',
      english: 'Английский',
      russian: 'Русский',
      indonesian: 'Индонезийский',
      infoSection: 'Информация',
      navigationSection: 'Навигация',
      lessonDescriptionSection: 'Описание урока',
      moveTopic: 'Переместить тему',
      moveTopicToSection: 'Переместить тему в другой раздел',
      availableRoles: 'Доступные роли',
      createdAt: 'Создан',
      updatedAt: 'Обновлен'
    },

    // Developers List
    developersList: {
      title: 'Список застройщиков',
      titleForDeveloper: 'О застройщике',
      addDeveloper: 'Добавить застройщика',
      noDevelopers: 'Нет застройщиков',
      developersFound: 'Найдено застройщиков: {count}',
      editDeveloper: 'Редактировать',
      loading: 'Загрузка...',
      errorLoading: 'Ошибка загрузки застройщиков',
      createdAt: 'Создан',
      updatedAt: 'Обновлен'
    },

    // Edit Developer
    editDeveloper: {
      addTitle: 'Добавить застройщика',
      editTitle: 'Редактировать застройщика',
      nameLabel: 'Название',
      namePlaceholder: 'Введите название застройщика',
      descriptionLabel: 'Описание',
      descriptionPlaceholder: 'Введите описание застройщика',
      approvedLabel: 'Проверено сервисом',
      logoLabel: 'Логотип',
      uploadLogo: 'Загрузить логотип',
      currentLogo: 'Текущий логотип',
      save: 'Сохранить',
      add: 'Добавить',
      saving: 'Сохранение...',
      saveSuccess: 'Сохранено!',
      saveError: 'Ошибка сохранения!',
      loadError: 'Ошибка загрузки данных!'
    },

    // Premium Features
    premiumFeatures: {
      title: 'Премиум подписка для застройщиков',
      subtitle: 'Максимальная видимость ваших объектов среди риелторов и увеличение продаж через платформу IT Agent',
      
      // Features
      features: {
        iosAppPlacement: {
          title: 'Размещение на главной странице приложения и сайта',
          description: 'Ваши объекты и комплексы будут отображаться на главной странице приложения IT Agent для всех риелторов, значительно увеличивая видимость ваших предложений.',
          benefit: 'Повышенная видимость среди агентов и инвесторов'
        },
        pushNotifications: {
          title: 'Push-уведомления всем агентам',
          description: 'Отправляйте уведомления о новых объектах, акциях и важных событиях напрямую всем риелторам в приложении IT Agent.',
          benefit: 'Прямая связь с агентами'
        },
        verifiedBadge: {
          title: 'Значок "Проверенный сервис"',
          description: 'Специальный значок на страницах ваших объектов и комплексов, который повышает доверие и конверсию среди агентов и клиентов.',
          benefit: 'Повышенное доверие и конверсия'
        },
        publicWebPage: {
          title: 'Публичная веб-страница',
          description: 'Полноценная веб-страница с информацией о ваших объектах, которую можно использовать вне приложения и делиться с клиентами и партнерами.',
          benefit: 'Расширенные каналы продаж'
        },
        ratingBoost: {
          title: 'Повышение рейтинга объектов',
          description: 'Ваши объекты получают приоритет в каталоге и акцентированное отображение звёзд рейтинга — так же, как в публичной галерее, чтобы покупатели замечали вас быстрее.',
          benefit: 'Больше показов и переходов'
        },
        aiTelegramBot: {
          title: 'Собственный ИИ Telegram‑бот',
          description: 'Запустите брендированного ИИ‑ассистента, который 24/7 отвечает на вопросы клиентов, презентует объекты, записывает на показы и собирает заявки.',
          benefit: 'Автогенерация лидов 24/7'
        },
        crmSystem: {
          title: 'Встроенная CRM для лидов',
          description: 'Единое место для приёма и обработки заявок с публичной страницы и ИИ‑бота, с возможностью подключения внешних источников трафика.',
          benefit: 'Быстрая обработка и рост конверсии'
        },
        contentFactory: {
          title: 'Создание контента с помощью ИИ',
          description: 'Автоматизируйте создание постов для ваших социальных сетей.',
          benefit: 'Стабильный контент без лишних усилий'
        }
      },

      // Additional benefits
      additionalBenefits: 'Дополнительные преимущества',
      benefits: [
        'Увеличение количества просмотров ваших объектов',
        'Прямой доступ к базе данных риелторов',
        'Повышение доверия и авторитета бренда',
        'Автоматизация процесса продвижения объектов',
        'Аналитика и статистика просмотров',
        'Приоритетная поддержка от команды IT Agent'
      ],

      // Statistics
      statistics: {
        agents: 'Риелторов',
        viewsIncrease: 'Рост просмотров',
        availability: 'Доступность'
      },

      // CTA section
      cta: {
        title: 'Готовы увеличить продажи?',
        subtitle: 'Присоединяйтесь к премиум застройщикам и получите максимальную видимость ваших объектов среди риелторов',
        subscribeButton: 'Подписаться на премиум',
        footer: 'Без скрытых комиссий • Отмена в любое время • Приоритетная поддержка'
      }
    },

    // Notifications Page
    notificationsPage: {
      title: 'Управление уведомлениями',
      subtitle: 'Управление рассылкой push-уведомлений для ваших объектов',
      
      // Statistics
      statistics: {
        sentToday: 'Отправлено сегодня',
        totalSent: 'Всего отправлено',
        lastSent: 'Последняя отправка',
        remaining: 'Осталось',
        of: 'из',
        total: 'Всего',
        never: 'Никогда'
      },

      // Tabs
      tabs: {
        send: 'Отправить',
        history: 'История'
      },

      // Send Form
      sendForm: {
        title: 'Создать уведомление',
        description: 'Отправьте уведомление пользователям iOS приложения',
        titleLabel: 'Заголовок',
        titlePlaceholder: 'Введите заголовок уведомления',
        bodyLabel: 'Текст сообщения',
        bodyPlaceholder: 'Введите текст уведомления',
        characters: 'символов',
        targetAudience: 'Уведомление будет отправлено всем пользователям iOS приложения',
        targetAudienceLabel: 'Целевая аудитория',
        targetAudienceAll: 'Все пользователи',
        targetAudienceRole: 'Пользователи с определенной ролью',
        roleSelectLabel: 'Выберите роль',
        roleSelectPlaceholder: 'Выберите роль пользователя',
        sendButton: 'Отправить уведомление',
        sending: 'Отправка...',
        validation: {
          titleRequired: 'Заголовок обязателен',
          bodyRequired: 'Текст сообщения обязателен',
          titleTooLong: 'Заголовок слишком длинный',
          bodyTooLong: 'Текст сообщения слишком длинный',
          roleRequired: 'Пожалуйста, выберите роль'
        }
      },

      // History
      history: {
        title: 'История уведомлений',
        description: 'Просмотр отправленных уведомлений',
        noNotifications: 'Уведомления еще не отправлялись',
        sentToAllUsers: 'Отправлено всем пользователям',
        delivered: 'Доставлено',
        errors: 'Ошибок',
        status: {
          sent: 'Отправлено',
          delivered: 'Доставлено',
          failed: 'Ошибка',
          pending: 'В ожидании'
        }
      },

      // Notifications
      notifications: {
        success: {
          title: 'Уведомление отправлено успешно!',
          message: 'Доставлено: {successCount}, Ошибок: {failureCount}'
        },
        error: {
          title: 'Ошибка отправки',
          message: 'Произошла неизвестная ошибка'
        },
        authError: {
          title: 'Ошибка авторизации',
          message: 'Пользователь не авторизован. Пожалуйста, перезагрузите страницу.'
        }
      },

      // Access Control
      accessControl: {
        forbidden: 'Доступ запрещен',
        noPermission: 'У вас нет прав для доступа к этому разделу.'
      },

      // User Roles
      roles: {
        admin: 'Администратор',
        moderator: 'Модератор',
        agent: 'Агент',
        premiumAgent: 'Премиум агент',
        developer: 'Застройщик',
        premiumDeveloper: 'Премиум застройщик',
        user: 'Пользователь'
      },

      // Moderation
      moderation: {
        onModeration: 'На модерации'
      }
    },

    // Technical Supervision
    technicalSupervision: {
      title: 'Технический надзор',
      subtitle: 'Управление отчетами технического надзора строительных объектов',
      accessDenied: 'Доступ запрещен',
      adminOnlyAccess: 'Раздел "Технадзор" доступен только администраторам',
      
      // Projects
      addProject: 'Добавить проект',
      createProject: 'Создать проект',
      editProject: 'Редактировать проект',
      projectName: 'Название проекта',
      projectNamePlaceholder: 'Например: ЖК Солнечный, Дом по ул. Пушкина',
      projectDescriptionPlaceholder: 'Краткое описание проекта',
      noProjects: 'Нет проектов',
      noProjectsDescription: 'Создайте первый проект для начала работы с техническим надзором',
      createFirstProject: 'Создать первый проект',
      projectHasSections: 'Нельзя удалить проект, в котором есть разделы',
      totalSections: 'Всего разделов',
      currentProject: 'Текущий проект',
      backToProjects: 'Назад к проектам',
      address: 'Адрес',
      addressPlaceholder: 'Полный адрес объекта',

      // Sections
      addSection: 'Добавить раздел',
      createSection: 'Создать раздел',
      editSection: 'Редактировать раздел',
      sectionName: 'Название раздела',
      sectionNamePlaceholder: 'Например: Фундамент, Стены, Электрика',
      sectionDescriptionPlaceholder: 'Краткое описание раздела',
      noSections: 'Нет разделов',
      noSectionsDescription: 'Создайте первый раздел для начала работы с техническим надзором',
      createFirstSection: 'Создать первый раздел',
      sectionHasInspections: 'Нельзя удалить раздел, в котором есть обследования',
      totalInspections: 'Всего обследований',
      
      // Inspections
      addInspection: 'Добавить обследование',
      createInspection: 'Создать обследование',
      editInspection: 'Редактировать обследование',
      inspectionTitle: 'Название обследования',
      inspectionTitlePlaceholder: 'Например: Штукатурка, Проводка',
      inspectionsIn: 'Обследования в разделе',
      
      // Fields
      location: 'Расположение',
      locationPlaceholder: 'Этаж, комната, участок',
      orderNumber: 'Номер очередности',
      description: 'Описание',
      descriptionPlaceholder: 'Общее описание проведенного обследования',
      defects: 'Замечания и дефекты',
      defectsPlaceholder: 'Описание найденных дефектов и нарушений',
      risks: 'Риски и опасности',
      risksPlaceholder: 'Чем опасны найденные дефекты',
      recommendations: 'Рекомендации по устранению',
      recommendationsPlaceholder: 'Как устранить найденные проблемы',
      
      // Status
      status: 'Статус',
      statusPending: 'В ожидании',
      statusInProgress: 'В процессе',
      statusCompleted: 'Завершено',
      statusCritical: 'Критично',
      completed: 'Завершено',
      inProgress: 'В процессе',
      critical: 'Критично',
      
      // Photos
      photos: 'Фотографии',
      uploadPhotos: 'Загрузить фотографии',
      uploading: 'Загрузка...',
      photosUploadSuccess: 'Фотографии загружены успешно',
      photosUploadError: 'Ошибка загрузки фотографий',
      
      // Common
      created: 'Создано',
      
      // Public page
      publicPageSubtitle: 'Отчет технического надзора',
      projectNotFound: 'Проект не найден',
      loadError: 'Ошибка загрузки данных',
      copyPublicLink: 'Скопировать ссылку на публичную страницу',
      publicLinkCopied: 'Ссылка на публичную страницу скопирована',
      publicLinkCopyError: 'Ошибка копирования ссылки',
      projectInfo: 'Информация об отчете',
      projectCreated: 'Отчет создан',
      lastUpdated: 'Последнее обновление',
      noInspectionsInSection: 'Обследований в данном разделе пока нет',
      noSectionsInProject: 'В данном проекте пока нет разделов технического надзора'
    }
  },
  id: {
    leadForm: {
      writeToAgent: 'Ajukan permintaan',
      writeInWhatsapp: 'Tulis di WhatsApp',
        leaveRequestToAgent: 'Ajukan permintaan ke agen',
        agentContactInfo: 'Agen akan menghubungi Anda di messenger yang nyaman untuk memberikan semua detail tentang properti',
        messengerLabel: 'Messenger yang disukai',
        whatsapp: 'Hubungi melalui WhatsApp',
        telegram: 'Hubungi melalui Telegram',
        manageProperty: 'Kelola properti',
      name: 'Nama',
      phone: 'Telepon',
      cancel: 'Batal',
      send: 'Kirim',
      sentSuccess: 'Permintaan Anda telah dikirim',
      sentError: 'Gagal mengirim permintaan',
      accessError: 'Kesalahan akses. Silakan coba lagi.',
      serviceUnavailable: 'Layanan sementara tidak tersedia. Silakan coba nanti.',
      errorPrefix: 'Kesalahan: ',
      addedByAgent: 'Ditambahkan oleh agen',
      agentInfo: 'Informasi Agen',
      agentName: 'Nama Agen',
      agentPhone: 'Telepon Agen',
      agentEmail: 'Email Agen',
      clientLeadsTitle: 'Permintaan Klien',
      clientLeadsSubtitle: 'Permintaan dari klien untuk properti ini',
      noClientLeads: 'Belum ada permintaan klien untuk properti ini',
      clientName: 'Nama Klien',
      clientPhone: 'Telepon Klien',
      clientMessenger: 'Messenger yang Disukai',
      requestDate: 'Tanggal Permintaan',
      phoneCopied: 'Nomor telepon disalin',
      copyPhoneTooltip: 'Salin nomor telepon'
    },
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
    publicDocs: {
      title: 'Lihat informasi dan dokumen detail',
      openAccess: 'Buka akses',
      modal: {
        title: 'Buka akses penuh',
        colOneTitle: 'Buka akses ke properti ini',
        colOneDesc: 'Pembayaran satu kali untuk melihat detail lengkap properti ini, kompleksnya, dan dokumen.',
        colOnePrice: '$29',
        colOneButton: 'Pembelian sekali',
        colTwoTitle: 'Akses penuh ke semua listing',
        colTwoDesc: 'Langganan membuka informasi lengkap untuk semua properti saat ini dan yang akan datang selama masa berlangganan.',
        colTwoPrice: '$99 / bln',
        colTwoButton: 'Berlangganan',
        close: 'Tutup'
      }
    },
    publicRoiNotAvailable: 'Halaman ROI publik tidak tersedia',
    
    // Pricing modal
    pricing: {
      title: 'Pilih Paket Anda',
      subtitle: 'Pilih paket yang paling sesuai dengan kebutuhan Anda',
      oneTime: {
        badge: 'Populer',
        title: 'Akses Sekali Bayar',
        description: 'Dapatkan informasi lengkap tentang properti tertentu dengan pembayaran sekali.',
        price: '$25',
        priceNote: 'Pembayaran sekali, akses seumur hidup',
        featuresTitle: 'Yang termasuk:',
        features: {
          fullAccess: 'Akses penuh ke detail properti dan dokumentasi',
          documents: 'Semua dokumen hukum dan spesifikasi teknis',
          roiCalculator: 'Kalkulator ROI dan analisis investasi',
          support: 'Dukungan email selama 30 hari',
          lifetime: 'Akses seumur hidup ke properti yang dibeli'
        },
        note: 'Sempurna untuk investor yang menginginkan informasi detail tentang properti tertentu.'
      },
      subscription: {
        badge: 'Nilai Terbaik',
        title: 'Akses Penuh Platform',
        description: 'Buka akses ke semua properti dan fitur premium dengan langganan bulanan kami.',
        price: '$83',
        priceNote: 'Per bulan, dapat dibatalkan kapan saja',
        featuresTitle: 'Yang termasuk:',
        features: {
            allProperties: 'Akses penuh ke semua properti dalam listing',
            newListings: 'Akses awal ke properti baru sebelum rilis publik',
            prioritySupport: 'Dukungan profesional dan pendampingan pelanggan dalam chat',
            marketUpdates: 'Penyediaan link unik untuk listing - website sendiri untuk menerima permintaan'
        },
        note: 'Ideal untuk profesional real estate dan investor aktif.'
      },
      additionalInfo: {
        title: 'Informasi Tambahan',
        payment: {
          title: 'Metode Pembayaran',
          description: 'Kami menerima semua kartu kredit utama dan transfer bank. Semua pembayaran diproses dengan aman.'
        },
        support: {
          title: 'Dukungan Pelanggan',
          description: 'Tim dukungan kami tersedia 24/7 untuk membantu Anda dengan pertanyaan atau masalah apa pun.'
        }
        },
        closeButton: 'Tutup',
        termsLink: 'Syarat Pembayaran dan Pengembalian Dana',
        termsTitle: 'Syarat Pembayaran dan Pengembalian Dana',
        terms: {
          payment: {
            title: 'Syarat Pembayaran',
            point1: 'Semua pembayaran diproses dengan aman melalui mitra pembayaran kami.',
            point2: 'Pembayaran diperlukan sebelum akses ke fitur premium diberikan.',
            point3: 'Pembayaran langganan diperpanjang otomatis kecuali dibatalkan.',
            point4: 'Kami menerima kartu kredit utama dan transfer bank.'
          },
          refund: {
            title: 'Kebijakan Pengembalian',
            point1: 'Pengembalian untuk pembelian sekali tersedia dalam 14 hari dari pembelian.',
            point2: 'Pembatalan langganan berlaku pada akhir periode penagihan saat ini.',
            point3: 'Tidak ada pengembalian untuk penggunaan sebagian layanan langganan.',
            point4: 'Permintaan pengembalian harus disampaikan melalui sistem dukungan kami.'
          },
          access: {
            title: 'Syarat Akses',
            point1: 'Akses ke konten yang dibeli diberikan segera setelah pembayaran berhasil.',
            point2: 'Akses akun dapat ditangguhkan karena pelanggaran terhadap syarat layanan kami.'
          },
          liability: {
            title: 'Tanggung Jawab',
            point1: 'Kami tidak bertanggung jawab atas keputusan keuangan yang dibuat berdasarkan konten kami.',
            point2: 'Pengguna bertanggung jawab untuk memastikan kepatuhan terhadap hukum dan peraturan setempat.'
          }
        }
      },
    
    // Common words
    close: 'Tutup',
    cancel: 'Batal',
    save: 'Simpan',
    logout: 'Keluar',

    // Districts/Regions translations
    districts: {
      'Амед': 'Amed',
      'Берава': 'Berawa', 
      'Будук': 'Buduk',
      'Джимбаран': 'Jimbaran',
      'Кинтамани': 'Kintamani',
      'Кута': 'Kuta',
      'Кутух': 'Kutuh',
      'Ловина': 'Lovina',
      'Нуану': 'Nuanu',
      'Нуса Дуа': 'Nusa Dua',
      'Пандава': 'Pandawa',
      'Переренан': 'Pererenan',
      'Санур': 'Sanur',
      'Семиньяк': 'Seminyak',
      'Убуд': 'Ubud',
      'Улувату': 'Uluwatu',
      'Умалас': 'Umalas',
      'Унгасан': 'Ungasan',
      'Чандидаса': 'Candidasa',
      'Чангу': 'Canggu',
      'Чемаги': 'Cemagi',
      'Гили Траванган': 'Gili Trawangan',
      'Ломбок': 'Lombok',
      'Kab. Jembrana': 'Kab. Jembrana',
      'Kab. Tabanan': 'Kab. Tabanan',
      'Kab. Badung': 'Kab. Badung',
      'Kab. Gianyar': 'Kab. Gianyar',
      'Kab. Klungkung': 'Kab. Klungkung',
      'Kab. Bangli': 'Kab. Bangli',
      'Kab. Karangasem': 'Kab. Karangasem',
      'Kab. Buleleng': 'Kab. Buleleng',
      'Kota Denpasar': 'Kota Denpasar',
      createdAt: 'Dibuat',
      updatedAt: 'Diperbarui'
    },

    // Land Status translations
    landStatus: {
      'Туристическая зона (W)': 'Zona Wisata (W)',
      'Торговая зона (K)': 'Zona Komersial (K)',
      'Смешанная зона (C)': 'Zona Campuran (C)',
      'Жилая зона (R)': 'Zona Permukiman (R)',
      'Сельхоз зона (P)': 'Zona Pertanian (P)',
      'Заповедная зона (RTH)': 'Zona Lindung (RTH)'
    },

    // Navigation
    navigation: {
      adminPanel: 'Panel Admin',
      propertyGallery: 'Galeri Properti',
      publicGallery: 'Galeri Publik',
      publicInvestorTitle: 'IT AGENT BALI',
      clientLeads: 'Ajuan Klien',
      complexGallery: 'Galeri Kompleks',
      properties: 'Properti',
      complexes: 'Kompleks',
      developers: 'Pengembang',
      landmarks: 'Landmark',
      chessboards: 'Papan Catur',
      support: 'Dukungan',
      roiCalculator: 'Kalkulator ROI',
      clientFixations: 'Fiksasi Klien',
      userManagement: 'Pengguna',
      generalOverview: 'Ikhtisar Umum',
              registrationRequests: 'Permintaan Pengembang',
      
      // Registration Requests Page
      registrationRequestsPage: {
        title: 'Permintaan Pengembang',
        noRequests: 'Tidak ada permintaan registrasi',
        name: 'Nama',
        email: 'Email',
        phone: 'Telepon',
        position: 'Jabatan',
        applicationDate: 'Tanggal Aplikasi',
        takeInWork: 'Ambil dalam Pekerjaan',
        approve: 'Setujui',
        reject: 'Tolak',
        statusUpdated: 'Status permintaan diperbarui',
        statusUpdateError: 'Gagal memperbarui status permintaan',
        positions: {
          owner: 'Pemilik',
          manager: 'Manajer',
          marketer: 'Pemasar',
          agent: 'Agen'
        }
      },
      referralMap: 'Peta Referral',
      settings: 'Pengaturan',
      education: 'Pendidikan',
      premiumFeatures: 'Langganan Premium',
      notifications: 'Pengiriman Notifikasi',
      publicPage: 'Halaman Publik',
      agentProperties: 'Properti Agen',
      premiumSubscriptionTooltip: 'Tersedia dalam langganan premium',
      // CRM System
      crmSystem: 'Sistem CRM',
      deals: 'Penawaran',
      tasks: 'Tugas',
      lists: 'Daftar',
      createdAt: 'Dibuat',
      updatedAt: 'Diperbarui',
      agentRegistrationRequests: 'Permintaan Agen',
      technicalSupervision: 'Pengawasan Teknis',
      // Dashboard
      dashboard: 'Dasbor',
      appStatistics: 'Statistik Aplikasi'
    },
    // Public menu
    publicMenu: {
      favorites: 'Favorit',
      services: 'Layanan',
      loginRegister: 'Masuk / Daftar',
      account: 'Akun Saya',
      subscription: 'Langganan',
      servicesList: {
        legalDueDiligence: 'Pemeriksaan hukum mendetail',
        constructionSupervision: 'Pengawasan teknis konstruksi',
        constructionAcceptance: 'Penerimaan konstruksi',
        constructionManagement: 'Konstruksi rumah kustom',
        architecturalDesign: 'Desain arsitektur'
      }
    },
    favorites: {
      createPDF: 'Buat PDF',
      selectLanguagePDF: 'Pilih bahasa untuk PDF',
      generatingPDF: 'Membuat PDF...',
      withTitle: 'dengan judul',
      pdfCreated: 'PDF berhasil dibuat'
    },
    publicFavorites: {
      generateLink: 'Generate tautan publik'
    },
    subscriptionModal: {
      title: 'Langganan Premium',
      description: 'Dapatkan akses penuh ke semua listing saat ini dan mendatang dengan dokumen terverifikasi dan alat profesional.',
      features: [
        'Informasi lengkap untuk semua properti',
        'Dokumen dan detail hukum',
        'Pembaruan prioritas dan listing baru',
        'Alat profesional dan analitik'
      ],
      price: '$199 / bln',
      subscribeButton: 'Berlangganan'
    },
    paymentModal: {
      supportText: 'Jika Anda mengalami kesulitan dalam pembayaran atau mengaktifkan langganan Premium, hubungi dukungan kami dan kami akan memberikan pendampingan penuh',
      supportButton: 'Hubungi dukungan'
    },
    accountPage: {
      title: 'Akun Saya',
      premiumBadge: 'Premium',
      premiumDeveloperBadge: 'Pengembang Premium',
      logout: 'Keluar',
      myProperties: 'Properti Saya',
      myLeads: 'Prospek Saya',
      noProperties: 'Anda belum menambahkan properti apa pun',
      noLeads: 'Anda belum memiliki prospek',
      goToProperty: 'Buka properti',
      premiumLinkTitle: 'Tautan pribadi Anda',
      premiumLinkDescription: 'Bagikan tautan ini dengan klien. Mereka akan melihat seluruh katalog properti dan dapat menghubungi Anda langsung dari kartu mana pun.',
      premiumLinkLabel: 'Tautan pribadi',
      copyButton: 'Salin',
      copiedMessage: 'Tautan disalin',
      premiumOnlyMessage: 'Tautan hanya tersedia untuk pelanggan premium',
      subscribeButton: 'Berlangganan',
      profileTitle: 'Profil',
      profile: {
        name: 'Nama',
        email: 'Email',
        language: 'Bahasa',
        telegram: 'Telegram',
        phone: 'Telepon',
        save: 'Simpan perubahan',
        saved: 'Profil disimpan',
        saveError: 'Gagal menyimpan profil'
      }
    },

    // Public Page
    publicPage: {
      uploadCover: 'Unggah sampul',
      expand: 'Perluas',
      collapse: 'Tutup',
      complexesListTitle: 'Daftar kompleks',
      rentingLabel: 'Disewakan',
      propertiesListTitle: 'Daftar properti',
      agentLink: 'Tautan publik'
    },

    // Agent info panel
    agentInfo: {
      title: 'Agen',
      name: 'Nama',
      email: 'Email',
      role: 'Peran',
      language: 'Bahasa',
      telegram: 'Telegram',
      userId: 'ID Pengguna',
      createdAt: 'Dibuat',
      notFound: 'Info agen tidak ditemukan'
    },

    // Registration Requests Page
    registrationRequestsPage: {
      title: 'Permintaan Pengembang',
      noRequests: 'Tidak ada permintaan registrasi',
      name: 'Nama',
      email: 'Email',
      phone: 'Telepon',
      position: 'Jabatan',
      applicationDate: 'Tanggal Aplikasi',
      takeInWork: 'Ambil dalam Pekerjaan',
      approve: 'Setujui',
      reject: 'Tolak',
      statusUpdated: 'Status permintaan diperbarui',
      statusUpdateError: 'Gagal memperbarui status permintaan',
      positions: {
        owner: 'Pemilik',
        manager: 'Manajer',
        marketer: 'Pemasar',
        agent: 'Agen'
      }
    },

    // Deals (CRM)
    deals: {
      title: 'PENAWARAN',
      searchPlaceholder: 'Cari dan filter',
      settings: 'PENGATURAN',
      newDeal: 'PENAWARAN BARU',
      
      // Statistics
      todayTasks: 'Tugas hari ini',
      noTasks: 'Tanpa tugas',
      overdue: 'Terlambat',
      newTodayYesterday: 'Baru hari ini / kemarin',
      salesForecast: 'Prakiraan penjualan',
      noData: 'Tidak ada data',
      
      // Pipeline stages
      firstContact: 'KONTAK PERTAMA',
      negotiations: 'NEGOSIASI',
      decisionMaking: 'PENGAMBILAN KEPUTUSAN',
      booking: 'PEMESANAN',
      
      // Deal card
      noTask: 'Tidak ada tugas',
      today: 'Hari ini',
      
      // Deal form
      quickAdd: 'Tambah cepat',
      dealName: 'Nama penawaran',
      contact: 'Kontak',
      contactName: 'Kontak: Nama',
      contactPhone: 'Kontak: Telepon',
      contactEmail: 'Kontak: Email',
      company: 'Perusahaan',
      companyName: 'Perusahaan: Nama',
      companyAddress: 'Perusahaan: Alamat',
      add: 'Tambah',
      cancel: 'Batal',
      
      // Settings modal
      dealNamePlaceholder: 'Nama penawaran'
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
      cancel: 'Batal',
      createdAt: 'Dibuat',
      updatedAt: 'Diperbarui',
      
      // System messages for fixation status changes
      systemMessages: {
        approved: 'Klien Anda {clientName} {clientPhone} telah difiksasi dengan pengembang {developerName} hingga {validUntil}',
        rejected: 'Permintaan fiksasi Anda untuk klien {clientName} {clientPhone} dengan pengembang {developerName} telah ditolak. Alasan: {reason}',
        expired: 'Fiksasi Anda untuk klien {clientName} {clientPhone} dengan pengembang {developerName} telah kedaluwarsa pada {expiredDate}'
      }
    },

    // Fixation Chat
    fixationChat: {
      title: 'Chat Fiksasi',
      messagePlaceholder: 'Masukkan pesan...',
      send: 'Kirim',
      messageSent: 'Pesan berhasil dikirim',
      messageError: 'Gagal mengirim pesan',
      chatDataError: 'Gagal memuat data chat',
      createdAt: 'Dibuat',
    },

    // Settings Page
    settings: {
      title: 'Pengaturan',
      profile: {
        title: 'Profil',
        description: 'Kelola pengaturan profil Anda',
        name: 'Nama',
        email: 'Email',
        role: 'Peran',
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
        passwordUpdated: 'Kata sandi berhasil diperbarui',
        createdAt: 'Dibuat',
        updatedAt: 'Diperbarui',
        editProfileTitle: 'Edit Profil',
        userName: 'Nama Pengguna',
        userNamePlaceholder: 'Masukkan nama pengguna',
        emailCannotBeChanged: 'Email tidak dapat diubah',
        changePassword: 'Ubah Kata Sandi',
        changePasswordDescription: 'Biarkan kolom kosong jika Anda tidak ingin mengubah kata sandi',
        newPasswordPlaceholder: 'Masukkan kata sandi baru',
        confirmPasswordPlaceholder: 'Konfirmasi kata sandi baru',
        saving: 'Menyimpan...',
        notSpecified: 'Tidak ditentukan',
        notSpecifiedEmail: 'Tidak ditentukan',
        roleNotDefined: 'Tidak didefinisikan',
        noSignedContracts: 'Belum ada kontrak yang ditandatangani',
        user: 'Pengguna',
        signDate: 'Tanggal Tandatangan',
        developer: 'Pengembang'
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
        waitingConnection: 'Menunggu koneksi...',
        createdAt: 'Dibuat',
        updatedAt: 'Diperbarui'
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

3.1. Biaya layanan Kontraktor adalah 0,5% (nol koma lima persen) dari harga setiap objek real estat yang dijual melalui platform IT. Untuk 2 transaksi pertama yang diselesaikan, komisi platform tidak dikenakan.

3.2. Komisi yang ditentukan dalam pasal 3.1 dibayar oleh Klien sebagai tambahan dari komisi standar kepada agen real estat (5%).

3.3. Pembayaran dilakukan dalam waktu 10 (sepuluh) hari perbankan sejak saat penandatanganan perjanjian jual beli real estat antara Klien dan pembeli yang didapat melalui platform IT.

3.4. Dasar untuk pembayaran adalah perjanjian jual beli yang ditandatangani dan pemberitahuan dari Klien tentang transaksi yang diselesaikan.

4. TANGGUNG JAWAB PARA PIHAK

4.1. Untuk tidak melaksanakan atau melaksanakan dengan tidak benar kewajiban berdasarkan Perjanjian ini, para pihak memikul tanggung jawab sesuai dengan hukum yang berlaku.

4.2. Dalam hal keterlambatan pembayaran, Klien membayar denda sebesar 0,1% dari jumlah pembayaran yang tertunggak untuk setiap hari keterlambatan.

5. TERM OF THE AGREEMENT

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
        signature: '(tanda tangan)',
        createdAt: 'Создан',
        updatedAt: 'Обновлен'
      },
      language: {
        title: 'Bahasa',
        description: 'Pilih bahasa yang Anda inginkan',
        english: 'Bahasa Inggris',
        russian: 'Bahasa Rusia',
        indonesian: 'Bahasa Indonesia'
      }
    },

    // Complexes Gallery
    complexesGallery: {
      title: 'Galeri Kompleks',
      loadingText: 'Memuat kompleks...',
      searchPlaceholder: 'Cari berdasarkan nama, pengembang, distrik...',
      filtersTitle: 'Filter',
      resetAllFilters: 'Reset semua',
      priceLabel: 'Harga (USD)',
      pricePlaceholderFrom: 'Dari',
      pricePlaceholderTo: 'Sampai',
      developerLabel: 'Pengembang',
      allDevelopers: 'Semua pengembang',
      districtLabel: 'Distrik', 
      allDistricts: 'Semua distrik',
      provinceLabel: 'Provinsi',
      allProvinces: 'Semua provinsi',
      landStatusLabel: 'Status Tanah',
      allStatuses: 'Semua status',
      ownershipFormLabel: 'Bentuk Kepemilikan',
      allForms: 'Semua bentuk',
      resultsText: 'Ditemukan: {found} dari {total} kompleks',
      emptyStateNoDeveloperComplexes: 'Anda belum memiliki kompleks di sistem',
      emptyStateNoComplexes: 'Kompleks tidak ditemukan',
      emptyStateNoMatches: 'Tidak ada kompleks yang sesuai dengan kriteria yang ditentukan',
      complexAltText: 'Kompleks',
      noNameText: 'Tanpa nama',
      complexNumberPrefix: 'Kompleks #',
      priceFromPrefix: 'dari',
      developerPrefix: 'Pengembang:',
      districtPrefix: 'Distrik:',
      completionPrefix: 'Selesai:',
      createdAt: 'Создан',
      updatedAt: 'Обновлен'
    },

    // Complex Detail
    complexDetail: {
      loadingText: 'Memuat kompleks...',
      accessDenied: 'Akses Ditolak',
      accessDeniedMessage: 'Anda tidak memiliki izin untuk melihat kompleks ini',
      complexNotFound: 'Kompleks Tidak Ditemukan',
      complexNotFoundMessage: 'Kompleks dengan ID yang ditentukan tidak ada',
      backButton: 'Kembali',
      cancelButton: 'Batal',
      saveButton: 'Simpan',
      editButton: 'Edit',
      removeFromListing: 'Hapus dari listing',
      returnToListing: 'Kembalikan ke listing',
      removedFromListing: 'Dihapus dari listing',
      addPhotoButton: 'Tambah Foto',
      uploadingText: 'Mengupload...',
      watchVideoButton: 'Video Komplek',
      view3DTourButton: 'Lihat Tur 3D',
      buildingProgressButton: 'Progres Pembangunan',
      openChessboardButton: 'Papan Catur Unit',
      linksAndDocuments: 'Tautan dan Dokumen',
      description: 'Deskripsi',
      translating: 'Menerjemahkan...',
      priceFromLabel: 'Harga dari',
      priceMinFromObjects: '(minimum dari objek)',
      priceFromComplex: '(harga kompleks)',
      commissionLabel: 'Komisi',
      developerLabel: 'Pengembang',
      districtLabel: 'Distrik',
      completionDateLabel: 'Tanggal Selesai',
      coordinatesLabel: 'Koordinat',
      videoLabel: 'Video',
      tourLabel: '3D Tur',
      masterPlanLabel: 'Rencana Induk',
      pricePlaceholder: 'Harga dalam USD',
      descriptionPlaceholder: 'Deskripsi kompleks',
      videoLinkPlaceholder: 'Tautan video',
      tourLinkPlaceholder: 'Tautan tur 3D',
      masterPlanLinkPlaceholder: 'Tautan rencana induk',
      viewMasterPlanButton: 'Lihat Rencana Induk',
      photoAltText: 'Foto',
      autoCalculatedPriceText: 'Otomatis dihitung sebagai harga minimum di antara objek kompleks',
      changesSaved: 'Perubahan disimpan',
      saveError: 'Kesalahan menyimpan perubahan',
      editPermissionError: 'Anda tidak memiliki izin untuk mengedit kompleks ini',
      photosUploadSuccess: 'Foto berhasil diupload',
      photosUploadError: 'Kesalahan mengupload foto',
      photoNotFound: 'Foto tidak ditemukan',
      photoDeleteSuccess: 'Foto berhasil dihapus',
      photoLinkDeleted: 'Tautan foto dihapus dari database',
      photoDeleteError: 'Kesalahan menghapus foto',
      databaseUpdateError: 'Gagal memperbarui informasi database',
      dataLoadError: 'Kesalahan memuat data kompleks',
      developerLoadError: 'Kesalahan memuat pengembang',
      complexNameLoadError: 'Kesalahan memuat nama kompleks',
      createdAt: 'Создан',
      updatedAt: 'Обновлен',
      
      // Additional Options
      additionalOptions: 'Opsi Tambahan',
      onComplexTerritory: 'Di Wilayah Kompleks',
      
      // Option badges
      spaSalon: 'Salon SPA',
      restaurant: 'Restoran',
      fitnessGym: 'Gym Fitness',
      playground: 'Taman Bermain',
      shop: 'Toko',
      cinema: 'Bioskop',
      coworking: 'Koworking',
      concertHall: 'Aula Konser',
      parking: 'Tempat Parkir',
      artificialWave: 'Gelombang Buatan',
      conferenceHall: 'Ruang konferensi'
    },

    // Properties Gallery
    propertiesGallery: {
      title: 'Galeri Properti',
      developerPropertiesTitle: 'Properti Pengembang',
      searchPlaceholder: 'Cari berdasarkan nama, distrik atau tipe...',
      statusLabel: 'Status',
      filtersTitle: 'Filter',
      priceLabel: 'Harga (USD)',
      pricePlaceholderFrom: 'Dari',
      pricePlaceholderTo: 'Sampai',
      areaLabel: 'Luas (m²)',
      bedroomsLabel: 'Kamar Tidur',
      allBedrooms: 'Semua',
      studio: 'Studio',
      bedroomsText: 'Kamar Tidur',
      unitsCountText: 'Jumlah Unit',
      districtLabel: 'Distrik',
      allDistricts: 'Semua distrik',
      typeLabel: 'Tipe',
      allTypes: 'Semua tipe',
      resetFiltersButton: 'Reset filter',
      searchResultsText: 'Properti ditemukan: {count}',
      emptyStateNoDeveloperProperties: 'Anda belum memiliki properti di sistem',
      emptyStateNoProperties: 'Properti tidak ditemukan',
      emptyStateNoMatches: 'Tidak ada properti yang sesuai dengan kriteria yang ditentukan',
      propertyAltText: 'Properti',
      missingFieldsTitle: 'Bidang belum diisi',
      newPricePlaceholder: 'Harga baru',
      areaText: 'm²',
      developerText: 'Pengembang:',
      editPermissionError: 'Anda tidak memiliki izin untuk mengedit harga',
      priceValidationError: 'Silakan masukkan harga yang valid',
      priceUpdateSuccess: 'Harga berhasil diperbarui',
      priceUpdateError: 'Gagal memperbarui harga',
      complexLoadError: 'Kesalahan memuat nama kompleks',
      developerLoadError: 'Kesalahan memuat pengembang',
      createdAt: 'Dibuat',
      updatedAt: 'Diperbarui',
      addedByMe: 'Ditambahkan oleh saya',
      allStatuses: 'Semua Status',
      statusProject: 'Proyek',
      statusUnderConstruction: 'Sedang Dibangun',
      statusReady: 'Siap',
      statusFromOwner: 'Dari Pemilik',
      // Selection mode texts
      selectionTitle: 'Pilihan Properti',
      selectionSubtitle: 'Dipilih oleh asisten AI khusus untuk Anda',
      selectionResultsText: 'Ditemukan {count} properti dalam pilihan'
    },

    // Property Detail
    propertyDetail: {
      // Loading states
      loading: 'Memuat...',
      uploading: 'Mengunggah...',
      
      // Navigation
      backButton: 'Kembali',
      backToGallery: 'Kembali ke Galeri',
      onMap: 'di peta',
      
      // Buttons
      editButton: 'Edit',
      saveButton: 'Simpan',
      cancelButton: 'Batal',
      addPhotoButton: 'Tambah Foto',
      addPhotoButtonSimple: 'Tambah Foto',
      createObjectButton: 'Buat Objek',
      creatingText: 'Membuat...',
      viewButton: 'Lihat',
      updateButton: 'Update',
      uploadButton: 'Upload',
      roiCalculatorButton: 'Kalkulator ROI',
      // Agent chats
      agentChatsTitle: 'Obrolan untuk properti ini',
      openChat: 'Buka obrolan',
      chatDialogTitle: 'Percakapan',
      loadingMessages: 'Memuat pesan…',
      propertyCardMessage: 'Kartu properti',
      noChats: 'Belum ada obrolan untuk properti ini',
      applicationFromAgent: 'Permintaan dari agen',
      messagePlaceholder: 'Masukkan pesan...',
      sendButton: 'Kirim',
      
      // Field labels
      bedrooms: 'Kamar Tidur',
      pricePerSqm: 'Harga per m²',
      studio: 'Studio',
      unitsCount: 'Jumlah Unit',
      reliabilityRating: 'Peringkat Keandalan',
      reliabilityRatingTooltip: 'Peringkat keandalan properti.\nDisusun berdasarkan dokumen yang diberikan, pengalaman pengembang, dan proyek yang telah selesai.',
      area: 'Luas Hunian',
      areaTooltip: 'Hanya luas hunian properti (dapur, ruang tamu, kamar tidur, kamar mandi)',
      totalArea: 'Luas Total',
      totalAreaTooltip: 'Luas total properti - luas hunian + area umum (teras, balkon, rooftop, barbecue, jacuzzi, dll.)',
      developer: 'Pengembang',
      complex: 'Kompleks',
      propertyName: 'Nama',
      managementCompany: 'Perusahaan Manajemen',
      bathrooms: 'Kamar Mandi',
      floors: 'Lantai',
      district: 'Distrik',
      buildingType: 'Tipe Bangunan',
      constructionStatus: 'Status Konstruksi',
      distanceToBeach: 'Jarak ke pantai',
      distanceToCenter: 'Jarak ke pusat kota',
      kmUnit: 'km',
      manualRoi: 'ROI (%)',
      manualRoiPlaceholder: 'Masukkan persentase ROI',
      expectedRoi: 'ROI yang Diharapkan (%)',
      expectedRoiPlaceholder: 'Masukkan persentase ROI yang diharapkan',
      expectedRoiTooltip: 'Hasil sewa tahunan yang diharapkan dari properti, dihitung oleh pengembang',
      landArea: 'Luas Tanah',
      landAreaPlaceholder: 'Masukkan luas tanah dalam m²',
      landAreaTooltip: 'Luas plot tanah di mana properti ini berada',
      expectedCost: 'Perkiraan Biaya',
      expectedCostPlaceholder: 'Masukkan perkiraan biaya dalam USD',
      expectedCostTooltip: 'Perkiraan biaya properti pada saat penyelesaian konstruksi dan komisioning',
      landStatus: 'Status Tanah',
      pool: 'Kolam Renang',
      ownership: 'Kepemilikan',
      completionDate: 'Tanggal Selesai',
      years: 'tahun',
      description: 'Deskripsi',
      
      // Agent Property Create specific fields
      pricePlaceholder: 'Harga *',
      areaPlaceholder: 'Luas Hunian *',
      bedroomsLabel: 'Kamar Tidur',
      statusLabel: 'Status',
      ownershipFormLabel: 'Bentuk Kepemilikan',
      descriptionPlaceholder: 'Deskripsi Properti',
      
      // Photo counter
      photoCounter: 'Foto: {current} / {total}',
      swipeHint: 'Geser kiri/kanan untuk mengganti foto',
      
      // Document labels
      documentsSection: 'Dokumen',
      characteristicsSection: 'Karakteristik',
      legalCompanyName: 'Nama Perusahaan Legal:',
      taxNumber: 'Nomor Pajak (NPWP):',
      landUsePermit: 'Izin Penggunaan Tanah (PKKPR):',
      landRightsCertificate: 'Sertifikat Hak Tanah (SHGB):',
      landLeaseEndDate: 'Tanggal Berakhir Sewa Tanah:',
      buildingPermit: 'Izin Bangunan (PBG):',
      buildingPermitIMB: 'Izin Bangunan (IMB):',
      buildingReadinessCertificate: 'Sertifikat Kesiapan Bangunan (SLF):',
      layout: 'Tata Letak Unit:',
      dueDiligence: 'Due Diligence:',
      unbrandedPresentation: 'Presentasi Kompleks:',
      pkkprFile: 'File PKKPR:',
      
      // Options
      typeOptions: {
        villa: 'Vila',
        apartment: 'Apartemen',
        house: 'Rumah',
        duplex: 'Dupleks',
        commercial: 'Properti Komersial',
        apartVilla: 'Apart-Vila',
        townhouse: 'Rumah Teres',
        penthouse: 'Penthouse',
        land: 'Tanah'
      },

      // Translation Manager
      translationManager: {
        title: 'Manajer Terjemahan',
        originalDescription: 'Deskripsi Asli',
        noDescription: 'Tidak ada deskripsi',
        availableTranslations: 'Terjemahan yang Tersedia',
        delete: 'Hapus',
        deleteAll: 'Hapus Semua',
        noTranslations: 'Tidak ada terjemahan yang tersedia',
        noTranslationsHint: 'Terjemahan akan muncul di sini ketika pengguna melihat properti dalam bahasa yang berbeda',
        stats: 'Statistik Terjemahan',
        totalTranslations: 'Total terjemahan',
        languages: 'Bahasa'
      },
      
      buildingTypeOptions: {
        newComplex: 'Kompleks Baru',
        renovation: 'Renovasi',
        individual: 'Individu',
        hotel: 'Hotel',
        resort: 'Resort'
      },
      
      statusOptions: {
        project: 'Proyek',
        underConstruction: 'Dalam Pembangunan',
        ready: 'Siap',
        fromOwner: 'Dari Pemilik'
      },
      
      poolOptions: {
        no: 'Tidak',
        private: 'Pribadi',
        shared: 'Bersama'
      },
      
      ownershipOptions: {
        leasehold: 'Leasehold',
        freehold: 'Freehold'
      },
      
      // Messages
      notSelected: '(tidak dipilih)',
      notFound: 'Properti tidak ditemukan',
      accessDenied: 'Akses ditolak',
      fileNotUploaded: 'File tidak diunggah',
      floorText: 'lantai',
      floorsText: 'lantai',
      
      // Success messages
      changesSaved: 'Perubahan berhasil disimpan',
      photoUploaded: 'Foto berhasil diunggah',
      photoDeleted: 'Foto berhasil dihapus',
      photoLinkDeleted: 'Tautan foto dihapus dari database',
      
      // Service verification badge
      serviceVerified: 'Diverifikasi Layanan',
      serviceVerifiedTooltip: 'Tanda ini berarti pengembang dan propertinya telah lulus pemeriksaan dokumen awal pada kategori berikut:\n• Nama perusahaan yang sah\n• Nomor pajak perusahaan\n• Adanya izin penggunaan lahan\n• Adanya sertifikat hak atas tanah\n• Adanya izin bangunan/operasional (atau nomor permohonan yang terdaftar)\n• Kesesuaian dengan peruntukan dan warna zonasi tanah',
      premiumOnlyTooltip: 'Opsi ini hanya tersedia untuk akun premium',
      removedFromListing: 'Removed from listing',
      removeFromListing: 'Remove from listing',
      returnToListing: 'Return to listing',
      
      // Error messages
      editPermissionError: 'Anda tidak memiliki izin untuk mengedit properti ini',
      saveError: 'Terjadi kesalahan saat menyimpan perubahan',
      photoUploadError: 'Terjadi kesalahan saat mengunggah foto',
      photoDeleteError: 'Terjadi kesalahan saat menghapus foto',
      fileUploadError: 'Terjadi kesalahan saat mengunggah file',
      databaseUpdateError: 'Tidak dapat memperbarui informasi database',
      developerLoadError: 'Kesalahan memuat pengembang',
      complexLoadError: 'Kesalahan memuat kompleks',
      documentValidationError: 'Hanya angka, koma, titik, dan tanda hubung yang diizinkan',
      documentValidationPlaceholder: 'Hanya angka, koma, titik, tanda hubung',
      
      // Lightbox
      photo: 'Foto',
      createdAt: 'Создан',
      updatedAt: 'Обновлен',
      
      // Additional Options
      additionalOptions: 'Opsi Tambahan',
      onComplexTerritory: 'Di Wilayah Kompleks',
      
      // Option badges
      smartHome: 'Rumah Pintar',
      jacuzzi: 'Jacuzzi',
      terrace: 'Teras',
      rooftop: 'Atap',
      balcony: 'Balkon',
      bbq: 'BBQ',
      furniture: 'Furnitur Lengkap',
      washingMachine: 'Mesin Cuci',
      spaSalon: 'Salon SPA',
      restaurant: 'Restoran',
      fitnessGym: 'Gym Fitness',
      playground: 'Taman Bermain',
      shop: 'Toko',
      cinema: 'Bioskop',
      coworking: 'Koworking',
      concertHall: 'Aula Konser',
      parking: 'Tempat Parkir',
      agentCommission: 'Komisi Agen'
    },

    // Chessboards
    chessboards: {
      title: 'Papan Catur',
      createChessboard: 'Buat Papan Catur',
      createFirstChessboard: 'Buat Papan Catur Pertama',
      noChessboards: 'Tidak ada papan catur yang dibuat',
      noChessboardsDescription: 'Buat papan catur pertama untuk mengelola tata letak objek',
      deleteConfirmTitle: 'Konfirmasi Penghapusan',
      deleteConfirmText: 'Apakah Anda yakin ingin menghapus papan catur "{name}"?',
      chessboardDeleted: 'Papan catur dihapus!',
      deleteError: 'Kesalahan menghapus papan catur',
      publicLinkCopied: 'Tautan publik disalin!',
      
      // Table headers and labels
      complex: 'Kompleks:',
      totalUnits: 'Total unit:',
      sections: 'Bagian:',
      floors: 'Lantai:',
      rows: 'Baris:',
      publicLinkAvailable: 'Tautan publik tersedia',
      created: 'Dibuat:',
      loading: 'Memuat...',
      untitled: 'Tanpa judul',
      open: 'Buka',
      delete: 'Hapus',
      copyLink: 'Salin tautan',
      openInNewTab: 'Buka di tab baru',
      
      // Status badges
      free: 'Tersedia: {count}',
      booked: 'Dipesan: {count}',
      sold: 'Terjual: {count}',
      
      // Chessboard page
      chessboardName: 'Nama Papan Catur',
      selectComplex: 'Pilih Kompleks',
      noComplexSelected: 'Tidak ada kompleks yang dipilih',
      nameRequired: 'Nama papan catur wajib diisi',
      save: 'Simpan',
      deleteChessboard: 'Hapus',
      addSection: 'Tambah Bagian',
      exchangeRate: 'Nilai Tukar (USD ke IDR)',
      
      // Sections and floors
      sectionName: 'Nama Bagian',
      addFloor: 'Tambah Lantai',
      floor: 'Lantai',
      addUnit: 'Tambah Unit',
      
      // Units
      unitId: 'ID Unit',
      rooms: 'Kamar',
      bathrooms: 'Kamar Mandi',
      area: 'Luas (m²)',
      priceUSD: 'Harga (USD)',
      priceIDR: 'Harga (IDR)',
      showIDRPrice: 'Tampilkan harga IDR',
      propertyType: 'Tipe Properti',
      view: 'Pemandangan',
      status: 'Status',
      
      // Options
      roomOptions: {
        studio: 'Studio',
        one: '1',
        two: '2',
        three: '3',
        four: '4',
        five: '5',
        six: '6'
      },
      
      bathroomOptions: {
        one: '1',
        two: '2',
        three: '3',
        four: '4',
        five: '5',
        six: '6'
      },
      
      propertyTypes: {
        apartments: 'Apartemen',
        villa: 'Villa',
        apartVilla: 'Apart Villa',
        townhouse: 'Townhouse',
        penthouse: 'Penthouse'
      },
      
      views: {
        notSelected: 'Tidak ditentukan',
        ocean: 'Samudra',
        jungle: 'Hutan',
        pool: 'Kolam Renang',
        river: 'Sungai',
        yard: 'Halaman',
        volcano: 'Gunung Berapi',
        riceTerraces: 'Terasering Padi'
      },
      
      statuses: {
        free: 'Tersedia',
        booked: 'Dipesan',
        sold: 'Terjual'
      },
      
      // Actions
      copy: 'Salin',
      remove: 'Hapus',
      moveUp: 'Pindah Ke Atas',
      moveDown: 'Pindah Ke Bawah',
      
      // Messages
      chessboardSaved: 'Papan catur berhasil disimpan',
      chessboardDeletedSuccess: 'Papan catur berhasil dihapus',
      saveError: 'Kesalahan menyimpan papan catur',
      loadError: 'Kesalahan memuat papan catur',
      complexLoadError: 'Kesalahan memuat kompleks',
      chessboardNotFound: 'Papan catur tidak ditemukan',
      accessDenied: 'Akses ditolak',
      validationError: 'Silakan perbaiki kesalahan validasi sebelum menyimpan',
      
      // Validation messages
      nameRequiredError: 'Nama papan catur wajib diisi',
      sectionNameRequired: 'Nama bagian wajib diisi',
      duplicateFloor: 'Duplikasi lantai',
      unitIdRequired: 'ID unit wajib diisi',
      invalidArea: 'Nilai luas tidak valid',
      invalidPrice: 'Nilai harga tidak valid',
      complexRequired: 'Silakan pilih kompleks',
      
      // Additional editing texts
      editingChessboard: 'Mengedit Papan Catur',
      backToList: 'Kembali ke Daftar',
      noAvailableComplexes: 'Tidak ada kompleks yang tersedia tanpa papan catur',
      floorButton: 'Lantai',
      noComplexesForDeveloper: 'Tidak ada kompleks yang tersedia untuk pengembang "{name}" tanpa papan catur',
      
      // Unit form labels
      chessboardFloors: 'Tingkat',
      chessboardArea: 'Luas (m²)',
      chessboardRooms: 'Kamar Tidur',
      chessboardBathrooms: 'Kamar Mandi',
      chessboardView: 'Pemandangan',
      side: 'Sisi',
      priceWithRate: 'Harga (USD → IDR)',
      enterPrice: 'Masukkan harga',
      showPriceOnPublic: 'Tampilkan harga di halaman publik',
      showPrice: 'Tampilkan harga',
      
      // Floor form labels
      noNumber: 'Tanpa nomor',
      floorType: 'lantai',
      rowType: 'baris',
      unitButton: 'Unit',
      
      // Side options
      sideOptions: {
        notSpecified: 'Tidak ditentukan',
        sunrise: 'Matahari Terbit',
        sunset: 'Matahari Terbenam'
      },
      
      // Status options with prefixes
      statusOptions: {
        free: '✓ Tersedia',
        booked: '⏳ Dipesan',
        sold: '✖ Terjual'
      },
      
      // Additional features
      features: {
        rooftop: 'Rooftop',
        terrace: 'Teras'
      },
      createdAt: 'Создан',
      updatedAt: 'Обновлен'
    },

    // ROI Calculator
    roiCalculator: {
      title: 'Perhitungan ROI',
      close: '✕',
      
      // Sections
      costsInvestmentsTitle: 'Biaya dan Investasi',
      calculationOptionsTitle: 'Opsi Perhitungan',
      rentalIncomeTitle: 'Pendapatan Sewa',
      operationalMetricsTitle: 'Biaya Operasional',
      calculationResults: 'Hasil Perhitungan',
      
      // Cost and Investment Fields
      propertyPrice: 'Harga Properti ($)',
      renovationCosts: 'Renovasi dan Perabotan ($)',
      legalFees: 'Biaya Hukum ($)',
      additionalExpenses: 'Biaya Tambahan ($)',
      investmentPeriod: 'Periode Investasi (tahun)',
      selectPeriod: 'Pilih periode',
      years3: '3 tahun',
      years5: '5 tahun',
      years10: '10 tahun',
      years20: '20 tahun',
      years30: '30 tahun',
      
      // Rental Income Fields
      dailyRate: 'Tarif Harian ($)',
      occupancyRate: 'Tingkat Hunian (%)',
      rentGrowthRate: 'Tingkat Pertumbuhan Sewa per Tahun (%)',
      operationStartYear: 'Mulai Operasi Setelah (tahun)',
      
      // Operational Metrics Fields
      maintenanceFees: 'Pemeliharaan per Tahun (%)',
      utilityBills: 'Tagihan Utilitas per Tahun (%)',
      annualTax: 'Pajak Tahunan (%)',
      propertyManagement: 'Pengelolaan Properti (%)',
      appreciationYear1: 'Apresiasi Properti Tahun 1 (%)',
      appreciationYear2: 'Apresiasi Properti Tahun 2 (%)',
      appreciationYear3: 'Apresiasi Properti Tahun 3 (%)',
      examplePlaceholder: 'Contoh: 5',
      examplePlaceholder2: 'Contoh: 3',
      examplePlaceholder3: 'Contoh: 2',
      
      // Scenario Selection
      calculationScenario: 'Skenario Perhitungan',
      selectScenario: 'Pilih skenario',
      pessimistic: 'Pesimis (70%)',
      realistic: 'Realistis (100%)',
      optimistic: 'Optimis (130%)',
      
      // Information Messages
      requiredFieldsTitle: 'Untuk melakukan perhitungan, isi bidang wajib berikut:',
      requiredFields: [
        '• Harga properti',
        '• Tarif sewa harian',
        '• Persentase hunian'
      ],
      optionalFieldsNote: 'Bidang lain bersifat opsional untuk perhitungan yang lebih akurat.',
      
      // Buttons
      updateCalculation: 'Perbarui Perhitungan',
      saveCalculation: 'Simpan Perhitungan',
      createPublicPage: 'Buat Halaman Publik',
      copyLink: '📋 Salin Link',
      
      // Result Cards
      totalInvestments: 'Total Investasi',
      annualRentalIncome: 'Pendapatan Sewa Tahunan',
      annualExpenses: 'Biaya Tahunan',
      netProfitPerYear: 'Keuntungan Bersih per Tahun',
      roi: 'ROI',
      paybackPeriod: 'Periode Pengembalian',
      years: 'tahun',
      totalRoiPeriod: 'Total ROI untuk Periode',
      propertyAppreciation: 'Apresiasi Properti',
      finalPropertyValue: 'Nilai Properti Akhir',
      
      // Chart
      period: 'Periode',
      year: 'Tahun',
      profitPerYear: 'Keuntungan per Tahun',
      accumulatedProfit: 'Keuntungan Terakumulasi',
      propertyValue: 'Nilai Properti',
      noChartData: 'Tidak ada data untuk menampilkan grafik',
      
      // Success/Error Messages
      calculationSaved: 'Perhitungan berhasil disimpan!',
      calculationSaveError: 'Kesalahan menyimpan perhitungan',
      linkCopied: 'Link berhasil disalin ke clipboard!',
      linkCopyError: 'Gagal menyalin link',
      publicPageCreated: 'Halaman publik berhasil dibuat dan dibuka di tab baru',
      publicPageError: 'Kesalahan membuat halaman publik',
      calculateFirstError: 'Silakan lakukan perhitungan ROI terlebih dahulu',
      
      // PDF Export
      language: 'Bahasa',
      english: 'English',
      russian: 'Русский',
      indonesian: 'Indonesian',
      pdf: 'PDF',
      loading: '...',
      createdAt: 'Создан',
      updatedAt: 'Обновлен',
      
      // Additional translations
      savedCalculations: 'Perhitungan Tersimpan',
      loginToSave: 'Masuk untuk menyimpan dan melihat perhitungan',
      noSavedCalculations: 'Tidak ada perhitungan tersimpan',
      otaCommission: 'Komisi OTA (%)',
      calculationName: 'Nama Perhitungan',
      exportToCSV: 'Ekspor ke CSV',
      basedOnDataAndScenario: 'Berdasarkan data yang dimasukkan dan skenario',
      
      // Field tooltips
      formulaLabel: 'Bagaimana berpartisipasi dalam perhitungan',
      tooltips: {
        propertyPrice: {
          title: 'Harga Pembelian Properti',
          description: 'Total biaya pembelian properti. Ini adalah jumlah dasar untuk semua perhitungan ROI.',
          formula: 'Nilai ini ditambahkan ke biaya renovasi, biaya hukum, dan biaya tambahan untuk menghitung total investasi awal Anda. Total investasi digunakan sebagai penyebut dalam perhitungan ROI.'
        },
        renovationCosts: {
          title: 'Biaya Renovasi dan Perabotan',
          description: 'Semua biaya yang terkait dengan persiapan properti untuk disewakan, termasuk furnitur, peralatan, dan renovasi.',
          formula: 'Nilai ini ditambahkan ke harga beli, biaya hukum, dan biaya tambahan untuk menghitung total investasi awal Anda. Biaya renovasi yang lebih tinggi meningkatkan total investasi, yang mempengaruhi perhitungan ROI.'
        },
        legalFees: {
          title: 'Biaya Hukum dan Administrasi',
          description: 'Biaya untuk layanan hukum, registrasi properti, izin, dan biaya administrasi lainnya.',
          formula: 'Nilai ini ditambahkan ke harga beli, biaya renovasi, dan biaya tambahan untuk menghitung total investasi awal Anda. Biaya ini adalah bagian dari investasi awal Anda dan mempengaruhi perhitungan ROI total.'
        },
        additionalExpenses: {
          title: 'Biaya Awal Tambahan',
          description: 'Biaya satu kali lainnya yang tidak tercakup dalam kategori lain (misalnya, asuransi, pemasaran awal).',
          formula: 'Nilai ini ditambahkan ke harga beli, biaya renovasi, dan biaya hukum untuk menghitung total investasi awal Anda. Biaya tambahan ini meningkatkan jumlah total investasi.'
        },
        investmentPeriod: {
          title: 'Periode Investasi',
          description: 'Jumlah tahun untuk menghitung pengembalian investasi.',
          formula: 'Ini menentukan berapa tahun kalkulator akan memproyeksikan pendapatan sewa, pengeluaran, dan apresiasi properti Anda. ROI akhir dihitung sebagai: (Total Pengembalian Selama Periode / Total Investasi) × 100%.'
        },
        dailyRate: {
          title: 'Tarif Sewa Harian',
          description: 'Jumlah yang Anda rencanakan untuk dikenakan per hari untuk menyewakan properti.',
          formula: 'Nilai ini dikalikan dengan 365 hari dan tingkat hunian Anda untuk menghitung pendapatan sewa tahunan. Contoh: $100/hari × 365 × 70% = $25,550 pendapatan tahunan. Pendapatan ini kemudian digunakan untuk menghitung keuntungan dan ROI.'
        },
        occupancyRate: {
          title: 'Tingkat Hunian',
          description: 'Persentase waktu properti diperkirakan akan disewakan (misalnya, 70% berarti disewakan 255 hari per tahun).',
          formula: 'Persentase ini digunakan untuk menghitung pendapatan sewa tahunan aktual Anda. Contoh: jika tarif harian Anda $100 dan hunian 70%, pendapatan tahunan Anda = $100 × 365 × 70% = $25,550. Ini mempengaruhi semua perhitungan keuntungan.'
        },
        rentGrowthRate: {
          title: 'Tingkat Pertumbuhan Sewa Tahunan',
          description: 'Peningkatan tahunan yang diharapkan dalam tarif sewa karena pertumbuhan pasar dan inflasi.',
          formula: 'Persentase ini digunakan untuk meningkatkan pendapatan sewa Anda setiap tahun. Contoh: jika pendapatan tahunan awal Anda $25,550 dan tingkat pertumbuhan 5%, pendapatan tahun 2 = $25,550 × (1 + 5%) = $26,828. Ini bertambah selama periode investasi.'
        },
        operationStartYear: {
          title: 'Tahun Mulai Operasi',
          description: 'Tahun ketika operasi sewa dimulai (0 = mulai segera, 1 = mulai setelah 1 tahun, dll.).',
          formula: 'Ini menentukan kapan Anda mulai mendapatkan pendapatan sewa. Jika diatur ke 0, Anda mendapatkan pendapatan dari tahun 1. Jika diatur ke 1, Anda tidak mendapatkan pendapatan di tahun 1, tetapi mulai mendapatkan di tahun 2. Ini mempengaruhi perhitungan total keuntungan selama periode investasi Anda.'
        },
        maintenanceFees: {
          title: 'Biaya Pemeliharaan Tahunan',
          description: 'Persentase dari pendapatan sewa yang dihabiskan untuk pemeliharaan properti, perbaikan, dan perawatan rutin.',
          formula: 'Persentase ini diterapkan pada pendapatan sewa tahunan Anda untuk menghitung biaya pemeliharaan. Contoh: jika pendapatan tahunan Anda $25,550 dan pemeliharaan 10%, biaya = $25,550 × 10% = $2,555. Biaya ini mengurangi keuntungan tahunan Anda.'
        },
        utilityBills: {
          title: 'Tagihan Utilitas',
          description: 'Persentase dari pendapatan sewa yang dihabiskan untuk utilitas (listrik, air, internet, dll.).',
          formula: 'Persentase ini diterapkan pada pendapatan sewa tahunan Anda untuk menghitung biaya utilitas. Contoh: jika pendapatan tahunan Anda $25,550 dan utilitas 8%, biaya = $25,550 × 8% = $2,044. Biaya ini mengurangi keuntungan tahunan Anda.'
        },
        annualTax: {
          title: 'Tarif Pajak Tahunan',
          description: 'Tarif pajak yang diterapkan pada pendapatan sewa (pajak penghasilan, pajak properti, dll.).',
          formula: 'Persentase ini diterapkan pada keuntungan Anda SETELAH biaya operasional (pemeliharaan + utilitas + pengelolaan). Contoh: jika pendapatan sewa Anda $25,550, biaya operasional $5,000, dan tarif pajak 20%, pajak = ($25,550 - $5,000) × 20% = $4,110.'
        },
        propertyManagement: {
          title: 'Biaya Pengelolaan Properti',
          description: 'Persentase dari pendapatan sewa yang dibayarkan kepada layanan pengelolaan properti.',
          formula: 'Persentase ini diterapkan pada pendapatan sewa tahunan Anda untuk menghitung biaya pengelolaan. Contoh: jika pendapatan tahunan Anda $25,550 dan biaya pengelolaan 5%, biaya = $25,550 × 5% = $1,278. Biaya ini mengurangi keuntungan tahunan Anda.'
        },
        appreciationYear1: {
          title: 'Apresiasi Properti Tahun 1',
          description: 'Peningkatan nilai properti yang diharapkan selama tahun pertama kepemilikan.',
          formula: 'Persentase ini meningkatkan nilai properti Anda di tahun 1. Contoh: jika total investasi Anda $200,000 dan apresiasi 5%, nilai tahun 1 = $200,000 × (1 + 5%) = $210,000. Apresiasi ini ditambahkan ke perhitungan total pengembalian Anda.'
        },
        appreciationYear2: {
          title: 'Apresiasi Properti Tahun 2',
          description: 'Peningkatan nilai properti yang diharapkan selama tahun kedua kepemilikan.',
          formula: 'Persentase ini meningkatkan nilai properti Anda di tahun 2, berdasarkan nilai tahun 1. Contoh: jika nilai tahun 1 $210,000 dan apresiasi 3%, nilai tahun 2 = $210,000 × (1 + 3%) = $216,300. Apresiasi ini ditambahkan ke perhitungan total pengembalian Anda.'
        },
        appreciationYear3: {
          title: 'Apresiasi Properti Tahun 3',
          description: 'Peningkatan nilai properti yang diharapkan selama tahun ketiga kepemilikan.',
          formula: 'Persentase ini meningkatkan nilai properti Anda di tahun 3, berdasarkan nilai tahun 2. Contoh: jika nilai tahun 2 $216,300 dan apresiasi 2%, nilai tahun 3 = $216,300 × (1 + 2%) = $220,626. Setelah tahun 3, nilai properti tetap konstan sampai akhir periode investasi.'
        }
      }
    },
    // Building Progress
    buildingProgress: {
      title: 'Kemajuan Pembangunan',
      loading: 'Memuat...',
      errorLoading: 'Kesalahan memuat data',
      errorUpload: 'Kesalahan mengunggah file',
      errorDelete: 'Kesalahan menghapus file',
      successUpload: 'File berhasil diunggah',
      successDelete: 'File dihapus',
      successLinkCopied: 'Tautan publik disalin ke clipboard',
      noAccessUpload: 'Anda tidak memiliki izin untuk mengunggah file',
      noAccessDelete: 'Anda tidak memiliki izin untuk menghapus file',
      
      // Buttons
      view: 'Lihat',
      add: 'Tambah',
      addMore: 'Tambah Lagi',
      copyPublicLink: 'Salin Tautan Publik',
      addPeriod: 'Tambah Periode',
      backToProgress: 'Kembali ke kemajuan pembangunan',
      
      // Upload modal
      uploadFiles: 'Unggah File',
      uploadingFiles: 'Mengunggah file...',
      supportedFormats: 'Gambar dan file video didukung',
      
      // Media counts
      photos: 'foto',
      videos: 'video',
      photo: 'foto',
      video: 'video',
      
      // Album description
      albumDescription: 'Deskripsi Album',
      addDescription: 'Tambah Deskripsi',
      editDescription: 'Edit Deskripsi',
      saveDescription: 'Simpan Deskripsi',
      cancelEdit: 'Batal Edit',
      descriptionPlaceholder: 'Masukkan deskripsi untuk album ini...',
      descriptionSaved: 'Deskripsi disimpan',
      descriptionError: 'Kesalahan menyimpan deskripsi',
      
      // Confirm dialog
      confirmDelete: 'Apakah Anda yakin ingin menghapus file ini?',
      
      // Error messages
      dataNotFound: 'Data tidak ditemukan',
      noData: 'Tidak ada data untuk bulan ini',
      
      // Months
      months: {
        january: 'Januari',
        february: 'Februari',
        march: 'Maret',
        april: 'April',
        may: 'Mei',
        june: 'Juni',
        july: 'Juli',
        august: 'Agustus',
        september: 'September',
        october: 'Oktober',
        november: 'November',
        december: 'Desember'
      },
      createdAt: 'Создан',
      updatedAt: 'Обновлен'
    },

    // Education
    education: {
      title: 'Pendidikan',
      description: 'Materi pembelajaran dan kursus pelatihan',
      sections: 'Bagian',
      topics: 'Topik',
      lessons: 'Pelajaran',
      createSection: 'Buat Bagian',
      editSection: 'Edit Bagian',
      deleteSection: 'Hapus Bagian',
      createTopic: 'Buat Topik',
      editTopic: 'Edit Topik',
      deleteTopic: 'Hapus Topik',
      createLesson: 'Buat Pelajaran',
      editLesson: 'Edit Pelajaran',
      deleteLesson: 'Hapus Pelajaran',
      sectionName: 'Nama Bagian',
      sectionNameEn: 'Nama Bagian (Bahasa Inggris)',
      sectionNameRu: 'Nama Bagian (Bahasa Rusia)',
      sectionNameId: 'Nama Bagian (Bahasa Indonesia)',
      sectionDescription: 'Deskripsi Bagian',
      sectionDescriptionEn: 'Deskripsi Bagian (Bahasa Inggris)',
      sectionDescriptionRu: 'Deskripsi Bagian (Bahasa Rusia)',
      sectionDescriptionId: 'Deskripsi Bagian (Bahasa Indonesia)',
      topicName: 'Nama Topik',
      topicNameEn: 'Nama Topik (Bahasa Inggris)',
      topicNameRu: 'Nama Topik (Bahasa Rusia)',
      topicNameId: 'Nama Topik (Bahasa Indonesia)',
      topicDescription: 'Deskripsi Topik',
      topicDescriptionEn: 'Deskripsi Topik (Bahasa Inggris)',
      topicDescriptionRu: 'Deskripsi Topik (Bahasa Rusia)',
      topicDescriptionId: 'Deskripsi Topik (Bahasa Indonesia)',
      lessonName: 'Nama Pelajaran',
      lessonNameEn: 'Nama Pelajaran (Bahasa Inggris)',
      lessonNameRu: 'Nama Pelajaran (Bahasa Rusia)',
      lessonNameId: 'Nama Pelajaran (Bahasa Indonesia)',
      lessonDescription: 'Deskripsi Pelajaran',
      lessonDescriptionEn: 'Deskripsi Pelajaran (Bahasa Inggris)',
      lessonDescriptionRu: 'Deskripsi Pelajaran (Bahasa Rusia)',
      lessonDescriptionId: 'Deskripsi Pelajaran (Bahasa Indonesia)',
      videoUrlEn: 'URL Video (Bahasa Inggris)',
      videoUrlRu: 'URL Video (Bahasa Rusia)',
      videoUrlId: 'URL Video (Bahasa Indonesia)',
      order: 'Urutan',
      save: 'Сохранить',
      cancel: 'Batal',
      loading: 'Loading...',
      noSections: 'Tidak ada bagian yang tersedia',
      noTopics: 'Tidak ada topik yang tersedia',
      noLessons: 'Tidak ada pelajaran dalam topik ini',
      sectionCreated: 'Bagian berhasil dibuat',
      sectionUpdated: 'Bagian berhasil diperbarui',
      sectionDeleted: 'Bagian berhasil dihapus',
      topicCreated: 'Topik berhasil dibuat',
      topicUpdated: 'Topik berhasil diperbarui',
      topicDeleted: 'Topik berhasil dihapus',
      lessonCreated: 'Pelajaran berhasil dibuat',
      lessonUpdated: 'Pelajaran berhasil diperbarui',
      lessonDeleted: 'Pelajaran berhasil dihapus',
      confirmDeleteSection: 'Apakah Anda yakin ingin menghapus bagian ini? Semua topik dan pelajaran juga akan dihapus.',
      confirmDeleteTopic: 'Apakah Anda yakin ingin menghapus topik ini? Semua pelajaran juga akan dihapus.',
      confirmDeleteLesson: 'Apakah Anda yakin ingin menghapus pelajaran ini?',
      errorLoading: 'Kesalahan memuat data',
      errorSaving: 'Kesalahan menyimpan data',
      errorDeleting: 'Kesalahan menghapus data',
      noPermission: 'Anda tidak memiliki izin untuk melakukan tindakan ini',
      topicNotFound: 'Topik tidak ditemukan',
      lessonNotFound: 'Pelajaran tidak ditemukan',
      enterLessonName: 'Masukkan nama pelajaran dalam setidaknya satu bahasa',
      addVideoUrl: 'Tambahkan setidaknya satu URL video',
      watchVideo: 'Tonton Video',
      backToSections: 'Kembali ke Bagian',
      backToTopics: 'Kembali ke Topik',
      backToLessons: 'Kembali ke Pelajaran',
      viewLessons: 'Lihat Pelajaran',
      goToEducation: 'Pergi ke Pendidikan',
      backToSection: 'Kembali ke Bagian',
      videoNotAvailable: 'Video tidak tersedia dalam bahasa Anda',
      selectLanguage: 'Pilih bahasa',
      english: 'Bahasa Inggris',
      russian: 'Bahasa Rusia',
      indonesian: 'Bahasa Indonesia',
      infoSection: 'Informasi',
      navigationSection: 'Navigasi',
      lessonDescriptionSection: 'Deskripsi Pelajaran',
      moveTopic: 'Pindahkan Topik',
      moveTopicToSection: 'Pindahkan topik ke bagian lain',
      availableRoles: 'Peran yang Tersedia',
      createdAt: 'Dibuat',
      updatedAt: 'Diperbarui'
    },

    // Developers List
    developersList: {
      title: 'Daftar Pengembang',
      titleForDeveloper: 'Tentang Pengembang',
      addDeveloper: 'Tambah Pengembang',
      noDevelopers: 'Tidak ada pengembang',
      developersFound: 'Pengembang ditemukan: {count}',
      editDeveloper: 'Edit',
      loading: 'Memuat...',
      errorLoading: 'Kesalahan memuat pengembang',
      createdAt: 'Dibuat',
      updatedAt: 'Diperbarui'
    },

    // Edit Developer
    editDeveloper: {
      addTitle: 'Tambah Pengembang',
      editTitle: 'Edit Pengembang',
      nameLabel: 'Nama Pengembang',
      namePlaceholder: 'Masukkan nama pengembang',
      descriptionLabel: 'Deskripsi',
      descriptionPlaceholder: 'Masukkan deskripsi pengembang',
      approvedLabel: 'Diverifikasi Layanan',
      logoLabel: 'Logo',
      uploadLogo: 'Upload Logo',
      currentLogo: 'Logo Saat Ini',
      save: 'Simpan',
      add: 'Tambah',
      saving: 'Menyimpan...',
      saveSuccess: 'Disimpan!',
      saveError: 'Kesalahan menyimpan!',
      loadError: 'Kesalahan memuat data!'
    },

    // Premium Features
    premiumFeatures: {
      title: 'Langganan Premium untuk Pengembang',
      subtitle: 'Visibilitas maksimum properti Anda di kalangan agen real estate dan peningkatan penjualan melalui platform IT Agent',
      
      // Features
      features: {
        iosAppPlacement: {
          title: 'Penempatan di halaman utama aplikasi dan website',
          description: 'Properti dan kompleks Anda akan ditampilkan di halaman utama aplikasi IT Agent untuk semua agen real estate, yang secara signifikan meningkatkan visibilitas penawaran Anda.',
          benefit: 'Peningkatan visibilitas di kalangan agen dan investor'
        },
        pushNotifications: {
          title: 'Notifikasi push ke semua agen',
          description: 'Kirim notifikasi tentang properti baru, promosi dan acara penting langsung ke semua agen real estate di aplikasi IT Agent.',
          benefit: 'Komunikasi langsung dengan agen'
        },
        verifiedBadge: {
          title: 'Lencana "Diverifikasi Layanan"',
          description: 'Lencana khusus di halaman properti dan kompleks Anda yang meningkatkan kepercayaan dan konversi di kalangan agen dan klien.',
          benefit: 'Peningkatan kepercayaan dan konversi'
        },
        publicWebPage: {
          title: 'Halaman web publik',
          description: 'Halaman web lengkap dengan informasi tentang properti Anda yang dapat digunakan di luar aplikasi dan dibagikan dengan klien dan mitra.',
          benefit: 'Perluasan saluran penjualan'
        },
        ratingBoost: {
          title: 'Peningkatan peringkat di katalog',
          description: 'Properti Anda mendapatkan penempatan prioritas dan tampilan bintang peringkat yang disorot seperti di galeri publik, membantu calon pembeli menemukan Anda lebih cepat.',
          benefit: 'Lebih banyak tayangan dan klik'
        },
        aiTelegramBot: {
          title: 'Bot Telegram AI merek Anda',
          description: 'Luncurkan asisten AI bermerk yang menjawab pertanyaan klien 24/7 dan mengarahkan mereka ke properti Anda, memesan kunjungan dan mengumpulkan lead.',
          benefit: 'Generasi lead otomatis 24/7'
        },
        crmSystem: {
          title: 'CRM bawaan untuk lead',
          description: 'Kumpulkan dan proses lead dari halaman publik dan bot AI Anda dalam satu tempat, dengan integrasi untuk sumber trafik eksternal.',
          benefit: 'Respon lebih cepat dan konversi lebih tinggi'
        },
        contentFactory: {
          title: 'Pembuatan konten dengan bantuan AI',
          description: 'Otomatiskan pembuatan posting untuk media sosial Anda.',
          benefit: 'Konten konsisten tanpa usaha ekstra'
        }
      },

      // Additional benefits
      additionalBenefits: 'Manfaat Tambahan',
      benefits: [
        'Peningkatan jumlah tampilan properti Anda',
        'Akses langsung ke database agen real estate',
        'Peningkatan kepercayaan dan otoritas merek',
        'Otomatisasi proses promosi properti',
        'Analitik dan statistik tampilan',
        'Dukungan prioritas dari tim IT Agent'
      ],

      // Statistics
      statistics: {
        agents: 'Agen real estate',
        viewsIncrease: 'Peningkatan tampilan',
        availability: 'Ketersediaan'
      },

      // CTA section
      cta: {
        title: 'Siap meningkatkan penjualan?',
        subtitle: 'Bergabunglah dengan pengembang premium dan dapatkan visibilitas maksimum properti Anda di kalangan agen real estate',
        subscribeButton: 'Berlangganan premium',
        footer: 'Tidak ada biaya tersembunyi • Batal kapan saja • Dukungan prioritas'
      }
    },

    // Notifications Page
    notificationsPage: {
      title: 'Manajemen Notifikasi',
      subtitle: 'Kelola notifikasi push untuk properti Anda',
      
      // Statistics
      statistics: {
        sentToday: 'Dikirim Hari Ini',
        totalSent: 'Total Dikirim',
        lastSent: 'Terakhir Dikirim',
        remaining: 'Tersisa',
        of: 'dari',
        total: 'Total',
        never: 'Tidak pernah'
      },

      // Tabs
      tabs: {
        send: 'Kirim',
        history: 'Riwayat'
      },

      // Send Form
      sendForm: {
        title: 'Buat Notifikasi',
        description: 'Kirim notifikasi ke pengguna aplikasi iOS',
        titleLabel: 'Judul',
        titlePlaceholder: 'Masukkan judul notifikasi',
        bodyLabel: 'Teks Pesan',
        bodyPlaceholder: 'Masukkan teks notifikasi',
        characters: 'karakter',
        targetAudience: 'Notifikasi akan dikirim ke semua pengguna aplikasi iOS',
        targetAudienceLabel: 'Target Audiens',
        targetAudienceAll: 'Semua pengguna',
        targetAudienceRole: 'Pengguna dengan peran tertentu',
        roleSelectLabel: 'Pilih peran',
        roleSelectPlaceholder: 'Pilih peran pengguna',
        sendButton: 'Kirim Notifikasi',
        sending: 'Mengirim...',
        validation: {
          titleRequired: 'Judul diperlukan',
          bodyRequired: 'Teks pesan diperlukan',
          titleTooLong: 'Judul terlalu panjang',
          bodyTooLong: 'Teks pesan terlalu panjang',
          roleRequired: 'Silakan pilih peran'
        }
      },

      // History
      history: {
        title: 'Riwayat Notifikasi',
        description: 'Lihat notifikasi yang dikirim',
        noNotifications: 'Belum ada notifikasi yang dikirim',
        sentToAllUsers: 'Dikirim ke semua pengguna',
        delivered: 'Terkirim',
        errors: 'Kesalahan',
        status: {
          sent: 'Dikirim',
          delivered: 'Terkirim',
          failed: 'Gagal',
          pending: 'Menunggu'
        }
      },

      // Notifications
      notifications: {
        success: {
          title: 'Notifikasi berhasil dikirim!',
          message: 'Terkirim: {successCount}, Kesalahan: {failureCount}'
        },
        error: {
          title: 'Kesalahan Pengiriman',
          message: 'Terjadi kesalahan yang tidak diketahui'
        },
        authError: {
          title: 'Kesalahan Autentikasi',
          message: 'Pengguna tidak terautentikasi. Silakan segarkan halaman.'
        }
      },

      // Access Control
      accessControl: {
        forbidden: 'Akses Dilarang',
        noPermission: 'Anda tidak memiliki izin untuk mengakses bagian ini.'
      },

      // User Roles
      roles: {
        admin: 'Administrator',
        moderator: 'Moderator',
        agent: 'Agen',
        premiumAgent: 'Agen Premium',
        developer: 'Pengembang',
        premiumDeveloper: 'Pengembang Premium',
        user: 'Pengguna'
      },

      // Moderation
      moderation: {
        onModeration: 'Sedang Dimoderasi'
      }
    },

    // Technical Supervision
    technicalSupervision: {
      title: 'Pengawasan Teknis',
      subtitle: 'Manajemen laporan pengawasan teknis untuk proyek konstruksi',
      accessDenied: 'Akses Ditolak',
      adminOnlyAccess: 'Bagian Pengawasan Teknis hanya tersedia untuk administrator',
      
      // Projects
      addProject: 'Tambah Proyek',
      createProject: 'Buat Proyek',
      editProject: 'Edit Proyek',
      projectName: 'Nama Proyek',
      projectNamePlaceholder: 'mis.: Kompleks Matahari, Rumah di Jl. Pushkin',
      projectDescriptionPlaceholder: 'Deskripsi singkat proyek',
      noProjects: 'Tidak Ada Proyek',
      noProjectsDescription: 'Buat proyek pertama untuk mulai bekerja dengan pengawasan teknis',
      createFirstProject: 'Buat Proyek Pertama',
      projectHasSections: 'Tidak dapat menghapus proyek yang berisi bagian',
      totalSections: 'Total Bagian',
      currentProject: 'Proyek Saat Ini',
      backToProjects: 'Kembali ke Proyek',
      address: 'Alamat',
      addressPlaceholder: 'Alamat lengkap objek',

      // Sections
      addSection: 'Tambah Bagian',
      createSection: 'Buat Bagian',
      editSection: 'Edit Bagian',
      sectionName: 'Nama Bagian',
      sectionNamePlaceholder: 'mis.: Fondasi, Dinding, Listrik',
      sectionDescriptionPlaceholder: 'Deskripsi singkat bagian',
      noSections: 'Tidak Ada Bagian',
      noSectionsDescription: 'Buat bagian pertama untuk mulai bekerja dengan pengawasan teknis',
      createFirstSection: 'Buat Bagian Pertama',
      sectionHasInspections: 'Tidak dapat menghapus bagian yang berisi inspeksi',
      totalInspections: 'Total Inspeksi',
      
      // Inspections
      addInspection: 'Tambah Inspeksi',
      createInspection: 'Buat Inspeksi',
      editInspection: 'Edit Inspeksi',
      inspectionTitle: 'Judul Inspeksi',
      inspectionTitlePlaceholder: 'mis.: Plesteran, Kabel',
      inspectionsIn: 'Inspeksi di bagian',
      
      // Fields
      location: 'Lokasi',
      locationPlaceholder: 'Lantai, ruangan, area',
      orderNumber: 'Nomor Urutan',
      description: 'Deskripsi',
      descriptionPlaceholder: 'Deskripsi umum inspeksi yang dilakukan',
      defects: 'Cacat dan Masalah',
      defectsPlaceholder: 'Deskripsi cacat dan pelanggaran yang ditemukan',
      risks: 'Risiko dan Bahaya',
      risksPlaceholder: 'Bahaya dari cacat yang ditemukan',
      recommendations: 'Rekomendasi Perbaikan',
      recommendationsPlaceholder: 'Cara memperbaiki masalah yang ditemukan',
      
      // Status
      status: 'Status',
      statusPending: 'Menunggu',
      statusInProgress: 'Sedang Berlangsung',
      statusCompleted: 'Selesai',
      statusCritical: 'Kritis',
      completed: 'Selesai',
      inProgress: 'Sedang Berlangsung',
      critical: 'Kritis',
      
      // Photos
      photos: 'Foto',
      uploadPhotos: 'Unggah Foto',
      uploading: 'Mengunggah...',
      photosUploadSuccess: 'Foto berhasil diunggah',
      photosUploadError: 'Error mengunggah foto',
      
      // Common
      created: 'Dibuat',
      
      // Public page
      publicPageSubtitle: 'Laporan Pengawasan Teknis',
      projectNotFound: 'Proyek tidak ditemukan',
      loadError: 'Error memuat data',
      copyPublicLink: 'Salin link halaman publik',
      publicLinkCopied: 'Link halaman publik disalin',
      publicLinkCopyError: 'Error menyalin link',
      projectInfo: 'Informasi Laporan',
      projectCreated: 'Laporan dibuat',
      lastUpdated: 'Terakhir diperbarui',
      noInspectionsInSection: 'Belum ada inspeksi di bagian ini',
      noSectionsInProject: 'Proyek ini belum memiliki bagian pengawasan teknis'
    }
  }
}; 