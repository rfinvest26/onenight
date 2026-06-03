import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Shield, Clock, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Model } from '../types';
import { useReferral } from '../hooks/useReferral';
import BottomSheet from '../components/BottomSheet';
import SupportChat from '../components/SupportChat';

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

function getOrAssignCity(modelId: number, country: string, currentCity: string | null | undefined): string {
  if (currentCity && currentCity.toLowerCase() !== 'unknown' && currentCity.trim() !== '') {
    return currentCity;
  }
  const cacheKey = `model_city_${modelId}_${country}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;
  const cities = CITIES_BY_COUNTRY[country.toUpperCase()] || CITIES_BY_COUNTRY['UA'];
  const city = cities[modelId % cities.length];
  localStorage.setItem(cacheKey, city);
  return city;
}

export default function ModelProfile() {
  const { code } = useParams();
  const { refId, country } = useReferral();
  const targetCountry = (country || 'UA').toUpperCase();
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderState, setOrderState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [createdThreadId, setCreatedThreadId] = useState<number | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  // Calculator state
  const [tgUsername, setTgUsername] = useState(() => localStorage.getItem('site_user_tg') || '');
  const [hours, setHours] = useState(1);
  const [meetingType, setMeetingType] = useState<'incall' | 'outcall'>('incall');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    if (code) fetchModel();
  }, [code, country]);

  const fetchModel = async () => {
    setLoading(true);
    try {
      const { data: directData, error: directError } = await supabase
        .from('escort_models')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (directError) throw directError;

      if (directData) {
        setModel(directData as Model);
        return;
      }

      const { data, error } = await supabase
        .rpc('get_localized_models', { p_country: targetCountry });

      if (error) throw error;

      const found = (data as Model[])?.find(m => m.code === code);
      if (found) {
        setModel(found);
      } else {
        setModel(null);
      }
    } catch (error) {
      console.error('Error fetching model:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tgUsername.trim()) return;

    setOrderState('loading');
    try {
      const basePrice = (model?.price_per_hour || 0) * hours;
      const extraServicesPrice = selectedServices.length * 50;
      const meetingPrice = meetingType === 'outcall' ? 50 : 0;
      const totalPrice = basePrice + extraServicesPrice + meetingPrice;
      const finalWorkerId = refId ? parseInt(refId) : model?.user_id;
      const formattedUsername = tgUsername.startsWith('@') ? tgUsername : `@${tgUsername}`;

      localStorage.setItem('site_user_tg', tgUsername);

      // Create support thread
      const { data: threadData, error: threadError } = await supabase
        .from('escort_support_threads')
        .insert({
          user_tg_username: formattedUsername,
          worker_id: finalWorkerId,
          topic: `Заказ: ${model?.name} (${hours}ч, ${meetingType === 'incall' ? 'у неё' : 'выезд'})`,
          status: 'open',
        })
        .select()
        .single();

      if (threadError) throw threadError;
      setCreatedThreadId(threadData.id);

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('escort_orders')
        .insert({
          model_id: model?.id,
          worker_id: finalWorkerId,
          hours,
          total_price: totalPrice,
          meeting_type: meetingType,
          extra_services: selectedServices,
          client_name: formattedUsername,
          status: 'pending',
          support_thread_id: threadData.id,
          model_name: model?.name || '',
        })
        .select()
        .single();

      if (orderError) throw orderError;
      setCreatedOrderId(orderData.id);
      setOrderState('success');
    } catch (err) {
      console.error('Order error:', err);
      setOrderState('error');
    }
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const totalPrice = ((model?.price_per_hour || 0) * hours)
    + selectedServices.length * 50
    + (meetingType === 'outcall' ? 50 : 0);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-secondary)' }}>
        Загрузка...
      </div>
    );
  }

  if (!model) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-secondary)' }}>
        Модель не найдена.
      </div>
    );
  }

  const photos = model.photo_urls?.length ? model.photo_urls : ['https://placehold.co/600x800/1a1a1a/555555?text=No+Photo'];

  return (
    <div className="profile-container">
      {/* Photo Gallery */}
      <div className="profile-gallery" style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', marginBottom: '1.5rem', marginInline: 'auto', aspectRatio: '3/4', maxHeight: '80vh', width: '100%', display: 'block' }}>
        <img
          src={photos[activeImage]}
          alt={model.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />

        {/* Photo nav */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setActiveImage(i => (i - 1 + photos.length) % photos.length)}
              style={{
                position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', cursor: 'pointer'
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setActiveImage(i => (i + 1) % photos.length)}
              style={{
                position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', cursor: 'pointer'
              }}
            >
              <ChevronRight size={20} />
            </button>

            {/* Dots */}
            <div style={{
              position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '6px'
            }}>
              {photos.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImage(i)}
                  style={{
                    width: i === activeImage ? '20px' : '8px', height: '8px',
                    borderRadius: '4px', backgroundColor: i === activeImage ? '#fff' : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.3s', cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            display: 'none'
          }} />
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {photos.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`${model.name} ${i + 1}`}
              onClick={() => setActiveImage(i)}
              style={{
                width: '64px', height: '64px', objectFit: 'cover',
                borderRadius: '10px', flexShrink: 0, cursor: 'pointer',
                border: i === activeImage ? '2px solid var(--accent-color)' : '2px solid transparent',
                transition: 'border-color 0.2s'
              }}
            />
          ))}
        </div>
      )}

      {/* Info */}
      <div className="profile-info">
        <div>
          <h1 className="profile-title">{model.name}, {model.age}</h1>
          <div className="profile-meta" style={{ marginTop: '1rem' }}>
            <div className="profile-meta-item">
                <MapPin size={18} /> {model ? getOrAssignCity(model.id, targetCountry, model.city || model.display_city) : '—'}
            </div>
            <div className="profile-meta-item">
              <Shield size={18} /> Код: {model.code}
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '2rem', fontWeight: '600' }}>{model.price_per_hour} $ <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '400' }}>/ час</span></div>
          <button className="btn" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} onClick={() => setIsModalOpen(true)}>
            Заказать встречу
          </button>
        </div>
      </div>

      {/* Description */}
      {model.description && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>О себе</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>{model.description}</p>
        </div>
      )}

      {/* Services */}
      {model.services && model.services.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Услуги</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {model.services.map((s, i) => (
              <span key={i} className="service-tag">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Order Modal */}
      <BottomSheet isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setOrderState('idle'); }} title="Заказать встречу">
        {orderState === 'success' && createdThreadId ? (
          <div style={{ padding: '1rem 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
              <h3 style={{ color: 'var(--text-primary)' }}>Заказ #{createdOrderId} создан!</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Оператор свяжется с вами в ближайшее время.</p>
            </div>
            <SupportChat threadId={createdThreadId} />
          </div>
        ) : (
          <form onSubmit={handleOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Ваш Telegram</label>
              <input
                type="text"
                className="input"
                placeholder="@username"
                value={tgUsername}
                onChange={e => setTgUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Количество часов</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button type="button" className="btn-outline" style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
                  onClick={() => setHours(h => Math.max(1, h - 1))}>−</button>
                <span style={{ fontSize: '1.25rem', fontWeight: '600', minWidth: '2rem', textAlign: 'center' }}>{hours}</span>
                <button type="button" className="btn-outline" style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}
                  onClick={() => setHours(h => h + 1)}>+</button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Тип встречи</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {(['incall', 'outcall'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMeetingType(type)}
                    className={meetingType === type ? 'btn' : 'btn-outline'}
                    style={{ flex: 1, padding: '0.75rem' }}
                  >
                    {type === 'incall' ? '🏠 У неё' : '🚗 Выезд (+$50)'}
                  </button>
                ))}
              </div>
            </div>

            {model.services && model.services.length > 0 && (
              <div className="form-group">
                <label className="form-label">Дополнительные услуги (+$50 каждая)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {model.services.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleService(s)}
                      className={selectedServices.includes(s) ? 'btn' : 'btn-outline'}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', borderRadius: '20px' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="card" style={{ background: 'var(--card-glass)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Clock size={16} /> Итого
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-color)' }}>${totalPrice}</div>
              </div>
            </div>

            <button
              type="submit"
              className="btn"
              style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}
              disabled={orderState === 'loading' || !tgUsername.trim()}
            >
              {orderState === 'loading' ? 'Оформляем...' : `Заказать за $${totalPrice}`}
            </button>

            {orderState === 'error' && (
              <p style={{ color: 'var(--accent-color)', textAlign: 'center', fontSize: '0.875rem' }}>
                Ошибка при создании заказа. Попробуйте снова.
              </p>
            )}
          </form>
        )}
      </BottomSheet>
    </div>
  );
}
