verify(null, '/login');









(async () => {
    try {
      const response = await fetch(url + '/api/wallet-info');
      const data = await response.json();
const totalcards = document.getElementById('totalcards');
const totalbalance = document.getElementById('totalbalance');
totalcards.textContent = data.length
const cardnum = data.length
 
let total = 0
for (let i = 0; i < data.length; i++) {
  total += data[i].balance;
}
totalbalance.textContent = total

    } catch (err) {
      console.error(err);
    }
  })();


  (async () => {
    try {
      const response = await fetch(url + '/api/owner-info');
      const data = await response.json();
      document.getElementById('name').textContent = data.message.name

    } catch (err) {
      console.error(err);
    }
  })();

window.addEventListener("scroll", () => {
  if (window.scrollX !== 0) {
    window.scrollTo(0, window.scrollY);
  }
});



//   (async () => {
//     try {
//       const response = await fetch(url + '/api/recent-transactions');
//       const data = await response.json();
  
//       if (data.message === "No transactions found") {
//         console.log("No transactions to display.");
//         const transactions = document.getElementsByClassName('transactions')[0];
//         transactions.innerHTML = "<p>No recent transactions found.</p>";
//       } else if (Array.isArray(data.message) && data.message.length > 0) {
//         const transactions = document.getElementsByClassName('transactions')[0];

// let formateddate = formatDate(data.message[0].date)

//         for (let i = 0; i < data.message.length; i++) {
//           const element = document.createElement('li');
//           element.innerHTML = `
//           <li class="transaction-li">
//   <div class="transaction-box">
//     <h3 class="transaction-date">${shortDate(data.message[i].date)}</h3>
//     <div class="transaction-values">
//       <p class="amount-holder">Amount: <span class="amount">${data.message[i].amount} SAR</span></p>
//       <hr class="divider" />
//       <p class="card-name">Name: <span class="card-name-text">${data.message[i].cardName}</span></p>
//       <hr class="divider" />
//       <p class="card-last4">Card: ******<span class="code">${data.message[i].card}</span></p>
//       <hr class="divider" />
//       <p class="new-balance"><span class="new-balance-amount">${data.message[i].new_balance}</span> SAR</p>
//     </div>
//   </div>
// </li>

//           `;
//           transactions.appendChild(element);
//         }
//       } else {
//         console.log("Unexpected response from server:", data.message);
//         const transactions = document.getElementsByClassName('transactions')[0];
//         transactions.innerHTML = "<p>Sorry, something went wrong. Please try again later.</p>";
//       }
//     } catch (err) {
//       console.error("Error fetching transactions:", err);
//       const transactions = document.getElementsByClassName('transactions')[0];
//       transactions.innerHTML = "<p>Failed to load transactions. Please check your connection.</p>";
//     }
//   })();
  
  
  


  