let formSleepHours = 7.5;
let formSleepQuality = 3;
let formEnergy = 3;

function showGreeting() {
  const hour = new Date().getHours();
  let greeting;

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  document.getElementById("greeting").innerText = greeting;

  const today = textToDate(getToday());
  document.getElementById("todays-date").innerText = dayNamesLong[today.getDay()] + ", " + shortDate(getToday());
}

function showScore() {
  const today = getToday();
  const checkin = getCheckin(today);
  const score = getDayScore();
  const scoreWord = getScoreWord(score);

  if (checkin === null) {
    document.getElementById("score-number").innerText = "-";
    document.getElementById("score-bar").style.width = "0%";
  } else {
    document.getElementById("score-number").innerText = score + " / 100";
    document.getElementById("score-bar").style.width = score + "%";
  }
  document.getElementById("score-bar").style.backgroundColor = scoreWord.colour;

  const todaysRoutines = getRoutinesForDate(today);
  let smallVersionCount = 0;
  for (let i = 0; i < todaysRoutines.length; i++) {
    if (getSuggestedMode(todaysRoutines[i].id) === "micro") {
      smallVersionCount = smallVersionCount + 1;
    }
  }

  let scoreText;
  if (checkin === null) {
    scoreText = "You have not done today's check-in yet, so an average day is being assumed.";
  } else if (smallVersionCount > 0) {
    scoreText = scoreWord.word + ". " + smallVersionCount + " of today's " +
                todaysRoutines.length + " routines were dropped to the small version.";
  } else {
    scoreText = scoreWord.word + ". The full versions should be fine today.";
  }
  document.getElementById("score-text").innerText = scoreText;

  const details = document.getElementById("score-details");
  if (checkin === null) {
    details.innerHTML =
      "<div class='detail-line'><span>Sleep</span><b>not filled in</b></div>" +
      "<div class='detail-line'><span>Sleep quality</span><b>not filled in</b></div>" +
      "<div class='detail-line'><span>Energy</span><b>not filled in</b></div>";
  } else {
    details.innerHTML =
      "<div class='detail-line'><span>Sleep</span><b>" + checkin.sleepHours + " hours</b></div>" +
      "<div class='detail-line'><span>Sleep quality</span><b>" + sleepWords[checkin.sleepQuality - 1] + "</b></div>" +
      "<div class='detail-line'><span>Energy</span><b>" + energyWords[checkin.energy - 1] + "</b></div>";
  }
}

function showStatBoxes() {
  const today = getToday();
  const todaysRoutines = getRoutinesForDate(today);

  let doneCount = 0;
  for (let i = 0; i < todaysRoutines.length; i++) {
    if (isDone(todaysRoutines[i].id, today)) {
      doneCount = doneCount + 1;
    }
  }
  document.getElementById("stat-today").innerText = doneCount + " / " + todaysRoutines.length;

  const longest = getLongestStreak();
  document.getElementById("stat-streak").innerText = longest.days;
  if (longest.routine !== null) {
    document.getElementById("stat-streak-name").innerText = longest.routine.name;
  } else {
    document.getElementById("stat-streak-name").innerText = "no routines yet";
  }

  const stats = getStats(addDays(today, -13), today);
  document.getElementById("stat-percent").innerText = Math.round(stats.percent * 100) + "%";

  showNextReminder(todaysRoutines);
}

function showNextReminder(todaysRoutines) {
  const today = getToday();
  const nowMinutes = minutesNow();

  let nextRoutine = null;
  let nextTime = 0;

  for (let i = 0; i < todaysRoutines.length; i++) {
    const routine = todaysRoutines[i];

    if (getLog(routine.id, today) !== null) {
      continue;
    }

    const routineTime = timeToMinutes(routine.cueTime);
    if (routineTime < nowMinutes) {
      continue;
    }

    if (nextRoutine === null || routineTime < nextTime) {
      nextRoutine = routine;
      nextTime = routineTime;
    }
  }

  if (nextRoutine === null) {
    if (todaysRoutines.length === 0) {
      document.getElementById("stat-next").innerText = "-";
      document.getElementById("stat-next-name").innerText = "nothing on today";
    } else {
      document.getElementById("stat-next").innerText = "all done";
      document.getElementById("stat-next-name").innerText = "nothing else today";
    }
    return;
  }

  let minutesLeft = nextTime - nowMinutes - settings.leadMinutes;
  let timeText;

  if (minutesLeft <= 0) {
    timeText = "now";
  } else if (minutesLeft < 60) {
    timeText = "in " + minutesLeft + " min";
  } else {
    timeText = "in " + Math.round(minutesLeft / 60) + " hours";
  }

  document.getElementById("stat-next").innerText = timeText;
  document.getElementById("stat-next-name").innerText =
    nextRoutine.emoji + " " + nextRoutine.name + " at " + niceTime(nextRoutine.cueTime);
}

