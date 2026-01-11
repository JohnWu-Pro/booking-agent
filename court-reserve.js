((window) => {

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function $A(cssSelector, container) {
  return (container ?? document).querySelectorAll(cssSelector);
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

function delay(millis, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), millis));
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
    if(this.#status !== 0 && this.#endTimestamp) {
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
    if(this.#status !== 0) setTimeout(() => this.#tick(), rem);
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

  #defaults
  #$elements
  #values

  constructor(selectors, defaults) {
    const $elements = {};
    for(const [key, _] of Object.entries(defaults)) {
      $elements[key] = $E(selectors[key]);
    }

    this.#defaults = defaults;
    this.#$elements = $elements;
  }

  get values() { return {...this.#values}; }

  load() {
    const item = localStorage.getItem(Settings.#key);
    const loaded = item ? JSON.parse(item) : {};

    const values = {}
    for(const [key, _default] of Object.entries(this.#defaults)) {
      values[key] = loaded[key] ?? _default;
    }

    this.#values = values;
  }

  resolveValues() {
    for(const [key, _default] of Object.entries(this.#defaults)) {
      const element = this.#$elements[key];
      let value = element.value;
      if(value) {
        if(isNumber(_default)) value = Number(value);
      } else {
        value = _default;
      }
      this.#values[key] = value;
    }
  }

  updateElements() {
    for(const [key, value] of Object.entries(this.#values)) {
      this.#$elements[key].value = value;
    }
  }

  save() {
    localStorage.setItem(Settings.#key, JSON.stringify(this.#values));
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
    align-items: center; /* vertically */
    z-index: 9000;
  }

  .booking-agent > .dashboard > .timer {
    color: black;
    padding: 0 3vw;
    display: block;
    font: normal 12vw 'Digital-7 Mono', sans-serif;
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
    bottom: 20vw;
    width: 96vw;
    background: white;
    border: 1px outset lightgrey;
    border-radius: 3px;
    z-index: 9002;
  }
  .booking-agent .header-panel {
    display: flex;
    background: rgb(224,224,224);
    padding: 0 1vw;
  }
  .booking-agent .header-panel .title {
    font-weight: bold;
    color: black;
  }
  .booking-agent .header-panel .ctrl {
    margin-left: auto;
    display: flex;
  }
  .booking-agent .header-panel .ctrl > .ctrl-btn {
    background: rgb(208,208,208);
    cursor: pointer;
    height: 24px;
    width: 24px;
    text-align: center;
  }
  .booking-agent .header-panel .ctrl > .ctrl-btn:nth-of-type(1) {
    margin-right: .8vw;
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
    width: 52vw;
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
      <div class="title">Booking Agent</div>
      <div class="ctrl">
        <div class="ctrl-btn help" onclick="window.open('https://johnwu-pro.github.io/booking-agent/index.html?section=overview')">ⓘ</div>
        <div class="ctrl-btn close" onclick="BookingAgent.dialog.close()">✕</div>
      </div>
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
          <option value="100">100ms</option>
          <option value="200">200ms</option>
          <option value="300">300ms</option>
          <option value="500">500ms</option>
          <option value="600">600ms</option>
          <option value="700">700ms</option>
          <option value="800">800ms</option>
          <option value="900">900ms</option>
          <option value="1000">1s</option>
        </select>
      </div>
      <div>
        <label for="preferredCourts">Preferred Courts:</label>
        <input name="preferredCourts" type="text" onchange="BookingAgent.onUpdateSettings()">
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
  start: 'Adjust the settings, then tap the button above.',
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
    bookingLeadTimeMillis: 700,
    preferredCourts: '6, 4, 5'
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
      if(bookableNow) return;

      $E(this.selector).style.display = 'flex';
      this.timer.tickDown(triggeringDateTime);
    },

    hide: function() {
      if(this.selector) {
        this.timer.stop();
        $E(this.selector).style.display = 'none';
      }
    },
  },

  dialog: {
    open: function() {
      BookingAgent.stop();

      $E('.booking-agent .backdrop').style.display = 'block';
      $E('.booking-agent .dialog').style.display = 'block';

      BookingAgent.settings.load();
      BookingAgent.settings.updateElements();

      this.update();

      BookingAgent.status = 'Loaded';
    },

    update: function() {
      // Based on settings and input form to update button label
      const form = BookingAgent.getFormData();
      BookingAgent.state = BookingAgent.resolveState(form, BookingAgent.settings.values);
      // console.debug('[DEBUG] BookingAgent.state: %o', BookingAgent.state);

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
    if(origin !== siteOrigin) {
      console.info('[INFO] Navigating to Mobile App login page.');
      window.location.assign(siteOrigin + loginPath);
      return false;
    }

    const [_, page, id] = pathname.match(knownPaths) ?? [];
    if(page && id) { // is known path
      if(page === '/Reservations/Index') {
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
    this.settings.resolveValues();
    this.dialog.update();
  },

  getFormData: function() {
    return new FormData($E('form#createReservation-Form'));
  },

  resolveSelectedCourt: function(form) {
    if(!form) form = this.getFormData();

    const courtId = form.get('CourtId');
    return (courtId && courtId.length >= 5) ? courtId.at(-1) : undefined;
  },

  resolveState: function(form, settings) {
    function resolveCourtsToTry(selectedCourt, preferredCourts) {
      console.debug('[DEBUG] selectedCourt: %o, preferredCourts: %o', selectedCourt, preferredCourts);
      const courts = (!preferredCourts || preferredCourts === 'none')
        ? []
        : preferredCourts.split(',').map(s => s.trim()).filter(s => /^\d+$/.test(s))
        ;

      return courts.filter(s => s !== selectedCourt);
    }

    console.debug('[DEBUG] form: %o', Object.fromEntries(form));
    const date = form.get('Date');
    const time = form.get('StartTime');
    const selectedCourt = this.resolveSelectedCourt(form);

    const selectedReservationDateTime = new Date(`${date.substring(0,10)} ${time}`);

    const triggeringDateTime = new Date(selectedReservationDateTime);
    const { reservationLeadDays, bookingLeadTimeMillis, preferredCourts } = settings;
    triggeringDateTime.setDate(triggeringDateTime.getDate() - reservationLeadDays);

    triggeringDateTime.setMilliseconds(triggeringDateTime.getMilliseconds() - bookingLeadTimeMillis);

    const bookableNow = triggeringDateTime.getTime() <= Date.now();
    const courtsToTry = bookableNow ? [] : resolveCourtsToTry(selectedCourt, preferredCourts);

    return {
      selectedReservationDateTime,
      triggeringDateTime,
      bookableNow,
      courtsToTry,
    };
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
      preferredCourts: 'input[name="preferredCourts"]',
    }, this.defaultSettings);

    this.dashboard.init('.booking-agent .dashboard');

    this.cmdButtons = {
      scheduleBooking: $E('.booking-agent .cmd-panel button#scheduleBooking'),
    };

    console.info('[INFO] Loaded Booking Agent successfully.');

    this.status = 'Loaded';
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

  stopScheduler: function() {
    if(this.scheduler !== 0) {
      clearTimeout(this.scheduler);
      this.scheduler = 0;
      this.status = 'Loaded';
    }
  },

  scheduleBooking: function() {
    this.settings.save();
    this.dialog.close();
    this.dashboard.show(this.state);

    this.stopScheduler();

    // Triggering/Scheduling booking confirmation
    const { bookableNow, triggeringDateTime } = this.state;
    const millis = bookableNow ? 0 : triggeringDateTime.getTime() - Date.now();
    this.status = 'Scheduled';
    this.scheduler = setTimeout(() => this.triggerBooking(), millis);
  },

  triggerBooking: async function() {
    if(this.status === 'Scheduled') {
      this.status = 'Booking';

      this.dashboard.hide();

      if(this.resolveSelectedCourt()) {
        await this.confirmAndRetry();
      } else if(await this.selectNextPreferredCourt()) {
        await this.confirmAndRetry();
      }

      this.status = 'Booked';
    }
  },

  confirmAndRetry: async function() {
    const selectors = {
      pageTitle: 'span.page-title',
      confirmButton: 'button[data-testid="Confirm"]',
      errorDialog: 'div.swal2-popup.swal2-modal',
      errorMessage: 'div#swal2-html-container',
      errorDialogOkButton: 'button.swal2-confirm'
    };

    async function waitForCompletion() {
      // When in-progress,
      //   confirm button innerHTML: ... <span class="btn-active-spinner"></span>
      // When done with error
      //   $E('span.page-title').innerText: Create Reservation
      //   confirm button innerHTML: Confirm
      // When succeeded,
      //   $E('span.page-title').innerText: Expanded
      //   confirm button not exist
      //
      // When error, $E('div#swal2-html-container')?.innerText:
      // -- reservation not open yet
      // John Doe is only allowed to reserve up to 1-13-2026, 10:07 PM
      // -- court is no longer available
      // Court Hard - Court #2 no longer available.
      // -- -- -- other non-retryable errors:
      // -- need more players
      // Doubles requires 3 additional players.
      // Singles requires 1 additional player.
      // -- 2 hours interval
      // -- up to 2 reservations
      while (true) {
        await delay(100);
        const button = $E(selectors.confirmButton);
        if(button) {
          if(button.innerHTML.includes('<span class="btn-active-spinner">')) {
            console.debug('[DEBUG] Confirm button is spinning ...');
            continue;
          } else if($E(selectors.errorDialog)) {
            console.debug('[DEBUG] Confirm button is normal, error dialog shows up.');
            const message = $E(selectors.errorMessage);
            if(message.match(/^(?<name>.+) is only allowed to reserve up to (?<time>.+)$/)) {
              return 'reservationNotOpenYet'
            } else if(message.match(/^(?<court>.+) no longer available.$/)) {
              return 'courtNoLongerAvailable'
            } else {
              return 'nonRetryableError'
            }
          } else {
            console.debug('[DEBUG] Confirm button is normal, waiting for error dialog ...');
            continue;
          }
        } else if($E(selectors.pageTitle).innerText === 'Expanded') {
          console.debug('[DEBUG] Confirm button not exists, navigated to Expanded page.');
          return 'succeeded';
        } else {
          console.debug('[DEBUG] Confirm button not exists, waiting for navigation to Expanded page ...');
          continue;
        }
      }
    }

    $E(selectors.confirmButton).click();
    const result = await waitForCompletion();
    switch(result) {
      case 'reservationNotOpenYet':
        $E(selectors.errorDialogOkButton).click();
        await this.confirmAndRetry();
        break;
      case 'courtNoLongerAvailable':
        $E(selectors.errorDialogOkButton).click();
        if(await this.selectNextPreferredCourt()) {
          await this.confirmAndRetry();
        }
        break;
      case 'succeeded':
        console.info('[INFO] Succeeded in confirming the booking.');
        break;
      default: // nonRetryableError
        console.error('[ERROR] A non-retryable error is encountered.');
    }
  },

  selectNextPreferredCourt: async function() {
    if(this.state.courtsToTry.length === 0) return false; // no more to try

    function selectCourt(options, courtId) {
      for(const option of options) {
        const [_, id] = option.innerText.match(/Hard - Court #(\d+)/)
        if(id === courtId) {
          option.click();
          return true; // court selected
        }
      }
      return false; // court not found
    }

    $E('span[aria-controls="CourtId_listbox"]').click();
    await delay(100);

    const options = $A('div.dynamic-ul-CourtId li[role="option"]');
    while (true) {
      const courtId = this.state.courtsToTry.shift();
      if(!courtId) break;

      if(selectCourt(options, courtId)) {
        return true; // try newly selected court
      } // else, try to select next preferred court
    }

    $E('span.close-mobile-bottom-modal').click();
    return false; // no more to try
  },

};
window.BookingAgent = BookingAgent;

try {
  if(BookingAgent.navigateToTargetPage()) {
    if(BookingAgent.initialized()) {
      BookingAgent.destroy();
    }

    BookingAgent.initialize();
  }
} catch (error) {
  console.error('[ERROR] Error occurred while initializing Booking Agent.', error);
}

})(window);
