import privacyPolicy from '../Policies/privacy policy.html?raw';
import styles from '../styles/LegalPage.module.css';

const PrivacyPolicy = () => {
  return (
    <section className={styles.legalPage}>
      <div className={styles.legalCard}>
        <div className={styles.legalText} dangerouslySetInnerHTML={{ __html: privacyPolicy }} />
      </div>
    </section>
  );
};

export default PrivacyPolicy;
