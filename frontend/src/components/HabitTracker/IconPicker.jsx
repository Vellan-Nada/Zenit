import React from 'react';
import { FREE_ICONS, PREMIUM_ICONS } from './iconConfig.js';

const IconPicker = ({ value, onChange, isPremium }) => {
  const icons = isPremium ? [...FREE_ICONS, ...PREMIUM_ICONS] : FREE_ICONS;

  return (
    <div className="icon-picker">
      {!isPremium && (
        <p className="icon-picker__hint">
          Upgrade to unlock more icons.
        </p>
      )}
      <div className="icon-picker__grid">
        {icons.map((icon) => {
          const isActive = value === icon.key;
          return (
            <button
              key={icon.key}
              type="button"
              className={`icon-picker__item ${isActive ? 'is-active' : ''}`}
              onClick={() => onChange(icon.key)}
              aria-pressed={isActive}
            >
            <span className="icon-picker__symbol">{icon.symbol}</span>
          </button>
          );
        })}
      </div>
    </div>
  );
};

export default IconPicker;
