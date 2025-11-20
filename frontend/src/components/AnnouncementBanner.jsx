import styles from '../styles/FeaturePanel.module.css';

const AnnouncementBanner = ({ signedIn }) => {
  return (
    <div className={styles.announcement} role="status">
      {signedIn ? (
        <strong>Welcome back! Your changes will auto-sync to Supabase.</strong>
      ) : (
        <>
          <strong>Working anonymously.</strong> Your data will reset once you leave EverDay. Sign up to
          keep everything in sync securely.
        </>
      )}
    </div>
  );
};

export default AnnouncementBanner;