function showTodaysRoutines() {
  const listArea = document.getElementById("today-list");
  listArea.innerHTML = "";

  const today = getToday();

  if (routines.length === 0) {
    listArea.innerHTML =
      "<div class='empty-message'>" +
      "<h3>No routines yet</h3>" +
      "<p>There is nothing to remind you about until you make a routine.</p>" +
      "<a href='routines.html' class='btn'>Make a routine</a>" +
      "</div>";
    return;
  }

  const todaysRoutines = getRoutinesForDate(today);

  if (todaysRoutines.length === 0) {
    listArea.innerHTML =
      "<div class='empty-message'>" +
      "<h3>Nothing on today</h3>" +
      "<p>None of your routines run on a " + dayNamesLong[getDayNumber(today)] + ". Rest days are part of the plan.</p>" +
      "</div>";
    return;
  }

  todaysRoutines.sort(function (a, b) {
    return timeToMinutes(a.cueTime) - timeToMinutes(b.cueTime);
  });

  for (let i = 0; i < todaysRoutines.length; i++) {
    listArea.appendChild(makeTodayCard(todaysRoutines[i]));
  }
}

function makeTodayCard(routine) {
  const today = getToday();
  const log = getLog(routine.id, today);
  const suggested = getSuggestedMode(routine.id);
  const streak = getStreak(routine.id);
  const score = getReadiness(routine.id);

  const card = document.createElement("div");
  card.className = "routine";

  if (log !== null && log.mode !== "skip") {
    card.className = "routine done";
  }

  let statusTag;
  if (log === null) {
    if (suggested === "micro") {
      statusTag = "<span class='tag tag-orange'>small version suggested</span>";
    } else {
      statusTag = "<span class='tag tag-purple'>full version</span>";
    }
  } else if (log.mode === "full") {
    statusTag = "<span class='tag tag-green'>done - full version</span>";
  } else if (log.mode === "micro") {
    statusTag = "<span class='tag tag-green'>done - small version, streak saved</span>";
  } else {
    statusTag = "<span class='tag tag-red'>skipped</span>";
  }

  let streakTag = "";
  if (streak > 0) {
    streakTag = "<span class='tag tag-purple'>🔥 " + dayWord(streak) + "</span>";
  }

  let buttons;
  if (log === null) {
    buttons =
      "<button class='btn btn-small' onclick=\"markRoutine('" + routine.id + "','full')\">Full - " + routine.fullMinutes + " min</button>";
    if (routine.microAction !== "") {
      buttons = buttons +
        "<button class='btn btn-small' onclick=\"markRoutine('" + routine.id + "','micro')\">Small - " + routine.microMinutes + " min</button>";
    }
    buttons = buttons +
      "<button class='btn btn-grey btn-small' onclick=\"skipRoutine('" + routine.id + "')\">Skip</button>";
  } else {
    buttons = "<button class='btn btn-grey btn-small' onclick=\"undoRoutine('" + routine.id + "')\">Undo</button>";
  }

  let bottomLine;
  if (log === null && suggested === "micro") {
    bottomLine = "<b>Do this instead today:</b> " + escapeHtml(routine.microAction) +
                 " (" + routine.microMinutes + " min). " + getRiskLine(routine);
  } else {
    bottomLine = getRiskLine(routine);
  }

  card.innerHTML =
    "<div class='routine-top'>" +
      "<span class='routine-emoji'>" + routine.emoji + "</span>" +
      "<span class='routine-name'>" + escapeHtml(routine.name) + "</span>" +
      statusTag + streakTag +
      "<span class='tag'>score " + score + "</span>" +
      "<span class='routine-buttons'>" + buttons + "</span>" +
    "</div>" +
    "<p class='routine-stats'>⏰ " + niceTime(routine.cueTime) + "</p>" +
    "<div class='if-then'><span>If</span> " + escapeHtml(getIfPart(routine)) +
      ", <span>then</span> " + escapeHtml(getThenPart(routine)) + ".</div>" +
    "<p class='micro-text'>" + bottomLine + "</p>";

  return card;
}

