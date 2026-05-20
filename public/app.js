const API_URL = '/api';

// --- DOM Elementleri ---
// Navigasyon
const navDashboard = document.getElementById('nav-dashboard');
const navMatches = document.getElementById('nav-matches');
const navOpenings = document.getElementById('nav-openings');

const sectionDashboard = document.getElementById('section-dashboard');
const sectionMatches = document.getElementById('section-matches');
const sectionOpenings = document.getElementById('section-openings');

// Maçlar
const tbodyMatches = document.getElementById('matches-tbody');
const btnAddMatch = document.getElementById('btn-add-match');
const matchFormContainer = document.getElementById('match-form-container');
const matchForm = document.getElementById('match-form');
const btnCancelMatch = document.getElementById('btn-cancel-match');
const selectOpening = document.getElementById('opening');
const matchFormTitle = document.getElementById('match-form-title');

// Arama & Filtreleme & Import/Export
const filterSearch = document.getElementById('filter-search');
const filterResult = document.getElementById('filter-result');
const filterColor = document.getElementById('filter-color');
const filterOpening = document.getElementById('filter-opening');
const btnExportCsv = document.getElementById('btn-export-csv');
const btnExportJson = document.getElementById('btn-export-json');
const btnImportTrigger = document.getElementById('btn-import-trigger');
const importFileInput = document.getElementById('import-file');

// Açılışlar
const tbodyOpenings = document.getElementById('openings-tbody');
const btnAddOpening = document.getElementById('btn-add-opening');
const openingFormContainer = document.getElementById('opening-form-container');
const openingForm = document.getElementById('opening-form');
const btnCancelOpening = document.getElementById('btn-cancel-opening');

// Toast
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastIcon = document.getElementById('toast-icon');

// --- Global Chart Örnekleri (Yeniden çizimlerde çakışmayı önlemek için) ---
let resultsChartInstance = null;
let colorChartInstance = null;
let ratingChartInstance = null;

// --- Satranç Tahtası Oynatıcı Durumları ---
let boardInstance = null;
let gameInstance = null;
let gameHistory = [];
let currentMoveIndex = -1;

// --- State ---
let openingsList = [];
let allMatchesList = [];

// --- Sayfa Yüklendiğinde ---
document.addEventListener('DOMContentLoaded', () => {
    loadOpenings();
    loadMatches();
    loadDashboard();

    // Bugünün tarihini varsayılan yap
    document.getElementById('matchDate').valueAsDate = new Date();
    
    // Satranç tahtası buton olaylarını tanımla
    setupBoardControls();
});

// --- Navigasyon İşlemleri ---
navDashboard.addEventListener('click', () => {
    setActiveTab(navDashboard, sectionDashboard);
    loadDashboard();
});

navMatches.addEventListener('click', () => {
    setActiveTab(navMatches, sectionMatches);
    loadMatches();
});

navOpenings.addEventListener('click', () => {
    setActiveTab(navOpenings, sectionOpenings);
    loadOpenings();
});

function setActiveTab(activeButton, activeSection) {
    [navDashboard, navMatches, navOpenings].forEach(btn => btn.classList.remove('active'));
    [sectionDashboard, sectionMatches, sectionOpenings].forEach(sec => sec.classList.add('hidden'));
    
    activeButton.classList.add('active');
    activeSection.classList.remove('hidden');
}

// --- Bildirim Sistemi (Toast) ---
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    if (type === 'success') {
        toast.className = 'toast show success';
        toastIcon.className = 'fa-solid fa-check-circle';
    } else {
        toast.className = 'toast show error';
        toastIcon.className = 'fa-solid fa-circle-exclamation';
    }

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- 1. AÇILIŞLAR API VE DOM İŞLEMLERİ ---
async function loadOpenings() {
    try {
        const response = await fetch(`${API_URL}/openings`);
        const openings = await response.json();
        openingsList = openings;
        
        renderOpeningsTable(openings);
        populateOpeningSelect(openings);
    } catch (error) {
        showToast('Açılışlar yüklenirken hata oluştu.', 'error');
        console.error(error);
    }
}

