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

function getCurrencyFormatter(currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  });
}

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

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

function getBracket(income, status) {
  const brackets = federalBrackets[status] || federalBrackets.single;
  return brackets.find((bracket) => income <= bracket.cap) || brackets[0];
}

function readNumber(id) {
  const value = Number(document.getElementById(id).value);
  return Number.isFinite(value) ? value : 0;
}

function formatDateLabel(date) {
  return dateFormatter.format(date);
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
      const basePrice = startPrice + (endPrice - startPrice) * progress;
      return applyMockVariation(basePrice, target, token);
    }
  }

  return applyMockVariation(points[points.length - 1][1], target, token);
}

function applyMockVariation(price, time, token) {
  return price;
}

function setInputValue(id, value) {
  const input = document.getElementById(id);
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

function update() {
  const currency = document.getElementById('currency').value;
  const numberFormatter = getCurrencyFormatter(currency);
  const fxRate = fxRates[currency] ?? 1;
  const token = document.getElementById('token').value;
  const investment = readNumber('investment');
  const income = readNumber('income');
  const state = document.getElementById('state').value;
  const filingStatus = document.getElementById('filingStatus').value;
  const purchaseDate = readDateParts('purchase');
  const saleDate = readDateParts('sale');

  let derivedBuyPrice = 0;
  let derivedSellPrice = 0;

  if (purchaseDate) {
    derivedBuyPrice = getHistoricalPrice(token, purchaseDate) * fxRate;
  }
  if (saleDate) {
    derivedSellPrice = getHistoricalPrice(token, saleDate) * fxRate;
  }

  const buyInput = document.getElementById('buyPrice');
  const sellInput = document.getElementById('sellPrice');

  buyInput.dataset.userEdited = '';
  sellInput.dataset.userEdited = '';
  setInputValue('buyPrice', derivedBuyPrice);
  setInputValue('sellPrice', derivedSellPrice);
  setDisplayValue('buyPriceText', derivedBuyPrice);
  setDisplayValue('sellPriceText', derivedSellPrice);
  const buyPriceText = document.getElementById('buyPriceText');
  if (buyPriceText) {
    buyPriceText.classList.toggle('is-muted', !purchaseDate);
  }

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
  if (investmentCurrencyLabel) {
    investmentCurrencyLabel.textContent = currency;
  }
  const exitCurrencyLabel = document.getElementById('exitCurrencyLabel');
  if (exitCurrencyLabel) {
    exitCurrencyLabel.textContent = currency;
  }
  const priceTokenLabel = document.getElementById('priceTokenLabel');
  if (priceTokenLabel) {
    priceTokenLabel.textContent = token;
  }

  const results = document.getElementById('results');
  const hasRequiredInputs = investment > 0 && validDates && buyPrice > 0 && sellPrice > 0;
  results.classList.toggle('is-hidden', !hasRequiredInputs);

  if (!hasRequiredInputs) {
    return;
  }

  document.getElementById('proceeds').textContent = numberFormatter.format(proceeds);
  document.getElementById('costBasis').textContent = `-${numberFormatter.format(investment)}`;
  document.getElementById('fees').textContent = `-${numberFormatter.format(fees)}`;

  const gainsEl = document.getElementById('capitalGains');
  const totalEl = document.getElementById('totalTax');

  gainsEl.textContent = `${capitalGains >= 0 ? '+' : '-'}${numberFormatter.format(Math.abs(capitalGains))}`;
  gainsEl.className = capitalGains >= 0 ? 'positive' : 'negative';

  totalEl.textContent = `${totalTax >= 0 ? '-' : '+'}${numberFormatter.format(Math.abs(totalTax))}`;
  totalEl.className = totalTax >= 0 ? 'negative' : 'positive';

  document.getElementById('fedMarginal').textContent = percentFormatter.format(federalRate);
  document.getElementById('fedEffective').textContent = percentFormatter.format(federalEffective);
  document.getElementById('stateMarginal').textContent = percentFormatter.format(stateRate);
  document.getElementById('stateEffective').textContent = percentFormatter.format(stateEffective);

  document.getElementById('fedTax').textContent = numberFormatter.format(federalTax);
  document.getElementById('stateTax').textContent = numberFormatter.format(stateTax);

  const headlineResult = document.getElementById('headlineResult');
  const headlineDetail = document.getElementById('headlineDetail');
  const percentChange = investment > 0 ? (proceeds - investment) / investment : 0;
  const gainLossValue = proceeds - investment;
  const gainLossPrefix = gainLossValue >= 0 ? '+' : '-';
  const gainLossLabel = `${gainLossPrefix}${numberFormatter.format(Math.abs(gainLossValue))}`;
  const percentLabel = `${percentChange >= 0 ? '+' : '-'}${percentFormatter.format(Math.abs(percentChange))}`;
  const saleLabel = saleDate && saleDate.toDateString() === new Date().toDateString()
    ? 'today'
    : `on ${formatDateLabel(saleDate)}`;

  headlineResult.textContent = `A ${numberFormatter.format(investment)} investment in ${token} on ${formatDateLabel(purchaseDate)} would be worth ${numberFormatter.format(proceeds)} if sold on ${formatDateLabel(saleDate)}.`;
  headlineDetail.textContent = '';

  document.getElementById('afterTaxValue').textContent = numberFormatter.format(afterTaxValue);
  const afterTaxGainEl = document.getElementById('afterTaxGain');
  afterTaxGainEl.textContent = `${afterTaxGain >= 0 ? '+' : '-'}${numberFormatter.format(Math.abs(afterTaxGain))}`;
  afterTaxGainEl.className = afterTaxGain >= 0 ? 'positive' : 'negative';

  // Static SVG chart; no dynamic background updates needed.
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

inputIds.forEach((id) => {
  const element = document.getElementById(id);
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

const saleMonth = document.getElementById('saleMonth');
const saleDay = document.getElementById('saleDay');
const saleYear = document.getElementById('saleYear');
const purchaseMonth = document.getElementById('purchaseMonth');
const purchaseDay = document.getElementById('purchaseDay');
const purchaseYear = document.getElementById('purchaseYear');
if (saleMonth && saleDay && saleYear) {
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  if (!saleMonth.value && !saleDay.value && !saleYear.value) {
    setDateParts('sale', localToday);
  }
}

if (purchaseMonth && purchaseDay && purchaseYear) {
  if (!purchaseMonth.value && !purchaseDay.value && !purchaseYear.value) {
    purchaseMonth.value = '12';
    purchaseDay.value = '17';
    purchaseYear.value = '2017';
  }
}

function wireDateInputs(prefix) {
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
    });
  });
}

wireDateInputs('purchase');
wireDateInputs('sale');

update();
setupLiveReload();
