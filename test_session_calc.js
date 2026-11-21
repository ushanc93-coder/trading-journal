function toSec(h, m) { return h * 3600 + m * 60; }
function fmt(s) {
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function getSessionState(totalSec) {
  let activeName = "Off-Hours";
  let isLive = false;
  let isSilverBullet = false;
  let bulletName = "";
  let activeEndsIn = 0;
  let activeTime = "";

  let nextName = "London Open";
  let nextStartsIn = 0;
  let nextTime = "";

  if (totalSec >= toSec(0, 0) && totalSec < toSec(2, 0)) {
    activeName = "Off-Hours";
    activeEndsIn = toSec(2, 0) - totalSec;
    activeTime = "Market Quiet";
    nextName = "London Open";
    nextStartsIn = toSec(2, 0) - totalSec;
    nextTime = "02:00 - 05:00 NY";
  } else if (totalSec >= toSec(2, 0) && totalSec < toSec(5, 0)) {
    activeName = "London Open";
    isLive = true;
    activeEndsIn = toSec(5, 0) - totalSec;
    activeTime = "02:00 - 05:00 NY";
    if (totalSec >= toSec(3, 0) && totalSec < toSec(4, 0)) {
      isSilverBullet = true;
      bulletName = "London Silver Bullet";
    }
    nextName = "New York AM";
    nextStartsIn = toSec(7, 0) - totalSec;
    nextTime = "07:00 - 12:00 NY";
  } else if (totalSec >= toSec(5, 0) && totalSec < toSec(7, 0)) {
    activeName = "Off-Hours (Pre-NY)";
    activeEndsIn = toSec(7, 0) - totalSec;
    activeTime = "Gap Time";
    nextName = "New York AM";
    nextStartsIn = toSec(7, 0) - totalSec;
    nextTime = "07:00 - 12:00 NY";
  } else if (totalSec >= toSec(7, 0) && totalSec < toSec(12, 0)) {
    activeName = "New York AM";
    isLive = true;
    activeEndsIn = toSec(12, 0) - totalSec;
    activeTime = "07:00 - 12:00 NY";
    if (totalSec >= toSec(10, 0) && totalSec < toSec(11, 0)) {
      isSilverBullet = true;
      bulletName = "NY AM Silver Bullet";
    }
    nextName = "New York PM";
    nextStartsIn = toSec(13, 0) - totalSec;
    nextTime = "13:00 - 16:00 NY";
  } else if (totalSec >= toSec(12, 0) && totalSec < toSec(13, 0)) {
    activeName = "Off-Hours (Lunch)";
    activeEndsIn = toSec(13, 0) - totalSec;
    activeTime = "12:00 - 13:00 NY";
    nextName = "New York PM";
    nextStartsIn = toSec(13, 0) - totalSec;
    nextTime = "13:00 - 16:00 NY";
  } else if (totalSec >= toSec(13, 0) && totalSec < toSec(16, 0)) {
    activeName = "New York PM";
    isLive = true;
    activeEndsIn = toSec(16, 0) - totalSec;
    activeTime = "13:00 - 16:00 NY";
    if (totalSec >= toSec(14, 0) && totalSec < toSec(15, 0)) {
      isSilverBullet = true;
      bulletName = "NY PM Silver Bullet";
    }
    nextName = "Asian Session";
    nextStartsIn = toSec(20, 0) - totalSec;
    nextTime = "20:00 - 24:00 NY";
  } else if (totalSec >= toSec(16, 0) && totalSec < toSec(20, 0)) {
    activeName = "Off-Hours (Post-NY)";
    activeEndsIn = toSec(20, 0) - totalSec;
    activeTime = "Daily Settlement";
    nextName = "Asian Session";
    nextStartsIn = toSec(20, 0) - totalSec;
    nextTime = "20:00 - 24:00 NY";
  } else {
    // 20:00 to 24:00
    activeName = "Asian Session";
    isLive = true;
    activeEndsIn = toSec(24, 0) - totalSec;
    activeTime = "20:00 - 24:00 NY";
    if (totalSec >= toSec(20, 0) && totalSec < toSec(21, 0)) {
      isSilverBullet = true;
      bulletName = "Asian Silver Bullet";
    }
    nextName = "London Open";
    nextStartsIn = (toSec(24, 0) - totalSec) + toSec(2, 0);
    nextTime = "02:00 - 05:00 NY";
  }

  return {
    activeName,
    isLive,
    isSilverBullet,
    bulletName,
    activeCountdown: fmt(activeEndsIn),
    activeTime,
    nextName,
    nextCountdown: fmt(nextStartsIn),
    nextTime
  };
}

// Test sample hours: 01:30, 02:45, 06:15, 08:30, 10:15, 12:30, 14:15, 18:00, 21:00
const testHours = [1.5, 2.75, 6.25, 8.5, 10.25, 12.5, 14.25, 18.0, 21.0];
testHours.forEach(h => {
  const sec = Math.floor(h * 3600);
  console.log(`[${h}h] Active:`, getSessionState(sec).activeName, "Ends in:", getSessionState(sec).activeCountdown, "| Next:", getSessionState(sec).nextName, "Starts in:", getSessionState(sec).nextCountdown);
});
