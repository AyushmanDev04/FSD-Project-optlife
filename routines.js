const emojiList = ["🎯", "🧠", "🏋️", "🏃", "📚", "✍️", "🧘", "🌙",
                   "🗣️", "💧", "🎸", "🍎", "💻", "🧹", "📞", "💰"];


const templates = [
  {
    name: "Deep work block", emoji: "🧠", cueType: "time", cueTime: "09:30", cueAfter: "",
    fullAction: "Write for 90 minutes with no interruptions", fullMinutes: 90,
    microAction: "Open the document and write one paragraph", microMinutes: 5,
    days: [1, 2, 3, 4, 5]
  },
  {
    name: "Gym session", emoji: "🏋️", cueType: "time", cueTime: "18:00", cueAfter: "",
    fullAction: "Full gym session with the main lifts", fullMinutes: 60,
    microAction: "Ten push ups and a stretch", microMinutes: 5,
    days: [1, 3, 5]
  },
  {
    name: "Evening shutdown", emoji: "🌙", cueType: "after", cueTime: "21:30", cueAfter: "closing the laptop",
    fullAction: "Look back at the day and plan tomorrow", fullMinutes: 15,
    microAction: "Write down tomorrow's most important task", microMinutes: 2,
    days: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    name: "Reading", emoji: "📚", cueType: "after", cueTime: "22:00", cueAfter: "getting into bed",
    fullAction: "Read one chapter", fullMinutes: 30,
    microAction: "Read two pages", microMinutes: 3,
    days: [0, 1, 2, 3, 4, 5, 6]
  },
  {
    name: "Language practice", emoji: "🗣️", cueType: "time", cueTime: "12:45", cueAfter: "",
    fullAction: "One full lesson and the review cards", fullMinutes: 25,
    microAction: "Five flashcards", microMinutes: 3,
    days: [1, 2, 3, 4, 5, 6]
  },
  {
    name: "Morning walk", emoji: "🏃", cueType: "after", cueTime: "07:15", cueAfter: "my first coffee",
    fullAction: "Go for a 5km run", fullMinutes: 35,
    microAction: "Walk to the end of the street and back", microMinutes: 6,
    days: [1, 2, 3, 4, 5]
  }
];

let formEmoji = "🎯";
let formDays = [1, 2, 3, 4, 5];
let formCueType = "time";
let editingId = "";

function showRoutines() {
  const listArea = document.getElementById("routine-list");
  listArea.innerHTML = "";

  if (routines.length === 0) {
    listArea.innerHTML =
      "<div class='empty-message'>" +
      "<h3>No routines yet</h3>" +
      "<p>A routine is an If/Then sentence with two sizes. Make one, or load the demo data to see how the analytics page works.</p>" +
      "</div>";
    return;
  }

  for (let i = 0; i < routines.length; i++) {
    listArea.appendChild(makeRoutineCard(routines[i]));
  }
}

function makeRoutineCard(routine) {
  const card = document.createElement("div");
  card.className = "routine";

  const streak = getStreak(routine.id);
  const bestStreak = getBestStreak(routine.id);
  const today = getToday();
  const stats = getStats(addDays(today, -29), today, routine.id);

  let whenText;
  if (routine.cueType === "time") {
    whenText = niceTime(routine.cueTime);
  } else {
    whenText = "after " + escapeHtml(routine.cueAfter) + " (about " + niceTime(routine.cueTime) + ")";
  }

  let tags = "";
  if (streak > 0) {
    tags = tags + "<span class='tag tag-purple'>🔥 " + dayWord(streak) + "</span>";
  }
  if (routine.microAction === "") {
    tags = tags + "<span class='tag tag-orange'>no small version</span>";
  }

  let microText = "<i>not set</i>";
  if (routine.microAction !== "") {
    microText = escapeHtml(routine.microAction) + " (" + routine.microMinutes + " min)";
  }

  card.innerHTML =
    "<div class='routine-top'>" +
      "<span class='routine-emoji'>" + routine.emoji + "</span>" +
      "<span class='routine-name'>" + escapeHtml(routine.name) + "</span>" +
      tags +
      "<span class='routine-buttons'>" +
        "<button class='btn btn-grey btn-small' onclick=\"openEditForm('" + routine.id + "')\">Edit</button>" +
        "<button class='btn btn-red btn-small' onclick=\"deleteRoutine('" + routine.id + "')\">Delete</button>" +
      "</span>" +
    "</div>" +
    "<p class='routine-stats'>⏰ " + whenText + " &nbsp;·&nbsp; " + getDaysText(routine) + "</p>" +
    "<div class='if-then'><span>If</span> " + escapeHtml(getIfPart(routine)) + ", <span>then</span> " + escapeHtml(getThenPart(routine)) + ".</div>" +
    "<p class='micro-text'><b>Small version:</b> " + microText + "</p>" +
    "<p class='routine-stats'>Last 30 days: " + Math.round(stats.percent * 100) + "% &nbsp;·&nbsp; " +
      "best streak: " + dayWord(bestStreak) + " &nbsp;·&nbsp; " +
      stats.full + " full, " + stats.micro + " small</p>";

  return card;
}

