document.addEventListener("DOMContentLoaded", async () => {
  verify(null, '/login');


 (async function() {
    try {
      const userinfo = await load(fetch(url + '/api/owner-info'));
      const data = await userinfo.json();
const user = data.message;
document.getElementById("student-name").textContent = `Hello, ${user.name}!`;
    } catch (err) {
      console.error(err);
    }
  })();
  

  
  const translist = document.getElementsByClassName("transactions-list")[0];
  
  const id = new URLSearchParams(window.location.search).get("card");
    const pageurl = new URLSearchParams(window.location.search).get("page") || 1;

  if (!id) {
    translist.innerHTML = "<p>Card ID missing!</p>";
    return;
  }

  try {
    const response = await load(fetch(`api/transactions-param?card=${id}&page=${pageurl}`));
    const data = await response.json();


    const totalPages = Math.ceil(data.total / data.limit);
    const page = data.current;

    document.getElementById("totalPages").textContent = totalPages;
    document.getElementById("currentPage").value = page;
    document.getElementById("currentPage").max = totalPages;
  
if(page || isNaN(totalPages)){
  document.getElementById("totalPages").textContent = 1;
  document.getElementById("currentPage").value = 1;
  document.getElementById("currentPage").max = 1;
  document.getElementById("back-button").style.display = "none";
  document.getElementById("next-button").style.display = "none";
}

if(page==totalPages){
  document.getElementById("next-button").style.display = "none";
}

    if (data.message && Array.isArray(data.message)) {
      data.message.forEach((tx) => {
        const txElement = document.createElement("div");
        txElement.classList.add("transaction-entry");
        txElement.innerHTML = `
<span>${tx.type === "DEBIT" ? tx.status === "SUCCESS" ? "💳 Purchase successful" :  "❌ Insufficient balance" : tx.type === "CREDIT" ?   "💰 Top-up": ""}</span>
          <span>${tx.type === "DEBIT" ? "-" : "+"}$${Math.abs(tx.amount).toFixed(2)}</span>
          <span>${shortDate(tx.date)}</span>
        `;
        translist.appendChild(txElement);
      });
    } else {
      translist.innerHTML = "<p>No transactions found for this card.</p>";
    }
  } catch (err) {
    console.error("Error fetching transactions:", err);
    translist.innerHTML = "<p>Something went wrong!</p>";
  }
});

async function back() {
  const id = new URLSearchParams(window.location.search).get("card");
  const page = parseInt(document.getElementById("currentPage").value) - 1;
  const url = `transactions?card=${id}&page=${page}`;
  window.location.href = url;
}

async function next() {
  const id = new URLSearchParams(window.location.search).get("card");
  const page = parseInt(document.getElementById("currentPage").value) + 1;
  const url = `transactions?card=${id}&page=${page}`;
  window.location.href = url;
}

document.getElementById('currentPage').addEventListener('change', async function() {
    const max = parseInt(this.max);
  let value = parseInt(this.value);

  if (isNaN(value)) return; 

  if (value > max) {
    value = max;
    this.value = max;
  }

  const id = new URLSearchParams(window.location.search).get("card");
  const page = parseInt(this.value);
  const url = `transactions?card=${id}&page=${page}`;
  window.location.href = url;
});