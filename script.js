const inputIds = [
  'investment',
  'buyPrice',
  'sellPrice',
  'investmentFee',
  'exitFee',
  'income',
  'state',
  'filingStatus',
  'longTerm',
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

const numberFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getBracket(income, status) {
  const brackets = federalBrackets[status] || federalBrackets.single;
  return brackets.find((bracket) => income <= bracket.cap) || brackets[0];
}

function readNumber(id) {
  const value = Number(document.getElementById(id).value);
  return Number.isFinite(value) ? value : 0;
}

function update() {
  const investment = readNumber('investment');
  const buyPrice = readNumber('buyPrice');
  const sellPrice = readNumber('sellPrice');
  const investmentFee = readNumber('investmentFee');
  const exitFee = readNumber('exitFee');
  const income = readNumber('income');
  const state = document.getElementById('state').value;
  const filingStatus = document.getElementById('filingStatus').value;
  const isLongTerm = document.getElementById('longTerm').checked;

  const tokenAmount = buyPrice > 0 ? investment / buyPrice : 0;
  const proceeds = tokenAmount * sellPrice;
  const fees = investmentFee + exitFee;
  const capitalGains = proceeds - investment - fees;

  const bracket = getBracket(income, filingStatus);
  const federalRate = isLongTerm ? bracket.rate * 0.75 : bracket.rate;
  const federalEffective = isLongTerm ? bracket.effective * 0.75 : bracket.effective;

  const stateRate = stateRates[state] ?? 0.05;
  const stateEffective = stateRate * 0.9;

  const federalTax = Math.max(capitalGains, 0) * federalEffective;
  const stateTax = Math.max(capitalGains, 0) * stateEffective;
  const totalTax = federalTax + stateTax;

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
  const eventName = element.type === 'checkbox' ? 'change' : 'input';
  element.addEventListener(eventName, update);
});

update();
setupLiveReload();
