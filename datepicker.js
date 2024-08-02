class ModernDatePicker {
  constructor(options = {}) {
    this.options = {
      element: null,
      onDateChange: null,
      mode: 'light',
      ...options
    };
    this.date = new Date();
    this.selectedDate = null;
    this.showYearPicker = false;

    this.init();
  }

  init() {
    this.createElements();
    this.addEventListeners();
    this.render();
  }

  createElements() {
    this.container = document.createElement('div');
    this.container.className = `modern-date-picker ${this.options.mode}`;
    this.container.innerHTML = `
      <div class="mdp-header">
        <button class="mdp-prev">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div class="mdp-current">
          <span class="mdp-month"></span>
          <span class="mdp-year"></span>
        </div>
        <button class="mdp-next">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
      <div class="mdp-body">
        <div class="mdp-weekdays"></div>
        <div class="mdp-days"></div>
      </div>
      <div class="mdp-year-picker" style="display: none;">
        <select class="mdp-year-select"></select>
      </div>
      <div class="mdp-footer">
        <button class="mdp-mode-toggle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </button>
      </div>
    `;

    this.options.element.appendChild(this.container);

    this.prevButton = this.container.querySelector('.mdp-prev');
    this.nextButton = this.container.querySelector('.mdp-next');
    this.monthElement = this.container.querySelector('.mdp-month');
    this.yearElement = this.container.querySelector('.mdp-year');
    this.weekdaysElement = this.container.querySelector('.mdp-weekdays');
    this.daysElement = this.container.querySelector('.mdp-days');
    this.yearPickerElement = this.container.querySelector('.mdp-year-picker');
    this.yearSelectElement = this.container.querySelector('.mdp-year-select');
    this.modeToggleButton = this.container.querySelector('.mdp-mode-toggle');
  }

  addEventListeners() {
    this.prevButton.addEventListener('click', () => this.changeMonth(-1));
    this.nextButton.addEventListener('click', () => this.changeMonth(1));
    this.yearElement.addEventListener('click', () => this.toggleYearPicker());
    this.yearSelectElement.addEventListener('change', (e) => this.changeYear(parseInt(e.target.value)));
    this.modeToggleButton.addEventListener('click', () => this.toggleMode());
  }

  render() {
    this.renderHeader();
    this.renderWeekdays();
    this.renderDays();
    this.renderYearPicker();
  }

  renderHeader() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.monthElement.textContent = months[this.date.getMonth()];
    this.yearElement.textContent = this.date.getFullYear();
  }

  renderWeekdays() {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    this.weekdaysElement.innerHTML = weekdays.map(day => `<div class="mdp-weekday">${day}</div>`).join('');
  }

  renderDays() {
    const daysInMonth = new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(this.date.getFullYear(), this.date.getMonth(), 1).getDay();

    let html = '';
    for (let i = 0; i < firstDayOfMonth; i++) {
      html += '<div></div>';
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = this.selectedDate && 
        this.selectedDate.getDate() === i && 
        this.selectedDate.getMonth() === this.date.getMonth() && 
        this.selectedDate.getFullYear() === this.date.getFullYear();
      
      html += `<div class="mdp-day ${isSelected ? 'selected' : ''}" data-day="${i}">${i}</div>`;
    }

    this.daysElement.innerHTML = html;

    this.daysElement.querySelectorAll('.mdp-day').forEach(day => {
      day.addEventListener('click', (e) => this.selectDate(parseInt(e.target.dataset.day)));
    });
  }

  renderYearPicker() {
    const currentYear = this.date.getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);

    this.yearSelectElement.innerHTML = years.map(year => 
      `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`
    ).join('');
  }

  changeMonth(increment) {
    this.date.setMonth(this.date.getMonth() + increment);
    this.render();
  }

  changeYear(year) {
    this.date.setFullYear(year);
    this.showYearPicker = false;
    this.yearPickerElement.style.display = 'none';
    this.render();
  }

  toggleYearPicker() {
    this.showYearPicker = !this.showYearPicker;
    this.yearPickerElement.style.display = this.showYearPicker ? 'block' : 'none';
  }

  selectDate(day) {
    this.selectedDate = new Date(this.date.getFullYear(), this.date.getMonth(), day);
    if (this.options.onDateChange) {
      this.options.onDateChange(this.selectedDate);
    }
    this.render();
  }

  toggleMode() {
    this.options.mode = this.options.mode === 'light' ? 'dark' : 'light';
    this.container.className = `modern-date-picker ${this.options.mode}`;
  }
}
