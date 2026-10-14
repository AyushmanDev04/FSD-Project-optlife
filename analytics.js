let howManyDays = 30;
let chosenRoutine = "";


const colourFull = "#5b4bd6";
const colourMicro = "#e08b2a";
const colourMissed = "#d8d8e0";



function getFromDate() {
  return addDays(getToday(), -(howManyDays - 1));
}


function makeBarRow(label, percent, extraText) {
  const width = Math.round(percent * 100);

  let title = label;
  if (extraText) {
    title = label + " - " + extraText;
  }

  return "<div class='bar-line' title=\"" + escapeHtml(title) + "\">" +
           "<div class='bar-label'>" + escapeHtml(label) + "</div>" +
           "<div class='bar-track'>" +
             "<div class='bar-fill' style='width:" + width + "%'></div>" +
           "</div>" +
           "<div class='bar-value'>" + width + "%</div>" +
         "</div>";
}

/* ===================================================
   The four boxes at the top
   =================================================== */

function showTopBoxes() {
  const today = getToday();
  const fromDate = getFromDate();
  const stats = getStats(fromDate, today, chosenRoutine);

  document.getElementById("an-percent").innerText = Math.round(stats.percent * 100) + "%";

  // compare against the same number of days before this range
  const olderTo = addDays(fromDate, -1);
  const olderFrom = addDays(olderTo, -(howManyDays - 1));
  const older = getStats(olderFrom, olderTo, chosenRoutine);

  const compareBox = document.getElementById("an-compare");
  if (older.scheduled === 0) {
    compareBox.innerText = stats.done + " of " + stats.scheduled + " routines";
  } else {
    const difference = Math.round((stats.percent - older.percent) * 100);
    if (difference > 1) {
      compareBox.innerHTML = "<span class='green-text'>up " + difference + " points</span> on the " + howManyDays + " days before";
    } else if (difference < -1) {
      compareBox.innerHTML = "<span class='red-text'>down " + Math.abs(difference) + " points</span> on the " + howManyDays + " days before";
    } else {
      compareBox.innerText = "about the same as the " + howManyDays + " days before";
    }
  }

  document.getElementById("an-micro").innerText = stats.micro;
  if (stats.done > 0) {
    document.getElementById("an-micro-note").innerText =
      Math.round(stats.micro / stats.done * 100) + "% of everything you completed";
  } else {
    document.getElementById("an-micro-note").innerText = "days that would have been missed";
  }

  // the best streak out of the routines being shown
  let whichRoutines = routines;
  if (chosenRoutine !== "") {
    whichRoutines = [getRoutine(chosenRoutine)];
  }

  let bestStreak = 0;
  let bestName = "-";
  for (let i = 0; i < whichRoutines.length; i++) {
    if (whichRoutines[i] === null) {
      continue;
    }
    const streak = getBestStreak(whichRoutines[i].id);
    if (streak > bestStreak) {
      bestStreak = streak;
      bestName = whichRoutines[i].name;
    }
  }
  document.getElementById("an-streak").innerText = bestStreak;
  document.getElementById("an-streak-name").innerText = bestName;

  // how many days have a check-in
  const days = getDateList(fromDate, today);
  let filledIn = 0;
  for (let i = 0; i < days.length; i++) {
    if (getCheckin(days[i]) !== null) {
      filledIn = filledIn + 1;
    }
  }
  document.getElementById("an-checkins").innerText = Math.round(filledIn / days.length * 100) + "%";
}


function getWeeks() {
  const today = getToday();
  const fromDate = getFromDate();
  const weeks = [];

  let start = fromDate;
  while (start <= today) {
   
    let end = addDays(start, 6);
    if (end > today) {
      end = today;
    }

    weeks.push({
      start: start,
      end: end,
      stats: getStats(start, end, chosenRoutine)
    });

    start = addDays(end, 1);
  }
  return weeks;
}

