import PremiumColorUpsell from '../PremiumColorUpsell.jsx';

const PALETTE = [
  '#FFFFFF',
  '#FDF4FF',
  '#FEF3C7',
  '#E0F2FE',
  '#D1FAE5',
  '#FFE4E6',
  '#DCFCE7',
  '#F1F5F9',
  '#A19B9BFF',
  '#E9D5FF',
  '#E0E7FF',
  '#F5F3FF',
];

const ColorPickerPopover = ({ isPremium, onSelect, onClose, disabledReason, saving }) => {
  if (!isPremium) {
    return (
      <div className="todo-color-popover color-upsell-popover">
        <PremiumColorUpsell
          message={disabledReason || 'Color coding is a premium perk.'}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="todo-color-popover">
      <div className="todo-color-grid">
        {PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            style={{ background: color }}
            onClick={() => onSelect(color)}
            disabled={saving}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPickerPopover;
