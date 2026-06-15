import React, { useState, useMemo } from 'react';
import { TABLE_COUNT } from '../config';
import { useOrders } from '../hooks/useOrders';
import './Reservations.css';

// 18:00 → 26:00（翌02:00）を30分刻み、計17スロット
const SLOT_MIN_FROM_18 = []; // 各スロットの「18時を0分とした分」
for (let i = 0; i <= 16; i++) SLOT_MIN_FROM_18.push(i * 30);

const STAY_OPTIONS = [
  { value: 30,  label: '30分' },
  { value: 60,  label: '1時間' },
  { value: 90,  label: '1.5時間' },
  { value: 120, label: '2時間' },
  { value: 150, label: '2.5時間' },
  { value: 180, label: '3時間' },
  { value: 240, label: '4時間' },
];

// 営業日キー（午前6時区切り） "YYYY-M-D"
function getBusinessDayKey(date) {
  const d = new Date(date);
  if (d.getHours() < 6) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// 営業日キー → その日の18:00 を表す Date
function businessDayKeyToDate18(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m, d, 18, 0, 0);
}

// 営業日キーを ±days 移動
function shiftBusinessDay(key, days) {
  const base = businessDayKeyToDate18(key);
  base.setDate(base.getDate() + days);
  return getBusinessDayKey(base);
}

function formatBusinessDay(key) {
  const d = businessDayKeyToDate18(key);
  const w = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${w})`;
}

// 分(18時起算) → "HH:MM" 表示（24時超えは26:00表記のまま）
function slotLabel(minFrom18) {
  const totalH = 18 + Math.floor(minFrom18 / 60);
  const mm = minFrom18 % 60;
  return `${String(totalH).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export default function Reservations() {
  const { reservations, addReservation, updateReservation, deleteReservation } = useOrders();
  const [dayKey, setDayKey] = useState(() => getBusinessDayKey(new Date()));
  const [modal, setModal] = useState(null); // { mode: 'new'|'edit', tableNum, slotMin, reservation? }

  // この営業日の予約だけ抽出（キーは "YYYY-M-D"）
  const dayReservations = useMemo(() => {
    return Object.values(reservations).filter(r => r.dayKey === dayKey);
  }, [reservations, dayKey]);

  // テーブル×スロットの占有マップ：cellMap[tableNum][slotMin] = reservation or null
  const cellMap = useMemo(() => {
    const map = {};
    for (let t = 1; t <= TABLE_COUNT; t++) {
      map[t] = {};
    }
    dayReservations.forEach(r => {
      const start = r.startMin;
      const end = r.startMin + r.stayMin;
      SLOT_MIN_FROM_18.forEach(s => {
        if (s >= start && s < end && map[r.tableNum]) {
          map[r.tableNum][s] = r;
        }
      });
    });
    return map;
  }, [dayReservations]);

  const openNew = (tableNum, slotMin) => {
    setModal({ mode: 'new', tableNum, slotMin });
  };

  const openEdit = (reservation) => {
    setModal({
      mode: 'edit',
      tableNum: reservation.tableNum,
      slotMin: reservation.startMin,
      reservation,
    });
  };

  return (
    <div className="resv-page">
      <div className="resv-day-bar">
        <div className="resv-day-btn" onClick={() => setDayKey(shiftBusinessDay(dayKey, -1))}>‹</div>
        <div className="resv-day-label">{formatBusinessDay(dayKey)}</div>
        <div className="resv-day-btn" onClick={() => setDayKey(shiftBusinessDay(dayKey, 1))}>›</div>
        <div
          className="resv-day-today"
          onClick={() => setDayKey(getBusinessDayKey(new Date()))}
        >
          今日
        </div>
      </div>

      <div className="resv-grid-wrap">
        <div className="resv-grid" style={{ gridTemplateColumns: `56px repeat(${TABLE_COUNT}, 1fr)` }}>
          <div className="resv-corner">時間</div>
          {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map(tableNum => (
            <div key={tableNum} className="resv-table-head">{tableNum}</div>
          ))}

          {SLOT_MIN_FROM_18.map(s => (
            <React.Fragment key={s}>
              <div className="resv-time-head">{slotLabel(s)}</div>
              {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map(tableNum => {
                const r = cellMap[tableNum][s];
                if (r) {
                  const isStart = r.startMin === s;
                  return (
                    <div
                      key={tableNum}
                      className={`resv-cell filled ${isStart ? 'start' : ''}`}
                      onClick={() => openEdit(r)}
                    >
                      {isStart && (
                        <div className="resv-cell-content">
                          <div className="resv-cell-name">{r.name || '予約'}</div>
                          <div className="resv-cell-sub">{r.pax}名</div>
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div
                    key={tableNum}
                    className="resv-cell empty"
                    onClick={() => openNew(tableNum, s)}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {modal && (
        <ReservationModal
          dayKey={dayKey}
          modal={modal}
          onClose={() => setModal(null)}
          onAdd={addReservation}
          onUpdate={updateReservation}
          onDelete={deleteReservation}
        />
      )}
    </div>
  );
}

function ReservationModal({ dayKey, modal, onClose, onAdd, onUpdate, onDelete }) {
  const r = modal.reservation;
  const [name, setName] = useState(r?.name || '');
  const [pax, setPax] = useState(r?.pax || 2);
  const [tableNum, setTableNum] = useState(r?.tableNum ?? modal.tableNum);
  const [startMin, setStartMin] = useState(r?.startMin ?? modal.slotMin);
  const [stayMin, setStayMin] = useState(r?.stayMin || 120);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const data = {
        dayKey,
        tableNum: Number(tableNum),
        startMin: Number(startMin),
        stayMin: Number(stayMin),
        pax: Number(pax) || 1,
        name: name.trim(),
      };
      if (modal.mode === 'edit') {
        await onUpdate(r.id, data);
      } else {
        await onAdd(data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!window.confirm('この予約を削除しますか？')) return;
    setSaving(true);
    try {
      await onDelete(r.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="resv-modal-backdrop" onClick={onClose}>
      <div className="resv-modal" onClick={e => e.stopPropagation()}>
        <div className="resv-modal-title">
          {modal.mode === 'edit' ? '予約を編集' : '予約を追加'}
        </div>

        <label className="resv-field">
          <span>お客様名</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="お名前"
          />
        </label>

        <label className="resv-field">
          <span>人数</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={pax}
            onChange={e => setPax(e.target.value)}
            onFocus={e => e.target.select()}
          />
        </label>

        <label className="resv-field">
          <span>テーブル</span>
          <select value={tableNum} onChange={e => setTableNum(e.target.value)}>
            {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map(t => (
              <option key={t} value={t}>テーブル {t}</option>
            ))}
          </select>
        </label>

        <label className="resv-field">
          <span>開始時間</span>
          <select value={startMin} onChange={e => setStartMin(e.target.value)}>
            {SLOT_MIN_FROM_18.map(s => (
              <option key={s} value={s}>{slotLabel(s)}</option>
            ))}
          </select>
        </label>

        <label className="resv-field">
          <span>滞在時間</span>
          <select value={stayMin} onChange={e => setStayMin(e.target.value)}>
            {STAY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <div className="resv-modal-actions">
          {modal.mode === 'edit' && (
            <div className="btn-resv-delete" onClick={del}>削除</div>
          )}
          <div className="btn-resv-cancel" onClick={onClose}>キャンセル</div>
          <div className="btn-resv-save" onClick={save}>
            {saving ? '保存中...' : '保存'}
          </div>
        </div>
      </div>
    </div>
  );
}