function openNewRoutineForm() {
  editingId = "";
  formEmoji = "🎯";
  formDays = [1, 2, 3, 4, 5];
  formCueType = "time";
  showForm("New routine", "", "18:00", "", "", 30, "", 5);
}

function openEditForm(id) {
  const routine = getRoutine(id);
  if (routine === null) {
    return;
  }
  editingId = id;
  formEmoji = routine.emoji;
  formDays = routine.days.slice();
  formCueType = routine.cueType;
  showForm("Edit routine", routine.name, routine.cueTime, routine.cueAfter,
           routine.fullAction, routine.fullMinutes,
           routine.microAction, routine.microMinutes);
}

function showForm(title, name, cueTime, cueAfter, fullAction, fullMinutes, microAction, microMinutes) {
  
  let emojiHtml = "";
  for (let i = 0; i < emojiList.length; i++) {
    let selected = "";
    if (emojiList[i] === formEmoji) {
      selected = "selected";
    }
    emojiHtml = emojiHtml +
      "<button type='button' class='" + selected + "' onclick=\"pickEmoji('" + emojiList[i] + "')\">" +
      emojiList[i] + "</button>";
  }

 
  let dayHtml = "";
  for (let i = 0; i < 7; i++) {
    let selected = "";
    if (formDays.indexOf(i) !== -1) {
      selected = "selected";
    }
    dayHtml = dayHtml +
      "<button type='button' class='" + selected + "' onclick='pickDay(" + i + ")'>" +
      dayNames[i] + "</button>";
  }

  let timeSelected = "";
  let afterSelected = "";
  if (formCueType === "time") {
    timeSelected = "btn";
    afterSelected = "btn btn-grey";
  } else {
    timeSelected = "btn btn-grey";
    afterSelected = "btn";
  }

  let afterHidden = "hidden";
  if (formCueType === "after") {
    afterHidden = "";
  }

  const popupArea = document.getElementById("popup-area");
  popupArea.innerHTML =
    "<div class='popup-background'>" +
      "<div class='popup'>" +
        "<div class='popup-title'>" +
          "<h2>" + title + "</h2>" +
          "<button class='btn btn-grey btn-small' onclick='closeForm()'>Close</button>" +
        "</div>" +

        "<div class='form-group'>" +
          "<label for='input-name'>Routine name</label>" +
          "<input type='text' id='input-name' maxlength='60' value=\"" + escapeHtml(name) + "\" placeholder='Deep work block'>" +
        "</div>" +

        "<div class='form-group'>" +
          "<label>Icon</label>" +
          "<div class='icon-buttons' id='emoji-buttons'>" + emojiHtml + "</div>" +
        "</div>" +

        "<div class='form-group'>" +
          "<label>When does it happen?</label>" +
          "<button type='button' class='" + timeSelected + " btn-small' onclick=\"pickCueType('time')\">At a time</button> " +
          "<button type='button' class='" + afterSelected + " btn-small' onclick=\"pickCueType('after')\">After another habit</button>" +
        "</div>" +

        "<div class='form-group " + afterHidden + "' id='after-group'>" +
          "<label for='input-after'>Right after I finish...</label>" +
          "<input type='text' id='input-after' value=\"" + escapeHtml(cueAfter) + "\" placeholder='closing the laptop'>" +
          "<p class='form-help'>The time below is still used to decide when to remind you.</p>" +
        "</div>" +

        "<div class='form-group'>" +
          "<label for='input-time'>Time</label>" +
          "<input type='time' id='input-time' value='" + cueTime + "'>" +
        "</div>" +

        "<div class='form-group'>" +
          "<label>Which days?</label>" +
          "<div class='day-buttons' id='day-buttons'>" + dayHtml + "</div>" +
        "</div>" +

        "<hr>" +

        "<div class='form-group'>" +
          "<label for='input-full'>Full version (a good day)</label>" +
          "<input type='text' id='input-full' value=\"" + escapeHtml(fullAction) + "\" placeholder='Write for 90 minutes'>" +
        "</div>" +

        "<div class='form-group'>" +
          "<label for='input-full-mins'>How many minutes?</label>" +
          "<input type='number' id='input-full-mins' min='1' max='600' value='" + fullMinutes + "'>" +
        "</div>" +

        "<div class='form-group'>" +
          "<label for='input-micro'>Small version (your worst day)</label>" +
          "<input type='text' id='input-micro' value=\"" + escapeHtml(microAction) + "\" placeholder='Open the document and write one sentence'>" +
          "<p class='form-help'>This is what you get asked for when your readiness score is under 50. Make it small enough that saying no feels silly.</p>" +
        "</div>" +

        "<div class='form-group'>" +
          "<label for='input-micro-mins'>How many minutes?</label>" +
          "<input type='number' id='input-micro-mins' min='1' max='60' value='" + microMinutes + "'>" +
        "</div>" +

        "<div class='box' style='background-color:#f7f7fb'>" +
          "<label>Your sentence</label>" +
          "<div id='sentence-preview'></div>" +
        "</div>" +

        "<div class='popup-buttons'>" +
          "<button class='btn btn-grey' onclick='closeForm()'>Cancel</button> " +
          "<button class='btn' onclick='saveRoutineForm()'>Save</button>" +
        "</div>" +

      "</div>" +
    "</div>";

 
  document.getElementById("input-time").onchange = updateSentence;
  document.getElementById("input-after").oninput = updateSentence;
  document.getElementById("input-full").oninput = updateSentence;
  updateSentence();
}

