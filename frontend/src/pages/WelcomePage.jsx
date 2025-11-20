import { useOutletContext } from 'react-router-dom';

const WelcomePage = () => {
  const { features = [] } = useOutletContext() || {};

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <h1 style={{ marginBottom: 0, fontSize: '2rem' }}>Welcome to EverDay</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px' }}>
          EverDay unifies your habits, notes, todos, focus cycles, and inspiration into one calm workspace.
          Use the navigation to explore each tool—your data stays in sync when you sign in.
        </p>
      </header>
      <section
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}
      >
        {features.map((feature) => (
          <div
            key={feature.key}
            style={{
              borderRadius: 'var(--radius)',
              background: 'var(--card-muted)',
              padding: '1.25rem',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '0.35rem', fontSize: '1.1rem' }}>{feature.title}</h3>
            <p style={{ marginBottom: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {feature.description}
            </p>
          </div>
        ))}
      </section>
    </article>
  );
};

export default WelcomePage;
