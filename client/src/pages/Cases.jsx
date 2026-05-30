import { useEffect, useState } from 'react';
import { api } from '../api/http.js';
import { t } from '../i18n/ru.js';
import { AppHeader } from '../components/AppHeader.jsx';
import { CaseReel } from '../components/CaseReel.jsx';
import { StarIcon } from '../components/icons.jsx';

const RARITY_LABELS = {
  free: 'Бесплатные',
  common: 'Обычные',
  rare: 'Редкие',
  epic: 'Эпические',
  limited: 'Лимитированные',
};

const PRICE_FILTERS = [
  { label: '0-59 ⭐', min: 0, max: 59 },
  { label: '60-199 ⭐', min: 60, max: 199 },
  { label: '200-999 ⭐', min: 200, max: 999 },
  { label: '999+ ⭐', min: 1000, max: Infinity },
];

export function Cases({ user, onBalanceChange, telegramApi }) {
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [stage, setStage] = useState('list');
  const [result, setResult] = useState(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(null);
  const [priceFilter, setPriceFilter] = useState(null);

  useEffect(() => {
    api.cases().then((r) => setCases(r.cases)).catch(() => {});
  }, []);

  function openDetail(c) {
    setSelected(c);
    setStage('detail');
    setResult(null);
    setError(null);
  }

  async function openCase() {
    if (!selected) return;
    setOpening(true);
    setError(null);
    try {
      const r = await api.openCase(selected.slug);
      setResult(r);
      setStage('reel');
      onBalanceChange?.();
    } catch (e) {
      setError(e.message === 'insufficient_balance' ? t.cases.insufficient : e.message);
    } finally {
      setOpening(false);
    }
  }

  function backToList() {
    setSelected(null);
    setStage('list');
    setResult(null);
  }

  const filteredCases = priceFilter
    ? cases.filter((c) => c.price_coins >= priceFilter.min && c.price_coins <= priceFilter.max)
    : cases;

  const groupedByRarity = {};
  for (const c of filteredCases) {
    const r = c.rarity || 'common';
    if (!groupedByRarity[r]) groupedByRarity[r] = [];
    groupedByRarity[r].push(c);
  }

  return (
    <div className="rocket-page">
      <AppHeader user={user} title={t.cases.title} showToggles={false} telegramApi={telegramApi} />

      {stage === 'list' && (
        <div className="cases-page-new">
          <div className="cases-filters">
            <button className="filter-search">🔍</button>
            {PRICE_FILTERS.map((f) => (
              <button
                key={f.label}
                className={`filter-chip ${priceFilter === f ? 'active' : ''}`}
                onClick={() => setPriceFilter(priceFilter === f ? null : f)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="cases-catalog">
            {['limited', 'free', 'epic', 'rare', 'common'].map((rarity) => {
              const group = groupedByRarity[rarity];
              if (!group || group.length === 0) return null;
              return (
                <div key={rarity} className="cases-rarity-section">
                  <div className="cases-section-divider">
                    <span>{RARITY_LABELS[rarity]}</span>
                  </div>
                  <div className="cases-grid">
                    {group.map((c) => (
                      <div key={c.slug} className="case-card-new" onClick={() => openDetail(c)}>
                        {c.rarity === 'limited' && <div className="case-badge-limited">LIMITED</div>}
                        <div className="case-image-wrap">
                          {c.image_url ? (
                            <img src={c.image_url} alt={c.name_ru} className="case-image" />
                          ) : (
                            <div className="case-emoji-fallback">{c.image_emoji}</div>
                          )}
                        </div>
                        <div className="case-name-new">{c.name_ru}</div>
                        <div className="case-price-new">
                          <StarIcon size={16} />
                          {c.price_coins}
                        </div>
                        {c.stock && (
                          <div className="case-stock">Осталось {c.stock}/777</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stage === 'detail' && selected && (
        <CaseDetailNew
          c={selected}
          user={user}
          opening={opening}
          error={error}
          onOpen={openCase}
          onBack={backToList}
        />
      )}

      {stage === 'reel' && selected && result && (
        <div className="case-detail">
          <div className="case-hero">
            <div className="case-emoji-big">{selected.image_emoji}</div>
            <div className="case-name">{selected.name_ru}</div>
          </div>
          <CaseReel
            items={selected.items}
            winningItemId={result.item.id}
            onSettled={() => setStage('result')}
          />
        </div>
      )}

      {stage === 'result' && result && (
        <div className="case-detail">
          <div className="case-hero">
            <div className="case-emoji-big">⭐</div>
            <div className="res-title">{t.cases.won}</div>
            <div className="res-amount">
              <StarIcon size={32} />
              {result.item.amount.toLocaleString('ru-RU')}
            </div>
            <div className="res-label">{result.item.label_ru}</div>
          </div>
          <div className="case-actions">
            <button
              className="btn btn-primary"
              onClick={openCase}
              disabled={opening || (user.balance < selected.price_coins)}
              style={{ marginBottom: 8 }}
            >
              {t.cases.openAgain}
            </button>
            <button className="btn btn-secondary" onClick={backToList}>
              {t.cases.backToList}
            </button>
            {error && <div className="feedback feedback-error">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function CaseDetailNew({ c, user, opening, error, onOpen, onBack }) {
  return (
    <div className="case-detail-new">
      <div className="case-detail-header-new">
        <button className="case-back-btn" onClick={onBack}>← Назад</button>
        <div className="topup-btn-inline" onClick={() => {}}>
          💳 Пополнить баланс
        </div>
      </div>

      <h2 className="case-detail-title-new">Содержимое</h2>

      <div className="case-items-grid">
        {c.items.map((it) => (
          <div key={it.id} className="case-item-card">
            {it.rarity && it.rarity !== 'common' && (
              <div className={`item-badge-${it.rarity}`}>
                {it.rarity === 'limited' ? 'Limited' : it.rarity === 'epic' ? 'Epic' : 'Special'}
              </div>
            )}
            <div className="case-item-image-wrap">
              {it.image_url ? (
                <img src={it.image_url} alt={it.label_ru} className="case-item-image" />
              ) : (
                <div className="case-item-emoji">⭐</div>
              )}
            </div>
            <div className="case-item-price">
              <StarIcon size={14} />
              {it.amount.toLocaleString('ru-RU')}
            </div>
          </div>
        ))}
      </div>

      <div className="case-open-actions">
        <button
          className="btn btn-primary btn-large"
          onClick={onOpen}
          disabled={opening || user.balance < c.price_coins}
        >
          {opening ? 'Открываем...' : `Открыть за ${c.price_coins} ⭐`}
        </button>
        {error && <div className="feedback feedback-error">{error}</div>}
      </div>
    </div>
  );
}
