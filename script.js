let routines = [];
let logs = [];
let checkins = [];
let settings = {
  leadMinutes: 10,
  lossAversion: true,
  autoMicro: true,
  notificationsOn: false
};
let alreadyNotified = {};

const STORAGE_KEY = "optiroutine_data";


const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayNamesLong = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const energyWords = ["Very low", "Low", "Average", "Good", "Very good"];
const sleepWords = ["Terrible", "Poor", "OK", "Good", "Excellent"];

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === null) {
    return;
  }

  let data;
  try {
    data = JSON.parse(saved);
  } catch (error) {
    console.log("Saved data could not be read, starting fresh.");
    return;
  }

  if (data.routines) {
    routines = data.routines;
  }
  if (data.logs) {
    logs = data.logs;
  }
  if (data.checkins) {
    checkins = data.checkins;
  }
  if (data.settings) {
   
    if (data.settings.leadMinutes !== undefined) {
      settings.leadMinutes = data.settings.leadMinutes;
    }
    if (data.settings.lossAversion !== undefined) {
      settings.lossAversion = data.settings.lossAversion;
    }
    if (data.settings.autoMicro !== undefined) {
      settings.autoMicro = data.settings.autoMicro;
    }
    if (data.settings.notificationsOn !== undefined) {
      settings.notificationsOn = data.settings.notificationsOn;
    }
  }
  if (data.alreadyNotified) {
    alreadyNotified = data.alreadyNotified;
  }
}