function showWeeksChart() {
  const weeks = getWeeks();
  const area = document.getElementById("chart-weeks");

  let html = "<div class='bar-chart'>";
  let anyData = false;

  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].stats.scheduled === 0) {
      continue;
    }
    anyData = true;
    html = html + makeBarRow(
      "Week of " + shortDate(weeks[i].start),
      weeks[i].stats.percent,
      weeks[i].stats.done + " of " + weeks[i].stats.scheduled + " completed"
    );
  }
  html = html + "</div>";

  if (!anyData) {
    html = "<p class='form-help'>Nothing was scheduled in this range.</p>";
  }
  area.innerHTML = html;
}

/* ===================================================
   Chart 2 - how each week ended (stacked columns)
   =================================================== */

function showOutcomesChart() {
  const weeks = getWeeks();
  const area = document.getElementById("chart-outcomes");

   
  let biggest = 1;
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].stats.scheduled > biggest) {
      biggest = weeks[i].stats.scheduled;
    }
  }

  let html = "<div class='column-chart'>";

  for (let i = 0; i < weeks.length; i++) {
    const stats = weeks[i].stats;

    
    const columnHeight = Math.round(stats.scheduled / biggest * 150);

    let fullHeight = 0;
    let microHeight = 0;
    let missedHeight = 0;
    if (stats.scheduled > 0) {
      fullHeight = Math.round(stats.full / stats.scheduled * columnHeight);
      microHeight = Math.round(stats.micro / stats.scheduled * columnHeight);
      missedHeight = columnHeight - fullHeight - microHeight;
    }

    const tooltip = "Week of " + shortDate(weeks[i].start) + ": " +
                    stats.full + " full, " + stats.micro + " small, " + stats.missed + " missed";

    html = html +
      "<div class='column-holder' title=\"" + escapeHtml(tooltip) + "\">" +
        "<div class='column-bar'>" +
          "<div class='column-part' style='height:" + missedHeight + "px;background-color:" + colourMissed + "'></div>" +
          "<div class='column-part' style='height:" + microHeight + "px;background-color:" + colourMicro + "'></div>" +
          "<div class='column-part' style='height:" + fullHeight + "px;background-color:" + colourFull + "'></div>" +
        "</div>" +
        "<div class='column-label'>" + shortDate(weeks[i].start) + "</div>" +
      "</div>";
  }

  html = html + "</div>";
  area.innerHTML = html;

  document.getElementById("key-outcomes").innerHTML =
    "<span style='background-color:" + colourFull + "'></span> Full version &nbsp; " +
    "<span style='background-color:" + colourMicro + "'></span> Small version &nbsp; " +
    "<span style='background-color:" + colourMissed + "'></span> Missed";
}

/* ===================================================
   Chart 3 - each routine
   =================================================== */

function showRoutinesChart() {
  const today = getToday();
  const fromDate = getFromDate();
  const area = document.getElementById("chart-routines");

  if (routines.length === 0) {
    area.innerHTML = "<p class='form-help'>No routines yet.</p>";
    return;
  }

  // work out the percentage for each routine
  const rows = [];
  for (let i = 0; i < routines.length; i++) {
    const stats = getStats(fromDate, today, routines[i].id);
    rows.push({
      name: routines[i].emoji + " " + routines[i].name,
      percent: stats.percent,
      note: stats.done + " of " + stats.scheduled + " completed"
    });
  }

  // put the best one at the top
  rows.sort(function (a, b) {
    return b.percent - a.percent;
  });

  let html = "<div class='bar-chart'>";
  for (let i = 0; i < rows.length; i++) {
    html = html + makeBarRow(rows[i].name, rows[i].percent, rows[i].note);
  }
  html = html + "</div>";
  area.innerHTML = html;
}

/* ===================================================
   Chart 4 - each day of the week
   =================================================== */

