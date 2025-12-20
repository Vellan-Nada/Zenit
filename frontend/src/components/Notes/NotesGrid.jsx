import NoteCard from './NoteCard.jsx';

const NotesGrid = ({
  notes,
  onOpenDetail,
}) => {
  if (!notes.length) {
    return (
      <div className="notes-empty">
        <p>You don’t have any notes yet. Start by jotting something above.</p>
      </div>
    );
  }

  return (
    <div className="notes-grid">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
};

export default NotesGrid;
