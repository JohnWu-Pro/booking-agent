(async (window) => {

function $A(cssSelector, container) {
  return (container ?? document).querySelectorAll(cssSelector);
}

function $E(cssSelector, container) {
  return (container ?? document).querySelector(cssSelector);
}

function append(tag, attributes, container) {
  let element = document.createElement(tag);
  for(let name in attributes) {
    element[name] = attributes[name];
  }
  return (container ?? document.body).appendChild(element);
}

function delay(millis, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), millis));
}

function padLeft(value, minLength, charToPad = '0') {
  let result = new String(value)
  while(result.length < minLength) result = charToPad + result
  return result
}

function dateString(date) {
  return `${padLeft(date.getDate(), 2)}/${padLeft(date.getMonth()+1, 2)}/${date.getFullYear()}`;
}

function timeString(date) {
  var hours = date.getHours();
  const ampm = hours < 12 ? 'AM' : 'PM';
  if (hours > 12) hours -= 12;
  return `${padLeft(hours, 2)}:${padLeft(date.getMinutes(), 2)} ${ampm}`;
}

function addOneHour(time) {
  const date = new Date('2025-11-15 ' + time);
  date.setHours(date.getHours() + 1);
  return timeString(date);
}

function halfHourRoundDown(time) {
  const date = new Date('2025-11-15 ' + time);
  date.setMinutes(Math.floor(date.getMinutes() / 30) * 30);
  return timeString(date);
}

function halfHourRoundUp(time) {
  const date = new Date('2025-11-15 ' + time);
  date.setMinutes(Math.ceil(date.getMinutes() / 30) * 30);
  return timeString(date);
}

function toDatetime(dateString, timeString) {
  const [_, dd, MM, yyyy] = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return new Date(`${yyyy}-${MM}-${dd} ${timeString}`);
}

function sendEscapeKeyToElement(element) {
  // Create a new KeyboardEvent for the 'keydown' event
  const escapeKeyEvent = new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    keyCode: 27, // Deprecated, but included for broader compatibility
    which: 27, // Deprecated, but included for broader compatibility
    bubbles: true, // Allow the event to bubble up the DOM tree
    cancelable: true // Allow the event to be canceled
  });

  // Dispatch the event to the target element
  element.dispatchEvent(escapeKeyEvent);
}

class Scheduler {

  #scheduledRefreshDatetimes
  #refreshIndex = 0
  #refreshIntervalInMillis

  constructor({
    startDatetime,
    testRefreshIntervalInMillis = 5000,
    refreshIntervalInMillis = 500,
    initRefreshGraceInMillis = 50,
    keepAliveIntervalInMinutes = 5
  }) {
    const testRefreshDatetime = new Date();
    testRefreshDatetime.setMilliseconds(testRefreshDatetime.getMilliseconds() + testRefreshIntervalInMillis);

    var datetime = new Date(startDatetime);
    datetime.setMilliseconds(datetime.getMilliseconds() + initRefreshGraceInMillis);

    const scheduledRefreshDatetimes = [];
    while (testRefreshDatetime < datetime) {
      scheduledRefreshDatetimes.push(new Date(datetime));
      datetime.setMinutes(datetime.getMinutes() - keepAliveIntervalInMinutes);
    }
    if (testRefreshDatetime < startDatetime) {
      scheduledRefreshDatetimes.push(testRefreshDatetime);
    }

    this.#scheduledRefreshDatetimes = scheduledRefreshDatetimes.reverse();
    // console.debug('[DEBUG] this.#scheduledRefreshDatetimes: %o', this.#scheduledRefreshDatetimes);
    this.#refreshIntervalInMillis = refreshIntervalInMillis;
  }

  nextIntervalInMillis() {
    if (this.#refreshIndex >= this.#scheduledRefreshDatetimes.length) {
      return this.#refreshIntervalInMillis;
    } else {
      return this.#scheduledRefreshDatetimes[this.#refreshIndex++].getTime() - Date.now();
    }
  }
}
window.Scheduler = Scheduler;

