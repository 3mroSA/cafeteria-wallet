const freezeCard = async (id) =>
{
	const response = await fetch(url + "/api/card-status-ID",
	{
		method: "POST",
		headers:
		{
			"Content-Type": "application/json",
		},
		body: JSON.stringify(
		{
			id
		}),
	});
	const data = await response.json();
	const responsebx = document.getElementById(id);

	if (response.ok)
	{
		window.location.reload();
	}
	else
	{
		responsebx.textContent = data.message;
	}
};
document.addEventListener("DOMContentLoaded", async () =>
{







	verify(null, '/login');



	(async function ()
	{
		try
		{
			const userinfo = await load(fetch(url + '/api/owner-info'));
			const userData = await userinfo.json();
			let username = userData.message.name;
			username = username.replace(/\b\w/g, c => c.toUpperCase());

			document.getElementById("student-name").textContent = `Hello, ${username}!`;
		}
		catch (err)
		{
			console.error(err);
		}
	})();





	const response = await load(fetch(url + "/api/wallet-info"));

	const walletCards = await response.json()

	const container = document.getElementById("wallet-cards-container");




	walletCards.forEach((card, index) =>
	{
		(async () =>
		{
			const response = await fetch(url + "/api/recent-transactions");
			const transactions = await response.json();
			const cardElement = document.createElement("div");
			cardElement.classList.add("wallet-card");
			const transactionsList = Array.isArray(transactions.message) ? transactions.message : [];

			cardElement.innerHTML = `
      <h3> ${card.cName.replace(/\b\w/g, c => c.toUpperCase())}</h3>
      <div class="info-row"><strong>Card Balance:</strong> <span>$${card.balance.toFixed(2)}</span></div>
      <div class="info-row"><strong>Card Name:</strong> <span>${card.cName}</span></div>
            <div class="info-row"><strong>Card Status:</strong> <span>${card.active ? 'Active' : 'Inactive'}</span></div>

  
              <div class="info-row">
    <strong>Code:</strong>
    <span style="user-select:none; letter-spacing: 0.3em;">••••••••••</span>
    <button type="button" onclick="
      const span=this.previousElementSibling;
      if(span.textContent.includes('•')){
        span.textContent='${card.code}'; 
        this.textContent='Hide';
      } else {
        span.textContent='••••••••••'; 
        this.textContent='Show';
      }
    ">Show</button>
  </div>
      
      <div class="actions">
      <button onclick="window.location.href='/transactions?card=${card._id}'"> View Transactions</button>
      <button> Add Funds</button>
      <button> Withdraw Funds</button>
      </div>
      
      <h4 style="margin-top: 15px;">Recent Transactions:</h4>
      <div class="transactions-list">
      ${transactionsList
        .filter(tx => tx.card === card.code || tx.card === card.code.toString().slice(-4)) // bcoz if the user is an admin it will show the entire card code but if not it will only show last 4 so we need to filter it
        .map(
            (tx) => `
            <div class="transaction-entry">
<span>${tx.type === "DEBIT" ? tx.status === "SUCCESS" ? " Purchase successful" :  " Insufficient balance" : tx.type === "CREDIT" ?   " Top-up": ""}</span>

            <span>${tx.type.toUpperCase() === "DEBIT" ? "-" : "+"}$${Math.abs(tx.amount).toFixed(2)}</span>
          <span>${shortDate(tx.date)}</span>
          
            </div>
            
            
            `
        )
        .join("")}
        </div>
        
        <div class="actions" style="margin-top: 15px;">
<button type="button" onclick="event.preventDefault(); freezeCard('${card._id}');">
        ${card.active ? ' Freeze Card' : ' Activate Card'}
        </button>
        </button>
        <br>

		<p class="text-muted" style="margin-top: 15px;">Card ID: ${card._id}</p>

<p id="${card._id}" class="error-message"></p>
        </div>
        `;
			container.appendChild(cardElement);
		})();
	});




});