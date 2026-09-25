// event-feed.js - Notable operations event feed with filtering and camera fly-to

export class EventFeed {
  constructor(feedContainer, onSelectEventCallback) {
    this.container = feedContainer;
    this.onSelectEvent = onSelectEventCallback;
    this.events = [];
    this.currentMonth = 0;
  }

  setEvents(allEvents) {
    this.events = allEvents || [];
    this.render();
  }

  setCurrentMonth(month) {
    this.currentMonth = month;
    this.render();
  }

  render() {
    if (!this.container) return;

    // Filter events up to current month that are marked notable
    const visibleEvents = this.events
      .filter(e => e.month <= this.currentMonth && e.notable)
      .slice(-40) // Keep last 40 notable events
      .reverse();

    if (visibleEvents.length === 0) {
      this.container.innerHTML = `
        <div class="event-feed-empty">No critical operations incidents recorded yet.</div>
      `;
      return;
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const html = visibleEvents.map(e => {
      const monthLabel = `Y${e.year + 1}, ${monthNames[e.monthInYear]}`;
      const isEmergency = e.type === 'emergency' || e.type === 'replacement';
      const typeBadge = isEmergency ? '<span class="badge badge-emergency">CRITICAL</span>' : '<span class="badge badge-planned">SCHEDULED</span>';

      let description = '';
      if (e.type === 'emergency') {
        const failureTerm = e.assetType === 'bridge' ? 'Emergency closure at' : 'Failure at';
        description = `<strong>${failureTerm} ${e.assetId}</strong> on ${e.street}. ${e.residentsAffected.toLocaleString()} residents disrupted (${e.downtimeHours}h downtime). Emergency cost: <strong>$${e.cost.toLocaleString()}</strong>.`;
      } else if (e.type === 'replacement') {
        description = `<strong>Repeat Failure: Full replacement</strong> of ${e.assetId} on ${e.street}. Replacement cost: <strong>$${e.cost.toLocaleString()}</strong>.`;
      } else if (e.isPlannedReplacement) {
        description = `<strong>Capital Replacement: Planned renewal</strong> of ${e.assetId} on ${e.street}. Health restored to 100%. Cost: <strong>$${e.cost.toLocaleString()}</strong>.`;
      } else if (e.isRoutinePM) {
        description = `<strong>Routine Time-Based PM at ${e.assetId}</strong> on ${e.street}. Health restored to ${e.healthAfter}%. Cost: <strong>$${e.cost.toLocaleString()}</strong>.`;
      } else {
        description = `<strong>Sensor alert at ${e.assetId}</strong> on ${e.street}. Proactive overhaul completed. Health restored to ${e.healthAfter}%. Cost: <strong>$${e.cost.toLocaleString()}</strong>.`;
      }

      return `
        <div class="event-item ${isEmergency ? 'event-emergency' : 'event-planned'}" data-asset-id="${e.assetId}">
          <div class="event-header">
            <span class="event-time">${monthLabel}</span>
            ${typeBadge}
          </div>
          <div class="event-body">${description}</div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = html;

    // Attach click events to fly camera
    const items = this.container.querySelectorAll('.event-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const assetId = item.getAttribute('data-asset-id');
        if (this.onSelectEvent) {
          this.onSelectEvent(assetId);
        }
      });
    });
  }
}