function showDaysChart() {
  const today = getToday();
  const fromDate = getFromDate();
  const days = getDateList(fromDate, today);
  const area = document.getElementById("chart-days");

  // add up the totals for each day of the week
  const totals = [];
  for (let i = 0; i < 7; i++) {
    totals.push({ scheduled: 0, done: 0 });
  }

  for (let i = 0; i < days.length; i++) {
    const stats = getStats(days[i], days[i], chosenRoutine);
    const dayNumber = getDayNumber(days[i]);
    totals[dayNumber].scheduled = totals[dayNumber].scheduled + stats.scheduled;
    totals[dayNumber].done = totals[dayNumber].done + stats.done;
  }

  let html = "<div class='bar-chart'>";
  let anyData = false;

  for (let i = 0; i < 7; i++) {
    if (totals[i].scheduled === 0) {
      continue;
    }
    anyData = true;
    html = html + makeBarRow(
      dayNamesLong[i],
      totals[i].done / totals[i].scheduled,
      totals[i].done + " of " + totals[i].scheduled + " completed"
    );
  }
  html = html + "</div>";

  if (!anyData) {
    html = "<p class='form-help'>Nothing was scheduled in this range.</p>";
  }
  area.innerHTML = html;
}

/* ===================================================
   Chart 5 - energy against completion
   =================================================== */

function showEnergyChart() {
  const today = getToday();
  const fromDate = getFromDate();
  const days = getDateList(fromDate, today);
  const area = document.getElementById("chart-energy");

  // group the days by the energy level written down that day
  const groups = [];
  for (let i = 0; i < 5; i++) {
    groups.push({ dayCount: 0, scheduled: 0, done: 0 });
  }

  // these two lists are used for the correlation number
  const energyValues = [];
  const percentValues = [];

  for (let i = 0; i < days.length; i++) {
    const checkin = getCheckin(days[i]);
    if (checkin === null) {
      continue;
    }

    const stats = getStats(days[i], days[i], chosenRoutine);
    if (stats.scheduled === 0) {
      continue;
    }

    const group = groups[checkin.energy - 1];
    group.dayCount = group.dayCount + 1;
    group.scheduled = group.scheduled + stats.scheduled;
    group.done = group.done + stats.done;

    energyValues.push(checkin.energy);
    percentValues.push(stats.percent);
  }

  // draw the bars
  let html = "<div class='bar-chart'>";
  let anyData = false;

  for (let i = 0; i < 5; i++) {
    if (groups[i].scheduled === 0) {
      continue;
    }
    anyData = true;
    html = html + makeBarRow(
      energyWords[i] + " energy",
      groups[i].done / groups[i].scheduled,
      groups[i].dayCount + " days"
    );
  }
  html = html + "</div>";

  if (!anyData) {
    html = "<p class='form-help'>Fill in a few daily check-ins and this chart will appear.</p>";
    area.innerHTML = html;
    document.getElementById("correlation-text").innerText = "";
    return;
  }
  area.innerHTML = html;

  // now say how strong the link is
  const correlation = getCorrelation(energyValues, percentValues);
  const textArea = document.getElementById("correlation-text");

  if (correlation === null) {
    textArea.innerText = "There is not enough data yet to work out how strong the link is.";
    return;
  }

  let strength;
  const size = Math.abs(correlation);
  if (size >= 0.6) {
    strength = "strong";
  } else if (size >= 0.35) {
    strength = "medium";
  } else if (size >= 0.15) {
    strength = "weak";
  } else {
    strength = "almost no";
  }

  let direction = "positive";
  if (correlation < 0) {
    direction = "negative";
  }

  let explanation;
  if (size >= 0.35 && correlation > 0) {
    explanation = " Low energy days really are the days you miss things, which is exactly what the small version is for.";
  } else if (correlation < 0) {
    explanation = " That is backwards from what you would expect, so it is worth checking the check-ins are being filled in on the right day.";
  } else {
    explanation = " Energy is not making much difference here, so either the routines are already the right size or there is not enough data yet.";
  }

  textArea.innerHTML =
    "The correlation is <b>" + correlation.toFixed(2) + "</b> across " + energyValues.length +
    " days, which is a " + strength + " " + direction + " link." + explanation;
}

