import React, { useEffect, useMemo, useState, useCallback } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, Timestamp, getDocs, where, query, collection, setDoc, deleteDoc } from "firebase/firestore";
import { Building2, Search, Filter, ChevronDown, X as XIcon, Plus, Menu, LogIn, Wrench, Scale, HardHat, ClipboardCheck, Ruler, Compass } from "lucide-react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useCache } from "../CacheContext";
import { useLanguage } from "../lib/LanguageContext";
import { translations } from "../lib/translations";
import { translateDistrict, translatePropertyType, translateConstructionStatus } from "../lib/utils";
import { landingTranslations } from "../lib/landingTranslations";
import { useAuth } from "../AuthContext";
import { initPageTracking } from "../utils/pageAnalytics";
// removed duplicate firestore import

import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { CustomSelect } from "../components/ui/custom-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { Badge } from "../components/ui/badge";
import LanguageSwitcher from "../components/LanguageSwitcher";
import PropertyPlacementModal from "../components/PropertyPlacementModal";
import { showInfo } from "../utils/notifications";

function PublicPropertiesGallery({ sharedOwnerName, sharedToken }) {
  const { forceRefreshPropertiesList } = useCache();
  const { language } = useLanguage();
  const { currentUser, role } = useAuth();
  const isPrivilegedBase = (() => {
    const normalized = String(role || '').toLowerCase();
    return ['admin', 'moderator', 'premium agent', 'премиум агент'].includes(normalized);
  })();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const t = translations[language];
  const lt = landingTranslations[language];
  const isSharedView = location.pathname.startsWith('/public/shared/');
  const effectiveCurrentUser = isSharedView ? null : currentUser;
  const effectiveRole = isSharedView ? null : role;
  const isPrivileged = isSharedView ? false : isPrivilegedBase;
  
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [hasUserProperties, setHasUserProperties] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  
  // Проверяем, есть ли параметр selection с ID объектов
  const selectionIds = searchParams.get('selection');
  const isSelectionMode = !!selectionIds;
  const selectedPropertyIds = useMemo(() => (
    isSelectionMode ? selectionIds.split(',') : []
  ), [isSelectionMode, selectionIds]);
  
  const [filters, setFilters] = useState(() => {
    // Инициализация фильтров из URL параметров
    return {
      priceMin: searchParams.get('priceMin') || "",
      priceMax: searchParams.get('priceMax') || "",
      areaMin: searchParams.get('areaMin') || "",
      areaMax: searchParams.get('areaMax') || "",
      bedrooms: searchParams.get('bedrooms') || "all",
      district: searchParams.get('district') || "all",
      type: searchParams.get('type') || "all",
      status: searchParams.get('status') || "all",
      addedByMe: searchParams.get('addedByMe') === 'true',
    };
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Загрузка избранного для текущего пользователя/сессии
  useEffect(() => {
    async function loadFavorites() {
      try {
        if (effectiveCurrentUser) {
          const favCol = collection(db, 'users', effectiveCurrentUser.uid, 'favorites');
          const snap = await getDocs(favCol);
          const ids = new Set();
          snap.forEach(d => {
            const pid = d.id;
            if (pid) ids.add(pid);
          });
          setFavoriteIds(ids);
        } else {
          const raw = sessionStorage.getItem('favoritesPropertyIds');
          const arr = raw ? JSON.parse(raw) : [];
          setFavoriteIds(new Set(Array.isArray(arr) ? arr : []));
        }
      } catch (e) {
        console.error('Ошибка загрузки избранного:', e);
      }
    }
    loadFavorites();
  }, [effectiveCurrentUser]);

  const isFavorite = useCallback((propertyId) => favoriteIds.has(propertyId), [favoriteIds]);

  const toggleFavorite = useCallback(async (propertyId) => {
    try {
      if (!propertyId) return;
      if (effectiveCurrentUser) {
        const favRef = doc(db, 'users', effectiveCurrentUser.uid, 'favorites', propertyId);
        if (favoriteIds.has(propertyId)) {
          await deleteDoc(favRef);
          setFavoriteIds(prev => {
            const next = new Set(prev);
            next.delete(propertyId);
            return next;
          });
        } else {
          await setDoc(favRef, { createdAt: Timestamp.now() });
          setFavoriteIds(prev => new Set(prev).add(propertyId));
        }
      } else {
        // sessionStorage
        setFavoriteIds(prev => {
          const next = new Set(prev);
          if (next.has(propertyId)) {
            next.delete(propertyId);
          } else {
            next.add(propertyId);
          }
          const arr = Array.from(next);
          sessionStorage.setItem('favoritesPropertyIds', JSON.stringify(arr));
          return next;
        });
      }
    } catch (e) {
      console.error('Ошибка переключения избранного:', e);
    }
  }, [effectiveCurrentUser, favoriteIds]);

  // Инициализация отслеживания страницы для аналитики
  useEffect(() => {
    const cleanup = initPageTracking('/');
    return cleanup;
  }, []);

  const searchPlaceholder = useMemo(() => {
    const base = t.propertiesGallery.searchPlaceholder || "";
    return language === "ru" ? base.replace("названию", "цене") : base;
  }, [t.propertiesGallery.searchPlaceholder, language]);

  const safeDisplay = (value) => {
    if (value === null || value === undefined) return "";
    if (value instanceof Timestamp) return value.toDate().toLocaleDateString("ru-RU");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const handlePlaceProperty = () => {
    if (!isSharedView && effectiveCurrentUser && ['admin', 'moderator', 'agent', 'premium agent'].includes(effectiveRole)) {
      // Авторизованный пользователь с нужной ролью - переходим на страницу создания
      navigate('/agent-property/create');
    } else {
      // Неавторизованный или без нужной роли - открываем модальное окно
      setIsPlacementModalOpen(true);
    }
  };

  

  const fetchProperties = useCallback(async () => {
    try {
      const data = await forceRefreshPropertiesList();

      // Загружаем все комплексы и строим быстрые мапы: id -> number, name(normalized) -> number/id
      const complexesSnap = await getDocs(collection(db, "complexes"));
      const complexNumberById = {};
      const complexNumberByName = {};
      const complexIdByName = {};
      const complexNameById = {};
      const complexNameByName = {};
      complexesSnap.forEach((docSnap) => {
        const c = docSnap.data();
        let num = c?.number;
        if (typeof num === 'string') {
          const parsed = parseInt(num, 10);
          num = Number.isNaN(parsed) ? null : parsed;
        }
        if (typeof num !== 'number') num = null;
        complexNumberById[docSnap.id] = num;
        complexNameById[docSnap.id] = c?.name || null;
        if (c?.name) {
          const key = String(c.name).trim().toLowerCase();
          complexNumberByName[key] = num;
          complexIdByName[key] = docSnap.id;
          complexNameByName[key] = c.name;
        }
      });

      const withComplexInfo = await Promise.all(
        data.map(async (property) => {
          const augmented = { ...property };

          // Номер и id комплекса по id или по имени (нормализуем имя)
          if (property.complexId && Object.prototype.hasOwnProperty.call(complexNumberById, property.complexId)) {
            augmented.complexNumber = complexNumberById[property.complexId];
            augmented.complexResolvedId = property.complexId;
            augmented.complexResolvedName = complexNameById[property.complexId] || null;
          } else if (property.complex) {
            const key = String(property.complex).trim().toLowerCase();
            augmented.complexNumber = Object.prototype.hasOwnProperty.call(complexNumberByName, key)
              ? complexNumberByName[key]
              : null;
            augmented.complexResolvedId = Object.prototype.hasOwnProperty.call(complexIdByName, key)
              ? complexIdByName[key]
              : null;
            augmented.complexResolvedName = Object.prototype.hasOwnProperty.call(complexNameByName, key)
              ? complexNameByName[key]
              : property.complex;
          } else {
            augmented.complexNumber = null;
            augmented.complexResolvedId = null;
            augmented.complexResolvedName = null;
          }

          // Статус проверки застройщика
          try {
            if (property.developerId) {
              const devDoc = await getDoc(doc(db, "developers", property.developerId));
              augmented.isDeveloperApproved = devDoc.exists() && devDoc.data().approved === true;
            } else if (property.developer) {
              const q = query(collection(db, "developers"), where("name", "==", property.developer));
              const snap = await getDocs(q);
              augmented.isDeveloperApproved = !snap.empty && !!snap.docs[0].data().approved;
            } else {
              augmented.isDeveloperApproved = false;
            }
          } catch {
            augmented.isDeveloperApproved = false;
          }

          return augmented;
        })
      );

      // Сортировка по номеру комплекса (возрастание), без номера в конец; при равенстве — новые сверху
      withComplexInfo.sort((a, b) => {
        const aNum = typeof a.complexNumber === 'number' ? a.complexNumber : Number.POSITIVE_INFINITY;
        const bNum = typeof b.complexNumber === 'number' ? b.complexNumber : Number.POSITIVE_INFINITY;
        if (aNum !== bNum) return aNum - bNum;
        const tA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
        return tB - tA;
      });

      // Фильтруем объекты: скрытые не показываем никому
      const notHiddenProperties = withComplexInfo.filter((p) => !p?.isHidden);
      
      // Разделяем объекты на обычные и на модерации
      const normalProperties = notHiddenProperties.filter((p) => p?.moderation !== true);
      const moderationProperties = notHiddenProperties.filter((p) => p?.moderation === true);
      
      // Объекты на модерации показываем только их создателям в начале списка
      const creatorModerationProperties = moderationProperties.filter((p) => 
        effectiveCurrentUser && p?.createdBy === effectiveCurrentUser.uid
      );
      
      // Объединяем: сначала объекты на модерации от создателя, потом обычные
      const visibleProperties = [...creatorModerationProperties, ...normalProperties];
      
      setProperties(visibleProperties);
      
      // Проверяем, есть ли у текущего пользователя объекты
      if (effectiveCurrentUser) {
        const userHasProperties = visibleProperties.some(p => p.createdBy === effectiveCurrentUser.uid);
        setHasUserProperties(userHasProperties);
      } else {
        setHasUserProperties(false);
      }
    } catch (err) {
      console.error(t.propertiesGallery.dataLoadError || "Ошибка загрузки объектов:", err);
    } finally {
      setLoading(false);
    }
  }, [forceRefreshPropertiesList, t.propertiesGallery.dataLoadError, effectiveCurrentUser]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const filterOptions = useMemo(() => {
    const options = {
      districts: [...new Set(properties.map((p) => p.district).filter(Boolean))],
      types: [...new Set(properties.map((p) => p.type).filter(Boolean))],
      bedrooms: [
        ...new Set(
          properties
            .map((p) => p.bedrooms)
            .filter((n) => n !== undefined && n !== null && n !== "")
        ),
      ],
    };
    options.districts.sort();
    options.types.sort();
    options.bedrooms.sort((a, b) => a - b);
    return options;
  }, [properties]);

  const formatPrice = (price) => {
    if (!price) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredProperties = useMemo(() => {
    // Если режим подборки - показываем только выбранные объекты
    if (isSelectionMode) {
      return properties.filter(property => selectedPropertyIds.includes(property.id));
    }
    
    // Обычная фильтрация
    return properties.filter((property) => {
      const searchText = searchQuery.toLowerCase();
      const langs = ['ru', 'en', 'id'];
      const statusTranslatedAll = property.status
        ? langs.map(l => translateConstructionStatus(String(property.status), l).toLowerCase())
        : [];
      const districtTranslatedAll = property.district
        ? langs.map(l => translateDistrict(String(property.district), l).toLowerCase())
        : [];
      const typeTranslatedAll = property.type
        ? langs.map(l => translatePropertyType(String(property.type), l).toLowerCase())
        : [];
      const studioTranslationsAll = langs
        .map(l => translations[l]?.propertiesGallery?.studio)
        .filter(Boolean)
        .map(s => String(s).toLowerCase());
      const matchesSearch =
        !searchQuery ||
        // Поиск по району (как по исходному значению, так и по переводу)
        (property.district && property.district.toLowerCase().includes(searchText)) ||
        (districtTranslatedAll.some(s => s.includes(searchText))) ||
        // Поиск по типу (как по исходному значению, так и по переводу)
        (property.type && property.type.toLowerCase().includes(searchText)) ||
        (typeTranslatedAll.some(s => s.includes(searchText))) ||
        // Поиск по статусу (как по исходному значению, так и по переводу)
        (property.status && String(property.status).toLowerCase().includes(searchText)) ||
        (statusTranslatedAll.some(s => s.includes(searchText))) ||
        // Поиск по числовым полям
        (property.price !== undefined && property.price !== null && String(property.price).toLowerCase().includes(searchText)) ||
        (property.area !== undefined && property.area !== null && String(property.area).toLowerCase().includes(searchText)) ||
        (property.bedrooms !== undefined && property.bedrooms !== null && (
          String(property.bedrooms).toLowerCase().includes(searchText) ||
          ((property.bedrooms === 0 || property.bedrooms === "Студия") && studioTranslationsAll.some(s => s.includes(searchText)))
        )) ||
        (property.unitsCount !== undefined && property.unitsCount !== null && String(property.unitsCount).toLowerCase().includes(searchText));

      const matchesPrice =
        (!filters.priceMin || property.price >= Number(filters.priceMin)) &&
        (!filters.priceMax || property.price <= Number(filters.priceMax));

      const matchesArea =
        (!filters.areaMin || property.area >= Number(filters.areaMin)) &&
        (!filters.areaMax || property.area <= Number(filters.areaMax));

      const matchesBedrooms = (() => {
        if (filters.bedrooms === "all") return true;
        if (filters.bedrooms === "0") {
          const val = property.bedrooms;
          return val === 0 || String(val).trim().toLowerCase() === "студия";
        }
        const selectedNum = Number(filters.bedrooms);
        if (!Number.isFinite(selectedNum)) return true;
        const propNum = Number(property.bedrooms);
        return Number.isFinite(propNum) && propNum === selectedNum;
      })();
      const matchesDistrict = filters.district === "all" || property.district === filters.district;
      const matchesType = filters.type === "all" || property.type === filters.type;
      const matchesStatus = filters.status === "all" || property.status === filters.status;
      const matchesAddedByMe = !filters.addedByMe || (effectiveCurrentUser && property.createdBy === effectiveCurrentUser.uid);

      return matchesSearch && matchesPrice && matchesArea && matchesBedrooms && matchesDistrict && matchesType && matchesStatus && matchesAddedByMe;
    });
  }, [properties, searchQuery, filters, effectiveCurrentUser, isSelectionMode, selectedPropertyIds]);

  const resetFilters = () => {
    setSearchQuery("");
    setFilters({
      priceMin: "",
      priceMax: "",
      areaMin: "",
      areaMax: "",
      bedrooms: "all",
      district: "all",
      type: "all",
      status: "all",
      addedByMe: false,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-gray-400 border-b-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className={`mx-auto space-y-4 p-4 ${isMobile ? "max-w-full" : "max-w-4xl"}`}>
        {/* Заголовок, кнопка размещения объекта и переключатель языка в одной строке */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Гамбургер меню слева */}
            {!isSharedView && (
            <div className="relative">
              <button
                className="p-2 rounded-md border border-gray-200 hover:bg-gray-50"
                aria-label="menu"
                onClick={(e) => {
                  e.stopPropagation();
                  const panel = document.getElementById('public-menu-dropdown');
                  if (panel) {
                    panel.classList.toggle('hidden');
                  }
                }}
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
              {/* Выпадающее меню */}
              <div
                id="public-menu-dropdown"
                className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg hidden z-20"
                onMouseLeave={(e) => {
                  const panel = document.getElementById('public-menu-dropdown');
                  if (panel) panel.classList.add('hidden');
                }}
              >
                {/* Login / Register first */}
                {currentUser ? (
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2" onClick={() => { const panel = document.getElementById('public-menu-dropdown'); if (panel) panel.classList.add('hidden'); navigate('/public/account'); }}>
                    <LogIn className="w-4 h-4 text-gray-700" />
                    <span>{t.publicMenu.account}</span>
                  </button>
                ) : (
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2" onClick={() => { const panel = document.getElementById('public-menu-dropdown'); if (panel) panel.classList.add('hidden'); setIsPlacementModalOpen(true); }}>
                    <LogIn className="w-4 h-4 text-gray-700" />
                    <span>{t.publicMenu.loginRegister}</span>
                  </button>
                )}
                {/* Place Property */}
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2" onClick={() => { const panel = document.getElementById('public-menu-dropdown'); if (panel) panel.classList.add('hidden'); handlePlaceProperty(); }}>
                  <Plus className="w-4 h-4 text-gray-700" />
                  <span>{lt.placePropertyTitle}</span>
                </button>
                {/* Favorites */}
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2" onClick={() => { const panel = document.getElementById('public-menu-dropdown'); if (panel) panel.classList.add('hidden'); navigate('/public/favorites'); }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={favoriteIds.size > 0 ? '#ef4444' : 'none'} stroke="#ef4444" strokeWidth="2" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  <span>{t.publicMenu.favorites}</span>
                </button>
                {/* Services */}
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2" onClick={() => { const panel = document.getElementById('public-menu-dropdown'); if (panel) panel.classList.add('hidden'); setIsServicesOpen(true); }}>
                  <Wrench className="w-4 h-4 text-gray-700" />
                  <span>{t.publicMenu.services}</span>
                </button>

              {/* Subscription - last item */}
              <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2" onClick={() => { const panel = document.getElementById('public-menu-dropdown'); if (panel) panel.classList.add('hidden'); if (currentUser) { setIsSubscriptionOpen(true); } else { setIsPlacementModalOpen(true); } }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M5 5h14a2 2 0 0 1 2 2v6a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7V7a2 2 0 0 1 2-2z"/></svg>
                <span>{t.publicMenu.subscription}</span>
              </button>
              </div>
            </div>
            )}
            <h1 className={`font-bold text-gray-900 ${isMobile ? "text-xl" : "text-2xl"}`}>
              {isSelectionMode
                ? t.propertiesGallery.selectionTitle
                : (isSharedView && sharedOwnerName) ? sharedOwnerName : (t.navigation?.publicInvestorTitle || 'IT AGENT BALI')}
            </h1>
            {isSelectionMode && (
              <p className="text-sm text-gray-600 mt-1">
                {t.propertiesGallery.selectionSubtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>
        

        {/* Поиск и фильтры - скрываем в режиме подборки */}
        {!isSelectionMode && (
          <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-row"}`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  {t.propertiesGallery.filtersTitle}
                  <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground">
                    {[
                      filters.priceMin,
                      filters.priceMax,
                      filters.areaMin,
                      filters.areaMax,
                      filters.bedrooms !== "all" ? 1 : 0,
                      filters.district !== "all" ? 1 : 0,
                      filters.type !== "all" ? 1 : 0,
                      filters.status !== "all" ? 1 : 0,
                      filters.addedByMe ? 1 : 0,
                    ].filter(Boolean).length}
                  </Badge>
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isFiltersOpen ? "transform rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="p-4 mt-2">
              <div className="space-y-4">
                <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.priceLabel}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={t.propertiesGallery.pricePlaceholderFrom}
                        value={filters.priceMin}
                        onChange={(e) => setFilters((prev) => ({ ...prev, priceMin: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder={t.propertiesGallery.pricePlaceholderTo}
                        value={filters.priceMax}
                        onChange={(e) => setFilters((prev) => ({ ...prev, priceMax: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.areaLabel}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={t.propertiesGallery.pricePlaceholderFrom}
                        value={filters.areaMin}
                        onChange={(e) => setFilters((prev) => ({ ...prev, areaMin: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder={t.propertiesGallery.pricePlaceholderTo}
                        value={filters.areaMax}
                        onChange={(e) => setFilters((prev) => ({ ...prev, areaMax: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.bedroomsLabel}</Label>
                    <CustomSelect
                      value={filters.bedrooms}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, bedrooms: value }))}
                      options={[
                        { label: t.propertiesGallery.allBedrooms, value: "all" },
                        { label: t.propertiesGallery.studio, value: "0" },
                        ...Array.from(new Set(
                          filterOptions.bedrooms
                          .filter((num) => num !== "" && num !== null && num !== undefined)
                            .map((num) => String(num).trim())
                            .filter((label) => label !== "0" && label.toLowerCase() !== "студия")
                        ))
                          .sort((a, b) => Number(a) - Number(b))
                          .map((label) => ({ label, value: label })),
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.districtLabel}</Label>
                    <CustomSelect
                      value={filters.district}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, district: value }))}
                      options={[
                        { label: t.propertiesGallery.allDistricts, value: "all" },
                        ...filterOptions.districts
                          .filter((d) => d !== "" && d !== null && d !== undefined)
                          .map((district) => ({
                            label: translateDistrict(district, language),
                            value: String(district),
                          })),
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.propertiesGallery.typeLabel}</Label>
                    <CustomSelect
                      value={filters.type}
                      onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
                      options={[
                        { label: t.propertiesGallery.allTypes, value: "all" },
                        ...filterOptions.types
                          .filter((t) => t !== "" && t !== null && t !== undefined)
                          .map((type) => ({
                            label: translatePropertyType(type, language),
                            value: String(type),
                          })),
                      ]}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button variant="outline" onClick={resetFilters} className="w-full">
                      <XIcon className="h-4 w-4 mr-2" />
                      {t.propertiesGallery.resetFiltersButton}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Кнопки-фильтры по статусу - отдельная строка */}
        {!isSelectionMode && (
          <div className="flex flex-wrap gap-2 justify-start">
            <Button
              variant={filters.status === "all" ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, status: "all", addedByMe: false }))}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              {t.propertiesGallery.allStatuses || 'Все статусы'}
            </Button>
            <Button
              variant={filters.status === "Проект" ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, status: "Проект", addedByMe: false }))}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              {t.propertiesGallery.statusProject || 'Проект'}
            </Button>
            <Button
              variant={filters.status === "Строится" ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, status: "Строится", addedByMe: false }))}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              {t.propertiesGallery.statusUnderConstruction || 'Строится'}
            </Button>
            <Button
              variant={filters.status === "Готовый" ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, status: "Готовый", addedByMe: false }))}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              {t.propertiesGallery.statusReady || 'Готовый'}
            </Button>
            <Button
              variant={filters.status === "От собственника" ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, status: "От собственника", addedByMe: false }))}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              {t.propertiesGallery.statusFromOwner || 'От собственника'}
            </Button>
            
            {/* Кнопка "Добавлено мной" для авторизованных пользователей с объектами */}
            {hasUserProperties && (
              <Button
                variant={filters.addedByMe ? "default" : "outline"}
                onClick={() => setFilters(prev => ({ ...prev, addedByMe: !prev.addedByMe, status: "all" }))}
                className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                {t.propertiesGallery.addedByMe || 'Добавлено мной'}
              </Button>
            )}
          </div>
        )}
        
        <div className="text-sm text-gray-500 mb-4">
          {isSelectionMode 
            ? t.propertiesGallery.selectionResultsText.replace("{count}", filteredProperties.length)
            : t.propertiesGallery.searchResultsText.replace("{count}", filteredProperties.length)
          }
        </div>
      </div>

      <div className={`divide-y ${isMobile ? "max-w-full" : "max-w-4xl mx-auto"}`}>
        {filteredProperties.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {t.propertiesGallery.emptyStateNoMatches}
          </div>
        ) : (
                    filteredProperties.map((p) => {
            const isOnModeration = p.moderation === true;
            const isCreator = effectiveCurrentUser && p.createdBy === effectiveCurrentUser.uid;
            
            // Если объект на модерации и пользователь не его создатель - не показываем
            if (isOnModeration && !isCreator) {
              return null;
            }
            
            // Определяем, активен ли объект (можно ли перейти на страницу)
            const isActive = !isOnModeration;
            
            const cardContent = (
              <div
                className={`flex items-stretch transition-colors ${
                  isMobile ? "flex-col gap-3 p-3" : "gap-4 p-4"
                } ${
                  isActive 
                    ? "hover:bg-gray-50 cursor-pointer" 
                    : "opacity-60 cursor-not-allowed"
                }`}
              >
                <div
                  className={`relative rounded-md overflow-hidden bg-gray-200 flex-shrink-0 ${
                    isMobile ? "w-full h-40" : "w-48 h-32 min-w-48"
                  }`}
                >
                  {/* Бейдж "Добавлено мной" сверху фотографии */}
                  {isCreator && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="border bg-blue-100 text-blue-800 border-blue-200 text-xs">
                        {t.propertiesGallery?.addedByMe || 'Добавлено мной'}
                      </Badge>
                    </div>
                  )}
                  
                  {p.images?.length ? (
                    <img
                      src={p.images[0]}
                      alt={safeDisplay(p.type) || t.propertiesGallery.propertyAltText}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}
                  {/* Favorite button */}
                  <button
                    className={`absolute top-2 left-2 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition ${
                      isFavorite(p.id) ? 'bg-white/90' : 'bg-white/80 hover:bg-white'
                    }`}
                    aria-label="favorite"
                    onClick={(e) => { e.preventDefault(); toggleFavorite(p.id); }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorite(p.id) ? '#ef4444' : 'none'} stroke="#ef4444" strokeWidth="2" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col text-gray-900 space-y-1">
                  {isPrivileged && (p.complexResolvedName || p.complex) && (
                    <span className={`font-semibold leading-none text-black ${isMobile ? 'text-base' : 'text-lg'}`}>
                      {safeDisplay(p.complexResolvedName || p.complex)}
                    </span>
                  )}

                  {p.isDeveloperApproved === true && (
                    <div className="mb-1">
                      <Badge className="border bg-green-100 text-green-800 border-green-200">
                        {t.propertyDetail.serviceVerified}
                      </Badge>
                    </div>
                  )}

                  {/* Бейдж "На модерации" для объектов на модерации */}
                  {isOnModeration && (
                    <div className="mb-1">
                      <Badge className="border bg-yellow-100 text-yellow-800 border-yellow-200">
                        {t.moderation?.onModeration || 'На модерации'}
                      </Badge>
                    </div>
                  )}



                  {(() => {
                    const ratingRaw = p.reliabilityRating;
                    const rating = Number.isFinite(Number(ratingRaw)) ? Math.max(0, Math.min(5, parseInt(ratingRaw))) : null;
                    if (!rating) return null;
                    return (
                      <div className="flex items-center gap-2" aria-label={`${t.propertyDetail.reliabilityRating}: ${rating}`}>
                        <span className="text-xs text-gray-600">{t.propertyDetail.reliabilityRating}</span>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`${idx < rating ? 'text-yellow-400' : 'text-gray-300'} text-2xl leading-none`}
                          >
                            {idx < rating ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                    );
                  })()}

                  <span className={isMobile ? "text-base" : "text-lg"}>
                    <span className="text-gray-600">{t.propertiesGallery.priceLabel}:</span>
                    <span className="ml-2 font-semibold">{formatPrice(p.price)}</span>
                  </span>

                  

                  {p.type && (
                    <span className="text-sm">
                      <span className="text-gray-600">{t.propertiesGallery.typeLabel}:</span>
                      <span className="ml-2">{translatePropertyType(safeDisplay(p.type), language)}</span>
                    </span>
                  )}
                  {p.area && (
                    <span className="text-sm">
                      <span className="text-gray-600">{t.propertiesGallery.areaLabel}:</span>
                      <span className="ml-2">{safeDisplay(p.area)} {t.propertiesGallery.areaText}</span>
                    </span>
                  )}
                  {p.bedrooms !== undefined && p.bedrooms !== null && p.bedrooms !== "" && (
                    <span className="text-sm">
                      <span className="text-gray-600">{t.propertiesGallery.bedroomsLabel}:</span>
                      <span className="ml-2">
                        {(p.bedrooms === 0 || p.bedrooms === "Студия") ? t.propertiesGallery.studio : safeDisplay(p.bedrooms)}
                      </span>
                    </span>
                  )}
                  {p.unitsCount !== undefined && p.unitsCount !== null && p.unitsCount !== "" && (
                    <span className="text-sm">
                      <span className="text-gray-600">{t.propertiesGallery.unitsCountText}:</span>
                      <span className="ml-2">{safeDisplay(p.unitsCount)}</span>
                    </span>
                  )}
                  {p.status && (
                    <span className="text-sm">
                      <span className="text-gray-600">{t.propertiesGallery.statusLabel}:</span>
                      <span className="ml-2">{translateConstructionStatus(safeDisplay(p.status), language)}</span>
                    </span>
                  )}
                  {p.district && (
                    <span className="text-sm">
                      <span className="text-gray-600">{t.propertiesGallery.districtLabel}:</span>
                      <span className="ml-2">{translateDistrict(safeDisplay(p.district), language)}</span>
                    </span>
                  )}
                </div>
              </div>
            );
            
            // Оборачиваем в Link только если объект активен
            if (isActive) {
              return (
                <Link key={p.id} to={isSharedView && sharedToken ? `/public/shared/${encodeURIComponent(sharedToken)}/property/${p.id}` : `/public/property/${p.id}`}>
                  {cardContent}
                </Link>
              );
            } else {
              return (
                <div key={p.id}>
                  {cardContent}
                </div>
              );
            }
          })
        )}
      </div>
      
      {/* Модальное окно размещения объекта */}
      <PropertyPlacementModal 
        isOpen={isPlacementModalOpen}
        onClose={() => setIsPlacementModalOpen(false)}
      />

      {/* Модальное окно услуг */}
      <Dialog open={isServicesOpen} onOpenChange={setIsServicesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.publicMenu.services}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Button variant="outline" className="justify-start bg-white" onClick={() => { showInfo('Скоро'); }}>
              <Scale className="mr-2 h-4 w-4 text-gray-700" />
              {t.publicMenu.servicesList.legalDueDiligence}
            </Button>
            <Button variant="outline" className="justify-start bg-white" onClick={() => { setIsServicesOpen(false); navigate('/construction-supervision'); }}>
              <Ruler className="mr-2 h-4 w-4 text-gray-700" />
              {t.publicMenu.servicesList.constructionSupervision}
            </Button>
            <Button variant="outline" className="justify-start bg-white" onClick={() => { setIsServicesOpen(false); navigate('/construction-supervision'); }}>
              <ClipboardCheck className="mr-2 h-4 w-4 text-gray-700" />
              {t.publicMenu.servicesList.constructionAcceptance}
            </Button>
            <Button variant="outline" className="justify-start bg-white" onClick={() => { setIsServicesOpen(false); navigate('/construction-supervision'); }}>
              <HardHat className="mr-2 h-4 w-4 text-gray-700" />
              {t.publicMenu.servicesList.constructionManagement}
            </Button>
            <Button variant="outline" className="justify-start bg-white" onClick={() => { showInfo('Скоро'); }}>
              <Compass className="mr-2 h-4 w-4 text-gray-700" />
              {t.publicMenu.servicesList.architecturalDesign}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно подписки */}
      <Dialog open={isSubscriptionOpen} onOpenChange={setIsSubscriptionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.subscriptionModal?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{t.subscriptionModal?.description}</p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {(t.subscriptionModal?.features || []).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <Button className="w-full" onClick={async () => {
              try {
                if (!currentUser) { setIsPlacementModalOpen(true); return; }
                setPaymentUrl('https://premium.it-agent.pro/product-page/it-agent-premium');
                setIsPaymentModalOpen(true);
              } catch (e) {
                console.error('open premium subscription link error', e);
              } finally {
                setIsSubscriptionOpen(false);
              }
            }}>
              {t.subscriptionModal?.subscribeButton}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Модальное окно оплаты (iframe) */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.subscriptionModal?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {paymentUrl ? (
              <iframe title="Premium Payment" src={paymentUrl} className="w-full h-[540px] border rounded" allow="payment *;" />
            ) : (
              <div className="text-sm text-gray-500">Initializing…</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PublicPropertiesGallery;


