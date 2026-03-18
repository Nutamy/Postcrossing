async function savePostcard() {
  const response = await fetch('/.netlify/functions/add-postcard', {
    method: 'POST',
    body: JSON.stringify({ country: "Kazakhstan", city: "Almaty" })
  });
  const data = await response.json();
  console.log(data.message);
}