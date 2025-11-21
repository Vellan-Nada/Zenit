import BookCard from './BookCard.jsx';

const StatusColumn = ({ title, statusId, items, onEdit, onDelete, onMove, isPremium }) => {
  return (
    <div className="reading-column">
      <div className="reading-column-header">
        <h3>{title}</h3>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusColumn;