// works out how closely two lists of numbers move together.
// the answer is between -1 and 1.
function getCorrelation(listA, listB) {
  const count = listA.length;
  if (count < 3) {
    return null;
  }

  // the average of each list
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < count; i++) {
    sumA = sumA + listA[i];
    sumB = sumB + listB[i];
  }
  const averageA = sumA / count;
  const averageB = sumB / count;

  let top = 0;
  let bottomA = 0;
  let bottomB = 0;

  for (let i = 0; i < count; i++) {
    const differenceA = listA[i] - averageA;
    const differenceB = listB[i] - averageB;
    top = top + differenceA * differenceB;
    bottomA = bottomA + differenceA * differenceA;
    bottomB = bottomB + differenceB * differenceB;
  }

  const bottom = Math.sqrt(bottomA * bottomB);

  // if every number is the same there is nothing to compare
  if (bottom === 0) {
    return null;
  }

  return top / bottom;
}

/* ===================================================
   Chart 6 - the calendar of squares
   =================================================== */

function showCalendar() {
  const today = getToday();
  const fromDate = getFromDate();
  const days = getDateList(fromDate, today);
  const area = document.getElementById("calendar");

  let html = "";
  let weekHtml = "";

  // start the first column with blank squares so the rows line up with the weekdays
  const firstDayNumber = getDayNumber(days[0]);
  for (let i = 0; i < firstDayNumber; i++) {
    weekHtml = weekHtml + "<div class='calendar-day' style='background-color:transparent'></div>";
  }

  for (let i = 0; i < days.length; i++) {
    const stats = getStats(days[i], days[i], chosenRoutine);

    let colour;
    let tooltip;

    if (stats.scheduled === 0) {
      colour = "#f2f2f6";
      tooltip = shortDate(days[i]) + ": nothing scheduled";
    } else {
      colour = getSquareColour(stats.percent);
      tooltip = shortDate(days[i]) + ": " + stats.done + " of " + stats.scheduled + " completed";
    }

    weekHtml = weekHtml +
      "<div class='calendar-day' style='background-color:" + colour + "' title=\"" + escapeHtml(tooltip) + "\"></div>";

  
    if (getDayNumber(days[i]) === 6) {
      html = html + "<div class='calendar-week'>" + weekHtml + "</div>";
      weekHtml = "";
    }
  }

 
  if (weekHtml !== "") {
    html = html + "<div class='calendar-week'>" + weekHtml + "</div>";
  }

  area.innerHTML = html;

  document.getElementById("calendar-key").innerHTML =
    "None &nbsp;" +
    "<span style='background-color:" + getSquareColour(0) + "'></span>" +
    "<span style='background-color:" + getSquareColour(0.3) + "'></span>" +
    "<span style='background-color:" + getSquareColour(0.6) + "'></span>" +
    "<span style='background-color:" + getSquareColour(1) + "'></span>" +
    "&nbsp; All done";
}


function getSquareColour(percent) {
  if (percent === 0) {
    return "#e4e4ec";
  }
  if (percent <= 0.34) {
    return "#c3bcee";
  }
  if (percent <= 0.67) {
    return "#9287e2";
  }
  if (percent < 1) {
    return "#7062da";
  }
  return "#5b4bd6";
}


