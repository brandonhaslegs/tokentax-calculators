const inputIds = [
  'investment',
  'buyPrice',
  'sellPrice',
  'investmentFee',
  'exitFee',
  'income',
  'state',
  'filingStatus',
  'currency',
  'token',
  'purchaseMonth',
  'purchaseDay',
  'purchaseYear',
  'saleMonth',
  'saleDay',
  'saleYear',
];

const stateRates = {
  NY: 0.0685,
  CA: 0.093,
  TX: 0.0,
  FL: 0.0,
  IL: 0.0495,
  WA: 0.0,
};

const federalBrackets = {
  single: [
    { cap: 44725, rate: 0.12, effective: 0.095 },
    { cap: 95375, rate: 0.22, effective: 0.155 },
    { cap: 182100, rate: 0.24, effective: 0.1798 },
    { cap: 231250, rate: 0.32, effective: 0.215 },
    { cap: Infinity, rate: 0.35, effective: 0.255 },
  ],
  joint: [
    { cap: 89450, rate: 0.12, effective: 0.095 },
    { cap: 190750, rate: 0.22, effective: 0.155 },
    { cap: 364200, rate: 0.24, effective: 0.1798 },
    { cap: 462500, rate: 0.32, effective: 0.215 },
    { cap: Infinity, rate: 0.35, effective: 0.255 },
  ],
  head: [
    { cap: 63100, rate: 0.12, effective: 0.095 },
    { cap: 100500, rate: 0.22, effective: 0.155 },
    { cap: 191950, rate: 0.24, effective: 0.1798 },
    { cap: 243700, rate: 0.32, effective: 0.215 },
    { cap: Infinity, rate: 0.35, effective: 0.255 },
  ],
};

const priceHistory = {
  BTC: [
    ['2016-01-01', 430],
    ['2017-01-01', 970],
    ['2018-01-01', 13400],
    ['2020-01-01', 7200],
    ['2021-01-01', 29300],
    ['2022-01-01', 47600],
    ['2023-01-01', 16500],
    ['2024-01-01', 43000],
    ['2025-01-01', 65000],
    ['2026-01-01', 58000],
    ['2026-02-07', 68769.05],
  ],
  ETH: [
    ['2016-01-01', 1.0],
    ['2017-01-01', 8.0],
    ['2018-01-01', 730],
    ['2020-01-01', 130],
    ['2021-01-01', 730],
    ['2022-01-01', 3700],
    ['2023-01-01', 1200],
    ['2024-01-01', 2300],
    ['2025-01-01', 3200],
    ['2026-01-01', 2800],
  ],
  SOL: [
    ['2020-01-01', 1.5],
    ['2021-01-01', 1.6],
    ['2022-01-01', 170],
    ['2023-01-01', 10],
    ['2024-01-01', 100],
    ['2025-01-01', 130],
    ['2026-01-01', 110],
  ],
  USDC: [
    ['2016-01-01', 1.0],
    ['2025-01-01', 1.0],
    ['2026-01-01', 1.0],
  ],
};

const fxRates = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
};

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getCurrencyFormatter(currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  });
}

function getBracket(income, status) {
  const brackets = federalBrackets[status] || federalBrackets.single;
  return brackets.find((bracket) => income <= bracket.cap) || brackets[0];
}

function readNumber(id) {
  const value = Number(document.getElementById(id)?.value);
  return Number.isFinite(value) ? value : 0;
}

function daysBetween(start, end) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end - start) / msPerDay);
}

function getHistoricalPrice(token, date) {
  const series = priceHistory[token] || priceHistory.BTC;
  const target = date.getTime();
  const points = series
    .map(([day, price]) => [new Date(`${day}T00:00:00`).getTime(), price])
    .sort((a, b) => a[0] - b[0]);

  if (target <= points[0][0]) return points[0][1];
  if (target >= points[points.length - 1][0]) return points[points.length - 1][1];

  for (let i = 0; i < points.length - 1; i += 1) {
    const [startTime, startPrice] = points[i];
    const [endTime, endPrice] = points[i + 1];
    if (target >= startTime && target <= endTime) {
      const progress = (target - startTime) / (endTime - startTime);
      return startPrice + (endPrice - startPrice) * progress;
    }
  }

  return points[points.length - 1][1];
}

