const express = require('express');
const fetch = require('node-fetch'); // ต้องใช้เวอร์ชัน 2.x
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>Server IP & Port Viewer</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, sans-serif;
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          color: white;
          padding: 20px;
          min-height: 100vh;
        }
        h2 {
          text-align: center;
          color: #4cafef;
        }
        form {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 15px;
        }
        input, button {
          padding: 10px;
          border-radius: 5px;
          border: none;
          font-size: 14px;
        }
        input {
          background: #2e2e4f;
          color: white;
        }
        input:focus {
          outline: 2px solid #4cafef;
        }
        button {
          background: #4cafef;
          color: white;
          cursor: pointer;
        }
        button:hover {
          background: #3a9fd9;
        }
        #result {
          max-width: 700px;
          margin: 0 auto;
          background: #222244;
          padding: 15px;
          border-radius: 8px;
        }
        #searchBox {
          width: 100%;
          padding: 10px;
          margin-bottom: 10px;
          background: #1f1f35;
          border: none;
          border-radius: 5px;
          color: white;
        }
        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        li.player-row {
          display: flex;
          justify-content: space-between; /* จัดให้ฝั่งซ้าย-ขวาแยกกัน */
          align-items: center;
          background: #323a5a;
          margin: 6px 0;
          padding: 10px 12px;
          border-radius: 6px;
          width: 100%;
        }
        .player-left {
          display: flex;
          flex-direction: column;
          min-width: 0; /* สำคัญเพื่อให้ ellipsis ทำงาน */
        }
        .player-id {
          font-weight: 700;
          color: #ffd54f;
          opacity: .95;
          margin-bottom: 2px;
        }
        .player-name {
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .ping {
          padding: 4px 10px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 12px;
          line-height: 1;
          flex-shrink: 0;
          margin-left: auto; /* ดันไปขวาสุด */
          box-shadow: 0 0 0 1px rgba(0,0,0,.2) inset;
        }
        .ping-green  { background: #2e7d32; color: #fff; }
        .ping-orange { background: #ef6c00; color: #fff; }
        .ping-red    { background: #c62828; color: #fff; }

        .header-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 8px 0 12px;
          color: #9ecbff;
        }
        .muted { opacity: .75; font-size: 13px; }
      </style>
    </head>
    <body>
      <h2>🔍 FiveM Player Viewer</h2>

      <form id="serverForm">
        <input type="text" id="ip" placeholder="IP เช่น 146.19.69.69" required>
        <input type="number" id="port" placeholder="Port เช่น 30120" required>
        <button type="submit">เริ่มติดตาม</button>
      </form>

      <div id="result">
        <input type="text" id="searchBox" placeholder="ค้นหาชื่อผู้เล่น..." style="display:none;">
        <div class="header-row" id="meta" style="display:none;"></div>
        <div id="playerList"></div>
      </div>
      
      <script>
        const form = document.getElementById('serverForm');
        const listEl = document.getElementById('playerList');
        const searchBox = document.getElementById('searchBox');
        const meta = document.getElementById('meta');

        let allPlayers = [];
        let savedIP = "";
        let savedPort = "";
        let refreshInterval = null;

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          savedIP = document.getElementById('ip').value.trim();
          savedPort = document.getElementById('port').value.trim();

          await fetchPlayers();

          if (refreshInterval) clearInterval(refreshInterval);
          refreshInterval = setInterval(fetchPlayers, 120000);
        });

        async function fetchPlayers() {
          if (!savedIP || !savedPort) return;

          listEl.innerHTML = '<p>⏳ กำลังดึงข้อมูล...</p>';
          searchBox.style.display = "none";
          meta.style.display = "none";

          try {
            const res = await fetch('/players?ip=' + encodeURIComponent(savedIP) + '&port=' + encodeURIComponent(savedPort));
            const data = await res.json();

            if (data.error) {
              listEl.innerHTML = '<p style="color:red">❌ ' + data.error + '</p>';
              return;
            }

            allPlayers = Array.isArray(data) ? data : [];
            searchBox.style.display = "block";

            meta.style.display = "flex";
            meta.innerHTML = 
              '<span><strong>Server:</strong> ' + savedIP + ':' + savedPort + '</span>' +
              '<span class="muted">•</span>' +
              '<span><strong>Players:</strong> ' + allPlayers.length + '</span>' +
              '<span class="muted">•</span>' +
              '<span class="muted">Updated: ' + new Date().toLocaleTimeString() + '</span>';

            renderPlayers(allPlayers);

          } catch (err) {
            listEl.innerHTML = '<p style="color:red">❌ Error: ' + err.message + '</p>';
          }
        }

        function renderPlayers(players) {
          if (!players.length) {
            listEl.innerHTML = '<p>ไม่มีผู้เล่นออนไลน์</p>';
            return;
          }

          let html = '<ul>';
          players.forEach(p => {
            const pingVal = Number(p.ping ?? 0);
            let pingClass = 'ping-green';
            if (pingVal > 100) pingClass = 'ping-red';
            else if (pingVal >= 50) pingClass = 'ping-orange';

            html +=
              '<li class="player-row">' +
                '<div class="player-left">' +
                  '<div class="player-id">ID: ' + p.id + '</div>' +
                  '<div class="player-name">' + (p.name || '(unknown)') + '</div>' +
                '</div>' +
                '<span class="ping ' + pingClass + '">' + pingVal + ' ms</span>' +
              '</li>';
          });
          html += '</ul>';

          listEl.innerHTML = html;
        }

        searchBox.addEventListener('input', () => {
          const keyword = searchBox.value.toLowerCase();
          const filtered = allPlayers.filter(p => (p.name || '').toLowerCase().includes(keyword));
          renderPlayers(filtered);
        });
      </script>
    </body>
    </html>
  `);
});

app.get('/players', async (req, res) => {
  const { ip, port } = req.query;
  if (!ip || !port) {
    return res.status(400).json({ error: 'ต้องระบุ IP และ Port' });
  }

  try {
    const response = await fetch(`http://${ip}:${port}/players.json`);
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: 'ดึง players.json ไม่สำเร็จ' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const SERVER_PORT = process.env.PORT || 3000;
app.listen(SERVER_PORT, () => {
  console.log(`✅ Server running at http://localhost:${SERVER_PORT}`);
});