function closeForm() {
  document.getElementById("popup-area").innerHTML = "";
}

function pickEmoji(emoji) {
  formEmoji = emoji;
  
  const buttons = document.getElementById("emoji-buttons").getElementsByTagName("button");
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i].innerText === emoji) {
      buttons[i].className = "selected";
    } else {
      buttons[i].className = "";
    }
  }
}

function pickDay(dayNumber) {
  const position = formDays.indexOf(dayNumber);
  if (position === -1) {
    formDays.push(dayNumber);
  } else {
    formDays.splice(position, 1);
  }

  const buttons = document.getElementById("day-buttons").getElementsByTagName("button");
  if (formDays.indexOf(dayNumber) === -1) {
    buttons[dayNumber].className = "";
  } else {
    buttons[dayNumber].className = "selected";
  }
}

function pickCueType(type) {
  formCueType = type;
  if (type === "after") {
    document.getElementById("after-group").className = "form-group";
  } else {
    document.getElementById("after-group").className = "form-group hidden";
  }
  
  const buttons = document.getElementsByTagName("button");
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i].innerText === "At a time") {
      buttons[i].className = (type === "time" ? "btn" : "btn btn-grey") + " btn-small";
    }
    if (buttons[i].innerText === "After another habit") {
      buttons[i].className = (type === "after" ? "btn" : "btn btn-grey") + " btn-small";
    }
  }
  updateSentence();
}

function updateSentence() {
  const preview = document.getElementById("sentence-preview");
  if (preview === null) {
    return;
  }

  let ifPart;
  if (formCueType === "time") {
    ifPart = "it is " + niceTime(document.getElementById("input-time").value);
  } else {
    let afterText = document.getElementById("input-after").value;
    if (afterText === "") {
      afterText = "...";
    }
    ifPart = "I finish " + escapeHtml(afterText);
  }

  let thenPart = document.getElementById("input-full").value;
  if (thenPart === "") {
    thenPart = "...";
  }

  preview.innerHTML = "<b>If</b> " + ifPart + ", <b>then</b> " + escapeHtml(thenPart) + ".";
}

function saveRoutineForm() {
  const name = document.getElementById("input-name").value.trim();
  const fullAction = document.getElementById("input-full").value.trim();
  const microAction = document.getElementById("input-micro").value.trim();
  const cueAfter = document.getElementById("input-after").value.trim();
  const cueTime = document.getElementById("input-time").value;

  if (name === "") {
    showMessage("Please add a name", "The routine needs something to be called.", "orange");
    return;
  }
  if (fullAction === "") {
    showMessage("Please add the full version", "Write what you would do on a good day.", "orange");
    return;
  }
  if (formDays.length === 0) {
    showMessage("Please pick at least one day", "A routine with no days can never happen.", "orange");
    return;
  }
  if (cueTime === "") {
    showMessage("Please pick a time", "The time is used to decide when to remind you.", "orange");
    return;
  }

  let fullMinutes = Number(document.getElementById("input-full-mins").value);
  let microMinutes = Number(document.getElementById("input-micro-mins").value);
  if (!fullMinutes || fullMinutes < 1) {
    fullMinutes = 30;
  }
  if (!microMinutes || microMinutes < 1) {
    microMinutes = 5;
  }

  if (editingId === "") {
  
    routines.push({
      id: makeId(),
      name: name,
      emoji: formEmoji,
      cueType: formCueType,
      cueTime: cueTime,
      cueAfter: cueAfter,
      fullAction: fullAction,
      fullMinutes: fullMinutes,
      microAction: microAction,
      microMinutes: microMinutes,
      days: formDays.slice(),
      startDate: getToday()
    });
    showMessage("Routine created", name, "green");
  } else {
   
    const routine = getRoutine(editingId);
    routine.name = name;
    routine.emoji = formEmoji;
    routine.cueType = formCueType;
    routine.cueTime = cueTime;
    routine.cueAfter = cueAfter;
    routine.fullAction = fullAction;
    routine.fullMinutes = fullMinutes;
    routine.microAction = microAction;
    routine.microMinutes = microMinutes;
    routine.days = formDays.slice();
    showMessage("Routine saved", name, "green");
  }

  if (microAction === "") {
    showMessage("No small version", "Without one the app can only ask for the full session.", "orange");
  }

  saveData();
  closeForm();
  showRoutines();
}

