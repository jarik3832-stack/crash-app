import { useState, useEffect } from 'react';
import { api } from '../api/http.js';
import { AppHeader } from '../components/AppHeader.jsx';
import { StarIcon, GemIcon } from '../components/icons.jsx';

export function Admin({ user, telegramApi }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [cases, setCases] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tab === 'users') loadUsers();
    if (tab === 'cases') loadCases();
  }, [tab]);

  async function loadUsers() {
    setLoading(true);
    try {
      const r = await api.get('/admin/users');
      setUsers(r.users);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCases() {
    setLoading(true);
    try {
      const r = await api.get('/admin/cases');
      setCases(r.cases);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserBalance(telegram_id, balance, gems) {
    try {
      await api.patch(`/admin/users/${telegram_id}/balance`, { balance, gems });
      setEditingUser(null);
      loadUsers();
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveCase(c) {
    try {
      if (c.id) {
        await api.patch(`/admin/cases/${c.id}`, {
          slug: c.slug,
          name_ru: c.name_ru,
          price_coins: c.price_coins,
          image_emoji: c.image_emoji,
          image_url: c.image_url,
          rarity: c.rarity,
          enabled: c.enabled,
        });
        await api.put(`/admin/cases/${c.id}/items`, { items: c.items });
      } else {
        await api.post('/admin/cases', {
          slug: c.slug,
          name_ru: c.name_ru,
          price_coins: c.price_coins,
          image_emoji: c.image_emoji,
          image_url: c.image_url,
          rarity: c.rarity,
          items: c.items,
        });
      }
      setEditingCase(null);
      loadCases();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteCase(id) {
    if (!confirm('Удалить кейс?')) return;
    try {
      await api.delete(`/admin/cases/${id}`);
      loadCases();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="rocket-page">
      <AppHeader user={user} title="Админка" showToggles={false} telegramApi={telegramApi} />

      <div className="admin-page">
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            Пользователи
          </button>
          <button
            className={`admin-tab ${tab === 'cases' ? 'active' : ''}`}
            onClick={() => setTab('cases')}
          >
            Кейсы
          </button>
        </div>

        {error && <div className="feedback feedback-error">{error}</div>}

        {tab === 'users' && (
          <div className="admin-section">
            {loading ? (
              <div className="admin-loading">Загрузка...</div>
            ) : (
              <div className="admin-users-list">
                {users.map((u) => (
                  <div key={u.telegram_id} className="admin-user-card">
                    <div className="admin-user-info">
                      <div className="admin-user-name">
                        {u.first_name || u.username || `ID ${u.telegram_id}`}
                      </div>
                      <div className="admin-user-stats">
                        <span><StarIcon size={12} /> {u.balance.toLocaleString('ru-RU')}</span>
                        <span><GemIcon size={12} /> {u.gems}</span>
                        <span>Раундов: {u.rounds_played}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingUser(u)}
                    >
                      Изменить
                    </button>
                  </div>
                ))}
              </div>
            )}

            {editingUser && (
              <UserBalanceModal
                user={editingUser}
                onSave={(balance, gems) => updateUserBalance(editingUser.telegram_id, balance, gems)}
                onClose={() => setEditingUser(null)}
              />
            )}
          </div>
        )}

        {tab === 'cases' && (
          <div className="admin-section">
            <button
              className="btn btn-primary"
              style={{ marginBottom: 16 }}
              onClick={() => setEditingCase({
                slug: '',
                name_ru: '',
                price_coins: 1000,
                image_emoji: '🎁',
                image_url: '',
                rarity: 'common',
                enabled: true,
                items: [{ reward_kind: 'coins', amount: 500, weight: 50, label_ru: 'Приз', image_url: '', rarity: 'common' }],
              })}
            >
              + Создать кейс
            </button>

            {loading ? (
              <div className="admin-loading">Загрузка...</div>
            ) : (
              <div className="admin-cases-list">
                {cases.map((c) => (
                  <div key={c.id} className="admin-case-card">
                    <div className="admin-case-emoji">{c.image_emoji}</div>
                    <div className="admin-case-info">
                      <div className="admin-case-name">{c.name_ru}</div>
                      <div className="admin-case-meta">
                        <span><StarIcon size={12} /> {c.price_coins}</span>
                        <span>{c.items?.length || 0} предметов</span>
                        <span className={c.enabled ? 'enabled' : 'disabled'}>
                          {c.enabled ? '✓ Активен' : '✗ Отключён'}
                        </span>
                      </div>
                    </div>
                    <div className="admin-case-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingCase(c)}
                      >
                        Изменить
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteCase(c.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingCase && (
              <CaseEditorModal
                caseData={editingCase}
                onSave={saveCase}
                onClose={() => setEditingCase(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UserBalanceModal({ user, onSave, onClose }) {
  const [balance, setBalance] = useState(user.balance);
  const [gems, setGems] = useState(user.gems);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Изменить баланс</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Монеты <StarIcon size={14} /></label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Алмазы <GemIcon size={14} /></label>
            <input
              type="number"
              value={gems}
              onChange={(e) => setGems(Number(e.target.value))}
              className="form-input"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={() => onSave(balance, gems)}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

function CaseEditorModal({ caseData, onSave, onClose }) {
  const [c, setC] = useState({ ...caseData, items: [...(caseData.items || [])] });
  const [uploading, setUploading] = useState(false);

  function updateField(field, value) {
    setC({ ...c, [field]: value });
  }

  function updateItem(idx, field, value) {
    const items = [...c.items];
    items[idx] = { ...items[idx], [field]: value };
    setC({ ...c, items });
  }

  function addItem() {
    setC({
      ...c,
      items: [...c.items, { reward_kind: 'coins', amount: 100, weight: 10, label_ru: 'Новый приз', image_url: '', rarity: 'common' }],
    });
  }

  function removeItem(idx) {
    setC({ ...c, items: c.items.filter((_, i) => i !== idx) });
  }

  async function uploadImage(file, target, idx = null) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('crash_token')}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (target === 'case') {
        updateField('image_url', data.url);
      } else if (target === 'item' && idx !== null) {
        updateItem(idx, 'image_url', data.url);
      }
    } catch (e) {
      alert('Ошибка загрузки: ' + e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{c.id ? 'Редактировать кейс' : 'Создать кейс'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Slug (уникальный ID)</label>
            <input
              type="text"
              value={c.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Название</label>
            <input
              type="text"
              value={c.name_ru}
              onChange={(e) => updateField('name_ru', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Цена (монеты)</label>
            <input
              type="number"
              value={c.price_coins}
              onChange={(e) => updateField('price_coins', Number(e.target.value))}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Эмодзи</label>
            <input
              type="text"
              value={c.image_emoji}
              onChange={(e) => updateField('image_emoji', e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Изображение PNG</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files[0] && uploadImage(e.target.files[0], 'case')}
              className="form-input"
              disabled={uploading}
            />
            {c.image_url && <img src={c.image_url} alt="preview" style={{ maxWidth: 100, marginTop: 8 }} />}
          </div>
          <div className="form-group">
            <label>Редкость</label>
            <select
              value={c.rarity || 'common'}
              onChange={(e) => updateField('rarity', e.target.value)}
              className="form-input"
            >
              <option value="free">Бесплатный</option>
              <option value="common">Обычный</option>
              <option value="rare">Редкий</option>
              <option value="epic">Эпический</option>
              <option value="limited">Лимитированный</option>
            </select>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={c.enabled}
                onChange={(e) => updateField('enabled', e.target.checked)}
              />
              {' '}Активен
            </label>
          </div>

          <h4 style={{ marginTop: 24, marginBottom: 12 }}>Предметы</h4>
          {c.items.map((it, idx) => (
            <div key={idx} className="case-item-editor">
              <div className="form-row">
                <div className="form-group">
                  <label>Тип</label>
                  <select
                    value={it.reward_kind}
                    onChange={(e) => updateItem(idx, 'reward_kind', e.target.value)}
                    className="form-input"
                  >
                    <option value="coins">Монеты</option>
                    <option value="gems">Алмазы</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Количество</label>
                  <input
                    type="number"
                    value={it.amount}
                    onChange={(e) => updateItem(idx, 'amount', Number(e.target.value))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Вес (шанс)</label>
                  <input
                    type="number"
                    value={it.weight}
                    onChange={(e) => updateItem(idx, 'weight', Number(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  value={it.label_ru}
                  onChange={(e) => updateItem(idx, 'label_ru', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Изображение предмета</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && uploadImage(e.target.files[0], 'item', idx)}
                  className="form-input"
                  disabled={uploading}
                />
                {it.image_url && <img src={it.image_url} alt="preview" style={{ maxWidth: 60, marginTop: 4 }} />}
              </div>
              <div className="form-group">
                <label>Редкость предмета</label>
                <select
                  value={it.rarity || 'common'}
                  onChange={(e) => updateItem(idx, 'rarity', e.target.value)}
                  className="form-input"
                >
                  <option value="common">Обычный</option>
                  <option value="rare">Редкий</option>
                  <option value="epic">Эпический</option>
                  <option value="limited">Лимитированный</option>
                </select>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => removeItem(idx)}>
                Удалить предмет
              </button>
            </div>
          ))}
          <button className="btn btn-secondary" onClick={addItem} style={{ marginTop: 12 }}>
            + Добавить предмет
          </button>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={() => onSave(c)}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}