function saveData() {
  const data = {
    routines: routines,
    logs: logs,
    checkins: checkins,
    settings: settings,
    alreadyNotified: alreadyNotified
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function deleteAllData() {
  routines = [];
  logs = [];
  checkins = [];
  alreadyNotified = {};
  saveData();
}


function makeId() {
  return Date.now().toString() + Math.floor(Math.random() * 100000).toString();
}


function dateToText(dateObject) {
  const year = dateObject.getFullYear();
  let month = dateObject.getMonth() + 1;
  let day = dateObject.getDate();
  if (month < 10) {
    month = "0" + month;
  }
  if (day < 10) {
    day = "0" + day;
  }
  return year + "-" + month + "-" + day;
}

function getToday() {
  return dateToText(new Date());
}

function textToDate(text) {
  const parts = text.split("-");
  
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function addDays(dateText, howMany) {
  const date = textToDate(dateText);
  date.setDate(date.getDate() + howMany);
  return dateToText(date);
}


function getDayNumber(dateText) {
  return textToDate(dateText).getDay();
}


function getDateList(fromDate, toDate) {
  const list = [];
  let current = fromDate;
  while (current <= toDate) {
    list.push(current);
    current = addDays(current, 1);
  }
  return list;
}

function getLastDays(howMany) {
  const today = getToday();
  return getDateList(addDays(today, -(howMany - 1)), today);
}


function shortDate(dateText) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const date = textToDate(dateText);
  return date.getDate() + " " + months[date.getMonth()];
}


function niceTime(timeText) {
  if (!timeText) {
    return "";
  }
  const parts = timeText.split(":");
  let hour = Number(parts[0]);
  const minute = parts[1];
  let ampm = "AM";
  if (hour >= 12) {
    ampm = "PM";
  }
  if (hour > 12) {
    hour = hour - 12;
  }
  if (hour === 0) {
    hour = 12;
  }
  return hour + ":" + minute + " " + ampm;
}

function timeToMinutes(timeText) {
  const parts = timeText.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function minutesNow() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}


function getRoutine(id) {
  for (let i = 0; i < routines.length; i++) {
    if (routines[i].id === id) {
      return routines[i];
    }
  }
  return null;
}

function isScheduledOn(routine, dateText) {
  if (dateText < routine.startDate) {
    return false;
  }
  const dayNumber = getDayNumber(dateText);
  return routine.days.indexOf(dayNumber) !== -1;
}

function getRoutinesForDate(dateText) {
  const list = [];
  for (let i = 0; i < routines.length; i++) {
    if (isScheduledOn(routines[i], dateText)) {
      list.push(routines[i]);
    }
  }
  return list;
}

function getLog(routineId, dateText) {
  for (let i = 0; i < logs.length; i++) {
    if (logs[i].routineId === routineId && logs[i].date === dateText) {
      return logs[i];
    }
  }
  return null;
}

function saveLog(routineId, dateText, mode) {
  const existing = getLog(routineId, dateText);
  if (existing !== null) {
    existing.mode = mode;
  } else {
    logs.push({
      routineId: routineId,
      date: dateText,
      mode: mode
    });
  }
  saveData();
}

function removeLog(routineId, dateText) {
  for (let i = 0; i < logs.length; i++) {
    if (logs[i].routineId === routineId && logs[i].date === dateText) {
      logs.splice(i, 1);
      break;
    }
  }
  saveData();
}

function isDone(routineId, dateText) {
  const log = getLog(routineId, dateText);
  if (log === null) {
    return false;
  }
  return log.mode === "full" || log.mode === "micro";
}

function getStreak(routineId) {
  const routine = getRoutine(routineId);
  if (routine === null) {
    return 0;
  }

  const today = getToday();
  let day = today;
  let count = 0;

  if (isScheduledOn(routine, day) && getLog(routineId, day) === null) {
    day = addDays(day, -1);
  }

  while (day >= routine.startDate) {
    if (isScheduledOn(routine, day)) {
      if (isDone(routineId, day)) {
        count = count + 1;
      } else {
        break;
      }
    }
    day = addDays(day, -1);
  }
  return count;
}

function getBestStreak(routineId) {
  const routine = getRoutine(routineId);
  if (routine === null) {
    return 0;
  }

  const today = getToday();
  const days = getDateList(routine.startDate, today);
  let best = 0;
  let current = 0;

  for (let i = 0; i < days.length; i++) {
    if (!isScheduledOn(routine, days[i])) {
      continue;
    }
    if (isDone(routineId, days[i])) {
      current = current + 1;
      if (current > best) {
        best = current;
      }
    } else if (days[i] !== today) {

      current = 0;
    }
  }
  return best;
}

function getLongestStreak() {
  let bestRoutine = null;
  let bestCount = 0;
  for (let i = 0; i < routines.length; i++) {
    const count = getStreak(routines[i].id);
    if (count > bestCount || bestRoutine === null) {
      bestCount = count;
      bestRoutine = routines[i];
    }
  }
  return { routine: bestRoutine, days: bestCount };
}

function getStats(fromDate, toDate, routineId) {
  let whichRoutines = routines;
  if (routineId) {
    const one = getRoutine(routineId);
    whichRoutines = [];
    if (one !== null) {
      whichRoutines.push(one);
    }
  }

  const days = getDateList(fromDate, toDate);
  let scheduled = 0;
  let full = 0;
  let micro = 0;

  for (let i = 0; i < days.length; i++) {
    for (let j = 0; j < whichRoutines.length; j++) {
      if (!isScheduledOn(whichRoutines[j], days[i])) {
        continue;
      }
      scheduled = scheduled + 1;
      const log = getLog(whichRoutines[j].id, days[i]);
      if (log !== null) {
        if (log.mode === "full") {
          full = full + 1;
        } else if (log.mode === "micro") {
          micro = micro + 1;
        }
      }
    }
  }

  const done = full + micro;
  let percent = 0;
  if (scheduled > 0) {
    percent = done / scheduled;
  }

  return {
    scheduled: scheduled,
    done: done,
    full: full,
    micro: micro,
    missed: scheduled - done,
    percent: percent
  };
}

function getCheckin(dateText) {
  for (let i = 0; i < checkins.length; i++) {
    if (checkins[i].date === dateText) {
      return checkins[i];
    }
  }
  return null;
}

function saveCheckin(dateText, sleepHours, sleepQuality, energy) {
  const existing = getCheckin(dateText);
  if (existing !== null) {
    existing.sleepHours = sleepHours;
    existing.sleepQuality = sleepQuality;
    existing.energy = energy;
  } else {
    checkins.push({
      date: dateText,
      sleepHours: sleepHours,
      sleepQuality: sleepQuality,
      energy: energy
    });
  }
  saveData();
}

function calculateAbility(checkin) {
  if (checkin === null) {
  
    return 0.7;
  }

  const energyPart = checkin.energy / 5;
  const qualityPart = checkin.sleepQuality / 5;

  let sleepPart;
  if (checkin.sleepHours >= 7 && checkin.sleepHours <= 9) {
    sleepPart = 1;
  } else if (checkin.sleepHours < 7) {
    sleepPart = 1 - (7 - checkin.sleepHours) * 0.22;
  } else {
    sleepPart = 1 - (checkin.sleepHours - 9) * 0.12;
  }

  if (sleepPart < 0) {
    sleepPart = 0;
  }
  if (sleepPart > 1) {
    sleepPart = 1;
  }

  return energyPart * 0.45 + sleepPart * 0.35 + qualityPart * 0.2;
}

function calculateMotivation(routineId) {
  const streak = getStreak(routineId);

  let streakPart = streak / 14;
  if (streakPart > 1) {
    streakPart = 1;
  }

  const today = getToday();
  const recent = getStats(addDays(today, -13), today, routineId);

  return streakPart * 0.55 + recent.percent * 0.45;
}


function getReadiness(routineId) {
  const ability = calculateAbility(getCheckin(getToday()));
  const motivation = calculateMotivation(routineId);
  return Math.round((ability * 0.65 + motivation * 0.35) * 100);
}

function getDayScore() {
  return Math.round(calculateAbility(getCheckin(getToday())) * 100);
}

function getSuggestedMode(routineId) {
  if (!settings.autoMicro) {
    return "full";
  }
  const routine = getRoutine(routineId);
  if (routine === null || routine.microAction === "") {
   
    return "full";
  }
  if (getReadiness(routineId) < 50) {
    return "micro";
  }
  return "full";
}


function getScoreWord(score) {
  if (score >= 75) {
    return { word: "High capacity", colour: "#3f9c3f" };
  }
  if (score >= 50) {
    return { word: "Steady", colour: "#e0a12a" };
  }
  if (score >= 30) {
    return { word: "Low capacity", colour: "#e07a2a" };
  }
  return { word: "Very low", colour: "#d64545" };
}

function getNudgeTitle(routine) {
  const streak = getStreak(routine.id);

  if (!settings.lossAversion || streak < 2) {
    return routine.name;
  }
  if (streak >= 30) {
    return dayWord(streak) + " on the line";
  }
  if (streak >= 7) {
    return "Protect your " + dayWord(streak) + " streak";
  }
  return "Do not drop " + dayWord(streak) + " now";
}

function getNudgeMessage(routine, mode) {
  if (mode === "micro" && routine.microAction !== "") {
    return "Low capacity today, just " + routine.microMinutes + " min: " + routine.microAction;
  }
  return routine.fullMinutes + " min: " + routine.fullAction;
}

function getRiskLine(routine) {
  const streak = getStreak(routine.id);
  if (streak === 0) {
    return "Nothing saved up yet, today starts the streak.";
  }
  if (streak === 1) {
    return "1 day saved up. Day two is where most people quit.";
  }
  if (streak >= 30) {
    return dayWord(streak) + " saved up. That is a whole month you would lose.";
  }
  return dayWord(streak) + " saved up, and they all go if today is skipped.";
}

function getIfPart(routine) {
  if (routine.cueType === "time") {
    return "it is " + niceTime(routine.cueTime);
  }
  let afterWhat = routine.cueAfter;
  if (afterWhat === "") {
    afterWhat = "my last task";
  }
  return "I finish " + afterWhat;
}

function getThenPart(routine) {
  if (routine.fullAction === "") {
    return routine.name;
  }
  return routine.fullAction;
}

function getDaysText(routine) {

  const days = routine.days.slice().sort(function (a, b) {
    return a - b;
  });

  if (days.length === 7) {
    return "Every day";
  }
  if (days.join(",") === "1,2,3,4,5") {
    return "Weekdays";
  }
  if (days.join(",") === "0,6") {
    return "Weekends";
  }

  let text = "";
  for (let i = 0; i < days.length; i++) {
    if (i > 0) {
      text = text + ", ";
    }
    text = text + dayNames[days[i]];
  }
  return text;
}

function dayWord(number) {
  if (number === 1) {
    return "1 day";
  }
  return number + " days";
}

function escapeHtml(text) {
  if (text === undefined || text === null) {
    return "";
  }
  return String(text)
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;")
    .split("'").join("&#39;");
}

function showMessage(title, text, colour) {
  let area = document.getElementById("message-area");
  if (area === null) {
    area = document.createElement("div");
    area.id = "message-area";
    document.body.appendChild(area);
  }

  const box = document.createElement("div");
  box.className = "message";
  if (colour) {
    box.className = "message message-" + colour;
  }

  const titleTag = document.createElement("b");
  titleTag.innerText = title;
  box.appendChild(titleTag);

  if (text) {
    const textTag = document.createElement("p");
    textTag.innerText = text;
    box.appendChild(textTag);
  }

  area.appendChild(box);


  setTimeout(function () {
    box.remove();
  }, 5000);

  return box;
}

function getRoutinesToNudge() {
  const today = getToday();
  const nowMinutes = minutesNow();
  const todaysRoutines = getRoutinesForDate(today);
  const list = [];

  for (let i = 0; i < todaysRoutines.length; i++) {
    const routine = todaysRoutines[i];
    
    if (getLog(routine.id, today) !== null) {
      continue;
    }

    const cueMinutes = timeToMinutes(routine.cueTime);
    const startTime = cueMinutes - settings.leadMinutes;
    const endTime = cueMinutes + 45;

    if (nowMinutes >= startTime && nowMinutes <= endTime) {
      list.push(routine);
    }
  }
  return list;
}

function wasAlreadyNotified(routineId, dateText) {
  const listForDay = alreadyNotified[dateText];
  if (!listForDay) {
    return false;
  }
  return listForDay.indexOf(routineId) !== -1;
}

function markAsNotified(routineId, dateText) {
  if (!alreadyNotified[dateText]) {
    alreadyNotified[dateText] = [];
  }
  alreadyNotified[dateText].push(routineId);

  const cutoff = addDays(getToday(), -14);
  for (const day in alreadyNotified) {
    if (day < cutoff) {
      delete alreadyNotified[day];
    }
  }
  saveData();
}

function checkForNudges() {
  const today = getToday();
  const list = getRoutinesToNudge();

  for (let i = 0; i < list.length; i++) {
    const routine = list[i];

    if (wasAlreadyNotified(routine.id, today)) {
      continue;
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
    markAsNotified(routine.id, today);
  }
}

function askForNotificationPermission() {
  if (!("Notification" in window)) {
    showMessage("Not supported", "This browser cannot show notifications.", "red");
    return;
  }

  Notification.requestPermission().then(function (answer) {
    if (answer === "granted") {
      settings.notificationsOn = true;
      saveData();
      showMessage("Notifications turned on", "Reminders will show before each routine.", "green");
    } else {
      settings.notificationsOn = false;
      saveData();
      showMessage("Notifications blocked", "Reminders will only show inside the page.", "orange");
    }
   
    if (typeof onPermissionChanged === "function") {
      onPermissionChanged();
    }
  });
}

function loadDemoData() {
  const demoRoutines = [
    {
      name: "Deep work block", emoji: "🧠", cueType: "time", cueTime: "09:30", cueAfter: "",
      fullAction: "Write for 90 minutes with no interruptions", fullMinutes: 90,
      microAction: "Open the document and write one paragraph", microMinutes: 5,
      days: [1, 2, 3, 4, 5], howGood: 0.78
    },
    {
      name: "Gym session", emoji: "🏋️", cueType: "time", cueTime: "18:00", cueAfter: "",
      fullAction: "Full gym session with the main lifts", fullMinutes: 60,
      microAction: "Ten push ups and a stretch", microMinutes: 5,
      days: [1, 3, 5], howGood: 0.64
    },
    {
      name: "Evening shutdown", emoji: "🌙", cueType: "after", cueTime: "21:30", cueAfter: "closing the laptop",
      fullAction: "Look back at the day and plan tomorrow", fullMinutes: 15,
      microAction: "Write down tomorrow's most important task", microMinutes: 2,
      days: [0, 1, 2, 3, 4, 5, 6], howGood: 0.71
    },
    {
      name: "Language practice", emoji: "🗣️", cueType: "time", cueTime: "12:45", cueAfter: "",
      fullAction: "One full lesson and the review cards", fullMinutes: 25,
      microAction: "Five flashcards", microMinutes: 3,
      days: [1, 2, 3, 4, 5, 6], howGood: 0.58
    }
  ];

  const daysBack = 84;
  const startDate = addDays(getToday(), -daysBack);

  routines = [];
  logs = [];
  checkins = [];

  for (let i = 0; i < demoRoutines.length; i++) {
    const item = demoRoutines[i];
    routines.push({
      id: makeId() + "-" + i,
      name: item.name,
      emoji: item.emoji,
      cueType: item.cueType,
      cueTime: item.cueTime,
      cueAfter: item.cueAfter,
      fullAction: item.fullAction,
      fullMinutes: item.fullMinutes,
      microAction: item.microAction,
      microMinutes: item.microMinutes,
      days: item.days,
      startDate: startDate
    });
  }

  const allDays = getDateList(startDate, getToday());
  const today = getToday();

  for (let i = 0; i < allDays.length; i++) {
    const day = allDays[i];
    const dayNumber = getDayNumber(day);

    let weekendExtra = 0;
    if (dayNumber === 0 || dayNumber === 6) {
      weekendExtra = 0.8;
    }

    let sleepHours = 6.6 + weekendExtra + (Math.random() - 0.45) * 1.8;
    if (sleepHours < 4) {
      sleepHours = 4;
    }
    if (sleepHours > 10) {
      sleepHours = 10;
    }
    sleepHours = Math.round(sleepHours * 10) / 10;

    let sleepQuality = Math.round(2 + (sleepHours - 6) * 1.1 + (Math.random() - 0.5) * 1.4);
    if (sleepQuality < 1) { sleepQuality = 1; }
    if (sleepQuality > 5) { sleepQuality = 5; }

    let energy = Math.round(1.4 + (sleepHours - 5) * 0.75 + (Math.random() - 0.5) * 1.6);
    if (energy < 1) { energy = 1; }
    if (energy > 5) { energy = 5; }

    checkins.push({
      date: day,
      sleepHours: sleepHours,
      sleepQuality: sleepQuality,
      energy: energy
    });

    const ability = calculateAbility({
      sleepHours: sleepHours,
      sleepQuality: sleepQuality,
      energy: energy
    });

    for (let j = 0; j < routines.length; j++) {
      const routine = routines[j];

      if (routine.days.indexOf(dayNumber) === -1) {
        continue;
      }
      if (day === today) {
        continue;
      }

      const gettingBetter = 0.55 + 0.45 * (i / allDays.length);
      let chance = demoRoutines[j].howGood * gettingBetter + (ability - 0.65) * 0.55;
      if (chance < 0.05) { chance = 0.05; }
      if (chance > 0.97) { chance = 0.97; }

      const roll = Math.random();
      let mode = "";

      if (roll < chance) {
        if (ability < 0.5 && Math.random() < 0.62) {
          mode = "micro";
        } else {
          mode = "full";
        }
      } else if (roll < chance + 0.14) {
        mode = "micro";
      } else if (Math.random() < 0.55) {
        mode = "skip";
      }

      if (mode !== "") {
        logs.push({ routineId: routine.id, date: day, mode: mode });
      }
    }
  }

  saveData();
}

loadData();

setTimeout(checkForNudges, 1000);
setInterval(checkForNudges, 30000);