var css = /*css*/`
  .bookalet > .backdrop {
    display: block;
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    background: transparent;
    z-index: 9000;
  }

  .bookalet > .panels {
    display: block;
    position: fixed;
    right: 4px;
    top: 4px;
    height: auto;
    width: auto;
    border: 1px outset lightgrey;
    background: rgba(0,0,0,0.95);
    z-index: 9001;
  }

  .bookalet .header-panel {
    background: rgba(255,255,255,0.8);
    padding: 0;
    height: auto;
    width: 100%;
  }

  .bookalet span.title {
    padding: 0 6px;
    float: left;
    font-weight: bold;
    color: black;
  }

  .bookalet span.ctrl {
    padding: 0 6px;
    float: right;
  }

  .bookalet span.ctrl > .ctrl-btn {
    font: bold large webdings;
    cursor: pointer;
  }

  .bookalet .input-panel {
    background: rgba(255,255,255,0.7);
    padding: 4px 8px;
    text-align: left;
  }

  .bookalet .input-panel > div:nth-of-type(even) {
    margin-bottom: 4px;
  }

  .bookalet .input-panel label {
    font-weight: bold;
  }
  .bookalet .input-panel input {
    border-radius: 3px;
    padding-left: 4px;
    width: 80px;
  }
  .bookalet .input-panel select {
    border-radius: 3px;
    width: 288px;
  }

  .bookalet .cmd-panel {
    background: rgba(255,255,255,0.7);
    padding: 12px 8px 4px 8px;
    text-align: center;
  }

  .bookalet .cmd-panel > .cmd {
    border: 1px outset rgb(42, 122, 176);
    border-radius: 3px;
    padding: 4px 6px;
    margin: 0;
    background: rgb(42, 122, 176);
    color: white;
    font-size: normal;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
  }
  .bookalet .cmd-panel > button:nth-of-type(1) {
    margin-right: 8px;
  }

  .bookalet .cmd-panel > .cmd.disabled {
    border: 1px solid gray;
    background: rgba(255,255,255,0.1);
    color: white;
    cursor: default;
  }

  .bookalet .msg-panel {
    background: rgba(255,255,255,0.6);
    padding: 0 0 0 6px;
    font-weight: bold;
    text-align: left;
  }

  .bookalet .msg-panel > .success {
    color: green;
  }

  .bookalet .msg-panel > .error {
    color: red;
  }

  .bookalet .msg-panel > .info {
    color: white;
  }
`;

var html = /*html*/`
  <div class="backdrop"></div>
  <div class="panels">
    <div class="header-panel">
      <span class="title">Bookalet</span>&nbsp;
      <span class="ctrl">
        <span class="ctrl-btn close" onclick="Bookalet.onClose()">&#114;</span>
      </span>
    </div>
    <div class="input-panel">
      <div>
        <label for="location">Location:</label>
      </div>
      <div>
        <select name="location">
          <option value="Cornell Community Centre" selected>Cornell Community Centre</option>
        </select>
      </div>
      <div>
        <label for="service">Service:</label>
      </div>
      <div>
        <select name="service">
          <option value="Drop-In Pickleball: Adults" selected>Drop-In Pickleball: Adults</option>
        </select>
      </div>
      <div>
        <label for="date">Date & Time Period:</label><br/>
      </div>
      <div>
        <input name="date" type="text" placeholder="dd/MM/yyyy" title="e.g. 15/11/2025">
        &nbsp;&nbsp;&nbsp;
        <input name="timeFrom" type="text" placeholder="hh:mm AM" title="e.g. 12:45 PM">
        -
        <input name="timeTo" type="text" placeholder="hh:mm PM" title="e.g. 02:45 PM">
      </div>
    </div>
    <div class="cmd-panel">
      <button type="button" id="tryRegister" class="cmd" onclick="Bookalet.tryRegister()">Try Register</button>
      <button type="button" id="stop" class="cmd disabled" onclick="Bookalet.stop()">Stop</button>
    </div>
    <div class="msg-panel">
      <span class="info"></span>
    </div>
  </div>
`;

var messages = {
  start: 'Fill in the inputs, then Click [Try Register]',
  trying: 'Try Registering ...'
};

