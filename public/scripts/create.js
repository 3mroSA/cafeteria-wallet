
verify(null, '/login');

(async function() {
  try {
    const userinfo = await load(fetch(url + '/api/owner-info'));
    const user = await userinfo.json();
    document.getElementById("name").textContent = `${user.message.name}!`;
  } catch (err) {
    console.error(err);
  }
})();


document.querySelector('.form').addEventListener('submit', async function(e) {
  e.preventDefault(); 
  const cardname = document.getElementById('cardname').value;
  if(!cardname){
    return document.getElementById('responsebx').textContent = 'Missing card name.';
  }

  try {
    const response = await load(fetch(url + '/api/createc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cardname })
    }));
    const data = await response.json();
    if (response.ok) {
      document.getElementById('responsebx').textContent = data.message;
      setTimeout(() => {
        window.location.href = '/wallet';
      }, 1000);
    } else {
      document.getElementById('responsebx').textContent = data.message;
    }
  } catch (err) {
    console.error(err);
    document.getElementById('responsebx').textContent = 'An error occurred. Please try again.';
  }
});
