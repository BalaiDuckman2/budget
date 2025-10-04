const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'budget-data.json');

// Déterminer le dossier à servir
const distPath = path.join(__dirname, 'dist');
const STATIC_DIR = fsSync.existsSync(distPath) ? distPath : __dirname;

console.log(`📁 Serving static files from: ${STATIC_DIR}`);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Servir les fichiers statiques avec les bons types MIME
app.use(express.static(STATIC_DIR, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
    }
}));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Créer le dossier data s'il n'existe pas
async function ensureDataDirectory() {
    try {
        await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
        console.log('✅ Dossier data créé/vérifié');
    } catch (error) {
        console.error('❌ Erreur création dossier data:', error);
    }
}

// Lire les données du fichier JSON
async function readData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si le fichier n'existe pas, retourner des données par défaut
        console.log('📝 Création fichier de données par défaut');
        const defaultData = {
            salary: 0,
            categories: {},
            transactions: [],
            recurringTransactions: [],
            savingsGoals: [],
            currentMonth: new Date().toISOString().slice(0, 7)
        };
        await writeData(defaultData);
        return defaultData;
    }
}

// Écrire les données dans le fichier JSON avec backup
async function writeData(data) {
    try {
        // Créer un backup avant d'écrire
        try {
            const backupFile = DATA_FILE + '.backup';
            const currentData = await fs.readFile(DATA_FILE, 'utf8');
            await fs.writeFile(backupFile, currentData);
        } catch (e) {
            // Pas de backup si le fichier n'existe pas encore
        }
        
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        console.log('💾 Données sauvegardées');
        return true;
    } catch (error) {
        console.error('❌ Erreur écriture données:', error);
        return false;
    }
}

// Routes API

// GET /api/data - Récupérer toutes les données
app.get('/api/data', async (req, res) => {
    try {
        const data = await readData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lecture données' });
    }
});

// POST /api/data - Sauvegarder toutes les données
app.post('/api/data', async (req, res) => {
    try {
        const success = await writeData(req.body);
        if (success) {
            res.json({ success: true, message: 'Données sauvegardées' });
        } else {
            res.status(500).json({ error: 'Erreur sauvegarde' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erreur sauvegarde données' });
    }
});

// POST /api/transactions - Ajouter une transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const data = await readData();
        const transaction = {
            id: Date.now().toString(),
            ...req.body,
            date: new Date().toISOString()
        };
        
        data.transactions.push(transaction);
        
        // Mettre à jour le montant dépensé de la catégorie
        if (data.categories[transaction.category]) {
            data.categories[transaction.category].spent += transaction.amount;
        }
        
        const success = await writeData(data);
        if (success) {
            res.json({ success: true, transaction });
        } else {
            res.status(500).json({ error: 'Erreur sauvegarde transaction' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erreur ajout transaction' });
    }
});

// PUT /api/transactions/:id - Modifier une transaction
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const data = await readData();
        const transactionId = req.params.id;
        const transactionIndex = data.transactions.findIndex(t => t.id === transactionId);
        
        if (transactionIndex === -1) {
            return res.status(404).json({ error: 'Transaction non trouvée' });
        }
        
        const oldTransaction = data.transactions[transactionIndex];
        const newTransaction = { ...oldTransaction, ...req.body };
        
        // Mettre à jour les montants des catégories
        if (data.categories[oldTransaction.category]) {
            data.categories[oldTransaction.category].spent -= oldTransaction.amount;
        }
        if (data.categories[newTransaction.category]) {
            data.categories[newTransaction.category].spent += newTransaction.amount;
        }
        
        data.transactions[transactionIndex] = newTransaction;
        
        const success = await writeData(data);
        if (success) {
            res.json({ success: true, transaction: newTransaction });
        } else {
            res.status(500).json({ error: 'Erreur modification transaction' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erreur modification transaction' });
    }
});

// DELETE /api/transactions/:id - Supprimer une transaction
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const data = await readData();
        const transactionId = req.params.id;
        const transactionIndex = data.transactions.findIndex(t => t.id === transactionId);
        
        if (transactionIndex === -1) {
            return res.status(404).json({ error: 'Transaction non trouvée' });
        }
        
        const transaction = data.transactions[transactionIndex];
        
        // Retirer le montant de la catégorie
        if (data.categories[transaction.category]) {
            data.categories[transaction.category].spent -= transaction.amount;
        }
        
        data.transactions.splice(transactionIndex, 1);
        
        const success = await writeData(data);
        if (success) {
            res.json({ success: true, message: 'Transaction supprimée' });
        } else {
            res.status(500).json({ error: 'Erreur suppression transaction' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erreur suppression transaction' });
    }
});

// Route pour servir l'application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Démarrage du serveur
async function startServer() {
    await ensureDataDirectory();
    app.listen(PORT, () => {
        console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
        console.log(`📁 Données stockées dans: ${DATA_FILE}`);
    });
}

startServer();