var Bookalet = {
  site: {
    origin: 'https://cityofmarkham.perfectmind.com',
    loginPath: '/Menu/MemberRegistration/MemberSignIn',
    bookingPath: '/Clients/BookMe4BookingPages/Classes'
      + '?calendarId=491a603e-4043-4ab6-b04d-8fac51edbcfc'
      + '&widgetId=6825ea71-e5b7-4c2a-948f-9195507ad90a'
      + '&embed=False',
    confirmingPathname: '/Clients/BookMe4LandingPages/Class',
  },

  scheduler: undefined,

  cmdButtons: {},

  params: {},

  filters: {},

  status: 'Unloaded', // Unloaded, Loaded, Refreshing, Registering, Confirming, Registered

  tryRegister: async function() {
    if (Bookalet.status !== 'Loaded') return;

    Bookalet.resolveParams();
    Bookalet.resolveFilters();

    await Bookalet.inputFilters();

    Bookalet.status = 'Refreshing';
    $E('.bookalet .msg-panel > span').innerText = messages.trying;

    Bookalet.cmdButtons.tryRegister.classList.add('disabled');
    Bookalet.cmdButtons.stop.classList.remove('disabled');

    // Resolve register start datetime
    const { date, timeFrom } = Bookalet.params;
    const startDatetime = toDatetime(date, timeFrom);
    startDatetime.setHours(startDatetime.getHours() - 21);

    Bookalet.scheduler = new Scheduler({ startDatetime });

    await Bookalet.retry();
  },

  retry: async function() {
    await Bookalet.waitForLoading();

    const row = Bookalet.searchMatchingRow();
    // <input type="button" value="Register" aria-label="Register Drop-in Pickleball: Adults">
    const button = row ? $E('input[value="Register"]', row) : undefined;
    if (button) {
      await Bookalet.register(button);
    } else if (Bookalet.status === 'Refreshing') {
      await delay(Bookalet.scheduler.nextIntervalInMillis())
        .then(() => console.info('[INFO] Refresh the event list ...'))
        .then(() => Bookalet.input('timeTo', Bookalet.nextTimeTo()))
        .then(() => Bookalet.retry())
      ;
    }
  },

  register: async function(button) {
    Bookalet.status = 'Registering';

    await Promise.resolve(button.click())
      .then(() => {
        Bookalet.status = 'Confirming';
      })
    ;
  },

  resolveParams: function() {
    Bookalet.params = {
      location: Bookalet.valueOf('location'),
      service: Bookalet.valueOf('service'),
      date: Bookalet.valueOf('date'),
      timeFrom: Bookalet.valueOf('timeFrom').toUpperCase(),
      timeTo: Bookalet.valueOf('timeTo').toUpperCase(),
    };
  },

  valueOf: function(input) {
    return $E(`.bookalet .input-panel [name="${input}"]`).value;
  },

  resolveFilters: function() {
    var { location, service, date, timeFrom, timeTo } = Bookalet.params;
    timeFrom = halfHourRoundDown(timeFrom);
    timeTo = halfHourRoundUp(timeTo);
    var timeTo2 = addOneHour(timeTo);

    Bookalet.filters = {
      location,
      service,
      dateFrom: date,
      dateTo: date,
      timeFrom,
      timeTo,
      timeTo2
    };
  },

  inputFilters: async function() {
    await Bookalet.pick('Location');
    await Bookalet.pick('Service');

    await Bookalet.input('dateFrom');
    await Bookalet.input('dateTo');

    await Bookalet.input('timeFrom');
    await Bookalet.input('timeTo');
  },

  pick: async function(name) {
    const value = Bookalet.filters[name.toLowerCase()];
    const filter = $E(`div[aria-label="${name}"]`).parentNode.parentNode;

    await Promise.resolve()
      .then(() => $E(`span.reset-filter-link`, filter).click())
      .then(() => delay(10))
      .then(() => $E(`span.select-arrow`, filter).click())
      .then(() => delay(10))
      .then(() => $E(`input[data-text="${value}"]`, filter).click())
      .then(() => delay(10))
      .then(() => {
        const searchText = $E(`input.search-text`, filter);
        searchText.focus();
        return searchText;
      })
      .then((searchText) => delay(10, searchText))
      .then((searchText) => {
        sendEscapeKeyToElement(searchText);
      })
    ;
  },

  input: async function(name, srcValue) {
    const value = srcValue ?? Bookalet.filters[name];
    const element = $E(`input[aria-labelledby="${name}"]`)

    element.focus();
    element.value = value;
    element.blur();
  },

  waitForLoading: async function() {
    // <div id="bm-overlay" class="bm-loading-container bm-class-loading-container" style="">
    //   <img ...>
    // </div>
    while(true) {
      if (await delay(50).then(() => {
        const loading = $E('div.bm-loading-container');
        return loading && loading.checkVisibility() === false;
      })) break;
    }
  },

  searchMatchingRow: function() {
    const rows = $A('.bm-class-row')
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // <span aria-label="Event time 01:00 pm - 03:00 pm" tabindex="0">01:00 pm - 03:00 pm</span>
      const { timeFrom, timeTo } = Bookalet.params;
      const label = `Event time ${timeFrom.toLowerCase()} - ${timeTo.toLowerCase()}`;
      if ($E(`span[aria-label="${label}"]`, row)) {
        console.info('[INFO] Found matching event: %s', label);
        return row;
      }
    }
    return undefined;
  },

  nextTimeTo: function() {
    const value = $E(`input[aria-labelledby="timeTo"]`).value;
    const { timeTo, timeTo2 } = Bookalet.filters;
    return value === timeTo ? timeTo2 : timeTo;
  },

  stop: function() {
    if (Bookalet.status !== 'Refreshing') return;

    Bookalet.status = 'Loaded';
    $E('.bookalet .msg-panel > span').innerText = messages.start;

    Bookalet.cmdButtons.tryRegister.classList.remove('disabled');
    Bookalet.cmdButtons.stop.classList.add('disabled');
  },

  init: function() {
    append('style', {id: "bookalet", type: "text/css"}, document.head).innerHTML = css;
    append('div', {className: "bookalet"}).innerHTML = html;

    const currentDatetime = new Date();
    currentDatetime.setMilliseconds(0);
    currentDatetime.setSeconds(0);
    currentDatetime.setMinutes(Math.ceil(currentDatetime.getMinutes() / 15) * 15);

    const startDatetime = new Date(currentDatetime);
    startDatetime.setHours(startDatetime.getHours() + 21);

    const endDatetime = new Date(startDatetime);
    endDatetime.setHours(endDatetime.getHours() + 2);

    $E('.bookalet .input-panel input[name="date"]').value = dateString(startDatetime);
    $E('.bookalet .input-panel input[name="timeFrom"]').value = timeString(startDatetime);
    $E('.bookalet .input-panel input[name="timeTo"]').value = timeString(endDatetime);

    Bookalet.cmdButtons = {
      tryRegister: $E('.bookalet .cmd-panel button#tryRegister'),
      stop: $E('.bookalet .cmd-panel button#stop'),
    };

    console.info('[INFO] Loaded Bookalet successfully.');

    Bookalet.status = 'Loaded';
    $E('.bookalet .msg-panel > span').innerText = messages.start;
  },

  onClose: function() {
    Bookalet.stop();

    $E('.bookalet').remove();
    $E('style#bookalet').remove();
  },

  confirm: async function() {
    Bookalet.status = 'Confirming';

    // <a id="bookEventButton" class="bm-button bm-book-button" href="/Clients/BookMe4..." aria-label="Register Drop-In Pickleball: Adults" tabindex="0">
    //   Register
    // </a>
    var bookEventButton = undefined;
    while(true) {
      if (await delay(50).then(() => {
        bookEventButton = $E('a#bookEventButton');
        return Boolean(bookEventButton);
      })) break;
    }

    bookEventButton.click();
  },

  navigateToTargetPage: async function() {
    const isLoggedIn = () => Boolean($E('li.my_account'));

    const { origin, loginPath, bookingPath, confirmingPathname } = Bookalet.site;
    if (window.location.origin !== origin || !isLoggedIn()) {
      console.info('[INFO] Navigating to login page.');
      window.location.assign(origin + loginPath);
      return false;
    }

    const { pathname, search } = window.location
    if (pathname === confirmingPathname) {
      console.info('[INFO] Confirming the booking.');
      await Bookalet.confirm();
      return false;
    }

    if (pathname + search !== bookingPath) {
      console.info('[INFO] Navigating to booking page.');
      window.location.assign(origin + bookingPath);
      return false;
    }

    return true;
  },

};
window.Bookalet = Bookalet;

var initialized = false;
try {
  if (await Bookalet.navigateToTargetPage()) {
    if (initialized) {
      Bookalet.onClose();
      initialized = false;
    }

    Bookalet.init();
    initialized = true;
  }
} catch (error) {
  console.error('[ERROR] Error occurred while initializing bookalet.', error);
}

})(window);
