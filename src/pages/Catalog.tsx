import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Model } from '../types';
import { useReferral } from '../hooks/useReferral';
import BottomSheet from '../components/BottomSheet';

// Списки городов по странам (для замены Unknown)
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  UA: ['Киев', 'Харьков', 'Одесса', 'Днепр', 'Запорожье', 'Львов', 'Кривой Рог', 'Николаев', 'Мариуполь', 'Винница', 'Херсон', 'Полтава', 'Чернигов', 'Черновцы', 'Сумы', 'Житомир', 'Хмельницкий', 'Ровно', 'Ивано-Франковск', 'Тернополь', 'Кременчуг', 'Луцк', 'Белая Церковь', 'Краматорск', 'Ужгород'],
  RU: ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Красноярск', 'Челябинск', 'Самара', 'Уфа', 'Ростов-на-Дону', 'Краснодар', 'Омск', 'Воронеж', 'Пермь', 'Сочи', 'Тюмень', 'Волгоград', 'Саратов', 'Томск'],
  KZ: ['Алматы', 'Астана', 'Шымкент', 'Актобе', 'Караганда', 'Тараз', 'Усть-Каменогорск', 'Павлодар', 'Атырау', 'Семей', 'Кызылорда', 'Уральск', 'Костанай', 'Петропавловск', 'Темиртау'],
  BY: ['Минск', 'Гомель', 'Могилёв', 'Витебск', 'Гродно', 'Брест', 'Бобруйск', 'Барановичи', 'Борисов', 'Пинск', 'Орша', 'Мозырь', 'Солигорск'],
  PL: ['Варшава', 'Краков', 'Лодзь', 'Вроцлав', 'Познань', 'Гданьск', 'Щецин', 'Быдгощ', 'Люблин', 'Белосток', 'Катовице', 'Гдыня', 'Торунь'],
  DE: ['Берлин', 'Гамбург', 'Мюнхен', 'Кёльн', 'Франкфурт', 'Штутгарт', 'Дюссельдорф', 'Дортмунд', 'Эссен', 'Лейпциг', 'Бремен', 'Дрезден', 'Ганновер', 'Нюрнберг'],
  CZ: ['Прага', 'Брно', 'Острава', 'Пльзень', 'Либерец', 'Оломоуц', 'Ческе-Будеёвице', 'Градец-Кралове', 'Пардубице', 'Злин'],
  AE: ['Дубай', 'Абу-Даби', 'Шарджа', 'Аджман', 'Рас-эль-Хайма', 'Фуджейра', 'Аль-Айн', 'Дейра'],
  TR: ['Стамбул', 'Анкара', 'Измир', 'Бурса', 'Адана', 'Анталья', 'Конья', 'Газиантеп', 'Мерсин', 'Кайсери', 'Трабзон', 'Бодрум', 'Мармарис', 'Аланья'],
};

const ITEMS_PER_PAGE = 10;

