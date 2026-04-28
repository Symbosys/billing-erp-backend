fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@symbosys.com', password: 'password123' })
}).then(r => r.json()).then(console.log).catch(console.error);
