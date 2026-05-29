import { useEffect, useState } from 'react';
import { api } from '../api/http.js';
import { t } from '../i18n/ru.js';
import { AppHeader } from '../components/AppHeader.jsx';
import { CaseReel } from '../components/CaseReel.jsx';
import { StarIcon, GemIcon } from '../components/icons.jsx';

export function Cases({ user, onBalanceChange, telegramApi }) {
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [stage, setStage] = useState('list');
  const [result, setResult] = useState(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="rocket-page">
      <AppHeader user={user} title={t.cases.title} showToggles={false} telegramApi={telegramApi} />

      {stage === 'list' && (
        <div className="cases-page">
          <div className="cases-list">
            {cases.map((c) => (
              <div key={c.slug} className="case-card">
                <div className="case-emoji">{c.image_emoji}</div>
                <div className="case-meta">
                  <div className="case-name">{c.name_ru}</div>
                  <div className="case-price">
                    <StarIcon size={14} />
                    {c.price_coins.toLocaleString('ru-RU')}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => openDetail(c)}>
                  {t.cases.openFor(c.price_coins)}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {stage === 'detail' && selected && (
        <CaseDetail
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
            <div className="case-emoji-big">
              {result.item.reward_kind === 'coins' ? '⭐' : '💎'}
            </div>
            <div className="res-title">{t.cases.won}</div>
            <div className="res-amount">
              {result.item.reward_kind === 'coins'
                ? <StarIcon size={32} />
                : <GemIcon size={32} />}
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

function CaseDetail({ c, user, opening, error, onOpen, onBack }) {
  const [quantity, setQuantity] = useState(1);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const totalCost = c.price_coins * quantity;
  const canAfford = user.balance >= totalCost;
  const sortedItems = [...c.items].sort((a, b) => b.amount - a.amount);

  return (
    <div className="case-detail-gb">
      <div className="case-detail-header">
        <button className="case-back-btn" onClick={onBack}>← Вернуться</button>
        <div className="case-detail-title">{c.name_ru}</div>
        <div className="case-detail-toggles">
          <label className="case-toggle">
            <span>Демо режим</span>
            <input type="checkbox" disabled />
          </label>
          <label className="case-toggle">
            <span>⚡ Открыть быстро</span>
            <input type="checkbox" disabled />
          </label>
        </div>
      </div>

      <div className="case-carousel-wrap">
        <button
          className="carousel-nav carousel-nav-left"
          onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
          disabled={carouselIndex === 0}
        >‹</button>
        <div className="case-carousel">
          <div
            className="case-carousel-track"
            style={{ transform: `translateX(-${carouselIndex * 160}px)` }}
          >
            {sortedItems.map((it, idx) => (
              <div
                key={it.id}
                className={`case-carousel-item ${idx === carouselIndex ? 'active' : ''}`}
              >
                <div className="carousel-item-image">
                  {it.reward_kind === 'coins' ? '⭐' : '💎'}
                </div>
                <div className="carousel-item-name">{it.label_ru}</div>
                <div className="carousel-item-price">
                  <StarIcon size={12} />
                  {it.amount.toLocaleString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        </div>
        <button
          className="carousel-nav carousel-nav-right"
          onClick={() => setCarouselIndex(Math.min(sortedItems.length - 1, carouselIndex + 1))}
          disabled={carouselIndex >= sortedItems.length - 1}
        >›</button>
      </div>

      <div className="case-quantity-row">
        {[1, 2, 3, 4, 5].map((q) => (
          <button
            key={q}
            className={`quantity-btn ${quantity === q ? 'active' : ''}`}
            onClick={() => setQuantity(q)}
          >
            x{q}
          </button>
        ))}
      </div>

      <div className="case-action-row">
        <button
          className={`case-open-btn ${canAfford ? 'can-afford' : 'cannot-afford'}`}
          onClick={canAfford ? onOpen : undefined}
          disabled={opening}
        >
          {canAfford ? `Открыть за ⭐ ${totalCost}` : `Не хватает ⭐ ${totalCost - user.balance}`}
        </button>
        <button className="case-topup-btn">Пополнить баланс</button>
      </div>

      {error && <div className="feedback feedback-error">{error}</div>}

      <div className="case-contents-section">
        <div className="case-contents-title">📦 Что в кейсе?</div>
        <div className="case-contents-grid">
          {sortedItems.map((it) => (
            <div key={it.id} className="case-content-card">
              <button className="content-card-info">ⓘ</button>
              <div className="content-card-image">
                {it.reward_kind === 'coins' ? '⭐' : '💎'}
              </div>
              <div className="content-card-name">{it.label_ru}</div>
              <div className="content-card-prices">
                <span className="content-price-ton">
                  <StarIcon size={12} />
                  {(it.amount / 1000).toFixed(1)}
                </span>
                <span className="content-price-stars">
                  ⭐ {it.amount.toLocaleString('ru-RU')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="case-best-drops">
        <div className="case-best-drops-title">📦 Лучшие дропы</div>
        <div className="case-best-drops-list">
          {/* Placeholder — будет заполняться с бэкенда */}
        </div>
      </div>
    </div>
  );
}
