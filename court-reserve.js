((window) => {

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function $E(cssSelector, container) {
  return (container ?? document).querySelector(cssSelector);
}

function create(tag, attributes) {
  const element = document.createElement(tag);
  for(let name in attributes) {
    element[name] = attributes[name];
  }
  return element;
}

function append(tag, attributes, container) {
  const element = create(tag, attributes);
  return (container ?? document.body).appendChild(element);
}

function toDateTimeStringWithoutTz(datetime) {
  const value = new Date(datetime);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().substring(0,19).replace('T', ' ')
      + '.' + value.getMilliseconds().toString().padStart(3, '0');
}

/**
 * A timer that can start (tick-up) or tick-down, and stop.
 */
class Timer {

  #endTimestamp
  #$element
  #status // 0: stopped, 1: ticking-up, 2: ticking-down

  constructor(selector) {
    this.#$element = $E(selector);
    this.#status = 0;

    this.#$element.addEventListener('click', () => this.#toggleTicking());
  }

  start() {
    this.tickUp();
  }

  tickUp() {
    this.#status = 1;
    this.#tick();
  }

  tickDown(endTimestamp) {
    this.#endTimestamp = endTimestamp;
    this.#status = 2;
    this.#tick();
  }

  stop() {
    this.#status = 0;
  }

  #toggleTicking() {
    if (this.#status !== 0 && this.#endTimestamp) {
      this.#status = this.#status === 1 ? 2 : 1;
      this.#tick();
    }
  }

  #tick() {
    const currentMillis = Date.now();
    this.#$element.innerHTML = Timer.format(this.#status === 1
      ? currentMillis - new Date(currentMillis).getTimezoneOffset() * 60000
      : this.#endTimestamp.getTime() - currentMillis
    );

    const rem = Math.ceil(currentMillis / 1000) * 1000 - currentMillis;
    if (this.#status !== 0) setTimeout(() => this.#tick(), rem);
  }

  static format(millis) {
    const mod = (n, d) => {
      let value = Math.floor(n/d)
      let rem = n - value * d
      return {value, rem}
    }

    const {rem: _day} = mod(millis, 3600000*24)
    const {value: hh, rem: _hour} = mod(_day, 3600000)
    const {value: mm, rem: _min} = mod(_hour, 60000)
    const {value: ss, rem: _sec} = mod(_min, 1000)

    const dd = (n) => n < 10 ? '0' + n : String(n)
    return `${dd(hh)}:${dd(mm)}:${dd(ss)}`
  }
}
window.Timer = Timer;

class Settings {
  static #key = 'court-reserve.booking-agent.settings'

  #$elements
  #default
  #value

  constructor(selectors, defaultValue) {
    this.#$elements = {};
    for (const [key, selector] of Object.entries(selectors)) {
      this.#$elements[key] = $E(selector);
    }
    this.#default = defaultValue;
  }

