
verify(null, '/login');

  document.querySelector('.form').addEventListener('submit', async function (e) {
    e.preventDefault(); 
    const code = document.getElementById('code').value;
    const amount = document.getElementById('amount').value;
  
    try {
      const response = await load(fetch(url + '/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
                },
        body: JSON.stringify({ code, amount })
      }));
  
      const responsebx = document.getElementById('responsebx');
      
      if(!response){
          responsebx.textContent = 'Server unreachable.';
          setTimeout(() => {responsebx.textContent = ''}, 3 * 1000);
          return
    }
    
    
    const data = await response.json();
      if (response.ok) {
        document.getElementById('responsebx').textContent = data.message;
        amount.value = ''
        code.value = ''
        setTimeout(() => {responsebx.textContent = ''}, 2 * 1000);
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
  