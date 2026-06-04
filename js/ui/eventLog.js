(function () {
  "use strict";

  function renderEventLog(state, elements) {
    elements.transformationLog.innerHTML = "";
    (state.transformationLog || []).forEach(function (event) {
      if (!event.uiTimestamp) {
        event.uiTimestamp = formatLogTime(new Date());
      }
      var entry = document.createElement("p");
      entry.className = "transformation-log-entry";
      entry.dataset.transformationSeverity = event.severity || event.type || "";
      entry.dataset.transformationTrack = event.track || "";
      entry.innerHTML =
        '<span class="event-log-time">' +
        event.uiTimestamp +
        '</span><span class="event-log-message">' +
        event.message +
        "</span>";
      elements.transformationLog.appendChild(entry);
    });
    elements.transformationLog.scrollTop = elements.transformationLog.scrollHeight;
  }

  function formatLogTime(date) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  window.EventLog = {
    renderEventLog: renderEventLog,
    formatLogTime: formatLogTime
  };
})();
