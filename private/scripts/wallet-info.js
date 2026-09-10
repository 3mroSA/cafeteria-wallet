
verify(null, '/login');

  document.querySelector('.form').addEventListener('submit', async function (e) {
    e.preventDefault(); 
    const code = document.getElementById('code').value;
      const id = document.getElementById('id').value;

      if(!code && !id){
        return document.getElementById('responsebx').textContent = 'Missing code or id.';
      }
const params = new URLSearchParams();
  if (code) params.append('code', code);
  if (id) params.append('id', id);

  try {
    const response = await load(fetch(`${url}/api/wallet-info?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }));

  
      const responsebx = document.getElementById('responsebx');
      
      if(!response){
          responsebx.textContent = 'Server unreachable.';
          setTimeout(() => {responsebx.textContent = ''}, 3 * 1000);
          return
    }
    
    
    const data = await response.json();

      if (response.ok) {
        code.value = ''
        id.value = ''

	const cards = await data.cards

    const container = document.getElementById("wallet-cards-container");

console.log(cards, data)

document.getElementsByClassName('form')[0].innerHTML='';
document.getElementById('wallet-cards-container').style.display = 'block';

const user = data.owner

const userdisplay = document.getElementById('user')

userdisplay.innerHTML = `
      <h3>👤 ${user.name.replace(/\b\w/g, c => c.toUpperCase())}</h3>
      <div class="info-row"><strong>Username:</strong> <span>${user.username}</span></div>
      <div class="info-row"><strong>Email:</strong> <span>${user.email}</span></div>
      <div class="info-row"><strong>Phone:</strong> <span>${user.phone}</span></div>
      <div class="info-row"><strong>Role:</strong> <span>${user.role}</span></div>
      <div class="info-row"><strong>Verified:</strong> <span>${user.verified ? 'Yes' : 'No'}</span></div>
      <div class="info-row"><strong>User ID:</strong> <span>${user._id}</span></div>


`
userdisplay.style.display = 'block';
	cards.forEach((card, index) =>
	{
		(async () =>
		{
			const cardElement = document.createElement("div");
			cardElement.classList.add("wallet-card");

let selectedMethod = null
let inputtedMethod = null
if (code) {
  selectedMethod = 'code';
  inputtedMethod = code
} else if (id) {
  selectedMethod = 'id';
  inputtedMethod = id
}


if(card.code == inputtedMethod || card._id == inputtedMethod){
  cardElement.style.border = '5px solid var(--prim)';
}
			cardElement.innerHTML = `
      <h3>💳 ${card.cName.replace(/\b\w/g, c => c.toUpperCase())}</h3>
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
      <button onclick="window.location.href='/transactions?card=${card._id}'">🔄 View Transactions</button>
      </div>
          
            
          
        
        </div>
        
        		<p class="text-muted" style="margin-top: 15px;">Card ID: ${card._id}</p>

<p id="${card._id}" class="error-message"></p>
        </div>
        `;
			container.appendChild(cardElement);
		})();
    });



      } else {
        responsebx.textContent = data.message;
              setTimeout(() => {responsebx.textContent = ''}, 3 * 1000);

      }
    } catch (error) {
      console.error(error);
      responsebx.textContent = 'An error occurred. Please try again.';
      setTimeout(() => {responsebx.textContent = ''}, 3 * 1000);
    }
  });
  