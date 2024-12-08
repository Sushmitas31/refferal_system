const express = require('express');
const cors = require('cors'); // Import CORS
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Initialize socket.io with CORS settings
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Allow requests from your React frontend
        methods: ["GET", "POST"],
    },
});

// Use CORS middleware to enable cross-origin requests
app.use(cors());
app.use(bodyParser.json());

// Database setup
const sequelize = new Sequelize('referral_system', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    storage: 'referral_system.sqlite',
});

// Models
const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    parentId: { type: DataTypes.INTEGER, allowNull: true },
    level: { type: DataTypes.INTEGER, defaultValue: 1 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const Transaction = sequelize.define('Transaction', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    parentId: { type: DataTypes.INTEGER, allowNull: true },
    profitPercentage: { type: DataTypes.FLOAT, allowNull: false },
    profitEarned: { type: DataTypes.FLOAT, allowNull: false },
});

const Earnings = sequelize.define('Earnings', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    totalDirectEarnings: { type: DataTypes.FLOAT, defaultValue: 0 },
    totalIndirectEarnings: { type: DataTypes.FLOAT, defaultValue: 0 },
});

// Helper Functions
const calculateProfit = (transactionAmount, level) => {
    if (transactionAmount <= 1000) return 0;
    return transactionAmount * (level === 1 ? 0.05 : 0.01);
};

const updateEarnings = async (userId, profit, level) => {
    const earnings = await Earnings.findOne({ where: { userId } });
    if (!earnings) {
        await Earnings.create({
            userId,
            totalDirectEarnings: level === 1 ? profit : 0,
            totalIndirectEarnings: level === 2 ? profit : 0,
        });
    } else {
        if (level === 1) {
            earnings.totalDirectEarnings += profit;
        } else if (level === 2) {
            earnings.totalIndirectEarnings += profit;
        }
        await earnings.save();
    }

    io.emit('earnings_update', {
        userId,
        totalDirectEarnings: earnings?.totalDirectEarnings,
        totalIndirectEarnings: earnings?.totalIndirectEarnings,
    });
};

// API Endpoints
app.post('/register', async (req, res) => {
    const { name, parentId } = req.body;
    let level = 1;

    if (parentId) {
        const parent = await User.findByPk(parentId);
        if (!parent) return res.status(404).json({ error: 'Parent user not found' });

        const referrals = await User.count({ where: { parentId } });
        if (referrals >= 8) return res.status(400).json({ error: 'Referral limit exceeded' });

        level = parent.level + 1;
    }

    const user = await User.create({ name, parentId, level });
    res.json({ message: 'User registered successfully', userId: user.id });
});

// Delete User Endpoint
app.delete('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Find the user by ID
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete associated transactions and earnings first (cascade effect)
        await Transaction.destroy({ where: { userId } });
        await Earnings.destroy({ where: { userId } });

        // Delete the user
        await User.destroy({ where: { id: userId } });

        res.json({ message: `User with ID ${userId} deleted successfully` });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'An error occurred while deleting the user' });
    }
});


app.post('/transaction', async (req, res) => {
    const { userId, amount } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const parentId = user.parentId;
    if (parentId) {
        const directProfit = calculateProfit(amount, 1);
        if (directProfit > 0) {
            await Transaction.create({
                userId,
                amount,
                parentId,
                profitPercentage: 5,
                profitEarned: directProfit,
            });
            await updateEarnings(parentId, directProfit, 1);
        }

        const grandParent = await User.findByPk(parentId);
        if (grandParent?.parentId) {
            const indirectProfit = calculateProfit(amount, 2);
            if (indirectProfit > 0) {
                await Transaction.create({
                    userId,
                    amount,
                    parentId: grandParent.parentId,
                    profitPercentage: 1,
                    profitEarned: indirectProfit,
                });
                await updateEarnings(grandParent.parentId, indirectProfit, 2);
            }
        }
    }

    res.json({ message: 'Transaction recorded successfully' });
});

app.get('/earnings/:userId', async (req, res) => {
    const { userId } = req.params;
    const earnings = await Earnings.findOne({ where: { userId } });
    if (!earnings) return res.status(404).json({ error: 'No earnings found for user' });
    res.json(earnings);
});

// Reports and Analytics Endpoints
app.get('/report/earnings/:userId', async (req, res) => {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const earnings = await Earnings.findOne({ where: { userId } });
    const directReferrals = await User.findAll({ where: { parentId: userId } });

    const report = {
        userId,
        name: user.name,
        totalDirectEarnings: earnings?.totalDirectEarnings || 0,
        totalIndirectEarnings: earnings?.totalIndirectEarnings || 0,
        directReferrals: directReferrals.map(ref => ({ id: ref.id, name: ref.name })),
    };

    res.json(report);
});

app.get('/report/distribution/:userId', async (req, res) => {
    const { userId } = req.params;
    const transactions = await Transaction.findAll({ where: { parentId: userId } });

    const distribution = transactions.reduce((acc, transaction) => {
        acc.totalEarnings += transaction.profitEarned;
        acc.sources.push({
            userId: transaction.userId,
            amount: transaction.amount,
            profitEarned: transaction.profitEarned,
        });
        return acc;
    }, { totalEarnings: 0, sources: [] });

    res.json(distribution);
});

// Initialize and start server
sequelize.sync().then(() => {
    server.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
});