function markRoutine(id, mode) {
  saveLog(id, getToday(), mode);

  const routine = getRoutine(id);
  const streak = getStreak(id);

  if (mode === "micro") {
    showMessage("Streak saved", "The small version counts. " + dayWord(streak) + " still going.", "green");
  } else {
    showMessage("Well done", dayWord(streak) + " in a row now.", "green");
  }

  refreshPage();
}

function skipRoutine(id) {
  const routine = getRoutine(id);
  const streak = getStreak(id);

  if (streak >= 3 && routine.microAction !== "") {
    const doSmall = confirm(
      "You have " + dayWord(streak) + " in a row.\n\n" +
      "The small version only takes " + routine.microMinutes + " minutes: " + routine.microAction + "\n\n" +
      "Press OK to do the small version, or Cancel to skip anyway."
    );

    if (doSmall) {
      markRoutine(id, "micro");
      return;
    }
  }

  saveLog(id, getToday(), "skip");
  refreshPage();
}

function undoRoutine(id) {
  removeLog(id, getToday());
  refreshPage();
}

function openCheckinForm() {
  const existing = getCheckin(getToday());

  if (existing === null) {
    formSleepHours = 7.5;
    formSleepQuality = 3;
    formEnergy = 3;
  } else {
    formSleepHours = existing.sleepHours;
    formSleepQuality = existing.sleepQuality;
    formEnergy = existing.energy;
  }

  document.getElementById("popup-area").innerHTML =
    "<div class='popup-background'>" +
      "<div class='popup'>" +
        "<div class='popup-title'>" +
          "<h2>Daily check-in</h2>" +
          "<button class='btn btn-grey btn-small' onclick='closeCheckinForm()'>Close</button>" +
        "</div>" +
        "<p>This takes about thirty seconds and replaces needing a smart watch.</p>" +

        "<div class='form-group'>" +
          "<label>Hours slept: <span id='label-sleep'></span></label>" +
          "<input type='range' id='slider-sleep' min='3' max='11' step='0.5' value='" + formSleepHours + "' oninput='sliderChanged()'>" +
        "</div>" +

        "<div class='form-group'>" +
          "<label>Sleep quality: <span id='label-quality'></span></label>" +
          "<input type='range' id='slider-quality' min='1' max='5' step='1' value='" + formSleepQuality + "' oninput='sliderChanged()'>" +
        "</div>" +

        "<div class='form-group'>" +
          "<label>Energy right now: <span id='label-energy'></span></label>" +
          "<input type='range' id='slider-energy' min='1' max='5' step='1' value='" + formEnergy + "' oninput='sliderChanged()'>" +
        "</div>" +

        "<div class='box' style='background-color:#f7f7fb'>" +
          "<p class='stat-title'>Your score would be</p>" +
          "<p class='stat-number' id='preview-score'>0</p>" +
          "<div class='progress-bar'><div class='progress-fill' id='preview-bar'></div></div>" +
          "<p class='stat-note' id='preview-text'></p>" +
        "</div>" +

        "<div class='popup-buttons'>" +
          "<button class='btn btn-grey' onclick='closeCheckinForm()'>Cancel</button> " +
          "<button class='btn' onclick='saveCheckinForm()'>Save check-in</button>" +
        "</div>" +

      "</div>" +
    "</div>";

  sliderChanged();
}

function closeCheckinForm() {
  document.getElementById("popup-area").innerHTML = "";
}

