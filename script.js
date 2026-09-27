/*
  Ye variables JavaScript ko HTML elements ke saath connect karte hain.
  querySelector() CSS selector ke matching element ko find karta hai.
  Hum element ko variable mein save karte hain taake baad mein
  page par dobara search kiye baghair usay use kar saken.
*/
const form = document.querySelector("#currency-form");
const fromInput = document.querySelector("#from-currency");
const toInput = document.querySelector("#to-currency");
const currencyOptions = document.querySelector("#currency-options");
const result = document.querySelector("#result");
let availableCurrencies = [];

/*
  Ye function first API request send karta hai.
  API response mein rates object hota hai jisme currency codes keys hoti hain,
  jaise USD, EUR, GBP aur PKR. Ye keys user ki suggestions ban jati hain.
*/
async function loadCurrencies() {
  const response = await fetch("https://open.er-api.com/v6/latest/USD");
  const data = await response.json();
  console.log(data);
  if (!response.ok || data.result !== "success") {
    throw new Error("Currencies could not be loaded.");
  }

  availableCurrencies = Object.keys(data.rates).sort();
  currencyOptions.innerHTML = ["ALL", ...availableCurrencies]
    .map((currency) => `<option value="${currency}">${currency}</option>`)
    .join("");
}

/*
  Ye function page par conversion results create karta hai.
  Agar user one currency choose kare to currencies mein ek code hota hai.
  Agar user ALL choose kare to currencies mein tamam rate keys hoti hain.
  Har row ko data-currency milta hai taake search function usay pehchan sake.
*/
function showResults(amount, fromCurrency, rates, targetCurrency) {
  const currencies =
    targetCurrency === "ALL" ? Object.keys(rates).sort() : [targetCurrency];

  result.innerHTML = `
    <h2>Exchange Rates</h2>
    ${
      targetCurrency === "ALL"
        ? `
      <label for="currency-search">Search in all currencies:</label>
      <input id="currency-search" type="search" placeholder="Search currency code, e.g. EUR">
      `
        : ""
    }
    <div class="results-list">
      ${currencies
        .map(
          (currency) => `
        <p class="currency-result" data-currency="${currency}">
          <strong>${amount} ${fromCurrency}</strong> =
          <strong>${(amount * rates[currency]).toFixed(2)}
            <span class="currency-code">${currency}</span>
          </strong>
        </p>
      `,
        )
        .join("")}
    </div>
  `;

  /*
    Search input sirf tab banta hai jab ALL results show ho rahe hon.
    Isliye listener result.innerHTML ke baad attach kiya jata hai,
    kyunki us se pehle search input page par exist nahi karta.
  */
  if (targetCurrency === "ALL") {
    document
      .querySelector("#currency-search")
      .addEventListener("input", filterCurrencyResults);
  }
}

/*
  Ye function ALL-currencies search mein har typing par run hota hai.
  Jo rows typed code contain nahi karti, unhein hide karta hai.
  Matching rows par CSS class lagti hai jo highlight create karti hai.
*/
function filterCurrencyResults(event) {
  const searchTerm = event.target.value.trim().toUpperCase();
  const rows = document.querySelectorAll(".currency-result");

  rows.forEach((row) => {
    const currency = row.dataset.currency;
    const isMatch = currency.includes(searchTerm);

    row.hidden = !isMatch;
    row.classList.toggle("currency-match", isMatch && searchTerm !== "");
  });
}

/*
  Ye function form submit hone par run hota hai.
  Ye user ki values read aur validate karta hai, phir source currency
  ke basis par API se rates mangta hai aur values showResults() ko deta hai.
*/
async function convertCurrency(event) {
  event.preventDefault();
  const amount = Number(document.querySelector("#amount").value);
  const fromCurrency = fromInput.value.trim().toUpperCase();
  const targetCurrency = toInput.value.trim().toUpperCase();

  if (
    !availableCurrencies.includes(fromCurrency) ||
    (targetCurrency !== "ALL" && !availableCurrencies.includes(targetCurrency))
  ) {
    result.textContent =
      "Please choose valid currency codes from the suggestions.";
    return;
  }

  result.textContent = "Loading exchange rates...";
  try {
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${encodeURIComponent(fromCurrency)}`,
    );
    const data = await response.json();

    if (!response.ok || data.result !== "success") {
      throw new Error("Exchange rates could not be loaded.");
    }

    showResults(amount, fromCurrency, data.rates, targetCurrency);
  } catch (error) {
    result.textContent = "Exchange rates load nahi ho sake. Dobara try karein.";
  }
}

/*
  Submit listener browser ko batata hai ke form submit hone par
  convertCurrency run karna hai. Function ke saath parentheses nahi hain
  kyunki function abhi nahi, submit event ke time baad mein run hona hai.
*/
form.addEventListener("submit", convertCurrency);

/*
  Script start hote hi currency suggestions load hoti hain.
  Agar network request fail ho jaye to catch() error handle karta hai
  aur result section mein user ko message show karta hai.
*/
loadCurrencies().catch(() => {
  result.textContent = "Currency list load nahi ho saki.";
});