function setInputValue(id, value) {
  const input = document.getElementById(id);
  if (!input) return;
  input.value = Number.isFinite(value) ? value.toFixed(2) : '';
}

function setDisplayValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = Number.isFinite(value) ? compactNumberFormatter.format(value) : '0.00';
}

function readDateParts(prefix) {
  const month = document.getElementById(`${prefix}Month`)?.value ?? '';
  const day = document.getElementById(`${prefix}Day`)?.value ?? '';
  const year = document.getElementById(`${prefix}Year`)?.value ?? '';

  const m = Number(month);
  const d = Number(day);
  const y = Number(year);

  if (!Number.isInteger(m) || !Number.isInteger(d) || !Number.isInteger(y)) return null;
  if (String(year).length !== 4) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;

  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;

  return date;
}

function setDateParts(prefix, date) {
  const month = document.getElementById(`${prefix}Month`);
  const day = document.getElementById(`${prefix}Day`);
  const year = document.getElementById(`${prefix}Year`);
  if (!month || !day || !year) return;

  month.value = String(date.getMonth() + 1).padStart(2, '0');
  day.value = String(date.getDate()).padStart(2, '0');
  year.value = String(date.getFullYear());
}

function setPanelState(button, panel, isOpen, openText, closedText) {
  if (!button || !panel) return;
  panel.classList.toggle('is-open', isOpen);
  button.setAttribute('aria-expanded', String(isOpen));
  button.textContent = isOpen ? openText : closedText;
}

