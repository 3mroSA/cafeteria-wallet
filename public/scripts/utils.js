
const url = ''
const verify = async (redirect, redirectInvalid) => {
  try {
    const response = await load(
      fetch(url + '/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );

    const data = await response.json();

    if (response.ok) {
      if (redirect) {
        window.location.href = redirect;
        return data;
      }
    } else {
      if (redirectInvalid) {
        console.log(response);
        window.location.href = redirectInvalid;
      }
    }
  } catch (err) {
    if (redirectInvalid) {
      console.log(err);
      window.location.href = redirectInvalid;
    }
    console.log(err);
  }
};

  
const load = async (promise) => {
  const loader = document.getElementsByClassName('loader')[0]
  loader.style.display = 'block';
  

     try{
    const [result] = await Promise.all([
      promise,
      new Promise(res => setTimeout(res, 200)) 
    ]);
  


    return result;
} catch(err){
    console.log(err)
    return null
} finally{
loader.style.display = 'none';
}
  };
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' }); 
    const year = date.getFullYear();
  
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
  
    return `${day}${suffix} of ${month}, ${year}`;
  }
  
  function shortDate(dateString) {
      const date = new Date(dateString);
      
      const day = date.getDate();
      const month = date.getMonth() + 1; 
      
      const paddedDay = day < 10 ? `0${day}` : day;
      const paddedMonth = month < 10 ? `0${month}` : month;
    
      return `${paddedMonth}/${paddedDay}`;
    
    
  }
  

  (async () => {
    try {
      const response = await fetch(url + '/api/owner-info');
      const data = await response.json();
      if (data.message.role >= 2 && data.message.verified === true) {
        const verifyelm = document.createElement('a')
        verifyelm.href = '/purchase'
        verifyelm.textContent = 'Purchase'
        verifyelm.className = 'text-black font-semibold hover:bg-[#f15156] hover:text-white px-4 py-2 rounded transition';
        document.getElementsByClassName('links')[0].appendChild(verifyelm)
      } 
      if (data.message.role >= 3 && data.message.verified === true) {
        const panelelm = document.createElement('a')
        panelelm.href = '/admin'
        panelelm.textContent = 'Admin Panel'
                panelelm.className = 'text-black font-semibold hover:bg-[#f15156] hover:text-white px-4 py-2 rounded transition';

        document.getElementsByClassName('links')[0].appendChild(panelelm)
      }
    } catch (err) {
      console.error(err);
    }
  })();

  