function renderOpeningsTable(openings) {
    if (openings.length === 0) {
        tbodyOpenings.innerHTML = '<tr><td colspan="4" class="text-center">Henüz açılış eklenmemiş.</td></tr>';
        return;
    }

    tbodyOpenings.innerHTML = openings.map(op => `
        <tr>
            <td>#${op.id}</td>
            <td><strong>${op.name}</strong></td>
            <td>${op.type}</td>
            <td>
                <button class="action-btn delete-btn" onclick="deleteOpening(${op.id})" title="Sil">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function populateOpeningSelect(openings) {
    // Form içi seçimi temizle ve yükle
    selectOpening.innerHTML = '<option value="" disabled selected>Açılış Seçiniz...</option>';
    // Filtreleme içi seçimi temizle ve yükle
    filterOpening.innerHTML = '<option value="">Tüm Açılışlar</option>';

    openings.forEach(op => {
        const option = document.createElement('option');
        option.value = op.id;
        option.textContent = op.name;
        selectOpening.appendChild(option);

        const filterOpt = document.createElement('option');
        filterOpt.value = op.id;
        filterOpt.textContent = op.name;
        filterOpening.appendChild(filterOpt);
    });
}

// Açılış Form İşlemleri
btnAddOpening.addEventListener('click', () => {
    openingFormContainer.classList.remove('hidden');
    openingForm.reset();
});

btnCancelOpening.addEventListener('click', () => {
    openingFormContainer.classList.add('hidden');
});

openingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('openingName').value;
    const type = document.getElementById('openingType').value;

    try {
        const response = await fetch(`${API_URL}/openings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type })
        });
        
        if (response.ok) {
            showToast('Açılış başarıyla eklendi!');
            openingFormContainer.classList.add('hidden');
            loadOpenings();
        } else {
            showToast('Açılış eklenemedi!', 'error');
        }
    } catch (error) {
        showToast('Sunucu hatası!', 'error');
    }
});

window.deleteOpening = async (id) => {
    if (!confirm('Bu açılışı silmek istediğinize emin misiniz? (Maç kayıtlarındaki açılış verileri korunur.)')) return;
    
    try {
        const response = await fetch(`${API_URL}/openings/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Açılış silindi.');
            loadOpenings();
            loadMatches();
        } else {
            showToast('Silme işlemi başarısız.', 'error');
        }
    } catch (error) {
        showToast('Sunucu hatası!', 'error');
    }
};

// --- 2. MAÇLAR API VE DOM İŞLEMLERİ ---
async function loadMatches() {
    try {
        const response = await fetch(`${API_URL}/matches`);
        const matches = await response.json();
        allMatchesList = matches;
        renderMatchesTable(matches);
    } catch (error) {
        showToast('Maçlar yüklenirken hata oluştu.', 'error');
        console.error(error);
    }
}

function renderMatchesTable(matches) {
    if (matches.length === 0) {
        tbodyMatches.innerHTML = '<tr><td colspan="6" class="text-center">Eşleşen maç bulunamadı.</td></tr>';
        return;
    }

    tbodyMatches.innerHTML = matches.map(m => {
        let resultClass = '';
        if (m.result === 'Galibiyet') resultClass = 'result-galibiyet';
        else if (m.result === 'Mağlubiyet') resultClass = 'result-maglubiyet';
        else resultClass = 'result-beraberlik';

        const ratingText = m.playerRating ? ` (${m.playerRating} ELO)` : '';

        return `
        <tr>
            <td>${new Date(m.date).toLocaleDateString('tr-TR')}</td>
            <td><strong>${m.opponentName}</strong>${ratingText}</td>
            <td>${m.playedAs === 'Beyaz' ? '♔ Beyaz' : '♚ Siyah'}</td>
            <td>${m.openingName || '<em>Bilinmiyor</em>'}</td>
            <td><span class="result-badge ${resultClass}">${m.result}</span></td>
            <td>
                <button class="action-btn view-btn" onclick="viewMatchDetails(${m.id})" title="Detaylı Analiz">
                    <i class="fa-solid fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editMatch(${m.id})" title="Düzenle">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteMatch(${m.id})" title="Sil">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

// Maç Form İşlemleri
btnAddMatch.addEventListener('click', () => {
    matchFormContainer.classList.remove('hidden');
    matchForm.reset();
    document.getElementById('matchDate').valueAsDate = new Date();
    document.getElementById('match-id').value = '';
    matchFormTitle.textContent = 'Yeni Maç Ekle';
});

btnCancelMatch.addEventListener('click', () => {
    matchFormContainer.classList.add('hidden');
});

matchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('match-id').value;
    const matchData = {
        opponentName: document.getElementById('opponent').value,
        playedAs: document.getElementById('playedAs').value,
        result: document.getElementById('result').value,
        openingId: document.getElementById('opening').value || null,
        date: document.getElementById('matchDate').value,
        notes: document.getElementById('matchNotes').value,
        pgn: document.getElementById('matchPgn').value,
        playerRating: document.getElementById('playerRating').value || null
    };

    const isUpdate = id !== '';
    const url = isUpdate ? `${API_URL}/matches/${id}` : `${API_URL}/matches`;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchData)
        });
        
        if (response.ok) {
            showToast(isUpdate ? 'Maç güncellendi!' : 'Maç başarıyla eklendi!');
            matchFormContainer.classList.add('hidden');
            loadMatches();
            loadDashboard();
        } else {
            showToast('İşlem başarısız!', 'error');
        }
    } catch (error) {
        showToast('Sunucu hatası!', 'error');
    }
});

