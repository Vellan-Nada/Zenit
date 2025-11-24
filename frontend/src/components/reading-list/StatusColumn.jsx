import BookCard from './BookCard.jsx';

const StatusColumn = ({ title, statusId, items, onEdit, onDelete, onMove, onAdd, onChangeColor, isPremium }) => {
  return (
    <div className="reading-column">
      <div className="reading-column-header">
        <button type="button" className="reading-btn primary full" onClick={() => onAdd(statusId)}>
          + {title}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="reading-empty">No books here yet.</p>
      ) : (
        <div className="reading-list">
          {items.map((item) => (
            <BookCard
              key={item.id}
              item={item}
              isPremium={isPremium}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              onChangeColor={onChangeColor}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusColumn;
