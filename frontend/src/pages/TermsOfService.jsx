import termsOfService from '../Policies/terms.html?raw';
import styles from '../styles/LegalPage.module.css';

const TermsOfService = () => {
  return (
    <section className={styles.legalPage}>
      <div className={`${styles.legalCard} ${styles.legalCardRightPad}`}>
        <div className={styles.legalText} dangerouslySetInnerHTML={{ __html: termsOfService }} />
      </div>
    </section>
  );
};

export default TermsOfService;
