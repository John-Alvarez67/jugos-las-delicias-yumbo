"use client";

import { useMemo, useState } from "react";

function bogotaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function monthStamp(date: string) {
  return date.slice(0, 7);
}

function monthLabel(month: string) {
  const [year, number] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" })
    .format(new Date(year, number - 1, 1));
}

function moveMonth(month: string, offset: number) {
  const [year, number] = month.split("-").map(Number);
  const target = new Date(year, number - 1 + offset, 1);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
}

type Props = {
  availableDates: string[];
  selectedDate?: string;
  onSelect: (date: string) => void;
  editable?: boolean;
};

export default function AvailabilityCalendar({ availableDates, selectedDate, onSelect, editable = false }: Props) {
  const today = bogotaToday();
  const firstMonth = selectedDate ? monthStamp(selectedDate) : monthStamp(availableDates.find((date) => date >= today) ?? today);
  const [month, setMonth] = useState(firstMonth);
  const days = useMemo(() => {
    const [year, number] = month.split("-").map(Number);
    const count = new Date(year, number, 0).getDate();
    const leading = new Date(year, number - 1, 1).getDay();
    return [...Array<null>(leading).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [month]);
  const canGoBack = editable || moveMonth(month, -1) >= monthStamp(today);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <div><span className="kicker">Días de atención</span><h3>{monthLabel(month)}</h3></div>
        <div className="calendar-nav">
          <button type="button" aria-label="Mes anterior" disabled={!canGoBack} onClick={() => setMonth(moveMonth(month, -1))}>‹</button>
          <button type="button" aria-label="Mes siguiente" onClick={() => setMonth(moveMonth(month, 1))}>›</button>
        </div>
      </div>
      <div className="calendar-weekdays">{["D", "L", "M", "M", "J", "V", "S"].map((day, index) => <span key={index}>{day}</span>)}</div>
      <div className="calendar-days">
        {days.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} />;
          const date = `${month}-${String(day).padStart(2, "0")}`;
          const open = availableDates.includes(date);
          const past = date < today;
          const disabled = !editable && (!open || past);
          return (
            <button
              key={date}
              type="button"
              className={`${open ? "open" : ""} ${selectedDate === date ? "selected" : ""} ${past ? "past" : ""}`}
              disabled={disabled}
              onClick={() => onSelect(date)}
              aria-label={`${day} de ${monthLabel(month)}, ${open ? "disponible" : "cerrado"}`}
              aria-pressed={editable ? open : selectedDate === date}
            >{day}{open && <i aria-hidden="true" />}</button>
          );
        })}
      </div>
      <p className="calendar-help">{editable ? "Toca cualquier fecha para habilitarla o deshabilitarla." : "Los puntos de color indican los días en que atendemos."}</p>
    </div>
  );
}