function deleteRoutine(id) {
  const routine = getRoutine(id);
  if (routine === null) {
    return;
  }

  const sure = confirm("Delete \"" + routine.name + "\"? This also deletes its history and cannot be undone.");
  if (!sure) {
    return;
  }

  // take out the routine
  for (let i = 0; i < routines.length; i++) {
    if (routines[i].id === id) {
      routines.splice(i, 1);
      break;
    }
  }

  // take out all of its logs as well.
  // going backwards so that removing items does not skip the next one
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].routineId === id) {
      logs.splice(i, 1);
    }
  }

  saveData();
  showMessage("Routine deleted", routine.name, "red");
  showRoutines();
}

function openTemplates() {
  let html =
    "<div class='popup-background'>" +
      "<div class='popup'>" +
        "<div class='popup-title'>" +
          "<h2>Use a template</h2>" +
          "<button class='btn btn-grey btn-small' onclick='closeForm()'>Close</button>" +
        "</div>" +
        "<p>These already have a small version filled in. You can edit them afterwards.</p>";

  for (let i = 0; i < templates.length; i++) {
    html = html +
      "<div class='routine'>" +
        "<div class='routine-top'>" +
          "<span class='routine-emoji'>" + templates[i].emoji + "</span>" +
          "<span class='routine-name'>" + escapeHtml(templates[i].name) + "</span>" +
          "<span class='routine-buttons'>" +
            "<button class='btn btn-small' onclick='addTemplate(" + i + ")'>Add</button>" +
          "</span>" +
        "</div>" +
        "<p class='routine-stats'>" + templates[i].fullMinutes + " min, or " +
          templates[i].microMinutes + " min for the small version</p>" +
      "</div>";
  }

  html = html + "</div></div>";
  document.getElementById("popup-area").innerHTML = html;
}

function addTemplate(number) {
  const template = templates[number];

  routines.push({
    id: makeId(),
    name: template.name,
    emoji: template.emoji,
    cueType: template.cueType,
    cueTime: template.cueTime,
    cueAfter: template.cueAfter,
    fullAction: template.fullAction,
    fullMinutes: template.fullMinutes,
    microAction: template.microAction,
    microMinutes: template.microMinutes,
    days: template.days.slice(),
    startDate: getToday()
  });

  saveData();
  closeForm();
  showMessage("Routine added", template.name, "green");
  showRoutines();
}


function exportData() {
  const data = {
    routines: routines,
    logs: logs,
    checkins: checkins,
    settings: settings
  };

  const text = JSON.stringify(data, null, 2);
  const file = new Blob([text], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "optiroutine-backup-" + getToday() + ".json";
  document.body.appendChild(link);
  link.click();
  link.remove();

  showMessage("Backup saved", "Check your downloads folder.", "green");
}

function importData() {
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "application/json";

  picker.onchange = function () {
    const file = picker.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(reader.result);

        if (!data.routines || !Array.isArray(data.routines)) {
          showMessage("That file did not work", "It does not look like an OptiRoutine backup.", "red");
          return;
        }

        routines = data.routines;
        logs = data.logs || [];
        checkins = data.checkins || [];
        if (data.settings) {
          settings = data.settings;
        }

        saveData();
        showMessage("Backup loaded", routines.length + " routines restored.", "green");
        showRoutines();
      } catch (error) {
        showMessage("That file did not work", "The file could not be read.", "red");
      }
    };
    reader.readAsText(file);
  };

  picker.click();
}

function useDemoData() {
  const sure = confirm("Load the demo data? This replaces all your routines and history.");
  if (!sure) {
    return;
  }
  loadDemoData();
  showMessage("Demo data loaded", "4 routines and 12 weeks of history.", "green");
  showRoutines();
}

function eraseEverything() {
  const sure = confirm("Delete everything? All routines, logs and check-ins will be gone.");
  if (!sure) {
    return;
  }
  deleteAllData();
  showMessage("Everything deleted", "", "red");
  showRoutines();
}

showRoutines();