function sliderChanged() {
  formSleepHours = Number(document.getElementById("slider-sleep").value);
  formSleepQuality = Number(document.getElementById("slider-quality").value);
  formEnergy = Number(document.getElementById("slider-energy").value);

  document.getElementById("label-sleep").innerText = formSleepHours + " hours";
  document.getElementById("label-quality").innerText = sleepWords[formSleepQuality - 1];
  document.getElementById("label-energy").innerText = energyWords[formEnergy - 1];

  const score = Math.round(calculateAbility({
    sleepHours: formSleepHours,
    sleepQuality: formSleepQuality,
    energy: formEnergy
  }) * 100);

  const scoreWord = getScoreWord(score);

  document.getElementById("preview-score").innerText = score + " / 100";
  document.getElementById("preview-bar").style.width = score + "%";
  document.getElementById("preview-bar").style.backgroundColor = scoreWord.colour;

  if (score < 50) {
    document.getElementById("preview-text").innerText =
      scoreWord.word + " - you will be asked for the small versions today.";
  } else {
    document.getElementById("preview-text").innerText =
      scoreWord.word + " - the full versions should be fine.";
  }
}

function saveCheckinForm() {
  saveCheckin(getToday(), formSleepHours, formSleepQuality, formEnergy);
  closeCheckinForm();
  showMessage("Check-in saved", "Your score has been worked out again.", "green");
  refreshPage();
}

function showSettings() {
  document.getElementById("input-lead").value = settings.leadMinutes;
  document.getElementById("input-loss").checked = settings.lossAversion;
  document.getElementById("input-micro").checked = settings.autoMicro;

  showPermissionState();
}

function showPermissionState() {
  const textArea = document.getElementById("permission-text");
  const button = document.getElementById("permission-button");
  const help = document.getElementById("permission-help");

  if (!("Notification" in window)) {
    textArea.innerHTML = "<span class='tag tag-red'>Not supported in this browser</span>";
    button.disabled = true;
    help.innerText = "Reminders will still show inside the page.";
    return;
  }

  if (Notification.permission === "granted") {
    textArea.innerHTML = "<span class='tag tag-green'>Turned on</span>";
    button.disabled = true;
    button.innerText = "Notifications are on";
    help.innerText = "Reminders will pop up before each routine while this page is open.";
  } else if (Notification.permission === "denied") {
    textArea.innerHTML = "<span class='tag tag-red'>Blocked</span>";
    button.disabled = true;
    help.innerText = "The browser is blocking notifications for this page. Reminders will still show inside the page.";
  } else {
    textArea.innerHTML = "<span class='tag tag-orange'>Not asked yet</span>";
    button.disabled = false;
    help.innerText = "Without permission the reminders only show inside the page. Everything else works the same.";
  }
}

function onPermissionChanged() {
  showPermissionState();
}

function changeLeadMinutes() {
  let value = Number(document.getElementById("input-lead").value);

  if (isNaN(value) || value < 0) {
    value = 0;
  }
  if (value > 120) {
    value = 120;
  }

  document.getElementById("input-lead").value = value;
  settings.leadMinutes = value;
  saveData();
  showStatBoxes();
}

function changeLossAversion() {
  settings.lossAversion = document.getElementById("input-loss").checked;
  saveData();
}

function changeAutoMicro() {
  settings.autoMicro = document.getElementById("input-micro").checked;
  saveData();
  refreshPage();
}

function sendTestNudge() {
  const today = getToday();
  const todaysRoutines = getRoutinesForDate(today);

  let routine = null;
  for (let i = 0; i < todaysRoutines.length; i++) {
    if (getLog(todaysRoutines[i].id, today) === null) {
      routine = todaysRoutines[i];
      break;
    }
  }
  if (routine === null && todaysRoutines.length > 0) {
    routine = todaysRoutines[0];
  }
  if (routine === null && routines.length > 0) {
    routine = routines[0];
  }

  if (routine === null) {
    showMessage("Nothing to remind you about", "Make a routine first.", "orange");
    return;
  }

  const mode = getSuggestedMode(routine.id);
  const title = getNudgeTitle(routine);
  const message = getNudgeMessage(routine, mode);

  if (settings.notificationsOn && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body: message });
    } catch (error) {
      console.log("Notification could not be shown: " + error.message);
    }
  }

  showMessage(routine.emoji + " " + title, message, "orange");
}

function refreshPage() {
  showScore();
  showStatBoxes();
  showTodaysRoutines();
}

showGreeting();
refreshPage();
showSettings();

setInterval(showStatBoxes, 60000);