/** Получить/сохранить рандомный город для конкретной модели в localStorage */
function getOrAssignCity(modelId: number, country: string, currentCity: string | null | undefined): string {
  if (currentCity && currentCity.toLowerCase() !== 'unknown' && currentCity.trim() !== '') {
    return currentCity;
  }

  const cacheKey = `model_city_${modelId}_${country}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  const cities = CITIES_BY_COUNTRY[country.toUpperCase()] || CITIES_BY_COUNTRY['UA'];
  // Стабильный псевдо-рандом по id модели
  const idx = modelId % cities.length;
  const city = cities[idx];
  localStorage.setItem(cacheKey, city);
  return city;
}

export default function Catalog() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [sortPrice, setSortPrice] = useState<'asc' | 'desc' | ''>('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { country } = useReferral();
  const targetCountry = (country || 'UA').toUpperCase();

  useEffect(() => {
    fetchModels();
  }, [country]);

  // Сброс страницы при смене фильтров
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCity, sortPrice]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_localized_models', { p_country: targetCountry });
      if (error) throw error;
      setModels(data as Model[] || []);
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  // Применяем замену Unknown и кешируем в localStorage
  const processedModels = useMemo(() => {
    return models.map(m => ({
      ...m,
      city: getOrAssignCity(m.id, targetCountry, m.city || m.display_city),
    }));
  }, [models, targetCountry]);

  // Уникальные города для фильтра
  const cities = useMemo(() =>
    Array.from(new Set(processedModels.map(m => m.city).filter(Boolean))).sort(),
    [processedModels]
  );

  // Фильтрация + сортировка
  const filteredModels = useMemo(() => {
    return processedModels
      .filter(m => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q ||
          m.name.toLowerCase().includes(q) ||
          (m.code || '').toLowerCase().includes(q) ||
          (m.city || '').toLowerCase().includes(q);
        const matchCity = !selectedCity || m.city === selectedCity;
        return matchSearch && matchCity;
      })
      .sort((a, b) => {
        if (sortPrice === 'asc') return a.price_per_hour - b.price_per_hour;
        if (sortPrice === 'desc') return b.price_per_hour - a.price_per_hour;
        return 0;
      });
  }, [processedModels, searchQuery, selectedCity, sortPrice]);

  // Пагинация
  const totalPages = Math.max(1, Math.ceil(filteredModels.length / ITEMS_PER_PAGE));
  const paginatedModels = filteredModels.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="profile-title" style={{ margin: 0, fontSize: '2.5rem' }}>Каталог</h1>
          <button
            className="btn-outline"
            onClick={() => setIsFiltersOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '20px' }}
          >
            <Filter size={16} /> Фильтры
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%', marginBottom: '0.5rem' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
          <input
            type="text"
            className="input"
            placeholder="Поиск по коду, имени или городу..."
            style={{ paddingLeft: '2.5rem', width: '100%', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <BottomSheet isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} title="Фильтры">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Город</label>
            <div style={{ position: 'relative' }}>
              <select
                className="input"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{ width: '100%', paddingRight: '2.5rem', cursor: 'pointer', appearance: 'none', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}
              >
                <option value="">Все города</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Filter size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Сортировка по цене</label>
            <div style={{ position: 'relative' }}>
              <select
                className="input"
                value={sortPrice}
                onChange={(e) => setSortPrice(e.target.value as 'asc' | 'desc' | '')}
                style={{ width: '100%', paddingRight: '2.5rem', cursor: 'pointer', appearance: 'none', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}
              >
                <option value="">По умолчанию</option>
                <option value="asc">Сначала дешевле</option>
                <option value="desc">Сначала дороже</option>
              </select>
              <ArrowUpDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <button className="btn" onClick={() => setIsFiltersOpen(false)} style={{ width: '100%', marginTop: '1rem' }}>
            Показать результаты
          </button>
        </div>
      </BottomSheet>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>Загрузка...</div>
      ) : filteredModels.length > 0 ? (
        <>
          {/* Счётчик результатов */}
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Показано {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredModels.length)} из {filteredModels.length} анкет
          </div>

          <div className="models-grid">
            {paginatedModels.map((model) => (
              <Link to={`/model/${model.code}`} key={model.id} className="model-card">
                <img
                  src={model.photo_urls?.[0] || 'https://placehold.co/300x400/1a1a1a/555555?text=Photo'}
                  alt={model.name}
                  className="model-card-image"
                  loading="lazy"
                />
                <div className="model-card-overlay"></div>
                <div className="model-card-info">
                  <div className="model-card-header">
                    <span className="model-name">{model.name}, {model.age}</span>
                    <span className="model-price">{model.price_per_hour} $/ч</span>
                  </div>
                  <div className="model-location">
                    {model.city} • Код: {model.code}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginTop: '2rem',
              paddingBottom: '2rem'
            }}>
              <button
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                disabled={page === 1}
                className="btn-outline"
                style={{
                  width: '42px', height: '42px', borderRadius: '50%', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: page === 1 ? 0.4 : 1
                }}
              >
                <ChevronLeft size={18} />
              </button>

              {/* Номера страниц */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | '...')[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === '...' ? (
                    <span key={`dots-${i}`} style={{ color: 'var(--text-secondary)', padding: '0 4px' }}>...</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => { setPage(item as number); window.scrollTo(0, 0); }}
                      className={page === item ? 'btn' : 'btn-outline'}
                      style={{
                        width: '42px', height: '42px', borderRadius: '50%', padding: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.875rem', fontWeight: page === item ? 700 : 400
                      }}
                    >
                      {item}
                    </button>
                  )
                )
              }

              <button
                onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                disabled={page === totalPages}
                className="btn-outline"
                style={{
                  width: '42px', height: '42px', borderRadius: '50%', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: page === totalPages ? 0.4 : 1
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          Модели не найдены.
        </div>
      )}
    </div>
  );
}
