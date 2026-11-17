const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const signaturesFile = path.join(__dirname, 'signatures.json');

function readSignatures() {
  try {
    if (!fs.existsSync(signaturesFile)) {
      fs.writeFileSync(signaturesFile, '[]\n', 'utf8');
      return [];
    }

    const raw = fs.readFileSync(signaturesFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeSignatures(names) {
  fs.writeFileSync(signaturesFile, `${JSON.stringify(names, null, 2)}\n`, 'utf8');
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname, { index: 'index.html' }));

app.get('/api/signatures', (req, res) => {
  const names = readSignatures();
  res.json({ signatures: names });
});

app.post('/api/signatures', (req, res) => {
  const rawName = typeof req.body?.name === 'string' ? req.body.name : '';
  const name = rawName.replace(/\s+/g, ' ').trim();

  if (!name) {
    return res.status(400).json({ error: 'Please enter your name.' });
  }

  const current = readSignatures();
  const alreadyExists = current.some(
    (entry) => entry.toLowerCase() === name.toLowerCase()
  );

  if (alreadyExists) {
    return res.status(409).json({
      error: 'You have already signed this petition.'
    });
  }

  const updated = [...current, name];
  writeSignatures(updated);

  res.status(201).json({
    message: 'Signature saved.',
    signatures: updated
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Petition server running at http://localhost:${PORT}`);
});