window.deleteMatch = async (id) => {
    if (!confirm('Bu maçı silmek istediğinize emin misiniz?')) return;
    
    try {
        const response = await fetch(`${API_URL}/matches/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Maç silindi.');
            loadMatches();
            loadDashboard();
        } else {
            showToast('Silme işlemi başarısız.', 'error');
        }
    } catch (error) {
        showToast('Sunucu hatası!', 'error');
    }
};

window.editMatch = async (id) => {
    try {
        const response = await fetch(`${API_URL}/matches/${id}`);
        const match = await response.json();
        
        document.getElementById('match-id').value = match.id;
        document.getElementById('opponent').value = match.opponentName;
        document.getElementById('playedAs').value = match.playedAs;
        document.getElementById('result').value = match.result;
        document.getElementById('opening').value = match.openingId || '';
        document.getElementById('matchDate').value = match.date;
        document.getElementById('matchNotes').value = match.notes || '';
        document.getElementById('matchPgn').value = match.pgn || '';
        document.getElementById('playerRating').value = match.playerRating || '';
        
        matchFormTitle.textContent = 'Maçı Düzenle';
        matchFormContainer.classList.remove('hidden');
        sectionMatches.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showToast('Maç bilgileri alınamadı!', 'error');
    }
};

// --- 3. DİNAMİK ARAMA VE FİLTRELEME ---
function applyFilters() {
    const searchText = filterSearch.value.toLowerCase().trim();
    const resultVal = filterResult.value;
    const colorVal = filterColor.value;
    const openingVal = filterOpening.value;
    const startDateVal = document.getElementById('filter-start-date').value;
    const endDateVal = document.getElementById('filter-end-date').value;

    const filtered = allMatchesList.filter(m => {
        const notesText = m.notes ? m.notes.toLowerCase() : '';
        const matchSearch = m.opponentName.toLowerCase().includes(searchText) || notesText.includes(searchText);
        const matchResult = resultVal === "" || m.result === resultVal;
        const matchColor = colorVal === "" || m.playedAs === colorVal;
        const matchOpening = openingVal === "" || String(m.openingId) === openingVal;

        let matchDateMatch = true;
        if (m.date) {
            const mDate = m.date.split('T')[0];
            if (startDateVal && mDate < startDateVal) {
                matchDateMatch = false;
            }
            if (endDateVal && mDate > endDateVal) {
                matchDateMatch = false;
            }
        } else if (startDateVal || endDateVal) {
            matchDateMatch = false;
        }

        return matchSearch && matchResult && matchColor && matchOpening && matchDateMatch;
    });

    renderMatchesTable(filtered);
}

// Filtre tetikleyicileri
filterSearch.addEventListener('input', applyFilters);
filterResult.addEventListener('change', applyFilters);
filterColor.addEventListener('change', applyFilters);
filterOpening.addEventListener('change', applyFilters);

const filterStartDate = document.getElementById('filter-start-date');
const filterEndDate = document.getElementById('filter-end-date');
const btnResetFilters = document.getElementById('btn-reset-filters');

if (filterStartDate) filterStartDate.addEventListener('change', applyFilters);
if (filterEndDate) filterEndDate.addEventListener('change', applyFilters);

if (btnResetFilters) {
    btnResetFilters.addEventListener('click', () => {
        filterSearch.value = '';
        filterResult.value = '';
        filterColor.value = '';
        filterOpening.value = '';
        if (filterStartDate) filterStartDate.value = '';
        if (filterEndDate) filterEndDate.value = '';
        applyFilters();
        showToast('Filtreler sıfırlandı.');
    });
}

// --- 4. DETAY MODALI VE GÖRSEL TAHTA OYNATICI ---
window.viewMatchDetails = async (id) => {
    try {
        const response = await fetch(`${API_URL}/matches/${id}`);
        const m = await response.json();

        // Temel Bilgiler
        document.getElementById('modal-opponent').textContent = m.opponentName;
        document.getElementById('modal-date').textContent = new Date(m.date).toLocaleDateString('tr-TR');
        document.getElementById('modal-color').textContent = m.playedAs === 'Beyaz' ? '♔ Beyaz' : '♚ Siyah';
        
        const opening = openingsList.find(op => op.id === m.openingId);
        document.getElementById('modal-opening').textContent = opening ? `${opening.name} (${opening.type})` : 'Bilinmiyor / Yok';
        document.getElementById('modal-player-rating').textContent = m.playerRating || 'Girilmemiş';

        const resultBadge = document.getElementById('modal-result');
        resultBadge.textContent = m.result;
        resultBadge.className = 'result-badge';
        if (m.result === 'Galibiyet') resultBadge.classList.add('result-galibiyet');
        else if (m.result === 'Mağlubiyet') resultBadge.classList.add('result-maglubiyet');
        else resultBadge.classList.add('result-beraberlik');

        document.getElementById('modal-notes').textContent = m.notes || 'Maça dair herhangi bir analiz veya oyun notu girilmemiş.';
        document.getElementById('modal-pgn').textContent = m.pgn || 'Hamle kaydı bulunmuyor.';

        // Görsel Satranç Tahtası Yükleme İşlemleri
        const boardSide = document.querySelector('.modal-board-side');
        const bodyGrid = document.querySelector('.modal-body-grid');
        
        // PGN Alanı Boş Değilse Oynatıcıyı Kur
        if (m.pgn && m.pgn.trim() !== '') {
            // JS Satranç kütüphanesini sıfırla ve PGN yüklemeyi dene
            gameInstance = new Chess();
            const pgnLoaded = gameInstance.load_pgn(m.pgn);

            if (pgnLoaded) {
                // Görsel yapıyı iki sütuna geçir ve tahtayı göster
                boardSide.style.display = 'flex';
                bodyGrid.style.gridTemplateColumns = '1.2fr 0.8fr';
                
                gameHistory = gameInstance.history({ verbose: true });
                document.getElementById('total-moves-num').textContent = gameHistory.length;
                
                // Oyunu sıfırla, adım adım oynatmak için hazırla
                gameInstance.reset();
                currentMoveIndex = -1;
                
                // Mevcut board div içeriğini temizle
                $('#board').html('');
                
                // Tahtayı oluştur ve oyuncunun taşına göre yönlendir (Orientation)
                boardInstance = Chessboard('board', {
                    position: 'start',
                    showNotation: true,
                    orientation: m.playedAs === 'Siyah' ? 'black' : 'white',
                    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
                });

                // Tahta metnini sıfırla
                updateBoardAndText();
            } else {
                // Geçersiz PGN ise oynatıcıyı gizle
                hideVisualBoard(boardSide, bodyGrid);
            }
        } else {
            // PGN girilmediyse oynatıcıyı gizle
            hideVisualBoard(boardSide, bodyGrid);
        }

        document.getElementById('details-modal').classList.remove('hidden');
    } catch (error) {
        showToast('Maç detayı yüklenirken hata oluştu.', 'error');
        console.error(error);
    }
};

function hideVisualBoard(boardSide, bodyGrid) {
    boardSide.style.display = 'none';
    bodyGrid.style.gridTemplateColumns = '1fr';
    gameHistory = [];
    currentMoveIndex = -1;
}

function updateBoardAndText() {
    // Hamleleri currentMoveIndex indeksine kadar yeniden uygula
    gameInstance.reset();
    for (let i = 0; i <= currentMoveIndex; i++) {
        gameInstance.move(gameHistory[i].san);
    }

    // Tahta görüntüsünü güncelle
    if (boardInstance) {
        boardInstance.position(gameInstance.fen());
    }

    // Sayacı güncelle
    document.getElementById('current-move-num').textContent = currentMoveIndex + 1;

    // Alt metni güncelle
    const pgnTextDisplay = document.getElementById('pgn-move-text');
    if (currentMoveIndex === -1) {
        pgnTextDisplay.innerHTML = '<em>Oyun başlangıç konumunda. Başlamak için "İleri" butonunu kullanın.</em>';
    } else {
        const lastMove = gameHistory[currentMoveIndex];
        const moveNumber = Math.floor(currentMoveIndex / 2) + 1;
        const color = currentMoveIndex % 2 === 0 ? 'Beyaz' : 'Siyah';
        pgnTextDisplay.innerHTML = `
            <strong>Hamle ${moveNumber} (${color}):</strong> ${lastMove.san} 
            <br><span style="color:#94a3b8; font-size:0.75rem">${lastMove.from} ➔ ${lastMove.to}</span>
        `;
    }
}

// Oynatıcı Navigasyon Buton Olayları
function setupBoardControls() {
    document.getElementById('btn-board-start').addEventListener('click', () => {
        if (gameHistory.length === 0) return;
        currentMoveIndex = -1;
        updateBoardAndText();
    });

    document.getElementById('btn-board-prev').addEventListener('click', () => {
        if (gameHistory.length === 0 || currentMoveIndex < 0) return;
        currentMoveIndex--;
        updateBoardAndText();
    });

    document.getElementById('btn-board-next').addEventListener('click', () => {
        if (gameHistory.length === 0 || currentMoveIndex >= gameHistory.length - 1) return;
        currentMoveIndex++;
        updateBoardAndText();
    });

    document.getElementById('btn-board-end').addEventListener('click', () => {
        if (gameHistory.length === 0) return;
        currentMoveIndex = gameHistory.length - 1;
        updateBoardAndText();
    });
}

document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('details-modal').classList.add('hidden');
});

document.getElementById('details-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('details-modal')) {
        document.getElementById('details-modal').classList.add('hidden');
    }
});

// --- 5. DASHBOARD VE GRAFIKLER ---
async function loadDashboard() {
    try {
        const responseStats = await fetch(`${API_URL}/matches/stats`);
        const stats = await responseStats.json();

        const responseOpeningStats = await fetch(`${API_URL}/openings/stats`);
        const opStats = await responseOpeningStats.json();

        // 1. Üst İstatistik Kartlarının Doldurulması
        const overall = stats.overall || { total: 0, wins: 0, losses: 0, draws: 0 };
        document.getElementById('stat-total-matches').textContent = overall.total || 0;

        const winRate = overall.total > 0 ? ((overall.wins / overall.total) * 100).toFixed(1) : 0;
        document.getElementById('stat-win-rate').textContent = `%${winRate}`;

        // Beyaz Performansı (Beyaz Galibiyetler / Beyaz Toplam)
        const byColor = stats.byColor || [];
        const whiteTotal = byColor.filter(x => x.playedAs === 'Beyaz').reduce((sum, item) => sum + item.count, 0);
        const whiteWins = byColor.find(x => x.playedAs === 'Beyaz' && x.result === 'Galibiyet')?.count || 0;
        const whiteWinRate = whiteTotal > 0 ? ((whiteWins / whiteTotal) * 100).toFixed(1) : 0;
        document.getElementById('stat-white-performance').textContent = `%${whiteWinRate}`;

        // Siyah Performansı
        const blackTotal = byColor.filter(x => x.playedAs === 'Siyah').reduce((sum, item) => sum + item.count, 0);
        const blackWins = byColor.find(x => x.playedAs === 'Siyah' && x.result === 'Galibiyet')?.count || 0;
        const blackWinRate = blackTotal > 0 ? ((blackWins / blackTotal) * 100).toFixed(1) : 0;
        document.getElementById('stat-black-performance').textContent = `%${blackWinRate}`;

        // Profil kartını güncelle
        updateProfileUI(stats.ratings || []);

        // 2. Grafikleri Çiz (Yeni ELO grafiği dahil)
        renderCharts(stats);

        // 3. Açılış Analitiği Listelerini Render Et
        renderOpeningStatsLists(opStats);

    } catch (error) {
        console.error('Gösterge paneli yüklenirken hata:', error);
    }
}

function renderCharts(stats) {
    const overall = stats.overall || { total: 0, wins: 0, losses: 0, draws: 0 };
    const byColor = stats.byColor || [];
    const ratings = stats.ratings || [];

    // A. ELO Derecesi Gelişimi (Line Chart)
    const ctxRating = document.getElementById('ratingChart').getContext('2d');
    if (ratingChartInstance) ratingChartInstance.destroy();

    // Filtrelenmiş veya ELO girilmemiş durumlar için kontrol
    if (!ratings || ratings.length === 0) {
        ratingChartInstance = new Chart(ctxRating, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Grafik çizimi için henüz ELO derecesi girilmiş maç kaydı bulunmuyor.',
                        color: '#94a3b8',
                        font: { family: 'Outfit', size: 14 }
                    }
                }
            }
        });
    } else {
        const ratingLabels = ratings.map(r => new Date(r.date).toLocaleDateString('tr-TR'));
        const ratingData = ratings.map(r => r.playerRating);

        ratingChartInstance = new Chart(ctxRating, {
            type: 'line',
            data: {
                labels: ratingLabels,
                datasets: [{
                    label: 'Rating (ELO)',
                    data: ratingData,
                    fill: true,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: '#3b82f6',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 10 } }, grid: { display: false } },
                    y: { ticks: { color: '#94a3b8', font: { family: 'Outfit' } }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // B. Genel Sonuçlar (Doughnut)
    const ctxResults = document.getElementById('resultsChart').getContext('2d');
    if (resultsChartInstance) resultsChartInstance.destroy();
    
    resultsChartInstance = new Chart(ctxResults, {
        type: 'doughnut',
        data: {
            labels: ['Galibiyet', 'Beraberlik', 'Mağlubiyet'],
            datasets: [{
                data: [overall.wins || 0, overall.draws || 0, overall.losses || 0],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#f8fafc', font: { family: 'Outfit', size: 12 } }
                }
            }
        }
    });

    // C. Renklere Göre Karşılaştırma (Bar Chart)
    const whiteCounts = { Galibiyet: 0, Beraberlik: 0, Mağlubiyet: 0 };
    const blackCounts = { Galibiyet: 0, Beraberlik: 0, Mağlubiyet: 0 };

    byColor.forEach(item => {
        if (item.playedAs === 'Beyaz') whiteCounts[item.result] = item.count;
        if (item.playedAs === 'Siyah') blackCounts[item.result] = item.count;
    });

    const ctxColor = document.getElementById('colorChart').getContext('2d');
    if (colorChartInstance) colorChartInstance.destroy();

    colorChartInstance = new Chart(ctxColor, {
        type: 'bar',
        data: {
            labels: ['Galibiyet', 'Beraberlik', 'Mağlubiyet'],
            datasets: [
                {
                    label: 'Beyaz Taşlar',
                    data: [whiteCounts.Galibiyet, whiteCounts.Beraberlik, whiteCounts.Mağlubiyet],
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Siyah Taşlar',
                    data: [blackCounts.Galibiyet, blackCounts.Beraberlik, blackCounts.Mağlubiyet],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#94a3b8', font: { family: 'Outfit' } }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8', font: { family: 'Outfit' }, stepSize: 1 }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#f8fafc', font: { family: 'Outfit', size: 12 } }
                }
            }
        }
    });
}

function renderOpeningStatsLists(opStats) {
    const listMostPlayed = document.getElementById('most-played-openings');
    const listBestWinrate = document.getElementById('best-winrate-openings');

    if (opStats.length === 0) {
        listMostPlayed.innerHTML = '<li>Henüz istatistik üretecek maç yapılmadı.</li>';
        listBestWinrate.innerHTML = '<li>Henüz istatistik üretecek maç yapılmadı.</li>';
        return;
    }

    // En Sık Tercih Edilenler
    listMostPlayed.innerHTML = opStats.slice(0, 5).map(op => `
        <li>
            <span><strong>${op.name}</strong> (${op.type})</span>
            <span class="val">${op.totalMatches} Karşılaşma</span>
        </li>
    `).join('');

    // Galibiyet Oranı En Yüksek Rotalar
    const sortedByWinrate = [...opStats]
        .filter(op => op.wins > 0)
        .sort((a, b) => b.winRate - a.winRate);

    if (sortedByWinrate.length === 0) {
        listBestWinrate.innerHTML = '<li>Kayıtlı galibiyet içeren açılış bulunmuyor.</li>';
    } else {
        listBestWinrate.innerHTML = sortedByWinrate.slice(0, 5).map(op => `
            <li>
                <span><strong>${op.name}</strong> (${op.type})</span>
                <span class="val">%${op.winRate} Kazanma</span>
            </li>
        `).join('');
    }
}

// --- 6. IMPORT VE EXPORT İŞLEMLERİ ---

// A. JSON İndir (Dışa Aktar)
btnExportJson.addEventListener('click', () => {
    if (allMatchesList.length === 0) {
        showToast('Dışa aktarılacak maç verisi bulunmamaktadır.', 'error');
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allMatchesList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `chess_logger_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('JSON yedek dosyası başarıyla indirildi.');
});

// B. CSV İndir (Dışa Aktar)
btnExportCsv.addEventListener('click', () => {
    if (allMatchesList.length === 0) {
        showToast('Dışa aktarılacak maç verisi bulunmamaktadır.', 'error');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Tarih,Rakip Oyuncu,Renk,Oynanan Acilis,Kendi Rating (ELO),Mac Sonucu,Notlar,PGN\n";
    
    allMatchesList.forEach(m => {
        const date = new Date(m.date).toLocaleDateString('tr-TR');
        const opponent = `"${m.opponentName.replace(/"/g, '""')}"`;
        const color = m.playedAs;
        const opening = `"${(m.openingName || '').replace(/"/g, '""')}"`;
        const rating = m.playerRating || '';
        const result = m.result;
        const notes = `"${(m.notes || '').replace(/"/g, '""')}"`;
        const pgn = `"${(m.pgn || '').replace(/"/g, '""')}"`;
        
        csvContent += `${date},${opponent},${color},${opening},${rating},${result},${notes},${pgn}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `chess_logger_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('CSV veri raporu indirildi.');
});

// C. JSON İçe Aktar (Import)
btnImportTrigger.addEventListener('click', () => {
    importFileInput.click();
});

importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const matches = JSON.parse(event.target.result);
            if (!Array.isArray(matches)) {
                showToast('Hatalı dosya formatı. Maç verileri JSON dizisi olmalıdır.', 'error');
                return;
            }

            const cleanedMatches = matches.map(m => ({
                opponentName: m.opponentName,
                playedAs: m.playedAs,
                result: m.result,
                openingId: m.openingId,
                date: m.date,
                notes: m.notes,
                pgn: m.pgn,
                playerRating: m.playerRating
            }));

            const response = await fetch(`${API_URL}/matches/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanedMatches)
            });

            if (response.ok) {
                const resData = await response.json();
                showToast(resData.message || 'Maçlar içe aktarıldı!');
                loadMatches();
                loadDashboard();
            } else {
                showToast('Maçları içe aktarma başarısız oldu.', 'error');
            }
        } catch (err) {
            showToast('JSON dosyası okunamadı veya biçimlendirmesi hatalı.', 'error');
            console.error(err);
        }
    };
    reader.readAsText(file);
    importFileInput.value = '';
});

// --- Oyuncu Profili & ELO Hedefi Yönetimi ---
function updateProfileUI(ratings) {
    let name = localStorage.getItem('chess_profile_name') || 'Hüseyin Fidan';
    let targetElo = parseInt(localStorage.getItem('chess_target_elo')) || 1800;

    localStorage.setItem('chess_profile_name', name);
    localStorage.setItem('chess_target_elo', targetElo);

    let currentElo = 1500; // Varsayılan başlangıç
    if (ratings && ratings.length > 0) {
        currentElo = ratings[ratings.length - 1].playerRating || 1500;
    }

    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-current-elo').textContent = currentElo;
    document.getElementById('profile-target-elo').textContent = targetElo;

    const remaining = targetElo - currentElo;
    const remainingText = remaining <= 0 ? 'Hedefe Ulaşıldı! 🎉' : `${remaining} ELO`;
    document.getElementById('profile-remaining-elo').textContent = remainingText;

    let progressPercent = Math.round((currentElo / targetElo) * 100);
    progressPercent = Math.min(Math.max(progressPercent, 0), 100);

    document.getElementById('elo-progress-percent').textContent = `${progressPercent}%`;
    document.getElementById('elo-progress-bar-fill').style.width = `${progressPercent}%`;
}

// Profil modalı olayları
const profileModal = document.getElementById('profile-modal');
const btnEditProfile = document.getElementById('btn-edit-profile');
const btnCloseProfileModal = document.getElementById('btn-close-profile-modal');
const btnCancelProfile = document.getElementById('btn-cancel-profile');
const profileForm = document.getElementById('profile-form');
const editProfileName = document.getElementById('edit-profile-name');
const editTargetElo = document.getElementById('edit-target-elo');

if (btnEditProfile) {
    btnEditProfile.addEventListener('click', () => {
        editProfileName.value = localStorage.getItem('chess_profile_name') || 'Hüseyin Fidan';
        editTargetElo.value = localStorage.getItem('chess_target_elo') || 1800;
        profileModal.classList.remove('hidden');
    });
}

const closeProfileModalFunc = () => {
    profileModal.classList.add('hidden');
};

if (btnCloseProfileModal) btnCloseProfileModal.addEventListener('click', closeProfileModalFunc);
if (btnCancelProfile) btnCancelProfile.addEventListener('click', closeProfileModalFunc);

if (profileModal) {
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            closeProfileModalFunc();
        }
    });
}

if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.setItem('chess_profile_name', editProfileName.value.trim());
        localStorage.setItem('chess_target_elo', parseInt(editTargetElo.value) || 1800);
        closeProfileModalFunc();
        showToast('Profil bilgileri güncellendi!');
        loadDashboard();
    });
}

// --- PDF Raporu Çıkarma (Yazdırma) İşlemi ---
const btnPrintReport = document.getElementById('btn-print-report');
if (btnPrintReport) {
    btnPrintReport.addEventListener('click', () => {
        const originalTitle = document.title;
        const playerName = localStorage.getItem('chess_profile_name') || 'Hüseyin Fidan';
        
        // PDF kaydederken varsayılan dosya adı başlıkla aynı olur
        document.title = `Satranç Performans Raporu - ${playerName}`;
        
        // Yazdır/PDF kaydet penceresini aç
        window.print();
        
        // Sayfa başlığını geri yükle
        document.title = originalTitle;
    });
}