function showInsights() {
  const today = getToday();
  const fromDate = getFromDate();
  const stats = getStats(fromDate, today, chosenRoutine);
  const area = document.getElementById("insight-list");

  const found = [];


  if (stats.micro > 0) {
    let percentOfDone = 0;
    if (stats.done > 0) {
      percentOfDone = Math.round(stats.micro / stats.done * 100);
    }
    found.push({
      emoji: "🛠️",
      title: stats.micro + " routines were saved by the small version",
      text: "That is " + percentOfDone + "% of everything you completed. Without the small version those would have been " +
            stats.micro + " broken streaks."
    });
  }

  const halfWay = Math.floor(howManyDays / 2);
  const recent = getStats(addDays(today, -(halfWay - 1)), today, chosenRoutine);
  const earlier = getStats(fromDate, addDays(today, -halfWay), chosenRoutine);

  if (recent.scheduled > 0 && earlier.scheduled > 0) {
    const difference = Math.round((recent.percent - earlier.percent) * 100);
    if (Math.abs(difference) >= 5) {
      let word = "gone up";
      let emoji = "📈";
      if (difference < 0) {
        word = "gone down";
        emoji = "📉";
      }
      found.push({
        emoji: emoji,
        title: "Your completion has " + word + " by " + Math.abs(difference) + " points",
        text: "The last " + halfWay + " days were " + Math.round(recent.percent * 100) +
              "%, and the " + halfWay + " days before that were " + Math.round(earlier.percent * 100) + "%."
      });
    }
  }

  // 3. the best and worst day of the week
  const days = getDateList(fromDate, today);
  const totals = [];
  for (let i = 0; i < 7; i++) {
    totals.push({ scheduled: 0, done: 0 });
  }
  for (let i = 0; i < days.length; i++) {
    const dayStats = getStats(days[i], days[i], chosenRoutine);
    const dayNumber = getDayNumber(days[i]);
    totals[dayNumber].scheduled = totals[dayNumber].scheduled + dayStats.scheduled;
    totals[dayNumber].done = totals[dayNumber].done + dayStats.done;
  }

  let worstDay = -1;
  let bestDay = -1;
  for (let i = 0; i < 7; i++) {
    // only count days that came up at least 3 times, otherwise it is just luck
    if (totals[i].scheduled < 3) {
      continue;
    }
    const percent = totals[i].done / totals[i].scheduled;
    if (worstDay === -1 || percent < totals[worstDay].done / totals[worstDay].scheduled) {
      worstDay = i;
    }
    if (bestDay === -1 || percent > totals[bestDay].done / totals[bestDay].scheduled) {
      bestDay = i;
    }
  }

  if (worstDay !== -1 && bestDay !== -1 && worstDay !== bestDay) {
    const worstPercent = Math.round(totals[worstDay].done / totals[worstDay].scheduled * 100);
    const bestPercent = Math.round(totals[bestDay].done / totals[bestDay].scheduled * 100);

    if (bestPercent - worstPercent >= 15) {
      found.push({
        emoji: "📅",
        title: dayNamesLong[worstDay] + "s are your weakest day",
        text: worstPercent + "% on " + dayNamesLong[worstDay] + "s compared to " + bestPercent + "% on " +
              dayNamesLong[bestDay] + "s. It might be worth setting a smaller target on that day."
      });
    }
  }

  
  if (chosenRoutine === "" && routines.length >= 2) {
    let worstRoutine = null;
    let worstPercent = 1;

    for (let i = 0; i < routines.length; i++) {
      const routineStats = getStats(fromDate, today, routines[i].id);
      if (routineStats.scheduled < 4) {
        continue;
      }
      if (routineStats.percent < worstPercent) {
        worstPercent = routineStats.percent;
        worstRoutine = routines[i];
      }
    }

    if (worstRoutine !== null && worstPercent < 0.5) {
      let advice;
      if (worstRoutine.microAction === "") {
        advice = "It does not have a small version, so there is nothing to fall back to on a bad day. Adding one would help.";
      } else {
        advice = "A routine that fails more than half the time is usually too big rather than a willpower problem. Try making the full version smaller.";
      }
      found.push({
        emoji: "⚠️",
        title: '"' + worstRoutine.name + '" is only at ' + Math.round(worstPercent * 100) + "%",
        text: advice
      });
    }
  }

  
  let filledIn = 0;
  for (let i = 0; i < days.length; i++) {
    if (getCheckin(days[i]) !== null) {
      filledIn = filledIn + 1;
    }
  }
  if (filledIn / days.length < 0.5) {
    found.push({
      emoji: "🔋",
      title: "You are not filling in many check-ins",
      text: "Only " + filledIn + " of " + days.length + " days have one. Without them the app assumes an average day " +
            "and almost never suggests the small version."
    });
  }


  if (found.length === 0) {
    found.push({
      emoji: "🌱",
      title: "Not enough history yet",
      text: "Keep logging your routines. Once there are a couple of weeks of data this section will fill up."
    });
  }

  let html = "";
  for (let i = 0; i < found.length; i++) {
    html = html +
      "<div style='padding:10px 0;border-bottom:1px solid #eeeef4'>" +
        "<b>" + found[i].emoji + " " + escapeHtml(found[i].title) + "</b>" +
        "<p style='margin:4px 0 0 0;color:#666666;font-size:14px'>" + escapeHtml(found[i].text) + "</p>" +
      "</div>";
  }
  area.innerHTML = html;
}

