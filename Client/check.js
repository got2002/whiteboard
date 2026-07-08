import https from 'https';
const url = 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Saturn_%28planet%29_large.png';
https.request(url, { method: 'HEAD' }, (res) => console.log('Status:', res.statusCode)).end();
