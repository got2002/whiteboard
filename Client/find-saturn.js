import https from 'https';
const req = https.get('https://api.github.com/search/code?q=saturn.png+extension:png', {
  headers: { 'User-Agent': 'NodeJS' }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const items = JSON.parse(data).items;
      items.slice(0, 5).forEach(i => console.log(i.html_url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')));
    } catch(e) {
      console.log('Error parsing JSON');
    }
  });
});
