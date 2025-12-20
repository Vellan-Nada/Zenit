const NoteCard = ({ note, onOpenDetail }) => {
  return (
    <article
      className="note-card"
      style={{ background: note.color || 'var(--card-bg)' }}
      onClick={() => onOpenDetail?.(note)}
      role="button"
      tabIndex={0}
    >
      <div className="note-card-body">
        <div className="note-card-preview">
          <h3>{note.title || 'Untitled'}</h3>
          <p>{note.content || 'No content yet.'}</p>
        </div>
      </div>
    </article>
  );
};

export default NoteCard;
