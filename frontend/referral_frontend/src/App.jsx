import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3000');

function App() {
    const [userId, setUserId] = useState('');
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState('');
    const [transactionAmount, setTransactionAmount] = useState('');
    const [earnings, setEarnings] = useState(null);
    const [report, setReport] = useState(null);
    const [distribution, setDistribution] = useState(null);
    const [realTimeUpdate, setRealTimeUpdate] = useState(null);

    // Listen for real-time updates
    useEffect(() => {
        socket.on('earnings_update', (data) => {
            setRealTimeUpdate(data);
        });

        return () => {
            socket.off('earnings_update');
        };
    }, []);

    const registerUser = async () => {
        try {
            const response = await axios.post('http://localhost:3000/register', {
                name,
                parentId: parentId || null,
            });
            alert('User registered successfully! User ID: ' + response.data.userId);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to register user');
        }
    };

    const addTransaction = async () => {
        try {
            const response = await axios.post('http://localhost:3000/transaction', {
                userId,
                amount: parseFloat(transactionAmount),
            });
            alert(response.data.message);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to add transaction');
        }
    };

    const deleteUser = async () => {
        try {
            const response = await axios.delete(`http://localhost:3000/user/${userId}`);
            alert(response.data.message);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete user');
        }
    };

    const fetchEarnings = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/earnings/${userId}`);
            setEarnings(response.data);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to fetch earnings');
        }
    };

    const fetchReport = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/report/earnings/${userId}`);
            setReport(response.data);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to fetch report');
        }
    };

    const fetchDistribution = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/report/distribution/${userId}`);
            setDistribution(response.data);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to fetch distribution');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Referral System Dashboard</h1>

            {/* Register User */}
            <div style={{ marginBottom: '20px' }}>
                <h2>Register User</h2>
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ marginRight: '10px' }}
                />
                <input
                    type="text"
                    placeholder="Parent ID (optional)"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    style={{ marginRight: '10px' }}
                />
                <button onClick={registerUser}>Register</button>
            </div>

            {/* Add Transaction */}
            <div style={{ marginBottom: '20px' }}>
                <h2>Add Transaction</h2>
                <input
                    type="text"
                    placeholder="User ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    style={{ marginRight: '10px' }}
                />
                <input
                    type="number"
                    placeholder="Transaction Amount"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    style={{ marginRight: '10px' }}
                />
                <button onClick={addTransaction}>Add Transaction</button>
            </div>

            {/* Delete User */}
            <div style={{ marginBottom: '20px' }}>
                <h2>Delete User</h2>
                <input
                    type="text"
                    placeholder="User ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    style={{ marginRight: '10px' }}
                />
                <button onClick={deleteUser}>Delete User</button>
            </div>

            {/* Fetch Data */}
            <div style={{ marginBottom: '20px' }}>
                <h2>Fetch Data</h2>
                <input
                    type="text"
                    placeholder="User ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    style={{ marginRight: '10px' }}
                />
                <button onClick={fetchEarnings}>Fetch Earnings</button>
                <button onClick={fetchReport} style={{ marginLeft: '10px' }}>
                    Fetch Report
                </button>
                <button onClick={fetchDistribution} style={{ marginLeft: '10px' }}>
                    Fetch Distribution
                </button>
            </div>

            {/* Real-Time Updates */}
            {realTimeUpdate && (
                <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
                    <h3>Real-Time Update</h3>
                    <pre>{JSON.stringify(realTimeUpdate, null, 2)}</pre>
                </div>
            )}

            {/* Earnings */}
            {earnings && (
                <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
                    <h3>User Earnings</h3>
                    <pre>{JSON.stringify(earnings, null, 2)}</pre>
                </div>
            )}

            {/* Report */}
            {report && (
                <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
                    <h3>Earnings Report</h3>
                    <pre>{JSON.stringify(report, null, 2)}</pre>
                </div>
            )}

            {/* Distribution */}
            {distribution && (
                <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
                    <h3>Referral-Based Earnings Distribution</h3>
                    <pre>{JSON.stringify(distribution, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

export default App;
