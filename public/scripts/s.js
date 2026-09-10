
verify('/home', null);

  document.querySelector('.form').addEventListener('submit', async function (e) {
    e.preventDefault(); 
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const phone = document.getElementById('phone').value;
    const name = document.getElementById('name').value;
      const username = document.getElementById('username').value;

    try {
      const response = await load(fetch(url + '/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
                },
        body: JSON.stringify({ email, password, phone, name, username })
      }));
  
      const responsebx = document.getElementById('responsebx');
      
      if(!response){
          responsebx.textContent = 'Server unreachable.';
          setTimeout(() => {responsebx.textContent = ''}, 3000);
          return
    }
    
    
    const data = await response.json();
      if (response.ok) {
        document.getElementById('responsebx').textContent = data.message;
        window.location.href = 'home';
      } else {
        responsebx.textContent = data.message;
      }
    } catch (error) {
      console.error(error);
      responsebx.textContent = 'An error occurred. Please try again.';
      setTimeout(() => {responsebx.textContent = ''}, 3000);
    }
  });
  