function showTable() {
  const weeks = getWeeks();

  let html = "<table>" +
    "<tr><th>Week starting</th><th>Scheduled</th><th>Full</th><th>Small</th><th>Missed</th><th>Completed</th></tr>";

  for (let i = 0; i < weeks.length; i++) {
    const stats = weeks[i].stats;
    let percentText = "-";
    if (stats.scheduled > 0) {
      percentText = Math.round(stats.percent * 100) + "%";
    }

    html = html + "<tr>" +
      "<td>" + shortDate(weeks[i].start) + "</td>" +
      "<td>" + stats.scheduled + "</td>" +
      "<td>" + stats.full + "</td>" +
      "<td>" + stats.micro + "</td>" +
      "<td>" + stats.missed + "</td>" +
      "<td>" + percentText + "</td>" +
      "</tr>";
  }

  html = html + "</table>";
  document.getElementById("table-area").innerHTML = html;
}

function toggleTable(button) {
  const area = document.getElementById("table-area");

  if (area.className === "hidden") {
    area.className = "";
    button.innerText = "Hide the table";
  } else {
    area.className = "hidden";
    button.innerText = "Show the table";
  }
}

function fillRoutineDropdown() {
  const dropdown = document.getElementById("select-routine");
  dropdown.innerHTML = "<option value=''>All routines</option>";

  for (let i = 0; i < routines.length; i++) {
    const option = document.createElement("option");
    option.value = routines[i].id;
    option.innerText = routines[i].emoji + " " + routines[i].name;
    dropdown.appendChild(option);
  }


  if (getRoutine(chosenRoutine) === null) {
    chosenRoutine = "";
  }
  dropdown.value = chosenRoutine;
}

function changeRange() {
  howManyDays = Number(document.getElementById("select-days").value);
  refreshCharts();
}

function changeRoutine() {
  chosenRoutine = document.getElementById("select-routine").value;
  refreshCharts();
}

function loadDemoAndRefresh() {
  loadDemoData();
  fillRoutineDropdown();
  refreshCharts();
  showMessage("Demo data loaded", "4 routines and 12 weeks of history.", "green");
}



function refreshCharts() {
 
  if (routines.length === 0) {
    document.getElementById("everything").className = "hidden";
    document.getElementById("no-data").className = "";
    return;
  }

  document.getElementById("everything").className = "";
  document.getElementById("no-data").className = "hidden";

  showTopBoxes();
  showInsights();
  showWeeksChart();
  showOutcomesChart();
  showRoutinesChart();
  showDaysChart();
  showEnergyChart();
  showCalendar();
  showTable();
}

fillRoutineDropdown();
refreshCharts();