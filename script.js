const lapInput = document.getElementById('lapInput');
const inputLabel = document.getElementById('inputLabel');
const addLapButton = document.getElementById('addLapButton');
const clearButton = document.getElementById('clearButton');
const errorMessage = document.getElementById('errorMessage');
const lapList = document.getElementById('lapList');
const lapCount = document.getElementById('lapCount');
const averageLap = document.getElementById('averageLap');
const bestLap = document.getElementById('bestLap');
const longestLap = document.getElementById('longestLap');

const laps = [];

function parseTimeToMs(value, allowNegative = false) {
  const trimmed = value.trim();
  const pattern = allowNegative
    ? /^(-)?(\d{2}):(\d{2})\.(\d{3})$/
    : /^(\d{2}):(\d{2})\.(\d{3})$/;

  const match = trimmed.match(pattern);
  if (!match) return null;

  const sign = allowNegative && match[1] === '-' ? -1 : 1;
  const offset = allowNegative ? 2 : 1;
  const minutes = Number(match[offset]);
  const seconds = Number(match[offset + 1]);
  const milliseconds = Number(match[offset + 2]);

  if (seconds > 59) return null;

  return sign * ((minutes * 60 * 1000) + (seconds * 1000) + milliseconds);
}

function formatMs(milliseconds) {
  const safeMs = Math.max(0, Math.round(milliseconds));
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const ms = safeMs % 1000;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function getBestMs() {
  return Math.min(...laps.map(lap => lap.actualMs));
}

function addLap() {
  const rawValue = lapInput.value.trim();
  const isFirstLap = laps.length === 0;
  const parsedMs = parseTimeToMs(rawValue, !isFirstLap);

  errorMessage.textContent = '';

  if (parsedMs === null) {
    errorMessage.textContent = isFirstLap
      ? 'Use MM:SS.XXX for the first full lap time, for example 01:25.430.'
      : 'Use MM:SS.XXX or -MM:SS.XXX for a delta, for example 00:01.200 or -00:00.350.';
    return;
  }

  let actualMs;
  let sourceType;

  if (isFirstLap) {
    actualMs = parsedMs;
    sourceType = 'Full lap';
  } else {
    const currentBest = getBestMs();
    actualMs = currentBest + parsedMs;
    sourceType = 'Delta from best';
  }

  if (actualMs < 0) {
    errorMessage.textContent = 'Calculated lap time cannot be below 00:00.000.';
    return;
  }

  laps.push({
    actualMs,
    enteredValue: rawValue,
    sourceType
  });

  lapInput.value = '';
  lapInput.placeholder = laps.length === 0 ? '00:00.000' : '±00:00.000';
  updateView();
  lapInput.focus();
}

function updateView() {
  const count = laps.length;
  lapCount.textContent = count;
  inputLabel.textContent = count === 0 ? 'First lap time' : 'Delta from current best lap';
  lapInput.placeholder = count === 0 ? '00:00.000' : '00:00.000 or -00:00.000';

  if (count === 0) {
    averageLap.textContent = '--:--.---';
    bestLap.textContent = '--:--.---';
    longestLap.textContent = '--:--.---';
    lapList.innerHTML = '<div class="empty">Add a full lap time to begin.</div>';
    return;
  }

  const total = laps.reduce((sum, lap) => sum + lap.actualMs, 0);
  const best = Math.min(...laps.map(lap => lap.actualMs));
  const longest = Math.max(...laps.map(lap => lap.actualMs));
  const average = total / count;

  averageLap.textContent = formatMs(average);
  bestLap.textContent = formatMs(best);
  longestLap.textContent = formatMs(longest);

  lapList.innerHTML = laps.map((lap, index) => {
    const isBest = lap.actualMs === best;
    const isLongest = lap.actualMs === longest;
    const classes = ['lap-row', isBest ? 'best' : '', isLongest ? 'longest' : ''].join(' ').trim();
    const badges = [
      isBest ? '<span class="badge best-badge">Best</span>' : '',
      isLongest ? '<span class="badge longest-badge">Longest</span>' : ''
    ].join('');

    return `
      <div class="${classes}">
        <div class="lap-number">#${index + 1}</div>
        <div>
          <div class="lap-time">${formatMs(lap.actualMs)}</div>
          <div class="lap-input">${lap.sourceType}: ${lap.enteredValue}</div>
        </div>
        <div>${badges}</div>
      </div>
    `;
  }).join('');
}

function clearAll() {
  laps.length = 0;
  errorMessage.textContent = '';
  lapInput.value = '';
  updateView();
  lapInput.focus();
}

addLapButton.addEventListener('click', addLap);
clearButton.addEventListener('click', clearAll);

lapInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    addLap();
  }
});

updateView();
