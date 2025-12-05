const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const years = Array.from({ length: 7 }, (_, idx) => new Date().getFullYear() - 1 + idx);

import { JournalIcon } from '../FeatureIcons.jsx';

const JournalHeader = ({ month, year, onMonthChange, onYearChange, onReport }) => {
  return (
    <div className="journal-header">
      <div>
        <h1 className="pageTitleWithIcon">
          <JournalIcon className="pageTitleIcon" />
          Journal
        </h1>
      </div>
      <div className="journal-controls">
        <select value={month} onChange={(e) => onMonthChange(Number(e.target.value))}>
          {MONTHS.map((m, idx) => (
            <option key={m} value={idx}>{m}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button type="button" className="journal-btn primary" onClick={onReport}>
          Report
        </button>
      </div>
    </div>
  );
};

export default JournalHeader;
