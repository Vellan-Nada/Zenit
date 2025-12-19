const PremiumUpsell = ({ onUpgrade }) => {
  return (
    <div className="journal-upgrade">
      <p>Get streak insights, total entries, and mood breakdowns with Plus.</p>
      <button type="button" className="journal-btn primary" onClick={onUpgrade}>
        Upgrade to Plus
      </button>
    </div>
  );
};

export default PremiumUpsell;