  get value() { return {...this.#value}; }

  load() {
    const item = localStorage.getItem(Settings.#key);
    const object = item ? JSON.parse(item) : {};
    this.#value = {...this.#default, ...object};
  }

  resolveValue() {
    for (const [key, element] of Object.entries(this.#$elements)) {
      const _default = this.#default[key];
      let value = element.value;
      if (value) {
        if (isNumber(_default)) value = Number(value);
      } else {
        value = _default;
      }
      this.#value[key] = value;
    }
  }

  updateElement() {
    for (const [key, value] of Object.entries(this.#value)) {
      this.#$elements[key].value = value;
    }
  }

  save() {
    localStorage.setItem(Settings.#key, JSON.stringify(this.#value));
  }
}
window.Settings = Settings;

var css = /*css*/`
  @import url('https://fonts.cdnfonts.com/css/digital-7-mono');

  .booking-agent > .menu {
    position: fixed;
    bottom: 20vw;
    right: 4vw;
    width: 12vw;
    height: 12vw;
    background: rgb(153, 182, 243);
    border: 1px dashed black;
    border-radius: 2vw;
    overflow: hidden;
    z-index: 9000;
  }
  .booking-agent > .menu > .menu-icon {
    color: rgb(192, 128, 0);
    font-size: 8vw;
    margin-top: -0.8vw;
    padding: 0 0 0 2.4vw;
    cursor: pointer;
  }
  .booking-agent > .menu > .menu-icon::after {
    content: '☰';
  }

  .booking-agent > .dashboard {
    display: none;
    position: fixed;
    bottom: 20vw;
    left: 24vw;
    width: auto;
    height: 12vw;
    background: rgba(224,224,224,0.95);
    border: none;
    border-radius: 2vw;
    z-index: 9000;
  }

  .booking-agent > .dashboard > .timer {
    color: black;
    padding: 0 3vw;
    display: inline-block;
    font: normal 12vw 'Digital-7 Mono', sans-serif;
    margin: auto;
    cursor: pointer;
  }

  .booking-agent > .backdrop {
    display: none;
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    background: rgba(224,224,224,0.4);
    z-index: 9001;
  }

  .booking-agent > .dialog {
    display: none;
    position: fixed;
    left: 2vw;
    top: 48vh;
    width: 96vw;
    background: white;
    border: 1px outset lightgrey;
    z-index: 9002;
  }
  .booking-agent .header-panel {
    background: rgb(224,224,224);
    padding: 0;
    width: 100%;
  }
  .booking-agent span.title {
    padding: 0 6px;
    float: left;
    font-weight: bold;
    color: black;
  }
  .booking-agent span.ctrl {
    padding: 0 6px;
    float: right;
  }
  .booking-agent span.ctrl > .ctrl-btn {
    font: bold large webdings;
    cursor: pointer;
  }

  .booking-agent .input-panel {
    padding: 4px 8px;
    text-align: left;
  }
  .booking-agent .input-panel > div {
    display: flex;
  }
  .booking-agent .input-panel > div:not(:first-of-type) {
    margin-top: 8px;
  }
  .booking-agent .input-panel label {
    width: 48vw;
    font-weight: normal;
  }
  .booking-agent .input-panel input {
    width: 36vw;
    border: 1px inset lightgrey;
    border-radius: 3px;
    padding-left: 4px;
  }
  .booking-agent .input-panel select {
    width: 36vw;
    border: 1px inset lightgrey;
    border-radius: 3px;
  }

  .booking-agent .cmd-panel {
    padding: 12px 8px 4px 8px;
    text-align: center;
  }

  .booking-agent .cmd-panel > .cmd {
    border: 1px outset rgb(153, 182, 243);
    border-radius: 6px;
    padding: 4px 12px;
    margin: 0;
    background: rgb(153, 182, 243);
    color: black;
    font-size: normal;
    font-weight: bold;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
  }

  .booking-agent .cmd-panel > .cmd.disabled {
    background: white;
    color: gray;
    cursor: default;
  }

  .booking-agent .msg-panel {
    background: rgb(224,224,255);
    padding: 0 0 0 6px;
    font-weight: bold;
    text-align: left;
  }

  .booking-agent .msg-panel > .success {
    color: green;
  }

  .booking-agent .msg-panel > .error {
    color: red;
  }

  .booking-agent .msg-panel > .info {
    color: blue;
  }
`;

var html = /*html*/`
  <div class="menu">
    <div class="menu-icon" onclick="BookingAgent.dialog.open()"></div>
  </div>
  <div class="dashboard">
    <div class="timer"></div>
  </div>
  <div class="backdrop"></div>
  <div class="dialog">
    <div class="header-panel">
      <span class="title">Booking Agent</span>&nbsp;
      <span class="ctrl">
        <span class="ctrl-btn close" onclick="BookingAgent.dialog.close()">✕</span>
      </span>
    </div>
    <div class="input-panel">
      <div>
        <label for="reservationLeadDays">Reservation Lead Days:</label>
        <input name="reservationLeadDays" type="number" onchange="BookingAgent.onUpdateSettings()">
      </div>
      <div>
        <label for="bookingLeadTimeMillis">Booking Lead Time:</label>
        <select name="bookingLeadTimeMillis" onchange="BookingAgent.onUpdateSettings()">
          <option value="0">0</option>
          <option value="50">50ms</option>
          <option value="100">100ms</option>
          <option value="200">200ms</option>
          <option value="300">300ms</option>
          <option value="500">500ms</option>
        </select>
      </div>
    </div>
    <div class="cmd-panel">
      <button type="button" id="scheduleBooking" class="cmd" onclick="BookingAgent.scheduleBooking()">Schedule Booking</button>
    </div>
    <div class="msg-panel">
      <span class="info"></span>
    </div>
  </div>
`;

var messages = {
  start: 'Adjust the Booking Lead Time, then tap the button above.',
};

var BookingAgent = {
  site: {
    origin: 'https://mobileapp.courtreserve.com',
    loginPath: '/Account/Login',
    reservationPrefix: '/Online/Reservations/Index/',
    knownPaths: new RegExp('^/Online'
      + '(/Portal/Index'
      + '|/Portal/Navigate'
      + '|/Reservations/Index'
      + '|/Calendar/Events'
      + '|/Notification/List'
      + ')'
      + '/(\\d+)$'),
  },

  state: {},

  status: 'Unloaded', // Unloaded, Loaded, Scheduled, Booking, Booked

  defaultSettings: {
    reservationLeadDays: 10,
    bookingLeadTimeMillis: 100,
  },

  settings: undefined,

  scheduler: 0,

  cmdButtons: {},

  dashboard: {
    selector: undefined,
    timer: undefined,

    init: function(selector) {
      this.selector = selector;
      this.timer = new Timer(`${selector} div.timer`);
    },

    show: function(state) {
      const { bookableNow, triggeringDateTime } = state;
      if (bookableNow) return;

      $E(this.selector).style.display = 'block';
      this.timer.tickDown(triggeringDateTime);
    },

    hide: function() {
      if (this.selector) {
        this.timer.stop();
        $E(this.selector).style.display = 'none';
      }
    },
  },

  dialog: {
    open: function() {
      BookingAgent.dashboard.hide();

      $E('.booking-agent .backdrop').style.display = 'block';
      $E('.booking-agent .dialog').style.display = 'block';

      BookingAgent.settings.load();
      BookingAgent.settings.updateElement();

      this.update();

      BookingAgent.status = 'Loaded';
    },

    update: function() {
      // Based on settings and input form to update button label
      const form = new FormData($E('form#createReservation-Form'));
      BookingAgent.state = BookingAgent.resolveState(form, BookingAgent.settings.value);

      const { bookableNow, triggeringDateTime } = BookingAgent.state;
      BookingAgent.cmdButtons.scheduleBooking.innerHTML = bookableNow
        ? 'Book Now'
        : 'Schedule Booking at' + '<br>' + toDateTimeStringWithoutTz(triggeringDateTime);

      $E('.booking-agent .msg-panel > span').innerText = messages.start;
    },

    close: function() {
      $E('.booking-agent .backdrop').style.display = 'none';
      $E('.booking-agent .dialog').style.display = 'none';
    },
  },

  navigateToTargetPage: function() {
    const { origin, pathname } = window.location
    const { origin: siteOrigin, loginPath, reservationPrefix, knownPaths } = this.site;
    if (origin !== siteOrigin) {
      console.info('[INFO] Navigating to Mobile App login page.');
      window.location.assign(siteOrigin + loginPath);
      return false;
    }

    const [_, page, id] = pathname.match(knownPaths) ?? [];
    if (page && id) { // is known path
      if (page === '/Reservations/Index') {
        return true;
      } else {
        console.info('[INFO] Navigating to Mobile App reservations page.');
        window.location.assign(siteOrigin + reservationPrefix + id);
        return false;
      }
    } else {
      console.info('[INFO] Navigating to Mobile App home page.');
      $E('button[data-testid="Home"]').click();
      return false;
    }
  },

  onUpdateSettings: function() {
    this.settings.resolveValue();
    this.dialog.update();
  },

  resolveState: function(form, settings) {
    // Resolve the selected reservation date and time
    const date = form.get('Date');
    const time = form.get('StartTime');

    const selectedReservationDateTime = new Date(`${date.substring(0,10)} ${time}`);

    const triggeringDateTime = new Date(selectedReservationDateTime);
    const { reservationLeadDays, bookingLeadTimeMillis } = settings;
    triggeringDateTime.setDate(triggeringDateTime.getDate() - reservationLeadDays);

    triggeringDateTime.setMilliseconds(triggeringDateTime.getMilliseconds() - bookingLeadTimeMillis);

    const bookableNow = triggeringDateTime.getTime() <= Date.now();

    return { selectedReservationDateTime, bookableNow, triggeringDateTime };
  },

  initialized: function() {
    return Boolean($E('style#booking-agent'));
  },

  initialize: function() {
    append('style', {id: "booking-agent", type: "text/css"}, document.head).innerHTML = css;
    append('div', {className: "booking-agent"}).innerHTML = html;

    this.settings = new Settings({
      reservationLeadDays: 'input[name="reservationLeadDays"]',
      bookingLeadTimeMillis: 'select[name="bookingLeadTimeMillis"]',
    }, this.defaultSettings);

    this.dashboard.init('.booking-agent .dashboard');

    this.cmdButtons = {
      scheduleBooking: $E('.booking-agent .cmd-panel button#scheduleBooking'),
    };

    console.info('[INFO] Loaded Booking Agent successfully.');

    this.status = 'Loaded';
  },

  stopScheduler: function() {
    if (this.scheduler !== 0) {
      clearTimeout(this.scheduler);
      this.scheduler = 0;
      this.status = 'Loaded';
    }
  },

  stop: function() {
    this.dashboard.hide();
    this.stopScheduler();
  },

  destroy: function() {
    this.stop();

    $E('.booking-agent').remove();
    $E('style#booking-agent').remove();
  },

  scheduleBooking: function() {
    this.settings.save();
    this.dialog.close();
    this.dashboard.show(this.state);

    this.stopScheduler();

    // Triggering/Scheduling booking process
    const { bookableNow, triggeringDateTime } = this.state;
    const millis = bookableNow ? 0 : triggeringDateTime.getTime() - Date.now();
    this.status = 'Scheduled';
    this.scheduler = setTimeout(() => this.confirmBooking(), millis);
  },

  confirmBooking: function() {
    if (this.status === 'Scheduled') {
      this.status = 'Booking';

      this.dashboard.hide();
      console.info('[INFO] Trigering booking process ...');
      $E('button[data-testid="Confirm"]').click();
      this.status = 'Booked';
    }
  }

};
window.BookingAgent = BookingAgent;

try {
  if (BookingAgent.navigateToTargetPage()) {
    if (BookingAgent.initialized()) {
      BookingAgent.destroy();
    }

    BookingAgent.initialize();
  }
} catch (error) {
  console.error('[ERROR] Error occurred while initializing Booking Agent.', error);
}

})(window);