function readDateInputValue(input) {
  if (!input || !input.value) return null;
  const [year, month, day] = input.value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getAssetIconMarkup(token) {
  if (token === 'BTC') {
    return `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xml:space="preserve"
        width="100%"
        height="100%"
        version="1.1"
        shape-rendering="geometricPrecision"
        text-rendering="geometricPrecision"
        image-rendering="optimizeQuality"
        fill-rule="evenodd"
        clip-rule="evenodd"
        viewBox="0 0 4091.27 4091.73"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        xmlns:xodm="http://www.corel.com/coreldraw/odm/2003"
      >
        <g id="Layer_x0020_1">
          <metadata id="CorelCorpID_0Corel-Layer" />
          <g id="_1421344023328">
            <path
              fill="#F7931A"
              fill-rule="nonzero"
              d="M4030.06 2540.77c-273.24,1096.01 -1383.32,1763.02 -2479.46,1489.71 -1095.68,-273.24 -1762.69,-1383.39 -1489.33,-2479.31 273.12,-1096.13 1383.2,-1763.19 2479,-1489.95 1096.06,273.24 1763.03,1383.51 1489.76,2479.57l0.02 -0.02z"
            />
            <path
              fill="white"
              fill-rule="nonzero"
              d="M2947.77 1754.38c40.72,-272.26 -166.56,-418.61 -450,-516.24l91.95 -368.8 -224.5 -55.94 -89.51 359.09c-59.02,-14.72 -119.63,-28.59 -179.87,-42.34l90.16 -361.46 -224.36 -55.94 -92 368.68c-48.84,-11.12 -96.81,-22.11 -143.35,-33.69l0.26 -1.16 -309.59 -77.31 -59.72 239.78c0,0 166.56,38.18 163.05,40.53 90.91,22.69 107.35,82.87 104.62,130.57l-104.74 420.15c6.26,1.59 14.38,3.89 23.34,7.49 -7.49,-1.86 -15.46,-3.89 -23.73,-5.87l-146.81 588.57c-11.11,27.62 -39.31,69.07 -102.87,53.33 2.25,3.26 -163.17,-40.72 -163.17,-40.72l-111.46 256.98 292.15 72.83c54.35,13.63 107.61,27.89 160.06,41.3l-92.9 373.03 224.24 55.94 92 -369.07c61.26,16.63 120.71,31.97 178.91,46.43l-91.69 367.33 224.51 55.94 92.89 -372.33c382.82,72.45 670.67,43.24 791.83,-303.02 97.63,-278.78 -4.86,-439.58 -206.26,-544.44 146.69,-33.83 257.18,-130.31 286.64,-329.61l-0.07 -0.05zm-512.93 719.26c-69.38,278.78 -538.76,128.08 -690.94,90.29l123.28 -494.2c152.17,37.99 640.17,113.17 567.67,403.91zm69.43 -723.3c-63.29,253.58 -453.96,124.75 -580.69,93.16l111.77 -448.21c126.73,31.59 534.85,90.55 468.94,355.05l-0.02 0z"
            />
          </g>
        </g>
      </svg>
    `;
  }

  const fallback = {
    ETH: 'Ξ',
    SOL: 'S',
    USDC: '$',
  };

  return fallback[token] || '•';
}

function wireDateInputs(prefix, onChange) {
  const month = document.getElementById(`${prefix}Month`);
  const day = document.getElementById(`${prefix}Day`);
  const year = document.getElementById(`${prefix}Year`);
  const parts = [month, day, year].filter(Boolean);

  parts.forEach((part, index) => {
    part.addEventListener('input', () => {
      part.value = part.value.replace(/\D/g, '').slice(0, part.maxLength || 4);
      if (part.value.length === part.maxLength && parts[index + 1]) {
        parts[index + 1].focus();
      }
      onChange();
    });
  });
}

function getDefaultDates() {
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  const purchase = new Date(today);
  purchase.setFullYear(purchase.getFullYear() - 5);
  return { today, purchase };
}

function CryptoCalculator({ mode }) {
  const isProfitMode = mode === 'profit';

  return `
    <header class="top-nav">
      <div class="top-nav-brand">
        <span class="top-nav-mark" aria-hidden="true"></span>
        <span class="top-nav-name">TokenTax</span>
      </div>
      <nav class="top-nav-links" aria-label="Primary">
        <a href="#">Integrations</a>
        <a href="#">VIP</a>
        <a href="#">Enterprise</a>
        <a href="#">Pricing</a>
        <a href="#">Blog</a>
        <a href="#">More</a>
      </nav>
      <button type="button" class="top-nav-cta">Sign up →</button>
    </header>

    <header class="hero">
      <div class="hero-top">
        <div class="hero-copy">
          <h1>Crypto Calculator</h1>
          <p class="subtitle">Easily calculate your crypto gains and taxes with CryptoTax's free cryptocurrency calculator.</p>
        </div>
        <div class="pill-row">
          <label class="pill-select">
            <span>Currency</span>
            <select id="currency">
              <option selected>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
          </label>
          <label class="pill-select">
            <span>Crypto</span>
            <select id="token">
              <option selected>BTC</option>
              <option>ETH</option>
              <option>SOL</option>
              <option>USDC</option>
            </select>
          </label>
        </div>
      </div>
    </header>

    <section class="calculator" data-mode="${mode}">
      <div id="results" class="results-stack is-hidden">
        <div class="headline">
          <div class="headline-grid">
            <article class="panel headline-item">
              <span>Asset</span>
              <div class="headline-asset-wrap">
                <span id="headlineAssetIcon" class="headline-asset-icon is-btc" aria-hidden="true">₿</span>
                <select id="headlineAssetSelect" class="headline-control">
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
            </article>
            <article class="panel headline-item">
              <span>Invested</span>
              <div class="headline-input-wrap">
                <span class="headline-prefix">$</span>
                <input id="headlineInvestedInput" class="headline-control headline-number" type="number" min="0" step="0.01" />
              </div>
            </article>
            <article class="panel headline-item">
              <span>Buy date</span>
              <input id="headlineBuyDateInput" class="headline-control headline-date" type="date" />
            </article>
            <article class="panel headline-item">
              <span>Sell date</span>
              <input id="headlineSellDateInput" class="headline-control headline-date" type="date" />
            </article>
          </div>
        </div>
        <div class="quick-metrics-row">
          <div class="panel tax-capital-gains-quick">
            <span>Return</span>
            <strong id="quickReturnPct" class="positive">+0.00%</strong>
          </div>
          <div class="panel tax-capital-gains-quick">
            <span>Capital gains</span>
            <span class="quick-capital-gains-actions">
              <strong id="taxCapitalGainsQuick" class="positive">+$0</strong>
              ${isProfitMode ? '<a class="tax-cta-button" href="/crypto-tax-calculator">Calculate taxes</a>' : ''}
            </span>
          </div>
          <div class="panel tax-capital-gains-quick">
            <span>Tax</span>
            <strong id="quickTaxValue" class="negative">-$0</strong>
          </div>
        </div>

        ${!isProfitMode ? `
        <div class="section-header tax-inputs-header">
          <h3>Tax inputs</h3>
        </div>
        <div class="grid-3">
          <label class="panel select-panel">
            <span class="panel-heading"><strong>State</strong></span>
            <select id="state">
              <option value="NY" selected>New York</option>
              <option value="CA">California</option>
              <option value="TX">Texas</option>
              <option value="FL">Florida</option>
              <option value="IL">Illinois</option>
              <option value="WA">Washington</option>
            </select>
          </label>
          <label class="panel select-panel">
            <span class="panel-heading"><strong>Status</strong></span>
            <select id="filingStatus">
              <option value="single" selected>Single</option>
              <option value="joint">Married filing jointly</option>
              <option value="head">Head of household</option>
            </select>
          </label>
          <div class="panel">
            <div class="panel-heading"><h4>Income</h4></div>
            <div class="input-row"><span class="prefix">$</span><input id="income" type="number" min="0" step="1" placeholder="100,000" /></div>
          </div>
        </div>
        <div class="grid-2">
          <div class="panel">
            <div class="panel-heading">
              <h4>Investment fee</h4>
              <p>Typically 0.1%-0.6% of invested amount</p>
            </div>
            <div class="input-row"><span class="prefix">$</span><input id="investmentFee" type="number" min="0" step="0.01" /></div>
          </div>
          <div class="panel">
            <div class="panel-heading">
              <h4>Exit fee</h4>
              <p>Fee to convert crypto to <span id="exitCurrencyLabel">USD</span> (usually around 0.6%)</p>
            </div>
            <div class="input-row"><span class="prefix">$</span><input id="exitFee" type="number" min="0" step="0.01" /></div>
          </div>
        </div>

        <div class="section-header tax-breakdown-header">
          <h3>Tax breakdown</h3>
        </div>
        <div class="summary">
          <div class="summary-table">
            <table>
              <thead>
                <tr>
                  <th>Tax type</th>
                  <th>Marginal</th>
                  <th>Effective</th>
                  <th>Tax due</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td data-label="Tax type">Federal</td>
                  <td id="fedMarginal" data-label="Marginal">0.00%</td>
                  <td id="fedEffective" data-label="Effective">0.00%</td>
                  <td id="fedTax" data-label="Tax due">$0</td>
                </tr>
                <tr>
                  <td data-label="Tax type">State</td>
                  <td id="stateMarginal" data-label="Marginal">0.00%</td>
                  <td id="stateEffective" data-label="Effective">0.00%</td>
                  <td id="stateTax" data-label="Tax due">$0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        ${!isProfitMode ? `
        <div class="grid-3 results-columns">
          <div class="panel results-panel compact bottom-align-total">
            <div class="panel-heading">
              <h3>Pre-tax capital gains</h3>
            </div>
            <div class="summary-results">
              <div class="summary-left">
                <div class="summary-math">
                  <div><span>Current value</span><strong id="proceeds">$0</strong></div>
                  <div><span>Cost basis</span><strong id="costBasis">-$0</strong></div>
                  <div><span>Fees</span><strong id="fees">-$0</strong></div>
                </div>
                <div class="summary-divider"></div>
                <div class="summary-total">
                  <p>
                    <span class="capital-gains-label">Capital gains</span>
                    <span class="capital-gains-actions">
                      <strong id="capitalGains" class="positive">+$0</strong>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="panel results-panel compact">
            <div class="panel-heading">
              <h3>Net after-tax outcome</h3>
            </div>
            <div class="summary-results">
              <div class="summary-left">
                <div class="summary-math">
                  <div><span>After-tax value</span><strong id="afterTaxValue">$0</strong></div>
                  <div><span>After-tax gain/loss</span><strong id="afterTaxGain" class="positive">+$0</strong></div>
                  <div class="placeholder-row"><span>&nbsp;</span><strong>&nbsp;</strong></div>
                </div>
                <div class="summary-divider"></div>
                <div class="summary-total">
                  <p>Total capital gains tax <strong id="totalTax" class="negative">-$0</strong></p>
                </div>
              </div>
            </div>
          </div>

          <div class="panel results-panel chart-panel">
            <div class="panel-heading">
              <h3>Allocation</h3>
            </div>
            <div class="summary-chart">
              <div class="allocation-bar" aria-hidden="true">
                <span id="netSegment" class="allocation-segment gain" style="width: 100%"></span>
                <span id="taxSegment" class="allocation-segment tax" style="width: 0%"></span>
              </div>
            </div>
            <div class="chart-legend">
              <div class="legend-item"><span class="legend-dot gain"></span><span>Net value</span></div>
              <div class="legend-item"><span class="legend-dot tax"></span><span>Taxes & fees</span></div>
            </div>
          </div>
        </div>
        ` : ''}
      </div>

      ${!isProfitMode ? `
      <input id="investment" type="hidden" />
      <input id="purchaseMonth" type="hidden" />
      <input id="purchaseDay" type="hidden" />
      <input id="purchaseYear" type="hidden" />
      <input id="saleMonth" type="hidden" />
      <input id="saleDay" type="hidden" />
      <input id="saleYear" type="hidden" />

      <input id="buyPrice" type="hidden" />
      <input id="sellPrice" type="hidden" />
      ` : `
      <input id="investment" type="hidden" />
      <input id="purchaseMonth" type="hidden" />
      <input id="purchaseDay" type="hidden" />
      <input id="purchaseYear" type="hidden" />
      <input id="saleMonth" type="hidden" />
      <input id="saleDay" type="hidden" />
      <input id="saleYear" type="hidden" />
      <input id="buyPrice" type="hidden" />
      <input id="sellPrice" type="hidden" />
      `}
    </section>

    <div class="disclaimer">
      <span class="disclaimer-badge">Disclaimer</span>
      <h2>This is an estimate.</h2>
      <p>Things like deductions, credits, losses, and local taxes can change the result.</p>
      <p>For real advice, talk to a tax pro.</p>
      <div class="cta">
        <button type="button">Get in touch with us →</button>
      </div>
    </div>

    <footer class="site-footer">
      <div class="site-footer-grid">
        <section class="site-footer-brand-col">
          <div class="site-footer-brand">
            <span class="site-footer-mark" aria-hidden="true"></span>
            <span class="site-footer-name">TokenTax</span>
          </div>
          <p class="site-footer-tagline">Stay up to date on the latest news</p>
          <label class="site-footer-input">
            <span>Email address</span>
            <button type="button" aria-label="Submit email">→</button>
          </label>
          <div class="site-footer-socials">
            <a href="#" aria-label="X">X</a>
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="LinkedIn">in</a>
          </div>
        </section>

        <section class="site-footer-col">
          <h4>Get in touch</h4>
          <a href="#">(845) 663-1173</a>
          <a href="#">Email us</a>
          <a href="#">Message us</a>
          <a href="#">We're hiring</a>
        </section>

        <section class="site-footer-col">
          <h4>Resources</h4>
          <a href="#">Blog</a>
          <a href="#">Crypto Tax Guide</a>
          <a href="#">Crypto Profit Calculator</a>
          <a href="#">Crypto Tax Calculator</a>
          <a href="#">ETH Profit Calculator</a>
          <a href="#">SOL Profit Calculator</a>
          <a href="#">XRP Profit Calculator</a>
          <a href="#">Help center</a>
          <a href="#">Affiliate program</a>
        </section>

        <section class="site-footer-col">
          <h4>Product</h4>
          <a href="#">Features</a>
          <a href="#">Tax reports</a>
          <a href="#">Pricing</a>
          <a href="#">Integrations</a>
        </section>

        <section class="site-footer-col">
          <h4>Company</h4>
          <a href="#">About us</a>
          <a href="#">Careers</a>
          <a href="#">Privacy</a>
          <a href="#">Cookies</a>
          <a href="#">Terms</a>
          <a href="#">Cookie Settings</a>
        </section>
      </div>
    </footer>
  `;
}

function buildCalculator({ mode }) {
  const isProfitMode = mode === 'profit';
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = CryptoCalculator({ mode });

  const taxToggle = document.getElementById('taxToggle');
  const taxInputsPanel = document.getElementById('taxInputsPanel');
  const priceOverrideToggle = document.getElementById('priceOverrideToggle');
  const advancedPricesPanel = document.getElementById('advancedPricesPanel');
  const headlineAssetIcon = document.getElementById('headlineAssetIcon');
  const headlineAssetSelect = document.getElementById('headlineAssetSelect');
  const headlineInvestedInput = document.getElementById('headlineInvestedInput');
  const headlineBuyDateInput = document.getElementById('headlineBuyDateInput');
  const headlineSellDateInput = document.getElementById('headlineSellDateInput');

  let taxPanelOpen = !isProfitMode;
  let overridePricesOpen = false;

  setPanelState(taxToggle, taxInputsPanel, taxPanelOpen, 'Hide tax impact', 'See tax impact');

  if (priceOverrideToggle && advancedPricesPanel) {
    priceOverrideToggle.textContent = overridePricesOpen ? 'Hide price overrides' : 'Advanced / Override prices';
    priceOverrideToggle.setAttribute('aria-expanded', String(overridePricesOpen));
    advancedPricesPanel.classList.toggle('is-visible', overridePricesOpen);
    priceOverrideToggle.addEventListener('click', () => {
      overridePricesOpen = !overridePricesOpen;
      priceOverrideToggle.textContent = overridePricesOpen ? 'Hide price overrides' : 'Advanced / Override prices';
      priceOverrideToggle.setAttribute('aria-expanded', String(overridePricesOpen));
      advancedPricesPanel.classList.toggle('is-visible', overridePricesOpen);
      update();
    });
  }

  if (taxToggle && taxInputsPanel) {
    taxToggle.addEventListener('click', () => {
      taxPanelOpen = !taxPanelOpen;
      setPanelState(taxToggle, taxInputsPanel, taxPanelOpen, 'Hide tax impact', 'See tax impact');
    });
  }

  if (headlineAssetSelect) {
    headlineAssetSelect.addEventListener('change', () => {
      const token = document.getElementById('token');
      if (!token) return;
      token.value = headlineAssetSelect.value;
      update();
    });
  }

  if (headlineInvestedInput) {
    headlineInvestedInput.addEventListener('input', () => {
      const investment = document.getElementById('investment');
      if (!investment) return;
      investment.value = headlineInvestedInput.value;
      update();
    });
    const selectAll = () => {
      headlineInvestedInput.select();
    };
    headlineInvestedInput.addEventListener('focus', selectAll);
    headlineInvestedInput.addEventListener('click', selectAll);
  }

  if (headlineBuyDateInput) {
    headlineBuyDateInput.addEventListener('change', () => {
      if (!headlineBuyDateInput.value) return;
      const [year, month, day] = headlineBuyDateInput.value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (Number.isNaN(date.getTime())) return;
      setDateParts('purchase', date);
      update();
    });
  }

  if (headlineSellDateInput) {
    headlineSellDateInput.addEventListener('change', () => {
      if (!headlineSellDateInput.value) return;
      const [year, month, day] = headlineSellDateInput.value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (Number.isNaN(date.getTime())) return;
      setDateParts('sale', date);
      update();
    });
  }

  function update() {
    const currency = document.getElementById('currency').value;
    const numberFormatter = getCurrencyFormatter(currency);
    const fxRate = fxRates[currency] ?? 1;
    const token = document.getElementById('token').value;
    const investment = readNumber('investment');
    const income = readNumber('income');
    const state = document.getElementById('state')?.value || 'NY';
    const filingStatus = document.getElementById('filingStatus')?.value || 'single';
    const purchaseDate = readDateParts('purchase');
    const saleDate = readDateParts('sale');

    let derivedBuyPrice = 0;
    let derivedSellPrice = 0;

    if (purchaseDate) derivedBuyPrice = getHistoricalPrice(token, purchaseDate) * fxRate;
    if (saleDate) derivedSellPrice = getHistoricalPrice(token, saleDate) * fxRate;

    if (!overridePricesOpen) {
      setInputValue('buyPrice', derivedBuyPrice);
      setInputValue('sellPrice', derivedSellPrice);
    }

    setDisplayValue('buyPriceText', derivedBuyPrice);
    setDisplayValue('sellPriceText', derivedSellPrice);

    const buyPrice = readNumber('buyPrice');
    const sellPrice = readNumber('sellPrice');

    const tokenAmount = buyPrice > 0 ? investment / buyPrice : 0;
    const proceeds = tokenAmount * sellPrice;

    const investmentFeeInput = document.getElementById('investmentFee');
    const exitFeeInput = document.getElementById('exitFee');

    if (investmentFeeInput && !investmentFeeInput.dataset.userEdited && investment > 0) {
      investmentFeeInput.value = (investment * 0.005).toFixed(2);
    }
    if (exitFeeInput && !exitFeeInput.dataset.userEdited) {
      const base = proceeds > 0 ? proceeds : investment;
      if (base > 0) {
        exitFeeInput.value = (base * 0.005).toFixed(2);
      }
    }

    const investmentFee = readNumber('investmentFee');
    const exitFee = readNumber('exitFee');
    const fees = investmentFee + exitFee;

    const capitalGains = proceeds - investment - fees;
    const validDates = purchaseDate && saleDate && saleDate >= purchaseDate;
    const isLongTerm = validDates ? daysBetween(purchaseDate, saleDate) >= 365 : false;

    const bracket = getBracket(income, filingStatus);
    const federalRate = isLongTerm ? bracket.rate * 0.75 : bracket.rate;
    const federalEffective = isLongTerm ? bracket.effective * 0.75 : bracket.effective;

    const stateRate = stateRates[state] ?? 0.05;
    const stateEffective = stateRate * 0.9;

    const federalTax = Math.max(capitalGains, 0) * federalEffective;
    const stateTax = Math.max(capitalGains, 0) * stateEffective;
    const totalTax = federalTax + stateTax;

    const afterTaxValue = proceeds - fees - totalTax;
    const afterTaxGain = afterTaxValue - investment;

    const symbolMap = { USD: '$', EUR: '€', GBP: '£' };
    const symbol = symbolMap[currency] || '$';
    document.querySelectorAll('.prefix').forEach((el) => {
      el.textContent = symbol;
    });

    const investmentCurrencyLabel = document.getElementById('investmentCurrencyLabel');
    if (investmentCurrencyLabel) investmentCurrencyLabel.textContent = currency;

    const exitCurrencyLabel = document.getElementById('exitCurrencyLabel');
    if (exitCurrencyLabel) exitCurrencyLabel.textContent = currency;

    const priceTokenLabel = document.getElementById('priceTokenLabel');
    if (priceTokenLabel) priceTokenLabel.textContent = token;
    if (headlineAssetIcon) {
      headlineAssetIcon.className = `headline-asset-icon is-${token.toLowerCase()}`;
      headlineAssetIcon.innerHTML = getAssetIconMarkup(token);
    }

    const results = document.getElementById('results');
    const hasRequiredInputs = investment > 0 && validDates && buyPrice > 0 && sellPrice > 0;
    results.classList.toggle('is-hidden', !hasRequiredInputs);
    if (!hasRequiredInputs) return;

    const grossGain = proceeds - investment;
    const percentChange = investment > 0 ? grossGain / investment : 0;

    if (headlineAssetSelect && headlineAssetSelect.value !== token) {
      headlineAssetSelect.value = token;
    }
    if (headlineInvestedInput && document.activeElement !== headlineInvestedInput) {
      headlineInvestedInput.value = investment > 0 ? investment.toFixed(2) : '';
    }
    if (headlineBuyDateInput && purchaseDate) {
      const buyDateValue = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}-${String(purchaseDate.getDate()).padStart(2, '0')}`;
      if (headlineBuyDateInput.value !== buyDateValue) {
        headlineBuyDateInput.value = buyDateValue;
      }
    }
    if (headlineSellDateInput && saleDate) {
      const sellDateValue = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;
      if (headlineSellDateInput.value !== sellDateValue) {
        headlineSellDateInput.value = sellDateValue;
      }
    }

    const proceedsEl = document.getElementById('proceeds');
    if (proceedsEl) proceedsEl.textContent = numberFormatter.format(proceeds);
    const costBasisEl = document.getElementById('costBasis');
    if (costBasisEl) costBasisEl.textContent = `-${numberFormatter.format(investment)}`;
    const feesEl = document.getElementById('fees');
    if (feesEl) feesEl.textContent = `-${numberFormatter.format(fees)}`;

    const gainsEl = document.getElementById('capitalGains');
    if (gainsEl) {
      gainsEl.textContent = `${capitalGains >= 0 ? '+' : '-'}${numberFormatter.format(Math.abs(capitalGains))}`;
      gainsEl.className = capitalGains >= 0 ? 'positive' : 'negative';
    }
    const taxCapitalGainsQuick = document.getElementById('taxCapitalGainsQuick');
    if (taxCapitalGainsQuick) {
      taxCapitalGainsQuick.textContent = `${capitalGains >= 0 ? '+' : '-'}${numberFormatter.format(Math.abs(capitalGains))}`;
      taxCapitalGainsQuick.className = capitalGains >= 0 ? 'positive' : 'negative';
    }
    const quickReturnPct = document.getElementById('quickReturnPct');
    if (quickReturnPct) {
      quickReturnPct.textContent = `${percentChange >= 0 ? '+' : '-'}${percentFormatter.format(Math.abs(percentChange))}`;
      quickReturnPct.className = percentChange >= 0 ? 'positive' : 'negative';
    }
    const quickTaxValue = document.getElementById('quickTaxValue');
    if (quickTaxValue) {
      quickTaxValue.textContent = `-${numberFormatter.format(Math.abs(totalTax))}`;
      quickTaxValue.className = totalTax > 0 ? 'negative' : 'positive';
    }

    if (!isProfitMode) {
      const totalTaxEl = document.getElementById('totalTax');
      totalTaxEl.textContent = `${totalTax >= 0 ? '-' : '+'}${numberFormatter.format(Math.abs(totalTax))}`;
      totalTaxEl.className = totalTax >= 0 ? 'negative' : 'positive';

      document.getElementById('fedMarginal').textContent = percentFormatter.format(federalRate);
      document.getElementById('fedEffective').textContent = percentFormatter.format(federalEffective);
      document.getElementById('stateMarginal').textContent = percentFormatter.format(stateRate);
      document.getElementById('stateEffective').textContent = percentFormatter.format(stateEffective);
      document.getElementById('fedTax').textContent = numberFormatter.format(federalTax);
      document.getElementById('stateTax').textContent = numberFormatter.format(stateTax);

      document.getElementById('afterTaxValue').textContent = numberFormatter.format(afterTaxValue);
      const afterTaxGainEl = document.getElementById('afterTaxGain');
      afterTaxGainEl.textContent = `${afterTaxGain >= 0 ? '+' : '-'}${numberFormatter.format(Math.abs(afterTaxGain))}`;
      afterTaxGainEl.className = afterTaxGain >= 0 ? 'positive' : 'negative';
    }

    if (!isProfitMode) {
      const taxAndFees = Math.max(totalTax + fees, 0);
      const totalOut = Math.max(afterTaxValue + taxAndFees, 0);
      const taxShare = totalOut > 0 ? (taxAndFees / totalOut) * 100 : 0;
      const netShare = Math.max(100 - taxShare, 0);

      const netSegment = document.getElementById('netSegment');
      const taxSegment = document.getElementById('taxSegment');
      netSegment.style.width = `${netShare}%`;
      taxSegment.style.width = `${taxShare}%`;
    }
  }

  inputIds.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    const eventName = element.type === 'checkbox' || element.tagName === 'SELECT' ? 'change' : 'input';
    element.addEventListener(eventName, update);
  });

  ['investmentFee', 'exitFee'].forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', () => {
      input.dataset.userEdited = 'true';
    });
  });

  wireDateInputs('purchase', update);
  wireDateInputs('sale', update);

  const { today, purchase } = getDefaultDates();
  document.getElementById('investment').value = '1000';
  document.getElementById('token').value = 'BTC';
  setDateParts('purchase', purchase);
  setDateParts('sale', today);

  update();
}

function setupLiveReload() {
  if (!('EventSource' in window)) return;
  const source = new EventSource('/events');
  source.addEventListener('message', (event) => {
    if (event.data === 'reload') {
      window.location.reload();
    }
  });
}

export function mountCryptoCalculator({ mode }) {
  buildCalculator({ mode });
  setupLiveReload();
}
