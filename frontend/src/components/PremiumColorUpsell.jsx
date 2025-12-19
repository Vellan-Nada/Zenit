import UpgradeToPremium from './Notes/UpgradeToPremium.jsx';
import styles from '../styles/PremiumColorUpsell.module.css';
import '../styles/ColorUpsellPopover.css';

const PremiumColorUpsell = ({
  message = 'Card colors are a premium feature.',
  ctaLabel = 'Upgrade',
  onClose = () => {},
  className = '',
}) => {
  return (
    <div className={[styles.card, className].filter(Boolean).join(' ')}>
      <p className={[styles.message, 'premium-upsell-message'].join(' ')}>{message}</p>
      <UpgradeToPremium cta={ctaLabel} variant="compact" className={styles.primary} />
      <button type="button" className={styles.secondary} onClick={onClose}>
        Close
      </button>
    </div>
  );
};

export default PremiumColorUpsell;
